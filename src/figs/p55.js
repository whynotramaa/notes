import { D, C } from '../lib/draw.js';

export function experiment_control_ledger(){
  const d=new D(640,306,'experiment_control_ledger');
  d.text(10,16,'MAKE THE CHANGED FACTOR VISIBLE IN THE RUN LEDGER',{cls:'cap',a:'start'});
  [['field','baseline','variant'],['dataset','same split','same split'],['token budget','4,096,000','4,096,000'],['seed labels','A, B, C, D, E','A, B, C, D, E'],['attention','full','local + full']].forEach((row,r)=>{
    const y=58+r*44;
    row.forEach((s,c)=>d.text([20,310,517][c],y,s,{cls:r?'mono':'ttl',a:c?'middle':'start',size:11,color:r===4&&c===2?C.acc:C.ink}));
    d.line(19,y+20,620,y+20,{stroke:C.line,single:true});
  });return d.svg();
}

export function paired_seed_losses(){
  const d=new D(640,340,'paired_seed_losses');
  d.text(10,16,'SHOW EVERY PAIRED RUN, NOT JUST THE BEST ONE',{cls:'cap',a:'start'});
  const b=[2.10,2.14,2.08,2.12,2.16],v=[2.09,2.11,2.07,2.10,2.13],Y=x=>260-(x-2.06)/.11*190;
  [2.06,2.08,2.10,2.12,2.14,2.16].forEach(val=>{d.mono(20,Y(val),val.toFixed(2),{a:'start',size:10});d.line(75,Y(val),617,Y(val),{stroke:C.line,single:true,sw:.5});});
  b.forEach((val,i)=>{
    const x=116+i*104;d.line(x-13,Y(val),x+13,Y(v[i]),{stroke:C.line});
    d.circle(x-13,Y(val),10,{fill:C.slate,stroke:C.slate});d.circle(x+13,Y(v[i]),10,{fill:C.acc,stroke:C.acc});
    d.mono(x,283,'ABCDE'[i],{size:12});
  });
  d.text(211,316,'slate: baseline',{cls:'sm',color:C.slate});d.text(434,316,'orange: variant',{cls:'sm',color:C.acc});return d.svg();
}

export function training_budget_visibility(){
  const d=new D(640,320,'training_budget_visibility');
  d.text(10,16,'A SHORT RUN OBSERVES ONLY PART OF THE LEARNING CURVE',{cls:'cap',a:'start'});
  d.fillRect(86,57,126,194,C.accSoft,.6);
  d.arrow(86,251,597,251,{stroke:C.ink2});d.arrow(86,251,86,49,{stroke:C.ink2});
  d.curve([[92,68],[150,132],[230,173],[350,201],[560,211]],{stroke:C.slate,sw:2});
  d.curve([[92,93],[150,145],[230,168],[350,198],[560,229]],{stroke:C.acc,sw:2});
  d.text(155,40,'early budget',{cls:'sm'});d.text(390,273,'training exposure',{cls:'mono',size:11});
  d.text(34,155,'held-out\nloss',{cls:'sm',vc:true,size:10});
  d.hand(320,304,'schematic curves; no measured values',{size:20});return d.svg();
}

export function architecture_tradeoff_scatter(){
  const d=new D(640,330,'architecture_tradeoff_scatter');
  d.text(10,16,'QUALITY AND TIME NEED THEIR OWN AXES',{cls:'cap',a:'start'});
  const X=t=>90+(t-5)/8*488,Y=l=>245-(l-2.09)/.1*185;
  d.arrow(90,246,603,246,{stroke:C.ink2});d.arrow(90,246,90,48,{stroke:C.ink2});
  [6,8,10,12].forEach(t=>d.mono(X(t),268,String(t),{size:10}));
  [2.10,2.12,2.16,2.18].forEach(l=>d.mono(19,Y(l),l.toFixed(2),{a:'start',size:10}));
  [['baseline',10,2.12],['A',12,2.10],['B',8,2.12],['C',6,2.18]].forEach(([s,t,l],i)=>{
    d.circle(X(t),Y(l),11,{fill:i?C.acc:C.slate,stroke:i?C.acc:C.slate});
    d.text(X(t)+13,Y(l)-14,s,{cls:'mono',a:'start',size:11,color:i?C.acc:C.slate});
  });
  d.text(335,301,'decode time per token (ms), lower is faster',{cls:'mono',size:10.5});
  d.text(101,42,'loss, lower is better',{cls:'sm',a:'start',size:10});return d.svg();
}

export function paired_difference_interval(){
  const d=new D(640,250,'paired_difference_interval');
  d.text(10,16,'FIVE PAIRED DIFFERENCES, THEIR MEAN, AND A 95% STUDENT-T INTERVAL',{cls:'cap',a:'start'});
  const X=v=>80+(v+0.01)/0.05*480;
  d.arrow(60,150,580,150,{stroke:C.ink2,sw:.9,hl:6});
  [-0.01,0,0.01,0.02,0.03,0.04].forEach(v=>{d.line(X(v),146,X(v),154,{stroke:C.ink2,single:true});d.text(X(v),170,v.toFixed(2),{cls:'xs'});});
  d.line(X(0),60,X(0),146,{stroke:C.red,dash:[4,4],single:true});
  d.text(X(0)-6,68,'no effect',{cls:'xs',a:'end',color:C.red});
  const pts=[['A',.01,0],['C',.01,1],['D',.02,0],['B',.03,0],['E',.03,1]];
  pts.forEach(([l,v,k])=>{d.dot(X(v),128-k*16,4,C.slate);d.text(X(v)+9,128-k*16,l,{cls:'xs',a:'start'});});
  d.hl(X(0.007583),100,X(0.032417),100,{th:10,op:.35});
  d.line(X(0.007583),92,X(0.007583),108,{stroke:C.acc,single:true});d.line(X(0.032417),92,X(0.032417),108,{stroke:C.acc,single:true});
  d.dot(X(0.02),100,5,C.acc);
  d.mono(X(0.02),80,'mean 0.02',{size:10.5,color:C.acc});
  d.mono(X(0.007583),196,'0.007583',{size:10});d.mono(X(0.032417),196,'0.032417',{size:10});
  d.text(320,224,'baseline minus variant loss; illustrative values, SE = 0.01 / √5 = 0.004472',{cls:'sm'});
  return d.svg();
}
