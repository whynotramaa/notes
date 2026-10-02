import { D, C, fmtN } from '../lib/draw.js';

export function lora_module_targets() {
  const d=new D(640,550,'lora_module_targets');
  d.text(10,16,'ALL SEVEN ADAPTED PROJECTIONS, WITH THEIR ACTUAL PATHS',{cls:'cap',a:'start'});
  d.text(320,46,'input: 512 features',{cls:'mono',size:12});
  [['Q','512 x 512',64],['K','128 x 512',260],['V','128 x 512',456]].forEach(([name,shape,x])=>{
    d.carrow([[320,59],[x+60,76],[x+60,89]],{stroke:C.gray});
    d.box(x,94,120,38,name,{fill:C.accSoft,stroke:C.acc,size:14});
    d.mono(x+60,151,shape,{size:10.5});
    d.arrow(x+60,165,x+60,190,{stroke:C.gray});
  });
  d.box(57,195,526,36,'Q compares K; weighted V returns head outputs',{fill:C.card,size:12});
  d.arrow(320,236,320,254,{stroke:C.gray});
  d.box(223,260,194,34,'O: 512 x 512',{cls:'mono',size:11,fill:C.accSoft,stroke:C.acc});
  d.carrow([[320,300],[168,319],[168,333]],{stroke:C.gray});
  d.carrow([[320,300],[471,319],[471,333]],{stroke:C.gray});
  d.box(65,338,206,34,'gate: 1536 x 512',{cls:'mono',size:11,fill:C.accSoft,stroke:C.acc});
  d.box(368,338,206,34,'up: 1536 x 512',{cls:'mono',size:11,fill:C.accSoft,stroke:C.acc});
  d.arrow(168,378,168,389,{stroke:C.gray});
  d.box(125,395,86,30,'SiLU',{fill:C.card,size:12});
  d.carrow([[216,410],[267,410],[299,443]],{stroke:C.gray});
  d.carrow([[471,378],[471,411],[341,443]],{stroke:C.gray});
  d.circle(320,451,34,{fill:C.card});d.text(320,451,'x',{cls:'mono',size:15});
  d.arrow(320,472,320,484,{stroke:C.gray});
  d.box(212,490,216,34,'down: 512 x 1536',{cls:'mono',size:11,fill:C.accSoft,stroke:C.acc});
  d.text(320,541,'normalization and residual additions omitted; outputs have 512 features',{cls:'sm',size:10.5});
  return d.svg();
}

export function lora_rank_budget() {
  const d=new D(640,304,'lora_rank_budget');
  d.text(10,16,'RANK CHANGES CAPACITY AND PARAMETER COUNT TOGETHER',{cls:'cap',a:'start'});
  [4,8,16,32].forEach((r,i)=>{
    const n=75776*8*r/8,y=59+i*51;
    d.mono(20,y+16,`r = ${r}`,{a:'start',size:12});
    d.rect(112,y,n/2424832*349,31,{fill:r===8?C.accSoft:C.card,stroke:r===8?C.acc:C.ink2});
    d.mono(487,y+16,fmtN(n),{a:'start',size:12});
  });
  d.text(20,283,'Finch-24: all Q, K, V, O, gate, up, and down projections',{cls:'sm',a:'start'});
  return d.svg();
}

export function adapter_parameter_breakdown() {
  const d=new D(640,292,'adapter_parameter_breakdown');
  d.text(10,16,'ONE FINCH-24 BLOCK: 75,776 ADAPTER PARAMETERS AT RANK 8',{cls:'cap',a:'start'});
  const counts=[8192,5120,5120,8192,16384,16384,16384],names=['Q','K','V','O','gate','up','down'];
  let x=18;
  counts.forEach((n,i)=>{
    const w=n/75776*604;
    d.rect(x,75,w,63,{r:0,fill:i>=4?C.accSoft:C.card,stroke:i>=4?C.acc:C.ink2});
    d.text(x+w/2,106,names[i],{cls:'mono',size:10});
    d.mono(x+w/2,158,fmtN(n),{size:8.5});x+=w;
  });
  d.brace(18,622,193,{label:'8 blocks x 75,776 = 606,208 parameters',cls:'mono'});
  d.hand(320,248,'rectangular projections need rectangular counts',{size:20});
  return d.svg();
}

export function adapter_checkpoint_dependency() {
  const d=new D(640,304,'adapter_checkpoint_dependency');
  d.text(10,16,'THE SMALL CHECKPOINT DEPENDS ON THE EXACT BASE',{cls:'cap',a:'start'});
  d.rect(22,57,174,158,{fill:C.card,r:5});
  for(let i=0;i<6;i++) d.line(38,84+i*20,178,84+i*20,{stroke:C.line});
  d.text(109,244,'base weights',{cls:'ttl'});d.mono(109,266,'40,509,952',{size:11});
  d.rect(272,112,117,83,{fill:C.accSoft,stroke:C.acc});
  d.text(330,137,'A, B',{cls:'mono',size:16,color:C.acc});
  d.text(330,169,'config + identity',{cls:'sm',size:9});
  d.mono(330,245,'606,208',{size:11});
  d.arrow(202,150,262,150,{stroke:C.gray});d.text(231,129,'load',{cls:'sm'});
  d.arrow(395,150,447,150,{stroke:C.acc});
  d.grid(455,96,4,4,33,26,{shade:(r,c)=>(r+c+1)/8});
  d.text(521,244,'effective model',{cls:'ttl'});
  d.text(330,287,'a matching shape is insufficient; preserve revision and scaling',{cls:'sm',size:11});
  return d.svg();
}

export function lora_merge_matrix() {
  const d=new D(640,293,'lora_merge_matrix');
  d.text(10,16,'MERGING CHANGES STORAGE, NOT THE INTENDED LINEAR MAP',{cls:'cap',a:'start'});
  const mats=[[[1,0],[0,1]],[[6,12],[8,16]],[[7,12],[8,17]]];
  ['W','scale BA','W merged'].forEach((s,i)=>{
    const x=26+i*223;
    d.text(x+62,58,s,{cls:'mono',size:13});
    d.grid(x,86,2,2,58,46,{val:(r,c)=>mats[i][r][c],cellFill:()=>i?C.accSoft:C.card});
    if(i<2)d.text(x+168,130,i?'=':'+',{size:25});
  });
  d.mono(320,220,'W merged x = [7 x 2 + 12, 8 x 2 + 17] = [26, 33]',{size:10.5});
  d.hand(320,263,'the branch becomes part of the weight tensor',{size:20});
  return d.svg();
}

export function sft_teacher_forcing() {
  const d=new D(640,328,'sft_teacher_forcing');
  d.text(10,16,'TRAINING USES THE RECORDED PREFIX, NOT A SAMPLED ANSWER',{cls:'cap',a:'start'});
  const tokens=['reserve','(','bolt',',','3',')'];
  d.text(18,51,'input',{cls:'mono',a:'start',size:11});d.text(18,172,'target',{cls:'mono',a:'start',size:11});
  tokens.slice(0,-1).forEach((s,i)=>{
    const x=102+i*103;
    d.box(x,67,92,36,s,{cls:'mono',size:11,fill:C.card});
    d.arrow(x+46,108,x+46,155,{stroke:C.acc});
    d.box(x,164,92,36,tokens[i+1],{cls:'mono',size:11,fill:C.accSoft,stroke:C.acc});
  });
  d.brace(101,607,237,{label:'each position predicts the next recorded token'});
  d.hand(320,287,'the correct earlier tokens are supplied during training',{size:20});
  return d.svg();
}

export function sft_role_mask() {
  const d=new D(640,307,'sft_role_mask');
  d.text(10,16,'VISIBLE CONTEXT AND SUPERVISED TARGETS ARE DIFFERENT SETS',{cls:'cap',a:'start'});
  const roles=['system','user','call','tool','call','tool','answer','answer'];
  ['recorded role','loss mask'].forEach((s,i)=>d.text(18,53+i*129,s,{cls:'ttl',a:'start',size:12}));
  roles.forEach((s,i)=>{
    const x=18+i*77;
    d.box(x,75,69,39,s,{cls:'mono',size:9,fill:C.card});
    const on=s==='call'||s==='answer';
    d.arrow(x+34,119,x+34,151,{stroke:on?C.acc:C.line});
    d.box(x,169,69,37,on?'1':'0',{cls:'mono',size:14,fill:on?C.accSoft:C.card,stroke:on?C.acc:C.line});
  });
  d.text(320,243,'user and tool tokens remain context even when their loss is zero',{cls:'sm'});
  d.hand(320,279,'teach the decisions, preserve the observations',{size:20});
  return d.svg();
}

export function sft_shifted_labels() {
  const d=new D(640,276,'sft_shifted_labels');
  d.text(10,16,'THE LOGIT AT POSITION T PREDICTS THE TOKEN AT T + 1',{cls:'cap',a:'start'});
  const xs=[11,22,33,44];
  [['input ids',xs],['shifted targets',xs.slice(1).concat(['none'])]].forEach(([name,values],r)=>{
    const y=73+r*93;
    d.text(18,y+20,name,{cls:'mono',a:'start',size:10});
    values.forEach((v,i)=>d.box(203+i*97,y,79,40,String(v),{cls:'mono',fill:r&&i<3?C.accSoft:C.card,stroke:r&&i<3?C.acc:C.ink2,size:13}));
  });
  d.arrow(339,115,242,157,{stroke:C.acc});
  d.hand(320,247,'shift the token sequence and its target mask together',{size:20});
  return d.svg();
}

export function sft_multistep_dependency() {
  const d=new D(640,306,'sft_multistep_dependency');
  d.text(10,16,'A LATER DECISION MUST SEE THE EARLIER RESULT',{cls:'cap',a:'start'});
  const steps=[['get_stock','assistant'],['available 12','tool'],['reserve 3','assistant'],['remaining 9','tool'],['report 9','assistant']];
  steps.forEach(([s,role],i)=>{
    const x=19+i*124;
    d.box(x,87,104,49,s,{cls:'mono',size:9.5,fill:role==='assistant'?C.accSoft:C.card,stroke:role==='assistant'?C.acc:C.ink2});
    d.text(x+52,64,role,{cls:'sm',size:10});
    if(i<4)d.arrow(x+106,112,x+120,112,{stroke:C.gray});
  });
  d.carrow([[195,143],[195,184],[319,184],[319,142]],{stroke:C.acc});
  d.text(257,207,'condition for reservation',{cls:'sm',color:C.acc});
  d.carrow([[444,143],[444,244],[569,244],[569,142]],{stroke:C.gray});
  d.text(506,270,'evidence for final answer',{cls:'sm'});
  return d.svg();
}

export function lora_scale_by_rank(){
  const d=new D(640,240,'lora_scale_by_rank');
  d.text(10,16,'FIXED ALPHA 16: DOUBLING RANK HALVES THE MULTIPLIER s = α / r',{cls:'cap',a:'start'});
  const rows=[[4,4],[8,2],[16,1]];
  rows.forEach(([r,s],i)=>{
    const y=50+i*52,fin=r===8;
    d.text(30,y+16,`r = ${r}`,{cls:'mono',a:'start',size:11});
    for(let k=0;k<r;k++)d.rect(100+k*14,y+4,10,24,{fill:fin?C.accSoft:C.card,stroke:fin?C.acc:C.ink2,r:2});
    d.text(350,y+16,`s = 16 / ${r} = ${s}`,{cls:'mono',a:'start',size:11,color:fin?C.acc:undefined});
    d.rect(490,y+4,s*30,24,{fill:fin?C.accSoft:C.slateSoft,stroke:fin?C.acc:C.slate,r:0});
  });
  d.text(160,212,'adapter features',{cls:'sm'});d.text(550,212,'scale',{cls:'sm'});
  d.text(320,232,'orange: the Finch-24 adapter; learned correction norms need not follow these ratios',{cls:'xs'});
  return d.svg();
}

export function sft_loss_terms(){
  const d=new D(640,250,'sft_loss_terms');
  d.text(10,16,'HALVING A TARGET PROBABILITY ADDS ln 2 = 0.693147 NATS OF LOSS',{cls:'cap',a:'start'});
  const rows=[[0.5,0.693147],[0.25,1.386294],[0.125,2.079442]];
  const X=v=>200+v*170;
  rows.forEach(([p,l],i)=>{
    const y=48+i*48;
    d.mono(30,y+14,`p = ${p}`,{a:'start',size:11});
    d.rect(110,y,p*160,28,{fill:C.slateSoft,stroke:C.slate,r:0});
    d.rect(X(0),y,l*170,28,{fill:C.accSoft,stroke:C.acc,r:0});
    d.mono(X(l)+8,y+14,l.toFixed(6),{a:'start',size:10.5});
  });
  d.line(X(1.386294),40,X(1.386294),196,{stroke:C.ink2,dash:[4,4],single:true});
  d.text(X(1.386294),210,'mean 1.386294',{cls:'sm'});
  d.text(150,210,'probability',{cls:'sm'});
  d.text(320,236,'loss = −ln p for each supervised target; illustrative probabilities',{cls:'xs'});
  return d.svg();
}
