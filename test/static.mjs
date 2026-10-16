import fs from'fs'
import path from'path'
import{fileURLToPath}from'url'
const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'..','public','js')
const files=[]
for(const f of fs.readdirSync(dir,{withFileTypes:true})){
if(f.isFile()&&f.name.endsWith('.js'))files.push(f.name)
else if(f.isDirectory())for(const g of fs.readdirSync(path.join(dir,f.name)))if(g.endsWith('.js'))files.push(f.name+'/'+g)
}
const exp={}
const src={}
for(const f of files){
const s=fs.readFileSync(path.join(dir,f),'utf8')
src[f]=s
const set=new Set()
for(const m of s.matchAll(/^export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z0-9_$]+)/gm))set.add(m[1])
for(const m of s.matchAll(/^export\s*\{([^}]*)\}/gm))for(const n of m[1].split(','))if(n.trim())set.add(n.trim().split(/\s+as\s+/).pop())
if(/^export\s+default\b/m.test(s))set.add('default')
exp[f]=set
}
let pass=0,fail=0
const ok=(c,msg)=>{if(c)pass++;else{fail++;console.log('FAIL',msg)}}
const resolve=(from,rel)=>path.posix.normalize(path.posix.join(path.posix.dirname(from),rel))
for(const f of files){
for(const m of src[f].matchAll(/^import\s*\{([^}]*)\}\s*from\s*'(\.\.?\/[^']+)'/gm)){
const target=resolve(f,m[2])
ok(!!exp[target],`${f}: imports missing module ${m[2]}`)
if(!exp[target])continue
for(const raw of m[1].split(',')){
const n=raw.trim().split(/\s+as\s+/)[0]
if(n)ok(exp[target].has(n),`${f}: ${n} is not exported by ${m[2]}`)
}
}
ok(!/\binnerHTML\b|\bouterHTML\b|insertAdjacentHTML|document\.write|\beval\(|new Function\(/.test(src[f]),`${f}: unsafe DOM or eval API`)
ok(!/\bstyle\s*:\s*['"`]/.test(src[f]),`${f}: inline style string would violate CSP`)
ok(!/\son(click|input|change|submit)\s*=/.test(src[f].replace(/\.on(click|input|change|submit)=/g,'')),`${f}: inline event handler attribute`)
}
for(const f of files){
const unused=[]
for(const m of src[f].matchAll(/^import\s*\{([^}]*)\}\s*from/gm))for(const raw of m[1].split(',')){
const n=raw.trim().split(/\s+as\s+/).pop()
if(!n)continue
const count=(src[f].match(new RegExp('(?<![\\w$.])'+n.replace(/\$/g,'\\$')+'(?![\\w$])','g'))||[]).length
if(count<2)unused.push(n)
}
ok(!unused.length,`${f}: unused imports ${unused.join(', ')}`)
}
const html=fs.readFileSync(path.join(dir,'..','index.html'),'utf8')
ok(!/<script(?![^>]*src=)/.test(html),'index.html has an inline script')
ok(!/\sstyle=/.test(html),'index.html has an inline style attribute')
const hd=fs.readFileSync(path.join(dir,'..','_headers'),'utf8')
const csp=hd.split('\n').filter(l=>l.includes('Content-Security-Policy'))[0]||''
ok(/script-src 'self'/.test(csp)&&!/unsafe-inline/.test(csp),'CSP must forbid inline scripts and styles')
ok(/worker-src 'self'/.test(csp)&&/wasm-unsafe-eval/.test(csp),'CSP allows same-origin workers and wasm only')
ok(!/https?:\/\//.test(csp.replace(/Content-Security-Policy:/,'')),'CSP names no external origins')
console.log(`${pass} passed, ${fail} failed`)
process.exit(fail?1:0)
