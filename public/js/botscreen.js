import{h,mount,POST,GET,fail}from'./util.js'
export async function botScreen(root,info,out){
const sc=h('div',{class:'auth'},h('div',{class:'card mt',style:{maxWidth:'420px',textAlign:'center'}},
h('h1',null,'Bot: '+info.name),
h('p',null,'Description: '+info.description),
h('p',null,'Servers used in: '+info.servers),
h('p',{class:'hint'},'Signed in on accident (or on purpose) thinking you were gonna do something?'),
h('button',{class:'btn pri',type:'button',on:{click:async()=>{try{if(out.preview)out.done();else{await POST('/api/auth/logout',{});location.reload()}}catch(e){fail(e)}}}},out.preview?'Close preview':'Sign out')))
mount(root,sc)
}
export async function botGate(root,user){
if(!user.is_bot)return false
await botScreen(root,await GET('/api/me/botinfo'),{})
return true
}
