import{h,mount,icon}from'./util.js'
import{topBar}from'./shell.js'
import{kandieArt}from'./kandie.js'
const CURL='curl -X POST https://parley.heavengtwashere.workers.dev'
const SEC=[
{id:'start',t:'Getting started',k:'account sign up username recovery code login start begin',b:[
['p','Parley is a free place for friend groups and communities. You pick a username and go. There is no email to confirm.'],
['p','When you make an account you get a recovery code. It is the only key to your account, so save it somewhere safe before you do anything else.'],
['p','Start with Start a server on Home, or open an invite link from a friend. Direct messages live under Home, and the Friends tab lists everyone you have added.']
]},
{id:'servers',t:'Servers, channels and roles',k:'server channel role thread forum stage poll event permissions invite',b:[
['p','A server has text channels, voice channels, stages, forums and threads. Roles control who can see, send, connect and manage things, and each channel can override a role.'],
['p','Scheduled events let members RSVP. You can invite people with an invite link.']
]},
{id:'voice',t:'Voice, video and screen share',k:'voice call video screen share mic microphone ring resolution fps bitrate push to talk',b:[
['p','Calls connect people directly, up to 12 in a call. Open Voice settings to pick your microphone, noise control, push to talk, and screen share quality.'],
['p','Screen share lets you choose a resolution, a frame rate and a maximum bitrate. Lower the bitrate if viewers see stutter. You can also zoom a stream with the mouse wheel, expand it, or send it full screen.'],
['p','To ring someone, open a direct message and press Start voice call. People already in the call can ring others from the call controls.']
]},
{id:'pars',t:'Pars and cosmetics',k:'pars shop banner nameplate frame cosmetics earn',b:[
['p','Pars are earned by being around. Spend them in the Pars shop on banners, nameplates, frames and seasonal sets. Nothing is sold for money.']
]},
{id:'lab',t:'Bot Lab: bots without code',k:'bot lab blocks no code command trigger template block builder hosting',b:[
['p','Bot Lab builds bots from blocks. Triggers start a bot, logic blocks decide what happens, and action blocks send messages. Your bot runs on Parley itself, so there is nothing to host.'],
['p','Open Bot Lab, make a new bot, switch to Code blocks and drag blocks together. Use the test button to try the graph before you publish it to the Bot hub.']
]},
{id:'token',t:'Bot tokens and authentication',k:'api token bot authorization header auth bearer pb_',b:[
['p','To call the API as a bot, make a bot in Bot Lab and create a token from its page. The token starts with pb_ and is shown once, so store it safely.'],
['p','Send it in the Authorization header with the word Bot in front:'],
['c','Authorization: Bot pb_your_token_here'],
['p','Bots can use these paths only: /api/rooms, /api/channels, /api/threads, /api/upload, /api/files, /api/stickers, plus GET /api/me and GET /api/servers/:id. Other paths return 403.']
]},
{id:'api',t:'Sending and reading messages',k:'api message send read rooms post get json content rate limit curl',b:[
['p','Messages are read and sent per room. A room is a channel id or a conversation id.'],
['c','GET /api/rooms/:room/messages'],
['c',CURL+'/api/rooms/ROOM_ID/messages \\\n  -H "Authorization: Bot pb_your_token_here" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"content":"Hello from my bot"}\''],
['p','Sending is limited to 20 messages per 10 seconds per account. Other message routes under the same room path:'],
['c','PATCH  /api/rooms/:room/messages/:mid\nDELETE /api/rooms/:room/messages/:mid\nGET    /api/rooms/:room/pins\nPUT    /api/rooms/:room/pins/:mid\nPUT    /api/rooms/:room/messages/:mid/reactions/:emoji\nPOST   /api/rooms/:room/read']
]},
{id:'hooks',t:'Webhooks',k:'webhook incoming event hook secret message.create member.join post',b:[
['p','An incoming webhook posts into one channel without a bot. Create it with POST /api/channels/:cid/webhooks, and keep its token private.'],
['c',CURL+'/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN \\\n  -H "Content-Type: application/json" \\\n  -d \'{"content":"Deploy finished"}\''],
['p','Content must be 1 to 2000 characters, and each webhook allows 30 posts per minute.'],
['p','Event webhooks go the other way. A server manager registers a URL and picks events, and Parley sends them to you. The events available are message.create and member.join. A secret that starts with whsec_ comes back when you create the hook, so copy it then.'],
['c','GET    /api/servers/:sid/hooks\nPOST   /api/servers/:sid/hooks\nPATCH  /api/servers/:sid/hooks/:hid\nDELETE /api/servers/:sid/hooks/:hid\nPOST   /api/servers/:sid/hooks/:hid/test']
]},
{id:'code',t:'Coding with Parley',k:'code javascript node python example bot fetch library programming',b:[
['p','Any language that can send HTTPS requests works. A small Node example that posts a message:'],
['c','const r = await fetch("https://parley.heavengtwashere.workers.dev/api/rooms/ROOM_ID/messages", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bot " + process.env.PARLEY_TOKEN,\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({ content: "Hello from Node" })\n})\nconsole.log(r.status, await r.json())'],
['p','The same in Python:'],
['c','import os, requests\nr = requests.post(\n  "https://parley.heavengtwashere.workers.dev/api/rooms/ROOM_ID/messages",\n  headers={"Authorization": "Bot " + os.environ["PARLEY_TOKEN"]},\n  json={"content": "Hello from Python"},\n)\nprint(r.status_code, r.json())'],
['p','There is no real-time gateway for bots yet. Poll the messages route, or build the bot in Bot Lab so it runs on Parley and reacts to messages right away.']
]},
{id:'game',t:'Gourd Rush Teamup',k:'game gourd rush teamup squad boss tesvin potion lair',b:[
['p','Teamup is a co-op survival game you start from Home. Squads hold out until dawn against waves, mimics, crossbow skeletons and bosses.'],
['p','Potions come from lair pedestals and boss drops. Voice chat inside a match gets quieter with distance. Watch for a boss that is a television.']
]}
]
const code=txt=>{
const b=h('button',{type:'button',class:'kd-cp'},'Copy')
b.addEventListener('click',()=>{try{navigator.clipboard.writeText(txt);b.textContent='Copied';setTimeout(()=>{b.textContent='Copy'},1200)}catch{}})
return h('div',{class:'kd-code'},b,h('pre',null,txt))
}
const sec=s=>h('section',{class:'kd-s',id:'kd-'+s.id},h('h3',null,s.t),...s.b.map(([k,t])=>k==='c'?code(t):h('p',null,t)))
export function docsPage(r){
const bar=topBar({lead:icon('hash'),title:'Kandie’s Docs',topic:'How to use Parley, code with it, and call its API'})
const scroller=h('div',{class:'pgh kd-page'})
const q=h('input',{class:'kd-q',type:'search',placeholder:'Ask Kandie: try token, webhook, screen share…','aria-label':'Search the docs'})
const list=h('div',{class:'kd-list'})
const hero=h('div',{class:'kd-hero'},h('div',{class:'kd-av'},kandieArt(64)),h('div',null,h('h2',null,'Hi, I am Kandie.'),h('p',null,'I am Parley’s sister. I keep the docs, because somebody has to, and neither of my brothers writes anything down in plain language. Parley is in 8th grade and the quick one, Brit is the scientist who just finished college, and I am in high school and the one who reads the instructions.'),q))
const toc=h('nav',{class:'kd-toc'},...SEC.map(s=>h('a',{href:'#kd-'+s.id,on:{click:e=>{e.preventDefault();scroller.querySelector('#kd-'+s.id)?.scrollIntoView({behavior:'smooth',block:'start'})}}},s.t)))
const draw=()=>{
const v=q.value.trim().toLowerCase()
const w=v.split(/\s+/).filter(Boolean)
const hit=SEC.filter(s=>!w.length||w.every(x=>(s.t+' '+s.k+' '+s.b.map(b=>b[1]).join(' ')).toLowerCase().includes(x)))
mount(list,hit.length?hit.map(sec):h('div',{class:'kd-none'},'Nothing matches that. Try a shorter word like token, voice or bot.'))
}
q.addEventListener('input',draw)
draw()
mount(scroller,hero,h('div',{class:'kd-body'},toc,list))
return{nodes:[bar,scroller],title:'Kandie’s Docs • Parley',cleanup:null,ready:Promise.resolve()}
}
