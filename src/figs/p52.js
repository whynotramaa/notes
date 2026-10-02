import { D, C } from '../lib/draw.js';

export function latent_vs_full_cache(){
  const d=new D(640,334,'latent_vs_full_cache');
  d.text(10,16,'ONE TOKEN: SEPARATE HEAD STATES OR ONE SHARED LATENT',{cls:'cap',a:'start'});
  d.text(154,52,'MHA: K and V per head',{cls:'ttl',size:13});
  d.text(469,52,'MLA: joint content latent',{cls:'ttl',size:13});
  for(let i=0;i<8;i++){
    d.box(25+i*33,81,27,79,'K',{fill:C.card,cls:'mono',size:9,r:0});
    d.box(25+i*33,180,27,79,'V',{fill:C.card,cls:'mono',size:9,r:0});
  }
  d.arrow(300,160,353,160,{stroke:C.acc});
  d.rect(381,84,194,75,{fill:C.accSoft,stroke:C.acc});
  d.mono(478,110,'c KV: 64 features',{size:12});
  d.grid(394,131,1,8,21,15,{shade:(r,c)=>(c%3+1)/4,inner:false});
  d.box(381,190,194,42,'positional key: 16',{cls:'mono',size:11,fill:C.card});
  d.mono(154,292,'8 x (64 + 64) = 1,024',{size:10.5});
  d.mono(478,292,'64 + 16 = 80',{size:11,color:C.acc});
  d.text(320,320,'bars show storage organization; widths are schematic',{cls:'sm',size:10.5});return d.svg();
}

export function mla_projection_shapes(){
  const d=new D(640,358,'mla_projection_shapes');
  d.text(10,16,'THE SHARED LATENT HAS TWO DISTINCT EXPANSION MAPS',{cls:'cap',a:'start'});
  d.box(22,61,160,53,'h: [2, 8, 512]',{cls:'mono',size:11,fill:C.card});
  d.arrow(188,88,241,88,{stroke:C.acc});
  d.text(218,136,'W D',{cls:'mono',size:11});d.mono(218,157,'64 x 512',{size:10});
  d.box(249,61,184,53,'c: [2, 8, 64]',{cls:'mono',size:11,fill:C.accSoft,stroke:C.acc});
  d.line(341,120,341,176,{stroke:C.gray,single:true});
  d.line(172,176,487,176,{stroke:C.gray,single:true});
  d.arrow(172,176,172,210,{stroke:C.gray});
  d.arrow(487,176,487,210,{stroke:C.gray});
  [['K content','W UK: 512 x 64',62],['V','W UV: 512 x 64',378]].forEach(([name,shape,x])=>{
    d.box(x,216,216,52,`${name}: [2, 8, 512]`,{cls:'mono',size:10.5,fill:C.card});
    d.mono(x+108,292,shape,{size:11});
  });
  d.hand(320,333,'expand for a reference check; persist the compact cache',{size:20});return d.svg();
}

export function mla_absorbed_dot_product(){
  const d=new D(640,330,'mla_absorbed_dot_product');
  d.text(10,16,'MOVE THE LINEAR MAP FROM EVERY KEY TO THE QUERY',{cls:'cap',a:'start'});
  [['expand key','c = 4','k = [4, 8]','q dot k = 20'],['transform query','q = [1, 2]','q latent = 5','5 x 4 = 20']].forEach(([name,a,b,c],r)=>{
    const y=88+r*119;d.text(20,y-33,name,{cls:'ttl',a:'start',size:13});
    [a,b,c].forEach((s,i)=>{
      const x=20+i*212;d.box(x,y,184,42,s,{cls:'mono',size:11,fill:i===2?C.accSoft:C.card,stroke:i===2?C.acc:C.ink2});
      if(i<2)d.arrow(x+188,y+21,x+207,y+21,{stroke:C.gray});
    });
  });
  d.hand(320,302,'same score, different persistent storage',{size:22});return d.svg();
}
