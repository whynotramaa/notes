import { partOf, sectionsOf, figCount } from '../lib/md.js';

const S = import.meta.glob('../content/*/_series.js', { eager: true });
const N = import.meta.glob('../content/*/*/_note.js', { eager: true });
const M = import.meta.glob('../content/*/*/*.md', { eager: true, query: '?raw', import: 'default' });
const seg = (p, i) => p.split('/')[i];

function chaptersOf(sl, nl, base) {
  let figStart = 0;
  return Object.entries(M)
    .filter(([p]) => seg(p, 2) === sl && seg(p, 3) === nl && !seg(p, 4).startsWith('_'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, md]) => {
      const slug = seg(p, 4).replace(/\.md$/, '');
      const part = partOf(md);
      const c = { slug, href: base + slug, md, part, title: part ? part.title : 'Interview prep', blurb: part?.blurb ?? '', sections: sectionsOf(md), extras: [...md.matchAll(/^@chapter\s+([^|]+)\|\s*([^|]+)/gm)].map((m) => ({ id: m[1].trim(), title: m[2].trim() })), figStart };
      figStart += figCount(md);
      return c;
    });
}

export const series = Object.entries(S).map(([p, s]) => {
  const slug = seg(p, 2);
  const notes = Object.entries(N)
    .filter(([q]) => seg(q, 2) === slug)
    .map(([q, n]) => {
      const nslug = seg(q, 3), base = `/${slug}/${nslug}/`;
      const front = M[`../content/${slug}/${nslug}/_front.md`] ?? '';
      return { ...n.site, slug: nslug, base, front, chapters: chaptersOf(slug, nslug, base) };
    })
    .sort((a, b) => a.order - b.order);
  return { ...s, slug, base: `/${slug}/`, notes };
});

export const allNotes = series.flatMap((s) => s.notes.map((n) => ({ ...n, series: s })));
