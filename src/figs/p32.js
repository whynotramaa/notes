import { D, C } from '../lib/draw.js';
import N from '../data/training-numbers.json' with { type: 'json' };

export function train_shift() {
  // Two aligned eight-column rows with labels outside the token chips.
  const d=new D(640,255,'train_shift');
  d.text(10,16,'ONE EXTRA SOURCE TOKEN SUPPLIES THE LAST LABEL',{cls:'cap',a:'start'});
  [['input',N.batch.input],['target',N.batch.target]].forEach(([name,vals],r)=>{
    const y=67+r*98;
    d.text(18,y+17,name,{a:'start',cls:'mono',size:11});
    vals.forEach((v,i)=>d.box(90+i*67,y,57,34,String(v),{cls:'mono',fill:r?C.accSoft:C.card,stroke:r?C.acc:C.ink2,size:12}));
  });
  N.batch.input.forEach((_,i)=>d.arrow(118+i*67,106,118+i*67,159,{stroke:C.acc}));
  d.hand(320,231,'each column predicts the next source token',{size:19});return d.svg();
}
export function train_batch() {
  const d=new D(640,270,'train_batch');
  d.text(10,16,'BATCH AND TIME ARE SEPARATE AXES',{cls:'cap',a:'start'});
  d.text(30,66,'input IDs',{cls:'ttl',a:'start'});d.text(350,66,'target IDs',{cls:'ttl',a:'start'});
  [30,350].forEach((x,k)=>{
    d.grid(x,92,2,8,31,35,{cellFill:()=>k?C.accFaint:C.card,val:(r,c)=>r===0?(k?N.batch.target:N.batch.input)[c]:'…',vsize:10});
    d.mono(x+124,186,'shape (2, 8)',{size:12});
  });
  d.arrow(291,128,337,128,{stroke:C.acc});
  d.brace(30,598,209,{label:'16 aligned predictions per microbatch',cls:'mono',color:C.acc});
  d.text(320,254,'the second row is another sampled window',{cls:'sm'});return d.svg();
}
export function train_split_leak() {
  const d=new D(640,300,'train_split_leak');
  d.text(10,16,'SPLIT AT THE SOURCE, THEN MAKE WINDOWS',{cls:'cap',a:'start'});
  d.box(231,45,178,35,'1,000 documents',{fill:C.card,cls:'mono',size:12});
  const names=['train: 800','validation: 100','test: 100'];
  names.forEach((s,i)=>{
    const x=16+i*210;
    d.box(x,127,187,38,s,{fill:i?C.card:C.accSoft,stroke:i?C.ink2:C.acc,cls:'mono',size:11});
    d.arrow(320,82,x+94,123,{stroke:C.line});
    d.box(x,215,187,37,'windows from this split',{fill:C.card,size:11});
    d.arrow(x+94,168,x+94,211,{stroke:i?C.ink2:C.acc});
  });
  d.line(218,108,218,262,{stroke:C.acc,dash:[4,5]});d.line(428,108,428,262,{stroke:C.line,dash:[4,5]});
  d.hand(320,280,'overlapping windows stay with their source',{size:18});return d.svg();
}
export function train_loss_reduction() {
  const d=new D(640,280,'train_loss_reduction');
  d.text(10,16,'THE TOKEN MEAN COMBINES ALL VALID NEXT-TOKEN LOSSES',{cls:'cap',a:'start'});
  [.5,.25,.125,.125].forEach((p,i)=>{
    const x=20+i*155;
    d.box(x,52,136,33,`p = ${p}`,{fill:C.card,cls:'mono',size:11});
    d.arrow(x+68,88,x+68,116,{stroke:C.ink2});
    d.box(x,120,136,40,N.loss.per_token[i].toFixed(6),{fill:C.accSoft,stroke:C.acc,cls:'mono',size:12});
    d.mono(x+68,183,'-ln p',{size:11});
  });
  d.brace(20,621,207,{label:'sum 6.238325 / 4 = 1.559581 nats per token',cls:'mono',color:C.acc});
  d.text(320,261,'masked labels contribute neither loss nor denominator',{cls:'sm'});return d.svg();
}
export function train_backprop() {
  const d=new D(640,320,'train_backprop');
  d.text(10,16,'FORWARD VALUES AND REVERSE DERIVATIVES',{cls:'cap',a:'start'});
  const values=[['w × x','0.5 × 2 = 1'],['sigmoid','p = 0.731059'],['NLL','loss = 0.313262']];
  values.forEach(([s,v],i)=>{
    const x=20+i*211;
    d.box(x,60,180,53,`${s}\n${v}`,{fill:C.card,cls:'mono',size:11});
    if(i<2)d.arrow(x+184,87,x+207,87,{stroke:C.ink2});
  });
  const derivatives=['dw = -0.537883','dz = -0.268941','incoming = 1'];
  derivatives.forEach((v,i)=>{
    const x=20+i*211;
    d.box(x,202,180,40,v,{fill:C.accSoft,stroke:C.acc,cls:'mono',size:11});
    if(i>0)d.arrow(x-4,222,x-27,222,{stroke:C.acc});
  });
  d.arrow(532,118,532,196,{stroke:C.acc});
  d.text(110,167,'multiply by x = 2',{cls:'sm'});d.text(321,167,'p - target',{cls:'sm'});
  d.mono(320,286,'SGD at η = 0.1 gives new w = 0.553788',{size:12,color:C.acc});return d.svg();
}
export function train_token_weighting() {
  const d=new D(640,255,'train_token_weighting');
  d.text(10,16,'AVERAGE TOKENS, NOT MEANS OF UNEQUAL BATCHES',{cls:'cap',a:'start'});
  d.box(18,58,277,75,'batch A: 2 valid tokens\nmean loss 2, sum loss 4',{fill:C.card,cls:'mono',size:12});
  d.box(345,58,277,75,'batch B: 6 valid tokens\nmean loss 4, sum loss 24',{fill:C.card,cls:'mono',size:12});
  d.box(18,182,277,41,'wrong: (2 + 4) / 2 = 3',{fill:C.card,cls:'mono',size:11});
  d.box(345,182,277,41,'right: (4 + 24) / 8 = 3.5',{fill:C.accSoft,stroke:C.acc,cls:'mono',size:11});
  d.arrow(480,137,480,178,{stroke:C.acc});return d.svg();
}
