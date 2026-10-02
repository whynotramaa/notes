import assert from 'node:assert/strict';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import katex from 'katex';
const root='src/content/octlm/training';
const files=(await readdir(root)).filter(f=>f.endsWith('.md')).sort();
const drawings=new Map();
for(const f of await readdir('src/figs')) {
  if(!f.endsWith('.js')) continue;
  for(const [id,fn] of Object.entries(await import(`../../src/figs/${f}`))) {
    assert(!drawings.has(id),`Duplicate figure ${id}`); drawings.set(id,fn);
  }
}
const banned=/\b(?:delve|tapestry|testament|pivotal|seamlessly?|leverage|robust|realm|landscape|game-changer|unlock|unleash|embark|crucial|harness|intricate|furthermore|moreover|additionally|ever-evolving|cutting-edge)\b|in essence|it's important to note|it is worth noting|let's dive|dive into|navigate the|vital role|plays a key role|in today's|in conclusion|to summarize|overall,/i;
const plain=s=>s.replace(/<[^>]*>/g,'').replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
let sections=[],partCount=0,figureCount=0,words=0,mathCount=0;
const references=[];
for(const file of files) {
  const source=await readFile(`${root}/${file}`,'utf8');
  const target=file==='_front.md'?'dist/octlm/training/index.html':`dist/octlm/training/${file.slice(0,-3)}/index.html`;
  const html=await readFile(target,'utf8');
  assert(!/[\u2013\u2014]/.test(source),`Long dash in ${file}`);
  assert(!banned.test(source),`Banned phrase in ${file}: ${source.match(banned)?.[0]}`);
  assert(!html.includes('class="err"'),`Render error in ${file}`);
  assert(!/XPHX\d+XPHX|KTXK\d+KTXK/.test(html),`Unresolved markup in ${file}`);
  const prose=source.replace(/```[\s\S]*?```/g,'').replace(/\$\$[\s\S]*?\$\$/g,'').replace(/\$[^$\n]+\$/g,'').replace(/^@fig.*$/gm,'');
  words+=prose.split(/\s+/).filter(Boolean).length;
  for(const [,number,title] of source.matchAll(/^## (\d+)\.\s+(.*)$/gm)) sections.push({number:+number,title,file});
  if(source.startsWith('@part')) {
    partCount++;
    assert(source.includes(`where:${partCount}`),`Map stage in ${file}`);
    const boxes=[...source.matchAll(/^:::(\w+) /gm)];
    assert(boxes.length>=4&&boxes.length<=7,`Callout count in ${file}`);
    assert.equal(boxes.filter(m=>m[1]==='key').length,1,`Key box in ${file}`);
    assert(/:::key In one breath\n[\s\S]+\n:::\s*$/.test(source),`Part does not end in recap: ${file}`);
    const blurb=source.split('\n')[0].split('|')[2].trim();
    assert.equal((blurb.match(/\.(?:\s|$)/g)||[]).length,3,`Three-sentence opener ${file}`);
  }
  for(const [,id] of source.matchAll(/^@fig (\w+)/gm)) {
    figureCount++;references.push(id);assert(drawings.has(id),`Missing ${id}`);
    assert(html.includes(`id="fig-${id}"`),`Unrendered ${id}`);
  }
  for(const [,code] of source.matchAll(/```\w*\n([\s\S]*?)```/g)) {
    assert(code.trimEnd().split('\n').length<=15,`Long code block in ${file}`);
  }
  const expected=[...source.matchAll(/```\w*\n([\s\S]*?)```/g)].map(m=>m[1].replace(/\n$/,''));
  const actual=[...html.matchAll(/<pre\b[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>plain(m[1]));
  assert.deepEqual(actual,expected,`Code altered in ${file}`);
  const noCode=source.replace(/```[\s\S]*?```/g,'').replace(/`[^`\n]+`/g,'');
  for(const [,display,inline] of noCode.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g)) { const eq=display??inline;katex.renderToString(eq.trim(),{throwOnError:true,strict:false});mathCount++; }
  for(const [,url] of html.matchAll(/href="(\/[^"]*)"/g)) {
    const [path,fragment]=url.split('#');
    if(!path||path.startsWith('/_astro/')) continue;
    const p=/\.[^/]+$/.test(path)?`dist${path}`:`dist${path.replace(/\/$/,'')}/index.html`;
    try { await stat(p); } catch { assert.fail(`Broken internal link ${url} in ${file}`); }
    if(fragment) assert((await readFile(p,'utf8')).includes(`id="${fragment}"`),`Missing anchor ${url} in ${file}`);
  }
}
assert.equal(partCount,10);assert.deepEqual(sections.map(s=>s.number),Array.from({length:35},(_,i)=>i+1));
const back=await readFile(`${root}/99-interview.md`,'utf8');
assert.equal((back.match(/^\*\*Q\d+\./gm)||[]).length,50);
assert.equal((back.match(/^\*\*E\d+\*\* /gm)||[]).length,30);
assert.equal((back.match(/^\*\*E\d+\.\*\*/gm)||[]).length,30);
const dots=[...back.matchAll(/^\*\*E\d+\*\* (●+)/gm)].map(m=>m[1].length);
assert.deepEqual([1,2,3].map(n=>dots.filter(v=>v===n).length),[12,12,6]);
const newIds=[];
for(let n=30;n<=39;n++) {
  for(const [id,fn] of Object.entries(await import(`../../src/figs/p${n}.js`))) {
    const svg=fn();newIds.push(id);
    assert.match(svg,/viewBox="0 0 640 \d+"/);assert.match(svg,/x="10" y="16" class="cap"/);
    assert(!/NaN|undefined|Infinity/.test(svg),`Invalid geometry ${id}`);
    assert((svg.match(/class="hand"/g)||[]).length<=2,`Hand annotations ${id}`);
    assert(!/[\u2013\u2014]/.test(svg),`Long dash in ${id}`);
    assert(references.includes(id)||['cover_training','where_training'].includes(id),`Unused ${id}`);
  }
}
const result={sections:sections.length,parts:partCount,bodyFigures:figureCount,uniqueDiagrams:newIds.length,illustrationPlacements:figureCount+partCount+2,proseWords:words,interviewQuestions:50,exercises:30,formulasChecked:mathCount,errors:0};
await writeFile('scripts/training/report.json',JSON.stringify(result,null,2)+'\n');console.log(result);
