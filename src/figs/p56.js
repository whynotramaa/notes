import { D, C, fmtN } from '../lib/draw.js';

export function octlm_budget_record(){
  const d=new D(640,347,'octlm_budget_record');
  d.text(10,16,'COMPLETED EXPOSURE AND PLANNED EXPOSURE ARE DIFFERENT',{cls:'cap',a:'start'});
  [['Day 2 recipe',819200,false],['Day 3 short',4096000,true],['Day 3 long',8192000,true]].forEach(([name,n,planned],i)=>{
    const y=67+i*71;d.text(17,y+17,name,{cls:'ttl',a:'start',size:11});
    d.rect(151,y,n/8192000*318,33,{fill:planned?C.card:C.accSoft,stroke:planned?C.ink2:C.acc,dash:planned?[5,3]:undefined,r:0});
    d.mono(487,y+16,fmtN(n),{a:'start',size:11});
    d.text(152,y+49,planned?'planned, not run':'previous training recipe',{cls:'sm',a:'start',size:10});
  });
  d.mono(320,309,'20 x 3,740,160 = 74,803,200 positions',{size:11});
  d.text(320,333,'heuristic reference, not a universal minimum',{cls:'sm',size:10.5});return d.svg();
}

export function paper_claim_evidence(){
  const d=new D(640,316,'paper_claim_evidence');
  d.text(10,16,'FOLLOW THE HEADLINE BACK TO ITS SUPPORT',{cls:'cap',a:'start'});
  d.box(219,53,202,46,'claimed improvement',{fill:C.accSoft,stroke:C.acc,size:13});
  [['baseline','what it beat',20],['budget','what it spent',232],['measurement','what was timed',444]].forEach(([name,sub,x])=>{
    d.arrow(x+88,156,320,105,{stroke:C.gray});
    d.box(x,163,176,40,name,{fill:C.card,size:13});d.text(x+88,227,sub,{cls:'sm'});
  });
  d.hand(320,285,'a missing control narrows the conclusion',{size:23});return d.svg();
}

export function complete_research_pipeline(){
  const d=new D(640,350,'complete_research_pipeline');
  d.text(10,16,'THE RESULT MUST ANSWER THE ORIGINAL QUESTION',{cls:'cap',a:'start'});
  const rows=[['hypothesis','baseline + variant','controlled training'],['quality + costs','uncertainty','keep, reject, unresolved']];
  rows.forEach((row,r)=>row.forEach((s,i)=>{
    const x=20+i*212,y=68+r*139;
    d.box(x,y,176,49,s,{fill:i===2&&r===1?C.accSoft:C.card,stroke:i===2&&r===1?C.acc:C.ink2,size:11});
    if(i<2)d.arrow(x+183,y+24,x+207,y+24,{stroke:C.gray});
  }));
  d.lines([[620,92],[631,92],[631,172],[9,172],[9,231],[16,231]],{stroke:C.line,single:true});d.head(16,231,0,{stroke:C.line});
  d.lines([[532,262],[532,302],[205,302],[205,92],[201,92]],{stroke:C.acc,single:true});d.head(201,92,Math.PI,{stroke:C.acc});
  d.fillRect(227,287,271,29,C.paper);d.text(363,302,'revise if the evidence cannot resolve the claim',{cls:'sm',size:10.5});
  d.text(320,334,'a completed implementation is one stage, not the whole experiment',{cls:'sm',size:10.5});return d.svg();
}

export function finch_forward_shapes(){
  const d=new D(640,300,'finch_forward_shapes');
  d.text(10,16,'ONE FINCH-24 FORWARD PASS, BATCH 2, EIGHT TOKENS',{cls:'cap',a:'start'});
  const box=(x,y,w,t,s,acc)=>{d.box(x,y,w,40,t,{fill:acc?C.accSoft:C.card,stroke:acc?C.acc:C.ink2,size:11});d.mono(x+w/2,y+54,s,{size:10});};
  box(14,50,84,'token ids','[2,8]');
  box(122,50,96,'embedding','[2,8,512]');
  d.arrow(98,70,120,70,{stroke:C.gray});d.arrow(218,70,240,70,{stroke:C.gray});
  d.rect(240,36,280,184,{stroke:C.acc,dash:[5,4],r:8});
  d.text(380,50,'block × 8, residual width 512',{cls:'sm',color:C.acc});
  box(256,66,78,'Q','[2,8,512]',true);
  box(346,66,78,'K','[2,8,128]',true);
  box(436,66,72,'V','[2,8,128]',true);
  box(256,150,120,'gate, up','[2,8,1,536]');
  box(394,150,114,'down','[2,8,512]');
  d.arrow(376,170,392,170,{stroke:C.gray});
  d.arrow(520,128,548,128,{stroke:C.gray});
  box(550,108,80,'logits','[2,8,32,000]');
  d.text(320,250,'K and V are 2 KV heads of width 64; 8 query heads share them in groups of 4',{cls:'sm'});
  d.text(320,272,'a sliding mask changes allowed comparisons, not any of these shapes',{cls:'sm'});
  return d.svg();
}
