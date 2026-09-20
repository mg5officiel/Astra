const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gdrive', {
	isConfigured: () => ipcRenderer.invoke('gdrive:is-configured'),
	getTargetEmail: () => ipcRenderer.invoke('gdrive:target-email'),
	uploadBackup: (filename, jsonContent) => ipcRenderer.invoke('gdrive:upload-backup', filename, jsonContent),
	disconnect: () => ipcRenderer.invoke('gdrive:disconnect'),
});
