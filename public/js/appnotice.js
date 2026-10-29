import{h}from'./util.js'
export function appNotice(){
const ua=navigator.userAgent
if(!/Electron\//.test(ua)||/ParleyDesktop\//.test(ua))return
try{if(localStorage.getItem('appnotice2'))return}catch{}
const close=()=>{try{localStorage.setItem('appnotice2','1')}catch{}box.remove()}
const box=h('div',{class:'appnotice'},
h('b',null,'Update the desktop app'),
h('p',null,'Screen sharing is fixed in the newest version. Download it and install over this one.'),
h('div',{class:'an-row'},
h('a',{class:'an-dl',href:'/get',target:'_blank',on:{click:close}},'Download'),
h('button',{class:'an-x',on:{click:close}},'Later')))
document.body.append(box)
}
