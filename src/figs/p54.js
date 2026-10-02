import { D, C } from '../lib/draw.js';

export function speculative_verification_ledger(){
  const d=new D(640,335,'speculative_verification_ledger');
  d.text(10,16,'VERIFY AN ORDERED PREFIX, THEN DISCARD THE REJECTED SUFFIX',{cls:'cap',a:'start'});
  [['draft',['bolt','is','red','today']],['target argmax',['bolt','is','blue','unused']],['emit',['bolt','is','blue','discard']]].forEach(([name,values],r)=>{
    const y=66+r*71;d.text(17,y+19,name,{cls:'mono',a:'start',size:10});
    values.forEach((v,i)=>d.box(159+i*116,y,102,38,v,{cls:'mono',size:11,fill:(i<2||r===2&&i===2)?C.accSoft:C.card,stroke:(i<2||r===2&&i===2)?C.acc:C.line}));
  });
  d.brace(159,377,284,{label:'verified prefix',color:C.acc});
  d.text(502,307,'restart after blue',{cls:'sm'});return d.svg();
}

export function speculative_probability_mass(){
  const d=new D(640,340,'speculative_probability_mass');
  d.text(10,16,'CORRECT THE REJECTED MASS TO RECOVER THE TARGET',{cls:'cap',a:'start'});
  [['draft q',.6,.4],['accepted',.3,.4],['replacement',0,.3],['final p',.3,.7]].forEach(([name,a,b],i)=>{
    const y=62+i*61;d.text(17,y+15,name,{cls:'mono',a:'start',size:11});
    if(a)d.rect(158,y,a*439,29,{fill:C.card,stroke:C.ink2,r:0});
    if(b)d.rect(158+a*439,y,b*439,29,{fill:C.accSoft,stroke:C.acc,r:0});
    d.mono(158,y+44,`A: ${a.toFixed(1)}   B: ${b.toFixed(1)}`,{a:'start',size:10});
  });
  d.hand(320,320,'accepted plus replacement: [0.3, 0.7]',{size:21});return d.svg();
}

export function speculation_speed_tradeoff(){
  const d=new D(640,320,'speculation_speed_tradeoff');
  d.text(10,16,'ACCEPTANCE MUST PAY FOR THE ROUND',{cls:'cap',a:'start'});
  const X=a=>90+a*484,Y=s=>251-s/3.2*176;
  d.arrow(89,251,596,251,{stroke:C.ink2});d.arrow(90,252,90,57,{stroke:C.ink2});
  d.line(90,Y(1),575,Y(1),{stroke:C.slate,dash:[5,4]});
  d.text(104,Y(1)-13,'ordinary decoding: 1x',{cls:'mono',a:'start',size:10,color:C.slate});
  d.lines(Array.from({length:21},(_,i)=>{const a=i/20;return [X(a),Y(10*Array.from({length:5},(_,k)=>a**k).reduce((x,y)=>x+y)/16)];}),{stroke:C.acc,sw:2});
  [[.2,.781],[.8,2.101]].forEach(([a,s])=>{d.dot(X(a),Y(s),4,C.acc);d.mono(X(a),Y(s)+(a<.5?19:-18),`${s}x`,{size:11,color:C.acc});});
  [0,.2,.4,.6,.8,1].forEach(a=>d.mono(X(a),270,a.toFixed(1),{size:10}));
  d.text(336,299,'conditional acceptance probability',{cls:'mono',size:11});return d.svg();
}
