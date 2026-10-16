const unb=v=>{const s=v.replace(/-/g,'+').replace(/_/g,'/');const b=atob(s+'==='.slice((s.length+3)%4));return Uint8Array.from(b,c=>c.charCodeAt(0))}
const te=new TextEncoder()
export const canon=m=>`p1\n${m.id}\n${m.room}\n${m.author.id}\n${m.created_at}\n${m.edited_at||0}\n${m.content}`
export async function makeVerifier(pub){
const key=await crypto.subtle.importKey('jwk',{kty:'OKP',crv:'Ed25519',x:pub},'Ed25519',false,['verify'])
return async m=>{
if(!m||typeof m.sig!=='string'||!m.author||typeof m.content!=='string')return false
try{return await crypto.subtle.verify('Ed25519',key,unb(m.sig),te.encode(canon(m)))}catch{return false}
}
}
