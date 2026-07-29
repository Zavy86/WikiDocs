import { contextBridge, ipcRenderer } from 'electron';
import type { RemoteServerConfig, SyncStatusState } from './sync-orchestrator';

type RuntimeConfig = {
  readonly datasetsPath:string;
  readonly secret:string;
};

type SaveRuntimeConfigResult = {
  readonly status:'relaunching' | 'cancelled';
};

export type DesktopSettingsApi = {
  readonly loadRuntimeConfig:() => Promise<RuntimeConfig>;
  readonly browseDatasetsPath:() => Promise<string | null>;
  readonly saveRuntimeConfig:(payload:RuntimeConfig) => Promise<SaveRuntimeConfigResult>;
  readonly loadSyncConfig:() => Promise<RemoteServerConfig>;
  readonly saveSyncConfig:(payload:RemoteServerConfig) => Promise<void>;
  readonly triggerSyncNow:() => Promise<void>;
  readonly getSyncStatus:() => Promise<SyncStatusState>;
  readonly onSyncStatusChange:(callback:(state:SyncStatusState) => void) => () => void;
};

const settingsApi:DesktopSettingsApi = {
  loadRuntimeConfig: async () => ipcRenderer.invoke('settings:get-runtime-config'),
  browseDatasetsPath: async () => ipcRenderer.invoke('settings:browse-datasets-path'),
  saveRuntimeConfig: async (payload:RuntimeConfig) => ipcRenderer.invoke('settings:save-runtime-config', payload),
  loadSyncConfig: async () => ipcRenderer.invoke('sync:get-config'),
  saveSyncConfig: async (payload:RemoteServerConfig) => ipcRenderer.invoke('sync:save-config', payload),
  triggerSyncNow: async () => ipcRenderer.invoke('sync:start'),
  getSyncStatus: async () => ipcRenderer.invoke('sync:get-status'),
  onSyncStatusChange: (callback:(state:SyncStatusState) => void) => {
    const listener = (_event:unknown, state:SyncStatusState):void => callback(state);
    ipcRenderer.on('sync:status-changed', listener);
    return () => {
      ipcRenderer.removeListener('sync:status-changed', listener);
    };
  },
};

contextBridge.exposeInMainWorld('desktopSettings', settingsApi);
