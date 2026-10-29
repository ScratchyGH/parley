const{app,BrowserWindow,shell}=require('electron')
const U='https://parley.heavengtwashere.workers.dev/?web=1'
if(!app.requestSingleInstanceLock())app.quit()
app.whenReady().then(()=>{
const w=new BrowserWindow({width:1280,height:800,backgroundColor:'#0a0a09',autoHideMenuBar:true,icon:__dirname+'/icon.png',webPreferences:{contextIsolation:true,sandbox:true}})
w.loadURL(U)
w.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://parley.heavengtwashere.workers.dev'))return{action:'allow'};shell.openExternal(url);return{action:'deny'}})
})
app.on('window-all-closed',()=>app.quit())
