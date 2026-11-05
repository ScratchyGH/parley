const{contextBridge,ipcRenderer}=require('electron')
contextBridge.exposeInMainWorld('parleyDesktop',{flags:()=>ipcRenderer.invoke('flags-get'),setFlags:f=>ipcRenderer.invoke('flags-set',f),restart:()=>ipcRenderer.invoke('flags-restart')})
