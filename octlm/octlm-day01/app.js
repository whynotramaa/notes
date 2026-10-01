/* All numbers are small teaching examples. No trained model or tokenizer is loaded. */
'use strict';
const words = ['the', 'cat', 'sat', 'it'];
const toyX = [[1,.1,.3,-.1],[.8,.2,.5,0],[.1,.9,-.2,.4],[.4,.4,.1,.6]];
const projection = {
  q: [[1,.1,.3,0],[.2,.9,0,.3],[.1,0,.8,.2],[0,.2,.1,1]],
  k: [[.8,0,.2,.1],[.1,1,.3,0],[.3,.2,.7,.1],[0,.1,.2,.9]],
  v: [[.7,.2,0,.1],[.1,.8,.2,0],[.2,0,.9,.3],[0,.3,.1,.8]],
  o: [[.8,.1,.2,0],[.1,.8,0,.2],[.2,0,.8,.1],[0,.2,.1,.8]]
};
const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
const matmul = (a,b) => a.map(row=>b[0].map((_,i)=>dot(row,b.map(r=>r[i]))));
function softmax(scores, temperature=1) {
  if (!scores.length || temperature < 0 || !Number.isFinite(temperature)) throw Error('Invalid softmax input');
  if (temperature===0) return scores.map((_,i)=>i===scores.indexOf(Math.max(...scores))?1:0);
  const max=Math.max(...scores); if(max===-Infinity) throw Error('Every score is masked');
  const weights=scores.map(s=>Math.exp((s-max)/temperature));
  const total=weights.reduce((a,b)=>a+b,0); return weights.map(v=>v/total);
}
function distribution(logits, temperature, k=0) {
  if (!Number.isInteger(k) || k<0) throw Error('Invalid top-k');
  const ranked=logits.map((z,i)=>({z,i})).sort((a,b)=>b.z-a.z||a.i-b.i);
  const keep=new Set(ranked.slice(0,k||logits.length).map(x=>x.i));
  return softmax(logits.map((z,i)=>keep.has(i)?z:-Infinity),temperature);
}
function attention(x, heads=2, causal=true) {
  const Q=matmul(x,projection.q),K=matmul(x,projection.k),V=matmul(x,projection.v),width=4/heads;
  const runs=Array.from({length:heads},(_,h)=>{
    const cut=row=>row.slice(h*width,(h+1)*width), q=Q.map(cut),k=K.map(cut),v=V.map(cut);
    const scores=q.map((row,i)=>k.map((key,j)=>causal&&j>i?-Infinity:dot(row,key)/Math.sqrt(width)));
    const weights=scores.map(s=>softmax(s));return {q,k,v,scores,weights,y:matmul(weights,v)};
  });
  const concat=x.map((_,i)=>runs.flatMap(h=>h.y[i]));
  return {runs,concat,out:matmul(concat,projection.o)};
}
function kind(c){return /\s/u.test(c)?'space':/[\p{L}\p{M}_]/u.test(c)?'word':/\p{N}/u.test(c)?'number':'symbol';}
function chunks(text) {
  const result=[]; for(const c of text){const last=result.at(-1);if(last&&last.kind===kind(c))last.text+=c;else result.push({kind:kind(c),text:c});} return result;
}
const encoder=new TextEncoder();
function trainBPE(text, limit=12) {
  let sequences=chunks(text).map(c=>Array.from(encoder.encode(c.text)));
  const vocabulary=Array.from({length:256},(_,i)=>[i]), merges=[], snapshots=[sequences.map(s=>s.slice())];
  for(let step=0;step<limit;step++){
    const counts=new Map();for(const sequence of sequences)for(let i=0;i<sequence.length-1;i++){const key=sequence[i]+','+sequence[i+1];counts.set(key,(counts.get(key)||0)+1);}
    const sorted=Array.from(counts,([key,count])=>({pair:key.split(',').map(Number),count})).sort((a,b)=>b.count-a.count||a.pair[0]-b.pair[0]||a.pair[1]-b.pair[1]);
    if(!sorted.length||sorted[0].count<2)break;
    const best=sorted[0],id=261+merges.length;vocabulary[id]=[...vocabulary[best.pair[0]],...vocabulary[best.pair[1]]];
    sequences=sequences.map(s=>{const out=[];for(let i=0;i<s.length;i++){if(s[i]===best.pair[0]&&s[i+1]===best.pair[1]){out.push(id);i++;}else out.push(s[i]);}return out;});
    merges.push({...best,id});snapshots.push(sequences.map(s=>s.slice()));
  }
  return {vocabulary,merges,snapshots};
}
const bpeCorpus='banana banana banana bandana bandana';
const bpe=trainBPE(bpeCorpus,12);
const decodeBytes=ids=>new TextDecoder().decode(Uint8Array.from(ids));
const visible=s=>s.replace(/ /g,'␠').replace(/\n/g,'↵').replace(/\t/g,'⇥');
const characterVocab=Array.from(new Set(Array.from('the cat sat on a mat. hello world banana return x_1 = 30'))).sort();
const positionRows=[[0,.1,0,.2],[.2,0,.1,-.1],[.1,.3,-.1,0],[-.1,.2,.2,.1]];
const sinusoid=(pos,width=4)=>Array.from({length:width},(_,i)=>i%2?Math.cos(pos/10000**((i-1)/width)):Math.sin(pos/10000**(i/width)));
const fmt=n=>n===-Infinity?'−∞':Math.abs(n)<.0005?'0':n.toFixed(2);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const box=(x,y,w,h)=>`M${x} ${y} ${x+w} ${y-1} ${x+w+1} ${y+h} ${x-1} ${y+h+1}Z`;
const circle=(x,y,r)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${r*2} 0a${r} ${r} 0 1 0 ${-r*2} 0`;
const arrow=(x,y,u,v)=>{const a=Math.atan2(v-y,u-x),head=d=>`${(u-8*Math.cos(a+d)).toFixed(1)} ${(v-8*Math.sin(a+d)).toFixed(1)}`;return `M${x} ${y}Q${(x+u)/2} ${(y+v)/2-2} ${u} ${v}M${head(.5)} ${u} ${v} ${head(-.5)}`;};
const blobs=[
 'M35 128C28 70 92 32 177 45S322 29 363 97 329 207 219 208 44 202 35 128Z',
 'M48 95C64 38 136 57 205 36S350 51 355 128 282 215 177 208 30 153 48 95Z',
 'M43 153C26 96 105 35 187 46S340 40 361 117 302 211 207 209 59 218 43 153Z',
 'M36 121C46 64 101 33 194 48S330 38 360 111 319 204 232 213 28 197 36 121Z'
];
function drawing(){return {paper:[],accent:[],ink:[],labels:[],effects:[],blob:blobs[0]};}
function P(d,path,cls=''){d.ink.push({path,cls});}
function F(d,path,cls='paper'){d[cls==='accent'?'accent':'paper'].push({path,cls});}
function T(d,x,y,text,size=20,font='hand',cls='',angle=0){d.labels.push({x,y,text,size,font,cls,angle});}
function textGrid(d,entries,size=12,font='mono',cls=''){d.labels.push({entries,size,font,cls});}
function node(d,x,y,w,h,text,accent=false){const path=box(x,y,w,h);F(d,path,accent?'accent':'paper');P(d,path);return {x:x+w/2,y:y+h/2,text};}
function nodes(d,items){textGrid(d,items.map(n=>({x:n.x,y:n.y+5,t:n.text})),18,'hand');}
function flow(d,path,duration=4,delay=0){d.effects.push({path,duration,delay});}
function ground(d){P(d,'M30 216C110 211 281 221 370 215','sk-guide');P(d,'M345 37 351 26M352 48 365 44M355 56 363 65');}
function tokens(d,values,y=130,accent=0,limit=8){const shown=values.slice(0,limit),width=Math.min(72,320/Math.max(shown.length,1)),start=200-shown.length*width/2;const ns=shown.map((v,i)=>node(d,start+i*width,y,width-6,34,String(v),i===accent));nodes(d,ns);return ns;}
function matrix(d,values,x=100,y=65,w=200,h=120,highlight=-1,mask=false){
  const rows=values.length,cols=values[0].length,cw=w/cols,ch=h/rows;F(d,box(x,y,w,h));P(d,box(x,y,w,h));
  let grid='',fill='',masked='';const entries=[];
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
    const cell=box(x+j*cw+2,y+i*ch+2,cw-4,ch-4);if(values[i][j]===-Infinity){masked+=`M${x+j*cw+6} ${y+i*ch+6}l${cw-12} ${ch-12}M${x+(j+1)*cw-6} ${y+i*ch+6}l${12-cw} ${ch-12}`;}else if(i===highlight||Number(values[i][j])>.45)fill+=cell;
    entries.push({x:x+(j+.5)*cw,y:y+(i+.5)*ch+4,t:typeof values[i][j]==='number'?fmt(values[i][j]):values[i][j]});
  }
  for(let i=1;i<rows;i++)grid+=`M${x} ${y+i*ch}Q${x+w/2} ${y+i*ch-1} ${x+w} ${y+i*ch}`;
  for(let j=1;j<cols;j++)grid+=`M${x+j*cw} ${y}Q${x+j*cw-1} ${y+h/2} ${x+j*cw} ${y+h}`;
  if(fill)F(d,fill,'accent');if(grid)P(d,grid,'sk-guide');if(masked)P(d,masked,mask?'sk-emphasis':'sk-guide');textGrid(d,entries,cols>4?10:12);
}
function bars(d,values,labels,{x=68,y=175,w=270,h=105,prob=true,highlight=-1}={}){
  const bw=w/values.length,max=prob?1:Math.max(...values.map(Math.abs),1), entries=[];let fills='',outlines='';
  values.forEach((v,i)=>{const height=Math.max(2,Math.abs(v)/max*h),path=box(x+i*bw+6,y-height,bw-14,height);if(i===highlight||highlight<0)fills+=path;else F(d,path);outlines+=path;entries.push({x:x+(i+.5)*bw,y:y+20,t:labels[i]});entries.push({x:x+(i+.5)*bw,y:y-height-9,t:prob?(v*100).toFixed(0)+'%':fmt(v)});});
  F(d,fills,'accent');P(d,outlines);P(d,`M${x-7} ${y+2}Q${x+w/2} ${y-1} ${x+w+4} ${y+1}`);textGrid(d,entries,12);
}
const state={text:'the cat sat',char:'é',merge:0,token:1,position:1,posMode:'learned',query:3,mask:true,q:1,head:0,block:0,temperature:1,k:0,seed:7,generated:[],lastPick:null,counts:[0,0,0,0],paused:false};
const candidates=[' cat',' dog',' bird',' fish'],logits=[2.4,1.8,.6,-.4];
const chapters=[
 {id:'tokenization',title:'Tokenization',sub:'Text becomes pieces. Pieces become integer IDs.',aside:'one character,\none little ticket',source:'character-tokenizer',h:85,
 cards:[
  ['Text arrives','Whitespace and punctuation are part of the text.',()=>{const d=drawing();const n=node(d,61,75,280,56,state.text.slice(0,22)||'type something',true);nodes(d,[n]);P(d,arrow(90,151,174,151));P(d,arrow(220,151,304,151));T(d,200,185,'keep every mark',22,'hand','',-4);P(d,'M66 54 60 41M77 50 78 36M87 53 95 43');flow(d,'M50 100H340',5);ground(d);return d;}],
  ['Character-level split','One Unicode code point becomes one token.',()=>{const d=drawing(), chars=Array.from(state.text);tokens(d,chars.map(visible),118,0,10);T(d,200,65,`${chars.length} characters → ${chars.length} tokens`,21);P(d,'M75 91C136 73 266 74 324 89');P(d,'M75 91 81 80M324 89 315 79');T(d,200,187,'small vocabulary, long sequence',18,'hand','',-3);ground(d);return d;}],
  ['Look up the IDs','The vocabulary is fixed after training.',()=>{const d=drawing(),chars=Array.from(state.text).slice(0,5);const shown=chars.length?chars:['t'];const ns=tokens(d,shown.map(visible),69,0,5);const ids=tokens(d,shown.map(c=>{const i=characterVocab.indexOf(c);return i<0?'unk':i+4;}),152,0,5);ns.forEach((n,i)=>P(d,arrow(n.x,n.y+20,ids[i].x,ids[i].y-24)));T(d,200,128,'same piece → same ID',18);ground(d);return d;}],
  ['Unknown characters','An unseen character becomes <unk>; the original is lost.',()=>{const d=drawing();const a=node(d,60,92,76,46,'猫');const b=node(d,253,91,105,47,'<unk>',true);nodes(d,[a,b]);P(d,arrow(149,115,238,115));T(d,197,76,'not in our table',20,'hand','',-6);T(d,207,181,'no way back',24,'hand','sk-tint',4);P(d,'M166 145 232 188M231 148 168 190','sk-emphasis');ground(d);return d;}]
 ]},
 {id:'byte-bpe',title:'Byte-level BPE',sub:'Start with bytes. Learn frequent pairs. Replay those merges to encode.',aside:'merge by merge,\nno guessing',source:'byte-level-bpe',h:150,
 cards:[
  ['UTF-8 first','A character can occupy one to four bytes.',()=>{const d=drawing(),c=Array.from(state.char||'é')[0],bytes=Array.from(encoder.encode(c));nodes(d,[node(d,162,47,76,42,c,true)]);const ns=tokens(d,bytes,146,0,4);ns.forEach(n=>P(d,arrow(200,100,n.x,n.y-24)));T(d,200,120,`${bytes.length} UTF-8 byte${bytes.length===1?'':'s'}`,18);T(d,200,207,'256 base bytes cover every text',17);return d;}],
  ['Respect chunk edges','Octlm separates whitespace, words, numbers, and symbols.',()=>{const d=drawing();tokens(d,['x_','1','␠','=','␠','30'],111,0,6);P(d,'M108 75 107 165M160 76 161 164M210 75 209 163M260 76 259 164M312 75 311 164','sk-guide');textGrid(d,[{x:64,y:182,t:'word'},{x:123,y:182,t:'num'},{x:177,y:182,t:'space'},{x:230,y:182,t:'symbol'},{x:285,y:182,t:'space'},{x:338,y:182,t:'num'}],10);T(d,200,56,'merges stay inside each chunk',20);ground(d);return d;}],
  ['Train the merges','Choose the most frequent adjacent pair; recount, then repeat.',()=>{const d=drawing(),step=Math.max(0,state.merge-1),m=bpe.merges[step];const a=visible(decodeBytes(bpe.vocabulary[m.pair[0]])),b=visible(decodeBytes(bpe.vocabulary[m.pair[1]])),joined=visible(decodeBytes(bpe.vocabulary[m.id]));nodes(d,[node(d,61,61,90,38,a),node(d,246,60,90,38,b),node(d,148,152,110,42,joined,true)]);P(d,arrow(105,111,175,146));P(d,arrow(292,111,233,146));T(d,200,86,'+',25);T(d,200,128,`pair count ${m.count} · new ID ${m.id}`,12,'mono');ground(d);return d;}],
  ['The sequence shrinks','Encoding uses learned merge rank, not new pair counts.',()=>{const d=drawing(),seq=bpe.snapshots[state.merge].flat();const first=bpe.snapshots[state.merge][0].map(id=>visible(decodeBytes(bpe.vocabulary[id])));tokens(d,first,108,Math.min(1,first.length-1),7);T(d,200,55,`banana · after ${state.merge} merges`,22);T(d,200,182,`${encoder.encode(bpeCorpus).length} bytes → ${seq.length} tokens`,13,'mono');P(d,'M62 154C110 153 158 158 205 156S287 155 340 152');T(d,200,210,'same bytes, fewer positions',18);return d;}]
 ]},
 {id:'embeddings',title:'Token embeddings',sub:'An ID selects a learned row. The model works with the row’s numbers.',aside:'an address,\nnot a meaning',source:'embeddings-and-positions',h:195,
 cards:[
  ['ID → row','The integer is an index, not a magnitude.',()=>{const d=drawing();nodes(d,[node(d,37,94,63,42,String(state.token),true)]);P(d,arrow(110,115,153,115));matrix(d,toyX,167,57,179,132,state.token);T(d,73,68,words[state.token],21,'hand','',-5);T(d,256,213,'toy embedding table · 4 × 4',12,'mono');ground(d);return d;}],
  ['One token, four features','Real Day 01 rows have 128 features; this toy has four.',()=>{const d=drawing();tokens(d,toyX[state.token].map(fmt),116,1,4);T(d,200,61,`E[${state.token}] = vector for “${words[state.token]}”`,21);P(d,'M53 103 53 168M347 103 347 168M53 103 66 103M347 103 334 103M53 168 66 168M347 168 334 168');T(d,200,193,'features are learned, not named by hand',18);ground(d);return d;}],
  ['Same ID, same starting row','Context changes later in the Transformer, not in the lookup.',()=>{const d=drawing();const ns=[node(d,46,53,105,35,'cat',true),node(d,250,53,105,35,'cat',true),node(d,54,151,290,39,toyX[1].map(fmt).join('  '))];nodes(d,ns);P(d,arrow(101,99,151,139));P(d,arrow(302,99,249,139));T(d,201,123,'one shared row',23,'hand','',-3);ground(d);return d;}],
  ['Training moves rows','A tiny coordinate picture is illustrative, not a measured embedding plot.',()=>{const d=drawing();P(d,'M59 184Q181 179 337 183M61 184Q64 126 63 57');F(d,circle(130,126,9),'accent');F(d,circle(186,106,9),'accent');F(d,circle(275,158,9));P(d,circle(130,126,9));P(d,circle(186,106,9));P(d,circle(275,158,9));P(d,arrow(90,158,118,134));P(d,arrow(230, 70,194,100));textGrid(d,[{x:119,y:103,t:'cat'},{x:197,y:86,t:'dog'},{x:291,y:143,t:'+'}],19,'hand');T(d,200,215,'gradients change the lookup table',20);flow(d,'M90 158Q110 151 130 126',4);return d;}]
 ]},
 {id:'positions',title:'Positional embeddings',sub:'Token identity says what. Position tells the model where.',aside:'same word,\ndifferent seat',source:'embeddings-and-positions',h:250,
 cards:[
  ['Order matters','These contain the same words, but describe different events.',()=>{const d=drawing();tokens(d,['dog','bites','man'],70,0,3);tokens(d,['man','bites','dog'],153,2,3);P(d,arrow(86,123,314,123));T(d,200,48,'who bit whom?',23,'hand','',-3);T(d,200,211,'identity alone is not enough',19);ground(d);return d;}],
  ['A row for each position','Use learned rows or fixed sinusoidal rows for absolute positions.',()=>{const d=drawing();matrix(d,state.posMode==='learned'?positionRows:positionRows.map((_,i)=>sinusoid(i)),131,56,205,134,state.position);nodes(d,[node(d,32,104,64,37,'p'+state.position,true)]);P(d,arrow(100,123,123,123));T(d,242,216,'P[position] · toy 4 × 4',12,'mono');ground(d);return d;}],
  ['Add the two signals','Addition preserves vector width. It does not concatenate.',()=>{const d=drawing(),p=state.posMode==='learned'?positionRows[state.position]:sinusoid(state.position),e=toyX[1],sum=e.map((v,i)=>v+p[i]);const rows=[{v:e,y:61,t:'E[cat]'},{v:p,y:107,t:'P['+state.position+']'},{v:sum,y:160,t:'x'}];rows.forEach(r=>{F(d,box(114,r.y-16,225,30),r.t==='x'?'accent':'paper');P(d,box(114,r.y-16,225,30));});textGrid(d,rows.flatMap(r=>[{x:71,y:r.y+4,t:r.t},...r.v.map((v,i)=>({x:143+i*55,y:r.y+4,t:fmt(v)}))]),12);P(d,'M103 141Q231 140 349 141');T(d,75,140,'+',22);T(d,217,210,'x = token row + position row',19);return d;}],
  ['Fixed waves are another option','Sin/cos pairs use different frequencies. RoPE is a later design.',()=>{const d=drawing();P(d,'M47 124H357M48 176H357','sk-guide');for(let i=0;i<2;i++){let path='';for(let t=0;t<=100;t++){const x=50+t*3,y=100+i*60-Math.sin(t/(i?18:6))*22;path+=(t?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}P(d,path);}F(d,box(50+state.position*70,62,12,125),'accent');T(d,195,43,'fast + slow clocks',23,'hand','',-3);T(d,200,214,'sin(pos / 10000^(2i / d))',12,'mono');flow(d,'M50 100H350',5);return d;}]
 ]},
 {id:'attention',title:'Attention',sub:'Each position asks a question, scores keys, and mixes values.',aside:'ask · match · read',source:'causal-attention',h:300,
 cards:[
  ['Tokens can read each other','The query token chooses a weighted mixture of visible positions.',()=>{const d=drawing();const ns=tokens(d,words,153,state.query,4);const q=node(d,152,45,96,38,words[state.query],true);nodes(d,[q]);const weights=attention(toyX,2,true).runs[0].weights[state.query];ns.forEach((n,i)=>{if(i<=state.query){P(d,arrow(200,94,n.x,n.y-24));flow(d,`M${n.x} ${n.y-25}Q${n.x} 100 200 84`,3.2+i*.3);}});T(d,200,125,'read the past + itself',20);T(d,200,214,weights.map(v=>v.toFixed(2)).join('   '),12,'mono');return d;}],
  ['Three learned projections','Q, K, and V are different views of the same input.',()=>{const d=drawing();nodes(d,[node(d,165,35, 70,36,'x',true)]);const ns=[node(d,54,141,74,40,'Q'),node(d,165,141,74,40,'K'),node(d,276,141,74,40,'V')];nodes(d,ns);ns.forEach(n=>P(d,arrow(200,83,n.x,n.y-25)));textGrid(d,[{x:92,y:204,t:'ask'},{x:202,y:204,t:'match'},{x:313,y:204,t:'read'}],20,'hand');T(d,202,118,'WQ       WK       WV',12,'mono');ground(d);return d;}],
  ['Compare Q with K','Dot products produce scores, not probabilities.',()=>{const d=drawing(),run=attention(toyX,2,true).runs[0],q=run.q[state.query],keys=run.k.slice(0,state.query+1);bars(d,keys.map(k=>dot(q,k)),words.slice(0,keys.length),{prob:false,y:177,h:85});T(d,200,49,'q · k → compatibility',23,'hand','',-3);T(d,200, 80,`q = [${q.map(fmt).join(', ')}]`,12,'mono');ground(d);return d;}],
  ['Read the V vectors','Keys choose the weights. Values supply the information.',()=>{const d=drawing(),run=attention(toyX,2,true).runs[0],w=run.weights[state.query],y=run.y[state.query];tokens(d,w.map(n=>n.toFixed(2)),69,state.query,4);P(d,arrow(99,121,169,157));P(d,arrow(297,121,230,157));nodes(d,[node(d,137,164,126,36,y.map(fmt).join('  '),true)]);T(d,200,133,'Σ weight × value',22);T(d,200,219,'a contextual vector, not a chosen word',18);ground(d);return d;}]
 ]},
 {id:'causal-mask',title:'Causal masking',sub:'A position can see itself and its past. The future stays hidden.',aside:'no peeking\nat the answer',source:'causal-attention',h:85,
 cards:[
  ['The visibility triangle','Rows are queries. Columns are keys. The diagonal is allowed.',()=>{const d=drawing(),a=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>state.mask&&j>i?-Infinity:1));matrix(d,a,106,61,196,132,state.query,true);T(d,200,42,'keys →',18);T(d, 50,136,'Q',22);T(d,205,219,state.mask?'future = blocked':'mask off = future visible',20);return d;}],
  ['Mask before softmax','Add −∞ to future scores; their probability becomes exactly zero.',()=>{const d=drawing(),run=attention(toyX,2,state.mask).runs[0];tokens(d,run.scores[state.query].map(fmt),63,state.query,4);P(d,arrow(200,111,200,142));tokens(d,run.weights[state.query].map(v=>(100*v).toFixed(0)+'%'),158,state.query,4);T(d,200,132,'softmax',21);T(d,200,215,'exp(−∞) = 0',13,'mono');ground(d);return d;}],
  ['Parallel training, shifted targets','At position t, predict token t+1 without reading it.',()=>{const d=drawing();const ns=tokens(d,['the','cat','sat'],62,state.query%3,3),targets=tokens(d,['cat','sat','<eos>'],155,state.query%3,3);ns.forEach((n,i)=>P(d,arrow(n.x,111,targets[i].x,145)));T(d,200, 40,'inputs',19);T(d,200,135,'next token at every position',18);T(d,200,215,'all predictions in one forward pass',18);ground(d);return d;}],
  ['Change the future','With a causal mask, earlier attention outputs stay unchanged.',()=>{const d=drawing(),x=toyX.map(r=>r.slice());x[3]=x[3].map(v=>v+2);const before=attention(toyX,2,state.mask).out,after=attention(x,2,state.mask).out,delta=before.map((r,i)=>Math.max(...r.map((v,j)=>Math.abs(v-after[i][j]))));bars(d,delta,words,{prob:false,h:100,y:178,highlight:3});T(d,200,47,'edit only the last input',23);T(d,200,214,state.mask?'earlier rows: exact zero change':'future leaked into earlier rows',18);ground(d);return d;}]
 ]},
 {id:'single-head',title:'Single-head attention',sub:'One set of weights per query. One mixture of value vectors.',aside:'one question,\none weighted mix',source:'causal-attention',h:195,
 cards:[
  ['Project into one head','The toy uses two features per Q, K, and V vector.',()=>{const d=drawing();const r=singleRun();matrix(d,r.q,61, 70,74,112,state.query);matrix(d,r.k,162,70,74,112,state.query);matrix(d,r.v,263,70,74,112,state.query);textGrid(d,[{x:99,y:51,t:'Q'},{x:200,y:51,t:'K'},{x:301,y:51,t:'V'}],22,'hand');T(d,200,215,'4 positions × 2 features',12,'mono');ground(d);return d;}],
  ['Score and scale','Divide by √dₖ to control the size of dot-product scores.',()=>{const d=drawing(),r=singleRun();bars(d,r.scores[state.query].map(z=>z===-Infinity?0:z),words,{prob:false,y:177,h:85,highlight:state.query});T(d,200,43,'QKᵀ / √2',28,'hand','',-3);T(d,200, 70,'masked future bars are omitted',11,'mono');ground(d);return d;}],
  ['Normalize each row','Softmax is over key positions, separately for every query.',()=>{const d=drawing(),r=singleRun();matrix(d,r.weights,100,61,200,133,state.query);T(d,200,40,'A = softmax(scores + mask)',21);T(d,200,219,'each row sums to 1',21);ground(d);return d;}],
  ['Mix the values','The attention output is AV. It is still a vector.',()=>{const d=drawing(),r=singleRun(),i=state.query;tokens(d,r.weights[i].map(v=>v.toFixed(2)),63,i,4);nodes(d,[node(d,133,166,136,36,r.y[i].map(fmt).join('  '),true)]);P(d,arrow(91,113,167,151));P(d,arrow(305,113,236,151));T(d,200,136,'weighted sum of V',21);T(d,200,219,'one mixture → two output features',17);flow(d,'M91 113Q170 126 200 164',4);return d;}]
 ]},
 {id:'multi-head',title:'Multi-head attention',sub:'Different learned projections produce several mixtures in parallel.',aside:'more than one\nway to listen',source:'causal-attention',h:300,
 cards:[
  ['Same input, different heads','Each head uses its own learned Q, K, and V projections.',()=>{const d=drawing();nodes(d,[node(d,158,38,85,38,'X',true),node(d, 60,146,113,40,'head 1'),node(d,228,146,113,40,'head 2')]);P(d,arrow(186, 90,119,135));P(d,arrow(216,90,282,135));T(d,200,116,'parallel projections',20);T(d,200,217,'toy: width 4 / 2 heads = 2 features',11,'mono');flow(d,'M186  90Q160 113 119 146',3.4);return d;}],
  ['Independent attention maps','Heads can learn different relationships; roles are not hard-coded.',()=>{const d=drawing(),runs=attention(toyX,2,true).runs;matrix(d,runs[0].weights, 40,70,144,111,state.query);matrix(d,runs[1].weights,217,70,144,111,state.query);textGrid(d,[{x:111,y:48,t:'head 1'},{x:289,y:48,t:'head 2'}],20,'hand');T(d,200,215,'two distributions for the same query',18);ground(d);return d;}],
  ['Concatenate the outputs','Head outputs join along the feature dimension.',()=>{const d=drawing(),r=attention(toyX,2,true),i=state.query;nodes(d,[node(d, 50,62,127,36,r.runs[0].y[i].map(fmt).join('  ')),node(d,224,62,127,36,r.runs[1].y[i].map(fmt).join('  '))]);tokens(d,r.concat[i].map(fmt),167,state.head*2,4);P(d,arrow(114,109,141,150));P(d,arrow(290,109,259,150));T(d,200,131,'concat, not average',22);T(d,200,221,'2 + 2 features = width 4',12,'mono');return d;}],
  ['Output projection','Wᴼ mixes the joined features back to model width.',()=>{const d=drawing(),r=attention(toyX,2,true);tokens(d,r.concat[state.query].map(fmt),58,state.head*2,4);nodes(d,[node(d,166,116,70,37,'Wᴼ',true)]);P(d,arrow(200,102,200,108));P(d,arrow(200,163,200,175));tokens(d,r.out[state.query].map(fmt),188,0,4);T(d, 90,141,'mix',22,'hand','',-5);ground(d);return d;}]
 ]},
 {id:'decoder',title:'The decoder block',sub:'Attention shares information. The feed-forward layer processes each position.',aside:'attention is\nonly one part',source:'baseline-block',h:150,
 cards:[
  ['Pre-norm + attention','Normalize, attend, then add the branch back to the residual stream.',()=>{const d=drawing();nodes(d,[node(d, 40,97, 60,38,'x'),node(d,129,96, 70,40,'norm'),node(d,233,95,104,42,'attend',true)]);P(d,arrow(106,115,120,115));P(d,arrow(205,115,225,115));P(d,'M 70 90V51Q186 43 345 51V116');P(d,arrow(337,117,365,117));T(d,350,149,'+',26);T(d,200,190,'x ← x + attention(norm(x))',17);ground(d);return d;}],
  ['Expand, activate, shrink','The Day 01 MLP is 128 → 512 → 128 with GELU.',()=>{const d=drawing();nodes(d,[node(d,42, 90, 70,40,'128'),node(d,155, 60, 90,102,'512',true),node(d,290,90, 70,40,'128')]);P(d,arrow(120,111,145,111));P(d,arrow(254,111,282,111));T(d,200, 40,'GELU in the middle',22);T(d,200,205,'the same network at every position',19);flow(d,'M42 111H359',4.6);ground(d);return d;}],
  ['Stack the blocks','Two baseline blocks preserve [batch, time, 128] throughout.',()=>{const d=drawing();const ns=[node(d, 50,111,76,38,'E + P'),node(d,158,110,83,40,'block 1',state.block===0),node(d,272,109,83,42,'block 2',state.block===1)];nodes(d,ns);P(d,arrow(134,130,150,130));P(d,arrow(249,130,263,130));T(d,200, 70,'same width all the way',23,'hand','',-3);T(d,200,190,'each block: attention + MLP + residuals',16);ground(d);return d;}],
  ['The tied output head','Final norm, then hEᵀ gives one logit per vocabulary entry.',()=>{const d=drawing();nodes(d,[node(d, 40,92, 70,44,'h'),node(d,157,90, 90,48,'Eᵀ',true),node(d,294, 90, 70,46,'z')]);P(d,arrow(117,114,148,114));P(d,arrow(255,114,285,114));T(d,200,54,'reuse the token table',22,'hand','',-4);T(d,200,187,'128 features → 1,024 token scores',12,'mono');T(d,200,217,'take the last position for generation',18);ground(d);return d;}]
 ]},
 {id:'softmax',title:'Softmax & probability',sub:'Scores become positive weights that sum to one.',aside:'scores ≠\nprobabilities',source:'next-token-prediction',h:250,
 cards:[
  ['Vocabulary logits','The output head produces unnormalized scores.',()=>{const d=drawing();bars(d,logits,candidates.map(s=>s.trim()),{prob:false,y:179,h:95,highlight:0});T(d,200,49,'z = hEᵀ',26);T(d,200,215,'negative logits are allowed',18);ground(d);return d;}],
  ['Exponentiate, then divide','A shared denominator normalizes the weights.',()=>{const d=drawing(),p=distribution(logits,state.temperature,state.k);const temp=state.temperature===0?'greedy':state.temperature.toFixed(2);tokens(d,p.map(v=>(100*v).toFixed(0)+'%'),147,0,4);T(d,200,55,'pᵢ = exp(zᵢ / τ) / Σ exp(zⱼ / τ)',18);P(d,arrow(200, 90,200,126));T(d,200,207,`τ = ${temp} · total = ${p.reduce((a,b)=>a+b,0).toFixed(2)}`,12,'mono');ground(d);return d;}],
  ['Temperature reshapes it','Lower τ sharpens; higher τ spreads. Zero uses argmax.',()=>{const d=drawing(),p=distribution(logits,state.temperature,state.k);bars(d,p,candidates.map(s=>s.trim()),{y:177,h:102,highlight:-1});T(d,200, 40,state.temperature===0?'τ = 0 → greedy':`τ = ${state.temperature.toFixed(2)}`,25,'hand','',-4);T(d,200,216,state.k?`top-k ${state.k} → renormalize kept tokens`:'same logits, different confidence',18);ground(d);return d;}],
  ['Two softmax axes','Attention normalizes positions. The output normalizes vocabulary tokens.',()=>{const d=drawing();nodes(d,[node(d, 50,85,124,55,'positions',true),node(d,224,85,124,55,'vocabulary')]);P(d,'M198  50Q202 125 199 200','sk-guide');T(d,111, 60,'inside attention',18);T(d,287,60,'at the output',18);textGrid(d,[{x:111,y:168,t:'read which input?'},{x:287,y:168,t:'predict which token?'}],11);T(d,200,214,'different axes, same normalization',18);ground(d);return d;}]
 ]},
 {id:'next-token',title:'Choose the next token',sub:'Pick an ID, append it, and run the decoder again.',aside:'one token.\nthen another.',source:'sampling',h:85,
 cards:[
  ['Greedy or a weighted draw','Greedy takes argmax. Sampling can select a less likely token.',()=>{const d=drawing(),p=distribution(logits,state.temperature,state.k);bars(d,p,candidates.map(s=>s.trim()),{y:177,h:100,highlight:state.lastPick??0});T(d,200,43,state.lastPick===null?'press “Draw token”':`selected: “${candidates[state.lastPick].trim()}”`,24,'hand','',-3);T(d,200,216,'a draw follows probabilities, not rank',18);ground(d);return d;}],
  ['The probability ribbon','Each interval owns its share of a uniform random draw.',()=>{const d=drawing(),p=distribution(logits,state.temperature,state.k);let offset= 50;let segments='',entries=[];p.forEach((v,i)=>{if(v>0){const w=v*300;const path=box(offset,103,w,40);F(d,path,i===(state.lastPick??0)?'accent':'paper');segments+=path;entries.push({x:offset+w/2,y:131,t:v>.08?candidates[i].trim():''});offset+=w;}});P(d,segments);textGrid(d,entries,17,'hand');T(d, 50,173,'0',12,'mono');T(d,350,173,'1',12,'mono');T(d,200,62,state.drawValue!==undefined?`u = ${state.drawValue.toFixed(3)}`:'draw u uniformly in [0, 1)',21);if(state.drawValue!==undefined){const x=50+state.drawValue*300;P(d,arrow(x, 80,x,96),'sk-emphasis');}T(d,200,215,'larger interval → more likely, not certain',18);ground(d);return d;}],
  ['Append, decode, repeat','This storyboard uses fixed toy logits; real logits change with context.',()=>{const d=drawing();const text='the'+state.generated.join('');nodes(d,[node(d, 40, 60,320,43,text.slice(-30),true)]);nodes(d,[node(d, 70,153,102,39,'decoder'),node(d,238,153, 90,39,'next ID')]);P(d,arrow(175, 90,130,139));P(d,arrow(180,174,231,174));P(d,'M334 171Q374 132 340 109');P(d,'M340 109 353 109M340 109 348 122');T(d,200,130,'feed the new token back',20);ground(d);flow(d,'M328 171Q377 120 333 109',4);return d;}],
  ['Many draws resemble the distribution','Finite samples fluctuate. Reset the seed to replay them.',()=>{const d=drawing(),total=state.counts.reduce((a,b)=>a+b,0);bars(d,state.counts.map(n=>total?n/total:0),candidates.map(s=>s.trim()),{y:177,h:100});T(d,200,43,`${total} draws so far`,23);T(d,200,216,total?'observed shares ≠ exact probabilities':'draw some tokens to fill the bars',18);ground(d);return d;}]
 ]}
];


function singleRun(){const run=attention(toyX,2,true).runs[0],q=run.q.map(r=>r.slice());q[state.query][0]=state.q;const scores=q.map((row,i)=>run.k.map((k,j)=>j>i?-Infinity:dot(row,k)/Math.sqrt(2))),weights=scores.map(row=>softmax(row));return {...run,q,scores,weights,y:matmul(weights,run.v)};}
function random(){state.seed=(Math.imul(state.seed,1664525)+1013904223)>>>0;return state.seed/4294967296;}
function drawToken(greedy=false){const p=distribution(logits,greedy?0:state.temperature,state.k),u=random();let cumulative=0,index=p.length-1;for(let i=0;i<p.length;i++){cumulative+=p[i];if(u<cumulative){index=i;break;}}state.drawValue=greedy?undefined:u;state.lastPick=index;state.counts[index]++;if(state.generated.length<12)state.generated.push(candidates[index]);updateDrawings(true);}
function svg(d,id,panel){
  d.blob=blobs[panel%4]; const paths=(list,cls)=>list.map(o=>`<path class="sk-${o.cls||cls}" d="${o.path}"/>`).join('');
  const labels=d.labels.map(l=>{const cls=`sk-label sk-${l.font} ${l.cls}`;if(l.entries)return `<text class="${cls}" text-anchor="middle" font-size="${l.size}">${l.entries.map(e=>`<tspan x="${e.x}" y="${e.y}">${esc(e.t)}</tspan>`).join('')}</text>`;return `<text class="${cls}" x="${l.x}" y="${l.y}" text-anchor="middle" font-size="${l.size}"${l.angle?` transform="rotate(${l.angle} ${l.x} ${l.y})"`:''}>${esc(l.text)}</text>`;}).join('');
  return `<svg class="sketch" viewBox="0 0 400 240" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(chapters[current].cards[panel][0])}</title><desc id="${id}-desc">${esc(chapters[current].cards[panel][1])}</desc><defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="${current*4+panel+1}"><animate class="boil" attributeName="seed" values="1;4;7;10" dur=".6s" calcMode="discrete" repeatCount="indefinite" begin="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="3.1"/></filter></defs><path class="sk-blob" d="${d.blob}"/><g filter="url(#${id})">${paths(d.paper,'paper')}${paths(d.accent,'accent')}${d.ink.map((p,i)=>`<path class="sk-ink ${p.cls}" d="${p.path}" pathLength="1" style="--k:${i}"/>`).join('')}${labels}${d.effects.map((e,i)=>`<g class="moving"><path class="flow-dot" d="${circle(0,0,4)}"><animateMotion dur="${e.duration}s" begin="${e.delay}s" repeatCount="indefinite" path="${e.path}"/></path></g>`).join('')}</g></svg>`;
}
let current=0,focusIndex=0,focusPlaceholder=null,focusedFigure=null;
const $=id=>document.getElementById(id);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function updateDrawings(reveal=false){
  chapters[current].cards.forEach((card,i)=>{const figure=document.querySelector(`[data-panel="${i}"]`);if(!figure)return;figure.querySelector('.art').innerHTML=svg(card[2](),`sk-${current}-${i}`,i);figure.classList.remove('reveal');if(reveal&&!state.paused&&!reduced.matches){void figure.offsetWidth;figure.classList.add('reveal');}if(state.paused||reduced.matches)figure.querySelector('svg').pauseAnimations();});
}
function control(label,html){return `<label>${label}${html}</label>`;}
function range(id,value,min,max,step=1){return `<input id="${id}" type="range" value="${value}" min="${min}" max="${max}" step="${step}"><output for="${id}" id="${id}-value">${value}</output>`;}
function queryControl(){return control('Query',`<select id="query-control">${words.map((w,i)=>`<option value="${i}"${i===state.query?' selected':''}>${i} · ${w}</option>`).join('')}</select>`);}
function samplingControls(){return control('Temperature',range('temperature',state.temperature,0,2,.1))+control('Top-k',`<select id="top-k">${[0,1,2,3,4].map(k=>`<option value="${k}"${state.k===k?' selected':''}>${k||'off'}</option>`).join('')}</select>`);}
function renderLab(){
  const id=chapters[current].id;let html='';
  if(id==='tokenization')html=control('Text',`<input id="text-control" type="text" maxlength="60" value="${esc(state.text)}" spellcheck="false">`)+`<button data-preset="the cat sat">English</button><button data-preset="x_1 = 30">Code</button><button data-preset="猫 café">Unicode</button><span class="lab-note">change the text, watch the pieces</span>`;
  if(id==='byte-bpe')html=control('Character',`<input id="byte-character" type="text" maxlength="8" value="${esc(state.char)}">`)+`<button id="merge-reset">Reset merges</button><button id="merge-next"${state.merge===bpe.merges.length?' disabled':''}>Next merge</button><span id="merge-count">${state.merge} / ${bpe.merges.length}</span><span class="lab-note">toy corpus: banana × 3, bandana × 2</span>`;
  if(id==='embeddings')html=control('Token',`<select id="token-control">${words.map((w,i)=>`<option value="${i}"${i===state.token?' selected':''}>ID ${i} · ${w}</option>`).join('')}</select>`)+`<span class="lab-note">the ID just picks the row</span>`;
  if(id==='positions')html=control('Position',range('position-control',state.position,0,3))+control('Encoding',`<select id="position-mode"><option value="learned"${state.posMode==='learned'?' selected':''}>Learned table</option><option value="sinusoidal"${state.posMode==='sinusoidal'?' selected':''}>Sin / cos</option></select>`)+`<span class="lab-note">“cat” stays the same; its seat changes</span>`;
  if(id==='attention')html=queryControl()+`<span class="lab-note">a question is a vector, not a sentence</span>`;
  if(id==='causal-mask')html=queryControl()+control('Causal mask',`<input id="mask-control" type="checkbox"${state.mask?' checked':''}>`)+`<span class="lab-note">turn it off. the future leaks.</span>`;
  if(id==='single-head')html=queryControl()+control('Query feature 1',range('query-feature',state.q,-2,3,.1))+`<span class="lab-note">change the question, change the mix</span>`;
  if(id==='multi-head')html=queryControl()+control('Highlight',`<select id="head-control"><option value="0"${state.head===0?' selected':''}>Head 1</option><option value="1"${state.head===1?' selected':''}>Head 2</option></select>`)+`<span class="lab-note">two learned views, one shared input</span>`;
  if(id==='decoder')html=`<button id="block-control">Highlight block ${state.block===0?2:1}</button><span class="lab-note">Day 01: 2 blocks · width 128 · 4 heads · 1,024 tokens</span>`;
  if(id==='softmax')html=samplingControls()+`<span class="lab-note">temperature acts before softmax</span>`;
  if(id==='next-token')html=samplingControls()+`<button id="draw-token">Draw token</button><button id="greedy-token">Greedy pick</button><button id="draw-many">Draw 100</button><button id="reset-tokens">Reset</button>`;
  $('lab').innerHTML=html;wireControls();
}
function listen(id,event,fn){const el=$(id);if(el)el.addEventListener(event,fn);}
function wireControls(){
  listen('text-control','input',e=>{state.text=e.target.value;updateDrawings();});
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{state.text=b.dataset.preset;$('text-control').value=state.text;updateDrawings(true);}));
  listen('byte-character','input',e=>{state.char=e.target.value;updateDrawings();});
  listen('merge-next','click',()=>{state.merge=Math.min(state.merge+1,bpe.merges.length);renderLab();updateDrawings(true);});
  listen('merge-reset','click',()=>{state.merge=0;renderLab();updateDrawings(true);});
  listen('token-control','change',e=>{state.token=Number(e.target.value);updateDrawings(true);});
  listen('position-control','input',e=>{state.position=Number(e.target.value);$('position-control-value').value=state.position;updateDrawings();});
  listen('position-mode','change',e=>{state.posMode=e.target.value;updateDrawings(true);});
  listen('query-control','change',e=>{state.query=Number(e.target.value);updateDrawings(true);});
  listen('mask-control','change',e=>{state.mask=e.target.checked;updateDrawings(true);});
  listen('query-feature','input',e=>{state.q=Number(e.target.value);$('query-feature-value').value=state.q;updateDrawings();});
  listen('head-control','change',e=>{state.head=Number(e.target.value);updateDrawings(true);});
  listen('block-control','click',()=>{state.block=1-state.block;renderLab();updateDrawings(true);});
  listen('temperature','input',e=>{state.temperature=Number(e.target.value);$('temperature-value').value=state.temperature.toFixed(1);updateDrawings();});
  listen('top-k','change',e=>{state.k=Number(e.target.value);updateDrawings(true);});
  listen('draw-token','click',()=>drawToken());listen('greedy-token','click',()=>drawToken(true));
  listen('draw-many','click',()=>{const p=distribution(logits,state.temperature,state.k);for(let t=0;t<100;t++){const u=random();let cumulative=0;for(let i=0;i<p.length;i++){cumulative+=p[i];if(u<cumulative){state.counts[i]++;break;}}}updateDrawings(true);});
  listen('reset-tokens','click',()=>{state.generated=[];state.lastPick=null;state.drawValue=undefined;state.counts=[0,0,0,0];state.seed=7;updateDrawings(true);});
}
function render(reveal=true){
  const c=chapters[current];document.documentElement.style.setProperty('--h',c.h);
  $('title').textContent=c.title;$('subtitle').textContent=c.sub;$('aside').innerHTML=c.aside.split('\n').map(esc).join('<br>');
  $('drawings').innerHTML=c.cards.map((card,i)=>`<figure class="drawing redraw" data-panel="${i}" style="--h:${[85,150,195,250][i]};--panel:${i}"><div class="drawing-head"><h2>${esc(card[0])}</h2><button class="expand" aria-label="Present drawing ${i+1}: ${esc(card[0])}">Focus ↗</button></div><div class="art"></div><figcaption>${esc(card[1])}</figcaption></figure>`).join('');
  $('topics').innerHTML=chapters.map((c,i)=>`<button class="topic" data-topic="${i}" title="${esc(c.title)}" aria-label="Topic ${i+1}: ${esc(c.title)}"${i===current?' aria-current="page"':''}>${String(i+1).padStart(2,'0')}</button>`).join('');
  $('previous').disabled=current===0;$('next').disabled=current===chapters.length-1;
  $('source').href='https://octlm.ramaa.tech/posts/'+c.source+'/';
  renderLab();updateDrawings(reveal);$('announcement').textContent=`Topic ${current+1} of ${chapters.length}. ${c.title}`;
  document.title=`octlm · Day 01 · ${c.title}`;
  document.querySelectorAll('.drawing').forEach((f,i)=>{
    f.querySelector('.expand').addEventListener('click',()=>openPresentation(i));
    f.addEventListener('pointerenter',()=>boil(f,true));f.addEventListener('pointerleave',()=>boil(f,false));f.addEventListener('focusin',()=>boil(f,true));f.addEventListener('focusout',()=>boil(f,false));
  });
  document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>navigate(Number(b.dataset.topic))));
  $('topics').querySelector('[aria-current]')?.scrollIntoView({block:'nearest',inline:'nearest'});
}
function boil(figure,on){if(state.paused||reduced.matches)return;const a=figure.querySelector('.boil');if(a){if(on)a.beginElement();else a.endElement();}}
function restoreFigure(){if(focusedFigure&&focusPlaceholder){focusPlaceholder.replaceWith(focusedFigure);focusedFigure=null;focusPlaceholder=null;}}
function openPresentation(index=0){restoreFigure();focusIndex=index;focusedFigure=document.querySelector(`[data-panel="${index}"]`);focusPlaceholder=document.createComment('presented drawing');focusedFigure.replaceWith(focusPlaceholder);$('present-slot').append(focusedFigure);$('presentation-title').textContent=chapters[current].title;$('scene-count').textContent=`Topic ${current+1} / ${chapters.length} · drawing ${index+1} / 4`;$('previous-scene').disabled=current===0&&index===0;$('next-scene').disabled=current===chapters.length-1&&index===3;if(!$('presentation').open)$('presentation').showModal();updateDrawings(true);}
function navigate(index,keepPresentation=false){if(index<0||index>=chapters.length)return;restoreFigure();if($('presentation').open&&!keepPresentation)$('presentation').close();current=index;history.replaceState(null,'','#'+chapters[current].id);render(!keepPresentation);if(!keepPresentation)window.scrollTo({top:0,behavior:'instant'});}
function stepScene(delta){let next=focusIndex+delta,chapter=current;if(next<0){chapter--;next=3;}if(next>3){chapter++;next=0;}if(chapter<0||chapter>=chapters.length)return;restoreFigure();if(chapter!==current)navigate(chapter,true);openPresentation(next);}
function replay(){updateDrawings(true);}
function setPaused(paused){state.paused=paused;document.body.classList.toggle('paused',paused);$('play').textContent=paused?'Play motion':'Pause motion';$('play').setAttribute('aria-pressed',String(paused));document.querySelectorAll('.sketch').forEach(s=>{if(paused||reduced.matches)s.pauseAnimations();else s.unpauseAnimations();});}
listen('previous','click',()=>navigate(current-1));listen('next','click',()=>navigate(current+1));listen('play','click',()=>setPaused(!state.paused));listen('replay','click',replay);listen('cinema','click',()=>openPresentation(0));listen('close-presentation','click',()=>$('presentation').close());listen('previous-scene','click',()=>stepScene(-1));listen('next-scene','click',()=>stepScene(1));listen('present-replay','click',replay);
$('presentation').addEventListener('close',restoreFigure);
listen('theme','click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').textContent=dark?'Light paper':'Dark ink';$('theme').setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');});
document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea')||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const delta=e.key==='ArrowRight'?1:-1;if($('presentation').open)stepScene(delta);else navigate(current+delta);}if(e.code==='Space'&&!e.target.closest('button,a')){e.preventDefault();setPaused(!state.paused);}if(e.key.toLowerCase()==='r')replay();});
window.addEventListener('hashchange',()=>{const i=chapters.findIndex(c=>c.id===location.hash.slice(1));if(i>=0)navigate(i);});
reduced.addEventListener('change',()=>{setPaused(reduced.matches);updateDrawings();});
const initial=chapters.findIndex(c=>c.id===location.hash.slice(1));current=initial<0?0:initial;render();if(reduced.matches)setPaused(true);
// The smallest runnable numerical check can import these functions without rendering a page.
window.octlm={softmax,distribution,attention,trainBPE,chunks,sinusoid,chapters,state,matmul,toyX,navigate};
