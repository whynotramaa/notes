import { D, C } from '../lib/draw.js';
import N from '../data/training-numbers.json' with { type: 'json' };

export function train_init_variance() {
  // Three representative terms stand for a sum over all 512 input coordinates.
  const d=new D(640,260,'train_init_variance');
  d.text(10,16,'FAN-IN COUNTS HOW MANY RANDOM TERMS ARE ADDED',{cls:'cap',a:'start'});
  ['w₁x₁','w₂x₂','…','w₅₁₂x₅₁₂'].forEach((s,i)=>{
    const x=15+i*156;d.box(x,67,142,42,s,{fill:C.card,cls:'mono',size:13});
    d.arrow(x+71,113,320,158,{stroke:C.line});
  });
  d.box(115,161,410,42,'Var(y) = 512 × Var(w) × Var(x)',{fill:C.accSoft,stroke:C.acc,cls:'mono',size:12});
  d.text(320,239,'illustrative independent zero-mean terms',{cls:'sm'});return d.svg();
}
export function train_residual_init() {
  const d=new D(640,280,'train_residual_init');
  d.text(10,16,'RESIDUAL CONTRIBUTIONS ADD VARIANCE IN AN INDEPENDENCE MODEL',{cls:'cap',a:'start'});
  [['unscaled branches',17,1],['standard deviation × 0.25',2,.0625]].forEach(([title,total,v],i)=>{
    const y=68+i*112;
    d.text(20,y-23,title,{a:'start',cls:'ttl'});
    const unit=28;
    d.rect(20,y,unit,28,{fill:C.card,stroke:C.ink2,r:2});
    for(let j=0;j<16;j++)d.rect(52+j*unit*v,y,unit*v,28,{fill:i?C.accSoft:C.card,stroke:i?C.acc:C.line,r:0});
    d.mono(553,y+14,`Var = ${total}`,{a:'start',size:12,color:i?C.acc:C.ink});
    d.text(20,y+47,`start 1 + 16 contributions × ${v}`,{a:'start',cls:'mono',size:11});
  });return d.svg();
}
export function train_float_formats() {
  const d=new D(640,292,'train_float_formats');
  d.text(10,16,'SAME STORAGE SIZE CAN BUY DIFFERENT RANGE AND PRECISION',{cls:'cap',a:'start'});
  [['FP32',8,23],['FP16',5,10],['BF16',8,7]].forEach(([name,e,f],i)=>{
    const y=62+i*66,x=92,u=14;
    d.text(20,y+17,name,{a:'start',cls:'mono',size:12});
    d.box(x,y,u,34,'±',{fill:C.card,size:9});
    d.box(x+u,y,e*u,34,`${e} exponent`,{fill:C.accSoft,stroke:C.acc,size:10});
    d.box(x+(1+e)*u,y,f*u,34,`${f} fraction`,{fill:C.card,size:10});
    d.mono(567,y+17,`${1+e+f} bits`,{size:11});
  });
  d.text(320,267,'one sign bit; the hidden leading bit is not stored for normal values',{cls:'sm'});return d.svg();
}
export function train_master_values() {
  const d=new D(640,280,'train_master_values');
  d.text(10,16,'KEEP A SMALL UPDATE BEFORE ROUNDING THE COMPUTATION COPY',{cls:'cap',a:'start'});
  [['FP32 retained value','1 - 0.0001','0.9999'],['direct BF16 value','1 - 0.0001','rounds back to 1']].forEach(([title,operation,result],i)=>{
    const x=19+i*320;d.text(x+140,58,title,{cls:'ttl',size:12});
    d.box(x,93,280,36,operation,{fill:C.card,cls:'mono',size:12});
    d.arrow(x+140,132,x+140,169,{stroke:i?C.line:C.acc});
    d.box(x,172,280,46,result,{fill:i?C.card:C.accSoft,stroke:i?C.ink2:C.acc,cls:'mono',size:13});
  });d.hand(320,252,'the next update needs the retained value, not just its cast',{size:18});return d.svg();
}
export function train_loss_scaling() {
  const d=new D(640,285,'train_loss_scaling');
  d.text(10,16,'SCALE BEFORE BACKWARD, UNSCALE BEFORE CLIPPING',{cls:'cap',a:'start'});
  const steps=[['unscaled gradient','0.00000001'],['scale × 65,536','0.00065536'],['unscale ÷ 65,536','0.00000001']];
  steps.forEach(([label,value],i)=>{
    const x=16+i*211;d.text(x+91,57,label,{cls:'ttl',size:11});
    d.box(x,89,181,49,value,{fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2,cls:'mono',size:12});
    if(i<2)d.arrow(x+185,114,x+205,114,{stroke:C.ink2});
  });
  d.text(106,171,'too small for FP16',{cls:'sm'});d.text(318,171,'inside normal range',{cls:'sm',color:C.acc});
  d.text(530,171,'optimizer-sized gradient',{cls:'sm'});
  d.box(115,214,410,38,'finite check → clipping → optimizer step',{fill:C.accFaint,stroke:C.acc,size:12});return d.svg();
}
export function train_memory_ledger() {
  const d=new D(640,270,'train_memory_ledger');
  d.text(10,16,'FULL FP32 ADAMW: FOUR NAMED ARRAYS PER LEARNED SCALAR',{cls:'cap',a:'start'});
  ['parameters','gradients','moment m','moment v'].forEach((name,i)=>{
    const x=14+i*157;d.box(x,64,141,94,`${name}\n4 bytes / scalar\n154.533 MiB`,{fill:i>1?C.accSoft:C.card,stroke:i>1?C.acc:C.ink2,size:12});
  });
  d.brace(14,626,187,{label:'648,159,232 bytes = 618.133 MiB',cls:'mono',color:C.acc});
  d.text(320,243,'activations, cast copies, workspaces and allocator reserves are extra',{cls:'sm'});return d.svg();
}
export function train_memory_growth() {
  const d=new D(640,300,'train_memory_growth');
  d.text(10,16,'SEQUENCE LENGTH CHANGES ACTIVATION AND SCORE TENSORS DIFFERENTLY',{cls:'cap',a:'start'});
  const rows=[['residual: B × T × d',N.memory.residual_bf16,2*4096*512*2],['one FFN branch: B × T × f',N.memory.ffn_bf16,2*4096*1536*2],['scores: B × H × T²',N.memory.score_bf16,N.memory.full_score_bf16]];
  d.text(318,54,'T = 8',{cls:'ttl'});d.text(509,54,'T = 4096',{cls:'ttl'});
  rows.forEach(([name,a,b],i)=>{
    const y=93+i*64;d.text(17,y,name,{a:'start',cls:'mono',size:10});
    d.mono(318,y,`${(a/1024).toFixed(0)} KiB`,{size:12});
    d.box(427,y-19,175,38,`${(b/2**20).toFixed(0)} MiB`,{fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2,cls:'mono',size:12});
  });d.text(320,277,'B = 2, H = 8, BF16; these are single named tensors',{cls:'sm'});return d.svg();
}

export function train_precision_spacing() {
  const d=new D(640,335,'train_precision_spacing');
  d.text(10,16,'ZOOM IN ABOVE ONE: BF16 STEPS ARE WIDER THAN FP16 STEPS',{cls:'cap',a:'start'});
  [['FP16',2**-10],['BF16',2**-7]].forEach(([name,step],i)=>{
    const y=99+i*112;d.text(25,y,name,{size:16,a:'start'});d.arrow(135,y,598,y,{stroke:C.ink2});
    const count=Math.round((2**-7)/step);
    for(let j=0;j<=count;j++){const x=153+j/count*406;d.line(x,y-14,x,y+14,{stroke:C.acc,sw:1.6});}
    d.mono(153,y+35,'1',{size:13});d.mono(559,y+35,'1.0078125',{size:13});d.mono(351,y-38,`spacing ${step}`,{size:13,color:C.acc});
  });d.text(320,310,'same interval and scale; FP32 spacing is 2⁻²³ near one',{size:13});return d.svg();
}
export function train_activation_recompute() {
  const d=new D(640,350,'train_activation_recompute');
  d.text(10,16,'REMATERIALIZATION TRADES EXTRA FORWARD WORK FOR SAVED ACTIVATIONS',{cls:'cap',a:'start'});
  [['retain intermediates',76],['save boundary input',202]].forEach(([s,y],i)=>{
    d.text(22,y-29,s,{a:'start',size:15});
    for(let j=0;j<4;j++){const x=30+j*151;d.grid(x,y,3,4,17,15,{cellFill:()=>i&&j>0?C.paper:C.card,lineColor:i&&j>0?C.line:C.ink2});d.text(x+34,y+68,j?`stage ${j}`:'input',{size:13});if(j<3)d.arrow(x+78,y+22,x+136,y+22,{stroke:C.line});}
    if(i)d.carrow([[595,y+44],[556,y+85],[360,y+85],[282,y+47]],{stroke:C.acc});
  });d.hand(320,326,'recompute inside the region when backward needs it',{size:21});return d.svg();
}
