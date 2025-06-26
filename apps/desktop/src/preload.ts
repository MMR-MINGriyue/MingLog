import { contextBridge } from 'electron';

// Expose a simple API for the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron
});
