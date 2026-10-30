import Photon from '/vendor/photon.js'
const APP='1bfb6777-1e0c-49e7-840c-d8618dfccb59'
const LBC=Photon.LoadBalancing.LoadBalancingClient
const ST=LBC.State
export function connectParty({code,create,me,on}){
const c=new LBC(Photon.ConnectionProtocol.Wss,APP,'1.0')
try{c.setLogLevel(Photon.LogLevel.ERROR)}catch{}
const nrOf=new Map(),uOf=new Map()
let joined=false,dead=false
const fail=t=>{if(dead)return;dead=true;try{c.disconnect()}catch{}on.fail(t)}
const room='tu'+code
c.onStateChange=s=>{
if(s===ST.JoinedLobby||s===ST.ConnectedToMaster){
if(joined||c.__tried)return
c.__tried=true
if(create)c.createRoom(room,{maxPlayers:3,isVisible:false,emptyRoomLiveTime:2000})
else c.joinRoom(room)
}else if(s===ST.Error||s===ST.Disconnected){if(!dead){dead=true;on.close(joined)}}
}
c.onJoinRoom=()=>{joined=true;on.open()}
let tr=0
c.onOperationResponse=(err,msg)=>{
if(err===32758&&!create&&!joined&&!dead&&tr<6){tr++;setTimeout(()=>{if(!dead&&!joined)try{c.joinRoom(room)}catch{}},1500);return}
if(err&&!joined)fail(err===32758?'That party is not open':err===32765?'That party is full':err===32766?'Try again, that code is taken':'Could not join the party')
}
c.onError=(code,msg)=>{if(!joined)fail('Could not reach the game servers')}
c.onActorLeave=a=>{const u=uOf.get(a.actorNr);if(u)on.left(u)}
c.onEvent=(code,data,nr)=>{
if(code!==1||!data||typeof data!=='object'||typeof data.u!=='string')return
nrOf.set(data.u,nr);uOf.set(nr,data.u)
on.msg(data.u,data.d)
}
c.connectToRegionMaster('us')
return{
send(d,to){
if(!joined||dead)return
const o={u:me,d}
if(to){const nr=nrOf.get(to);if(!nr)return;c.raiseEvent(1,o,{targetActors:[nr]})}
else c.raiseEvent(1,o,{receivers:Photon.LoadBalancing.Constants.ReceiverGroup.Others})
},
close(){dead=true;try{c.disconnect()}catch{}}
}
}
