import { D, C, fmtN } from '../lib/draw.js';

export function stockroom_before_after() {
  const d = new D(640, 340, 'stockroom_before_after');
  d.text(10,16,'ONE RESERVATION CHANGES THE INVENTORY, NOT THE WORDS',{cls:'cap',a:'start'});
  // Each bolt is a counted item. The extra reservation is orange.
  ['before the action','after the receipt'].forEach((title,r)=>{
    const y=81+r*141;
    d.text(20,y-34,title,{cls:'ttl',a:'start',size:15});
    d.line(18,y+45,620,y+45,{stroke:C.ink2,sw:1.5});
    for(let i=0;i<17;i++) {
      const x=31+i*34.5,added=r&&i>=5&&i<8,held=i<(r?8:5);
      const color=added?C.acc:held?C.gray:C.ink2;
      d.poly([[x-9,y],[x-5,y-7],[x+5,y-7],[x+9,y],[x+5,y+7],[x-5,y+7]],{stroke:color,fill:added?C.accSoft:held?C.faint:C.card,sw:.9});
      d.line(x,y+8,x,y+32,{stroke:color,sw:2});
      [15,20,25,30].forEach(dy=>d.line(x-4,y+dy,x+4,y+dy-2,{stroke:color,sw:.7,single:true}));
    }
    d.brace(18,18+(r?8:5)*34.5,y+64,{label:`${r?8:5} reserved`,cls:'mono'});
    d.brace(18+(r?8:5)*34.5,620,y+64,{label:`${r?9:12} available`,cls:'mono'});
  });
  d.arrow(254,167,254,199,{stroke:C.acc});
  d.mono(272,183,'reserve 3',{a:'start',color:C.acc,size:12});
  d.hand(480,324,'the 3 orange bolts are the action',{size:18});
  return d.svg();
}

export function agent_loop_notebook() {
  const d=new D(640,380,'agent_loop_notebook');
  d.text(10,16,'THE MODEL READS A RECORD; THE RUNTIME OWNS THE LOOP',{cls:'cap',a:'start'});
  d.box(234,49,176,49,'model decision',{fill:C.accSoft,stroke:C.acc,size:14});
  d.box(441,168,173,49,'validate + dispatch',{fill:C.card,size:12});
  d.box(238,290,176,49,'tool service',{fill:C.card,size:14});
  d.rect(20,121,176,144,{fill:C.card,r:3});
  d.line(42,123,42,263,{stroke:C.line});
  ['user: reserve 3','call: get_stock','tool: available 12','call: reserve','tool: remaining 9'].forEach((s,i)=>{
    const y=143+i*24;
    d.circle(29,y,5,{stroke:C.gray,sw:.7});
    d.mono(51,y,s,{a:'start',size:8.7});
    d.line(49,y+10,187,y+10,{stroke:C.faint,sw:.5,single:true});
  });
  d.carrow([[200,139],[224,115],[258,104]],{stroke:C.gray});
  d.carrow([[414,77],[530,93],[528,160]],{stroke:C.acc});
  d.carrow([[529,222],[522,305],[418,314]],{stroke:C.gray});
  d.carrow([[234,315],[107,314],[107,272]],{stroke:C.gray});
  d.text(482,123,'complete call',{cls:'sm'});
  d.text(507,263,'checked arguments',{cls:'sm'});
  d.text(110,302,'result + call ID',{cls:'sm'});
  d.text(110,102,'retained history',{cls:'sm'});
  d.hand(322,191,'observe, then decide',{size:21});
  d.text(322,365,'final answer exits the loop; a tool-call boundary continues it',{cls:'sm'});
  return d.svg();
}

export function tool_json_anatomy() {
  const d=new D(640,326,'tool_json_anatomy');
  d.text(10,16,'THE ENVELOPE AND THE ARGUMENT OBJECT DO DIFFERENT JOBS',{cls:'cap',a:'start'});
  d.rect(18,51,365,234,{fill:C.card,r:5});
  const lines=['{','  "id": "c2",','  "name": "reserve",','  "arguments": {','    "sku": "bolt",','    "quantity": 3,','    "request_key": "r1"','  }','}'];
  lines.forEach((s,i)=>d.mono(34,70+i*24,s,{a:'start',size:12,color:i===5?C.acc:C.ink}));
  [[94,'pairs call with result'],[118,'chooses registry entry'],[190,'positive integer'],[214,'deduplicates a write']].forEach(([y,s])=>{
    d.line(312,y,403,y,{stroke:y===190?C.acc:C.line,single:true});
    d.text(418,y,s,{cls:'sm',a:'start',size:11,color:y===190?C.acc:C.ink2});
  });
  d.hand(320,310,'c2 and r1 are not interchangeable identities',{size:19});
  return d.svg();
}

export function tool_selection_tree() {
  const d=new D(640,340,'tool_selection_tree');
  d.text(10,16,'TOOL CHOICE DEPENDS ON WHAT THE NEXT DECISION NEEDS',{cls:'cap',a:'start'});
  d.box(191,47,257,44,'What does this request need?',{fill:C.card,size:13});
  const branches=[{x:18,label:'an explanation',result:'answer directly',sub:'no tool'},{x:230,label:'current evidence',result:'get_stock',sub:'read only'},{x:442,label:'authorized action',result:'reserve',sub:'state change'}];
  branches.forEach(({x,label,result,sub})=>{
    d.carrow([[320,96],[x+88,124],[x+88,163]],{stroke:C.line});
    d.text(x+88,140,label,{cls:'sm',size:10.5});
    d.box(x,174,178,44,result,{cls:'mono',fill:result==='reserve'?C.accSoft:C.card,stroke:result==='reserve'?C.acc:C.ink2,size:12});
    d.text(x+88,243,sub,{cls:'sm'});
  });
  d.hand(320,290,'availability is a gate; it is not the reason to call',{size:19});
  d.text(320,318,'a tool can be available and still unnecessary for this task',{cls:'sm'});
  return d.svg();
}

export function checkpoint_specialization() {
  const d=new D(640,316,'checkpoint_specialization');
  d.text(10,16,'THE SAME SHAPES CAN HOLD DIFFERENT LEARNED BEHAVIOR',{cls:'cap',a:'start'});
  ['pretrained','instruction-tuned','tool-specialized'].forEach((label,i)=>{
    const x=36+i*211;
    d.text(x+64,51,label,{cls:'ttl',size:12});
    d.grid(x,77,4,4,31,26,{shade:(r,c)=>((r*5+c*3+i*2)%7+1)/8,color:i===2?C.acc:C.ink2,inner:false});
    d.text(x+64,207,['continue a sequence','answer a request','use this protocol'][i],{cls:'sm',size:10.5});
    if(i<2){d.arrow(x+136,129,x+184,129,{stroke:C.gray});d.text(x+158,157,'train',{cls:'sm'});}
  });
  d.brace(36,581,246,{label:'the architecture can stay fixed while weights change'});
  d.hand(320,292,'shape compatibility is not checkpoint identity',{size:20});
  return d.svg();
}

export function lora_frozen_branch() {
  const d=new D(640,342,'lora_frozen_branch');
  d.text(10,16,'ONE PROJECTION, A FROZEN PATH AND A TRAINABLE CORRECTION',{cls:'cap',a:'start'});
  d.chips(18,154,['x'],{width:56,h:40});
  d.carrow([[78,171],[114,171],[153,92]],{stroke:C.ink2});
  d.carrow([[78,181],[114,181],[153,245]],{stroke:C.acc});
  d.grid(155,55,4,4,25,22,{cellFill:()=>C.card});
  d.text(205,36,'W frozen',{cls:'ttl'});
  d.grid(155,215,1,4,25,24,{cellFill:()=>C.accSoft,lineColor:C.acc});
  d.text(205,193,'A trainable',{cls:'ttl',color:C.acc});
  d.arrow(262,227,298,227,{stroke:C.acc});
  d.grid(303,182,4,1,24,22,{cellFill:()=>C.accSoft,lineColor:C.acc});
  d.text(315,163,'B',{cls:'ttl',color:C.acc});
  d.arrow(334,227,369,227,{stroke:C.acc});
  d.box(374,209,74,37,'alpha/r',{cls:'mono',size:10,fill:C.accFaint,stroke:C.acc});
  d.carrow([[258,95],[488,95],[517,151]],{stroke:C.ink2});
  d.carrow([[451,227],[488,227],[517,193]],{stroke:C.acc});
  d.circle(527,172,35,{fill:C.paper});d.text(527,172,'+',{size:22});
  d.arrow(547,172,571,172,{stroke:C.ink2});
  d.chips(575,153,['y'],{width:46,h:40});
  d.text(366,78,'Wx',{cls:'mono',size:12});
  d.text(416,272,'(alpha/r) B(Ax)',{cls:'mono',size:12,color:C.acc});
  d.hand(320,314,'gradients update A and B; W still carries the input',{size:19});
  return d.svg();
}

export function lora_factorization_geometry() {
  const d=new D(640,321,'lora_factorization_geometry');
  d.text(10,16,'A DENSE UPDATE CAN BE STORED AS TWO THIN FACTORS',{cls:'cap',a:'start'});
  d.grid(20,85,4,4,29,29,{cellFill:()=>C.card});
  d.text(78,62,'delta W: 4 x 4',{cls:'mono',size:11});
  d.text(78,232,'16 entries',{cls:'mono'});
  d.text(178,146,'=',{size:25});
  d.grid(225,85,4,1,29,29,{cellFill:()=>C.accSoft,lineColor:C.acc});
  d.text(240,62,'B: 4 x 1',{cls:'mono',size:11});
  d.text(284,146,'x',{size:19});
  d.grid(324,127,1,4,29,29,{cellFill:()=>C.accSoft,lineColor:C.acc});
  d.text(382,105,'A: 1 x 4',{cls:'mono',size:11});
  d.brace(221,442,226,{label:'4 + 4 = 8 trainable entries',cls:'mono'});
  d.text(549,103,'rank 1',{cls:'ttl',color:C.acc});
  d.text(549,140,'one shared',{cls:'sm'});d.text(549,159,'direction',{cls:'sm'});
  d.hand(320,292,'saving parameters also restricts the possible update',{size:19});
  return d.svg();
}

export function lora_toy_multiply() {
  const d=new D(640,331,'lora_toy_multiply');
  d.text(10,16,'A RANK-ONE CORRECTION YOU CAN MULTIPLY BY HAND',{cls:'cap',a:'start'});
  d.text(82,53,'A',{cls:'ttl'});d.grid(23,72,1,2,58,41,{val:(r,c)=>[1,2][c],cellFill:()=>C.accFaint});
  d.text(191,91,'x',{size:18});d.text(242,53,'x',{cls:'ttl'});d.grid(221,71,2,1,41,41,{val:r=>[2,1][r],cellFill:()=>C.card});
  d.text(300,91,'=',{size:20});d.box(331,72,79,41,'4',{cls:'mono',fill:C.accSoft,stroke:C.acc,size:18});
  d.text(432,92,'Ax = 1 x 2 + 2 x 1',{cls:'mono',size:9.5,a:'start'});
  d.text(82,194,'B',{cls:'ttl'});d.grid(62,211,2,1,41,41,{val:r=>[3,4][r],cellFill:()=>C.accFaint});
  d.text(145,233,'x 4 =',{cls:'mono',size:13});d.grid(221,211,2,1,52,41,{val:r=>[12,16][r],cellFill:()=>C.accSoft});
  d.text(335,216,'scale = alpha/r = 2',{cls:'mono',a:'start',size:11});
  d.text(335,245,'base output = [2, 1]',{cls:'mono',a:'start',size:11});
  d.text(335,276,'sum = [26, 33]',{cls:'mono',a:'start',size:15,color:C.acc});
  return d.svg();
}

export function lora_memory_ledger() {
  const d=new D(640,312,'lora_memory_ledger');
  d.text(10,16,'PARAMETER STATE PAYLOAD, WITH EXPLICIT PRECISION ASSUMPTIONS',{cls:'cap',a:'start'});
  const max=648159232;
  [['full FP32 Adam',648159232],['frozen BF16 + FP32 adapter Adam',90719232]].forEach(([s,n],i)=>{
    const y=77+i*110;
    d.text(18,y-23,s,{cls:'ttl',a:'start',size:12});
    d.rect(18,y,n/max*586,34,{fill:i?C.accSoft:C.card,stroke:i?C.acc:C.ink2});
    d.mono(18,y+58,`${fmtN(n)} bytes`,{a:'start',size:12});
  });
  d.hand(408,202,'activations still cost memory',{size:20});
  d.text(18,292,'Finch-24; r = 8 on all seven projections; buffers excluded',{cls:'sm',a:'start'});
  return d.svg();
}

export function lora_zero_initialization() {
  const d=new D(640,290,'lora_zero_initialization');
  d.text(10,16,'ZERO B STARTS WITH THE BASE FUNCTION, NOT A ZERO MODEL',{cls:'cap',a:'start'});
  [['A random','nonzero features'],['B = 0','adapter output = 0'],['W + scale BA','initially equals W']].forEach(([s,sub],i)=>{
    const x=18+i*212;
    d.grid(x+28,79,3,3,35,26,{val:()=>i===1?'0':null,shade:(r,c)=>i===1?0:((r+c+1)%4+1)/5,color:i===2?C.acc:C.ink2});
    d.text(x+80,52,s,{cls:'ttl',size:12});d.text(x+80,185,sub,{cls:'sm',size:10.5});
  });
  d.line(26,225,613,225,{stroke:C.line});
  d.text(320,253,'first backward pass: B can get a gradient; A initially gets zero',{cls:'mono',size:10.5});
  return d.svg();
}
