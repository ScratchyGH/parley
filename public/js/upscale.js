const VS='attribute vec2 a;varying vec2 u;void main(){u=a*.5+.5;u.y=1.-u.y;gl_Position=vec4(a,0.,1.);}'
const FS=`precision highp float;varying vec2 u;uniform sampler2D t;uniform vec2 sz;uniform float k;
vec3 s(vec2 p){return texture2D(t,p).rgb;}
vec3 cr(vec2 uv){
vec2 p=uv*sz;vec2 c=floor(p-.5)+.5;vec2 f=p-c;
vec2 w0=f*(-.5+f*(1.-.5*f));vec2 w1=1.+f*f*(-2.5+1.5*f);vec2 w2=f*(.5+f*(2.-1.5*f));vec2 w3=f*f*(-.5+.5*f);
vec2 w12=w1+w2;vec2 o=w2/w12;
vec2 t0=(c-1.)/sz;vec2 t12=(c+o)/sz;vec2 t3=(c+2.)/sz;
vec3 r=s(vec2(t0.x,t0.y))*w0.x*w0.y+s(vec2(t12.x,t0.y))*w12.x*w0.y+s(vec2(t3.x,t0.y))*w3.x*w0.y
+s(vec2(t0.x,t12.y))*w0.x*w12.y+s(vec2(t12.x,t12.y))*w12.x*w12.y+s(vec2(t3.x,t12.y))*w3.x*w12.y
+s(vec2(t0.x,t3.y))*w0.x*w3.y+s(vec2(t12.x,t3.y))*w12.x*w3.y+s(vec2(t3.x,t3.y))*w3.x*w3.y;
return r;}
void main(){
vec3 c=cr(u);
vec2 d=1./sz;
vec3 a=s(u+vec2(d.x,0.)),b=s(u-vec2(d.x,0.)),e=s(u+vec2(0.,d.y)),g=s(u-vec2(0.,d.y));
vec3 mn=min(min(a,b),min(e,g)),mx=max(max(a,b),max(e,g));
vec3 bl=(a+b+e+g)*.25;
vec3 r=c+(c-bl)*k;
r=clamp(r,mn-.04,mx+.04);
gl_FragColor=vec4(clamp(r,0.,1.),1.);}`
const mk=(gl,t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o}
function boot(cv){
const gl=cv.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:false,powerPreference:'low-power'})
if(!gl)return null
const pg=gl.createProgram()
gl.attachShader(pg,mk(gl,gl.VERTEX_SHADER,VS))
gl.attachShader(pg,mk(gl,gl.FRAGMENT_SHADER,FS))
gl.linkProgram(pg)
if(!gl.getProgramParameter(pg,gl.LINK_STATUS))return null
gl.useProgram(pg)
const bf=gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER,bf)
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW)
const al=gl.getAttribLocation(pg,'a')
gl.enableVertexAttribArray(al)
gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0)
const tx=gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D,tx)
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR)
return{gl,sz:gl.getUniformLocation(pg,'sz'),k:gl.getUniformLocation(pg,'k')}
}
export function upscale(vd,w){
const cv=document.createElement('canvas')
w.append(cv)
let R=null,dead=false,lw=0,lh=0
const on=()=>vd.videoHeight>0&&vd.videoHeight<=540
const draw=()=>{
if(!w.isConnected||document.hidden)return
const vw=vd.videoWidth,vh=vd.videoHeight
if(!vw||!vh)return
if(!R){R=boot(cv);if(!R){dead=true;return}}
const bw=w.clientWidth,bh=w.clientHeight
if(!bw||!bh)return
const dp=Math.min(2,devicePixelRatio||1)
const sc=Math.min(bw*dp/vw,bh*dp/vh,2560/vw,1440/vh)
const cw=Math.max(2,Math.round(vw*sc)),ch=Math.max(2,Math.round(vh*sc))
if(cw!==lw||ch!==lh){cv.width=cw;cv.height=ch;lw=cw;lh=ch;R.gl.viewport(0,0,cw,ch)}
const g=R.gl
g.texImage2D(g.TEXTURE_2D,0,g.RGB,g.RGB,g.UNSIGNED_BYTE,vd)
g.uniform2f(R.sz,vw,vh)
g.uniform1f(R.k,Math.min(.9,.35+Math.max(0,sc-1)*.2))
g.drawArrays(g.TRIANGLE_STRIP,0,4)
}
const step=()=>{
if(dead||(vd.srcObject&&vd.srcObject.active===false))return
const o=on()
w.classList.toggle('up',o)
if(o)draw()
if(vd.requestVideoFrameCallback)vd.requestVideoFrameCallback(step)
else setTimeout(step,66)
}
vd.addEventListener('loadedmetadata',()=>{if(vd.requestVideoFrameCallback)return;step()},{once:true})
if(vd.requestVideoFrameCallback)vd.requestVideoFrameCallback(step)
}
