import { D, C } from '../lib/draw.js';
import N from '../data/training-numbers.json' with { type: 'json' };
export function train_seed_spread() {
  const d=new D(640,305,'train_seed_spread');
  d.text(10,16,'ONE RECIPE, FIVE ILLUSTRATIVE OUTCOMES',{cls:'cap',a:'start'});
  const X=v=>55+(v-2.06)/.12*530;
  d.arrow(42,161,601,161,{stroke:C.ink2});
  [2.08,2.10,2.12,2.14,2.16].forEach(v=>{d.line(X(v),154,X(v),168,{stroke:C.ink2});d.mono(X(v),199,v.toFixed(2),{size:13});});
  N.seeds.baseline.forEach((v,i)=>{d.circle(X(v),99,18,{fill:C.accSoft,stroke:C.acc});d.text(X(v),65,`run ${i+1}`,{size:12});});
  d.line(X(2.12),121,X(2.12),153,{stroke:C.acc,sw:2});
  d.hand(320,253,'mean 2.12; sample spread 0.031623',{size:22});return d.svg();
}
export function train_paired_seeds() {
  const d=new D(640,350,'train_paired_seeds');
  d.text(10,16,'COMPARE THE DIFFERENCE WITHIN EACH VALID MATCHED PAIR',{cls:'cap',a:'start'});
  const X=v=>145+(v-2.06)/.11*422;
  d.text(93,57,'pair',{size:13});d.text(353,57,'validation NLL',{size:13});
  N.seeds.baseline.forEach((v,i)=>{const y=99+i*43;d.mono(93,y,i+1,{size:14});d.line(X(v),y,X(N.seeds.variant[i]),y,{stroke:C.line});d.circle(X(v),y,13,{fill:C.card,stroke:C.ink2});d.dot(X(N.seeds.variant[i]),y,6,C.acc);d.mono(604,y,N.seeds.diffs[i].toFixed(2),{size:12,color:C.acc});});
  [2.08,2.12,2.16].forEach(v=>d.mono(X(v),323,v.toFixed(2),{size:12}));return d.svg();
}
export function train_training_budget() {
  const d=new D(640,335,'train_training_budget');
  d.text(10,16,'COUNT SUPERVISED TARGET PRESENTATIONS, NOT JUST ITERATIONS',{cls:'cap',a:'start'});
  for(let k=3;k>=0;k--){const x=37+k*30,y=90-k*15;d.grid(x,y,2,8,35,48,{cellFill:()=>k===0?C.accSoft:C.card,lineColor:k===0?C.acc:C.line});}
  d.text(434,100,'4 microbatches',{size:16,a:'start'});d.text(434,144,'2 sequences each',{size:16,a:'start'});d.text(434,188,'8 targets each',{size:16,a:'start'});
  d.brace(37,317,211,{label:'64 labels / update',cls:'mono',color:C.acc});
  d.text(320,284,'1,000,000 / 64 = 15,625 updates',{cls:'mono',size:17});return d.svg();
}
export function train_undertraining_curves() {
  const d=new D(640,350,'train_undertraining_curves');
  d.text(10,16,'AN EARLY RANKING NEED NOT BE THE LATER RANKING',{cls:'cap',a:'start'});
  const M=d.axes(69,70,482,211,{xmin:0,xmax:5,ymin:1.5,ymax:5.2,yl:'held-out NLL'}),n=N.budget_curves;
  d.lines(n.budgets.map((v,i)=>[M.X(v),M.Y(n.small[i])]),{stroke:C.ink2,rough:.3,single:true,sw:1.8});
  d.lines(n.budgets.map((v,i)=>[M.X(v),M.Y(n.large[i])]),{stroke:C.acc,rough:.3,single:true,sw:2});
  [1,4].forEach((v,i)=>{d.line(M.X(v),70,M.X(v),282,{stroke:C.line,dash:[3,5]});d.text(M.X(v),309,i?'later budget':'early budget',{size:13});});
  d.text(439,105,'larger model',{size:14,color:C.acc});d.text(437,137,'smaller model',{size:14});
  d.text(320,337,'illustrative coordinates; no measured training claims',{cls:'sm'});return d.svg();
}
