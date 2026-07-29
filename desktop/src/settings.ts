import './settings.css';
import type { DesktopSettingsApi } from './settings.preload';
import type { RemoteServerConfig, SyncStatusState } from './sync-orchestrator';

type RuntimeConfig = {
  readonly datasetsPath:string;
  readonly secret:string;
};

type SaveRuntimeConfigResult = {
  readonly status:'relaunching' | 'cancelled';
};

declare global {
  interface Window {
    readonly desktopSettings:DesktopSettingsApi;
  }
}

function ensureElement<T>(element:T | null, elementName:string):T {
  if ( element === null ) {
    throw new Error(`Element not found: ${ elementName }`);
  }
  return element;
}

const datasetsPathField = ensureElement(document.querySelector<HTMLInputElement>('#datasetsPath'), '#datasetsPath');
const secretField = ensureElement(document.querySelector<HTMLInputElement>('#secret'), '#secret');
const datasetsBrowseButton = ensureElement(document.querySelector<HTMLButtonElement>('#browseDatasets'), '#browseDatasets');
const saveAndRelaunchButton = ensureElement(document.querySelector<HTMLButtonElement>('#saveAndRelaunch'), '#saveAndRelaunch');

const serverUrlField = ensureElement(document.querySelector<HTMLInputElement>('#serverUrl'), '#serverUrl');
const serverAccountField = ensureElement(document.querySelector<HTMLInputElement>('#serverAccount'), '#serverAccount');
const serverPasswordField = ensureElement(document.querySelector<HTMLInputElement>('#serverPassword'), '#serverPassword');
const autoSyncEnabledCheckbox = ensureElement(document.querySelector<HTMLInputElement>('#autoSyncEnabled'), '#autoSyncEnabled');
const autoSyncIntervalMinutesField = ensureElement(document.querySelector<HTMLInputElement>('#autoSyncIntervalMinutes'), '#autoSyncIntervalMinutes');

const saveSyncConfigButton = ensureElement(document.querySelector<HTMLButtonElement>('#saveSyncConfig'), '#saveSyncConfig');
const syncNowButton = ensureElement(document.querySelector<HTMLButtonElement>('#syncNow'), '#syncNow');

const syncStatusBadge = ensureElement(document.querySelector<HTMLSpanElement>('#syncStatus'), '#syncStatus');
const syncMessageText = ensureElement(document.querySelector<HTMLParagraphElement>('#syncMessage'), '#syncMessage');
const lastSyncTimeText = ensureElement(document.querySelector<HTMLElement>('#lastSyncTime'), '#lastSyncTime');

const statusMessage = ensureElement(document.querySelector<HTMLParagraphElement>('#status'), '#status');

function showStatus(message:string, type:'error' | 'success' | 'info'):void {
  statusMessage.textContent = message;
  statusMessage.dataset.status = type;
}

function renderSyncStatus(state:SyncStatusState):void {
  syncStatusBadge.textContent = state.status.toUpperCase();
  syncMessageText.textContent = state.message;
  lastSyncTimeText.textContent = state.lastSyncTime ? `Last sync: ${ new Date(state.lastSyncTime).toLocaleString() }` : '';

  if ( state.status === 'syncing' ) {
    syncNowButton.disabled = true;
  } else {
    syncNowButton.disabled = false;
  }
}

function validateRuntimeConfig():RuntimeConfig {
  const datasetsPath = datasetsPathField.value.trim();
  const secret = secretField.value;

  if ( datasetsPath.length === 0 ) {
    throw new Error('DATASETS directory cannot be empty');
  }
  if ( secret.trim().length < 32 ) {
    throw new Error('Secret must be at least 32 characters');
  }

  return { datasetsPath, secret };
}

function validateSyncConfig():RemoteServerConfig {
  const serverUrl = serverUrlField.value.trim();
  const serverAccount = serverAccountField.value.trim();
  const serverPassword = serverPasswordField.value;
  const autoSyncEnabled = autoSyncEnabledCheckbox.checked;
  const autoSyncIntervalMinutes = parseInt(autoSyncIntervalMinutesField.value, 10) || 15;

  if ( autoSyncEnabled && ! serverUrl ) {
    throw new Error('Remote Server URL is required when auto-sync is enabled');
  }
  if ( autoSyncEnabled && ! serverAccount ) {
    throw new Error('Remote Account username is required when auto-sync is enabled');
  }

  return {
    serverUrl,
    serverAccount,
    serverPassword,
    autoSyncEnabled,
    autoSyncIntervalMinutes: Math.max(1, autoSyncIntervalMinutes),
  };
}

async function initialize():Promise<void> {
  const config = await window.desktopSettings.loadRuntimeConfig();
  datasetsPathField.value = config.datasetsPath;
  secretField.value = config.secret;

  const syncConfig = await window.desktopSettings.loadSyncConfig();
  serverUrlField.value = syncConfig.serverUrl || '';
  serverAccountField.value = syncConfig.serverAccount || '';
  serverPasswordField.value = syncConfig.serverPassword || '';
  autoSyncEnabledCheckbox.checked = Boolean(syncConfig.autoSyncEnabled);
  autoSyncIntervalMinutesField.value = ( syncConfig.autoSyncIntervalMinutes || 15 ).toString();

  const currentStatus = await window.desktopSettings.getSyncStatus();
  renderSyncStatus(currentStatus);

  window.desktopSettings.onSyncStatusChange((state:SyncStatusState) => {
    renderSyncStatus(state);
  });

  showStatus('Update values and choose Save.', 'info');
}

datasetsBrowseButton.addEventListener('click', async () => {
  try {
    const selected:string | null = await window.desktopSettings.browseDatasetsPath();
    if ( selected ) {
      datasetsPathField.value = selected;
    }
  } catch ( error ) {
    showStatus(error instanceof Error ? error.message : String(error), 'error');
  }
});

saveAndRelaunchButton.addEventListener('click', async () => {
  try {
    const payload:RuntimeConfig = validateRuntimeConfig();
    saveAndRelaunchButton.disabled = true;
    const result:SaveRuntimeConfigResult = await window.desktopSettings.saveRuntimeConfig(payload);
    if ( result.status === 'cancelled' ) {
      saveAndRelaunchButton.disabled = false;
      showStatus('Save cancelled.', 'info');
      return;
    }
    showStatus('Relaunching application...', 'success');
  } catch ( error ) {
    saveAndRelaunchButton.disabled = false;
    showStatus(error instanceof Error ? error.message : String(error), 'error');
  }
});

saveSyncConfigButton.addEventListener('click', async () => {
  try {
    const payload:RemoteServerConfig = validateSyncConfig();
    saveSyncConfigButton.disabled = true;
    await window.desktopSettings.saveSyncConfig(payload);
    saveSyncConfigButton.disabled = false;
    showStatus('Sync settings saved successfully.', 'success');
  } catch ( error ) {
    saveSyncConfigButton.disabled = false;
    showStatus(error instanceof Error ? error.message : String(error), 'error');
  }
});

syncNowButton.addEventListener('click', async () => {
  try {
    syncNowButton.disabled = true;
    showStatus('Starting sync...', 'info');
    await window.desktopSettings.triggerSyncNow();
    showStatus('Sync triggered.', 'success');
  } catch ( error ) {
    syncNowButton.disabled = false;
    showStatus(error instanceof Error ? error.message : String(error), 'error');
  }
});

void initialize().catch((error:unknown) => {
  showStatus(error instanceof Error ? error.message : String(error), 'error');
});
