import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import * as additions from '../src/figs/p28.js';

const figures = new Set();
for (const file of await readdir(new URL('../src/figs/', import.meta.url))) {
  for (const name of Object.keys(await import(`../src/figs/${file}`))) {
    assert(!figures.has(name), `Duplicate figure: ${name}`);
    figures.add(name);
  }
}
for (const [name, draw] of Object.entries(additions)) {
  const svg = draw();
  assert.match(svg, /viewBox="0 0 640 \d+"/);
  assert.match(svg, /x="10" y="16" class="cap"/);
  assert(!/NaN|Infinity|undefined/.test(svg), `Invalid geometry: ${name}`);
  assert((svg.match(/class="hand"/g) || []).length <= 2, name);
}
const unescape = html => html.replace(/<[^>]*>/g, '').replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
for (const note of ['attention', 'modern-arch']) {
  for (const file of await readdir(`src/content/octlm/${note}`)) {
    if (!/^\d.*\.md$/.test(file)) continue;
    const source = await readFile(`src/content/octlm/${note}/${file}`, 'utf8');
    const html = await readFile(`dist/octlm/${note}/${file.slice(0, -3)}/index.html`, 'utf8');
    for (const [, name] of source.matchAll(/^@fig (\w+)/gm)) {
      assert(figures.has(name), `Missing figure: ${name}`);
      assert(html.includes(`id="fig-${name}"`), `Unrendered figure: ${name}`);
    }
    const expected = [...source.matchAll(/```\w*\n([\s\S]*?)```/g)].map(m => m[1].replace(/\n$/, ''));
    const actual = [...html.matchAll(/<pre\b[^>]*><code>([\s\S]*?)<\/code><\/pre>/g)].map(m => unescape(m[1]));
    assert.deepEqual(actual, expected, `Code changed while rendering: ${note}/${file}`);
    assert(!html.includes('class="err"'), `Render error: ${file}`);
  }
}
console.log(`Checked ${Object.keys(additions).length} new diagrams, figure references and exact code rendering in both guides.`);

// Exercise the delegated copy handler without a browser or clipboard permission.
const { runInNewContext } = await import('node:vm');
const handlers = {}, label = { textContent: 'Copy' };
const code = 'def f(x):\n    return "<tag>"  # preserve indentation\n';
const button = { disabled: false, querySelector: () => label, closest: () => ({ querySelector: () => ({ textContent: code }) }) };
let copied, reset;
const navigator = { clipboard: { writeText: async text => { copied = text; } } };
runInNewContext(await readFile('public/site.js', 'utf8'), {
  document: {
    documentElement: { scrollHeight: 100, clientHeight: 100 },
    getElementById: () => ({ addEventListener() {} }),
    querySelector: selector => selector === '.progress-bar' ? { style: {} } : null,
    addEventListener: (type, callback) => { handlers[type] = callback; },
  }, navigator, setTimeout: callback => { reset = callback; },
});
const event = { target: { closest: () => button } };
await handlers.click(event);
assert.equal(copied, code);
assert.equal(label.textContent, 'Copied');
assert.equal(button.disabled, true);
reset();
navigator.clipboard.writeText = async () => { throw new Error('Denied'); };
await handlers.click(event);
assert.equal(label.textContent, 'Copy failed');
reset();
assert.equal(label.textContent, 'Copy');
assert.equal(button.disabled, false);
console.log('Checked copy success, failure and feedback reset.');
