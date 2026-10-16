import{h,popup,closeMenu}from'./util.js'
import{S}from'./state.js'

const SETS={
Faces:'😀 😃 😄 😁 😆 😅 😂 🤣 🙂 😉 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 🤔 🤨 😐 😑 😶 🙄 😏 😣 😥 😮 😴 😌 🥱 😒 😓 😔 😕 🙃 🫠 😲 😖 😞 😟 😤 😢 😭 😦 😧 😨 😩 🤯 😬 😰 😱 🥵 🥶 😳 🤪 😵 😡 😠 🤬 😷 🤒 🤕 🤢 🤮 🤧 😎 🤓 🧐',
Gestures:'👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🖐️ 🖖 👋 🤝 🙏 👏 🙌 🫶 💪 🤲 ✍️',
Hearts:'❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝',
Objects:'🔥 ✨ ⭐ 🌟 💯 ✅ ❌ ⚠️ ❓ ❗ 🎉 🎊 🎁 🏆 🥇 📌 📎 🔗 🔒 🔑 💡 📅 📝 📁 💬 🔔 ⏰ 🛠️ ⚙️ 🧪 🚀 🌈 ☀️ 🌙 ⚡ ☕ 🍕 🍔 🍺 🎮 🎵 🎧 📷 💻 📱',
Animals:'🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦆 🦉 🐺 🐴 🦄 🐝 🦋 🐢 🐍 🐙 🐬 🐳'
}
const LIST=Object.fromEntries(Object.entries(SETS).map(([k,v])=>[k,[...new Set(v.split(' '))]]))

export function emojiPicker(anchor,onPick,sid){
const r=anchor.getBoundingClientRect()
const wrap=h('div',null)
const custom=sid&&S.sdata[sid]?S.sdata[sid].emoji||[]:[]
if(custom.length){
wrap.append(h('h5',{style:{margin:'6px 8px 0',fontSize:'11px',color:'var(--muted)',textTransform:'uppercase'}},'This server'))
wrap.append(h('div',{class:'picker'},custom.map(e=>h('button',{type:'button',title:':'+e.name+':','aria-label':e.name,on:{click:()=>{
closeMenu()
onPick(`<:${e.name}:${e.file_id}>`)
}}},h('img',{class:'cemoji',src:'/api/files/'+e.file_id,alt:':'+e.name+':'})))))
}
for(const[name,list]of Object.entries(LIST)){
wrap.append(h('h5',{style:{margin:'6px 8px 0',fontSize:'11px',color:'var(--muted)',textTransform:'uppercase'}},name))
wrap.append(h('div',{class:'picker'},list.map(e=>h('button',{type:'button',title:e,'aria-label':e,on:{click:()=>{
closeMenu()
onPick(e)
}}},e))))
}
const el=popup(wrap,Math.min(r.left,innerWidth-320),Math.max(8,r.top-300))
el.style.maxHeight='290px'
return el
}
