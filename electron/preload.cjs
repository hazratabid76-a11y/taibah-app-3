const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadDatabase: () => ipcRenderer.invoke('db-load'),
  saveDatabase: (data) => ipcRenderer.invoke('db-save', data),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  saveBinaryFile: (filePath, data) => ipcRenderer.invoke('save-binary-file', filePath, data),
  platform: process.platform,
});
