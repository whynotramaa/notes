import { routeMap, coverArtwork } from './figure-details.js';
import { D, C } from './draw.js';

// Shared layout recipes; the figure files supply subject-specific mechanisms.
export function canvas(id, kicker, h = 260) {
  const d = new D(640, h, id);
  d.text(10, 16, kicker, { cls: 'cap', a: 'start' });
  return d;
}
export function flow(id, kicker, labels, notes = [], focus = 1) {
  const rows = Math.ceil(labels.length / 3);
  const d = canvas(id, kicker, 80 + rows * 110);
  labels.forEach((label, i) => {
    const r = Math.floor(i / 3), c = r % 2 ? 2 - i % 3 : i % 3;
    const x = 22 + c * 209, y = 58 + r * 110;
    d.box(x, y, 178, 46, label, { fill: i === focus ? C.accSoft : C.card, stroke: i === focus ? C.acc : C.ink2, size: 12 });
    d.text(x + 89, y + 68, notes[i] || '', { cls: 'sm', size: 10.5, vc: true });
    if (i < labels.length - 1) {
      if (i % 3 < 2) {
        const x1 = r % 2 ? x - 4 : x + 182, x2 = r % 2 ? x - 28 : x + 205;
        d.arrow(x1, y + 23, x2, y + 23, { stroke: C.gray, hl: 6 });
        d.flowline([[x1, y + 23], [x2, y + 23]], { color: C.acc, sw: 1.1, gap: 8, dur: 2.4 });
      } else {
        d.arrow(x + 89, y + 82, x + 89, y + 108, { stroke: C.gray, hl: 6 });
        d.flowline([[x + 89, y + 82], [x + 89, y + 108]], { color: C.acc, sw: 1.1, gap: 8, dur: 2.4 });
      }
    }
  });
  return d.svg();
}
export function cards(id, kicker, entries, focus = 0) {
  const d = canvas(id, kicker, 56 + Math.ceil(entries.length / 2) * 94);
  entries.forEach(([title, detail], i) => {
    const x = 20 + i % 2 * 310, y = 48 + Math.floor(i / 2) * 94;
    d.rect(x, y, 290, 76, { fill: i === focus ? C.accFaint : C.card, stroke: i === focus ? C.acc : C.line });
    d.text(x + 14, y + 20, title, { cls: 'ttl', a: 'start' });
    d.text(x + 14, y + 47, detail, { cls: 'sm', size: 11, a: 'start', vc: true });
  });
  return d.svg();
}
export function ledger(id, kicker, headers, rows, focus = -1) {
  const widths = headers.length === 2 ? [205, 395] : headers.length === 3 ? [170, 215, 215] : Array(headers.length).fill(600/headers.length);
  const d = canvas(id, kicker, 95 + rows.length * 36);
  let x = 20;
  headers.forEach((s,i) => { d.text(x+12,52,s,{cls:'ttl',a:'start'}); x+=widths[i]; });
  rows.forEach((row,r) => {
    const y = 72 + r*36;
    if(r === focus) d.fillRect(20,y-14,600,32,C.accFaint);
    let x = 20;
    row.forEach((s,c) => { d.text(x+12,y+2,String(s),{cls:'mono',size:10.5,a:'start', color:r === focus ? C.acc : C.ink}); x+=widths[c]; });
    d.line(20,y+20,620,y+20,{stroke:C.faint,single:true,sw:0.6});
  });
  return d.svg();
}
export function lanes(id,kicker,left,right,events,footer='') {
  const d=canvas(id,kicker,115+events.length*42);
  d.text(110,48,left,{cls:'ttl'}); d.text(530,48,right,{cls:'ttl'});
  const end=76+events.length*42;
  [110,530].forEach(x=>d.line(x,66,x,end,{stroke:C.line,single:true}));
  events.forEach(([direction,label],i)=>{
    const y=88+i*42, on=i===0;
    d.arrow(direction>0?115:525,y,direction>0?525:115,y,{stroke:on?C.acc:C.gray,hl:7});
    d.text(320,y-12,label,{cls:'mono',size:11});
  });
  if(footer)d.hand(320,end+24,footer,{size:16});
  return d.svg();
}
export function map(id, stages, stage = 99) { return routeMap(id, stages, stage); }
export function cover(id, title, subtitle, stations, chapter) {
  const d = new D(640, 830, id);
  d.text(10, 16, `FUNDAMENTALS / CHAPTER ${chapter} / FIELD GUIDE`, { cls: 'cap', a: 'start' });
  title.forEach((s, i) => d.text(40, 103 + i * 65, s, { a: 'start', size: 48, w: 600 }));
  subtitle.forEach((s, i) => d.text(42, 234 + i * 22, s, { a: 'start', size: 13 }));
  coverArtwork(d, id, 328);
  d.line(42, 672, 598, 672, { stroke: C.line, single: true });
  stations.forEach(([s, detail], i) => {
    const x = 43 + i % 2 * 292, y = 704 + Math.floor(i / 2) * 53;
    d.text(x, y, s, { a: 'start', cls: 'ttl', size: 12 });
    d.text(x, y + 18, detail, { a: 'start', cls: 'sm', size: 10.5 });
  });
  return d.svg();
}
