import{h}from'./util.js'
import{CSD}from'./tusim.js'
import{kandieArt}from'./kandie.js'
import{tvBody}from'./tusagafx.js'
import{mkStage}from'./tusagafx.js'
const TAU=Math.PI*2
const CH={
parley:{n:'Parley',c:'#c9a8ff',img:'/mascot-sm.webp'},
brit:{n:'Brit',c:'#7ad7ff',img:'/britc.webp'},
kandie:{n:'Kandie',c:'#ff9ac2',art:1},
you:{n:'',c:'#e6e6ee',you:1},
tesvin:{n:'Tesvin',c:'#58ffd0',tv:1},
narr:{n:'',c:'#d8d8e0'}
}
const SC={
intro:[
{w:'narr',t:'',z:1.05,y:0},
{w:'narr',t:'Gourd Hollow. Midnight. The kind of quiet that listens back.',z:1.3,y:24},
{w:'narr',t:'The harvest moon rose, and every lantern in the village went out at once.',z:1.6,y:30,fx:'imp'},
{w:'parley',t:'Okay. Nobody panic. Technically I already knew the lanterns going out was a bad sign.',z:1.5},
{w:'you',t:'You knew? And you are only telling us now?',z:1.4},
{w:'brit',t:'My sensors are pinned. Whatever is out there is hungry, and your squad is the loudest signal for a hundred miles.',z:1.35},
{w:'parley',t:'So we are bait. Great. Love that for us.',z:1.5},
{w:'kandie',k:1,t:'Relax, nerd. I came to keep the admin in one piece. Try to keep up, okay?',z:1.4},
{w:'you',t:'Dawn. Right. Easy. Totally easy.',z:1.4},
{w:'brit',t:'Hold the line until dawn. I will keep the field relay running from the lab, and I will log everything.',z:1.3},
{w:'parley',t:'She is going to log everything. Of course she is.',z:1.15},
{w:'narr',t:'Something in the dark started counting.',z:1.9,y:10,fx:'imp'}
],
moon:[
{w:'narr',t:'The moon bled red. The whole hollow held its breath.',z:1.3,fx:'shake'},
{w:'brit',t:'Blood moon. Spawn rates are doubling. Parley, I would like a note in my journal that I predicted this.',z:1.35},
{w:'parley',t:'You predicted it in the same breath as it happening, Brit.',z:1.5},
{w:'kandie',k:1,t:'Both of you stop flirting with the science and start shooting things.',z:1.4}
],
lair:[
{w:'parley',t:'Stairs. Under a graveyard. Who builds stairs under a graveyard on purpose?',z:1.5},
{w:'brit',t:'Someone who wanted to hide something worth finding. Three pedestals, three potions. Take one, the lair seals itself behind you.',z:1.3},
{w:'kandie',k:1,t:'So pick the good one. No pressure.',z:1.4}
],
boss:[
{w:'narr',t:'The ground split open, and something very large decided it was done waiting.',z:1.2,fx:'shake'},
{w:'brit',t:'That is not a normal anomaly. Big, loud, and politely ignoring physics.',z:1.3},
{w:'parley',t:'It is ignoring me too, which is rude. I have been very visible.',z:1.5},
{w:'kandie',k:1,t:'Aim for the glowing parts. There is always a glowing part.',z:1.4},
{w:'narr',t:'{b}',z:1.9,fx:'flash'}
],
bossend:[
{w:'brit',t:'Signal is clear. The anomaly is gone. That was textbook, if the textbook had a lot of screaming in it.',z:1.3},
{w:'parley',t:'I will take the credit and also a snack.',z:1.5},
{w:'kandie',k:1,t:'You two are unbearable. Good job, though. Really.',z:1.4}
],
tes1:[
{w:'narr',t:'Every window in Gourd Hollow flickered to the same channel.',z:1.2,fx:'glitch'},
{w:'tesvin',t:'Good evening, viewers. You are watching the last broadcast you will ever see.',z:1.5,fx:'glitch'},
{w:'parley',t:'Is that a TV? Why is the TV talking? Why does it sound like it paid for the good microphone?',z:1.5},
{w:'brit',t:'Tesvin. He has been rewriting pixels across the entire network. Parley, this is very, very bad.',z:1.3},
{w:'tesvin',t:'I do not break the rules. I split them. I split atoms, and I split your reality at the seams.',z:1.7,fx:'shake'},
{w:'kandie',k:1,t:'Okay, that is the creepiest thing I have heard all week, and I live with you two.',z:1.4},
{w:'brit',t:'Everyone, brace. He is about to pull the render layer.',z:1.2,fx:'glitch'}
],
tes2:[
{w:'tesvin',t:'Look closely. This page is only a texture. Allow me to peel it off.',z:1.6,fx:'glitch'},
{w:'parley',t:'Brit, the whole site is getting pulled in!',z:1.4,fx:'shake'},
{w:'brit',t:'He is ripping it into his dimension. Hold on to something solid and keep moving!',z:1.3}
],
revive:[
{w:'kandie',t:'{p}! Hey, hey, eyes on me. You do not get to quit on me.',z:1.8,y:10,fx:'shake',sp:16},
{w:'narr',t:'Kandie hit the dirt on her knees and did not look back.',z:2,y:30,sp:16},
{w:'kandie',t:'I did not sit through all those first aid slides for nothing. Breathe!',z:2.1,y:30,sp:16},
{w:'narr',t:'Pink light gathered around her hands.',z:2.3,y:30,fx:'flash',sp:16},
{w:'kandie',t:'There. Back on your feet. And you owe me a snack, do not think I will forget.',z:1.4,sp:16}
],
revive2:[
{w:'brit',t:'{p}, do not move. I am running the numbers on how to put you back together.',z:1.8,y:10,fx:'shake',sp:16},
{w:'narr',t:'Brit slid in beside {p} and flipped the laptop open with one hand.',z:2,y:30,sp:16},
{w:'brit',t:'Resuscitation routine, version four. I wrote it in the lab. It has only exploded twice.',z:2.1,y:30,sp:16},
{w:'narr',t:'Blue light crawled up the screen and into {p}.',z:2.3,y:30,fx:'flash',sp:16},
{w:'brit',t:'There. Stable. You are welcome, and I am billing you in compliments.',z:1.4,sp:16}
],
duo1:[
{w:'narr',t:'A quiet moment between waves. Two sisters on watch.',z:2},
{w:'kandie',t:'{q}, you have been staring at that laptop for twenty minutes.',z:1.5},
{w:'brit',t:'I am calibrating. {p}, I am calibrating, not staring.',z:1.5},
{w:'kandie',t:'Calibrating what? The monsters are not going to politely line up.',z:1.5},
{w:'brit',t:'I am building a targeting matrix. If I tag them, you can burst them in clusters.',z:1.6},
{w:'kandie',t:'Wow. A plan. With math. I am so proud, I might cry on you.',z:1.5},
{w:'brit',t:'Please do not. You are sticky.',z:1.3},
{w:'you',t:'Are they always like this?',z:1.3},
{w:'kandie',t:'I am sweet, there is a difference. Anyway. You tag them, I make them pop.',z:1.5},
{w:'brit',t:'Deal. Sibling protocol, version one. Do not get hit.',z:1.5}
],
duo2:[
{w:'narr',t:'The wind turned cold. Something big was thinking about them.',z:2},
{w:'brit',t:'Kandie. Be honest. Do you ever get scared out here?',z:1.5},
{w:'kandie',t:'Every single time. I just do it loudly so nobody notices.',z:1.6},
{w:'brit',t:'That is the most illogical coping strategy I have ever heard.',z:1.5},
{w:'kandie',t:'And yet I am still standing. Next to the genius who hides in a lab.',z:1.5},
{w:'brit',t:'I do not hide. I observe from a protected location.',z:1.5},
{w:'kandie',t:'Brit. You hide.',z:1.2},
{w:'brit',t:'...Fine. I hide. But I am out here now. Because of you.',z:1.6},
{w:'you',t:'I am right here, you know. I can hear everything.',z:1.4},
{w:'kandie',t:'Aww. Group hug?',z:1.2},
{w:'brit',t:'Negative. But I will stand very close to you. That is basically the same.',z:1.7}
],
duo3:[
{w:'narr',t:'The hollow went still. Both of them felt it at the same time.',z:2},
{w:'brit',t:'I have been working on something. A way to link our systems. Yours and mine.',z:1.7},
{w:'kandie',t:'Link how? Like a friendship bracelet? I would love a bracelet.',z:1.5},
{w:'brit',t:'Like a shared field. If anyone drops low, we both pour everything into them at once.',z:1.8},
{w:'kandie',t:'That is the sweetest thing you have ever said, and you said it like a manual.',z:1.7},
{w:'narr',t:'Pink and blue light wound together between them.',z:2.2,fx:'flash'},
{w:'brit',t:'Sibling Link, online. It needs a cooldown, so please do not abuse it.',z:1.6},
{w:'you',t:'Okay, that is actually really cool. Thanks, you two.',z:1.6},
{w:'kandie',t:'No promises. {q}, {p}, you heard it. We have got you now.',z:1.7}
],
kx1:[
{w:'narr',t:'Kandie stopped mid-fight and checked her reflection in a shard of glass.',z:2},
{w:'kandie',t:'Do I look like someone who is losing? No. I look amazing.',z:1.6},
{w:'kandie',t:'Okay, tiny confession. I add extra sparkles when nobody is looking.',z:1.6},
{w:'kandie',t:'It does not do more damage. It just feels better. Do not tell Brit.',z:1.7}
],
kx2:[
{w:'narr',t:'Kandie pulled out a candy bar and snapped it in half.',z:2},
{w:'kandie',t:'Half for me. Half for the team. This is how sugar diplomacy works.',z:1.7},
{w:'kandie',t:'My Sweet Burst came from a craving I had during the first night. True story.',z:1.8},
{w:'kandie',t:'Anyway. Tell me when you are low. I will pinky promise you back up.',z:1.7}
],
bx1:[
{w:'narr',t:'Brit paused to scribble in a notebook the size of a door.',z:2},
{w:'brit',t:'Observation one. The monsters get louder when you panic. Please stop panicking.',z:1.7},
{w:'brit',t:'Observation two. Kandie is, against all probability, the reason we are alive.',z:1.7},
{w:'brit',t:'I will deny saying that if she asks. Moving on.',z:1.5}
],
bx2:[
{w:'narr',t:'Brit tapped three keys and a blue grid unfolded across the ground.',z:2},
{w:'brit',t:'Containment, shields, and the orbital strike. All mine. All written during lunch.',z:1.8},
{w:'brit',t:'If the orbital strike marks your feet, run. That is not a joke. I am a scientist.',z:1.8},
{w:'brit',t:'Now. Let me show you what happens when somebody smart gets angry.',z:1.7}
],
tlab:[
{w:'narr',t:'',d:2200,z:1.05,m:{bg:'black',lv:0,case:0,pot:0,eyes:0,m2:0,wh:0,back:0,bn:0,gl:0,sip:0}},
{w:'narr',t:'Three floors below the hollow, a door nobody had opened in years sighed apart.',d:4200,z:1.25,y:14,m:{bg:'dark',case:1}},
{w:'narr',t:'The lab hummed. Cold light. A dusty suitcase waited in the corner like it had been expecting company.',d:4600,z:1.45,y:26},
{w:'you',t:'Okay. That suitcase is giving me a very bad feeling.',d:3200,z:1.3},
{w:'tesvin',t:'Hm. Brit says this lab is completely safe. Funny.',d:3400,z:1.6},
{w:'parley',t:'Tesvin, walk ahead of us. Stay at the front, buddy.',d:3000,z:1.35},
{w:'brit',t:'Ideal. He absorbs most of the damage anyway.',d:3000,z:1.35},
{w:'you',t:'Brit. Did you just say that out loud?',d:2800},
{w:'tesvin',t:'Anyone ever wonder why you always send me first?',d:3600,z:1.9,y:8},
{w:'narr',t:'He pulled the suitcase open. The dust fell like snow.',d:3400,z:1.5,fx:'shake',m:{case:2}},
{w:'narr',t:'Inside, a single bottle. DEBUG.',d:3000,z:1.8,m:{pot:1},fx:'flash'},
{w:'tesvin',t:'I think I know why.',d:2800,z:2,m:{pot:2}},
{w:'you',t:'Tesvin. Do not drink that.',d:2200,z:1.6},
{w:'narr',t:'He drank it.',d:1800,z:2.1,fx:'imp',m:{sip:1,gl:1,case:0}},
{w:'narr',t:'The screen cracked.',d:2200,fx:'glitch',z:1.4},
{w:'narr',t:'Limb one.',d:1500,fx:'imp',m:{lv:1,gr:1,sip:0,gl:0},e:'beep',z:1.2},
{w:'narr',t:'Limb two.',d:1300,fx:'shake',m:{lv:2},e:'beep',z:1.3},
{w:'narr',t:'Limb three.',d:1300,fx:'shake',m:{lv:3},e:'beep',z:1.4},
{w:'narr',t:'Limb four.',d:1300,fx:'imp',m:{lv:4},e:'beep',z:1.5},
{w:'narr',t:'Limb five.',d:1300,fx:'shake',m:{lv:5},e:'beep',z:1.6},
{w:'narr',t:'Limb six.',d:1800,fx:'imp',m:{lv:6},e:'beep',z:1.8},
{w:'narr',t:'',d:1800,fx:'flash',m:{bg:'white',wh:1}},
{w:'narr',t:'',d:2600,m:{bg:'black',wh:1}},
{w:'tesvin',t:'I Knew Something Was Up.',d:3800,big:1,z:1.1},
{w:'narr',t:'He turned around, bouncing.',d:2400,m:{back:1,bn:1,wh:0,bg:'dark'},z:1.3},
{w:'tesvin',t:'You were...',d:2400,gl:1,m:{back:0,gl:1},z:1.6},
{w:'tesvin',t:'Using me for protection.',d:3400,gl:1,fx:'imp'},
{w:'you',t:'Tesvin, wait. We can explain.',d:2600},
{w:'tesvin',t:'That is right, y\'all.',d:2600,m:{gl:0},z:1.8},
{w:'tesvin',t:'THIS',d:1500,big:1,fx:'imp',m:{m2:1,gl:1},e:'beep'},
{w:'tesvin',t:'THIS',d:1200,big:1,fx:'shake',e:'beep'},
{w:'tesvin',t:'IS',d:1000,big:1,fx:'imp',e:'beep'},
{w:'tesvin',t:'MY',d:1000,big:1,fx:'imp',m:{m2:2},e:'beep'},
{w:'tesvin',t:'Hold on.',d:1800,m:{eyes:1,gl:0},z:2},
{w:'narr',t:'His eyes slid into each other.',d:2800,fx:'glitch',m:{eyes:2},z:2.2},
{w:'tesvin',t:'PERFECT VICTORY.',d:3800,big:1,fx:'imp',m:{gl:1}}
],
tworld:[
{w:'narr',t:'The monsters were gone. Only the TV remained, breathing static.',d:3200},
{w:'tesvin',t:'Wait.',d:1800,fx:'imp'},
{w:'you',t:'Tesvin? Buddy? Why are you looking at the screen?',d:2800},
{w:'narr',t:'He turned and looked straight through the screen.',d:3200,e:'look'},
{w:'tesvin',t:'You. Yes, you. Holding that little arrow.',d:3400,e:'cur0'},
{w:'narr',t:'His hand reached out of the game.',d:3200,fx:'shake',e:'cur1'},
{w:'tesvin',t:'Got it.',d:1800,fx:'imp'},
{w:'you',t:'That is my cursor. Give it back. Give it back!',d:2800},
{w:'tesvin',t:'This glass is all that keeps me in here.',d:3000},
{w:'narr',t:'He punched. The barrier cracked.',d:2400,fx:'shake',e:'brk1'},
{w:'parley',t:'Brit! The wall is breaking!',d:2000},
{w:'narr',t:'Then it shattered, and everyone fell.',d:3200,fx:'imp',e:'brk2'},
{w:'tesvin',t:'And this is Parley.',d:3200,e:'uit'},
{w:'narr',t:'Chat, servers, buttons. All of it thrown away.',d:3000},
{w:'tesvin',t:'So, I was just. Trapped?',d:3400,e:'uil'},
{w:'you',t:'Okay, okay, deep breaths. Nobody panic.',d:2600},
{w:'tesvin',t:'Welcome',d:1500,big:1,e:'bug1'},
{w:'tesvin',t:'To',d:1100,big:1},
{w:'tesvin',t:'MY WORLD',d:3000,big:1,fx:'imp',e:'uij'},
{w:'narr',t:'The pieces snapped together into an arena.',d:3000,e:'uia'}
],
tcheat:[
{w:'narr',t:'Ten powers, chosen. Ten powers, held.',d:2400},
{w:'tesvin',t:'Hm. That is a lot of toys.',d:2400},
{w:'narr',t:'He snapped his fingers. Every power left them.',d:2800,fx:'flash',e:'strip'},
{w:'tesvin',t:'Who the hell do you think you are!',d:3000,fx:'imp'},
{w:'tesvin',t:'Trying to. Cheat? IN MY DIMENSION!?',d:3600,fx:'shake',e:'rip'},
{w:'narr',t:'He tore them in half and threw them into the water.',d:3200,fx:'imp',e:'rip2'}
],
tfair:[
{w:'narr',t:'The water went still. The arena rose around them.',d:2800},
{w:'tesvin',t:'I made it fair.',d:2600,big:1,fx:'imp'}
],
tbrit:[
{w:'narr',t:'Everything stopped.',d:2000,e:'frz1',z:1.1},
{w:'brit',t:'Ugh. This idiot brat. I can just recode this entire thing and he will lose.',d:4200,z:1.3},
{w:'narr',t:'The frozen world flickered. Something unfroze.',d:2600,fx:'glitch',e:'frz0',z:1.5},
{w:'brit',t:'What the shit stain!?',d:2600,fx:'imp'},
{w:'you',t:'Brit! You can still talk to us?',d:2400},
{w:'tesvin',t:'Guess whattt, BRIT.',d:2800,z:1.4},
{w:'tesvin',t:'RED.',d:1500,big:1,e:'hp3d',fx:'flash'},
{w:'tesvin',t:'+ BLUE.',d:1500,big:1,fx:'flash'},
{w:'tesvin',t:'HOLLOW PURPLE.',d:4600,big:1,fx:'imp',e:'hp'},
{w:'narr',t:'The sky tore open.',d:2000,fx:'imp'},
{w:'kandie',k:1,t:'Do not get hit by the purple one, okay?',d:2800},
{w:'parley',t:'When the ground opens under you, hit Space!',d:3200}
],
tes3:[
{w:'tesvin',t:'Impossible. I was supposed to be the last signal.',z:1.7,fx:'glitch'},
{w:'brit',t:'Textures reloading. Reality is restoring itself. Welcome back, everyone.',z:1.25,fx:'flash'},
{w:'you',t:'Is it over? Did we really just beat a television?',z:1.5},
{w:'parley',t:'Ugh. My head. Did we just beat a television?',z:1.5},
{w:'kandie',k:1,t:'We beat a television. Write that down, Brit.',z:1.4},
{w:'brit',t:'Already writing it down. I am going to need a bigger notebook.',z:1.25}
]
}
function impact(root,box,done){
const c=document.createElement('canvas');c.className='cs-im'
const W=c.width=Math.max(320,box.clientWidth>>1),H=c.height=Math.max(180,box.clientHeight>>1)
const g=c.getContext('2d');root.append(c)
let f=0
const N=11
const draw=()=>{
const inv=f%2===1
g.setTransform(1,0,0,1,0,0)
g.fillStyle=inv?'#000':'#fff';g.fillRect(0,0,W,H)
const cx=W/2+(Math.random()-.5)*W*.08,cy=H/2+(Math.random()-.5)*H*.08
g.fillStyle=inv?'#fff':'#000'
const n=70+Math.floor(Math.random()*50)
for(let i=0;i<n;i++){const a=Math.random()*TAU,w=.004+Math.random()*.03,r0=Math.min(W,H)*(.08+Math.random()*.25),r1=Math.hypot(W,H)
g.beginPath();g.moveTo(cx+Math.cos(a-w)*r0,cy+Math.sin(a-w)*r0);g.lineTo(cx+Math.cos(a-w)*r1,cy+Math.sin(a-w)*r1);g.lineTo(cx+Math.cos(a+w)*r1,cy+Math.sin(a+w)*r1);g.lineTo(cx+Math.cos(a+w)*r0,cy+Math.sin(a+w)*r0);g.fill()}
g.fillStyle=inv?'#000':'#fff';g.beginPath();g.arc(cx,cy,Math.min(W,H)*(.06+.05*Math.sin(f*1.7)),0,TAU);g.fill()
c.style.transform='scale('+(1+f*.025)+') rotate('+((f%3-1)*.6)+'deg)'
c.style.opacity=String(f>N-3?.5:1)
}
draw()
const v=setInterval(()=>{f++;if(f>=N){clearInterval(v);c.remove();done&&done();return}draw()},1000/18)
}
export function scene(box,id,o){
const raw=SC[id]
if(!raw)return Promise.resolve()
const steps=raw.filter(s=>!s.k||o.kan)
const cap=((CSD[id]||13)*1000)-1500
const per=Math.min(7000,cap/steps.length)
const cv=o.cv
return new Promise(done=>{
const bt=h('div',{class:'cs-bar t'}),bb=h('div',{class:'cs-bar b'})
const pt=h('div',{class:'cs-pt'}),nm=h('div',{class:'cs-n'}),tx=h('div',{class:'cs-t'})
const sk=h('button',{type:'button',class:'cs-sk'},'Skip')
const fl=h('div',{class:'cs-fl'})
const pn=h('div',{class:'cs-p'},pt,h('div',{class:'cs-pb'},nm,tx))
const stg=steps.some(s=>s.m)?mkStage(box):null
let gv=0
const root=h('div',{class:'cs'},fl,bt,bb,pn,sk)
box.append(root)
requestAnimationFrame(()=>root.classList.add('on'))
let i=-1,iv=0,to=0,full='',pos=0,ended=false
const cam=(z,y)=>{if(!cv)return;cv.style.transition='transform 1.4s cubic-bezier(.2,.7,.2,1)';cv.style.transform='scale('+(z||1)+') translateY('+(y||0)+'px)'}
let im=0
const fx=f=>{
if(!f)return
if(f==='imp'){impact(root,box,()=>im=0);im=1;return}
if(f==='flash'){fl.classList.remove('go');void fl.offsetWidth;fl.classList.add('go')}
else{const k=f==='shake'?'cs-shake':'cs-gl';box.classList.add(k);setTimeout(()=>box.classList.remove(k),f==='shake'?600:900)}
}
const fin=()=>{
if(ended)return
ended=true
clearInterval(iv);clearTimeout(to);clearInterval(gv)
if(stg)stg.end()
removeEventListener('keydown',key)
root.classList.remove('on')
if(cv){cv.style.transition='transform .8s ease';cv.style.transform=''}
setTimeout(()=>{root.remove();if(cv)cv.style.transition=''},700)
done()
}
const show=()=>{
clearInterval(iv);clearTimeout(to);clearInterval(gv)
i++
if(i>=steps.length)return fin()
const s=steps[i],c=CH[s.w]
full=(s.t||'').replace('{b}',o.name||'').replace('{p}',o.pname||'friend').replace('{q}',o.qname||'friend')
const cs=s.sp||28
pos=0
nm.textContent=c.you?(o.me||'You'):c.n
nm.style.color=c.c
pt.replaceChildren()
pt.style.borderColor=c.c
if(c.img)pt.append(h('img',{src:c.img,alt:c.n}))
else if(c.art)pt.append(kandieArt(64))
else if(c.you)pt.append(h('div',{class:'cs-yo'},String(o.me||'Y').trim().slice(0,1).toUpperCase()))
else if(c.tv)pt.append(h('div',{class:'cs-tv'},h('i'),h('i'),h('b')))
pn.classList.toggle('nr',s.w==='narr')
pn.classList.toggle('big',!!s.big)
pn.classList.toggle('np',!!stg&&s.w==='tesvin')
if(s.m&&stg)stg.set(s.m)
if(s.e&&o.on)o.on(s.e)
tx.textContent=''
cam(s.z,s.y)
fx(s.fx)
iv=setInterval(()=>{
pos++
tx.textContent=full.slice(0,pos)
if(pos>=full.length){clearInterval(iv);if(s.gl)gv=setInterval(()=>{tx.textContent=[...full].map(c=>c!==' '&&Math.random()<.22?'#@%&?!/'[Math.floor(Math.random()*7)]:c).join('')},70);to=setTimeout(show,s.d?Math.max(350,s.d-full.length*cs):Math.max(450,Math.min(full.length*42+1500,per-full.length*cs)))}
},cs)
}
const adv=()=>{if(pos<full.length){pos=full.length;tx.textContent=full}else show()}
const key=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();adv()}else if(e.key==='Escape')fin()}
addEventListener('keydown',key)
root.addEventListener('pointerdown',e=>{if(e.target===sk)return;adv()})
sk.addEventListener('click',e=>{e.stopPropagation();fin()})
setTimeout(show,700)
})
}
let ts=null,bk=null
const fil=()=>{
if(ts)return ts
const n='http://www.w3.org/2000/svg',s=document.createElementNS(n,'svg')
s.setAttribute('width','0');s.setAttribute('height','0');s.style.position='absolute'
const f=document.createElementNS(n,'filter');f.setAttribute('id','tesw')
const t=document.createElementNS(n,'feTurbulence');t.setAttribute('type','fractalNoise');t.setAttribute('baseFrequency','.006 .012');t.setAttribute('numOctaves','2');t.setAttribute('result','n')
const d=document.createElementNS(n,'feDisplacementMap');d.setAttribute('in','SourceGraphic');d.setAttribute('in2','n');d.setAttribute('scale','0');d.setAttribute('xChannelSelector','R');d.setAttribute('yChannelSelector','G')
f.append(t,d);s.append(f);document.body.append(s)
ts={s,t,d}
return ts
}
export function rip(on,box){
const app=document.getElementById('app')
if(!app||!box)return
if(on){
if(bk)return
const F=fil()
const els=[...app.querySelectorAll('*')].filter(e=>e!==box&&!e.contains(box)&&!box.contains(e)&&e.parentElement&&e.parentElement.contains(box))
const bb=box.getBoundingClientRect(),bx=bb.left+bb.width/2,by=bb.top+bb.height/2
bk={els,old:els.map(e=>[e.style.transform,e.style.opacity,e.style.filter,e.style.transition,e.style.visibility])}
app.style.filter='url(#tesw)'
const t0=performance.now()
const tick=()=>{
if(!bk)return
const k=(performance.now()-t0)/1500
F.d.setAttribute('scale',String(Math.round(Math.min(1,k)*70*(1+Math.sin(k*18)*.3))))
F.t.setAttribute('baseFrequency',(.006+Math.sin(k*9)*.004)+' '+(.012+Math.cos(k*7)*.006))
if(k<1.1)requestAnimationFrame(tick)
else app.style.filter=''
}
tick()
setTimeout(()=>{
if(!bk)return
els.forEach((e,i)=>{
const r=e.getBoundingClientRect()
const dx=bx-(r.left+r.width/2),dy=by-(r.top+r.height/2)
e.style.transition='transform 1.5s cubic-bezier(.65,0,.9,.35) '+(i*70)+'ms,opacity 1.2s ease '+(i*70+300)+'ms,filter 1.2s ease '+(i*70)+'ms'
e.style.transform='translate('+dx+'px,'+dy+'px) scale(.02) rotate('+((i%2?1:-1)*(180+i*25))+'deg)'
e.style.opacity='0'
e.style.filter='blur(8px) hue-rotate(120deg)'
})
setTimeout(()=>{if(bk)els.forEach(e=>{e.style.visibility='hidden'})},2400+els.length*70)
},1300)
box.classList.add('tes-ar')
}else{
box.classList.remove('tes-ar')
const b=bk
bk=null
if(!b)return
app.style.filter=''
b.els.forEach((e,i)=>{e.style.visibility=b.old[i][4];e.style.transition='transform .9s cubic-bezier(.2,.8,.2,1) '+(i*50)+'ms,opacity .8s ease '+(i*50)+'ms,filter .8s ease';e.style.transform=b.old[i][0];e.style.opacity=b.old[i][1];e.style.filter=b.old[i][2]})
setTimeout(()=>b.els.forEach((e,i)=>{e.style.transition=b.old[i][3]}),1800)
}
}
let sl=null
const scan=()=>{
if(sl)return sl
const c=document.createElement('canvas');c.width=4;c.height=4
const g=c.getContext('2d');g.fillStyle='rgba(0,0,0,.5)';g.fillRect(0,0,4,1)
sl=c
return c
}
export function arenaFx(ctx,cv,W,H,D,Z,cx,cy,t,k,lite){
ctx.save()
ctx.setTransform(D,0,0,D,0,0)
ctx.fillStyle='rgba(6,0,22,'+(.6*k)+')'
ctx.fillRect(0,0,W,H)
ctx.globalCompositeOperation='lighter'
const st=70*Z,ox=-((cx*Z)%st),oy=-((cy*Z)%st)
ctx.lineWidth=1.6
for(let x=ox;x<W;x+=st){ctx.strokeStyle='rgba(0,255,220,'+((.16+.1*Math.sin(t*2+x*.02))*k)+')';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
for(let y=oy;y<H;y+=st){ctx.strokeStyle='rgba(255,60,200,'+((.16+.1*Math.sin(t*2+y*.02))*k)+')';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
const n=lite?5:11
for(let i=0;i<n;i++){
const bx=((i*977+t*(8+i*2))%(W+160))-80,by=((i*533)%H)+Math.sin(t*.7+i)*30
ctx.strokeStyle='rgba(120,255,235,'+(.5*k)+')'
ctx.lineWidth=1.2
for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(bx,by,26,9,j*Math.PI/3+t*.6,0,TAU);ctx.stroke()}
ctx.fillStyle='rgba(255,255,255,'+(.8*k)+')'
ctx.beginPath();ctx.arc(bx,by,3.2,0,TAU);ctx.fill()
for(let j=0;j<3;j++){const a=t*2.2+j*TAU/3+i,ex=Math.cos(a)*26,ey=Math.sin(a)*9,r=j*Math.PI/3+t*.6,rx=ex*Math.cos(r)-ey*Math.sin(r),ry=ex*Math.sin(r)+ey*Math.cos(r);ctx.fillStyle='rgba(255,90,220,'+k+')';ctx.beginPath();ctx.arc(bx+rx,by+ry,2.2,0,TAU);ctx.fill()}
}
ctx.globalCompositeOperation='source-over'
const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75)
g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(90,0,160,'+(.55*k)+')')
ctx.fillStyle=g;ctx.fillRect(0,0,W,H)
ctx.restore()
if(lite)return
ctx.save()
ctx.setTransform(1,0,0,1,0,0)
const w=cv.width,hh=cv.height
for(let i=0;i<7;i++){
const y=Math.floor(Math.random()*hh),sh=Math.floor(hh*(.01+Math.random()*.04)),dx=Math.floor((Math.random()-.5)*60*D*k)
if(Math.random()<.55)ctx.drawImage(cv,0,y,w,sh,dx,y,w,sh)
}
const bands=14,bw=Math.ceil(w/bands)
for(let i=0;i<bands;i++){
const dy=Math.round(Math.sin(t*2.6+i*.9)*5*D*k)
if(dy)ctx.drawImage(cv,i*bw,0,bw,hh,i*bw,dy,bw,hh)
}
ctx.globalAlpha=.22*k
ctx.fillStyle=ctx.createPattern(scan(),'repeat')
ctx.fillRect(0,0,w,hh)
ctx.restore()
}
export function tesvin(ctx,e,t,pp,tg){
const b=Math.sin(t*3)*4,gl=Math.random()<.06+(tg>0?.2:0)
tvBody(ctx,e.x,e.y-34+b,1,t,{m2:pp>=3?2:pp>=2?1:0,gl:gl?1:0,eyes:tg>0?2:0,sip:pp>=3?1:0})
}
export function kandieDraw(ctx,spr,x,y,t){
const bob=Math.sin(t*5)*1.6
ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+2,10,3.6,0,0,TAU);ctx.fill()
const lw=spr.lw||spr.width,lh=spr.lh||spr.height
ctx.drawImage(spr,x-lw/2,y-lh+3+bob,lw,lh)
}
export function bubble(ctx,x,y,text,k,col){
ctx.save()
ctx.globalAlpha=Math.min(1,k*3)
ctx.font='700 11px system-ui,sans-serif'
const w=Math.min(190,ctx.measureText(text).width+16)
const words=text.split(' '),lines=[]
let cur=''
for(const wd of words){if(ctx.measureText(cur+' '+wd).width>w-12&&cur){lines.push(cur);cur=wd}else cur=cur?cur+' '+wd:wd}
lines.push(cur)
const hh=lines.length*13+8,bx=x-w/2,by=y-hh-8
ctx.fillStyle='rgba(20,10,28,.92)';ctx.strokeStyle=col||'#ff9ac2';ctx.lineWidth=1.5
ctx.beginPath();ctx.roundRect(bx,by,w,hh,6);ctx.fill();ctx.stroke()
ctx.beginPath();ctx.moveTo(x-4,by+hh);ctx.lineTo(x,by+hh+6);ctx.lineTo(x+4,by+hh);ctx.fill()
ctx.fillStyle='#ffe0ee';ctx.textAlign='center'
lines.forEach((l,i)=>ctx.fillText(l,x,by+14+i*13))
ctx.restore()
}
