import{art as ba}from'./dsartB.js'
import{art2 as bb}from'./dsart2B.js'
export{island,lab,room}from'./dsartB.js'
const POS={"golem_jump":[0,0,570,674,2],"golem_walk":[572,0,532,646,2],"golem_idle":[1106,0,544,644,2],"golem_fall":[1652,0,562,638,2],"golem_run":[0,676,516,616,2],"golem_hurt":[518,676,386,586,2],"golem_attack":[906,676,636,534,2],"kid_idle1":[1544,676,159,327,3],"kid_walk3":[1705,676,171,324,3],"kid_walk4":[1878,676,183,318,3],"kid_walk1":[2063,676,162,315,3],"mino2":[0,1294,228,315,3],"kid_walk0":[230,1294,171,312,3],"mino3":[403,1294,237,312,3],"kid_walk2":[642,1294,180,309,3],"mino0":[824,1294,243,309,3],"mino1":[1069,1294,237,306,3],"mino4":[1308,1294,228,303,3],"golem_death":[1538,1294,526,296,2],"bat1":[0,1611,363,240,3],"bat0":[365,1611,336,234,3],"bat3":[703,1611,318,231,3],"bat2":[1023,1611,336,228,3]}
let IMG=null
export const ready=()=>new Promise(r=>{if(IMG)return r(IMG);const i=new Image();i.onload=()=>{IMG=i;r(i)};i.onerror=()=>r(null);i.src='/gm/sheet.webp'})
const spr=(n,f,S)=>{const[x,y,w,h,u]=POS[n],lw=w/u*f,lh=h/u*f,c=document.createElement('canvas');c.width=Math.ceil(lw*S);c.height=Math.ceil(lh*S);const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(IMG,x,y,w,h,0,0,c.width,c.height);return{c,w:lw,h:lh,ax:lw/2,ay:lh-2}}
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
