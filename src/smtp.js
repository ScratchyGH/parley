const enc=new TextEncoder(),dec=new TextDecoder()
const b64=s=>btoa(String.fromCharCode(...enc.encode(s)))
const addr=s=>{const m=/<([^>]+)>/.exec(s);return(m?m[1]:s).trim()}
const hdr=s=>/^[\x20-\x7e]*$/.test(s)?s:'=?UTF-8?B?'+b64(s)+'?='
export async function smtpSend(env,{from,to,subject,text,html}){
const{connect}=await import('cloudflare:sockets')
const host=env.SMTP_HOST,port=Number(env.SMTP_PORT)||465
const sock=connect({hostname:host,port},{secureTransport:port===465?'on':'starttls',allowHalfOpen:false})
let w=sock.writable.getWriter(),r=sock.readable.getReader(),buf=''
const line=async()=>{for(;;){const i=buf.indexOf('\r\n');if(i>=0){const l=buf.slice(0,i);buf=buf.slice(i+2);return l}const x=await r.read();if(x.done)throw new Error('Mail server closed the connection');buf+=dec.decode(x.value)}}
const reply=async()=>{let out='';for(;;){const l=await line();out+=l+'\n';if(l[3]!=='-')return{code:Number(l.slice(0,3)),text:out}}}
const send=async c=>{await w.write(enc.encode(c+'\r\n'))}
const need=async(ok,what)=>{const x=await reply();if(!ok.includes(x.code))throw new Error(what+': '+x.text.trim().slice(0,200));return x}
try{
await need([220],'Greeting')
await send('EHLO parley');await need([250],'EHLO')
if(port!==465){
await send('STARTTLS');await need([220],'STARTTLS')
w.releaseLock();r.releaseLock()
const t=sock.startTls();w=t.writable.getWriter();r=t.readable.getReader();buf=''
await send('EHLO parley');await need([250],'EHLO')
}
if(env.SMTP_USER){
await send('AUTH LOGIN');await need([334],'Auth')
await send(b64(env.SMTP_USER));await need([334],'Auth')
await send(b64(env.SMTP_PASS||''));await need([235],'Sign in to the mail server failed')
}
await send('MAIL FROM:<'+addr(from)+'>');await need([250],'Sender')
await send('RCPT TO:<'+addr(to)+'>');await need([250,251],'Recipient')
await send('DATA');await need([354],'Data')
const bd='p'+crypto.randomUUID().replace(/-/g,'')
const msg=['From: '+from,'To: '+to,'Subject: '+hdr(subject),'Date: '+new Date().toUTCString(),'Message-ID: <'+crypto.randomUUID()+'@parley>','MIME-Version: 1.0','Content-Type: multipart/alternative; boundary="'+bd+'"','',
'--'+bd,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',b64(text).replace(/.{76}/g,'$&\r\n'),
'--'+bd,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',b64(html).replace(/.{76}/g,'$&\r\n'),'--'+bd+'--',''].join('\r\n')
await w.write(enc.encode(msg+'\r\n.\r\n'));await need([250],'Message rejected')
try{await send('QUIT')}catch{}
return{ok:true}
}finally{try{sock.close()}catch{}}
}
