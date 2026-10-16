const kp=await crypto.subtle.generateKey('Ed25519',true,['sign','verify'])
const jwk=await crypto.subtle.exportKey('jwk',kp.privateKey)
console.log(JSON.stringify({kty:jwk.kty,crv:jwk.crv,x:jwk.x,d:jwk.d}))
