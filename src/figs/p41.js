import { D, C } from '../lib/draw.js';

export function agent_eval_layers() {
  const d = new D(640, 300, 'agent_eval_layers');
  d.text(10,16,'A CALL CAN PASS EVERY LOCAL CHECK AND FAIL THE TASK',{cls:'cap',a:'start'});
  [['Syntax','JSON parses','yes'],['Schema','quantity is an integer','yes'],['Selection','reserve is the right tool','yes'],['Arguments','requested 3, generated 4','no'],['Task outcome','environment matches request','no']].forEach(([label,example,pass],i)=>{
    const y=51+i*44;
    d.text(18,y+13,label,{cls:'ttl',a:'start'});
    d.text(158,y+13,example,{cls:'mono',a:'start',size:11});
    d.box(548,y,70,27,pass,{fill:pass==='no'?C.accSoft:C.card,stroke:pass==='no'?C.acc:C.ink2,cls:'mono',size:11});
  });
  d.hand(320,279,'grade the world the action left behind',{size:18});
  return d.svg();
}

export function eval_denominators() {
  const d = new D(640,300,'eval_denominators');
  d.text(10,16,'EACH METRIC COUNTS A DIFFERENT POPULATION',{cls:'cap',a:'start'});
  [['selection',18,20],['call validity',22,24],['arguments | valid',19,22],['task success',16,20],['recovery | errors',3,5]].forEach(([label,n,total],i)=>{
    const y=55+i*44;
    d.text(18,y+12,label,{cls:'mono',size:10.5,a:'start'});
    d.rect(194,y,264,25,{fill:C.card,stroke:C.line});
    d.fillRect(196,y+2,260*n/total,21,C.accSoft);
    d.mono(482,y+13,`${n} / ${total} = ${(100*n/total).toFixed(2)}%`,{a:'start',size:10});
  });
  d.text(18,286,'illustrative fixtures; argument accuracy is conditional here',{cls:'sm',a:'start'});
  return d.svg();
}

export function eval_task_matrix() {
  const d = new D(640,265,'eval_task_matrix');
  d.text(10,16,'AN EVALUATION MUST INCLUDE WHEN TO AVOID ACTION',{cls:'cap',a:'start'});
  const cards=[['read only','query current stock'],['read then write','reserve when available'],['unavailable stock','report refusal'],['no tool needed','explain a reservation']];
  cards.forEach(([title,sub],i)=>{
    const x=18+(i%2)*312,y=54+Math.floor(i/2)*94;
    d.box(x,y,292,55,title,{fill:i===3?C.accSoft:C.card,stroke:i===3?C.acc:C.ink2,size:14});
    d.text(x+146,y+73,sub,{cls:'sm'});
  });
  return d.svg();
}

export function failure_owner_agents() {
  const d = new D(640,300,'failure_owner_agents');
  d.text(10,16,'FIND THE FIRST WRONG TRANSITION',{cls:'cap',a:'start'});
  [['prompt','wrong permissions described'],['model','wrong quantity proposed'],['schema / parser','valid call rejected'],['tool','correct call executed incorrectly'],['evaluation','correct outcome graded wrong']].forEach(([name,symptom],i)=>{
    const y=54+i*43;
    d.box(18,y,153,30,name,{cls:'mono',size:10.5,fill:i===1?C.accSoft:C.card,stroke:i===1?C.acc:C.ink2});
    d.arrow(174,y+15,212,y+15,{stroke:C.gray});
    d.text(226,y+15,symptom,{cls:'lbl',a:'start',size:12});
  });
  d.hand(320,281,'the final sentence does not tell you which component failed',{size:17});
  return d.svg();
}

export function prompting_weights_agents() {
  const d = new D(640,275,'prompting_weights_agents');
  d.text(10,16,'CHANGE THE INPUT OR CHANGE THE LEARNED PARAMETERS',{cls:'cap',a:'start'});
  [['Prompting','weights fixed','task rules + examples','new input each run'],['Fine-tuning','weights updated','checked demonstrations','new checkpoint']].forEach(([title,state,source,result],i)=>{
    const x=18+i*312;
    d.text(x+146,52,title,{cls:'ttl',size:16});
    d.box(x,80,292,44,source,{fill:C.card,size:12});
    d.arrow(x+146,128,x+146,153,{stroke:i?C.acc:C.gray});
    d.box(x,156,292,44,state,{fill:i?C.accSoft:C.card,stroke:i?C.acc:C.ink2,size:13});
    d.text(x+146,227,result,{cls:'sm'});
  });
  return d.svg();
}

export function compound_step_success(){
  const d=new D(640,250,'compound_step_success');
  d.text(10,16,'INDEPENDENT 90% STEPS COMPOUND: THREE OF THEM SUCCEED 72.9% OF THE TIME',{cls:'cap',a:'start'});
  const vals=[[1,0.9],[2,0.81],[3,0.729]];
  const y0=200,H=150;
  d.line(80,y0,560,y0,{stroke:C.ink2,single:true});
  d.line(80,y0-H,560,y0-H,{stroke:C.line,dash:[4,4],single:true});
  d.text(74,y0-H,'1.0',{cls:'xs',a:'end'});d.text(74,y0,'0',{cls:'xs',a:'end'});
  vals.forEach(([n,p],i)=>{
    const x=130+i*150,h=p*H,last=i===2;
    d.rect(x,y0-h,90,h,{fill:last?C.accSoft:C.card,stroke:last?C.acc:C.ink2,r:0});
    d.mono(x+45,y0-h-12,p.toFixed(n===1?1:n===2?2:3),{size:11,color:last?C.acc:undefined});
    d.text(x+45,y0+16,`${n} step${n>1?'s':''}`,{cls:'sm'});
  });
  d.text(320,236,'0.9, 0.9², 0.9³ under an illustrative independence model; real errors correlate',{cls:'sm'});
  return d.svg();
}

export function finetune_goal_map(){
  const d=new D(640,300,'finetune_goal_map');
  d.text(10,16,'EACH OBSERVED FAILURE NAMES THE DATA THAT COULD FIX IT',{cls:'cap',a:'start'});
  d.text(130,44,'failure seen in transcripts',{cls:'ttl'});
  d.text(470,44,'demonstrations to collect',{cls:'ttl'});
  const rows=[
    ['call lacks closing boundary','correctly serialized calls'],
    ['right tool, quantity 4','values tied to the request (3)'],
    ['reserves when asked to explain','contrast cases, including no tool'],
    ['reserves 13 of 12 available','read, then refuse or report failure'],
    ['final answer omits remaining 9','final reports grounded in the receipt'],
  ];
  rows.forEach(([a,b],i)=>{
    const y=62+i*44,acc=i===1;
    d.box(20,y,220,32,a,{fill:C.card,stroke:C.ink2,size:10.5});
    d.arrow(246,y+16,352,y+16,{stroke:acc?C.acc:C.gray});
    d.box(358,y,262,32,b,{fill:acc?C.accSoft:C.card,stroke:acc?C.acc:C.ink2,size:10.5});
  });
  d.text(320,288,'illustrative stockroom failures; one vague goal "better tool use" names none of these',{cls:'sm'});
  return d.svg();
}
