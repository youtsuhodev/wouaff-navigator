const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('navigatorAPI', {
  createTab: () => ipcRenderer.invoke('create-tab'),
  removeTab: (tabId) => ipcRenderer.invoke('remove-tab', tabId),
  updateTabInfo: (data) => ipcRenderer.invoke('update-tab-info', data),
  getTabs: () => ipcRenderer.invoke('get-tabs'),
  saveDialog: (defaultName) => ipcRenderer.invoke('save-dialog', defaultName),

  onNewTab: (callback) => ipcRenderer.on('new-tab', callback),
  onCloseTab: (callback) => ipcRenderer.on('close-tab', callback),
  onReloadTab: (callback) => ipcRenderer.on('reload-tab', callback),
  onHardReloadTab: (callback) => ipcRenderer.on('hard-reload-tab', callback),
  onToggleDevtools: (callback) => ipcRenderer.on('toggle-devtools', callback),
  onGoBack: (callback) => ipcRenderer.on('go-back', callback),
  onGoForward: (callback) => ipcRenderer.on('go-forward', callback),
  onZoomIn: (callback) => ipcRenderer.on('zoom-in', callback),
  onZoomOut: (callback) => ipcRenderer.on('zoom-out', callback),
  onZoomReset: (callback) => ipcRenderer.on('zoom-reset', callback),
});
