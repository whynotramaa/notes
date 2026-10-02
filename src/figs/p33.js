import { D, C } from '../lib/draw.js';
import N from '../data/training-numbers.json' with { type: 'json' };

export function train_adam_moments() {
  // Two aligned update rows distinguish stored buffers from corrected buffers.
  const d=new D(640,285,'train_adam_moments');
  d.text(10,16,'ADAM: AVERAGE, CORRECT THE ZERO START, THEN NORMALIZE',{cls:'cap',a:'start'});
  ['update','gradient','stored m / v','corrected m / v'].forEach((s,i)=>d.text([38,137,302,510][i],56,s,{cls:'ttl',size:11}));
  [[1,.2,N.optimizer.m1,N.optimizer.v1,.2,.04],[2,.4,N.optimizer.m2,N.optimizer.v2,N.optimizer.mh2,N.optimizer.vh2]].forEach(([s,g,m,v,mh,vh],i)=>{
    const y=88+i*82;
    d.mono(38,y+26,s,{size:14});d.mono(137,y+26,g.toFixed(1),{size:14});
    d.box(212,y,180,57,`${m.toFixed(6)}\n${v.toFixed(8)}`,{fill:C.card,cls:'mono',size:11});
    d.arrow(396,y+28,413,y+28,{stroke:C.acc});
    d.box(418,y,185,57,`${mh.toFixed(6)}\n${vh.toFixed(6)}`,{fill:C.accSoft,stroke:C.acc,cls:'mono',size:11});
  });
  d.mono(320,260,'β₁ = 0.9, β₂ = 0.999, m₀ = v₀ = 0',{size:11});return d.svg();
}
export function train_decay_routes() {
  const d=new D(640,295,'train_decay_routes');
  d.text(10,16,'WHERE DECAY ENTERS THE UPDATE CHANGES ITS MEANING',{cls:'cap',a:'start'});
  [['Adam + L2',50,'g + λθ'],['AdamW',169,'g only']].forEach(([title,y,gradient],i)=>{
    d.text(15,y+14,title,{cls:'ttl',a:'start',size:12});
    d.box(130,y,110,36,gradient,{fill:C.card,cls:'mono',size:12});
    d.box(292,y,154,36,'moments + normalize',{fill:C.card,size:11});
    d.box(496,y,125,36,'update θ',{fill:C.card,size:12});
    d.arrow(242,y+18,288,y+18,{stroke:C.ink2});d.arrow(450,y+18,492,y+18,{stroke:C.ink2});
    if(i){d.box(280,y+64,209,35,'separate (1 - ηλ) θ',{fill:C.accSoft,stroke:C.acc,cls:'mono',size:11});d.carrow([[492,y+82],[560,y+80],[560,y+39]],{stroke:C.acc});}
  });
  d.hand(320,278,'the L2 term enters the moments; AdamW shrinkage does not',{size:18});return d.svg();
}
export function train_clip() {
  const d=new D(640,310,'train_clip');
  d.text(10,16,'SAME DIRECTION, SMALLER GLOBAL GRADIENT',{cls:'cap',a:'start'});
  const M=d.axes(85,55,290,203,{xmin:0,xmax:4,ymin:0,ymax:5,xl:'g₁',yl:'g₂'});
  d.arrow(M.X(0),M.Y(0),M.X(3),M.Y(4),{stroke:C.ink2,sw:1.7});
  d.arrow(M.X(0),M.Y(0),M.X(.6),M.Y(.8),{stroke:C.acc,sw:2});
  d.mono(M.X(3)+12,M.Y(4),'[3,4]',{a:'start',size:12});
  d.mono(430,97,'norm = 5',{a:'start',size:12});d.mono(430,133,'threshold = 1',{a:'start',size:12});
  d.mono(430,169,'scale = 0.2',{a:'start',size:12,color:C.acc});d.mono(430,205,'[0.6,0.8]',{a:'start',size:12,color:C.acc});
  d.hand(320,287,'clip the raw gradient before the optimizer reads it',{size:18});return d.svg();
}
export function train_clip_order() {
  const d=new D(640,275,'train_clip_order');
  d.text(10,16,'CLIPPING AND ADDITION DO NOT COMMUTE',{cls:'cap',a:'start'});
  [['clip each, then add','[3,0] → [1,0]','[-2,0] → [-1,0]','sum = [0,0]'],['add, then clip','[3,0] + [-2,0]','sum = [1,0]','clipped = [1,0]']].forEach(([title,a,b,result],i)=>{
    const x=18+i*321;
    d.text(x+139,55,title,{cls:'ttl',size:12});
    d.mono(x+139,96,a,{size:11});d.mono(x+139,132,b,{size:11});
    d.box(x,181,279,40,result,{fill:i?C.accSoft:C.card,stroke:i?C.acc:C.ink2,cls:'mono',size:12});
  });
  d.text(320,252,'threshold 1 in this illustrative example',{cls:'sm'});return d.svg();
}
export function train_schedule() {
  const d=new D(640,300,'train_schedule');
  d.text(10,16,'LEARNING RATE IS A FUNCTION OF A DECLARED UPDATE COUNTER',{cls:'cap',a:'start'});
  const M=d.axes(74,57,500,178,{xmin:0,xmax:1000,ymin:0,ymax:.0011,yl:'η'});
  const f=s=>s<100?.001*s/100:.0001+.00045*(1+Math.cos(Math.PI*(s-100)/900));
  d.fn(f,0,1000,M,{stroke:C.acc,n:150});
  [100,1000].forEach(s=>d.line(M.X(s),M.Y(0),M.X(s),M.Y(.0011),{stroke:C.line,dash:[3,5]}));
  N.schedule.points.forEach(([s,v])=>{d.dot(M.X(s),M.Y(v),3,C.acc);d.mono(M.X(s),251,String(s),{size:10});});
  d.mono(77,35,'peak 0.001',{a:'start',size:11});d.mono(410,216,'minimum 0.0001',{a:'start',size:11});
  d.hand(320,281,'microbatches and successful updates are different clocks',{size:18});return d.svg();
}
export function train_decay_groups() {
  const d=new D(640,240,'train_decay_groups');
  d.text(10,16,'AN ILLUSTRATIVE FINCH-24 DECAY POLICY',{cls:'cap',a:'start'});
  d.box(17,62,286,92,'matrix parameters\n40,501,248 scalars\ndecay applied',{fill:C.accSoft,stroke:C.acc,cls:'mono',size:12});
  d.box(337,62,286,92,'RMSNorm gains\n8,704 scalars\nno decay',{fill:C.card,cls:'mono',size:12});
  d.brace(17,623,180,{label:'one group per unique parameter object',color:C.acc});
  d.text(320,225,'the tied embedding/head has one policy, not two',{cls:'sm'});return d.svg();
}
