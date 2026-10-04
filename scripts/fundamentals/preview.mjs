import { writeFile } from 'node:fs/promises';
import * as figures from '../../src/figs/p80.js';
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(figures).filter(n => n.startsWith('dbms_'));
await writeFile('public/fundamentals-review.html', `<!doctype html><html><head><title>Figure review</title><link rel="stylesheet" href="/src/styles/site.css"><style>body{margin:20px;background:var(--paper);color:var(--ink)}main{display:grid;grid-template-columns:repeat(2,640px);gap:20px}figure{margin:0}svg{width:640px}</style></head><body><main>${names.map(n => `<figure><p>${n}</p>${figures[n]()}</figure>`).join('')}</main></body></html>`);
console.log(`Previewing ${names.length} figures at /fundamentals-review.html`);
