const FACE={shrug:'¯\\\\\\_(ツ)\\_/¯',tableflip:'(╯°□°)╯︵ ┻━┻',unflip:'┬─┬ ノ( ゜-゜ノ)',lenny:'( ͡° ͜ʖ ͡°)'}
export const COMMANDS=[['/shrug [text]','Adds ¯\\_(ツ)_/¯'],['/tableflip [text]','Adds (╯°□°)╯︵ ┻━┻'],['/unflip [text]','Adds ┬─┬ ノ( ゜-゜ノ)'],['/lenny [text]','Adds ( ͡° ͜ʖ ͡°)'],['/me text','Sends text in italics'],['/spoiler text','Hides text behind a spoiler'],['/gif [search]','Opens the GIF picker'],['/roll [2d6]','Rolls dice, up to 20d1000'],['/flip','Flips a coin'],['/choose a | b | c','Picks one option for you'],['/8ball [question]','Asks the magic 8 ball'],['/clap [text]','Puts claps between the words'],['/mock [text]','aLtErNaTiNg cAsE'],['/catchup','AI summary of recent messages here'],['/remind 30m [text]','Reminds you later, like 10m, 2h or 1d']]
export function slash(text){
const m=/^\/([a-z]+)(?:\s+([\s\S]*))?$/i.exec(text)
if(!m)return{text}
const cmd=m[1].toLowerCase()
const rest=(m[2]||'').trim()
if(cmd in FACE)return{text:rest?rest+' '+FACE[cmd]:FACE[cmd]}
if(cmd==='me')return rest?{text:'*'+rest+'*'}:{error:'Write what you are doing after /me'}
if(cmd==='spoiler')return rest?{text:'||'+rest+'||'}:{error:'Write the text to hide after /spoiler'}
if(cmd==='gif')return{gif:rest}
if(cmd==='roll'){
const r=/^(\d{1,2})?d(\d{1,4})$/i.exec(rest||'1d6')
if(!r)return{error:'Use /roll 2d6'}
const n=Math.min(20,+(r[1]||1)),f=Math.max(2,+r[2]),v=[]
const b=new Uint32Array(n);crypto.getRandomValues(b)
for(let i=0;i<n;i++)v.push(b[i]%f+1)
return{text:'🎲 rolled '+n+'d'+f+': '+(n>1?v.join(' + ')+' = ':'')+'**'+v.reduce((x,y)=>x+y,0)+'**'}
}
if(cmd==='flip')return{text:'🪙 **'+(crypto.getRandomValues(new Uint8Array(1))[0]&1?'Heads':'Tails')+'**'}
if(cmd==='choose'){
const o=rest.split(/\s*\|\s*|\s*,\s*/).filter(Boolean)
if(o.length<2)return{error:'Give two or more options like /choose pizza | tacos'}
return{text:'🤔 I pick **'+o[crypto.getRandomValues(new Uint32Array(1))[0]%o.length]+'**'}
}
if(cmd==='8ball'){
const A=['It is certain.','Without a doubt.','Yes, definitely.','Most likely.','Signs point to yes.','Ask again later.','Cannot predict now.','Do not count on it.','My sources say no.','Very doubtful.']
return{text:'🎱 '+(rest?rest+' — ':'')+'**'+A[crypto.getRandomValues(new Uint32Array(1))[0]%A.length]+'**'}
}
if(cmd==='catchup')return{catchup:true}
if(cmd==='remind'){
const r=/^(\S+)\s+([\s\S]+)$/.exec(rest)
return r?{remind:{when:r[1],note:r[2]}}:{error:'Use /remind 30m call mom'}
}
if(cmd==='clap')return rest?{text:rest.split(/\s+/).join(' 👏 ')+' 👏'}:{error:'Write some text after /clap'}
if(cmd==='mock')return rest?{text:[...rest.toLowerCase()].map((c,i)=>i%2?c.toUpperCase():c).join('')}:{error:'Write some text after /mock'}
return{text}
}
