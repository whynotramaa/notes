import { D, C } from '../lib/draw.js';
import N from '../data/training-numbers.json' with { type: 'json' };

export function train_final_norm() {
  const d = new D(640, 280, 'train_final_norm');
  d.text(10,16,'THE FINAL RESIDUAL ADDITION BYPASSES THE BRANCH NORM',{cls:'cap',a:'start'});
  d.box(20,100,115,40,'residual x',{fill:C.card});
  d.box(180,45,120,40,'branch norm',{fill:C.card});
  d.box(345,45,120,40,'branch update',{fill:C.card});
  d.circle(520,120,30,{fill:C.card});d.text(520,120,'+',{size:19});
  d.arrow(137,120,503,120,{stroke:C.ink2});d.arrow(120,97,180,66,{stroke:C.ink2});
  d.arrow(302,65,341,65,{stroke:C.ink2});d.carrow([[466,65],[520,65],[520,103]],{stroke:C.ink2});
  d.box(405,180,220,39,'final RMSNorm → LM head',{fill:C.accSoft,stroke:C.acc,size:12});
  d.arrow(520,138,520,177,{stroke:C.acc});
  d.mono(235,191,'[3,4] / 3.535534',{size:12});d.mono(235,219,'[0.848528, 1.131371]',{size:11});
  d.hand(320,260,'normalize the stream that actually reaches the head',{size:18});
  return d.svg();
}
export function train_head() {
  const d = new D(640,270,'train_head');
  d.text(10,16,'EACH VOCABULARY ROW SCORES THE SAME HIDDEN VECTOR',{cls:'cap',a:'start'});
  d.box(20,109,110,44,'h = [1,2]',{cls:'mono',fill:C.card,size:11});
  ['A: [2,0]','B: [1,0]','C: [0,0]'].forEach((s,i)=>{
    const y=55+i*62;
    d.box(210,y,120,34,s,{cls:'mono',fill:C.card,size:11});
    d.arrow(132,131,206,y+17,{stroke:C.line});
    d.arrow(332,y+17,385,y+17,{stroke:C.ink2});
    d.mono(407,y+17,String(N.head.z[i]),{color:C.acc,size:15});
    d.arrow(431,y+17,489,y+17,{stroke:C.acc});
    d.mono(550,y+17,N.head.prob[i].toFixed(6),{size:12});
  });
  d.text(269,36,'vocabulary rows',{cls:'ttl'});d.text(407,36,'logits',{cls:'ttl'});d.text(550,36,'softmax',{cls:'ttl'});
  d.hand(320,244,'scores first; a distribution after normalization',{size:19});return d.svg();
}
export function train_tying() {
  const d=new D(640,300,'train_tying');
  d.text(10,16,'TWO USES, ONE PARAMETER OBJECT',{cls:'cap',a:'start'});
  d.box(206,58,228,65,'E: (32000, 512)\n16,384,000 parameters',{cls:'mono',fill:C.accSoft,stroke:C.acc,size:12});
  d.box(25,187,240,46,'input lookup E[ids]',{cls:'mono',fill:C.card,size:12});
  d.box(375,187,240,46,'output scores h Eᵀ',{cls:'mono',fill:C.card,size:12});
  d.arrow(260,126,145,183,{stroke:C.ink2});d.arrow(380,126,495,183,{stroke:C.ink2});
  d.carrow([[145,236],[145,265],[320,265],[320,127]],{stroke:C.acc});
  d.carrow([[495,236],[495,265],[340,265],[340,127]],{stroke:C.acc});
  d.text(320,287,'backward adds both paths to E.grad',{cls:'mono',size:11,color:C.acc});return d.svg();
}
export function train_forward() {
  const d=new D(640,380,'train_forward');
  d.text(10,16,'THE VOCABULARY AXIS APPEARS ONLY AT THE HEAD',{cls:'cap',a:'start'});
  const rows=[['token IDs','(2, 8)'],['embedding rows','(2, 8, 512)'],['8 decoder blocks','(2, 8, 512)'],['final RMSNorm','(2, 8, 512)'],['tied vocabulary head','(2, 8, 32000)']];
  rows.forEach(([lab,sh],i)=>{
    const y=45+i*63;
    d.box(47,y,280,38,lab,{fill:i===4?C.accSoft:C.card,stroke:i===4?C.acc:C.ink2,size:13});
    d.mono(365,y+19,sh,{a:'start',color:i===4?C.acc:C.ink,size:13});
    if(i<4)d.arrow(187,y+41,187,y+60,{stroke:C.ink2});
  });
  d.hand(320,361,'token positions stay; the last dimension changes',{size:19});return d.svg();
}

export function train_norm_geometry() {
  const d=new D(640,345,'train_norm_geometry');
  d.text(10,16,'RMS NORMALIZATION CHANGES RADIUS BEFORE THE LEARNED GAIN',{cls:'cap',a:'start'});
  const M=d.axes(76,67,300,222,{xmin:0,xmax:4,ymin:0,ymax:5,xl:'feature 1',yl:'feature 2'});
  d.arrow(M.X(0),M.Y(0),M.X(3),M.Y(4),{stroke:C.ink2,sw:1.8});
  const [a,b]=N.norm.normalized;d.arrow(M.X(0),M.Y(0),M.X(a),M.Y(b),{stroke:C.acc,sw:2.7});
  d.dot(M.X(3),M.Y(4),4,C.ink2);d.mono(M.X(3)+14,M.Y(4)-12,'[3, 4]',{size:14,a:'start'});
  d.text(417,181,'same direction',{a:'start',size:16});d.text(417,217,'smaller radius',{a:'start',size:16,color:C.acc});
  d.mono(407,254,'[0.848528, 1.131371]',{a:'start',size:12,color:C.acc});
  d.hand(320,326,'unit gain; epsilon omitted for this calculation',{size:21});return d.svg();
}
export function train_logits_token_grid() {
  const d=new D(640,345,'train_logits_token_grid');
  d.text(10,16,'EVERY POSITION OWNS A VOCABULARY-SIZED SCORE ROW',{cls:'cap',a:'start'});
  d.text(91,69,'B = 2',{size:15});d.text(337,69,'T = 8',{size:15});
  for(let b=1;b>=0;b--){const x=140+b*30,y=103-b*24;d.grid(x,y,8,10,33,21,{cellFill:(r,c)=>r===6&&b===0?C.accSoft:C.card});}
  d.text(553,185,'one target',{size:14,color:C.acc});d.arrow(505,190,474,229,{stroke:C.acc});
  d.text(320,293,'V = 32,000 scores per row',{size:17});d.text(320,326,'drawn columns are symbolic; actual output shape is (2, 8, 32000)',{cls:'sm'});return d.svg();
}
