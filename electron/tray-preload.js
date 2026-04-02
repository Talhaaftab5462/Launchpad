const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronTrayAPI', {
  navigate:     (page) => ipcRenderer.send('tray-popup-navigate', page),
  showLauncher: ()     => ipcRenderer.send('tray-popup-show'),
  exit:         ()     => ipcRenderer.send('tray-popup-exit'),
  close:        ()     => ipcRenderer.send('tray-popup-close'),
})
