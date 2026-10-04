import assert from 'node:assert/strict';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import katex from 'katex';
const root='src/content/system-design';
const only=process.argv.slice(2);
const expected=['networking','performance','databases','nosql','distributed-systems','caching','traffic-routing','queues','kafka','apis-and-services','reliability','rate-limiting','storage','cdn','search','realtime','data-pipelines','security','observability','scaling-patterns','interview-method','practice-designs'];
const folders=only.length?only:expected;
const figures=new Map(),errors=[],warnings=[],report=[];
const fail=(ok,message)=>{if(!ok) errors.push(message);};
for(const file of await readdir('src/figs')) {
 if(!file.endsWith('.js'))continue;
 for(const [name,fn] of Object.entries(await import(`../../src/figs/${file}`))) {
  fail(!figures.has(name),`Duplicate exported figure ${name}`);figures.set(name,fn);
 }
}
const banned=/\b(?:delve|tapestry|testament|pivotal|seamlessly?|leverage|robust|realm|landscape|game-changer|unlock|unleash|embark|crucial|harness|intricate|furthermore|moreover|additionally|ever-evolving|cutting-edge)\b|in essence|it's important to note|it is worth noting|let's dive|dive into|navigate the|vital role|plays a key role|in today's|in conclusion|to summarize|overall,/gi;
const plain=s=>s.replace(/<[^>]*>/g,'').replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
const referenced=new Set();
for(const slug of folders) {
 let files;try{files=(await readdir(`${root}/${slug}`)).filter(f=>f.endsWith('.md')).sort();}catch{errors.push(`Missing unit ${slug}`);continue;}
 let parts=0,sections=[],words=0,diagrams=[],math=0,terms=new Set(),bodyWords=0;
 const meta=(await import(`../../${root}/${slug}/_note.js`)).site;
 fail(meta.order===expected.indexOf(slug)+1,`${slug}: syllabus order`);
 for(const id of [meta.cover,meta.where]) {fail(figures.has(id),`${slug}: missing ${id}`);if(id)referenced.add(id);}
 for(const file of files) {
  const s=await readFile(`${root}/${slug}/${file}`,'utf8');
  const target=file==='_front.md'?`dist/system-design/${slug}/index.html`:`dist/system-design/${slug}/${file.slice(0,-3)}/index.html`;
  let html='';try{html=await readFile(target,'utf8');}catch{errors.push(`Unbuilt page ${target}`);}
  fail(!/[\u2013\u2014]/.test(s),`${slug}/${file}: long dash`);
  const bad=[...s.matchAll(banned)].map(m=>m[0]);fail(!bad.length,`${slug}/${file}: banned wording ${bad.join(', ')}`);
  fail(!html.includes('class="err"'),`${slug}/${file}: render error`);
  fail(!/XPHX\d+XPHX|KTXK\d+KTXK/.test(html),`${slug}/${file}: unresolved placeholders`);
  words+=s.split(/\s+/).filter(Boolean).length;
  if(s.startsWith('@part')) {
   parts++;bodyWords+=s.split(/\s+/).filter(Boolean).length;
   fail(s.includes(`where:${parts}`),`${slug}/${file}: map index`);
   const boxes=[...s.matchAll(/^:::(\w+) /gm)];
   fail(boxes.length>=4&&boxes.length<=7,`${slug}/${file}: ${boxes.length} callouts`);
   fail(boxes.filter(m=>m[1]==='key').length===1,`${slug}/${file}: recap count`);
   fail(/:::key In one breath\n[\s\S]+\n:::\s*$/.test(s),`${slug}/${file}: missing final recap`);
   const blurb=s.split('\n')[0].split('|')[2]?.trim()||'';
   fail((blurb.match(/\.(?:\s|$)/g)||[]).length===3,`${slug}/${file}: opener needs three sentences`);
   for(const [,term] of s.matchAll(/\*\*([^*\n]+)\*\*/g)) {
    if(term.startsWith('"')||term.startsWith("'"))continue;
    const key=term.toLowerCase();
    if(terms.has(key))warnings.push(`${slug}/${file}: repeated bold term ${term}`);
    terms.add(key);
   }
   for(const block of s.split(/^## (?=\d+\.)/m).slice(1)) {
    const first=block.split('\n')[0];const n=+first.split('.')[0];
    sections.push(n);
    const length=block.split(/\s+/).length;
    if(length<180)warnings.push(`${slug}: short section ${n}, ${length} words`);
    fail(/@fig|\d/.test(block.slice(first.length)),`${slug}: section ${n} has no example or figure`);
   }
  }
  for(const [,id] of s.matchAll(/^@fig (\w+)/gm)) {
   diagrams.push(id);referenced.add(id);
   fail(figures.has(id),`${slug}/${file}: missing figure ${id}`);
   fail(html.includes(`id="fig-${id}"`),`${slug}/${file}: unrendered ${id}`);
  }
  const expectedCode=[...s.matchAll(/```\w*\n([\s\S]*?)```/g)].map(m=>m[1].replace(/\n$/,''));
  const actualCode=[...html.matchAll(/<pre\b[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>plain(m[1]));
  fail(JSON.stringify(expectedCode)===JSON.stringify(actualCode),`${slug}/${file}: code rendering changed`);
  const noCode=s.replace(/```[\s\S]*?```/g,'').replace(/`[^`\n]+`/g,'');
  for(const [,display,inline] of noCode.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g)) {
   try{katex.renderToString((display??inline).trim(),{throwOnError:true,strict:false});math++;}catch(e){errors.push(`${slug}/${file}: math ${e.message}`);}
  }
  for(const [,url] of html.matchAll(/href="(\/[^"]*)"/g)) {
   const [path,fragment]=url.split('#');if(path.startsWith('/_astro/'))continue;
   const p=/\.[^/]+$/.test(path)?`dist${path}`:`dist${path.replace(/\/$/,'')}/index.html`;
   try{await stat(p);if(fragment)fail((await readFile(p,'utf8')).includes(`id="${fragment}"`),`${slug}/${file}: missing anchor ${url}`);}catch{errors.push(`${slug}/${file}: broken link ${url}`);}
  }
 }
 fail(parts>=7&&parts<=13,`${slug}: ${parts} parts`);
 fail(sections.length>=30&&sections.length<=60,`${slug}: ${sections.length} sections`);
 fail(sections.every((n,i)=>n===i+1),`${slug}: section numbering ${sections.join(',')}`);
 fail(new Set(diagrams).size>=35,`${slug}: only ${new Set(diagrams).size} unique body figures`);
 const back=await readFile(`${root}/${slug}/99-interview.md`,'utf8').catch(()=> '');
 const qs=[...back.matchAll(/^\*\*Q(\d+)\./gm)].map(m=>+m[1]);
 const es=[...back.matchAll(/^\*\*E(\d+)\*\*/gm)].map(m=>+m[1]);
 const sol=[...back.matchAll(/^\*\*E(\d+)\.\*\*/gm)].map(m=>+m[1]);
 fail(qs.length>=40,`${slug}: ${qs.length} questions`);fail(es.length>=25,`${slug}: ${es.length} exercises`);
 fail(qs.every((n,i)=>n===i+1),`${slug}: question numbering`);
 fail(es.every((n,i)=>n===i+1)&&JSON.stringify(es)===JSON.stringify(sol),`${slug}: exercise/solution numbering`);
 fail(/@chapter faq|@chapter questions/.test(back)&&back.includes('@chapter exercises')&&back.includes('@chapter solutions'),`${slug}: back matter structure`);
 report.push({slug,parts,sections:sections.length,bodyFigures:new Set(diagrams).size,words,bodyWords,questions:qs.length,exercises:es.length,formulas:math});
}
for(const id of referenced) {
 const fn=figures.get(id);if(!fn)continue;
 try {
  const svg=fn();fail(/viewBox="0 0 640 \d+"/.test(svg),`${id}: canvas`);
  fail(/x="10" y="16" class="cap"/.test(svg),`${id}: kicker`);
  fail(![...svg.matchAll(/<[^>]+>/g)].some(m=>/NaN|undefined|Infinity/.test(m[0])),`${id}: invalid geometry`);
  fail((svg.match(/class="hand"/g)||[]).length<=2,`${id}: too many hand notes`);
  fail(!/[\u2013\u2014]/.test(svg),`${id}: long dash in figure`);
 }catch(e){errors.push(`${id}: ${e.message}`);}
}
const result={units:report,errors,warnings,checkedFigureFunctions:referenced.size};
await writeFile('scripts/system-design/report.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
process.exitCode=errors.length?1:0;
