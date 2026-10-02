# Field guides for teaching on X

This workspace holds long-form, hand-drawn field guides in the style of the `field-guide-explainer` skill. The rules below apply to every folder in it.

## Direction

- Each note is a book chapter: a cover, front matter ("How to read this chapter", running-example spec table), 7 to 13 parts, and an interview page (question bank, graded exercises, worked solutions).
- Each part opens with `@part` (roman numeral, title, three-sentence blurb, `where:N` map) and ends with a `:::key In one breath` box.
- Sections are numbered `## N. Title`, continuous across the whole note. Each climbs the explanation ladder: hook, problem, intuition, mechanism, worked example with computed numbers, formula read out loud, figure, costs, edge cases, history, interview lens.
- Write for a smart reader from another field: plain words, every term defined in bold once, prose not bullets, no em or en dashes, none of the banned phrases in the skill.
- Every number in prose, figures, tables and solutions is computed, never estimated. Illustrative values are labelled as such in the caption.
- Running examples: Finch-19 (2019 recipe, 42,128,384 parameters) in day 1, Finch-24 (2024 recipe, 40,509,952) in day 2. Real-model numbers use Llama 3 8B.

## Figures

- Figures are functions in `src/figs/pNN.js` that return SVG strings, drawn with rough.js through `src/lib/draw.js`. Canvas width 640, a `cap` kicker at (10, 16), labels beside what they label, at most two `hand` notes.
- Colours come from the `C` object, which maps to CSS variables (`--f-*` in `src/styles/site.css`), so every figure follows light and dark mode. One accent (orange) per figure; slate only for a second series.
- Ids are snake_case and unique across all figure files. Each note has one `where_*` map and one `cover_*`.

## Structure

- One Astro project, deployed to notes.ramaa.tech. URLs: `/` lists series, `/octlm/` lists its guides, `/octlm/attention/` is a guide's front matter and map, `/octlm/attention/05-rope` a part.
- Content lives in `src/content/<series>/<note>/`: `_note.js` (metadata, cover and map figure names), `_front.md`, and one `NN-slug.md` per part, built in filename order. `src/content/<series>/_series.js` describes a series. `src/data/notes.js` finds everything by glob, so adding a folder is enough.
- `src/lib/md.js` renders the markdown dialect (`@part`, `@fig`, `@chapter`, `:::box`, KaTeX math) at build time. `src/layouts/Book.astro` provides the top bar, contents sidebar with scrollspy, theme toggle and pager; `public/site.js` drives them.
- Fonts are Syne, IBM Plex Sans and Mono, and Caveat, self-hosted through `@fontsource` packages.
- `octlm/octlm-day01` is the old static prototype and is not part of the site.
