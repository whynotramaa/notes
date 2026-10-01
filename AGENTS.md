# Notes for teaching on X

This workspace holds visual teaching notes for sharing on X. The rules below apply to every folder in it.

## Direction

- Visuals first, with full plain-language explanations. A page is a large title, a short lede, an intro (`.say.intro`) on where the chapter fits, and diagrams. Every `h2` gets a short `.say` lead-in, every diagram a `figcaption.say` saying what it shows, what to try and how it fits the whole model, and every edge card a `<p>` on what goes wrong.
- Write explanations conversationally, as a person would explain it to a friend. Easy words, jargon explained the first time it appears, enough context and no more. Skip what is already obvious.
- No frames. Diagrams sit directly on the page with no border, card, background or dot grid.
- Spacious and cinematic. Heroes fill the first screen and rise in on load, sections sit a full `--gap` apart.
- Hand-drawn style lives only inside diagrams: SVG ink strokes, wobble filter, Gaegu labels. Type, navigation, buttons and controls stay clean and crisp.
- Generous space. Large gaps between sections and figures, wide diagrams (up to 1280px), text capped near 680px.
- Show data with room to breathe. Prefer tiles, rounded bars and large labels over dense grids and small numbers.

## Type and colour

- Poppins for body text and UI. Behind The Nineties for titles, headings, card names and diagram titles. Neither has an italic, so do not italicise them. Geist Mono for data. Gaegu only inside SVG. All self-hosted woff2 in `public/fonts`.
- Colours are OKLCH tokens in `public/ink.css`. Dark mode is not an inverted light mode: the background shifts to a cool blue-black (hue 265), accents rotate about 12° in hue, drop chroma by about 25% and gain lightness, and text is warm off-white rather than pure white.

## Structure

- One Astro project at the workspace root, deployed to notes.ramaa.tech. URLs follow folders: `/` lists series, `/octlm/` lists that series' notes, `/octlm/attention/` is a note's map, `/octlm/attention/05-rope` a chapter.
- A series is `src/pages/<series>/_series.js` (title, sub, hue). A note is a folder `src/pages/<series>/<note>/` with `_note.js` (site and chapters) plus one `.astro` page per chapter. `src/data/notes.js` finds both by glob, so adding a folder is enough.
- Every page uses `src/layouts/Note.astro`, `public/ink.css` and `public/ink.js`. The layout reads the URL to pick the note, the breadcrumb, contents and pager.
- Navigation is a slim top bar with breadcrumbs (notes / series / note), a contents overlay (native `<dialog>`) on note pages, a motion pause button and a theme toggle.
- Respect reduced motion and keep every teaching diagram complete without animation.
- `octlm/octlm-day01` is the old static prototype and is not part of the site.
