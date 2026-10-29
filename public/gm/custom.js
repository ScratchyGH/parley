import{art as ba}from'./dsartB.js'
import{art2 as bb}from'./dsart2B.js'
export{island,lab,room}from'./dsartB.js'
const POS={"golem_jump":[0,0,275,327],"golem_walk":[277,0,256,313],"golem_idle":[535,0,262,312],"golem_fall":[799,0,271,309],"golem_run":[1072,0,248,298],"golem_hurt":[0,329,186,283],"golem_attack":[188,329,311,257],"desk0":[501,329,280,155],"golem_death":[783,329,253,138],"teaE2":[1038,329,89,110],"lab0":[1129,329,187,109],"teaE0":[1318,329,78,108],"tea4":[1398,329,56,107],"tea0":[0,614,59,106],"tea2":[61,614,58,106],"tea3":[121,614,57,106],"tea1":[180,614,58,105],"teaE1":[240,614,85,105],"kid_idle2":[327,614,48,103],"minoA0":[377,614,171,100],"kid_idle1":[550,614,43,99],"kid_walk3":[595,614,47,98],"sciE2":[644,614,77,98],"kid_walk4":[723,614,51,96],"kid_walk1":[776,614,44,95],"mino2":[822,614,66,95],"kid_walk0":[890,614,47,94],"mino3":[939,614,69,94],"kid_walk2":[1010,614,50,93],"mino0":[1062,614,71,93],"mino1":[1135,614,69,92],"mino4":[1206,614,66,91],"pump0":[1274,614,49,89],"pump3":[1325,614,49,88],"pump4":[1376,614,48,88],"pump7":[1426,614,49,88],"snow0":[0,722,51,88],"snow3":[53,722,52,88],"sci1":[107,722,48,88],"sci2":[157,722,47,88],"sci4":[206,722,53,88],"pump5":[261,722,48,87],"snow1":[311,722,53,87],"snow5":[366,722,52,87],"sciE1":[420,722,51,85],"sciE0":[473,722,56,84],"sciE3":[531,722,74,81],"kid_idle0":[607,722,43,80],"pump1":[652,722,47,74],"sci0":[701,722,46,74],"sci3":[749,722,49,74],"snow2":[800,722,52,73],"bat4":[854,722,101,73],"snow4":[957,722,51,72],"snow6":[1010,722,52,72],"bat1":[1064,722,111,70],"pump2":[1177,722,48,68],"bat0":[1227,722,102,68],"pump6":[1331,722,47,67],"bat3":[1380,722,96,67],"kit0":[0,812,47,66],"bat2":[49,812,102,66],"potion0":[153,812,43,58],"cld2":[198,812,62,56],"cldS0":[262,812,70,56],"cld0":[334,812,62,55],"cld3":[398,812,63,54],"pack0":[463,812,58,53],"cld1":[523,812,61,52],"bench0":[586,812,125,51],"chest1":[713,812,52,44],"chest0":[767,812,55,43]}
let IMG=null
export const ready=()=>new Promise(r=>{if(IMG)return r(IMG);const i=new Image();i.onload=()=>{IMG=i;r(i)};i.onerror=()=>r(null);i.src='/gm/sheet.webp'})
const spr=(n,f,S)=>{const[x,y,w,h]=POS[n],lw=w*f,lh=h*f,c=document.createElement('canvas');c.width=Math.ceil(lw*S);c.height=Math.ceil(lh*S);const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(IMG,x,y,w,h,0,0,c.width,c.height);return{c,w:lw,h:lh,ax:lw/2,ay:lh-2}}
const set=(a,f,S)=>a.map(n=>spr(n,f,S))
export const fr=(a,m,t)=>m?a[1+Math.floor(t*10)%(a.length-1)]:a[0]
export function art(S){
const A=ba(S)
A.kid.skin=set(['kid_idle1','kid_walk0','kid_walk1','kid_walk2','kid_walk3','kid_walk4'],.95,S)
return A
}
export function art2(S){
const B=bb(S)
const g=n=>spr('golem_'+n,.8,S)
B.boss={idle:g('idle'),walk:g('walk'),run:g('run'),jump:g('jump'),fall:g('fall'),attack:g('attack'),hurt:g('hurt'),death:g('death')}
B.bat=set(['bat0','bat1','bat2','bat3'],.75,S)
B.form=set(['mino0','mino1','mino2','mino3','mino4'],1.3,S)
B.desk.scr=B.deskScreen
return B
}
