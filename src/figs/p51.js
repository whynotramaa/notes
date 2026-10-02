import { D, C, fmtN } from '../lib/draw.js';

export function compressed_history_timeline(){
  const d=new D(640,325,'compressed_history_timeline');
  d.text(10,16,'KEEP RECENT POSITIONS; SUMMARIZE OLDER BLOCKS',{cls:'cap',a:'start'});
  d.text(177,53,'768 historical positions',{cls:'mono',size:12});
  d.text(489,53,'256 recent positions',{cls:'mono',size:12});
  for(let i=0;i<12;i++)d.rect(20+i*29,79,25,47,{fill:C.card,r:0,stroke:C.line});
  for(let i=0;i<8;i++)d.rect(390+i*27,79,23,47,{fill:C.accSoft,r:0,stroke:C.acc});
  d.brace(20,362,152,{label:'historical blocks (schematic)',cls:'sm'});
  d.arrow(192,180,192,212,{stroke:C.gray});
  d.arrow(491,136,491,212,{stroke:C.acc});
  d.box(55,220,277,41,'96 summary entries',{fill:C.card,size:14});
  d.box(390,220,212,41,'256 exact entries',{fill:C.accSoft,stroke:C.acc,size:14});
  d.hand(320,300,'352 entries represent a 1,024-position past',{size:22});return d.svg();
}

export function pooled_memory_vectors(){
  const d=new D(640,340,'pooled_memory_vectors');
  d.text(10,16,'MEAN POOLING COLLAPSES TWO DISTINCT LOOKUP CHOICES',{cls:'cap',a:'start'});
  [['keys',[[1,0],[3,2]],[2,1]],['values',[[4,2],[8,6]],[6,4]]].forEach(([label,rows,out],i)=>{
    const y=76+i*125;d.text(18,y+25,label,{cls:'ttl',a:'start',size:12});
    d.grid(116,y,2,2,56,32,{val:(r,c)=>rows[r][c],cellFill:()=>C.card});
    d.arrow(238,y+32,401,y+32,{stroke:C.acc});
    d.text(320,y+9,'componentwise mean',{cls:'sm',size:10.5});
    d.grid(416,y+16,1,2,67,32,{val:(r,c)=>out[c],cellFill:()=>C.accSoft});
  });
  d.hand(320,312,'the average cannot tell you which value belonged to which key',{size:19});return d.svg();
}

export function compression_memory_ledger(){
  const d=new D(640,280,'compression_memory_ledger');
  d.text(10,16,'SAME FEATURE WIDTH, FEWER TOKEN ENTRIES',{cls:'cap',a:'start'});
  const scale=460/1024;
  [['full',1024,0],['compressed',256,96]].forEach(([name,recent,old],r)=>{
    const y=74+r*91;d.text(18,y+22,name,{cls:'ttl',a:'start',size:12});
    d.rect(155,y,recent*scale,43,{fill:r?C.accSoft:C.card,stroke:r?C.acc:C.ink2,r:0});
    if(old)d.rect(155+recent*scale,y,old*scale,43,{fill:C.slateSoft,stroke:C.slate,r:0});
    d.mono(155,y+64,r?'1,441,792 bytes = 1.375 MiB':'4,194,304 bytes = 4 MiB',{a:'start',size:11});
  });
  d.text(320,257,'orange: 256 exact entries; slate: 96 summaries',{cls:'sm'});return d.svg();
}

export function compression_retrieval_probe(){
  const d=new D(640,300,'compression_retrieval_probe');
  d.text(10,16,'MOVE THE FACT; KEEP THE QUESTION AND ANSWER FIXED',{cls:'cap',a:'start'});
  ['old block','boundary','recent span'].forEach((s,i)=>{
    const y=60+i*66;d.text(18,y+18,s,{cls:'mono',a:'start',size:10.5});
    d.rect(137,y,395,34,{fill:C.card,r:0,stroke:C.line});
    const x=[172,380,477][i];d.rect(x,y+3,27,28,{fill:C.accSoft,stroke:C.acc,r:0});
    d.arrow(539,y+17,562,y+17,{stroke:C.gray});d.text(601,y+17,'query',{cls:'sm'});
  });
  d.hand(320,272,'"What was the reservation key?"',{size:22});return d.svg();
}
