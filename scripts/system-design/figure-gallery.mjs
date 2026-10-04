import { readdir,readFile,writeFile,mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const selected=process.argv.slice(2);
const figures=[];
for(const f of (await readdir('src/figs')).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))) {
 if(!/^p(?:6\d|7\d|81|82)\.js$/.test(f))continue;
 if(selected.length&&!selected.includes(f.slice(0,-3)))continue;
 for(const [id,fn] of Object.entries(await import(`../../src/figs/${f}`))) {
  const svg=fn();figures.push({id,svg,file:f});
 }
}
const fonts=['syne','ibm-plex-sans','ibm-plex-mono','caveat'].map(name=>`@font-face{font-family:'${name.replaceAll('-',' ')}';src:url('/node_modules/@fontsource/${name}/files/${name}-latin-${name==='caveat'?500:400}-normal.woff2')} `).join('');
await writeFile('public/system-design-review.html',`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/styles/site.css"><style>${fonts}body{margin:16px}main{display:grid;grid-template-columns:repeat(auto-fit,640px);gap:20px}figure{margin:0;padding:0}figure p{font:12px monospace;margin:0 0 6px}figure svg{width:640px;display:block}</style></head><body><main>${figures.map(({id,svg})=>`<figure data-name="${id}"><p>${id}</p>${svg}</figure>`).join('')}</main></body></html>`);
// Rasterize SVG contact sheets directly with librsvg, without another browser.
const css=await readFile('src/styles/site.css','utf8');
const palette=Object.fromEntries([...css.split('@media')[0].matchAll(/(--f-[\w-]+):\s*(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));
const textStyles=`text{font-family:'DejaVu Sans';font-size:12px;fill:${palette['--f-ink']}}.sm{font-size:10.5px;fill:${palette['--f-sm']}}.xs{font-size:9px;fill:${palette['--f-gray']}}.mono{font-family:'DejaVu Sans Mono';font-size:11px}.cap{font-family:'DejaVu Sans Mono';font-size:9px;letter-spacing:1px;fill:${palette['--f-gray']}}.hand{font-style:italic;font-size:17px;fill:${palette['--f-acc']}}.ttl{font-weight:600;font-size:12.5px}`;
await mkdir('/tmp/system-design-figures',{recursive:true});
const manifest=[];
for(let start=0;start<figures.length;start+=12) {
 const batch=figures.slice(start,start+12);let content='',y=0;
 for(let i=0;i<batch.length;i+=2) {
  const row=batch.slice(i,i+2),height=Math.max(...row.map(f=>+f.svg.match(/viewBox="0 0 \d+ (\d+)"/)[1]));
  for(let j=0;j<row.length;j++) {
   const f=row[j],h=+f.svg.match(/viewBox="0 0 \d+ (\d+)"/)[1];
   const body=f.svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace(/var\((--f-[\w-]+)\)/g,(_,key)=>palette[key]||'#222222');
   content+=`<g transform="translate(${j*660+10},${y+30})"><text x="8" y="-10" style="font-size:11px">${f.id}</text><rect width="640" height="${h}" fill="${palette['--f-paper']}"/>${body}</g>`;
  }
  y+=height+55;
 }
 const stem=`/tmp/system-design-figures/sheet-${String(start/12+1).padStart(3,'0')}`;
 await writeFile(stem+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="${y}" viewBox="0 0 1320 ${y}"><style>${textStyles}</style><rect width="1320" height="${y}" fill="#e7e2d6"/>${content}</svg>`);
 execFileSync('rsvg-convert',['-o',stem+'.png',stem+'.svg']);manifest.push({path:stem+'.png',figures:batch.map(f=>f.id)});
}
await writeFile('/tmp/system-design-figures/manifest.json',JSON.stringify(manifest,null,2));
console.log(`${figures.length} figure functions, ${manifest.length} contact sheets.`);
