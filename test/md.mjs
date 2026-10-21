class N{constructor(t){this.tag=t;this.kids=[];this.attrs={};this.cls='';this.style={setProperty(){}};this.dataset={}}
append(...k){for(const x of k)this.kids.push(x)}
prepend(...k){this.kids.unshift(...k)}
addEventListener(){}
setAttribute(k,v){this.attrs[k]=v}
set className(v){this.cls=v}
get className(){return this.cls}
set textContent(v){this.kids=[String(v)]}
}
class T{constructor(s){this.nodeType=3;this.s=s}}
globalThis.document={createElement:t=>{const n=new N(t);n.nodeType=1;return n},createTextNode:s=>new T(s),createDocumentFragment:()=>{const n=new N('#f');n.nodeType=11;return n},getElementById:()=>null,body:{append(){}}}
globalThis.window=globalThis
const ser=n=>{
if(typeof n==='string')return n
if(n instanceof T)return n.s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
const inner=n.kids.map(ser).join('')
if(n.tag==='#f')return inner
const a=Object.entries(n.attrs).filter(([k])=>k==='href'||k==='rel').map(([k,v])=>` ${k}="${v}"`).join('')
const c=n.cls?` class="${n.cls}"`:''
return `<${n.tag}${c}${a}>${inner}</${n.tag}>`
}
const{render,plain}=await import('../public/js/md.js')
let pass=0,fail=0
const t=(src,want)=>{
const got=ser(render(src,{urls:[]}))
if(got===want)pass++;else{fail++;console.log('FAIL',JSON.stringify(src),'\n  got ',got,'\n  want',want)}
}
t('hello','<p>hello</p>')
t('**b** and *i* and ~~s~~','<p><strong>b</strong> and <em>i</em> and <s>s</s></p>')
t('<script>alert(1)</script>','<p>&lt;script>alert(1)&lt;/script></p>')
t('`a<b>`','<p><code>a&lt;b></code></p>')
t('[x](javascript:alert(1))','<p>[x](javascript:alert(1))</p>')
t('[x](https://e.com/a)','<p><a href="https://e.com/a" rel="noopener noreferrer nofollow">x</a></p>')
t('see https://e.com/a.','<p>see <a href="https://e.com/a" rel="noopener noreferrer nofollow">https://e.com/a</a>.</p>')
t('https://user:pw@e.com/','<p>https://user:pw@e.com/</p>')
t('ftp://e.com','<p>ftp://e.com</p>')
t('snake_case_word and 2*3*4','<p>snake_case_word and 2*3*4</p>')
t('¯\\\\\\_(ツ)\\_/¯','<p>¯\\_(ツ)_/¯</p>')
t('a \\*b\\* c','<p>a *b* c</p>')
t('`\\*`','<p><code>\\*</code></p>')
t('(╯°□°)╯︵ ┻━┻','<p>(╯°□°)╯︵ ┻━┻</p>')
t('*waves*','<p><em>waves</em></p>')
t('> quote\n> more','<blockquote>quote\nmore</blockquote>')
t('- a\n- b','<ul><li>a</li><li>b</li></ul>')
t('1. a\n2. b','<ol><li>a</li><li>b</li></ol>')
t('```js\nconst a=1\n```','<pre><code><span class="tk-k">const</span> a=<span class="tk-n">1</span></code></pre>')
t('```\n**not bold**\n```','<pre><code>**not bold**</code></pre>')
t('||secret||','<p><span class="sp">secret</span></p>')
t('hi <@everyone> and a@b.com','<p>hi <span class="mn all">@everyone</span> and a@b.com</p>')
t('plain @bob stays text','<p>plain @bob stays text</p>')
t('# Title','<h2 class="mh">Title</h2>')
t('**unclosed','<p>**unclosed</p>')
t('***','<hr></hr>')
const deep='**'.repeat(1)+'a'
t(deep,'<p>**a</p>')
if(plain('**hi** ```code``` ||x||')!=='hi [code] [spoiler]'){fail++;console.log('FAIL plain',plain('**hi** ```code``` ||x||'))}else pass++
t('[rainbow]hi[/rainbow]','<p><span class="fx fx-rainbow">hi</span></p>')
t('[color=red]x[/color]','<p><span class="fx fc-red">x</span></p>')
t('press [[Ctrl]]','<p>press <kbd>Ctrl</kbd></p>')
t('++new++','<p><ins>new</ins></p>')
t('> [!TIP] Try this','<div class="callout co-tip"><b class="co-t">Tip</b><div>Try this</div></div>')
t('-> mid <-','<p class="mcenter">mid</p>')
t('+++ More\nbody\n+++','<details class="mdet"><summary>More</summary><div>body</div></details>')
t('[color=javascript:x]a[/color]','<p>[color=javascript:x]a[/color]</p>')
console.log(`${pass} passed, ${fail} failed`)
process.exit(fail?1:0)
