import { D, C } from '../lib/draw.js';
import N from '../data/training-numbers.json' with { type: 'json' };

export function where_training(stage = 99) {
  // Two rows trace the topic order; the final row returns to generation.
  const d = new D(640, 260, 'where_training');
  d.text(10, 16, 'THE TRAINING CHAPTER: TEN PARTS, ONE COMPLETE MODEL', { cls: 'cap', a: 'start' });
  const names = ['features', 'output', 'examples + loss', 'optimizer', 'precision', 'resume + loop', 'evaluation', 'experiments', 'decoding', 'whole pipeline'];
  names.forEach((name, i) => {
    const row = Math.floor(i / 5), col = row ? 4 - i % 5 : i % 5;
    const x = 12 + col * 125, y = 52 + row * 112, active = stage === 99 || stage === 10 || stage === i + 1;
    d.box(x, y, 114, 48, `${i + 1}. ${name}`, { fill: active ? C.accSoft : C.card, stroke: active ? C.acc : C.line, size: 10 });
    if (i < 4) d.arrow(x + 115, y + 24, x + 122, y + 24, { stroke: C.line, hl: 4 });
    if (i >= 5 && i < 9) d.arrow(x - 2, y + 24, x - 10, y + 24, { stroke: C.line, hl: 4 });
  });
  d.carrow([[569, 103], [610, 126], [569, 161]], { stroke: C.line });
  d.text(320, 237, 'forward computation → learn parameters → measure results → generate', { cls: 'sm' });
  return d.svg();
}

export function cover_training() {
  const d = new D(640, 820, 'cover_training');
  for (let x = 20; x < 640; x += 24) for (let y = 30; y < 820; y += 24) d.dot(x, y, .8, C.faint);
  d.text(10, 16, 'INSIDE THE DECODER · UNIT III', { cls: 'cap', a: 'start' });
  d.text(45, 106, 'Training', { cls: 'ttl', size: 67, a: 'start' });
  d.text(45, 177, 'the Model', { cls: 'ttl', size: 67, a: 'start' });
  d.hl(47, 205, 423, 205, { th: 15 });
  d.text(47, 254, 'How text becomes a loss, an update,', { size: 20, a: 'start' });
  d.text(47, 283, 'and a useful next-token prediction.', { size: 20, a: 'start' });
  const rows = [['corpus + tokenizer', 'input / target'], ['Finch-24 decoder', 'logits'], ['cross-entropy', 'loss'], ['backward + AdamW', 'updated weights']];
  rows.forEach(([name, tag], i) => {
    const y = 350 + i * 76;
    d.box(170, y, 270, 49, name, { fill: i === 3 ? C.accSoft : C.card, stroke: i === 3 ? C.acc : C.ink2, size: 17 });
    d.mono(454, y + 25, tag, { a: 'start', size: 11 });
    if (i < 3) d.arrow(305, y + 51, 305, y + 72, { stroke: C.ink2 });
  });
  d.carrow([[168, 600], [90, 580], [89, 445], [168, 452]], { stroke: C.acc });
  d.hand(92, 655, 'the next batch\nuses new weights', { size: 22, vc: true });
  d.box(260, 691, 330, 47, 'checkpoint → prompt → generated text', { fill: C.accFaint, stroke: C.acc, size: 15 });
  d.text(45, 782, 'A HAND-DRAWN FIELD GUIDE · CHAPTER 3', { cls: 'cap', a: 'start', size: 11 });
  return d.svg();
}

export function train_activation_backward() {
  // The neutral SiLU curve is repeated; orange tangents expose local derivatives.
  const d=new D(640,325,'train_activation_backward');
  d.text(10,16,'A LOCAL SLOPE IS THE MULTIPLIER USED BY BACKWARD',{cls:'cap',a:'start'});
  const silu=x=>x/(1+Math.exp(-x));
  N.activation_backward.inputs.forEach((u,i)=>{
    const x=20+i*212, slope=N.activation_backward.derivatives[i];
    const M=d.axes(x+29,80,143,153,{xmin:-3,xmax:3,ymin:-.5,ymax:3,yl:'SiLU'});
    d.fn(silu,-3,3,M,{stroke:C.ink2,n:80});
    d.fn(v=>silu(u)+slope*(v-u),u-.75,u+.75,M,{stroke:C.acc,sw:2.6});d.dot(M.X(u),M.Y(silu(u)),4,C.acc);
    d.mono(x+99,59,`u = ${u}`,{size:14});d.mono(x+99,269,`slope ${slope.toFixed(6)}`,{size:12,color:C.acc});
  });
  d.hand(320,308,'nearly closed does not mean unable to learn',{size:21});return d.svg();
}
export function train_ffn_shared_gradient() {
  const d=new D(640,275,'train_ffn_shared_gradient');
  d.text(10,16,'ALL POSITIONS CONTRIBUTE TO THE SAME WEIGHT GRADIENT',{cls:'cap',a:'start'});
  [['x₁ = [1,2]','r₁ = 0.5','[0.5, 1]'],['x₂ = [3,4]','r₂ = -0.25','[-0.75, -1]']].forEach(([x,r,g],i)=>{
    const y=57+i*80;
    d.box(18,y,147,35,x,{fill:C.card,cls:'mono',size:11});d.mono(237,y+17,r,{size:11});
    d.arrow(290,y+17,330,y+17,{stroke:C.ink2});d.box(335,y,153,35,g,{fill:C.card,cls:'mono',size:11});
  });
  d.carrow([[490,74],[545,93],[545,191]],{stroke:C.acc});d.carrow([[490,154],[520,173],[520,191]],{stroke:C.acc});
  d.box(372,199,238,39,'∇W column = [-0.25, 0]',{fill:C.accSoft,stroke:C.acc,cls:'mono',size:11});
  d.text(151,248,'one column, reused twice',{cls:'sm'});return d.svg();
}
export function train_gate_backward() {
  const d=new D(640,350,'train_gate_backward');
  d.text(10,16,'PRODUCT RULE: THE TWO BRANCHES RECEIVE DIFFERENT CORRECTIONS',{cls:'cap',a:'start'});
  d.box(235,44,170,37,'incoming r = 1',{fill:C.card,cls:'mono',size:12});
  d.box(220,113,200,40,'a = SiLU(g) × u',{fill:C.accSoft,stroke:C.acc,cls:'mono',size:12});
  d.arrow(320,83,320,110,{stroke:C.acc});
  d.box(22,221,270,48,'gate: r × u × SiLU′(g)\n-0.272353',{fill:C.accSoft,stroke:C.acc,cls:'mono',size:12});
  d.box(348,221,270,48,'content: r × SiLU(g)\n-0.238406',{fill:C.card,cls:'mono',size:12});
  d.arrow(280,155,157,216,{stroke:C.acc});d.arrow(360,155,483,216,{stroke:C.ink2});
  d.mono(320,292,'g = -2, u = 3, a = -0.715218',{size:11});
  d.hand(320,329,'backward follows both learned branches',{size:19});return d.svg();
}
export function train_ffn_storage() {
  const d=new D(640,335,'train_ffn_storage');
  d.text(10,16,'TWO EXPANSION TENSORS, EACH WITH THE SAME TOKEN GRID',{cls:'cap',a:'start'});
  ['gate preactivation','up projection'].forEach((label,i)=>{
    const x=25+i*317;d.text(x+129,62,label,{size:16});
    for(let j=2;j>=0;j--)d.grid(x+24+j*17,107-j*12,2,8,27,37,{cellFill:()=>i?C.card:C.accSoft,lineColor:i?C.ink2:C.acc});
    d.mono(x+129,217,'(2, 8, 1536)',{size:14});d.mono(x+129,251,'49,152 BF16 bytes',{size:13});
  });d.hand(320,306,'drawn depth is symbolic; full width is 1,536 channels',{size:21});return d.svg();
}
