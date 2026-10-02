const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.GUIDE_URL||'http://127.0.0.1:4321';
const out='/tmp/training-pages';await mkdir(out,{recursive:true});
const files=(await readdir('src/content/octlm/training')).filter(f=>/^\d.*\.md$/.test(f)).sort();
const paths=['',...files.map(f=>f.slice(0,-3)+'/')];
const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
const errors=[],results=[];
for(const width of [1280,390]) for(const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('requestfailed',r=>errors.push(`${r.url()}: ${r.failure()?.errorText}`));
  for(const path of paths) {
    const response=await page.goto(`${base}/octlm/training/${path}`);
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(response.status(),200,path);
    const report=await page.evaluate(()=>({
      overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
      failedImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),
      svgCount:document.querySelectorAll('main svg.fig').length,
      missing:[...document.querySelectorAll('.err')].map(e=>e.textContent),
      badGeometry:[...document.querySelectorAll('main svg')].filter(s=>!s.querySelector('path')||!s.getBoundingClientRect().width).length,
    }));
    assert.equal(report.overflow,0,`${width} ${theme} ${path} overflow`);assert.deepEqual(report.failedImages,[]);assert.deepEqual(report.missing,[]);assert.equal(report.badGeometry,0);
    results.push({path,width,theme,...report});
    const name=path.split('/')[0]||'front';
    if(['front','01-feature-mixing','05-initialization-precision-memory','07-evaluation','99-interview'].includes(name)) {
      await page.screenshot({path:`${out}/${name}-${width}-${theme}.png`});
      const figure=page.locator(name==='07-evaluation'?'#fig-train_loss_curves':name==='05-initialization-precision-memory'?'#fig-train_precision_spacing':name==='01-feature-mixing'?'#fig-train_activation_backward':'.hero');
      if(await figure.count())await figure.screenshot({path:`${out}/figure-${name}-${width}-${theme}.png`});
    }
    await page.getByRole('button',{name:'Contents',exact:true}).click();
    assert(await page.locator('#contents-dialog').isVisible());
    await page.keyboard.press('Escape');assert(!(await page.locator('#contents-dialog').isVisible()));
    assert.equal(await page.locator('#contents-open').evaluate(el=>document.activeElement===el),true);
  }
  await page.goto(`${base}/octlm/training/07-evaluation/`);
  await page.evaluate(()=>window.scrollTo(0,document.getElementById('s22').getBoundingClientRect().top+scrollY-100));
  await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-section-link="s22"]').getAttribute('aria-current'),'location','Scrollspy');
  await page.getByRole('button',{name:'Contents',exact:true}).click();
  await page.screenshot({path:`${out}/contents-${width}-${theme}.png`});
  await page.locator('[data-section-link="s23"]').click();
  assert(!(await page.locator('#contents-dialog').isVisible()));assert(page.url().endsWith('#s23'));
  await context.close();
}
const context=await browser.newContext({viewport:{width:320,height:800},reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();
await page.goto(`${base}/octlm/training/06-checkpoints-loop/`);await page.evaluate(()=>document.fonts.ready);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'320px overflow');
const expected=await page.locator('.code-wrap code').first().textContent();await page.locator('.code-copy').first().click();
assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),expected,'Clipboard contents');
await page.screenshot({path:`${out}/loop-320.png`});
await page.setViewportSize({width:1280,height:900});
await page.evaluate(()=>{const ps=[...document.querySelectorAll('.guide-content > p')];const p=ps.find((p,i)=>p.nextElementSibling===ps[i+1]&&[p,ps[i+1]].every(b=>b.firstChild?.nodeType===Node.TEXT_NODE&&b.firstChild.length>=45));window.scrollTo(0,p.getBoundingClientRect().top+scrollY-90);});
assert(await page.evaluate(async code => await eval(code), await readFile('scripts/check-highlights.js','utf8')), 'Highlight browser check');
await page.screenshot({path:`${out}/highlight-check.png`});
await browser.close();assert.deepEqual(errors,[],'Browser errors');
const report={pages:results.length,errors,results};await writeFile('scripts/training/browser-report.json',JSON.stringify(report,null,2)+'\n');console.log({pages:results.length,errors,overflow:0,out});
