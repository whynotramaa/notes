const S = import.meta.glob('../pages/*/_series.js', { eager: true });
const N = import.meta.glob('../pages/*/*/_note.js', { eager: true });
const seg = (p, i) => p.split('/')[i];

export const series = Object.entries(S).map(([p, s]) => {
  const slug = seg(p, 2);
  const notes = Object.entries(N)
    .filter(([q]) => seg(q, 2) === slug)
    .map(([q, n]) => ({ ...n.site, chapters: n.chapters, slug: seg(q, 3), base: `/${slug}/${seg(q, 3)}/` }))
    .sort((a, b) => a.order - b.order);
  return { ...s, slug, base: `/${slug}/`, notes };
});

export const noteAt = path => series.flatMap(s => s.notes.map(n => ({ ...n, series: s }))).find(n => (path + '/').startsWith(n.base));
