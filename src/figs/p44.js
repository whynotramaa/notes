import { D, C } from '../lib/draw.js';

export function trace_integrity_checks() {
  const d=new D(640,310,'trace_integrity_checks');
  d.text(10,16,'CHECK THE TRANSITIONS BEFORE TEACHING THE TRACE',{cls:'cap',a:'start'});
  d.mono(25,61,'user: reserve 3 bolts',{a:'start',size:12});
  d.mono(25,103,'tool: available = 12',{a:'start',size:12});
  d.mono(25,145,'call: reserve(bolt, 3, r1)',{a:'start',size:12});
  d.mono(25,187,'tool: remaining = 9',{a:'start',size:12,color:C.acc});
  d.mono(25,229,'answer: 3 reserved; 9 remain',{a:'start',size:12});
  [[61,'intent preserved'],[103,'observation before action'],[145,'schema + authorization'],[187,'12 - 3 = 9'],[229,'answer matches receipt']].forEach(([y,s])=>{
    d.line(318,y,360,y,{stroke:C.line});d.text(379,y,s,{cls:'sm',a:'start',size:11});
  });
  d.hand(320,281,'a valid conversation format can still contain a false story',{size:18});
  return d.svg();
}

export function gradient_accumulation_sft() {
  const d=new D(640,285,'gradient_accumulation_sft');
  d.text(10,16,'FOUR MICROBATCHES FORM ONE OPTIMIZER UPDATE',{cls:'cap',a:'start'});
  for(let i=0;i<4;i++){
    const x=22+i*147;
    d.rect(x,67,118,49,{fill:C.card});
    d.text(x+59,92,'2 examples',{cls:'mono',size:11});
    d.arrow(x+59,121,320,178,{stroke:C.line});
  }
  d.box(200,187,240,40,'update on 8 examples',{fill:C.accSoft,stroke:C.acc,cls:'mono',size:12});
  d.mono(320,253,'96 examples / 8 = 12 updates per epoch',{size:11});
  return d.svg();
}

export function sft_overfit_curves() {
  const d=new D(640,300,'sft_overfit_curves');
  d.text(10,16,'THE TRAINING LOSS CAN FALL WHILE VALIDATION GETS WORSE',{cls:'cap',a:'start'});
  const m=d.axes(66,62,500,172,{xmin:0,xmax:4,ymin:0,ymax:2,xl:'checkpoint',yl:'masked loss'});
  const train=[1.8,1.4,1.,.7,.5],valid=[1.9,1.5,1.2,1.3,1.5];
  [train,valid].forEach((xs,k)=>d.lines(xs.map((v,i)=>[m.X(i),m.Y(v)]),{stroke:k?C.acc:C.ink2,rough:.3,single:true,sw:1.8}));
  d.text(m.X(4)-4,m.Y(.5)-13,'training',{cls:'sm',a:'end'});
  d.text(m.X(4)-4,m.Y(1.5)-14,'validation',{cls:'sm',a:'end',color:C.acc});
  d.line(m.X(2),58,m.X(2),238,{stroke:C.line,dash:[4,4],single:true});
  d.hand(320,279,'select with held-out behavior as well as loss',{size:19});
  return d.svg();
}

export function synthetic_cartesian_tasks() {
  const d=new D(640,335,'synthetic_cartesian_tasks');
  d.text(10,16,'VARY THE TASK VALUES, NOT ONLY THE WORDING',{cls:'cap',a:'start'});
  const factors=[['4 items',['bolt','nut','washer','screw']],['3 quantities',['1','3','5']],['5 phrasings',['check','reserve','if enough','please','for job']]];
  factors.forEach(([title,values],i)=>{
    const x=19+i*212;
    d.text(x+89,54,title,{cls:'ttl',size:14});
    values.forEach((s,j)=>d.box(x+15,78+j*34,151,26,s,{cls:'mono',size:10,fill:i===1?C.accFaint:C.card,stroke:i===1?C.acc:C.line}));
  });
  d.brace(19,620,274,{label:'4 x 3 x 5 = 60 parameterized requests',cls:'mono'});
  d.hand(320,315,'combinations provide coverage, not independent evidence',{size:18});
  return d.svg();
}

export function scripted_expert_branches() {
  const d=new D(640,331,'scripted_expert_branches');
  d.text(10,16,'THE EXPERT USES THE ENVIRONMENT TO CHOOSE A CORRECT PATH',{cls:'cap',a:'start'});
  d.box(205,49,228,43,'available >= requested?',{cls:'mono',fill:C.card,size:12});
  d.carrow([[282,98],[171,130],[171,163]],{stroke:C.acc});
  d.carrow([[357,98],[478,130],[478,163]],{stroke:C.gray});
  d.text(165,130,'yes',{cls:'sm',a:'end',color:C.acc});d.text(493,130,'no',{cls:'sm',a:'start'});
  d.box(37,177,263,44,'reserve using the task values',{fill:C.accSoft,stroke:C.acc,size:12});
  d.box(351,177,263,44,'report insufficient stock',{fill:C.card,size:12});
  d.mono(168,252,'12 >= 3; remaining = 9',{size:10.5,color:C.acc});
  d.mono(482,252,'12 < 13; no commit',{size:10.5});
  d.hand(320,302,'the teacher can be deterministic; the task need not be trivial',{size:18});
  return d.svg();
}

export function synthetic_validation_funnel() {
  const d=new D(640,313,'synthetic_validation_funnel');
  d.text(10,16,'CLEANING A CORPUS IS AN ACCOUNTING PROBLEM TOO',{cls:'cap',a:'start'});
  const rows=[['generated',60],['after 8 duplicates removed',52],['after 4 corrupt traces removed',48]];
  rows.forEach(([label,n],i)=>{
    const y=60+i*73,w=n/60*425;
    d.poly([[103+(425-w)/2,y],[103+(425+w)/2,y],[103+(425+w)/2,y+38],[103+(425-w)/2,y+38]],{fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2});
    d.mono(316,y+19,`${n} traces`,{size:13});
    d.text(316,y+55,label,{cls:'sm'});
  });
  d.text(316,296,'illustrative counts; retain reasons for every discarded trace',{cls:'sm'});
  return d.svg();
}

export function synthetic_family_split() {
  const d=new D(640,296,'synthetic_family_split');
  d.text(10,16,'SPLIT TASK FAMILIES BEFORE GENERATING PARAPHRASES',{cls:'cap',a:'start'});
  ['bolt','nut','washer','screw'].forEach((s,i)=>{
    const x=20+i*153,held=i===3;
    d.rect(x,74,134,123,{fill:held?C.accSoft:C.card,stroke:held?C.acc:C.ink2});
    d.text(x+67,100,s,{cls:'mono',size:12});
    for(let j=0;j<5;j++)d.line(x+15,127+j*12,x+117,127+j*12,{stroke:held?C.acc:C.line});
    d.text(x+67,221,held?'validation':'train',{cls:'ttl',size:12});
  });
  d.brace(20,460,255,{label:'3 families x 3 quantities x 5 phrasings = 45',cls:'mono',});
  d.mono(552,270,'1 x 3 x 5 = 15',{size:9.5,color:C.acc});
  return d.svg();
}

export function synthetic_real_vs_simulator() {
  const d=new D(640,283,'synthetic_real_vs_simulator');
  d.text(10,16,'EXECUTION PROVENANCE CHANGES WHAT A TRACE ESTABLISHES',{cls:'cap',a:'start'});
  [['real service','integration behavior','isolate writes'],['simulator','declared state transitions','validate against real cases']].forEach(([title,sub,cost],i)=>{
    const x=21+i*311;
    d.text(x+145,50,title,{cls:'ttl',size:16});
    d.rect(x+47,78,193,112,{fill:i?C.accFaint:C.card,stroke:i?C.acc:C.ink2});
    d.mono(x+143,103,'available = 12',{size:11});
    d.arrow(x+143,119,x+143,141,{stroke:i?C.acc:C.gray});
    d.mono(x+143,162,'remaining = 9',{size:11});
    d.text(x+145,214,sub,{cls:'sm'});d.text(x+145,242,cost,{cls:'sm',size:10.5});
  });
  return d.svg();
}

export function sft_update_schedule(){
  const d=new D(640,260,'sft_update_schedule');
  d.text(10,16,'96 EXAMPLES, EFFECTIVE BATCH 8: 12 UPDATES PER EPOCH, 36 IN THREE EPOCHS',{cls:'cap',a:'start'});
  const M=d.axes(70,50,520,130,{xmin:0,xmax:36,ymin:0,ymax:0.00024,xl:'optimizer update',yl:'learning rate'});
  const pts=[];
  for(let u=1;u<=36;u++){const lr=u<=4?0.0002*u/4:0.0002;pts.push([M.X(u),M.Y(lr)]);}
  d.lines(pts,{stroke:C.acc,sw:1.8,rough:.3,single:true});
  [1,2,3,4].forEach(u=>d.dot(M.X(u),M.Y(0.0002*u/4),3,C.acc));
  [12,24].forEach(u=>{d.line(M.X(u),M.Y(0.00024),M.X(u),M.Y(0),{stroke:C.line,dash:[4,4],single:true});});
  [0,12,24,36].forEach(u=>d.text(M.X(u),198,String(u),{cls:'xs'}));
  ['epoch 1','epoch 2','epoch 3'].forEach((s,i)=>d.text(M.X(6+12*i),M.Y(0.00024)+4,s,{cls:'sm'}));
  d.mono(M.X(1)+8,M.Y(0.00005)+2,'0.00005',{a:'start',size:10});
  d.mono(M.X(30),M.Y(0.0002)+13,'0.0002',{size:10});
  d.text(320,236,'4 linear warmup updates; the flat rate afterwards is illustrative, not a recommended schedule',{cls:'xs'});
  return d.svg();
}

export function quantity_boundary_cases(){
  const d=new D(640,250,'quantity_boundary_cases');
  d.text(10,16,'WITH 12 AVAILABLE, FOUR REQUESTED QUANTITIES TEACH FOUR DIFFERENT DECISIONS',{cls:'cap',a:'start'});
  const X=q=>60+q*36;
  d.fillRect(X(1),92,X(12)-X(1),16,C.accFaint,1);
  d.arrow(40,100,X(14)+14,100,{stroke:C.ink2,sw:.9,hl:6});
  for(let q=0;q<=14;q++){d.line(X(q),95,X(q),105,{stroke:C.ink2,single:true});d.text(X(q),118,String(q),{cls:'xs'});}
  d.text((X(1)+X(12))/2,84,'valid and available: 1 to 12',{cls:'sm',color:C.acc});
  const cases=[[0,'outside contract','not a reservation',C.red],[3,'commits','leaves 9',C.acc],[12,'commits','leaves 0',C.acc],[13,'refused','12 stays 12',C.red]];
  cases.forEach(([q,a,b,c],i)=>{
    d.dot(X(q),100,5,c);
    const y=152+(i%2)*44;
    d.line(X(q),106,X(q),y-10,{stroke:C.line,single:true});
    d.text(X(q),y,`${q}: ${a}`,{cls:'lbl',size:11});
    d.text(X(q),y+15,b,{cls:'xs'});
  });
  return d.svg();
}
