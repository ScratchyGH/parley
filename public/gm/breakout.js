import{kit,txt,over,best}from'./kit.js'
export function play(box){
let pw,bx,by,vx,vy,br,score,lives,dead,go
const rs=()=>{pw=.5;br=[];for(let r=0;r<6;r++)for(let i=0;i<10;i++)br.push({i,r,a:1});score=0;lives=3;dead=false;sv()}
const sv=()=>{bx=.5;by=.8;vx=(Math.random()<.5?-1:1)*.28;vy=-.5;go=false}
rs()
const k=kit(box,(dt,k)=>{
if(dead)return
if(k.keys.arrowleft||k.keys.a)pw-=dt*1.1
if(k.keys.arrowright||k.keys.d)pw+=dt*1.1
if(k.down)pw=k.px/k.W
pw=Math.max(.08,Math.min(.92,pw))
if(!go){bx=pw;by=.9;return}
bx+=vx*dt*1.2;by+=vy*dt*1.2
if(bx<0||bx>1){vx=-vx;bx=Math.max(0,Math.min(1,bx))}
if(by<0){vy=Math.abs(vy);by=0}
const ar=k.W/k.H
if(by>.92&&by<.96&&Math.abs(bx-pw)<.08&&vy>0){vy=-Math.abs(vy);vx=(bx-pw)*5+vx*.2;const sp=Math.hypot(vx,vy),t=Math.min(.9,sp*1.03);vx*=t/sp;vy*=t/sp}
if(by>1.02){lives--;if(lives<=0){dead=true;best('breakout',score)}else sv()}
for(const b of br){if(!b.a)continue;const x0=b.i/10,x1=x0+.1,y0=.08+b.r*.045,y1=y0+.04;if(bx>x0&&bx<x1&&by>y0&&by<y1){b.a=0;vy=-vy;score+=10*(6-b.r);if(!br.some(z=>z.a)){for(const z of br)z.a=1;sv()}break}}
},(c,k)=>{
c.fillStyle='#0b0b0d';c.fillRect(0,0,k.W,k.H)
const cl=['#ef4444','#f97316','#eab308','#a9a8a0','#8f8d84','#6f6d66']
for(const b of br)if(b.a){c.fillStyle=cl[b.r];c.fillRect(b.i*k.W/10+2,(.08+b.r*.045)*k.H,k.W/10-4,.04*k.H)}
c.fillStyle='#f6f5ef';c.fillRect((pw-.08)*k.W,.94*k.H,.16*k.W,10)
c.beginPath();c.arc(bx*k.W,by*k.H,7,0,6.283);c.fill()
txt(c,'Score '+score+'   Lives '+lives+'   Best '+best('breakout'),12,22,16)
if(!go&&!dead)txt(c,'Tap or press Space to launch',k.W/2,k.H*.7,18,'#8f8d84','center')
if(dead)over(c,k,score,best('breakout'))
})
k.press=c=>{if(dead&&c==='enter')rs();else if(c===' ')go=true}
k.tap=()=>{if(dead)rs();else go=true}
return k.stop
}
