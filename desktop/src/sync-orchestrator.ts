import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SnapshotContract } from '../../shared/contracts';
import { SyncApiClient } from './sync-api-client';
import { planSync, type SyncPlan, type SyncState } from './sync-planner';

export type RemoteServerConfig = {
  readonly serverUrl:string;
  readonly serverAccount:string;
  readonly serverPassword:string;
  readonly autoSyncEnabled:boolean;
  readonly autoSyncIntervalMinutes:number;
};

export type SyncStatusState = {
  readonly status:'idle' | 'syncing' | 'success' | 'error';
  readonly message:string;
  readonly lastSyncTime:string | null;
  readonly error:string | null;
};

export type SyncStatusCallback = (state:SyncStatusState) => void;

export class SyncOrchestrator {

  private readonly localBaseUrl:string;

  private isSyncing = false;

  private autoSyncTimer:NodeJS.Timeout | null = null;

  private statusState:SyncStatusState = {
    status: 'idle',
    message: 'Ready',
    lastSyncTime: null,
    error: null,
  };

  private statusCallbacks:Set<SyncStatusCallback> = new Set<SyncStatusCallback>();

  constructor(localBaseUrl = 'http://127.0.0.1:3210') {
    this.localBaseUrl = localBaseUrl;
  }

  public getStatus():SyncStatusState {
    return this.statusState;
  }

  public onStatusChange(callback:SyncStatusCallback):() => void {
    this.statusCallbacks.add(callback);
    callback(this.statusState);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private updateStatus(partial:Partial<SyncStatusState>):void {
    this.statusState = {
      ...this.statusState,
      ...partial,
    };
    for ( const callback of this.statusCallbacks ) {
      try {
        callback(this.statusState);
      } catch ( error ) {
        process.stderr.write(`Error in status callback: ${ String(error) }\n`);
      }
    }
  }

  private getSyncStatePath(datasetsPath:string):string {
    return join(datasetsPath, 'sync.json');
  }

  private async readPreviousState(datasetsPath:string):Promise<SyncState | null> {
    const filePath:string = this.getSyncStatePath(datasetsPath);
    try {
      const content:string = await readFile(filePath, 'utf8');
      const parsed:unknown = JSON.parse(content);
      if ( typeof parsed !== 'object' || parsed === null ) { return null; }
      const candidate:Record<string, unknown> = parsed as Record<string, unknown>;
      if ( ! candidate.client || ! candidate.server ) { return null; }
      return candidate as SyncState;
    } catch {
      return null;
    }
  }

  private async writeStateAtomically(datasetsPath:string, state:SyncState):Promise<void> {
    const finalPath:string = this.getSyncStatePath(datasetsPath);
    const tmpPath = `${ finalPath }.tmp`;
    const content:string = JSON.stringify(state, null, 2);
    await writeFile(tmpPath, content, 'utf8');
    await rename(tmpPath, finalPath).catch(async (error:unknown) => {
      await rm(tmpPath, { force: true }).catch(() => undefined);
      throw error;
    });
  }

  public async runSync(datasetsPath:string, remoteConfig:RemoteServerConfig):Promise<{ hasChanges:boolean }> {
    if ( this.isSyncing ) {
      throw new Error('Synchronization is already in progress');
    }
    if ( ! remoteConfig.serverUrl.trim() ) {
      throw new Error('Remote Server URL is not configured');
    }
    if ( ! remoteConfig.serverAccount.trim() ) {
      throw new Error('Remote Server account is not configured');
    }

    this.isSyncing = true;
    this.updateStatus({
      status: 'syncing',
      message: 'Connecting to Client and Server...',
      error: null,
    });

    try {
      const clientApi:SyncApiClient = new SyncApiClient(this.localBaseUrl);
      const serverApi:SyncApiClient = new SyncApiClient(remoteConfig.serverUrl);

      const clientToken:string = await clientApi.getLocalToken();
      const serverToken:string = await serverApi.authenticateRemote({
        account: remoteConfig.serverAccount,
        password: remoteConfig.serverPassword,
      });

      this.updateStatus({
        status: 'syncing',
        message: 'Fetching document snapshot state...',
      });

      const currentClientSnapshot:SnapshotContract = await clientApi.getSnapshot(clientToken);
      const currentServerSnapshot:SnapshotContract = await serverApi.getSnapshot(serverToken);

      const previousState:SyncState | null = await this.readPreviousState(datasetsPath);

      const plan:SyncPlan = planSync(previousState, currentClientSnapshot, currentServerSnapshot);

      if ( ! plan.hasChanges ) {
        const syncState:SyncState = {
          client: currentClientSnapshot,
          server: currentServerSnapshot,
        };
        await this.writeStateAtomically(datasetsPath, syncState);
        const now:string = new Date().toISOString();
        this.updateStatus({
          status: 'success',
          message: 'Synchronization up to date. No changes detected.',
          lastSyncTime: now,
          error: null,
        });
        return { hasChanges: false };
      }

      this.updateStatus({
        status: 'syncing',
        message: `Executing sync actions (Client retrieve: ${ plan.clientActions.retrieve.length }, Server retrieve: ${ plan.serverActions.retrieve.length })...`,
      });

      let clientZip:Buffer | null = null;
      let serverZip:Buffer | null = null;

      if ( plan.clientActions.retrieve.length > 0 || plan.clientActions.delete.length > 0 ) {
        clientZip = await clientApi.postActions(clientToken, plan.clientActions);
      }

      if ( plan.serverActions.retrieve.length > 0 || plan.serverActions.delete.length > 0 ) {
        serverZip = await serverApi.postActions(serverToken, plan.serverActions);
      }

      this.updateStatus({
        status: 'syncing',
        message: 'Applying changes between environments...',
      });

      if ( serverZip && serverZip.length > 0 ) {
        await clientApi.putImport(clientToken, serverZip);
      }

      if ( clientZip && clientZip.length > 0 ) {
        await serverApi.putImport(serverToken, clientZip);
      }

      this.updateStatus({
        status: 'syncing',
        message: 'Finalizing snapshot state...',
      });

      const finalClientSnapshot:SnapshotContract = await clientApi.getSnapshot(clientToken);
      const finalServerSnapshot:SnapshotContract = await serverApi.getSnapshot(serverToken);

      const finalState:SyncState = {
        client: finalClientSnapshot,
        server: finalServerSnapshot,
      };

      await this.writeStateAtomically(datasetsPath, finalState);

      const completedTime:string = new Date().toISOString();
      this.updateStatus({
        status: 'success',
        message: 'Synchronization completed successfully.',
        lastSyncTime: completedTime,
        error: null,
      });

      return { hasChanges: true };

    } catch ( error ) {
      const errorMessage:string = error instanceof Error ? error.message : String(error);
      this.updateStatus({
        status: 'error',
        message: `Synchronization failed: ${ errorMessage }`,
        error: errorMessage,
      });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private onSyncCompletedWithChanges:(() => void) | null = null;

  public setOnSyncCompletedWithChanges(callback:(() => void) | null):void {
    this.onSyncCompletedWithChanges = callback;
  }

  public configureAutoSync(
    getDatasetsPath:() => string | null,
    getRemoteConfig:() => RemoteServerConfig | null,
  ):void {
    if ( this.autoSyncTimer ) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }

    const config:RemoteServerConfig | null = getRemoteConfig();
    if ( ! config || ! config.autoSyncEnabled || config.autoSyncIntervalMinutes <= 0 ) {
      return;
    }

    const intervalMs:number = Math.max(1, config.autoSyncIntervalMinutes) * 60 * 1000;

    this.autoSyncTimer = setInterval(():void => {
      const datasetsPath:string | null = getDatasetsPath();
      const currentConfig:RemoteServerConfig | null = getRemoteConfig();
      if ( datasetsPath && currentConfig && ! this.isSyncing ) {
        this.runSync(datasetsPath, currentConfig).then((result):void => {
          if ( result.hasChanges && this.onSyncCompletedWithChanges ) {
            this.onSyncCompletedWithChanges();
          }
        }).catch((error:unknown):void => {
          process.stderr.write(`Auto sync error: ${ String(error) }\n`);
        });
      }
    }, intervalMs);
  }

  public stopAutoSync():void {
    if ( this.autoSyncTimer ) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

}
