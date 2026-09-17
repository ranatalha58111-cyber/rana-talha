const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  launchApp: (appName) => ipcRenderer.invoke('launch-desktop-app', appName),
  openUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  scrollScreen: (direction, amount) => ipcRenderer.invoke('scroll-screen', { direction, amount }),
  controlMedia: (action, service) => ipcRenderer.invoke('control-media', { action, service }),
  getAllowedApps: () => ipcRenderer.invoke('get-allowed-apps'),
  executeCommand: (cmd) => ipcRenderer.invoke('execute-system-command', cmd),
});

