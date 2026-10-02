import { D, C } from '../lib/draw.js';
import N from '../data/training-numbers.json' with { type: 'json' };

export function train_loss_curves() {
  const d=new D(640,350,'train_loss_curves');
  d.text(10,16,'BETTER FIT TO TRAINING TEXT CAN COINCIDE WITH WORSE HELD-OUT FIT',{cls:'cap',a:'start'});
  const M=d.axes(69,75,482,205,{xmin:0,xmax:1000,ymin:1,ymax:5,yl:'NLL / token'});
  [2,3,4,5].forEach(v=>{d.line(69,M.Y(v),551,M.Y(v),{stroke:C.faint,sw:.6});d.mono(49,M.Y(v),v,{size:11});});
  [0,400,600,1000].forEach(v=>d.mono(M.X(v),301,v,{size:11}));
  const n=N.evaluation_curves;
  d.lines(n.updates.map((v,i)=>[M.X(v),M.Y(n.training[i])]),{stroke:C.ink2,single:true,sw:1.8,rough:.3});
  d.lines(n.updates.map((v,i)=>[M.X(v),M.Y(n.validation[i])]),{stroke:C.acc,single:true,sw:2.2,rough:.3});
  d.dot(M.X(600),M.Y(2.55),5,C.acc);d.line(M.X(600),M.Y(2.55)+9,M.X(600),280,{stroke:C.acc,dash:[3,4]});
  d.text(157,51,'training',{size:14});d.text(308,51,'validation',{size:14,color:C.acc});
  d.hand(420,125,'best held-out point',{size:19});d.text(320,330,'illustrative update count; not measured results',{cls:'sm'});return d.svg();
}
export function train_metric_reduction() {
  const d=new D(640,340,'train_metric_reduction');
  d.text(10,16,'THE DENOMINATOR BELONGS TO TOKENS, NOT BATCHES',{cls:'cap',a:'start'});
  d.text(96,62,'batch A',{size:14});d.text(433,62,'batch B',{size:14});
  [2,6].forEach((n,i)=>{const x=i?278:31;for(let j=0;j<n;j++){d.rect(x+j*52,91,43,48,{fill:i?C.accSoft:C.card,stroke:i?C.acc:C.ink2});d.mono(x+j*52+21,115,i?4:2,{size:15});}});
  d.text(96,174,'2 tokens × 2 = 4',{cls:'mono',size:12});d.text(433,174,'6 tokens × 4 = 24',{cls:'mono',size:12});
  d.arrow(96,197,245,237,{stroke:C.line});d.arrow(433,197,395,237,{stroke:C.acc});
  d.text(320,262,'28 nats / 8 tokens = 3.5',{cls:'mono',size:18,color:C.acc});
  d.hand(320,311,'each label gets the same vote',{size:21});return d.svg();
}
export function train_perplexity_geometry() {
  const d=new D(640,340,'train_perplexity_geometry');
  d.text(10,16,'PERPLEXITY IS A GEOMETRIC AVERAGE OF RECIPROCAL PROBABILITIES',{cls:'cap',a:'start'});
  const values=N.evaluation_curves.per_token_ppl;
  values.forEach((v,i)=>{const x=62+i*148;d.rect(x,237-v*18,70,v*18,{fill:C.accSoft,stroke:C.acc,r:2});d.mono(x+35,255,[.5,.25,.125,.125][i],{size:12});d.mono(x+35,221-v*18,v,{size:15});});
  d.line(43,237-4.756828*18,604,237-4.756828*18,{stroke:C.ink2,dash:[4,5]});
  d.text(320,62,'(2 × 4 × 8 × 8)¹ᐟ⁴ = 4.756828',{cls:'mono',size:16});
  d.text(320,296,'target probabilities below; reciprocal penalties above',{size:13});return d.svg();
}
export function train_eval_windows() {
  const d=new D(640,355,'train_eval_windows');
  d.text(10,16,'OVERLAP IS CONTEXT; ONLY NEW TARGETS ENTER THE METRIC',{cls:'cap',a:'start'});
  d.text(26,69,'target index',{a:'start',size:12});
  for(let i=0;i<12;i++)d.mono(173+i*36,68,i+1,{size:11});
  [[0,8,0],[4,12,8]].forEach(([start,end,score],r)=>{
    const y=114+r*107;d.text(25,y+21,`window ${r+1}`,{a:'start',size:13});
    for(let i=start;i<end;i++){d.rect(156+i*36,y,32,42,{fill:i>=score?C.accSoft:C.card,stroke:i>=score?C.acc:C.line,r:3});d.mono(172+i*36,y+21,i>=score?'✓':'·',{size:14});}
    if(r===1)d.text(297,y+72,'four reused context targets',{size:12});
  });
  d.text(475,296,'four newly scored targets',{size:12,color:C.acc});return d.svg();
}
export function train_bpb_segmentation() {
  const d=new D(640,350,'train_bpb_segmentation');
  d.text(10,16,'A COMMON RAW-BYTE DENOMINATOR SURVIVES A TOKENIZER CHANGE',{cls:'cap',a:'start'});
  d.text(24,70,'raw bytes',{a:'start',size:13});
  for(let i=0;i<8;i++){d.rect(154+i*54,51,48,37,{fill:C.card,r:3});d.mono(178+i*54,70,`b${i+1}`,{size:12});}
  d.text(24,137,'tokenizer A',{a:'start',size:13});d.text(24,204,'tokenizer B',{a:'start',size:13});
  for(let i=0;i<4;i++)d.box(154+i*108,118,102,38,`token ${i+1}`,{fill:C.accSoft,stroke:C.acc,size:12});
  for(let i=0;i<8;i++)d.box(154+i*54,185,48,38,String(i+1),{fill:C.card,cls:'mono',size:12});
  d.text(174,267,'PPL 4 versus PPL 2',{size:16});d.text(465,267,'BPB 1 for both',{size:16,color:C.acc});
  d.hand(320,318,'same eight bits of total coding cost',{size:21});return d.svg();
}
export function train_nll_curve() {
  const d=new D(640,330,'train_nll_curve');
  d.text(10,16,'CONFIDENT MISTAKES ARE EXPENSIVE',{cls:'cap',a:'start'});
  const M=d.axes(70,70,485,195,{xmin:0,xmax:1,ymin:0,ymax:5,yl:'-ln p'});
  d.fn(p=>-Math.log(p),.01,1,M,{stroke:C.acc,n:180});
  [.125,.25,.5,1].forEach(p=>{const loss=-Math.log(p);d.dot(M.X(p),M.Y(loss),4,C.acc);d.mono(M.X(p),289,p,{size:11});});
  d.text(427,119,'correct-token probability',{size:13});d.hand(382,206,'a small probability carries a large penalty',{size:20});return d.svg();
}
