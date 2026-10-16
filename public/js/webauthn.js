import{POST}from'./util.js'
export const b64e=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
export const b64d=s=>{
const t=s.replace(/-/g,'+').replace(/_/g,'/')
return Uint8Array.from(atob(t+'='.repeat((4-t.length%4)%4)),c=>c.charCodeAt(0))
}
export const passkeysSupported=()=>!!(window.PublicKeyCredential&&navigator.credentials)
const nice=e=>e?.name==='NotAllowedError'?Object.assign(new Error('Passkey request was cancelled or timed out'),{cancelled:true}):e
export async function signInWithPasskey(){
const o=(await POST('/api/auth/passkey/options',{})).publicKey
let cred
try{cred=await navigator.credentials.get({publicKey:{challenge:b64d(o.challenge),rpId:o.rpId,userVerification:o.userVerification,timeout:o.timeout}})}catch(e){throw nice(e)}
const r=cred.response
return(await POST('/api/auth/passkey/login',{id:cred.id,clientDataJSON:b64e(r.clientDataJSON),authenticatorData:b64e(r.authenticatorData),signature:b64e(r.signature)})).user
}
export async function registerPasskey(name){
const o=(await POST('/api/me/passkeys/options',{})).publicKey
let cred
try{cred=await navigator.credentials.create({publicKey:{...o,challenge:b64d(o.challenge),user:{...o.user,id:b64d(o.user.id)},excludeCredentials:o.excludeCredentials.map(x=>({...x,id:b64d(x.id)}))}})}catch(e){throw nice(e)}
return POST('/api/me/passkeys',{clientDataJSON:b64e(cred.response.clientDataJSON),attestationObject:b64e(cred.response.attestationObject),name})
}
