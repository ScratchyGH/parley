const S=['nigg','fagg','faggot','wetback','tranny','retard','beaner','towelhead','killyourself']
const fold=t=>String(t||'').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[@4]/g,'a').replace(/[3]/g,'e').replace(/[1!|]/g,'i').replace(/[0]/g,'o').replace(/[$5]/g,'s').replace(/[^a-z]/g,'')
const W=new Set(['kike','kikes','chink','chinks','spic','spics','coon','coons','gook','gooks','kys'])
export function slurHit(t){const f=fold(t);if(S.some(s=>f.includes(s)))return true;return String(t||'').toLowerCase().split(/[^a-z]+/).some(w=>W.has(w))}
export function spammy(t){
const s=String(t||'')
if(/(.)\1{9,}/.test(s))return true
if((s.match(/https?:\/\//gi)||[]).length>2)return true
if(/(free\s+(nitro|robux|vbucks)|discord\.gg\/|t\.me\/|giveaway.*click)/i.test(s))return true
return false
}
