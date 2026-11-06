import{h,POST}from'./util.js'
export function bootError(e,bare){
const reload=()=>location.reload()
if(e.status===503)return h('div',{class:'auth'},h('div',{class:'card mt'},h('img',{class:'au-m',src:'/mascot.webp',alt:'',width:56,height:56}),h('h1',null,'Down for maintenance'),h('p',null,'Parley is being updated. This usually takes a few minutes.'),h('div',{class:'row',style:{justifyContent:'center'}},h('button',{class:'btn pri',on:{click:reload}},'Try again'),h('button',{class:'btn',on:{click:async()=>{try{await POST('/api/auth/logout',{})}catch{}reload()}}},'Sign out'))))
return h('div',{class:'auth'},h('div',{class:'card'},h('h1',null,'Parley'),h('p',null,'Could not reach the server: '+e.message),h('button',{class:'btn pri',on:{click:reload}},'Retry')))
}
