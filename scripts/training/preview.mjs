import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const names = process.argv.slice(2);
assert(names.length, 'Pass figure file numbers, for example: node scripts/training/preview.mjs 30 31');
const out = '/tmp/training-preview';
await mkdir(out, { recursive: true });
const css = await readFile('src/styles/site.css', 'utf8');
const figures = [];
const fonts = [['Syne','syne','600'],['IBM Plex Mono','ibm-plex-mono','400'],['Caveat','caveat','600']].map(([family,pkg,w])=>`@font-face{font-family:"${family}";font-weight:${w};src:url("${pathToFileURL(`${process.cwd()}/node_modules/@fontsource/${pkg}/files/${pkg}-latin-${w}-normal.woff2`).href}")}`).join('');
for (const n of names) {
  const mod = await import(pathToFileURL(`${process.cwd()}/src/figs/p${n}.js`));
  for (const [id, fn] of Object.entries(mod)) {
    const svg = fn();
    assert(!/NaN|undefined|Infinity/.test(svg), id);
    figures.push({ id, svg });
  }
}
await writeFile(`${out}/index.html`, `<!doctype html><meta charset="utf-8"><style>${fonts}${css}\nbody{padding:20px;display:block;background:var(--paper)}.preview{width:640px;background:var(--card);margin:20px;padding:0}.preview svg{width:640px;max-width:none}</style>${figures.map(f=>`<div class="preview" id="${f.id}">${f.svg}</div>`).join('')}`);
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 760, height: 900 } });
await page.goto(pathToFileURL(`${out}/index.html`).href);
await page.evaluate(()=>document.fonts.ready);
const defects = [];
for (const { id } of figures) {
  const svg = page.locator(`#${id} svg`);
  await svg.screenshot({ path: `${out}/${id}.png` });
  const labels = await svg.evaluate(el => [...el.querySelectorAll('text')].filter(t => {
    const b=t.getBBox(), v=el.viewBox.baseVal;
    return b.x < 0 || b.y < 0 || b.x+b.width > v.width || b.y+b.height > v.height;
  }).map(t=>t.textContent));
  if (labels.length) defects.push({ id, labels });
}
await page.addStyleTag({content:'body{display:grid;grid-template-columns:640px 640px;gap:20px;padding:20px}.preview{margin:0}'});
await page.setViewportSize({width:1320,height:900});
await page.screenshot({path:`${out}/parts-${names.join('-')}.png`,fullPage:true});
console.log(JSON.stringify({ figures: figures.length, defects, out }, null, 2));
await browser.close();
assert.equal(defects.length, 0, 'Clipped figure text');
