import{privacyDialog,termsDialog}from'./legal.js'
import{h,mount,icon,GET,POST,PATCH,DEL,avatar,heroBox,toast,fail,closeTopDialog,confirmBox,field,toggle,copyText,saveBlob,fmtRel}from'./util.js'
import{gifPicker,importGif}from'./gifs.js'
import{historyBox}from'./imghist.js'
import{accountsList,addAccountDialog}from'./accounts.js'
import{adminView}from'./admin.js'
import{S,P,can,emit,applySettings,setting,loadFriends,cacheUser,FONTS,PRESETS}from'./state.js'
import{uploadImage}from'./dialogs.js'
import{pickCropped}from'./cropper.js'
import{passkeysSupported,registerPasskey}from'./webauthn.js'
import{go}from'./nav.js'
import{voiceSettingsView}from'./voice.js'
import{requestDesktop,testDesktop}from'./notify.js'
import{pref,setPref}from'./prefs.js'
import{p2pStats,clearP2PCache,startP2P,stopP2P}from'./p2p/index.js'
import{nativeSupport}from'./codec.js'
import{labsPage}from'./labs.js'
import{parsPage,loadoutBox}from'./pars.js'
import{pushSupported,pushEnabled,pushEnable,pushDisable}from'./pushclient.js'

const PAGES=[
['account','My account'],['profile','Profile'],['appearance','Appearance'],['notifications','Notifications'],['bots','Bots'],['network','Network and P2P'],['media','Images and uploads'],['privacy','Privacy and safety'],['voice','Voice and video'],['apps','Apps'],['sessions','Sessions'],['data','Data and deletion']
]

async function saveSettings(patch){
const d=await PATCH('/api/me',{settings:patch})
S.me=d.user
applySettings()
emit('settings')
}
async function saveProfile(patch){
const d=await PATCH('/api/me',patch)
S.me=d.user
cacheUser(S.me)
emit('settings')
return d.user
}
const row=(label,sub,control)=>h('div',{class:'row sp',style:{padding:'8px 0',borderBottom:'1px solid var(--border)'}},h('div',null,h('div',{style:{color:'var(--strong)'}},label),sub?h('div',{class:'hint',style:{margin:0}},sub):null),control)
const sw=(key,def,label,sub,after)=>row(label,sub,toggle(setting(key,def),async v=>{try{await saveSettings({[key]:v});after?.(v)}catch(e){fail(e)}},label))

export function openSettings(page='account'){go('/settings/'+page)}

export function settingsPage(r,topBar,icon_){
const cur=PAGES.some(x=>x[0]===r.page)||r.page==='labs'||r.page==='admin'?r.page:'account'
let labs=false
const nav=h('nav',{'aria-label':'Settings sections'})
const pg=h('div',{class:'pg'})
const drawNav=()=>mount(nav,[...PAGES,...(labs?[['labs','Experimental']]:[]),...(S.me.admin?[['admin','Admin']]:[])].map(([k,l])=>h('button',{class:cur===k?'on':'','aria-current':cur===k?'page':null,on:{click:()=>go('/settings/'+k)}},l)),
h('h4',null,'Session'),
h('button',{on:{click:async()=>{
try{await POST('/api/auth/logout',{})}catch{}
location.href='/'
}}},'Log out'))
drawNav()
const fn={apps:appsPage,pars:parsPage,account,profile,appearance,notifications,bots,network,media,privacy,voice,sessions,data,labs:labsPage,admin:adminView}[cur]
mount(pg)
fn(pg,{close:()=>go('/')})
GET('/api/lab/status').then(x=>{if(x.labs){labs=true;drawNav()}}).catch(()=>{})
const bar=topBar({lead:icon_('sliders'),title:'Settings',topic:'Your account and app'})
return{nodes:[bar,h('div',{class:'split sp-page'},nav,pg)],title:'Settings • Parley',ready:Promise.resolve()}
}

function pushRow(){
const box=h('div')
async function draw(){
if(!pushSupported()){mount(box,row('Push notifications','This browser does not support Web Push.',h('span',{class:'hint'},'Unavailable')));return}
const st=await pushEnabled().catch(()=>({configured:false,on:false}))
if(!st.configured){mount(box,row('Push notifications','The server operator has not set VAPID keys, so push is off on this deployment.',h('span',{class:'hint'},'Not configured')));return}
mount(box,row('Push notifications','Delivers mentions and direct messages while Parley is closed, through your browser vendor push service. Message text is encrypted end to end to your browser.',toggle(st.on,async v=>{try{if(v)await pushEnable();else await pushDisable()}catch(e){fail(e)}draw()},'Push notifications')))
}
draw()
return box
}

function twofa(box){
const me=S.me
const out=h('div')
const pw=h('input',{class:'inp',type:'password',autocomplete:'current-password','aria-label':'Password'})
const code=h('input',{class:'inp',inputmode:'numeric',autocomplete:'one-time-code',maxLength:24,placeholder:'Code','aria-label':'Authenticator or backup code'})
const err=h('div',{class:'err',role:'alert'})
const refresh=async()=>{const d=await GET('/api/me');S.me=d.user;account(box.parentElement)}
if(!me.totp_on){
mount(box,h('h3',{style:{marginTop:'24px'}},'Two-factor authentication'),h('p',{class:'hint'},'Adds a 6-digit code from an authenticator app (Google Authenticator, Aegis, 1Password and similar) at sign-in. You get 8 single-use backup codes. If you lose both the app and the codes, a recovery code cannot bypass 2FA.'),
h('div',{class:'row'},pw,h('button',{class:'btn',on:{click:async()=>{
err.textContent=''
try{
const r=await POST('/api/me/2fa/setup',{password:pw.value})
pw.value=''
mount(out,h('p',null,'Add this secret to your authenticator app as a time-based (TOTP) account, or open the link on a device that has one:'),
h('div',{class:'card',style:{fontFamily:'var(--mono)',userSelect:'all',wordBreak:'break-all'}},r.secret),
h('a',{href:r.uri,class:'btn sm',style:{marginTop:'6px'}},'Open in authenticator app'),
field('Enter the 6-digit code to confirm',code),
h('button',{class:'btn pri',on:{click:async()=>{
err.textContent=''
try{
const e=await POST('/api/me/2fa/enable',{code:code.value.trim()})
mount(out,h('p',null,'Two-factor authentication is on. Save these backup codes now; each works once and they will not be shown again.'),h('div',{class:'card',style:{fontFamily:'var(--mono)',userSelect:'all',whiteSpace:'pre-line'}},e.backup_codes.join('\n')),h('button',{class:'btn sm',style:{marginTop:'6px'},on:{click:()=>copyText(e.backup_codes.join('\n'))}},'Copy codes'),h('button',{class:'btn sm',style:{marginTop:'6px',marginLeft:'6px'},on:{click:()=>refresh().catch(fail)}},'Done'))
}catch(x){err.textContent=x.message}
}}},'Turn on'))
}catch(x){err.textContent=x.message}
}}},'Start setup')),out,err)
}else{
mount(box,h('h3',{style:{marginTop:'24px'}},'Two-factor authentication'),h('p',{class:'hint'},'Two-factor authentication is on. To turn it off enter your password and a current code or a backup code.'),
h('div',{class:'row'},pw,code,h('button',{class:'btn dng',on:{click:async()=>{
err.textContent=''
try{await POST('/api/me/2fa/disable',{password:pw.value,code:code.value.trim()});toast('Two-factor authentication turned off','ok');await refresh()}catch(x){err.textContent=x.message}
}}},'Turn off')),err)
}
}

async function signin(box){
let d
try{d=await GET('/api/me/security')}catch{return}
const redraw=()=>signin(box)
const del=async(url,msg)=>{try{await DEL(url);toast(msg,'ok');redraw()}catch(e){fail(e)}}
const linked=new Set(d.identities.map(i=>i.provider))
const pw1=h('input',{class:'inp',type:'password',autocomplete:'new-password',placeholder:'New password (10+ characters)','aria-label':'New password'})
const out=h('div')
mount(box,h('h3',{style:{marginTop:'24px'}},'Sign-in methods'),
d.has_password?null:h('div',{class:'card',style:{marginBottom:'8px'}},h('p',{class:'hint',style:{marginTop:0}},'This account signs in through a linked service or passkey and has no password. Set one to be able to recover it and to delete the account with it.'),h('div',{class:'row'},pw1,h('button',{class:'btn',on:{click:async()=>{
try{const r=await POST('/api/me/setpassword',{password:pw1.value});mount(out,h('p',null,'Password set. Your recovery code, shown once:'),h('div',{class:'card',style:{fontFamily:'var(--mono)',userSelect:'all'}},r.recovery_code));pw1.value=''}catch(e){fail(e)}
}}},'Set password')),out),
h('div',{class:'list'},
d.identities.map(i=>h('div',{class:'li'},h('div',{class:'grow'},h('b',null,i.name),h('small',null,i.label||'Linked')),h('button',{class:'btn sm dng',on:{click:()=>del('/api/me/identities/'+i.provider,i.name+' unlinked')}},'Unlink'))),
d.providers.filter(p=>!linked.has(p.id)).map(p=>h('div',{class:'li'},h('div',{class:'grow'},h('b',null,p.name),h('small',null,'Not linked')),h('a',{class:'btn sm',href:'/api/auth/oauth/'+p.id+'/start?mode=link'},'Link'))),
d.passkeys.map(k=>h('div',{class:'li'},icon('lock'),h('div',{class:'grow'},h('b',null,k.name),h('small',null,'Added '+fmtRel(k.created_at)+(k.last_used?' · used '+fmtRel(k.last_used):''))),h('button',{class:'btn sm dng',on:{click:()=>del('/api/me/passkeys/'+encodeURIComponent(k.id),'Passkey removed')}},'Remove')))),
passkeysSupported()?h('div',{style:{marginTop:'8px'}},h('button',{class:'btn',on:{click:async e=>{
const b=e.currentTarget
b.disabled=true
try{await registerPasskey(S.me.username+' passkey');toast('Passkey added','ok');redraw()}catch(x){if(!x.cancelled)fail(x);b.disabled=false}
}}},icon('plus','s'),'Add a passkey'),h('div',{class:'hint'},'Passkeys use your device lock or a security key. Only ES256 keys are supported.')):h('div',{class:'hint'},'This browser does not support passkeys.'))
}

function account(pg){
const err=h('div',{class:'err'})
const un=h('input',{class:'inp',value:S.me.username,maxLength:24})
const cp=h('input',{class:'inp',type:'password',autocomplete:'current-password'})
const np=h('input',{class:'inp',type:'password',autocomplete:'new-password'})
const out=h('div')
mount(pg,h('h3',null,'My account'),
field('Username',h('div',{class:'row'},un,h('button',{class:'btn',on:{click:async()=>{try{await saveProfile({username:un.value.trim()});toast('Username changed','ok')}catch(e){fail(e)}}}},'Change'))),
h('div',{class:'hint'},'You can change your username 3 times per day.'),
h('h3',{style:{marginTop:'24px'}},'Accounts on this device'),
h('p',{class:'hint'},'Stay signed in to more than one account and switch between them without logging out.'),
h('div',{id:'accs'}),
h('div',{style:{marginTop:'8px'}},h('button',{class:'btn',on:{click:()=>addAccountDialog()}},icon('plus','s'),'Add an account')),
h('h3',{style:{marginTop:'24px'}},'Change password'),
field('Current password',cp),field('New password',np,'At least 10 characters. Other devices will be signed out.'),
h('div',{style:{marginTop:'8px'}},h('button',{class:'btn pri',on:{click:async()=>{
try{await POST('/api/me/password',{current_password:cp.value,new_password:np.value});cp.value=np.value='';toast('Password changed','ok')}catch(e){fail(e)}
}}},'Change password')),
h('div',{id:'tfa'}),
h('div',{id:'sgn'}),
h('h3',{style:{marginTop:'24px'}},'Recovery code'),
h('p',{class:'hint'},'Generating a new code invalidates the previous one. Store it somewhere safe; it is the only way to reset a forgotten password.'),
h('div',{class:'row'},(()=>{
const pw=h('input',{class:'inp',type:'password',placeholder:'Confirm password','aria-label':'Password to confirm'})
const b=h('button',{class:'btn',on:{click:async()=>{
try{
const r=await POST('/api/me/recovery',{password:pw.value})
pw.value=''
mount(out,h('div',{class:'card',style:{fontFamily:'var(--mono)',fontSize:'16px',userSelect:'all',marginTop:'8px'}},r.recovery_code),h('button',{class:'btn sm',style:{marginTop:'8px'},on:{click:()=>copyText(r.recovery_code)}},'Copy'))
}catch(e){fail(e)}
}}},'Generate new code')
return[pw,b]
})()),out)
accountsList().then(l=>mount(pg.querySelector('#accs'),l))
twofa(pg.querySelector('#tfa'))
signin(pg.querySelector('#sgn'))
}

function profile(pg){
const dn=h('input',{class:'inp',value:S.me.display_name,maxLength:32})
const pr=h('input',{class:'inp',value:S.me.pronouns||'',maxLength:32})
const st=h('input',{class:'inp',value:S.me.status_text||'',maxLength:100})
const bio=h('textarea',{class:'inp',rows:4,maxLength:500},S.me.bio||'')
const SW=['#8b949e','#521525','#57ab5a','#c69026','#e5534b','#986ee2','#c96198','#6cb6ff','#4a5463']
let accent=S.me.accent||''
const c1=h('input',{type:'color','aria-label':'Profile colour 1',value:(accent.split(',')[0])||'#521525',on:{input:()=>setCustom()}})
const c2=h('input',{type:'color','aria-label':'Profile colour 2',value:(accent.split(',')[1])||'#212829',on:{input:()=>setCustom()}})
let grad=accent.includes(',')
const gt=toggle(grad,v=>{grad=v;setCustom()},'Gradient')
const setCustom=()=>{accent=grad?c1.value+','+c2.value:c1.value;drawSw();drawPrev()}
const sw_=h('div',{class:'swatches',role:'group','aria-label':'Profile colour'})
const prev=h('div')
function drawSw(){
mount(sw_,SW.map(c=>h('button',{type:'button',style:{background:c},'aria-pressed':String(accent===c),'aria-label':c,on:{click:()=>{accent=c;c1.value=c;grad=false;drawSw();drawPrev()}}})),h('button',{type:'button',class:'btn sm',on:{click:()=>{accent='';drawSw();drawPrev()}}},'Auto'))
}
function drawPrev(){
const u={...S.me,display_name:dn.value,pronouns:pr.value,status_text:st.value,bio:bio.value,accent:accent||null}
const hero=heroBox(accent,S.me.banner_id)
mount(prev,h('div',{class:'pcard card',style:{padding:0}},hero,h('div',{class:'bd'},avatar(u,'lg'),h('h3',{style:{margin:'8px 0 0',color:'var(--strong)'}},u.display_name),h('div',{class:'hint',style:{margin:0}},'@'+u.username+(u.pronouns?' · '+u.pronouns:'')),u.status_text?h('div',null,u.status_text):null,u.bio?h('div',{class:'hint'},u.bio):null)))
}
for(const i of[dn,pr,st,bio])i.addEventListener('input',drawPrev)
const hist={avatar:historyBox('avatar',()=>S.me.avatar_id,id=>saveProfile({avatar_id:id}).then(drawPrev)),banner:historyBox('banner',()=>S.me.banner_id,id=>saveProfile({banner_id:id}).then(drawPrev))}
const setImage=async(kind,key,label,get)=>{
try{const up=await get();if(!up)return;await saveProfile({[key]:up.id});drawPrev();hist[kind].reload();toast(label+' updated','ok')}catch(e){fail(e)}
}
const img=(kind,key,label)=>h('div',null,h('div',{class:'row',style:{flexWrap:'wrap'}},
h('button',{class:'btn',on:{click:()=>setImage(kind,key,label,async()=>{
const f=await pickCropped(kind==='avatar'?{aspect:1,round:true,width:512,title:'Crop avatar'}:{aspect:3,width:1500,title:'Crop banner'})
return f?uploadImage(kind,{},f):null
})}},'Upload '+label.toLowerCase()),
h('button',{class:'btn',on:{click:()=>gifPicker({title:'Choose a GIF for your '+label.toLowerCase(),onPick:g=>setImage(kind,key,label,()=>importGif(g,kind))})}},icon('gif','s'),'Pick a GIF'),
S.me[key]?h('button',{class:'btn',on:{click:async()=>{try{await saveProfile({[key]:null});drawPrev();hist[kind].reload()}catch(e){fail(e)}}}},'Remove'):null),
h('div',{class:'hint',style:{margin:'10px 0 6px'}},'Past '+label.toLowerCase()+'s. Select one to use it again.'),hist[kind].el)
const DAY=86400000
const tagSel=h('select',{class:'sel','aria-label':'Server tag',on:{change:async e=>{try{await saveProfile({tag_server:e.target.value||null});toast('Tag updated','ok')}catch(x){fail(x)}}}},h('option',{value:''},'None'),S.servers.filter(x=>x.tag).map(x=>h('option',{value:x.id,selected:S.me.tag_server===x.id},x.tag+' ('+x.name+')')))
const sel=h('select',{class:'sel','aria-label':'Clear status after'},
(S.me.status_until?[h('option',{value:'keep'},'Clears '+new Date(S.me.status_until).toLocaleString([], {weekday:'short',hour:'numeric',minute:'2-digit'}))]:[]),
[['','Never'],['1800000','In 30 minutes'],['3600000','In 1 hour'],['14400000','In 4 hours'],['today','Today'],['604800000','In 7 days']].map(([v,l])=>h('option',{value:v},l)))
if(S.me.status_until)sel.value='keep'
const untilOf=()=>{
if(sel.value==='keep')return S.me.status_until
if(sel.value==='')return null
if(sel.value==='today'){const d=new Date();d.setHours(23,59,59,0);return d.getTime()}
return Date.now()+Number(sel.value)
}
let links=(S.me.links||[]).map(x=>({...x}))
const linkBox=h('div')
const drawLinks=()=>mount(linkBox,links.map((l,i)=>h('div',{class:'row',style:{marginBottom:'6px'}},
h('input',{class:'inp',value:l.label,maxLength:24,placeholder:'Label','aria-label':'Link label',style:{width:'34%'},on:{input:e=>{l.label=e.target.value}}}),
h('input',{class:'inp',value:l.url,maxLength:200,placeholder:'https://','aria-label':'Link address',on:{input:e=>{l.url=e.target.value}}}),
h('button',{class:'btn sm dng',type:'button','aria-label':'Remove link',on:{click:()=>{links.splice(i,1);drawLinks()}}},'×'))),
links.length<5?h('button',{class:'btn sm',type:'button',on:{click:()=>{links.push({label:'',url:'https://'});drawLinks()}}},icon('plus','s'),'Add a link'):null)
drawLinks()
mount(pg,h('h3',null,'Profile'),
h('div',{class:'row',style:{alignItems:'flex-start',flexWrap:'wrap'}},
h('div',{class:'grow',style:{minWidth:'240px'}},
field('Display name',dn),field('Pronouns',pr),field('Server tag',tagSel,'Show the short tag of a server you are in next to your name. Servers set their own tag.'),field('Status',st),field('Clear status',sel),field('About me',bio,'Markdown is supported.'),
field('Profile colour',sw_),h('div',{class:'row'},c1,h('span',{class:'hint',style:{margin:0}},'Custom'),gt,h('span',{class:'hint',style:{margin:0}},'Gradient'),c2),field('Links on your profile (https only, up to 5)',linkBox),field('Avatar (GIF supported, max 10 MB)',img('avatar','avatar_id','Avatar')),field('Banner (GIF supported, max 10 MB)',img('banner','banner_id','Banner')),
h('div',{style:{marginTop:'16px'}},h('button',{class:'btn pri',on:{click:async()=>{
try{
const until=st.value.trim()?untilOf():null
const body={display_name:dn.value.trim(),pronouns:pr.value.trim(),status_text:st.value.trim(),status_until:until&&until>Date.now()?until:null,links:links.filter(l=>l.label.trim()&&l.url.trim()&&l.url.trim()!=='https://').map(l=>({label:l.label.trim(),url:l.url.trim()})),bio:bio.value.trim(),accent:accent||null}
await saveProfile(body);toast('Profile saved','ok')
}catch(e){fail(e)}
}}},'Save profile'))),
h('div',{style:{position:'sticky',top:'0',width:'260px',flex:'none'}},h('label',{class:'f'},'Preview'),prev)))
drawSw();drawPrev()
}

function fontSel(key){
return h('select',{class:'sel','aria-label':key==='font_ui'?'Interface font':'Message font',style:{width:'auto'},on:{change:async e=>{try{await saveSettings({[key]:e.target.value})}catch(x){fail(x)}}}},Object.entries(FONTS).map(([k,[l,st]])=>h('option',{value:k,selected:setting(key,'')===k,style:{fontFamily:st}},l)))
}
function appearance(pg){
const themes=[['dimmed','Deep Fjord (default)'],['silver','Silver'],['light','Light'],['contrast','High contrast']]
const dens=[['compact','Compact'],['comfortable','Comfortable'],['spacious','Spacious']]
const fs=h('input',{type:'range',min:12,max:22,step:1,value:setting('font_size',15),'aria-label':'Message font size',on:{change:async e=>{try{await saveSettings({font_size:+e.target.value})}catch(x){fail(x)}}}})
mount(pg,h('h3',null,'Appearance and accessibility'),
field('Your look',loadoutBox()),
field('Theme',h('div',{class:'tabs',style:{flexWrap:'wrap'}},themes.map(([k,l])=>h('button',{class:setting('theme','dimmed')===k?'on':'','aria-pressed':String(setting('theme','dimmed')===k),on:{click:async e=>{try{await saveSettings({theme:k});appearance(pg)}catch(x){fail(x)}}}},l)))),
field('Theme presets',h('div',{class:'bh-radios pre-row'},Object.entries(PRESETS).map(([k,[l,th,ac,bg]])=>h('button',{type:'button',class:'preset'+(setting('preset','')===k?' on':''),'aria-pressed':String(setting('preset','')===k),style:{'--pa':ac,'--pb':bg||'#f6f8fa'},on:{click:async()=>{try{await saveSettings({theme:th,ui_color:ac,ui_bg:bg,preset:k});appearance(pg)}catch(x){fail(x)}}}},h('i'),h('span',null,l))),h('button',{type:'button',class:'btn sm',on:{click:async()=>{try{await saveSettings({preset:'',ui_color:'',ui_bg:''});appearance(pg)}catch(x){fail(x)}}}},'Clear preset')),'One click sets the theme, accent and background. You can still fine-tune the colours below.'),
field('Interface font',fontSel('font_ui')),
field('Message font',fontSel('font_msg'),'Fonts come from your device or from Parley, so nothing is loaded from other sites.'),
field('Message spacing',h('div',{class:'tabs'},dens.map(([k,l])=>h('button',{class:setting('density','comfortable')===k?'on':'','aria-pressed':String(setting('density','comfortable')===k),on:{click:async()=>{try{await saveSettings({density:k});appearance(pg)}catch(x){fail(x)}}}},l)))),
field('Font size',h('div',{class:'row'},fs,h('span',{class:'hint',style:{margin:0}},'12 to 22 px'))),
field('Custom colours',h('div',{class:'row'},
h('input',{type:'color','aria-label':'Accent colour',value:setting('ui_color','')||'#521525',on:{change:async e=>{try{await saveSettings({ui_color:e.target.value})}catch(x){fail(x)}}}}),h('span',{class:'hint',style:{margin:0}},'Accent'),
h('input',{type:'color','aria-label':'Background colour',value:setting('ui_bg','')||'#212829',on:{change:async e=>{try{await saveSettings({ui_bg:e.target.value})}catch(x){fail(x)}}}}),h('span',{class:'hint',style:{margin:0}},'Background'),
h('button',{class:'btn sm',on:{click:async()=>{try{await saveSettings({ui_color:'',ui_bg:''});appearance(pg)}catch(x){fail(x)}}}},'Reset')),'Applies to the dark themes only. Stored with your account.'),
sw('reduced_motion',matchMedia('(prefers-reduced-motion: reduce)').matches,'Reduce motion','Turns off transitions and animations. Follows your system setting until you change it.'),
sw('performance',false,'Performance mode','Turns off animations and avatar and nameplate effects, and pauses background work while the tab is hidden. Good for older computers and phones.'),
sw('link_previews',true,'Link previews','Fetch a title and description for the first link in a message. Requests go through Parley, not directly from your browser.'),
sw('send_ctrl_enter',false,'Send with Ctrl+Enter','Enter inserts a new line instead of sending.'))
}

function notifications(pg){
mount(pg,h('h3',null,'Notifications'),
sw('sound',true,'Notification sounds','A short tone for new mentions and direct messages while this tab is open.'),
sw('desktop',false,'Desktop notifications','Shown for mentions and direct messages when this tab is not focused. Works only while Parley is open in a browser tab.',async v=>{if(v){const ok=await requestDesktop();if(!ok){toast('Notifications are blocked in your browser settings','err');saveSettings({desktop:false}).then(()=>notifications(pg))}}}),
row('Test desktop notification','Sends one right now so you can check your browser and system settings.',h('button',{class:'btn sm',on:{click:async()=>{try{toast((await testDesktop())?'Sent. Look for it in your system notifications':'Notifications are blocked or unsupported in this browser',null)}catch(e){fail(e)}}}},'Send test')),
sw('dnd',false,'Do not disturb','Silences sounds and desktop notifications. Unread badges still show.'),
sw('quiet_on',false,'Quiet hours','Silence sounds and desktop notifications between the times below.'),
h('div',{class:'row',style:{padding:'8px 0'}},
field('From',h('input',{class:'inp',type:'time',value:setting('quiet_start','22:00'),on:{change:e=>saveSettings({quiet_start:e.target.value}).catch(fail)}})),
field('To',h('input',{class:'inp',type:'time',value:setting('quiet_end','07:00'),on:{change:e=>saveSettings({quiet_end:e.target.value}).catch(fail)}}))),
pushRow(),
h('p',{class:'hint'},'Mute or limit a server, channel or conversation by right-clicking it in the sidebar.'))
}

async function privacy(pg){
if(!S.fr.blocked.length)await loadFriends().catch(()=>{})
const sel=(key,opts,def)=>h('select',{class:'sel',style:{width:'auto'},on:{change:async e=>{try{await saveSettings({[key]:e.target.value})}catch(x){fail(x)}}}},opts.map(([v,l])=>h('option',{value:v,selected:setting(key,def)===v},l)))
mount(pg,h('h3',null,'Privacy and safety'),
h('div',{class:'row',style:{gap:'8px',marginBottom:'8px'}},h('button',{class:'btn sm',on:{click:privacyDialog}},'Privacy policy'),h('button',{class:'btn sm',on:{click:termsDialog}},'Terms of service')),
sw('diagnostics',false,'Send crash reports','Off by default. When on, errors in the app are reported to the people running this site. No message text is included.'),
row('Who can message you','Controls new direct messages from people who are not friends.',sel('dm_policy',[['everyone','Everyone (as a message request)'],['friends','Friends only'],['none','Nobody']],'everyone')),
row('Adult content (18+)','Lets you join and see servers marked 18+ Only. This is a statement you make about yourself; Parley does not check ID.',toggle(!!S.me.adult_ok,async v=>{
try{
if(v&&!await confirmBox('Confirm your age','Do you confirm that you are 18 or older?','I am 18 or older')){privacy(pg);return}
const r=await POST('/api/me/adult',{confirm:v});S.me.adult_ok=r.adult_ok
}catch(e){fail(e)}
privacy(pg)
},'Adult content')),
row('Who can send friend requests',null,sel('friend_policy',[['everyone','Everyone'],['none','Nobody']],'everyone')),
sw('show_presence',true,'Show online status','When off, you appear offline to others.'),
h('h3',{style:{marginTop:'24px'}},'Blocked users'),
h('div',{class:'list'},S.fr.blocked.length?S.fr.blocked.map(u=>h('div',{class:'li'},avatar(u,'sm'),h('div',{class:'grow'},u.display_name),h('button',{class:'btn sm',on:{click:async()=>{try{await DEL('/api/blocks/'+u.id);await loadFriends();privacy(pg)}catch(e){fail(e)}}}},'Unblock'))):h('div',{class:'hint'},'You have not blocked anyone.')))
}

function voice(pg){
mount(pg,h('h3',null,'Voice and video'),voiceSettingsView(),h('p',{class:'hint'},'Calls are peer to peer using WebRTC. Your IP address is visible to other participants unless the connection is relayed through TURN.'))
}

async function sessions(pg){
mount(pg,h('h3',null,'Sessions'),h('div',{class:'hint'},'Loading…'))
try{
const d=await GET('/api/sessions')
mount(pg,h('h3',null,'Sessions'),h('div',{class:'list'},d.sessions.map(s=>h('div',{class:'li'},icon('screen'),h('div',{class:'grow'},h('b',null,(s.ua||'Unknown device').slice(0,80)+(s.current?' (this device)':'')),h('small',null,`${s.ip||'unknown IP'} · active ${fmtRel(s.last_seen)}`)),
s.current?null:h('button',{class:'btn sm dng',on:{click:async()=>{try{await DEL('/api/sessions/'+s.id);sessions(pg)}catch(e){fail(e)}}}},'Sign out')))),
d.sessions.length>1?h('div',{style:{marginTop:'12px'}},h('button',{class:'btn dng',on:{click:async()=>{try{await DEL('/api/sessions');sessions(pg)}catch(e){fail(e)}}}},'Sign out all other devices')):null)
}catch(e){mount(pg,h('div',{class:'err'},e.message))}
}

function data(pg,dlg){
const pw=h('input',{class:'inp',type:'password',placeholder:'Confirm your password','aria-label':'Password'})
const err=h('div',{class:'err'})
mount(pg,h('h3',null,'Data and deletion'),
h('p',null,'Download a JSON file with your profile, memberships, friends and the messages you have written.'),
h('button',{class:'btn',on:{click:async()=>{
try{
const r=await fetch('/api/me/export',{credentials:'same-origin'})
if(!r.ok)throw new Error('Export failed')
saveBlob(await r.blob(),'parley-export.json')
}catch(e){fail(e)}
}}},icon('download','s'),'Export my data'),
h('h3',{style:{marginTop:'28px',color:'var(--err)'}},'Delete account'),
h('p',null,'Your profile is removed and your messages are anonymised. You must transfer or delete servers you own first. This cannot be undone.'),
field('Password',pw,'If your account has no password, type your username instead.'),err,
h('div',{style:{marginTop:'8px'}},h('button',{class:'btn dng',on:{click:async()=>{
err.textContent=''
if(!await confirmBox('Delete account','This permanently deletes your account.','Delete account',true))return
try{await POST('/api/me/delete',{password:pw.value,confirm:pw.value});location.href='/'}
catch(e){err.textContent=e.message+(e.data?.servers?': '+e.data.servers.map(s=>s.name).join(', '):'')}
}}},'Delete my account')))
}

const fmtB=n=>n>=1073741824?(n/1073741824).toFixed(2)+' GB':n>=1048576?(n/1048576).toFixed(1)+' MB':n>=1024?(n/1024).toFixed(0)+' KB':n+' B'
const ptog=(key,label,sub,after)=>row(label,sub,toggle(!!pref(key),v=>{setPref(key,v);after?.(v)},label))

function network(pg){
const stats=h('div',{class:'card'},'Loading…')
const refresh=async()=>{
try{
const s=await p2pStats()
mount(stats,h('div',null,`Connected peers: ${s.peers}`),h('div',null,`History pages from peers: ${s.pageCount} (${s.pageMsgs} messages, ${s.rejected} rejected)`),h('div',null,`Downloaded from peers: ${fmtB(s.peerBytes)} · from server: ${fmtB(s.serverBytes)}`),h('div',null,`Served to peers: ${fmtB(s.served)} · hash mismatches caught: ${s.mismatch}`),h('div',null,`Local cache: ${s.cached.messages} messages, ${s.cached.files} files, ${fmtB(s.cached.bytes)}`))
}catch(e){mount(stats,h('div',{class:'err'},e.message))}
}
mount(pg,h('h3',null,'Network and P2P'),
h('p',{class:'hint'},'Optional peer-to-peer acceleration over WebRTC. The server (D1 and R2) stays the source of truth and is always the fallback. Peers share cached message history and file segments only inside channels you both can view. Everything a peer gives you is verified: messages by the server signature, files by SHA-256. Off by default.'),
ptog('p2p','Enable P2P','Opens WebRTC connections to other online members of channels you have open.',v=>{if(v)startP2P();else stopP2P();refresh()}),
ptog('p2pHistory','Load history from peers','Try peers before the server when scrolling back. Peers can withhold messages, and a page may include messages deleted while that peer was offline until you refresh from the server.'),
ptog('p2pFiles','Download files from peers','Fetch 1 MiB segments from peers and the server in parallel, then verify the whole file hash.'),
ptog('p2pServe','Serve cached data to peers','Lets others fetch messages and files you have already cached. Uses your upload bandwidth.'),
ptog('p2pRelay','Relay-only connections','Hides your IP address from peers by forcing traffic through a TURN relay. Needs a TURN server, which this project does not provide, so connections may fail while this is on.'),
ptog('fastDl','Parallel downloads from the server','Use several range requests at once for large files.'),
row('Cache size limit','Least recently used blobs are evicted above this size.',h('select',{class:'sel',style:{width:'auto'},on:{change:e=>setPref('cacheMb',parseInt(e.target.value))}},[64,128,256,512,1024].map(v=>h('option',{value:v,selected:pref('cacheMb')===v},v+' MB')))),
h('h4',{style:{marginTop:'16px'}},'This session'),stats,
h('div',{class:'row',style:{marginTop:'8px'}},h('button',{class:'btn sm',on:{click:refresh}},'Refresh'),h('button',{class:'btn sm dng',on:{click:async()=>{await clearP2PCache();toast('Local cache cleared','ok');refresh()}}},'Clear local cache')),
h('p',{class:'hint'},'Privacy: WebRTC reveals your IP address to the peers you connect to. Nothing here has been tested across real networks yet.'))
refresh()
}

function media(pg){
const sel=(key,opts)=>h('select',{class:'sel',style:{width:'auto'},on:{change:e=>{setPref(key,typeof opts[0][0]==='number'?parseInt(e.target.value):e.target.value)}}},opts.map(([v,l])=>h('option',{value:v,selected:pref(key)===v},l)))
const nat=m=>nativeSupport(m)
mount(pg,h('h3',null,'Images and uploads'),
h('p',{class:'hint'},'Optimization re-encodes images in your browser before upload to make them smaller and faster to send. Animated images (GIF, APNG, animated WebP) are never re-encoded.'),
row('Re-encode images before upload','Off keeps your original file untouched.',sel('optimize',[['off','Off'],['webp','WebP'],['avif','AVIF (slower, smaller)'],['jxl','JPEG XL (slowest, smallest; viewers without native support decode it locally)']])),
row('Quality','Higher is larger.',sel('optQuality',[[60,'60'],[70,'70'],[80,'80'],[90,'90'],[95,'95']])),
row('Maximum dimension','Larger images are scaled down to fit.',sel('optMaxDim',[[1280,'1280 px'],[1920,'1920 px'],[2560,'2560 px'],[4096,'4096 px'],[16384,'No practical limit']])),
h('h4',{style:{marginTop:'16px'}},'Format support in this browser'),
h('div',{class:'card'},h('div',null,'JPEG XL: '+(nat('image/jxl')?'native':'decoded by a bundled WebAssembly decoder')),h('div',null,'AVIF: '+(nat('image/avif')?'native':'decoded by a bundled WebAssembly decoder')),h('div',null,'HEIC/HEIF: stored and downloadable, not displayed inline')),
h('p',{class:'hint'},'Uploads over 100 MB use a multipart upload with parallel parts and automatic retries. The per-file limit is set by the server operator.'))
}

async function bots(pg){
const out=h('div')
const list=h('div',{class:'list'})
const name=h('input',{class:'inp',maxLength:32,placeholder:'Bot name','aria-label':'Bot name'})
const manageable=()=>S.servers.filter(s=>S.sdata[s.id]&&can(s.id,P.MANAGE_SERVER))
const showToken=(t,note)=>mount(out,h('div',{class:'card',style:{marginTop:'8px'}},h('p',{class:'hint',style:{margin:'0 0 6px'}},note),h('code',{style:{wordBreak:'break-all',userSelect:'all'}},t),h('div',{style:{marginTop:'6px'}},h('button',{class:'btn sm',on:{click:()=>copyText(t)}},'Copy'))))
async function draw(){
try{
const r=await GET('/api/bots')
mount(list,r.bots.length?r.bots.map(b=>{
const sel=h('select',{class:'sel',style:{width:'auto'},'aria-label':'Server'},manageable().map(s=>h('option',{value:s.id},s.name)))
return h('div',{class:'li',style:{flexWrap:'wrap'}},h('div',{class:'grow'},h('b',null,b.display_name)),
sel,h('button',{class:'btn sm',on:{click:async()=>{try{await POST(`/api/servers/${sel.value}/bots/${b.id}`,{});toast('Bot added','ok')}catch(e){fail(e)}}}},'Add to server'),
h('button',{class:'btn sm',on:{click:async()=>{if(!await confirmBox('New token','The old token stops working immediately.','Regenerate',true))return;try{const t=await POST(`/api/bots/${b.id}/token`,{});showToken(t.token,'New token. It is shown once.')}catch(e){fail(e)}}}},'New token'),
h('button',{class:'btn sm dng',on:{click:async()=>{if(!await confirmBox('Delete bot','It leaves every server and its token stops working.','Delete',true))return;try{await DEL('/api/bots/'+b.id);draw()}catch(e){fail(e)}}}},'Delete'))
}):h('div',{class:'empty'},'No bots yet'))
}catch(e){mount(list,h('div',{class:'err'},e.message))}
}
mount(pg,h('h3',null,'Bots'),
h('div',{style:{marginBottom:'8px'}},h('button',{class:'btn pri',on:{click:()=>{closeTopDialog();go('/bots/mine')}}},'Open the Bots hub'),h('span',{class:'hint',style:{marginLeft:'8px'}},'Build, describe and list bots')),
h('p',{class:'hint'},'A bot is an account that posts through the HTTP API with an Authorization header: Bot <token>. Bots can read and send messages, react and upload files in servers they are added to, limited by their permissions. There is no gateway: bots poll the REST API or receive nothing in real time. Up to 5 bots.'),
h('div',{class:'row'},name,h('button',{class:'btn pri',on:{click:async()=>{try{const r=await POST('/api/bots',{name:name.value.trim()});name.value='';showToken(r.token,'Bot created. Copy the token now; it is shown once.');draw()}catch(e){fail(e)}}}},'Create bot')),out,list)
draw()
}

async function appsPage(pg){
mount(pg,h('h2',null,'Apps'),h('p',{class:'hint'},'Parley runs in your browser. These wrappers open the same site in their own window, so you always get the latest version.'),h('div',{class:'hint'},'Checking for downloads'))
let d={windows:null,linux:null,android:null}
try{d=await GET('/api/app/downloads')}catch{}
const dl=(label,sub,x,ext)=>h('div',{class:'card',style:{margin:'8px 0'}},h('b',null,label),h('div',{class:'hint'},sub),x?h('a',{class:'btn pri',href:x.url,rel:'noopener',download:''},'Download '+ext+' ('+(x.size/1048576).toFixed(0)+' MB)'):h('div',{class:'hint'},'Not published yet. The build runs from the repository Actions tab (Build apps), and the file appears here once it finishes.'))
mount(pg,h('h2',null,'Apps'),h('p',{class:'hint'},'Parley runs in your browser. These apps open the same site in their own window, so the site is always current. The Windows and Linux apps also update themselves in the background; Android updates when you install a newer file.'),
dl('Windows','Installer for Windows 10 and 11. Windows may warn that the app is unsigned.',d.windows,'.exe'),
dl('Linux','AppImage for most 64-bit distributions. Make it executable (chmod +x) and run it. It updates itself.',d.linux,'.AppImage'),
dl('Android','Debug-signed package for sideloading. Allow installs from your browser or file manager, then open the file.',d.android,'.apk'),
h('div',{class:'card',style:{margin:'8px 0'}},h('b',null,'Install from your browser'),h('div',{class:'hint'},'Chrome, Edge and most Android browsers offer Install app in the address bar or menu. Safari: Share, then Add to Home Screen.')))
}
