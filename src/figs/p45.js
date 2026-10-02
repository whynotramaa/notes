import { D, C, fmtN } from '../lib/draw.js';

export function before_after_paired_tasks() {
  const d=new D(640,300,'before_after_paired_tasks');
  d.text(10,16,'PAIR THE SAME TASKS BEFORE AND AFTER TRAINING',{cls:'cap',a:'start'});
  ['before: 12 / 20','after: 16 / 20'].forEach((s,r)=>{
    const y=79+r*70;d.text(19,y-23,s,{cls:'ttl',a:'start',size:13});
    for(let i=0;i<20;i++){
      const x=22+i*30,ok=r?i<16:i<10||(i>=16&&i<18);
      d.circle(x+10,y,18,{fill:ok?(r?C.accSoft:C.faint):C.paper,stroke:ok?(r?C.acc:C.ink2):C.line,sw:.8});
      if(!ok)d.line(x+6,y-4,x+14,y+4,{stroke:C.line,single:true});
    }
  });
  d.brace(317,487,195,{label:'6 gained',cls:'mono',color:C.acc});
  d.brace(501,551,195,{label:'2 lost',cls:'mono'});
  d.hand(320,267,'a net gain can hide new failures',{size:20});
  return d.svg();
}

export function generalization_axes_agents() {
  const d=new D(640,326,'generalization_axes_agents');
  d.text(10,16,'CHANGE ONE GENERALIZATION AXIS AT A TIME',{cls:'cap',a:'start'});
  const entries=[['wording','reserve -> set aside'],['values','3 bolts -> 5 nuts'],['combination','one item -> dependent items'],['environment','enough -> insufficient']];
  entries.forEach(([s,example],i)=>{
    const y=61+i*57;
    d.text(18,y,s,{cls:'ttl',a:'start',size:13});
    d.line(151,y,203,y,{stroke:C.line});
    d.text(221,y,example,{cls:'mono',a:'start',size:12,color:i===2?C.acc:C.ink});
  });
  d.hand(320,303,'new words and new decisions test different things',{size:19});
  return d.svg();
}

export function error_bucket_ledger() {
  const d=new D(640,306,'error_bucket_ledger');
  d.text(10,16,'AN ERROR LEDGER KEEPS ONE PRIMARY CAUSE PER FAILED TASK',{cls:'cap',a:'start'});
  const rows=[['wrong tool','selection'],['wrong arguments','meaning'],['invalid syntax','representation'],['premature answer','completion'],['unnecessary calls','restraint']];
  rows.forEach(([s,kind],i)=>{
    const y=51+i*44;
    d.text(20,y+13,s,{cls:'mono',a:'start',size:12});
    d.line(240,y+13,406,y+13,{stroke:C.line});
    d.box(421,y,194,27,kind,{fill:i===3?C.accSoft:C.card,stroke:i===3?C.acc:C.line,size:12});
  });
  d.text(320,289,'secondary tags describe other effects without double-counting tasks',{cls:'sm'});
  return d.svg();
}

export function model_preparation_path() {
  const d=new D(640,334,'model_preparation_path');
  d.text(10,16,'EACH TRANSFORMATION CREATES ANOTHER ARTIFACT TO VALIDATE',{cls:'cap',a:'start'});
  const rows=[['base + adapter','dynamic correction','A, B retained'],['merged model','W + scale BA','standalone weights'],['INT8 artifact','rounded effective weights','scales + packed values']];
  rows.forEach(([s,math,note],i)=>{
    const y=53+i*88;
    d.box(22,y,224,42,s,{fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2,size:13});
    d.text(285,y+12,math,{cls:'mono',a:'start',size:11});
    d.text(285,y+33,note,{cls:'sm',a:'start'});
    if(i<2)d.arrow(134,y+47,134,y+80,{stroke:C.gray});
  });
  d.hand(320,315,'check logits, generation, and complete tool tasks',{size:20});
  return d.svg();
}

export function quantization_number_line() {
  const d=new D(640,294,'quantization_number_line');
  d.text(10,16,'ROUNDING MOVES A VALUE TO A REPRESENTABLE GRID POINT',{cls:'cap',a:'start'});
  const X=v=>70+(v-.47)/.06*500;
  d.arrow(59,128,589,128,{stroke:C.ink2});
  for(let q=60;q<=67;q++){
    const x=X(q/127);
    d.line(x,117,x,139,{stroke:C.line});
    d.mono(x,162,String(q),{size:10});
  }
  d.dot(X(.5),95,4,C.ink);d.text(X(.5),67,'x = 0.5',{cls:'mono',size:12});
  d.arrow(X(.5),99,X(64/127),118,{stroke:C.acc});
  d.dot(X(64/127),128,4,C.acc);
  d.mono(320,211,'q = round(0.5 x 127) = 64',{size:12});
  d.mono(320,242,'x restored = 64 / 127 = 0.503937',{size:11,color:C.acc});
  return d.svg();
}

export function complete_agent_architecture() {
  const d=new D(640,415,'complete_agent_architecture');
  d.text(10,16,'ONE REQUEST CROSSES THE MODEL PATH AND THE ACTION PATH',{cls:'cap',a:'start'});
  d.chips(17,53,['request'],{width:106,h:36});
  d.arrow(128,71,168,71,{stroke:C.gray});
  d.box(174,53,199,36,'template + tokenizer',{fill:C.card,size:12});
  d.arrow(379,71,418,71,{stroke:C.gray});
  d.box(424,53,196,36,'Finch-24 + adapter',{fill:C.accSoft,stroke:C.acc,size:12});
  d.arrow(522,94,522,135,{stroke:C.acc});
  d.box(419,141,201,43,'parse + validate',{fill:C.card,size:13});
  d.arrow(414,162,375,162,{stroke:C.gray});
  d.box(175,141,198,43,'allowed tool registry',{fill:C.card,size:12});
  d.arrow(274,191,274,234,{stroke:C.gray});
  d.rect(171,241,206,73,{fill:C.card});
  d.text(274,262,'inventory service',{cls:'ttl',size:13});
  d.mono(274,293,'17 - 5 - 3 = 9',{size:12,color:C.acc});
  d.carrow([[382,281],[399,281],[399,331],[77,331],[77,315]],{stroke:C.gray});
  d.text(505,281,'result + receipt',{cls:'sm'});
  d.rect(18,137,117,174,{fill:C.card,r:3});
  d.text(77,160,'state',{cls:'ttl',size:13});
  ['messages','call IDs','operation keys','step budget','cache identity'].forEach((s,i)=>d.text(77,187+i*24,s,{cls:'mono',size:8.5}));
  d.carrow([[137,209],[151,209],[151,115],[274,115],[274,96]],{stroke:C.line});
  d.line(18,345,622,345,{stroke:C.line});
  d.text(320,374,'evaluation observes every boundary and the final inventory state',{cls:'ttl',size:12});
  d.text(320,402,`${fmtN(40509952)} base + ${fmtN(606208)} adapter = ${fmtN(41116160)} parameters`,{cls:'mono',size:10.5});
  return d.svg();
}

export function recovery_scenarios_agents(){
  const d=new D(640,300,'recovery_scenarios_agents');
  d.text(10,16,'FOUR SCENARIOS, ONE CHECK: DID EXACTLY THE RIGHT RESERVATION COMMIT?',{cls:'cap',a:'start'});
  d.text(110,44,'scenario',{cls:'ttl'});d.text(350,44,'path',{cls:'ttl'});d.text(570,44,'available after',{cls:'ttl'});
  const rows=[
    ['normal, quantity 3','read → reserve → report','9',false],
    ['insufficient, quantity 13','read → refuse','12',false],
    ['error before commit','reserve ✗ → corrected reserve','9',false],
    ['lost response after commit','reserve ? → same key r1 → receipt','9',true],
  ];
  rows.forEach(([a,b,c,acc],i)=>{
    const y=62+i*52;
    d.box(20,y,180,34,a,{fill:C.card,stroke:C.ink2,size:10.5});
    d.box(214,y,272,34,b,{fill:acc?C.accSoft:C.card,stroke:acc?C.acc:C.ink2,size:10.5});
    d.mono(570,y+17,c,{size:13,color:acc?C.acc:undefined});
  });
  d.text(320,286,'illustrative fixtures starting from 12 available; a second commit would leave 6',{cls:'sm'});
  return d.svg();
}

export function artifact_payload_ladder(){
  const d=new D(640,280,'artifact_payload_ladder');
  d.text(10,16,'IDEAL WEIGHT PAYLOAD FOR EACH FORM OF THE ADAPTED FINCH-24',{cls:'cap',a:'start'});
  const rows=[['base + adapter, 16-bit',82232320,'81,019,904 + 1,212,416'],['merged, 16-bit',81019904,'81,019,904'],['merged, INT8 ideal',40509952,'40,509,952'],['KV cache, 16-bit',33554432,'33,554,432']];
  const s=300/82232320;
  rows.forEach(([n,b,lab],i)=>{
    const y=48+i*50,q=i===2,kv=i===3;
    d.text(20,y+15,n,{cls:'sm',a:'start'});
    if(i===0){d.rect(170,y,81019904*s,30,{fill:C.card,stroke:C.ink2,r:0});d.rect(170+81019904*s,y,Math.max(4,1212416*s),30,{fill:C.accSoft,stroke:C.acc,r:0});}
    else d.rect(170,y,b*s,30,{fill:q?C.accSoft:kv?C.slateSoft:C.card,stroke:q?C.acc:kv?C.slate:C.ink2,r:0});
    d.mono(178+b*s,y+15,lab,{a:'start',size:10});
  });
  d.text(320,250,'bytes; batch 2 at 4,096 tokens for the cache, which weight quantization leaves at its own dtype',{cls:'xs'});
  d.text(320,266,'scales, unquantized norms, packing and buffers make real files and peak memory larger',{cls:'xs'});
  return d.svg();
}
