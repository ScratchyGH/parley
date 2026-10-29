const{contextBridge,ipcRenderer}=require('electron')
contextBridge.exposeInMainWorld('pickSource',id=>ipcRenderer.send('pick-source',id))
