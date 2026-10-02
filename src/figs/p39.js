import { D, C } from '../lib/draw.js';
import N from '../data/training-numbers.json' with { type: 'json' };
export function train_complete_pipeline() {
  const d=new D(640,460,'train_complete_pipeline');
  d.text(10,16,'ONE LEARNED PREDICTOR, TWO DIFFERENT PROCEDURES',{cls:'cap',a:'start'});
  d.text(24,69,'training examples',{a:'start',size:15});d.grid(31,104,2,8,13,23,{cellFill:()=>C.card});
  for(let i=2;i>=0;i--)d.box(223+i*8,99-i*10,168,63,i===0?'Finch-24':null,{fill:C.accSoft,stroke:C.acc,size:20});
  d.arrow(152,130,216,130,{stroke:C.ink2});d.arrow(412,130,463,130,{stroke:C.ink2});
  [46,27,12].forEach((h,i)=>d.rect(475+i*34,153-h,24,h,{fill:C.card,r:1}));d.text(523,178,'logits',{size:14});
  d.arrow(523,190,523,231,{stroke:C.ink2});d.text(523,253,'loss + backward',{size:14});
  d.carrow([[463,254],[310,272],[182,236],[207,162]],{stroke:C.acc,sw:1.8});d.text(306,249,'AdamW updates',{size:14,color:C.acc});
  d.line(26,302,612,302,{stroke:C.faint});
  d.chips(26,355,['prompt'],{width:97,h:38,size:15});
  d.box(207,345,197,61,'fixed checkpoint',{fill:C.accSoft,stroke:C.acc,size:17});
  d.arrow(131,374,198,374,{stroke:C.ink2});d.arrow(413,374,455,374,{stroke:C.ink2});
  d.text(538,355,'sample + stop',{size:15});d.text(538,389,'decoded text',{size:15});
  d.hand(320,437,'learn the weights, then use them',{size:22});return d.svg();
}
export function train_parameter_budget() {
  const d=new D(640,340,'train_parameter_budget');
  d.text(10,16,'FINCH-24: EVERY UNIQUE LEARNED SCALAR COUNTED ONCE',{cls:'cap',a:'start'});
  const values=[N.finch.embedding,8*N.finch.attention,8*N.finch.mlp,17*512],names=['embedding','attention','FFNs','norm gains'];let x=27;
  values.forEach((v,i)=>{const w=584*v/N.finch.total;d.rect(x,70,w,58,{fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2,r:0});x+=w;});
  values.forEach((v,i)=>{const y=168+i*38;d.rect(30,y-8,13,16,{fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2,r:1});d.text(63,y,names[i],{a:'start',size:14});d.mono(599,y,v.toLocaleString('en-US'),{a:'end',size:15,color:i===2?C.acc:C.ink});});
  d.mono(320,326,'total 40,509,952',{size:17});return d.svg();
}
export function train_state_vs_weights() {
  const d=new D(640,325,'train_state_vs_weights');
  d.text(10,16,'TRAINING HISTORIES MULTIPLY STORAGE, NOT PARAMETER COUNT',{cls:'cap',a:'start'});
  const rows=[['BF16 weights',N.memory.bf16_weights],['FP32 weights',N.memory.fp32_weights],['FP32 Adam tensors',N.memory.fp32_adam]];
  rows.forEach(([s,v],i)=>{const y=71+i*70;d.text(23,y+18,s,{a:'start',size:13});d.rect(197,y,v/N.memory.fp32_adam*303,38,{fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2,r:2});d.mono(622,y+18,`${(v/2**20).toFixed(3)} MiB`,{a:'end',size:12});});
  d.hand(320,298,'gradients and moments are not extra learned weights',{size:21});return d.svg();
}
export function train_component_jobs() {
  const d=new D(640,460,'train_component_jobs');
  d.text(10,16,'SIX JOBS IN THE SYSTEM, SIX DIFFERENT OBJECTS',{cls:'cap',a:'start'});
  const titles=['data','predictor','learning','measurement','saved state','generation'],jobs=['define evidence','compute logits','update parameters','score held-out text','restore next action','choose + stop'];
  titles.forEach((s,i)=>{const x=21+(i%3)*210,y=55+Math.floor(i/3)*194;d.text(x+89,y+5,s,{size:18});
    if(i===0){for(let j=2;j>=0;j--){d.rect(x+51+j*8,y+39-j*7,69,65,{fill:C.card,r:2});for(let r=0;r<3;r++)d.line(x+64+j*8,y+54+r*14-j*7,x+105+j*8,y+54+r*14-j*7,{stroke:C.line});}}
    if(i===1){d.grid(x+38,y+36,4,6,17,17,{cellFill:(r,c)=>r===c?C.accSoft:C.card});}
    if(i===2){const M=d.axes(x+29,y+33,120,80,{xmin:-1,xmax:1,ymin:0,ymax:1.2});d.fn(v=>v*v,-1,1,M,{stroke:C.ink2});d.arrow(M.X(-.8),M.Y(.64),M.X(-.25),M.Y(.0625),{stroke:C.acc});}
    if(i===3){const M=d.axes(x+29,y+33,120,80,{xmin:0,xmax:1,ymin:0,ymax:1});d.fn(v=>.8*Math.exp(-3*v)+.1,0,1,M,{stroke:C.acc});}
    if(i===4){d.path(`M${x+43} ${y+43} L${x+73} ${y+43} L${x+83} ${y+53} L${x+144} ${y+53} L${x+144} ${y+112} L${x+43} ${y+112} Z`,{fill:C.accSoft,stroke:C.acc});}
    if(i===5){d.chips(x+18,y+50,['A','B','EOS'],{width:45,h:36,gap:6,size:14,fill:j=>j===2?C.accSoft:C.card});}
    d.text(x+89,y+145,jobs[i],{size:13});
  });return d.svg();
}
export function train_failure_paths() {
  const d=new D(640,345,'train_failure_paths');
  d.text(10,16,'START WITH A SYMPTOM, THEN INSPECT ITS CONTRACT',{cls:'cap',a:'start'});
  const rows=[['too-good loss','label visibility + split integrity'],['nonfinite updates','logits + gradients + dtype'],['resume mismatch','next batch + rate + moments'],['bad generated text','tokenizer + positions + decoder']];
  rows.forEach(([symptom,check],i)=>{const y=66+i*69;d.text(28,y,symptom,{a:'start',size:14});d.arrow(232,y,284,y,{stroke:C.acc});d.text(312,y,check,{a:'start',size:13});});
  d.hand(320,324,'a starting point for diagnosis, not a one-cause rule',{size:21});return d.svg();
}
