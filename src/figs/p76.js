import { D, C } from '../lib/draw.js';
import { scene as illustration, page as figPage, shelf as figShelf, label as figLabel, mapSite } from '../lib/figure-details.js';
import { systemFigure, systemMap, systemCover } from '../lib/system-figures.js';

import { chip, panel, pipe, cross, tick, bolt, ruler } from '../lib/sd-kit.js';
const rec = (d, x, y, id, team, v, hot = false) => { d.rect(x, y, 70, 30, { r: 4, fill: hot ? C.accSoft : team === 'red' ? C.card : C.paper, stroke: hot ? C.acc : C.ink2 }); d.mono(x + 35, y + 15, `${id}: ${team} ${v}`, { size: 9 }); };
const steps4 = (d, st, hotIdx, y = 80, icon) => st.forEach(([a, b], i) => { const x = 30 + i * 150, hot = i === hotIdx; if (icon) icon(d, i, x, y); d.rect(x, y + (icon ? 70 : 0), 120, 60, { r: 8, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 }); d.text(x + 60, y + (icon ? 70 : 0) + 22, a, { cls: 'ttl', size: 11, color: hot ? C.acc : undefined }); d.text(x + 60, y + (icon ? 70 : 0) + 42, b, { cls: 'xs' }); if (i < st.length - 1) d.arrow(x + 124, y + (icon ? 100 : 30), x + 146, y + (icon ? 100 : 30), { stroke: C.gray, hl: 5 }); });
export function where_sd_data_pipelines(stage=99) { return systemMap("sd_data_pipelines", ["OLTP vs OLAP", "Batch processing", "Stream processing", "Event time, windows, watermarks", "ETL, ELT, warehouses, and lakes", "CDC and materialized views", "Checkpoints and exactly-once", "Spark and Flink", "Case study: score to report"], stage); }
export function cover_sd_data_pipelines() { return systemCover("sd_data_pipelines", 17, ["Data", "pipelines"], "Data pipelines", ["OLTP vs OLAP", "Batch processing", "Stream processing", "Event time, windows, watermarks", "ETL, ELT, warehouses, and lakes", "CDC and materialized views", "Checkpoints and exactly-once", "Spark and Flink", "Case study: score to report"]); }
export function sd_data_pipelines_workloads() {
  const d = illustration('sd_data_pipelines_workloads', 'OLTP TOUCHES ONE ROW FAST; OLAP SCANS A SEASON. KEEP THEM APART', 320);
  panel(d, 20, 44, 292, 230, 'OLTP: update match m7');
  d.grid(60, 90, 6, 4, 50, 22, { cellFill: (r) => (r === 2 ? C.accSoft : null) });
  d.travel([[40, 145], [60, 145]], { dur: 1, r: 3 });
  d.text(166, 250, 'one row, a few milliseconds', { cls: 'xs' });
  panel(d, 328, 44, 292, 230, 'OLAP: sum the season', true);
  d.grid(368, 90, 6, 4, 50, 22, { cellFill: (r, c) => (c === 2 ? C.accSoft : null) });
  d.travel([[443, 84], [443, 226]], { dur: 3, token: (g) => g.line(-24, 0, 24, 0, { stroke: C.acc, sw: 1.4, single: true }) });
  d.text(474, 250, 'every row, one column', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_column() {
const d=illustration('sd_data_pipelines_column','COLUMN LAYOUT READS THE FIELD NEEDED BY THE QUESTION',355);
  d.text(166,46,'row-oriented',{cls:'ttl'});d.text(470,46,'column-oriented',{cls:'ttl'});
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){d.rect(41+c*49,76+r*32,49,32,{r:0,fill:c===2?C.accSoft:C.card,stroke:C.line});d.rect(347+c*49,76+r*32,49,32,{r:0,fill:c===2?C.accSoft:C.card,stroke:c===2?C.acc:C.line});}
  for(let r=0;r<5;r++)d.arrow(48,92+r*32,279,92+r*32,{stroke:C.ink2,hl:4});d.arrow(469,250,469,70,{stroke:C.acc,hl:6});
  d.mono(166,282,'full rows: 500,000,000 B',{size:11});d.mono(470,282,'one column: 8,000,000 B',{size:11});
  d.text(320,322,'illustrative layout cutaway; full workload bytes shown below',{cls:'sm'});return d.svg();
}
export function sd_data_pipelines_freshness() {
  const d = illustration('sd_data_pipelines_freshness', 'EVERY ANALYTICAL ANSWER SAYS "AS OF" SOME SOURCE POSITION', 280);
  d.tape(40, 90, ['…', '840', '841', '842', '843', '844', '845'], { cw: 60, h: 30 });
  [['captured', 4, C.ink2, -1], ['processed', 3, C.ink2, 1], ['published total', 2, C.acc, -1]].forEach(([s, k, col, dir], i) => {
    const x = 40 + (k + 1) * 60;
    d.line(x, dir < 0 ? 86 : 124, x, dir < 0 ? 60 - i * 10 : 150 + i * 10, { stroke: col, sw: 1.6, single: true });
    d.text(x, dir < 0 ? 50 - i * 10 : 162 + i * 10, s, { cls: 'xs', color: col === C.acc ? C.acc : undefined });
  });
  d.text(320, 230, '"red = 7 as of position 842" is a complete answer; "red = 7" is not', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_reproduce() {
  const d = illustration('sd_data_pipelines_reproduce', 'KEEP RAW HISTORY AND A VERSIONED TRANSFORM, AND ANY OUTPUT CAN BE REBUILT', 300);
  steps4(d, [['raw history', 'accepted records'], ['transform v7', 'versioned code'], ['output gen 12', 'identified'], ['reconcile', 'vs source']], 3, 70, (g, i, x, y) => { if (i === 0) g.tape(x + 14, y + 20, ['', '', ''], { cw: 30, h: 24 }); if (i === 1) g.gear(x + 60, y + 30, 22, { spin: 5 }); if (i === 2) g.db(x + 36, y + 6, 48, 50); if (i === 3) tick(g, x + 60, y + 30, 12, C.acc); });
  d.text(320, 260, 'retention and deletion rules limit which rebuilds stay possible', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_batch_boundary() {
  const d = illustration('sd_data_pipelines_batch_boundary', 'AN HOURLY BATCH IS A NAMED SET: 72,000 RECORDS, 14,400,000 B, POSITIONS 1–72,000', 300);
  for (let i = 0; i < 24; i++) d.doc(40 + (i % 12) * 30, 70 + Math.floor(i / 12) * 44, 22, 34, { lines: false });
  d.text(210, 172, '3,600 s × 20 events/s = 72,000 records', { cls: 'xs' });
  d.doc(460, 60, 130, 140, { fill: C.accSoft, stroke: C.acc });
  d.text(525, 80, 'manifest', { cls: 'ttl', color: C.acc });
  d.mono(525, 110, 'positions', { size: 9 }); d.mono(525, 126, '1 … 72,000', { size: 9 }); d.mono(525, 150, '14,400,000 B', { size: 9 });
  d.text(320, 250, '"the noon batch" is a clock label; the manifest is the identity', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_map() {
  const d = illustration('sd_data_pipelines_map', 'MAP TURNS EACH RECORD INTO A (TEAM, RUNS) CONTRIBUTION AND KEEPS ITS ID', 300);
  [['a', 'red', 2], ['b', 'blue', 3], ['c', 'red', 4], ['d', 'red', 1]].forEach(([id, t, v], i) => {
    const y = 60 + i * 50;
    d.doc(60, y, 80, 36, { lines: false }); d.mono(100, y + 18, `event ${id}`, { size: 9.5 });
    d.arrow(146, y + 18, 236, y + 18, { stroke: C.gray, hl: 5 });
    rec(d, 246, y + 3, id, t, v, t === 'red');
  });
  d.gear(190, 60, 14, { spin: 3 });
  d.text(470, 160, 'invalid runs field?\nreject or quarantine,\nnever treat as 0', { cls: 'xs', vc: true });
  return d.svg();
}
export function sd_data_pipelines_shuffle() {
const d=illustration('sd_data_pipelines_shuffle','SHUFFLE GATHERS EACH KEY BEFORE REDUCING ITS VALUES',340);
  [['red',2],['blue',3],['red',4],['red',1]].forEach(([k,v],i)=>figShelf(d,38,55+i*64,[k,v],{width:158,height:37,hot:k==='red'?0:-1}));
  d.doc(316,83,158,111,{lines:false,fill:C.accFaint,stroke:C.acc});d.text(395,105,'red group',{cls:'ttl'});d.mono(395,145,'2 + 4 + 1 = 7',{size:11});
  d.doc(316,230,158,61,{lines:false});d.mono(395,264,'blue: 3',{size:11});
  [0,2,3].forEach(i=>d.carrow([[202,74+i*64],[251,74+i*64],[308,139]],{stroke:C.acc,hl:5}));d.carrow([[202,138],[251,182],[308,261]],{stroke:C.ink2,hl:5});
  d.arrow(482,139,543,139,{stroke:C.acc});d.mono(586,139,7,{size:21});d.arrow(482,261,543,261,{stroke:C.ink2});d.mono(586,261,3,{size:21});return d.svg();
}
export function sd_data_pipelines_publish_batch() {
  const d = illustration('sd_data_pipelines_publish_batch', 'WRITE GENERATION 12 ASIDE, VALIDATE IT, THEN FLIP THE MANIFEST', 300);
  steps4(d, [['write output', 'gen 12 files'], ['validate', 'all partitions'], ['commit manifest', 'current = 12'], ['readers switch', 'gen 12']], 2, 80);
  d.text(320, 200, 'retry recognises gen 12; "total = total + batch" double-counts after a crash', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_running() {
  const d = illustration('sd_data_pipelines_running', 'A RUNNING SUM PER TEAM: RED 0 → 2 → 6 → 7, BLUE 0 → 3', 300);
  const st = [['a', 'red', 2, 2, 0], ['b', 'blue', 3, 2, 3], ['c', 'red', 4, 6, 3], ['d', 'red', 1, 7, 3]];
  st.forEach(([id, t, v, red, blue], i) => {
    const x = 40 + i * 145;
    rec(d, x + 20, 60, id, t, v, t === 'red');
    d.arrow(x + 55, 96, x + 55, 120, { stroke: C.gray, hl: 4 });
    d.rect(x, 126, 110, 70, { r: 6, fill: C.paper, stroke: C.ink2 });
    d.mono(x + 55, 150, `red = ${red}`, { size: 11, color: t === 'red' ? C.acc : undefined }); d.mono(x + 55, 174, `blue = ${blue}`, { size: 11, color: t === 'blue' ? C.acc : undefined });
  });
  d.text(320, 240, 'the operator keeps state; each record id contributes once', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_keyed() {
  const d = illustration('sd_data_pipelines_keyed', 'PARTITION BY TEAM: ONE OWNER HOLDS RED\'S STATE (7), ANOTHER HOLDS BLUE\'S (3)', 300);
  d.tape(40, 80, ['a', 'b', 'c', 'd'], { cw: 40, h: 30 });
  d.text(120, 66, 'input', { cls: 'xs' });
  [['red owner', 'sum 7', 50, true], ['blue owner', 'sum 3', 130, false], ['other owners', 'own state', 210, false]].forEach(([s, v, y, hot]) => {
    d.arrow(204, 95, 330, y + 25, { stroke: hot ? C.acc : C.gray, hl: 6 });
    d.server(340, y, 60, 50, { unit: 14, fill: hot ? C.accSoft : C.card, stroke: hot ? C.acc : C.ink2 });
    d.text(420, y + 16, s, { cls: 'sm', a: 'start' }); d.mono(420, y + 34, v, { size: 10, a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(320, 286, '4 partitions × 10/s capacity = 40/s against 20/s input; balance keys, not just partitions', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_backpressure() {
  const d = illustration('sd_data_pipelines_backpressure', 'THE SINK IS SLOW: THE RETAINED LOG HOLDS THE BACKLOG, NOT THE OPERATOR\'S MEMORY', 300);
  d.tape(30, 100, Array(8).fill(''), { cw: 26, h: 30, hot: (i) => i >= 4 }); d.text(134, 86, 'retained input', { cls: 'xs' });
  d.arrow(244, 115, 290, 115, { stroke: C.gray, hl: 5 }); d.text(267, 100, 'bounded read', { cls: 'xs' });
  d.server(300, 86, 70, 60, { unit: 14, label: 'operator' });
  d.arrow(376, 115, 456, 115, { stroke: C.gray, hl: 5 });
  d.db(466, 80, 90, 70, { label: 'slow sink', fill: C.accSoft, stroke: C.acc });
  d.clock(511, 200, 30, { spin: 6 });
  d.text(320, 250, 'alert on the age of the oldest waiting record', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_retraction() {
  const d = illustration('sd_data_pipelines_retraction', 'CHANGING A CONTRIBUTION FROM 4 TO 6: EMIT −4, THEN +6, NET +2', 280);
  const st = [['before', '4', false], ['retract', '−4', false], ['add', '+6', false], ['net', '+2', true]];
  st.forEach(([s, v, hot], i) => { const x = 40 + i * 145; d.envelope(x + 20, 90, 80, 50, { fill: hot ? C.accSoft : C.paper, stroke: hot ? C.acc : C.ink2 }); d.mono(x + 60, 160, v, { size: 16, color: hot ? C.acc : undefined }); d.text(x + 60, 76, s, { cls: 'xs' }); });
  d.text(320, 226, 'a sink that adds both rows without knowing they are changes gets 4 + 6 = 10', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_times() {
  const d = illustration('sd_data_pipelines_times', 'ARRIVAL ORDER a, b, c, d; EVENT TIMES 1, 3, 2, 7. c IS LATE RELATIVE TO b', 300);
  d.text(40, 76, 'arrival', { cls: 'xs', a: 'start' }); d.tape(120, 60, ['a', 'b', 'c', 'd'], { cw: 70, h: 30, hot: (i) => i === 2 });
  const X = 120, s = 50;
  d.arrow(X, 180, X + 9 * s, 180, { stroke: C.gray }); for (let t = 0; t <= 8; t++) d.mono(X + t * s, 196, t, { size: 9 });
  d.text(40, 180, 'event time', { cls: 'xs', a: 'start' });
  [['a', 1], ['b', 3], ['c', 2], ['d', 7]].forEach(([id, t], i) => { d.circle(X + t * s, 160, 22, { fill: id === 'c' ? C.accSoft : C.card, stroke: id === 'c' ? C.acc : C.ink2 }); d.mono(X + t * s, 160, id, { size: 10 }); d.line(155 + i * 70, 92, X + t * s, 148, { stroke: C.line, single: true, dash: [3, 3] }); });
  d.text(320, 250, 'event time answers "when did it happen"; processing time "when did we see it"', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_windows() {
  const d = illustration('sd_data_pipelines_windows', 'TUMBLING 5 S WINDOWS: [0,5) HOLDS a, b, c (RED 6, BLUE 3); [5,10) HOLDS d (RED 1)', 300);
  const X = 60, s = 52;
  d.rect(X, 80, 5 * s, 90, { r: 4, fill: C.accFaint, stroke: C.acc }); d.rect(X + 5 * s, 80, 5 * s, 90, { r: 4, fill: C.paper, stroke: C.ink2 });
  d.text(X + 2.5 * s, 66, '[0, 5)', { cls: 'mono', size: 11, color: C.acc }); d.text(X + 7.5 * s, 66, '[5, 10)', { cls: 'mono', size: 11 });
  [['a', 1, 'red'], ['b', 3, 'blue'], ['c', 2, 'red'], ['d', 7, 'red']].forEach(([id, t, team]) => { d.circle(X + t * s, 112, 24, { fill: team === 'red' ? C.accSoft : C.card }); d.mono(X + t * s, 112, id, { size: 10 }); });
  d.mono(X + 2.5 * s, 150, 'red 2 + 4 = 6 · blue 3', { size: 10 }); d.mono(X + 7.5 * s, 150, 'red 1 · blue 0', { size: 10 });
  for (let t = 0; t <= 10; t++) d.mono(X + t * s, 186, t, { size: 9 });
  d.text(320, 240, 'include the left edge, exclude the right, so time 5 lands in exactly one window', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_watermark() {
const d=illustration('sd_data_pipelines_watermark','A WATERMARK MARKS EVENT-TIME PROGRESS UNDER A DISORDER POLICY',315);
  const X=t=>56+t*72;d.fillRect(X(0),83,X(5)-X(0),61,C.accFaint);d.arrow(45,158,599,158,{stroke:C.ink2});
  for(let t=0;t<=7;t++){d.line(X(t),153,X(t),165,{stroke:C.line,single:true});d.mono(X(t),188,t,{size:11});}
  d.line(X(5),59,X(5),151,{stroke:C.acc,single:true,sw:2});d.text(X(5),40,'watermark 5',{cls:'ttl',color:C.acc});
  d.envelope(X(7)-20,89,40,25);d.text(X(7),65,'max observed 7',{cls:'sm'});
  d.brace(X(5),X(7),223,{label:'2 s allowed disorder'});d.mono(320,279,'7 − 2 = 5; interval [0,5) eligible by this rule',{size:11});return d.svg();
}
export function sd_data_pipelines_late() {
  const d = illustration('sd_data_pipelines_late', 'AN EVENT AT TIME 2 ARRIVES AFTER [0,5) WAS EMITTED: UPDATE, REPAIR, OR COUNT AS DROPPED', 300);
  d.envelope(40, 100, 70, 44, { fill: C.accSoft, stroke: C.acc }); d.mono(75, 160, 'time = 2', { size: 10, color: C.acc });
  d.arrow(116, 122, 196, 122, { stroke: C.ink2 });
  d.rect(206, 90, 120, 64, { r: 8, fill: C.card, stroke: C.ink2 }); d.text(266, 112, 'window state', { cls: 'sm' }); d.text(266, 132, 'still retained?', { cls: 'xs' });
  [['yes: emit a new version', 70], ['no: repair job', 122], ['beyond policy: count it', 174]].forEach(([s, y], i) => { d.arrow(330, 122, 400, y, { stroke: i === 0 ? C.acc : C.gray, hl: 5 }); d.text(410, y, s, { cls: 'sm', a: 'start', color: i === 0 ? C.acc : undefined }); });
  d.text(320, 250, 'finality is a declared policy, never silent', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_etl() {
  const d = illustration('sd_data_pipelines_etl', 'ETL: TRANSFORM IN THE MIDDLE, LOAD ONLY CLEAN ROWS', 280);
  steps4(d, [['extract', 'from source'], ['validate + transform', 'transform v7'], ['load', 'clean rows'], ['query', 'analysts']], 1, 80);
  d.text(320, 200, 'early contract, less sensitive data downstream; a transform bug means re-extracting', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_elt() {
  const d = illustration('sd_data_pipelines_elt', 'ELT: LOAD RAW INTO A CONTROLLED AREA, THEN DERIVE TABLES IN THE WAREHOUSE', 280);
  steps4(d, [['extract', 'from source'], ['raw target', 'governed'], ['transform v7', 'in warehouse'], ['derived tables', 'analysts']], 1, 80);
  d.text(320, 200, 'raw is still validated for format, size and sensitive fields, with retention rules', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_warehouse() {
  const d = illustration('sd_data_pipelines_warehouse', 'A FACT ROW POINTS TO DIMENSIONS; WHICH VERSION OF "TEAM NAME" IT JOINS IS A CHOICE', 320);
  d.rect(230, 110, 180, 90, { r: 6, fill: C.accSoft, stroke: C.acc }); d.text(320, 128, 'match_runs (fact)', { cls: 'ttl', size: 12, color: C.acc });
  d.mono(320, 156, 'event_id · team_key', { size: 9 }); d.mono(320, 176, 'venue_key · runs', { size: 9 });
  d.rect(30, 60, 150, 70, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(105, 80, 'team (dimension)', { cls: 'sm' }); d.mono(105, 104, 'name valid from/to', { size: 9 });
  d.rect(460, 60, 150, 70, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(535, 80, 'venue (dimension)', { cls: 'sm' });
  d.line(226, 140, 184, 100, { stroke: C.ink2, single: true }); d.line(414, 140, 456, 100, { stroke: C.ink2, single: true });
  d.text(320, 260, 'a renamed team: join the name as of the match, or as of today?', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_lake() {
  const d = illustration('sd_data_pipelines_lake', 'FILES IN A BUCKET BECOME A TABLE ONLY WITH A SCHEMA, A CATALOGUE AND A SNAPSHOT MANIFEST', 300);
  for (let i = 0; i < 8; i++) d.doc(40 + (i % 4) * 34, 70 + Math.floor(i / 4) * 44, 26, 36, { lines: false });
  d.text(100, 172, 'object files', { cls: 'xs' });
  d.arrow(180, 110, 230, 110, { stroke: C.gray, hl: 5 });
  d.rect(240, 76, 120, 70, { r: 6, fill: C.card, stroke: C.ink2 }); d.text(300, 102, 'schema +', { cls: 'sm' }); d.text(300, 122, 'catalogue', { cls: 'sm' });
  d.arrow(364, 110, 404, 110, { stroke: C.gray, hl: 5 });
  d.doc(414, 66, 90, 90, { fill: C.accSoft, stroke: C.acc }); d.text(459, 172, 'snapshot manifest', { cls: 'xs', color: C.acc });
  d.arrow(510, 110, 550, 110, { stroke: C.gray, hl: 5 }); d.server(556, 84, 50, 54, { unit: 14 });
  d.text(320, 240, 'a folder is not a transaction; the manifest says which files are the table', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_cdc() {
  const d = illustration('sd_data_pipelines_cdc', 'CDC READS THE COMMIT LOG, SO DELETES ARRIVE AS CHANGES TOO', 300);
  d.db(30, 80, 90, 90, { label: 'source' });
  d.tape(150, 110, ['ins 41', 'upd 41', 'del 39', 'ins 42'], { cw: 70, h: 30, hot: (i) => i === 2 });
  d.text(290, 96, 'change log with positions', { cls: 'xs' });
  d.arrow(434, 125, 480, 125, { stroke: C.gray, hl: 5 });
  d.db(490, 80, 110, 90, { label: 'derived target' });
  d.travel([[150, 125], [480, 125]], { dur: 4, r: 3.5 });
  d.text(320, 240, 'a nightly copy would miss row 39 silently; CDC sees "del 39"', { cls: 'xs', color: C.acc });
  return d.svg();
}
export function sd_data_pipelines_handoff() {
  const d = illustration('sd_data_pipelines_handoff', 'SNAPSHOT AT POSITION P, THEN REPLAY ONLY CHANGES AFTER P: NO GAP, NO OVERLAP', 300);
  const X = 60, W = 520;
  d.arrow(X, 140, X + W, 140, { stroke: C.gray });
  d.rect(X, 100, 240, 30, { r: 2, fill: C.card, stroke: C.ink2 }); d.text(X + 120, 115, 'snapshot = all changes ≤ P', { cls: 'xs' });
  d.rect(X + 240, 100, 280, 30, { r: 2, fill: C.accSoft, stroke: C.acc }); d.text(X + 380, 115, 'replay changes > P', { cls: 'xs', color: C.acc });
  d.line(X + 240, 90, X + 240, 150, { stroke: C.ink, sw: 2, single: true }); d.mono(X + 240, 166, 'P', { size: 12 });
  d.text(320, 220, 'the source must retain changes after P while the snapshot loads', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_cdc_update() {
  const d = illustration('sd_data_pipelines_cdc_update', 'AN UPDATE 4 → 6 ADDS +2; A LATER DELETE REMOVES 6, SO THE CONSUMER MUST REMEMBER IT', 300);
  const st = [['stored', 'key k: 4'], ['after image', 'key k: 6'], ['derived change', '−4 + 6 = +2'], ['delete later', 'remove 6']];
  steps4(d, st, 3, 80);
  d.text(320, 200, 'keep the last contribution per key, or capture before-images', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_view() {
  const d = illustration('sd_data_pipelines_view', 'RAW 2 + 4 + 1 BECOMES THE VIEW ROW red = 7, STAMPED WITH ITS SOURCE POSITION', 300);
  [['a', 'red', 2], ['c', 'red', 4], ['d', 'red', 1], ['b', 'blue', 3]].forEach(([id, t, v], i) => rec(d, 40, 60 + i * 44, id, t, v, t === 'red'));
  d.arrow(120, 140, 220, 140, { stroke: C.ink2 });
  d.rect(230, 90, 200, 100, { r: 6, fill: C.paper, stroke: C.ink2 }); d.text(330, 108, 'team_totals', { cls: 'ttl', size: 12 });
  chip(d, 246, 124, 80, 'red = 7', true); chip(d, 336, 124, 80, 'blue = 3');
  d.mono(330, 172, 'as of pos 842, transform v7', { size: 9 });
  d.text(320, 250, 'a fast read hides the upstream work that keeps it current', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_checkpoint() {
const d=illustration('sd_data_pipelines_checkpoint','A CHECKPOINT RESTORES BOTH STATE AND THE MATCHING INPUT POSITION',330);
  figShelf(d,49,80,['0: 2','1: 3','2: 4','3: 1'],{width:541,height:53,hot:1});
  d.line(320,56,320,159,{stroke:C.acc,single:true,sw:2});d.text(320,40,'checkpoint boundary',{cls:'ttl',color:C.acc});
  d.doc(113,192,170,90,{lines:false,fill:C.accSoft,stroke:C.acc});d.mono(198,221,'position: 1');d.mono(198,253,'state: 2 + 3 = 5',{size:11});
  d.arrow(327,109,327,180,{stroke:C.acc});d.text(459,211,'restore the pair',{cls:'ttl'});d.mono(459,248,'5 + 4 + 1 = 10',{size:14});
  d.text(320,310,'replay the tail after the checkpoint, not the covered prefix',{cls:'sm'});return d.svg();
}
export function sd_data_pipelines_barrier() {
  const d = illustration('sd_data_pipelines_barrier', 'A BARRIER FLOWS WITH THE DATA; EACH OPERATOR SNAPSHOTS WHEN IT PASSES', 300);
  [0, 1].forEach((r) => { const y = 90 + r * 70; d.line(40, y, 600, y, { stroke: C.line, single: true }); [100, 300, 500].forEach((x, k) => d.server(x - 25, y - 22, 50, 44, { unit: 12, fill: k < 2 ? C.accSoft : C.card, stroke: k < 2 ? C.acc : C.ink2 })); });
  d.travel([[40, 90], [600, 90]], { dur: 6, token: (g) => g.line(0, -26, 0, 26, { stroke: C.acc, sw: 2, single: true }) });
  d.travel([[40, 160], [600, 160]], { dur: 6, token: (g) => g.line(0, -26, 0, 26, { stroke: C.acc, sw: 2, single: true }) });
  d.text(320, 230, 'source positions + every operator\'s state at the same logical cut', { cls: 'sm' });
  d.text(320, 254, 'a consistent cut is not one wall-clock instant', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_duplicate() {
  const d = illustration('sd_data_pipelines_duplicate', 'REPLAYING c AGAINST AN EXTERNAL ADDER TURNS 10 INTO 14', 280);
  d.text(40, 80, 'correct', { cls: 'xs', a: 'start' }); d.tape(120, 66, ['2', '3', '4', '1'], { cw: 50, h: 28 }); d.mono(340, 80, '= 10', { size: 12 });
  d.text(40, 140, 'replayed c', { cls: 'xs', a: 'start' }); d.tape(120, 126, ['2', '3', '4', '4', '1'], { cw: 50, h: 28, hot: (i) => i === 3 }); d.mono(390, 140, '= 14', { size: 12, color: C.acc });
  d.text(320, 210, 'operator state may be exactly-once; the external sink is not unless the effect has an identity', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_catchup() {
  const d = illustration('sd_data_pipelines_catchup', '12,000 BEHIND, 120/S PROCESSED, 20/S ARRIVING: 100/S NET, 120 S TO CATCH UP', 280);
  const X = 60, s = 3.4;
  d.line(X, 80, X + 120 * s, 200, { stroke: C.acc, sw: 2, single: true });
  d.mono(X, 70, '12,000', { size: 10, color: C.acc }); d.mono(X + 120 * s, 214, '0 at 120 s', { size: 10, a: 'end' });
  d.line(X, 200, X + 140 * s, 200, { stroke: C.ink2, single: true }); d.line(X, 70, X, 200, { stroke: C.ink2, single: true });
  d.travel([[X, 80], [X + 120 * s, 200]], { dur: 4, r: 4 });
  d.text(530, 120, '120 − 20 = 100/s', { cls: 'mono', size: 10 });
  d.text(320, 250, 'recovery headroom is capacity beyond the ongoing load; restore time is extra', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_spark() {
  const d = illustration('sd_data_pipelines_spark', 'THE SPARK DRIVER PLANS AND SCHEDULES; EXECUTORS MOVE THE DATA', 300);
  d.server(270, 46, 100, 70, { label: 'driver', fill: C.accSoft, stroke: C.acc });
  [['input tasks', 80], ['shuffle tasks', 320], ['output tasks', 560]].forEach(([s, x]) => { d.arrow(320, 136, x, 176, { stroke: C.gray, hl: 6, dash: [4, 3] }); d.server(x - 40, 180, 80, 60, { unit: 14 }); d.text(x, 256, s, { cls: 'xs' }); });
  d.flowline([[120, 210], [280, 210]], { sw: 2 }); d.flowline([[360, 210], [520, 210]], { sw: 2 });
  d.text(320, 286, 'never collect the whole dataset into the driver', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_stages() {
  const d = illustration('sd_data_pipelines_stages', 'READ + MAP, SHUFFLE BY TEAM, SUM EACH GROUP, PUBLISH: RED [2,4,1] → 7, BLUE [3] → 3', 300);
  [['a', 'red', 2], ['b', 'blue', 3], ['c', 'red', 4], ['d', 'red', 1]].forEach(([id, t, v], i) => rec(d, 30, 60 + i * 44, id, t, v, t === 'red'));
  [[0, 0], [1, 1], [2, 0], [3, 0]].forEach(([i, g]) => d.line(104, 75 + i * 44, 290, g ? 200 : 110, { stroke: g ? C.gray : C.acc, single: true }));
  d.rect(296, 86, 120, 50, { r: 6, fill: C.accSoft, stroke: C.acc }); d.mono(356, 111, 'red [2, 4, 1]', { size: 10 });
  d.rect(296, 176, 120, 50, { r: 6, fill: C.card, stroke: C.ink2 }); d.mono(356, 201, 'blue [3]', { size: 10 });
  d.arrow(420, 111, 480, 111, { stroke: C.acc, hl: 6 }); d.mono(520, 111, 'red = 7', { size: 12, color: C.acc });
  d.arrow(420, 201, 480, 201, { stroke: C.gray, hl: 6 }); d.mono(520, 201, 'blue = 3', { size: 12 });
  d.text(200, 260, 'shuffle', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_flink() {
  const d = illustration('sd_data_pipelines_flink', 'FLINK: A COORDINATOR, STATEFUL TASKS, AND CHECKPOINT STORAGE THAT SURVIVES THEM', 300);
  d.server(270, 46, 100, 70, { label: 'coordinator' });
  [['source positions', 100], ['keyed windows', 320], ['compatible sink', 540]].forEach(([s, x], i) => { d.arrow(320, 136, x, 166, { stroke: C.gray, hl: 6, dash: [4, 3] }); d.server(x - 35, 170, 70, 54, { unit: 13, fill: i === 1 ? C.accSoft : C.card, stroke: i === 1 ? C.acc : C.ink2 }); d.text(x, 240, s, { cls: 'xs' }); });
  d.db(520, 50, 90, 60, { label: 'checkpoints' }); d.carrow([[355, 200], [460, 150], [520, 100]], { stroke: C.acc, dash: [4, 3] });
  d.text(320, 282, 'worker memory is fast; the checkpoint is what recovery reads', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_choice() {
  const d = illustration('sd_data_pipelines_choice', 'FOUR QUESTIONS DECIDE THE ENGINE, AND EACH NEEDS A PROOF', 320);
  const r = [['bounded input?', 'batch boundary', 'repeatable input'], ['ongoing state?', 'state size', 'restore plan'], ['time windows?', 'lateness policy', 'tested watermark'], ['external output?', 'sink guarantee', 'retry-safe effect']];
  r.forEach(([q, a, p], i) => {
    const y = 56 + i * 58, hot = i === 3;
    chip(d, 30, y, 150, q, hot, 30);
    d.arrow(186, y + 15, 214, y + 15, { stroke: C.gray, hl: 5 }); d.text(224, y + 15, a, { cls: 'sm', a: 'start' });
    d.arrow(380, y + 15, 408, y + 15, { stroke: C.gray, hl: 5 }); d.text(418, y + 15, p, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(320, 300, 'same questions for Spark, Flink or a small custom processor', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_full() {
  const d = illustration('sd_data_pipelines_full', 'COMMIT c (RED +4, TIME 2) FLOWS INTO WINDOW [0,5), WHERE RED GOES FROM 2 TO 6', 300);
  steps4(d, [['commit c', 'red +4, t = 2'], ['capture', 'position 843'], ['window [0,5)', 'red 2 → 6'], ['publish', 'red = 6, v2']], 3, 80);
  d.travel([[90, 110], [540, 110]], { dur: 4, label: 'c', w: 20 });
  d.text(320, 200, 'the running total (7) and the window total (6) are separate outputs', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_totals() {
  const d = illustration('sd_data_pipelines_totals', '1,728,000 EVENTS/DAY: 10.368 GB OVER 30 DAYS, 31.104 GB AS 3 COPIES', 300);
  const r = [['daily input', '1,728,000 events', '345,600,000 B'], ['30 days', 'logical payload', '10,368,000,000 B'], ['three copies', 'physical payload', '31,104,000,000 B'], ['one-day ids', '32 B each', '55,296,000 B']];
  r.forEach(([a, b, c], i) => {
    const y = 56 + i * 50, hot = i === 3;
    d.text(40, y + 14, a, { cls: 'ttl', a: 'start', size: 12, color: hot ? C.acc : undefined });
    d.text(240, y + 14, b, { cls: 'sm', a: 'start' }); d.mono(600, y + 14, c, { size: 10.5, a: 'end', color: hot ? C.acc : undefined });
  });
  d.text(320, 270, 'the dedupe registry is operator state, a separate workload', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_backfill() {
  const d = illustration('sd_data_pipelines_backfill', '7 DAYS = 12,096,000 RECORDS ÷ 2,000/S = 6,048 S OF REPROCESSING', 300);
  for (let i = 0; i < 7; i++) d.doc(40 + i * 40, 80, 32, 44, { lines: false });
  d.text(170, 140, '7 days of history', { cls: 'xs' });
  d.arrow(330, 102, 380, 102, { stroke: C.ink2 }); d.server(390, 70, 70, 64, { unit: 14, label: '2,000/s' });
  d.arrow(466, 102, 510, 102, { stroke: C.acc }); d.db(520, 70, 80, 64, { label: 'gen 13', fill: C.accSoft, stroke: C.acc });
  d.text(320, 210, 'write a new generation, isolate its resources from live processing,', { cls: 'xs' });
  d.text(320, 230, 'then switch readers once it reconciles', { cls: 'xs' });
  return d.svg();
}
export function sd_data_pipelines_contract() {
  const d = illustration('sd_data_pipelines_contract', 'FOUR FAILURES, HOW THE PIPELINE NOTICES, AND WHAT IT DOES', 320);
  const r = [['duplicate', 'identity / version', 'retry-safe effect'], ['late event', 'watermark policy', 'update or repair'], ['schema error', 'validation', 'quarantine + fix'], ['source gap', 'capture position', 'snapshot + replay']];
  r.forEach(([a, b, c], i) => {
    const y = 56 + i * 58, hot = i === 2;
    chip(d, 30, y, 140, a, hot, 30);
    d.arrow(176, y + 15, 204, y + 15, { stroke: C.gray, hl: 5 }); d.text(214, y + 15, b, { cls: 'sm', a: 'start' });
    d.arrow(380, y + 15, 408, y + 15, { stroke: C.gray, hl: 5 }); d.text(418, y + 15, c, { cls: 'sm', a: 'start', color: hot ? C.acc : undefined });
  });
  d.text(320, 300, 'a dropped record needs a recorded reason', { cls: 'xs' });
  return d.svg();
}
