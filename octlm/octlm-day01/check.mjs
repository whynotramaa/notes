// Run with: node check.mjs. Uses the locally installed Chromium, no packages.
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=dirname(fileURLToPath(import.meta.url));
const profile=await mkdtemp(join(tmpdir(),'octlm-check-'));
const chrome=spawn('/usr/bin/chromium',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--remote-debugging-pipe',`--user-data-dir=${profile}`],{stdio:['ignore','ignore','pipe','pipe','pipe']});
const pending=new Map(),exceptions=[];let sequence=0,buffer='',session;
chrome.stderr.on('data',()=>{});
chrome.stdio[4].on('data',chunk=>{
  buffer+=chunk.toString();let at;
  while((at=buffer.indexOf('\0'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);if(!line)continue;const msg=JSON.parse(line);if(msg.id){const task=pending.get(msg.id);pending.delete(msg.id);if(task){clearTimeout(task.timer);msg.error?task.reject(Error(msg.error.message)):task.resolve(msg.result);}}if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params.exceptionDetails.text+' '+(msg.params.exceptionDetails.exception?.description||''));}
});
function cdp(method,params={},sessionId=session){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('Timed out: '+method));},15000);pending.set(id,{resolve,reject,timer});chrome.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');});}
async function evaluate(expression){const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
const click=id=>evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
const input=(id,value,event='input')=>evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true}));})()`);
try{
  const target=await cdp('Target.createTarget',{url:'about:blank'},null);
  session=(await cdp('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
  await cdp('Page.enable');await cdp('Runtime.enable');
  await cdp('Page.navigate',{url:'file://'+join(root,'index.html')});
  await evaluate(`new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(window.octlm){clearInterval(timer);document.fonts.ready.then(resolve);}else if(++n>80){clearInterval(timer);reject(Error('Notebook did not initialize'));}},50);})`);
  const math=await evaluate(`(()=>{
    const {softmax,distribution,attention,toyX,trainBPE,sinusoid,chunks}=octlm;
    const assert=(v,message)=>{if(!v)throw Error(message)};
    const p=softmax([1000,1001,1002]);assert(Math.abs(p.reduce((a,b)=>a+b)-1)<1e-12,'stable softmax');
    assert(softmax([0,-Infinity])[1]===0,'masked probability');
    assert(distribution([3,2,1],0,0).join(',')==='1,0,0','greedy');
    const top=distribution([3,2,1],1,2);assert(top[2]===0&&Math.abs(top[0]+top[1]-1)<1e-12,'top-k');
    const base=attention(toyX,2,true),x=toyX.map(r=>r.slice());x[3][0]+=10;
    const changed=attention(x,2,true);assert(JSON.stringify(base.out.slice(0,3))===JSON.stringify(changed.out.slice(0,3)),'causal dependency');
    for(const head of base.runs)for(let i=0;i<4;i++){assert(Math.abs(head.weights[i].reduce((a,b)=>a+b)-1)<1e-12,'attention row sum');assert(head.weights[i].slice(i+1).every(v=>v===0),'future attention');}
    const trained=trainBPE('banana banana banana',8);assert(trained.merges.length>0,'BPE learned merges');
    const last=trained.snapshots.at(-1).flat().flatMap(id=>trained.vocabulary[id]);assert(new TextDecoder().decode(new Uint8Array(last))==='banana banana banana','BPE exact byte round-trip');
    assert(JSON.stringify(chunks('x_1 = 30').map(c=>c.text))===JSON.stringify(['x_','1',' ','=',' ','30']),'chunk boundaries');
    assert(JSON.stringify(sinusoid(0))==='[0,1,0,1]','position waves');
    return 'Numerical checks passed';
  })()`);
  console.log(math);
  await click('play');
  const paths=await evaluate('octlm.chapters.map(c=>c.id)');
  await mkdir(join(root,'preview'),{recursive:true});
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  for(let i=0;i<paths.length;i++){
    await evaluate(`octlm.navigate(${i})`);
    assert.equal(await evaluate(`document.querySelectorAll('.drawing').length`),4);
    const overflow=await evaluate(`Array.from(document.querySelectorAll('.sk-label')).filter(e=>{const b=e.getBBox();return b.x<-2||b.y<-2||b.x+b.width>402||b.y+b.height>242;}).map(e=>e.textContent)`);
    assert.deepEqual(overflow,[],paths[i]+' SVG text overflow');
    const screenshot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    await writeFile(join(root,'preview',paths[i]+'.png'),Buffer.from(screenshot.data,'base64'));
  }
  await evaluate('octlm.navigate(0)');await input('text-control','猫 café');assert.equal(await evaluate('octlm.state.text'),'猫 café');
  await evaluate('octlm.navigate(1)');await click('merge-next');assert.equal(await evaluate('octlm.state.merge'),1);await click('merge-reset');
  await evaluate('octlm.navigate(5)');await click('mask-control');assert.equal(await evaluate('octlm.state.mask'),false);await click('mask-control');
  await evaluate('octlm.navigate(9)');await input('temperature',.5);assert.equal(await evaluate('octlm.state.temperature'),.5);
  await evaluate('octlm.navigate(10)');await click('draw-many');assert.equal(await evaluate('octlm.state.counts.reduce((a,b)=>a+b,0)'),100);await click('reset-tokens');await click('draw-token');const first=await evaluate('octlm.state.lastPick');await click('reset-tokens');await click('draw-token');assert.equal(await evaluate('octlm.state.lastPick'),first,'seeded sampling');
  await click('cinema');assert.equal(await evaluate('document.getElementById("presentation").open'),true);await click('next-scene');await click('close-presentation');assert.equal(await evaluate('document.querySelectorAll("#drawings .drawing").length'),4,'focus restores drawings');
  await evaluate('octlm.navigate(0)');await input('text-control','the cat sat');
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate('document.documentElement.scrollWidth<=390'),true,'mobile horizontal overflow');
  const metrics=await cdp('Page.getLayoutMetrics');
  const mobile=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:390,height:metrics.cssContentSize.height,scale:1}});
  await writeFile(join(root,'preview','mobile.png'),Buffer.from(mobile.data,'base64'));
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await evaluate('octlm.navigate(4)');assert.equal(await evaluate('document.querySelector("svg.sketch").animationsPaused()'),true,'reduced motion stops SVG motion');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate('document.getElementById("theme").click()');
  const dark=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(join(root,'preview','dark.png'),Buffer.from(dark.data,'base64'));
  assert.deepEqual(exceptions,[]);
  console.log('11 topics, 44 diagrams, all playground controls, presenter mode, phone layout, and reduced motion passed.');
}finally{chrome.kill('SIGTERM');await new Promise(resolve=>chrome.once('exit',resolve));await rm(profile,{recursive:true,force:true});}
