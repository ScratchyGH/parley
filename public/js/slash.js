const FACE={shrug:'¯\\\\\\_(ツ)\\_/¯',tableflip:'(╯°□°)╯︵ ┻━┻',unflip:'┬─┬ ノ( ゜-゜ノ)',lenny:'( ͡° ͜ʖ ͡°)'}
export const COMMANDS=[['/shrug [text]','Adds ¯\\_(ツ)_/¯'],['/tableflip [text]','Adds (╯°□°)╯︵ ┻━┻'],['/unflip [text]','Adds ┬─┬ ノ( ゜-゜ノ)'],['/lenny [text]','Adds ( ͡° ͜ʖ ͡°)'],['/me text','Sends text in italics'],['/spoiler text','Hides text behind a spoiler'],['/gif [search]','Opens the GIF picker']]
export function slash(text){
const m=/^\/([a-z]+)(?:\s+([\s\S]*))?$/i.exec(text)
if(!m)return{text}
const cmd=m[1].toLowerCase()
const rest=(m[2]||'').trim()
if(cmd in FACE)return{text:rest?rest+' '+FACE[cmd]:FACE[cmd]}
if(cmd==='me')return rest?{text:'*'+rest+'*'}:{error:'Write what you are doing after /me'}
if(cmd==='spoiler')return rest?{text:'||'+rest+'||'}:{error:'Write the text to hide after /spoiler'}
if(cmd==='gif')return{gif:rest}
return{text}
}
