const LEET={'0':'o','1':'i','!':'i','|':'i','3':'e','4':'a','@':'a','5':'s','$':'s','7':'t','8':'b','9':'g','+':'t','(':'c'}
const forms=t=>{
let s=String(t).normalize('NFKD').replace(/[̀-ͯ​-‏⁠﻿]/g,'').toLowerCase()
s=s.replace(/[01!|3459@$78+(]/g,c=>LEET[c]||c)
const words=s.replace(/[^a-z]+/g,' ').replace(/([a-z])\1{2,}/g,'$1$1').trim()
const squash=words.replace(/ /g,'').replace(/([a-z])\1+/g,'$1')
return{words,squash,tok:new Set(words.split(' ').map(w=>w.replace(/(.)\1+/g,'$1')))}
}
const ROOTS=['fuck','bitch','cunt','nigg','faggot','retard','whore','pussy','porn','blowjob','handjob','dildo','cum shot','cumshot','kikes','chink','spic','tranny','bastard','asshole','dickhead','motherfuck']
const TOK=['shit','ass','arse','damn','piss','dick','cock','sex','sexy','nude','nudes','naked','rape','raped','kys','slut','boobs','tits','penis','vagina','horny','wtf','stfu','crap','hell','suicide','fck','fuk','sht','bch']
const BAD=[
['threat',/\b(kill|hurt|beat|shoot|stab|murder|punch|choke)\s+(you|u|ya|your|ur)\b/,1],
['threat',/\b(i\s*(will|ll|am gonna|m gonna|gonna|going to))\s+(find|get|come for|hunt)\s+(you|u)\b/,1],
['threat',/\b(kill|hang|hurt)\s+(your|ur)?\s*self\b/,1],
['bullying',/\b(you|u|ur|youre|you re|you are|u r)\s*(are\s*)?(so\s*|really\s*|such a\s*)?(ugly|stupid|dumb|fat|loser|worthless|idiot|trash|gross|freak|weird)\b/,0],
['bullying',/\b(nobody|no one|no body)\s+(likes|loves|wants)\s+(you|u)\b/,0],
['bullying',/\b(i\s*)?hate\s+(you|u)\b/,0],
['bullying',/\bgo away\b.*\b(loser|freak)\b/,0],
['grooming',/\b(dont|do not|don t|never)\s+tell\s+(your|ur|any)?\s*(mom|dad|mum|parents?|anyone|anybody|teacher)\b/,1],
['grooming',/\b(our|a|this|the)\s+(little\s+)?secret\b/,1],
['grooming',/\bkeep\s+(this|it|that)\s+(a\s+)?secret\b/,1],
['grooming',/\b(are|r)\s*(you|u)\s+(home\s+)?alone\b/,1],
['grooming',/\b(home|there)\s+alone\b/,1],
['grooming',/\b(are\s+)?(your|ur)\s+(mom|dad|parents?)\s+(home|there|around|here|asleep|gone)\b/,1],
['grooming',/\bhow\s+old\s+(are|r)\s+(you|u)\b/,1],
['grooming',/\b(send|show)\s+(me\s+)?(a\s+|some\s+|ur\s+|your\s+)?(pic|pics|picture|pictures|photo|photos|selfie|selfies|video)\b/,1],
['grooming',/\b(web\s*cam|cam\s*chat|facetime|video\s*call)\b/,1],
['grooming',/\b(meet|see)\s+(me|up|you|u)\b/,1],
['grooming',/\bcome\s+(over|to my)\b/,1],
['grooming',/\bwhat\s+do\s+(you|u)\s+look\s+like\b/,1],
['grooming',/\b(i\s*(will|ll))\s+(buy|give)\s+(you|u)\b/,1],
['contact',/\b(snap\s*chat|snap|whats\s*app|telegram|instagram|insta|tik\s*tok|kik|discord|signal|messenger|facebook|roblox\s+username)\b/,1],
['contact',/\b(add|text|call|dm|message|msg)\s+me\b/,1],
['contact',/\b(phone|cell|mobile)\s*(number|no)\b/,1],
['private',/\b(my|our)\s+(home\s+)?(address|password|passcode|pin|pass word)\b/,1],
['private',/\b(i|we)\s+live\s+(at|in|on|near)\b/,1],
['private',/\b(i\s*go\s*to|i\s*attend|my\s*school|im\s*at|i\s*am\s*at)\b.*\b(school|elementary|academy|middle|primary|prep)\b/,1],
['private',/\bmy\s+(full\s+)?(real\s+)?name\s+is\b/,0],
['private',/\bmy\s+(birthday|bday)\s+is\b/,0]
]
export function moderate(text){
const raw=String(text||'')
if(!raw.trim())return{ok:false,cat:'empty',serious:false,msg:'Type a message first.'}
if(raw.length>300)return{ok:false,cat:'long',serious:false,msg:'That message is too long.'}
const f=forms(raw)
const digits=(raw.match(/\d/g)||[]).length
const flat=f.words
if(digits>=7&&/(?:\d[\s\-.()]*){7,}/.test(raw))return{ok:false,cat:'private',serious:true,msg:'Phone numbers cannot be shared.'}
if(/[a-z0-9._%+-]+\s*(@|\bat\b)\s*[a-z0-9-]+\s*(\.|\bdot\b)\s*(com|net|org|edu|gov|io|co|me)\b/i.test(raw))return{ok:false,cat:'private',serious:true,msg:'Email addresses cannot be shared.'}
if(/\b\d{1,5}\s+[a-z]+(\s+[a-z]+)?\s+(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|way|place|pl)\b/i.test(raw))return{ok:false,cat:'private',serious:true,msg:'Addresses cannot be shared.'}
if(/(https?:|www\.|\b[a-z0-9-]{2,}\s?\.\s?(com|net|org|io|gg|tv|xyz|co|me|ly|app|link|ru|cc|us|to|fm|ai)\b)/i.test(raw.replace(/​/g,'')))return{ok:false,cat:'link',serious:false,msg:'Links cannot be shared.'}
for(const[c,re,s]of BAD)if(re.test(flat))return{ok:false,cat:c,serious:!!s,msg:c==='bullying'?'Be kind. That message was not sent.':c==='threat'?'Threats are not allowed.':c==='grooming'||c==='contact'||c==='private'?'That message was not sent. Keep personal details and plans private.':'That message was not sent.'}
for(const r of ROOTS)if(f.squash.includes(r.replace(/[^a-z]/g,'').replace(/([a-z])\1+/g,'$1')))return{ok:false,cat:'language',serious:false,msg:'Please keep it friendly. That message was not sent.'}
for(const w of f.tok)if(TOK.includes(w))return{ok:false,cat:'language',serious:false,msg:'Please keep it friendly. That message was not sent.'}
return{ok:true}
}
