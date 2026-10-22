import{now,newId,msgId}from'./util.js'
import{signMsg}from'./sign.js'
import{ALL,DEFAULT,P}from'./perms.js'
const ORDER=[
['Start here',[['welcome','rules','Start here. What Parley is and how this server works.'],['rules','rules','Read these first.'],['announcements','announce','Official news from the Parley team.'],['changelog','announce','Every release, in plain language.'],['roadmap','announce','What we are building next.'],['faq','rules','Quick answers to common questions.'],['links','rules','Official links and resources.'],['introductions','text','Say who you are and what you like.']]],
['Community',[['general','text','Chat about anything Parley.'],['off-topic','text','Everything else.'],['media','text','Share art, clips, screenshots and music.'],['polls','text','Community polls and votes.'],['events','announce','Community events, game nights and stage sessions.']]],
['Pars shop and looks',[['pars-shop','text','Talk about the Pars shop, bundles and limited drops.'],['show-your-style','text','Frames, nameplates, bundles. Show your look.'],['gifting','text','Gift swaps, thank yous and wishlists.']]],
['Feedback',[['feedback','text','Tell us what you think of Parley.'],['suggestions','text','Ideas for new features.'],['bug-reports','text','Found something broken? Tell us what happened and how to repeat it.']]],
['Help and building',[['support','text','Questions about using Parley.'],['bots-and-apps','text','Bots, apps and the bot lab.'],['developers','text','API, plugins, hooks and building on Parley.'],['self-hosting','text','Running your own Parley on Cloudflare.']]],
['Voice and stages',[['Lounge','voice',''],['Gaming','voice',''],['Study room','voice',''],['Music','voice',''],['Community stage','stage','Live Q&A and announcements.'],['Office hours','stage','Talk to the team. Raise your hand to ask a question.'],['AFK','voice','']]]
]
const ROLES=[['Parley Team','#a78bfa',ALL,70],['Moderator','#34d399',DEFAULT|P.MANAGE_MESSAGES|P.KICK|P.MODERATE|P.MANAGE_VOICE,60],['Contributor','#f59e0b',DEFAULT,50],['Supporter','#f472b6',DEFAULT,40],['Early Member','#60a5fa',DEFAULT,30]]
const WELCOME=`# Welcome to Parley\n\n**Parley is a free, open Discord alternative.** Servers, voice, stages, forums, bots, a full shop of cosmetics earned just by using the app, and none of it behind a paywall.\n\n## Start here\n- Read the **rules** and the **faq**\n- Say hello in **introductions**\n- Chat in **general** and share your look in **show-your-style**\n- Found a bug? Post it in **bug-reports**. Have an idea? Use **suggestions**\n- Join **Community stage** or **Office hours** to talk to the team live\n\n## How the server is organised\n**Start here** has the essentials. **Community** is for chat. **Pars shop and looks** is for cosmetics. **Feedback** and **Help and building** are for improving and extending Parley. **Voice and stages** is where we talk.`
const FAQ=`## Frequently asked questions\n\n**Is Parley really free?**\nYes. Everything runs on free Cloudflare services. Pars are earned by using the app, they cannot be bought with money.\n\n**How do I earn Pars?**\nYou earn Pars for every hour you actively use Parley, up to a daily cap. Spend them in the **Pars shop** on frames, nameplates, effects, name styles, badges, titles, message styles and bundles.\n\n**What are Legacy and Modern bundles?**\nLegacy is the classic set built from regular shop items. Modern adds titles and message styles that are only available inside bundles. You can own both.\n\n**Can I gift items?**\nYes. Use the gift button on any item, bundle or Pars balance. Gifts play a short unwrapping animation the next time the recipient is online.\n\n**What is a stage channel?**\nA voice channel with speakers and an audience. Join as a listener, raise your hand, then unmute to speak.\n\n**How do I report a problem?**\nPost in **bug-reports** with what happened, what you expected and how to repeat it. For abuse, message a moderator.`
const LINKS=`## Official links\n\n- **Parley app:** https://parley.heavengtwashere.workers.dev\n- **Source and releases:** https://github.com/ScratchyGH/parley\n- **What is new:** open Settings, then use the release notes shown after each update\n\nIf a link is shared here by anyone claiming to be Parley staff and it does not match the ones above, do not open it and tell a moderator.`
const ROADMAP=`## Roadmap\n\n**Shipped**\n- Full-screen Settings and Pars shop\n- Legacy and Modern bundles, gifting and the Timeskipper bundle\n- Stage and rules channels\n- Loadouts: mix any frame, effect, nameplate, name style, badge, title and message style\n\n**In progress**\n- More avatar frames, effects and nameplates\n- Stage moderation tools\n- More community events\n\n**Ideas we are weighing**\n- Server-wide cosmetic events\n- Shop wishlists\n\nHave a suggestion? Post it in **suggestions**.`
const CHANGELOG=`## Release notes\n\n**2026.10.28**\n- Parley Community server, stage channels and rules channels\n- Legacy and Modern versions of every bundle\n- Loadout picker in Settings, Appearance\n- Parli-Bold display font\n\n**2026.10.27**\n- Rebuilt, full-screen Pars shop with gifting\n- Timeskipper limited-time bundle\n- Titles, message styles and new name styles\n- More message formatting options`
const EVENTS=`## Community events\n\nOffice hours run on **Office hours** stage. Raise your hand to ask the team anything. Game nights and build-alongs are announced here first.`
const SHOP=`## Pars shop guide\n\n- **Frames and effects** change how your avatar looks everywhere.\n- **Nameplates and name styles** change how your name looks in chat.\n- **Badges and titles** sit next to your name.\n- **Message styles** change your message bubbles.\n- **Bundles** are themed sets with a Legacy and a Modern version.\n\nOpen **Settings, Appearance** to mix any items you own into a look.`
const SUPPORT=`## Getting help\n\nAsk your question here with as much detail as you can: what you tried, what you saw and which device or browser you use. Screenshots help. A moderator or another member will reply when they can.`
const INTRO=`## Introductions\n\nTell us who you are: what you play, build or make, and what you hope to do on Parley.`
const GENERAL=`Welcome to the Parley Community! Say hi, tell us what you are building or just hang out.`
const STYLE=`Post screenshots of your frame, nameplate, name style and message style combos here. Settings, then Appearance lets you mix any items you own.`
const POSTS={welcome:[WELCOME,1],faq:[FAQ,1],links:[LINKS,1],roadmap:[ROADMAP,1],changelog:[CHANGELOG,1],events:[EVENTS,0],'pars-shop':[SHOP,1],support:[SUPPORT,1],introductions:[INTRO,1],general:[GENERAL,0],'show-your-style':[STYLE,1]}
export async function extendCommunity(c,s,ownerId){
const db=c.env.DB,t=now()
if(await db.prepare("select 1 x from auto_joined where server_id=? and user_id in('__community_v3','__community_v3:'||?)").bind(s.id,s.id).first())return
const cats=(await db.prepare('select id,name from categories where server_id=?').bind(s.id).all()).results
const chans=(await db.prepare('select id,name,type from channels where server_id=?').bind(s.id).all()).results
let ci=0,pos=0
const made={}
for(const[cn,list]of ORDER){
let cat=cats.find(x=>x.name.toLowerCase()===cn.toLowerCase())
if(!cat){cat={id:newId('ct'),name:cn};await db.prepare('insert into categories(id,server_id,name,position) values(?,?,?,?)').bind(cat.id,s.id,cn,ci).run();cats.push(cat)}
else await db.prepare('update categories set position=? where id=?').bind(ci,cat.id).run()
ci++
for(const[name,type,topic]of list){
let ch=chans.find(x=>x.name.toLowerCase()===name.toLowerCase())
const ro=type==='rules'||type==='announce'?1:0
if(!ch){ch={id:newId('ch'),name,type};await db.prepare('insert into channels(id,server_id,category_id,name,type,topic,position,readonly,created_at) values(?,?,?,?,?,?,?,?,?)').bind(ch.id,s.id,cat.id,name,type,topic,pos,ro,t).run();chans.push(ch)}
else{
await db.prepare("update channels set category_id=?,position=?,topic=case when topic is null or topic='' then ? else topic end where id=?").bind(cat.id,pos,topic,ch.id).run()
if(ch.type==='text'&&type==='rules'||ch.type==='text'&&type==='announce')await db.prepare('update channels set type=?,readonly=1 where id=?').bind(type,ch.id).run()
}
pos++
made[name]=ch.id
}
}
const have=(await db.prepare('select name from roles where server_id=?').bind(s.id).all()).results.map(x=>x.name)
let owner=null
for(const[name,color,perms,position]of ROLES){
if(have.includes(name))continue
const id=newId('r')
await db.prepare('insert into roles(id,server_id,name,color,position,perms,is_everyone) values(?,?,?,?,?,?,0)').bind(id,s.id,name,color,position,perms).run()
if(name==='Parley Team')owner=id
}
if(owner)await db.prepare('insert or ignore into member_roles(server_id,user_id,role_id) values(?,?,?)').bind(s.id,ownerId,owner).run()
let i=10
for(const[room,[content,pin]]of Object.entries(POSTS)){
const rid=made[room]
if(!rid)continue
if((await db.prepare('select count(*) n from messages where room=?').bind(rid).first()).n>0)continue
const id=msgId(),ts=t+i++
await db.prepare('insert into messages(id,room,server_id,author_id,content,created_at,sig) values(?,?,?,?,?,?,?)').bind(id,rid,s.id,ownerId,content,ts,await signMsg(c.env,{id,room:rid,author_id:ownerId,created_at:ts,edited_at:null,content})).run()
if(pin)await db.prepare('update messages set pinned=1 where id=?').bind(id).run().catch(()=>{})
}
await db.prepare("insert or ignore into auto_joined(user_id,server_id,created_at) values('__community_v3:'||?,?,?)").bind(s.id,s.id,t).run()
}
