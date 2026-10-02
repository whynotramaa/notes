import { D, C } from '../lib/draw.js';

export function train_checkpoint_state() {
  // A physical snapshot folder collects tensor stacks and procedural state.
  const d=new D(640,360,'train_checkpoint_state');
  d.text(10,16,'SAVE THE NEXT ACTION, NOT JUST THE CURRENT PREDICTOR',{cls:'cap',a:'start'});
  [['weights',35,75],['Adam m + v',35,203],['RNG + sampler',435,75],['update + schedule',435,203]].forEach(([s,x,y],i)=>{
    for(let j=2;j>=0;j--)d.rect(x+j*6,y-j*6,157,61,{fill:i?C.accFaint:C.card,stroke:i?C.acc:C.ink2,r:3});
    d.text(x+78,y+30,s,{size:14});
    d.arrow(i<2?x+175:x-10,y+29,i<2?244:395,168,{stroke:i?C.acc:C.line});
  });
  d.path('M250 130 L290 130 L300 141 L390 141 L390 222 L250 222 Z',{fill:C.accSoft,stroke:C.acc});
  d.text(320,173,'checkpoint',{size:16});d.mono(320,200,'update 550',{size:12});
  d.hand(320,321,'the board position and the deck order',{size:21});return d.svg();
}
export function train_resume_boundary() {
  const d=new D(640,320,'train_resume_boundary');
  d.text(10,16,'AN UPDATE BOUNDARY IS A CLEAN PLACE TO TAKE A SNAPSHOT',{cls:'cap',a:'start'});
  d.arrow(35,101,608,101,{stroke:C.ink2});
  [549,550,551].forEach((v,i)=>{const x=110+i*207;d.circle(x,101,39,{fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});d.mono(x,101,v,{size:12});});
  d.text(110,63,'completed',{size:12});d.text(317,63,'save here',{size:12,color:C.acc});d.text(524,63,'next update',{size:12});
  d.arrow(317,123,317,170,{stroke:C.acc});
  d.box(205,177,224,49,'weights + moments + RNG',{fill:C.accSoft,stroke:C.acc,size:13});
  d.carrow([[431,201],[522,195],[524,128]],{stroke:C.acc});
  d.text(477,257,'same next batch',{size:13});d.text(477,281,'same next rate',{size:13});
  d.text(139,270,'mid-update needs\npartial gradients too',{size:13,vc:true});return d.svg();
}
export function train_accumulation() {
  const d=new D(640,360,'train_accumulation');
  d.text(10,16,'FOUR MICROBATCHEs, ONE TOKEN-WEIGHTED GRADIENT'.toUpperCase(),{cls:'cap',a:'start'});
  for(let i=0;i<4;i++){
    const x=25+i*157;
    d.grid(x,62,2,8,15,17,{cellFill:()=>C.accSoft});
    d.mono(x+60,112,'16 labels',{size:12});d.text(x+60,141,'summed NLL / 64',{size:12});
    d.arrow(x+60,160,320,224,{stroke:C.line});
  }
  d.circle(320,245,46,{fill:C.accSoft,stroke:C.acc});d.text(320,245,'Σ',{size:23});
  d.arrow(347,245,397,245,{stroke:C.acc});d.box(403,223,205,44,'clip once → step once',{fill:C.accSoft,stroke:C.acc,size:13});
  d.text(112,245,'64 labels in total',{size:14});d.hand(320,322,'no optimizer update between these backward calls',{size:21});return d.svg();
}
export function train_loop_order() {
  const d=new D(640,390,'train_loop_order');
  d.text(10,16,'ONE COMPLETED UPDATE, THEN LOG OR SNAPSHOT',{cls:'cap',a:'start'});
  const stations=[['zero\ngradients',40,62],['forward\n+ NLL',241,62],['backward\n× 4',442,62],['clip\ncombined',442,207],['set rate\n+ step',241,207],['advance\ncounter',40,207]];
  stations.forEach(([s,x,y],i)=>{d.circle(x+79,y+40,78,{fill:i===4?C.accSoft:C.card,stroke:i===4?C.acc:C.ink2});d.text(x+79,y+40,s,{size:12,vc:true});});
  d.arrow(162,102,276,102,{stroke:C.ink2});d.arrow(363,102,476,102,{stroke:C.ink2});
  d.arrow(521,144,521,204,{stroke:C.ink2});d.arrow(477,247,363,247,{stroke:C.ink2});d.arrow(277,247,163,247,{stroke:C.acc});
  d.carrow([[79,213],[20,178],[55,129]],{stroke:C.line});
  d.arrow(119,290,119,328,{stroke:C.acc});d.text(143,344,'logging · validation · checkpoint',{a:'start',size:14,color:C.acc});
  d.hand(321,170,'the same weights during accumulation',{size:20});return d.svg();
}
export function train_validation_modes() {
  const d=new D(640,290,'train_validation_modes');
  d.text(10,16,'TWO CONTROLS WITH TWO DIFFERENT JOBS',{cls:'cap',a:'start'});
  [['model.eval()','training-only behavior','off'],['inference_mode()','gradient recording','off']].forEach(([title,job,state],i)=>{
    const x=25+i*319;d.mono(x+135,65,title,{size:15});
    d.rect(x+65,106,140,63,{fill:C.card,r:31});d.circle(x+97,137,49,{fill:C.accSoft,stroke:C.acc});
    d.text(x+157,137,state,{size:16});d.text(x+135,201,job,{size:14});
  });d.hand(320,258,'restore the previous module mode when validation ends',{size:21});return d.svg();
}
