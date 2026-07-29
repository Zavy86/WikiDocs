import type { ActionsContract, SnapshotContract } from '../../shared/contracts';

export type SyncState = {
  client:SnapshotContract;
  server:SnapshotContract;
};

export type SyncPlan = {
  clientActions:ActionsContract;
  serverActions:ActionsContract;
  hasChanges:boolean;
};

function normalizePath(rawPath:string):string {
  const clean:string = rawPath.replace(/\\/g, '/').trim();
  if ( ! clean ) { return '/'; }
  const formatted:string = clean.startsWith('/') ? clean : `/${ clean }`;
  return formatted.length > 1 && formatted.endsWith('/') ? formatted.slice(0, -1) : formatted;
}

export function planSync(
  previousState:SyncState | null,
  currentClient:SnapshotContract,
  currentServer:SnapshotContract,
):SyncPlan {
  const clientActions:ActionsContract = { retrieve: [], delete: [] };
  const serverActions:ActionsContract = { retrieve: [], delete: [] };

  const currentClientMap:Map<string, number> = new Map<string, number>();
  for ( const doc of currentClient.documents ) {
    currentClientMap.set(normalizePath(doc.path), doc.time);
  }

  const currentServerMap:Map<string, number> = new Map<string, number>();
  for ( const doc of currentServer.documents ) {
    currentServerMap.set(normalizePath(doc.path), doc.time);
  }

  const isFirstSync:boolean = (
    ! previousState ||
    ! previousState.client ||
    ! previousState.server ||
    ! Array.isArray(previousState.client.documents) ||
    ! Array.isArray(previousState.server.documents)
  );

  if ( isFirstSync ) {
    const allPaths:Set<string> = new Set<string>([
      ...currentClientMap.keys(),
      ...currentServerMap.keys(),
    ]);

    for ( const path of allPaths ) {
      const clientTime:number | undefined = currentClientMap.get(path);
      const serverTime:number | undefined = currentServerMap.get(path);

      if ( clientTime !== undefined && serverTime === undefined ) {
        clientActions.retrieve.push(path);
      } else if ( serverTime !== undefined && clientTime === undefined ) {
        serverActions.retrieve.push(path);
      } else if ( clientTime !== undefined && serverTime !== undefined ) {
        if ( clientTime > serverTime ) {
          clientActions.retrieve.push(path);
        } else if ( serverTime > clientTime ) {
          serverActions.retrieve.push(path);
        }
      }
    }
  } else {
    const prevClientMap:Map<string, number> = new Map<string, number>();
    for ( const doc of previousState.client.documents ) {
      prevClientMap.set(normalizePath(doc.path), doc.time);
    }

    const prevServerMap:Map<string, number> = new Map<string, number>();
    for ( const doc of previousState.server.documents ) {
      prevServerMap.set(normalizePath(doc.path), doc.time);
    }

    const allPaths:Set<string> = new Set<string>([
      ...prevClientMap.keys(),
      ...prevServerMap.keys(),
      ...currentClientMap.keys(),
      ...currentServerMap.keys(),
    ]);

    for ( const path of allPaths ) {
      const prevClientTime:number | undefined = prevClientMap.get(path);
      const prevServerTime:number | undefined = prevServerMap.get(path);
      const currClientTime:number | undefined = currentClientMap.get(path);
      const currServerTime:number | undefined = currentServerMap.get(path);

      const deletedOnClient:boolean = prevClientTime !== undefined && currClientTime === undefined;
      const deletedOnServer:boolean = prevServerTime !== undefined && currServerTime === undefined;

      if ( deletedOnClient && deletedOnServer ) {
        continue;
      }

      if ( deletedOnClient && ! deletedOnServer ) {
        if ( currServerTime !== undefined && prevServerTime !== undefined && currServerTime > prevServerTime ) {
          serverActions.retrieve.push(path);
        } else {
          serverActions.delete.push(path);
        }
        continue;
      }

      if ( deletedOnServer && ! deletedOnClient ) {
        if ( currClientTime !== undefined && prevClientTime !== undefined && currClientTime > prevClientTime ) {
          clientActions.retrieve.push(path);
        } else {
          clientActions.delete.push(path);
        }
        continue;
      }

      if ( currClientTime !== undefined && currServerTime === undefined ) {
        clientActions.retrieve.push(path);
        continue;
      }

      if ( currServerTime !== undefined && currClientTime === undefined ) {
        serverActions.retrieve.push(path);
        continue;
      }

      if ( currClientTime !== undefined && currServerTime !== undefined ) {
        if ( currClientTime > currServerTime ) {
          clientActions.retrieve.push(path);
        } else if ( currServerTime > currClientTime ) {
          serverActions.retrieve.push(path);
        }
      }
    }
  }

  clientActions.retrieve.sort();
  clientActions.delete.sort();
  serverActions.retrieve.sort();
  serverActions.delete.sort();

  const hasChanges:boolean = (
    clientActions.retrieve.length > 0 ||
    clientActions.delete.length > 0 ||
    serverActions.retrieve.length > 0 ||
    serverActions.delete.length > 0
  );

  return {
    clientActions,
    serverActions,
    hasChanges,
  };
}
