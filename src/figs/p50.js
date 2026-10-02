import { D, C, fmtN } from '../lib/draw.js';

export function where_research(stage=99) {
  const d=new D(640,302,`where_research_${stage}`);
  d.text(10,16,'THE ARCHITECTURE INVESTIGATION',{cls:'cap',a:'start'});
  const labels=['Cost + future tokens','Sparse connections','Compressed history','Latent memory','Compare KV designs','Speculative decoding','Controlled experiment','Interpret + decide'];
  labels.forEach((s,i)=>{
    const x=19+(i%2)*315,y=49+Math.floor(i/2)*61,on=stage===99||stage===i+1;
    d.box(x,y,286,40,s,{fill:on?C.accSoft:C.card,stroke:on?C.acc:C.line,size:12});
    d.mono(x+10,y-10,String(i+1).padStart(2,'0'),{a:'start',size:9,color:on?C.acc:C.gray});
    if(i%2===0)d.arrow(x+291,y+20,x+310,y+20,{stroke:C.line});
  });
  return d.svg();
}

export function cover_research() {
  const d=new D(640,830,'cover_research');
  for(let x=14;x<640;x+=22)for(let y=28;y<800;y+=22)d.dot(x,y,.7,C.faint);
  d.text(10,16,'OCTLM / UNIT VI / RESEARCH ARCHITECTURES',{cls:'cap',a:'start'});
  d.text(48,104,'Changing the',{size:53,w:600,a:'start'});
  d.hl(49,184,409,184,{th:18});d.text(48,170,'Decoder',{size:61,w:600,a:'start'});
  d.text(50,237,'Attention, memory, future tokens, and the',{size:17,a:'start'});
  d.text(50,264,'experiment that tells you what improved.',{size:17,a:'start'});
  // Dense, local, and latent geometry share the same visual scale.
  d.grid(70,359,8,8,24,24,{shade:(r,c)=>c<=r?.55:0,inner:false,color:C.ink2});
  d.text(166,332,'full causal memory',{cls:'ttl',size:13});
  d.grid(374,359,8,8,24,24,{shade:(r,c)=>c<=r&&r-c<3?.55:0,inner:false});
  d.text(470,332,'change the connections',{cls:'ttl',size:13});
  d.arrow(277,454,357,454,{stroke:C.acc,sw:1.8});
  d.arrow(470,560,470,607,{stroke:C.acc});
  d.grid(387,620,4,6,27,20,{shade:(r,c)=>((r+c)%4+1)/5,inner:false});
  d.text(467,728,'smaller representation',{cls:'ttl',size:13});
  d.hand(167,627,'then measure\nwhat was lost',{vc:true,size:25});
  d.carrow([[230,642],[300,658],[371,661]],{stroke:C.acc});
  d.text(48,786,'A HAND-DRAWN FIELD GUIDE',{cls:'cap',a:'start',size:11});
  return d.svg();
}

export function dense_attention_growth() {
  const d=new D(640,360,'dense_attention_growth');
  d.text(10,16,'DOUBLING SEQUENCE LENGTH QUADRUPLES A FULL SCORE GRID',{cls:'cap',a:'start'});
  [[8,14.5,127,93],[16,14.5,337,53]].forEach(([n,cell,x,y])=>{
    const size=n*cell;
    d.grid(x,y,n,n,cell,cell,{shade:(r,c)=>c<=r?.38:0,inner:false,color:n===16?C.acc:C.ink2});
    d.text(x+size/2,34,`${n} x ${n} = ${n*n} grid entries`,{cls:'mono',size:11});
    d.text(x+size/2,302,`${n*(n+1)/2} causal pairs`,{cls:'mono',size:11});
  });
  d.hand(320,337,'a fused kernel changes storage, not the dense connection count',{size:18});
  return d.svg();
}

export function mtp_future_heads() {
  const d=new D(640,335,'mtp_future_heads');
  d.text(10,16,'A SHARED PREFIX CAN TEACH SEVERAL FUTURE TARGETS',{cls:'cap',a:'start'});
  d.chips(23,56,['the','bolt','is'],{width:78,h:32});
  d.arrow(281,72,329,72,{stroke:C.gray});d.box(337,49,252,47,'shared decoder trunk',{fill:C.card,size:14});
  const heads=[['head 1','next: available'],['head 2','later: for'],['head 3','later: pickup']];
  heads.forEach(([s,target],i)=>{
    const x=22+i*212;
    d.carrow([[462,100],[x+90,132],[x+90,160]],{stroke:i?C.acc:C.gray});
    d.box(x,170,182,42,s,{fill:i?C.accSoft:C.card,stroke:i?C.acc:C.ink2,size:13});
    d.text(x+91,245,target,{cls:'mono',size:10.5});
  });
  d.hand(320,297,'extra heads learn future tokens; they do not make them verified',{size:19});
  return d.svg();
}

export function mtp_target_alignment() {
  const d=new D(640,285,'mtp_target_alignment');
  d.text(10,16,'EVERY PREDICTION DEPTH HAS A DIFFERENT TARGET SHIFT',{cls:'cap',a:'start'});
  const tokens=['A','B','C','D','E'];
  [['input',tokens],['depth 1',tokens.slice(1).concat(['-'])],['depth 2',tokens.slice(2).concat(['-','-'])]].forEach(([name,values],r)=>{
    const y=60+r*65;d.text(18,y+16,name,{cls:'mono',a:'start',size:11});
    values.forEach((s,i)=>d.box(149+i*94,y,81,33,s,{cls:'mono',fill:r&&s!=='-'?C.accSoft:C.card,stroke:r&&s!=='-'?C.acc:C.line,size:12}));
  });
  d.text(320,265,'positions without a target at that depth are masked',{cls:'sm'});
  return d.svg();
}

export function mtp_verify_prefix() {
  const d=new D(640,285,'mtp_verify_prefix');
  d.text(10,16,'A FUTURE HEAD PROPOSES; THE TARGET DISTRIBUTION VERIFIES',{cls:'cap',a:'start'});
  const rows=[['draft',['bolt','is','red','today']],['target greedy',['bolt','is','blue','?']]];
  rows.forEach(([s,toks],r)=>{
    const y=72+r*78;d.text(17,y+18,s,{cls:'mono',a:'start',size:10});
    toks.forEach((t,i)=>d.box(170+i*111,y,98,36,t,{cls:'mono',fill:i<2?C.accSoft:C.card,stroke:i<2?C.acc:C.ink2,size:12}));
  });
  d.brace(170,379,219,{label:'accept this prefix',color:C.acc});
  d.text(494,245,'replace at first mismatch',{cls:'sm'});
  return d.svg();
}

export function sparse_mask_families() {
  const d=new D(640,325,'sparse_mask_families');
  d.text(10,16,'CAUSAL CONNECTION PATTERNS: THE QUERY IS THE ROW',{cls:'cap',a:'start'});
  const masks=[['dense',(r,c)=>c<=r],['window 3',(r,c)=>c<=r&&r-c<3],['window + globals',(r,c)=>c<=r&&(r-c<3||c===0||c===4)]];
  masks.forEach(([s,mask],i)=>{
    const x=27+i*212;
    d.text(x+79,52,s,{cls:'ttl',size:12});
    d.grid(x,78,8,8,20,20,{shade:(r,c)=>mask(r,c)?.6:0,inner:false,color:i===0?C.ink2:C.acc});
    let count=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++)count+=mask(r,c);
    d.mono(x+80,261,`${count} allowed pairs`,{size:10.5});
  });
  d.text(320,300,'all patterns prohibit attending to future positions',{cls:'sm'});
  return d.svg();
}

export function window_receptive_growth() {
  const d=new D(640,335,'window_receptive_growth');
  d.text(10,16,'A LOCAL EDGE CAN CARRY INDIRECT INFORMATION ACROSS LAYERS',{cls:'cap',a:'start'});
  const positions=Array.from({length:10},(_,i)=>i);
  [0,1,2,3].forEach(layer=>{
    const y=57+layer*64;
    d.text(15,y+14,`layer ${layer}`,{cls:'mono',a:'start',size:10});
    positions.forEach((pos,i)=>{
      const reachable=pos>=9-3*layer;
      d.box(117+i*50,y,39,28,String(pos),{cls:'mono',size:10,fill:reachable?C.accSoft:C.card,stroke:reachable?C.acc:C.line});
    });
  });
  d.hand(320,316,'with w = 4, each layer can extend reach by at most 3',{size:19});
  return d.svg();
}

export function hybrid_layer_schedule() {
  const d=new D(640,293,'hybrid_layer_schedule');
  d.text(10,16,'ALTERNATE LOCAL WORK WITH EXPLICIT FULL-CONTEXT ACCESS',{cls:'cap',a:'start'});
  for(let i=0;i<8;i++){
    const x=23+i*76,global=(i+1)%4===0;
    d.rect(x,82,62,95,{fill:global?C.accSoft:C.card,stroke:global?C.acc:C.ink2});
    d.mono(x+31,64,`L${i+1}`,{size:11});
    if(global)d.grid(x+10,110,4,4,10,10,{shade:(r,c)=>c<=r?.7:0,inner:false});
    else for(let j=0;j<4;j++)d.line(x+12,106+j*15,x+43,106+j*15,{stroke:C.gray,single:true});
    d.text(x+31,204,global?'full':'local',{cls:'sm',size:10});
  }
  d.mono(320,240,'6 local layers + 2 full layers',{size:12});
  d.text(320,270,'illustrative Finch-24 schedule; quality needs retraining and evaluation',{cls:'sm',size:10.5});
  return d.svg();
}

export function hybrid_cost_ledger() {
  const d=new D(640,300,'hybrid_cost_ledger');
  d.text(10,16,'THREE SCHEDULES, SAME FINCH SHAPES: CACHE BYTES AND ALLOWED PAIRS',{cls:'cap',a:'start'});
  const rows=[['all full',32,67125248],['hybrid 2 + 6',9.5,22876928],['all local',2,8127488]];
  d.text(170,50,'KV payload, MiB',{cls:'ttl'});
  d.text(470,50,'causal pairs per head',{cls:'ttl'});
  rows.forEach(([name,mib,pairs],i)=>{
    const y=78+i*58,hyb=i===1;
    d.text(20,y+15,name,{cls:'mono',a:'start',size:11});
    d.rect(120,y,mib/32*170,30,{fill:hyb?C.accSoft:C.card,stroke:hyb?C.acc:C.ink2,r:0});
    d.mono(126+mib/32*170,y+15,String(mib),{a:'start',size:10.5});
    d.rect(340,y,pairs/67125248*200,30,{fill:hyb?C.accSoft:C.card,stroke:hyb?C.acc:C.ink2,r:0});
    d.mono(346+pairs/67125248*200,y+15,fmtN(pairs),{a:'start',size:10.5});
  });
  d.text(320,262,'batch 2, length 4,096, window 256, 8 layers; computed payloads, not measured latency',{cls:'sm'});
  d.hand(320,286,'the two full layers carry most of the cost',{size:17});
  return d.svg();
}
