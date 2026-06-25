const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('vault', {
  load: () => ipcRenderer.invoke('vault:load'),
  pick: () => ipcRenderer.invoke('vault:pick'),
  pull: () => ipcRenderer.invoke('vault:pull'),
  status: () => ipcRenderer.invoke('vault:status'),
  openExternal: (url) => ipcRenderer.send('open:external', url),
  onChanged: (cb) => ipcRenderer.on('vault:changed', cb),
  onPull: (cb) => ipcRenderer.on('vault:pull', (_e, d) => cb(d)),
});
