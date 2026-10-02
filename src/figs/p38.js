import { D, C } from '../lib/draw.js';
import N from '../data/training-numbers.json' with { type: 'json' };

export function train_teacher_forcing() {
  const d=new D(640,375,'train_teacher_forcing');
  d.text(10,16,'THE SOURCE OF THE NEXT CONTEXT TOKEN CHANGES',{cls:'cap',a:'start'});
  d.text(20,65,'training: observed prefixes',{a:'start',size:15});
  const xs=d.chips(22,96,['17','23','5','81','9','44','2','7'],{width:69,h:36,gap:7,size:14});
  d.chips(22,168,['23','5','81','9','44','2','7','3'],{width:69,h:36,gap:7,size:14,fill:C.accSoft,stroke:C.acc});
  xs.forEach(([x])=>d.arrow(x,137,x,164,{stroke:C.line}));
  d.text(20,243,'generation: choose, then append',{a:'start',size:15});
  d.chips(22,275,['17','23','chosen ID'],{width:116,h:39,gap:11,size:14,fill:i=>i===2?C.accSoft:C.card,stroke:i=>i===2?C.acc:C.ink2});
  d.arrow(395,294,442,294,{stroke:C.acc});d.text(527,294,'next forward',{size:15});
  d.hand(320,347,'the generated prefix can depart from the observed one',{size:21});return d.svg();
}
export function train_decode_steps() {
  const d=new D(640,320,'train_decode_steps');
  d.text(10,16,'EACH CHOICE BECOMES INPUT TO THE NEXT PREDICTION',{cls:'cap',a:'start'});
  [['17','23'],['17','23','5'],['17','23','5','81']].forEach((tokens,i)=>{
    const y=64+i*76;d.text(18,y+18,`step ${i+1}`,{a:'start',size:13});
    d.chips(109,y,tokens,{width:65,h:35,gap:6,size:14,fill:j=>j===tokens.length-1&&i?C.accSoft:C.card});
    d.arrow(415,y+18,452,y+18,{stroke:C.ink2});d.mono(540,y+18,`logits (${tokens.length}, V)`,{size:12});
  });d.hand(320,298,'read the last row; append one token; repeat',{size:21});return d.svg();
}
export function train_greedy_tree() {
  const d=new D(640,370,'train_greedy_tree');
  d.text(10,16,'THE BEST LOCAL CHOICE NEED NOT GIVE THE BEST COMPLETE PATH',{cls:'cap',a:'start'});
  d.circle(320,73,41,{fill:C.card});d.text(320,73,'start',{size:11});
  d.arrow(302,94,150,163,{stroke:C.acc});d.arrow(338,94,490,163,{stroke:C.ink2});
  d.mono(181,103,'0.6',{size:14,color:C.acc});d.mono(463,103,'0.4',{size:14});
  [[150,'A',.5,.3],[490,'B',.99,.396]].forEach(([x,label,p,joint],i)=>{
    d.circle(x,187,49,{fill:i?C.card:C.accSoft,stroke:i?C.ink2:C.acc});d.text(x,187,label,{size:18});
    d.arrow(x,215,x,271,{stroke:i?C.ink2:C.acc});d.mono(x+31,244,String(p),{a:'start',size:14});
    d.circle(x,295,44,{fill:C.card});d.text(x,295,'next',{size:11});d.mono(x,345,`joint ${joint}`,{size:16,color:i?C.ink:C.acc});
  });d.hand(320,220,'greedy takes A',{size:22});return d.svg();
}
export function train_temperature_bars() {
  const d=new D(640,335,'train_temperature_bars');
  d.text(10,16,'TEMPERATURE CHANGES CONCENTRATION, NOT RANK',{cls:'cap',a:'start'});
  [.5,1,2].forEach((tau,i)=>{
    const x=23+i*212;d.text(x+89,62,`temperature ${tau}`,{size:15});
    N.sampling.temperatures[String(tau)].forEach((p,j)=>{
      const bx=x+j*59,y=255,h=p*165;d.rect(bx,y-h,43,h,{fill:j?C.card:C.accSoft,stroke:j?C.ink2:C.acc,r:2});d.mono(bx+21,y-h-17,p.toFixed(3),{size:12});d.mono(bx+21,278,`ID ${j}`,{size:12});
    });
  });d.hand(320,317,'same logits: [2, 1, 0]',{size:22});return d.svg();
}
export function train_topk_bars() {
  const d=new D(640,330,'train_topk_bars');
  d.text(10,16,'REMOVE THE TAIL, THEN REASSIGN THE RETAINED MASS',{cls:'cap',a:'start'});
  [N.head.prob,N.sampling.top2].forEach((ps,i)=>{
    const x=67+i*329;d.text(x+81,59,i?'after top-2':'before truncation',{size:15});
    ps.forEach((p,j)=>{const bx=x+j*70,h=p*180;d.rect(bx,250-h,47,Math.max(1,h),{fill:i&&p?C.accSoft:C.card,stroke:i&&p?C.acc:C.ink2,r:1});d.mono(bx+23,233-h,p.toFixed(3),{size:12});d.mono(bx+23,278,`ID ${j}`,{size:12});});
  });d.arrow(298,169,354,169,{stroke:C.acc});d.hand(320,313,'ID 2 has zero sampling probability',{size:21});return d.svg();
}
export function train_sampling_intervals() {
  const d=new D(640,330,'train_sampling_intervals');
  d.text(10,16,'A RANDOM DRAW PICKS AN INTERVAL, NOT THE TALLEST BAR',{cls:'cap',a:'start'});
  const x=31,w=577,y=109;let start=0;
  N.head.prob.forEach((p,i)=>{d.rect(x+start*w,y,p*w,65,{fill:i===0?C.accSoft:C.card,stroke:i===0?C.acc:C.ink2,r:0});d.mono(x+(start+p/2)*w,y+32,`ID ${i}`,{size:14});start+=p;});
  [0,...N.sampling.cdf].forEach(v=>d.mono(x+v*w,195,v.toFixed(3),{size:11}));
  N.sampling.uniform_draws.forEach((v,i)=>{const px=x+v*w;d.arrow(px,254,px,181,{stroke:C.acc});d.mono(px,282,`u=${v}`,{size:13,color:C.acc});});
  d.text(320,64,'cumulative probability from 0 to 1',{size:14});return d.svg();
}
export function train_stop_controls() {
  const d=new D(640,350,'train_stop_controls');
  d.text(10,16,'TERMINATION HAS A REASON THE CALLER CAN RECORD',{cls:'cap',a:'start'});
  [['EOS','17','23','EOS'],['token cap','17','23','5'],['stop pattern','17','END','REPLY']].forEach((tokens,i)=>{
    const y=67+i*90;d.text(20,y+21,tokens[0],{a:'start',size:14});
    d.chips(151,y,tokens.slice(1),{width:105,h:41,gap:9,size:14,fill:j=>j===2?C.accSoft:C.card,stroke:j=>j===2?C.acc:C.ink2});
    d.line(506,y-4,506,y+47,{stroke:C.acc,sw:2.5});d.text(535,y+21,'stop',{a:'start',size:15,color:C.acc});
  });return d.svg();
}
