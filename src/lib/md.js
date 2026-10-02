import { marked } from 'marked';
import katex from 'katex';

const mods = import.meta.glob('../figs/*.js', { eager: true });
export const figs = Object.assign({}, ...Object.keys(mods).sort().map((k) => mods[k]));

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const romanToInt = (r) => { const m = { I: 1, V: 5, X: 10, L: 50 }; let t = 0; for (let i = 0; i < r.length; i++) { const a = m[r[i]], b = m[r[i + 1]] || 0; t += a < b ? -a : a; } return t; };

function renderMath(src, display) {
  try { return katex.renderToString(src, { displayMode: display, throwOnError: true, strict: false, output: 'htmlAndMathml' }); }
  catch (e) { console.error('KaTeX error:', src, e.message); return `<span class="err">${escHtml(src)}</span>`; }
}

marked.setOptions({ gfm: true, breaks: false });
const inline = (s) => marked.parseInline(s);

export function sectionsOf(md) {
  const out = [];
  for (const m of md.matchAll(/^## (\d+)\.\s+(.*)$/gm)) out.push({ num: m[1], title: m[2], id: 's' + m[1] });
  return out;
}
export const figCount = (md) => (md.match(/^@fig /gm) || []).length;

export function partOf(md) {
  const m = md.match(/^@part\s+(.*)$/m);
  if (!m) return null;
  const [num, title, blurb, fig] = m[1].split('|').map((s) => s.trim());
  return { num, n: romanToInt(num), title, blurb, fig };
}

export function render(md, { where, figStart = 0, chapterNumber = 1 } = {}) {
  let figNo = figStart;
  const ph = [];
  const put = (html) => { ph.push(html); return `XPHX${ph.length - 1}XPHX`; };
  md = md.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => '\n\n' + put(`<div class="code-wrap"><pre class="code ${lang}"><code>${escHtml(code.replace(/\n$/, ''))}</code></pre></div>`) + '\n\n');
  md = md.replace(/`([^`\n]+)`/g, (m, code) => put(`<code>${escHtml(code)}</code>`));
  md = md.replace(/\$\$([\s\S]+?)\$\$/g, (m, t) => '\n\n' + put(`<div class="eq">${renderMath(t.trim(), true)}</div>`) + '\n\n');
  md = md.replace(/\$([^$\n]+?)\$/g, (m, t) => put(renderMath(t, false)));

  const lines = md.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    let m;
    if ((m = L.match(/^@part\s+(.*)$/))) {
      const [num, title, blurb, fig] = m[1].split('|').map((s) => s.trim());
      let art = '';
      if (fig && fig.startsWith('where:') && where && figs[where]) art = figs[where](+fig.split(':')[1]);
      else if (fig && figs[fig]) art = figs[fig]();
      out.push('', put(`<section class="part-opener" id="top-part">
  <div class="kicker">Part ${num}</div>
  <div class="part-num">${String(romanToInt(num)).padStart(2, '0')}</div>
  <h1 class="part-title">${inline(title)}</h1>
  <p class="part-blurb">${inline(blurb || '')}</p>
  ${art ? `<div class="part-art fig-scroll">${art}</div>` : ''}
</section>`), '');
    } else if ((m = L.match(/^@chapter\s+(.*)$/))) {
      const [key, title, blurb] = m[1].split('|').map((s) => s.trim());
      out.push('', put(`<section class="part-opener extra" id="${key}">
  <div class="kicker">Back matter</div>
  <h1 class="part-title">${inline(title)}</h1>
  <p class="part-blurb">${inline(blurb || '')}</p>
</section>`), '');
    } else if ((m = L.match(/^@fig\s+(.*)$/))) {
      const [id, cap, mode] = m[1].split('|').map((s) => s.trim());
      figNo++;
      let svg;
      if (figs[id]) { try { svg = figs[id](); } catch (e) { console.error('FIG ERROR', id, e); svg = `<div class="err">figure error: ${id}</div>`; } }
      else { console.error('Missing figure:', id); svg = `<div class="err">missing figure: ${id}</div>`; }
      out.push('', put(`<figure class="${mode || ''}" id="fig-${id}"><div class="fig-scroll">${svg}</div><figcaption><a class="fignum" href="#fig-${id}">Figure ${chapterNumber}.${figNo}</a>${inline(cap || '')}</figcaption></figure>`), '');
    } else if ((m = L.match(/^:::(\w+)\s*(.*)$/))) {
      const kind = m[1], title = m[2];
      const body = [];
      i++;
      while (i < lines.length && !lines[i].match(/^:::\s*$/)) { body.push(lines[i]); i++; }
      out.push('', put(`<aside class="box ${kind}"><div class="box-h">${inline(title || kind)}</div>${marked.parse(body.join('\n'))}</aside>`), '');
    } else if ((m = L.match(/^## (\d+)\.\s+(.*)$/))) {
      const num = m[1], title = m[2], id = 's' + num;
      out.push('', put(`<h2 class="sec" id="${id}"><a class="anchor" href="#${id}" aria-label="Link to section ${num}">#</a><span class="secnum">Section ${num}</span>${inline(title)}</h2>`), '');
    } else if ((m = L.match(/^### (.*)$/))) {
      const id = 'h-' + slug(m[1]) + '-' + i;
      out.push('', put(`<h3 id="${id}">${inline(m[1])}</h3>`), '');
    } else out.push(L);
  }
  let html = marked.parse(out.join('\n'));
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  for (let k = 0; k < 4; k++) {
    html = html.replace(/<p>\s*(XPHX\d+XPHX)\s*<\/p>/g, '$1');
    html = html.replace(/XPHX(\d+)XPHX/g, (mm, n) => ph[+n]);
  }
  return smartSafe(html);
}

function smart(html) {
  const parts = html.split(/(<[^>]+>)/);
  let skip = 0, prev = ' ';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('<')) {
      if (/^<\/?(p|div|h\d|li|td|th|aside|figcaption|br|section|ul|ol|table|tr|figure)[\s>\/]/.test(p)) prev = ' ';
      if (/^<(code|pre|svg|style|script)[\s>]/.test(p)) skip++;
      else if (/^<\/(code|pre|svg|style|script)>/.test(p)) skip = Math.max(0, skip - 1);
      continue;
    }
    if (skip) continue;
    const s = p.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    let res = '';
    for (let j = 0; j < s.length; j++) {
      const ch = s[j], before = j > 0 ? s[j - 1] : prev;
      if (ch === '"') res += /[\s(\[{-]/.test(before) ? '“' : '”';
      else if (ch === "'") res += /[\s(\[{-]/.test(before) ? '‘' : '’';
      else res += ch;
    }
    parts[i] = res;
    if (s.length) prev = s[s.length - 1];
  }
  return parts.join('');
}

function smartSafe(html) {
  const keep = [];
  html = html.replace(/<span class="katex[\s\S]*?<\/annotation><\/semantics><\/math><\/span>/g, (m) => { keep.push(m); return `KTXK${keep.length - 1}KTXK`; });
  html = smart(html);
  return html.replace(/KTXK(\d+)KTXK/g, (m, n) => keep[+n]);
}

export { inline };
