import { D, C } from '../lib/draw.js';

export function attention_cache_comparison(){
  const d=new D(640,339,'attention_cache_comparison');
  d.text(10,16,'SAME WORKLOAD, DIFFERENT PERSISTENT KV REPRESENTATIONS',{cls:'cap',a:'start'});
  [['MHA',128,1024],['GQA',32,256],['MQA',16,128],['MLA fixture',10,80]].forEach(([name,mib,dims],i)=>{
    const y=65+i*61;d.text(17,y+15,name,{cls:'ttl',a:'start',size:11});
    d.rect(131,y,mib/128*362,31,{fill:i===3?C.accSoft:C.card,stroke:i===3?C.acc:C.ink2,r:0});
    d.mono(507,y+15,`${mib} MiB`,{a:'start',size:11});
    d.mono(132,y+44,`${dims} features / token / layer`,{a:'start',size:9});
  });
  d.text(320,325,'B = 2, L = 8, T = 4,096, 2-byte elements; tensor payload only',{cls:'sm',size:10.5});return d.svg();
}

export function mla_rank_crossover(){
  const d=new D(640,340,'mla_rank_crossover');
  d.text(10,16,'THE BASELINE IS GQA, NOT AN UNCOMPRESSED STRAW MODEL',{cls:'cap',a:'start'});
  const X=r=>88+r/280*477,Y=v=>260-v/300*188;
  d.arrow(87,260,585,260,{stroke:C.ink2});d.arrow(88,262,88,57,{stroke:C.ink2});
  d.line(X(0),Y(256),X(280),Y(256),{stroke:C.slate,sw:1.5,dash:[5,4]});
  d.text(99,Y(256)-15,'GQA: 256 features',{cls:'mono',a:'start',size:10,color:C.slate});
  d.line(X(0),Y(16),X(280),Y(296),{stroke:C.acc,sw:2});
  [32,64,128,240,256].forEach(r=>{
    d.dot(X(r),Y(r+16),3.5,C.acc);d.mono(X(r),278,String(r),{size:9});
  });
  d.text(384,188,'MLA: rank + 16',{cls:'mono',size:11,color:C.acc});
  d.text(33,160,'cached\nfeatures',{cls:'sm',vc:true,size:10});
  d.text(334,307,'latent rank',{cls:'mono',size:11});return d.svg();
}

export function decoupled_rope_paths(){
  const d=new D(640,402,'decoupled_rope_paths');
  d.text(10,16,'KEEP CONTENT ABSORPTION AND POSITIONAL ROTATION SEPARATE',{cls:'cap',a:'start'});
  [['content',20,'absorbed query','cached latent'],['position',338,'rotated query','cached rotary key']].forEach(([name,x,q,k],i)=>{
    d.text(x+140,50,name,{cls:'ttl',size:14});
    d.box(x,76,280,40,q,{fill:C.card,size:12});
    d.box(x,138,280,40,k,{fill:i?C.card:C.accSoft,stroke:i?C.ink2:C.acc,size:12});
    d.lines([[x+284,96],[x+298,96],[x+298,219],[x+161,219]],{stroke:C.gray,single:true});d.head(x+161,219,Math.PI,{stroke:C.gray});
    d.arrow(x+140,184,x+140,196,{stroke:C.gray});
    d.circle(x+140,219,43,{fill:C.card});d.text(x+140,219,'dot',{cls:'mono',size:11});
    d.arrow(x+140,245,320,297,{stroke:i?C.gray:C.acc});
  });
  d.box(211,303,218,38,'sum / sqrt(80)',{fill:C.accSoft,stroke:C.acc,cls:'mono',size:12});
  d.arrow(434,322,476,322,{stroke:C.acc});d.text(542,322,'softmax',{cls:'mono',size:13});
  d.hand(320,378,'the positional key costs real cache bytes',{size:22});return d.svg();
}

export function kv_sharing_spectrum(){
  const d=new D(640,330,'kv_sharing_spectrum');
  d.text(10,16,'EIGHT QUERY HEADS, FOUR WAYS TO STORE WHAT THEY READ',{cls:'cap',a:'start'});
  const rows=[['MHA',8,'1,024'],['GQA',2,'256'],['MQA',1,'128'],['MLA',0,'80']];
  rows.forEach(([name,kv,feat],r)=>{
    const y=46+r*68,mla=kv===0;
    d.text(20,y+28,name,{cls:'ttl',a:'start'});
    for(let h=0;h<8;h++)d.rect(90+h*30,y+4,24,16,{fill:C.card,stroke:C.ink2,r:3});
    if(mla){
      d.rect(150,y+36,96,18,{fill:C.accSoft,stroke:C.acc,r:3});d.text(198,y+45,'latent 64',{cls:'xs'});
      d.rect(252,y+36,40,18,{fill:C.slateSoft,stroke:C.slate,r:3});d.text(272,y+45,'R 16',{cls:'xs'});
      for(let h=0;h<8;h++)d.line(102+h*30,y+20,198,y+36,{stroke:C.line,sw:.7,single:true});
    }else{
      const w=240/kv;
      for(let k=0;k<kv;k++){
        d.rect(90+k*w+2,y+36,w-4,18,{fill:C.accSoft,stroke:C.acc,r:3});
        for(let h=0;h<8;h++)if(Math.floor(h*kv/8)===k)d.line(102+h*30,y+20,90+k*w+w/2,y+36,{stroke:C.line,sw:.7,single:true});
      }
    }
    d.mono(360,y+28,`${feat} cached features`,{a:'start',size:11});
  });
  d.text(320,318,'per token per layer, Finch head width 64; orange is what the cache keeps',{cls:'sm'});
  return d.svg();
}
