# Prompt: build in the "inked notebook" drawing style

You are building UI and illustrations in a specific hand-drawn style. Treat everything below as the spec. Read all of it before you draw anything. The look comes from a few cheap tricks stacked together. Skip one and the drawings start to look like clip art.

The stack is plain React + SVG + CSS. No canvas, no animation library, no rough.js, no external illustration assets. Every drawing is hand-authored SVG path data.

## 1. The feeling

Drawings should look like a quick marker sketch on a sticky note that someone then coloured in with a highlighter, slightly outside the lines. Specifically:

- A soft pastel blob sits behind each drawing, like a highlighter swipe.
- White "paper" shapes sit on top of the blob.
- One saturated accent fill picks out the important bit.
- A dark ink line, 2.3px, round caps, draws over everything. The line is never perfectly straight because an SVG turbulence filter pushes it around.
- Handwritten labels and small monospace annotations sit inside the drawing, often tilted a few degrees.
- On hover the drawing redraws itself stroke by stroke, and the ink "boils" (the wobble jitters frame to frame, like a hand-drawn animation loop).
- Some drawings have small looping life in them. A delivery scooter bobs, steam rises, a wheel spins, a clock hand gets stuck.

The tone is playful and a bit self-deprecating, never cute-for-cute's-sake. Every drawing depicts a real idea (a scoreboard, a search index, a terminal prompt, a funnel), with labels that carry the joke.

## 2. Colour system

All colour comes from a handful of CSS custom properties. Drawings never hardcode colours. Each drawing or card sets one hue number, `--h`, and the lightness/chroma pairs below turn that hue into a blob colour, an accent colour, and a tint.

```css
:root {
  --bg: #fafaf9;
  --surface: #ffffff;
  --sunken: #f3f3f1;
  --ink: #141414;
  --muted: #666663;
  --faint: #a3a3a0;
  --line: rgb(20 20 20 / 0.09);
  --line-2: rgb(20 20 20 / 0.18);

  --blob: 0.88 0.075;      /* pastel highlighter behind drawings */
  --pop: 0.72 0.15;        /* saturated accent fill */
  --tint-bg: 0.965 0.02;   /* near-white tinted card background */
  --tint-ink: 0.47 0.13;   /* tinted text */
  --tint-line: 0.9 0.045;  /* tinted border */

  --wob: 16px 22px 14px 24px / 22px 14px 24px 16px;  /* uneven, hand-cut corners */
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="dark"] {
  --bg: #0c0c0d;
  --surface: #151516;
  --sunken: #111112;
  --ink: #ececea;
  --muted: #9a9a96;
  --faint: #5c5c59;
  --blob: 0.36 0.06;
  --pop: 0.66 0.14;
  --tint-bg: 0.25 0.035;
  --tint-ink: 0.84 0.09;
  --tint-line: 0.33 0.05;
}
```

Use it as `oklch(var(--blob) var(--h))`, `oklch(var(--pop) var(--h))`. Hues used in the original: 25 (tomato red, also the "brand" pop), 85 (mustard), 150 (green), 195 (teal), 250 (blue), 300 (violet). Rotate through them across sibling cards so a grid reads as a set of different coloured stickers. Red at hue 25 is reserved for emphasis marks (strike-throughs, X-outs, stamps, quote bars).

Dark mode just works because ink flips to near-white, paper flips to near-black, and the blob drops in lightness. Never write a separate dark drawing.

## 3. Fonts

Four roles, and each has a clear job.

- `--hand` is a handwriting font (the original uses "Peehu", fallback `"Segoe Print", "Bradley Hand", cursive`). Use it for labels inside drawings, captions, asides, little notes, arrows like `→` and `↙` used as bullets.
- `--mono` (Geist Mono) is for tiny data annotations inside drawings: `18.4 ov · need 21`, `retry 2/3`, `< 5M params`. Size 10 to 13px. It is the "printed" counterpart to the handwriting.
- `--serif` (a display serif) is for big numbers and titles: `142/3`, `#1`, card headings.
- A plain sans for body copy.

The contrast between scrawled handwriting and tight mono annotations inside the same drawing is a core part of the look.

## 4. The wobble filter

This is the single most important trick. One SVG filter displaces every pixel of the ink using low-frequency fractal noise, so straight lines bend slightly and corners go soft, the way a felt-tip pen does.

```tsx
<filter id={id}>
  <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={seed}>
    {boil && (
      <animate attributeName="seed" values="1;4;7;10" dur="0.6s" calcMode="discrete" repeatCount="indefinite" />
    )}
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" scale={3.4} />
</filter>
```

Rules for the filter:

- `baseFrequency` 0.03 and `scale` 3 to 3.4. Higher scale looks drunk, lower looks like a vector. Stay in this range.
- Give each drawing its own filter id and a different `seed` so two drawings never wobble identically.
- "Boil" is the animated version. It steps the `seed` through four discrete values every 0.6s with `calcMode="discrete"`. Discrete is the point. It should look like 4 hand-traced frames on loop, not a smooth morph. Turn boil on only while the drawing is hovered or active.
- Also put one shared filter (`id="ink-edge"`, seed 3, scale 3) in a zero-size hidden `<svg>` at the page root. CSS uses it for card borders, stamps, and progress bars.

## 5. Anatomy of a drawing

Every illustration uses a `400 × 280` viewBox (small icons use `120 × 90`) and is described as data, not JSX:

```ts
type Label = { x: number; y: number; t: string; s: number; font?: "hand" | "mono"; r?: number; start?: boolean };
type Drawing = { view?: string; blob: string; paper?: string[]; accent?: string[]; ink: string[]; labels?: Label[] };
```

Render order, back to front:

1. `blob`, one closed organic shape, filled with `oklch(var(--blob) var(--h))`. It is **outside** the wobble filter, so it stays smooth like a highlighter swipe.
2. Everything else goes in one `<g filter="url(#id)">`:
   - `paper` shapes, filled `var(--surface)`, no stroke. They knock the blob out so the drawing reads as objects sitting on the colour.
   - `accent` shapes, filled `oklch(var(--pop) var(--h))`. Usually one or two small things: a ball, a highlighted row, a play button, a lightning bolt.
   - `ink` paths, stroke only. Each gets `pathLength={1}` and `style={{"--k": index}}` for the draw-on stagger.
   - `labels` as `<text>`, with optional `rotate(r x y)`.

```tsx
<svg className="sketch" viewBox={d.view ?? "0 0 400 280"} aria-hidden="true">
  <defs>{/* filter from section 4 */}</defs>
  <path className="sk-blob" d={d.blob} />
  <g filter={`url(#${id})`}>
    {d.paper?.map((p, k) => <path key={k} className="sk-paper" d={p} />)}
    {d.accent?.map((p, k) => <path key={k} className="sk-accent" d={p} />)}
    {d.ink.map((p, k) => <path key={k} className="sk-ink" d={p} pathLength={1} style={{ "--k": k }} />)}
    {d.labels?.map((l) => (
      <text key={l.t} className={`sk-label sk-${l.font ?? "hand"}`} x={l.x} y={l.y} fontSize={l.s}
        textAnchor={l.start ? "start" : "middle"}
        transform={l.r ? `rotate(${l.r} ${l.x} ${l.y})` : undefined}>{l.t}</text>
    ))}
  </g>
</svg>
```

```css
.sketch { display: block; width: 100%; height: 100%; overflow: visible; }
.sk-blob { fill: oklch(var(--blob) var(--h)); transform-box: fill-box; transform-origin: center; }
.sk-paper { fill: var(--surface); }
.sk-accent { fill: oklch(var(--pop) var(--h)); }
.sk-ink { fill: none; stroke: var(--ink); stroke-width: 2.3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; }
.sk-label { fill: var(--ink); }
.sk-hand { font-family: var(--hand); }
.sk-mono { font-family: var(--mono); }
```

A paper or accent shape that also needs an outline appears twice, once in `paper`/`accent` (fill) and again in `ink` (stroke). Fills and strokes are always separate paths.

### Budget per drawing

- 1 blob
- 1 to 5 paper shapes
- 1 to 3 accents (a scatter of tiny dots counts as one)
- 8 to 20 ink strokes
- 1 to 4 labels

More than that and it stops looking quick.

## 6. How to draw the paths

This is where the scribbleness comes from, before the filter even runs. Hand-write the coordinates and break geometric perfection on purpose.

**Rectangles are never rectangles.** Each corner is off by 1 to 6px so edges tilt slightly.

```
M152 52 328 47 333 158 149 163Z      // a scoreboard, top edge rises 5px
M88 72 210 62 222 220 102 230Z       // a page, visibly skewed
```

For diagram code there is a helper that nudges two corners by a pixel:

```ts
const box = (x, y, w, h) => `M${x} ${y} ${x + w} ${y - 1} ${x + w + 1} ${y + h} ${x - 1} ${y + h + 1}Z`;
```

**Blobs** are four-segment cubic loops using `C` then `S`, so they are smooth and lumpy. Each blob is different. It should overflow the drawing's main object a bit on every side.

```
M62 160C48 96 110 44 196 50S338 58 352 128 318 236 214 244 76 224 62 160Z
```

**"Straight" lines inside objects are gentle curves** that drift a few px over their length. Text lines in a document, for example:

```
M160 80C210 78 270 80 324 77
M222 120C240 118 262 118 284 117
```

**Ground lines** run past the object and wobble, like a pen dragged across a page.

```
M36 238C120 232 262 243 372 236
```

**Circles** use a two-arc helper so they can take `pathLength` and animate.

```ts
const o = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
```

**Arrows** are a line plus a two-stroke head at ±0.5 rad, 10px long.

```ts
const arr = (x1, y1, x2, y2) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (d) => `${(x2 - 10 * Math.cos(a + d)).toFixed(1)} ${(y2 - 10 * Math.sin(a + d)).toFixed(1)}`;
  return `M${x1} ${y1} ${x2} ${y2}M${h(0.5)} ${x2} ${y2} ${h(-0.5)}`;
};
```

Hand-drawn curved arrows are a curve ending at a point, then two short strokes back from that point: `M118 52C168 12 232 10 276 44`, `M276 44 260 43`, `M276 44 270 29`.

**Recurring marks** that make it feel drawn by a person:

- Motion lines. Three short parallel strokes behind something moving (`M76 96 98 101`, `M66 110 94 111`, `M78 124 100 119`), each a slightly different length and angle.
- Emphasis ticks. Two or three tiny strokes radiating off a corner, like a "ding" (`M346 64 354 50`, `M340 76 356 71`, `M348 86 360 92`).
- Steam or smell squiggles, `M208 138c-6-8 6-12 0-20`.
- Wavy hatching for ribbons or film strips, two parallel S-curves with short vertical ties between them.
- A checkmark as `M304 218 316 230 338 204`.
- Pixel specks. A cluster of 40-odd tiny 3.4px squares scattered with a deterministic hash (never `Math.random`, so server and client render the same):

```ts
const rand = (a, b) => { const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return n - Math.floor(n); };
const specks = Array.from({ length: 46 }, (_, i) =>
  `M${(52 + rand(i, 1) * 92).toFixed(1)} ${(88 + rand(i, 2) * 88).toFixed(1)}h3.4v3.4h-3.4z`).join("");
```

**Labels** carry the personality. Handwritten words go at 18 to 30px, tilted between -10° and +10° (`"brake!"` at -10°, `"#1"` at +8°, `"tonight?"` at -8°). Mono annotations go at 10 to 13px and stay level, like printed data. A drawing of a terminal gets `> rm -rf ./everything` and a hand-scrawled `brake!` next to it. Do that kind of thing.

## 7. Animation

There are four kinds of motion. Use all four.

### 7a. Draw-on (the main one)

Every ink path has `pathLength={1}` and `stroke-dasharray: 1`. Animating `stroke-dashoffset` from 1 to 0 makes the pen trace the stroke. Each stroke starts 45ms after the previous one using its `--k` index, so the drawing builds up in the order the paths are listed. **List ink paths in the order a person would draw them**: main object outline first, inner details next, ground line, then the little flourishes last.

On hover the card replays the whole drawing. The blob pops in, the paper fades in, the ink traces, and the labels fade in last.

```css
@media (hover: hover) {
  .redraw:is(:hover, :focus-within) .sk-blob { animation: blob-in 0.9s var(--ease) both; }
  .redraw:is(:hover, :focus-within) :is(.sk-paper, .sk-accent) { animation: fade-in 0.5s 0.1s both; }
  .redraw:is(:hover, :focus-within) .sk-ink { animation: ink 1s var(--ease) calc(0.12s + var(--k) * 45ms) both; }
  .redraw:is(:hover, :focus-within) .sk-label { animation: fade-in 0.5s 0.6s both; }
}
@keyframes ink { from { stroke-dashoffset: 1; } }
@keyframes fade-in { from { opacity: 0; } }
@keyframes blob-in { from { scale: 0.8; opacity: 0; } }
```

On touch devices, tie the draw-on to scroll with a scroll-driven animation so it draws as it enters the viewport:

```css
@supports (animation-timeline: view()) {
  @media (hover: none) and (prefers-reduced-motion: no-preference) {
    .redraw .sk-ink { animation: ink linear both; animation-timeline: view(); animation-range: entry 10% cover 40%; }
  }
}
```

Long-form diagrams in articles always use the scroll-driven version (`entry 5% cover 35%`) on every device.

### 7b. Boil

While hovered, the parent passes `boil={true}`, and the turbulence seed steps through 4 frames at 0.6s. The drawing shimmers as if re-traced. It must use discrete steps and stay subtle.

### 7c. Idle life

Small looping animations on `<g>` groups inside a drawing. Each one is tiny and has its own period so they never sync up.

```css
.bob   { animation: bob 0.45s ease-in-out infinite alternate; }   /* scooter on a bumpy road */
.wheel { transform-box: fill-box; transform-origin: center; animation: spin 0.6s linear infinite; }
.steam { animation: steam 1.8s ease-in-out infinite; }
.speed { animation: speed 0.7s linear infinite; }                  /* motion lines streaming back */
.hand  { animation: spin 4s linear infinite; }                     /* clock hand */
.stuck { animation: stuck 1.2s var(--ease) infinite; }             /* clock hand that tries and fails */
.rock  { animation: rock 2.6s ease-in-out infinite alternate; }

@keyframes bob   { to { translate: 0 -3px; } }
@keyframes spin  { to { rotate: 360deg; } }
@keyframes steam { 0% { opacity: 0; translate: 0 4px; } 50% { opacity: 1; } 100% { opacity: 0; translate: 0 -8px; } }
@keyframes speed { from { translate: 6px 0; opacity: 1; } to { translate: -14px 0; opacity: 0; } }
@keyframes stuck { 0%, 100% { rotate: 0deg; } 30% { rotate: 14deg; } 60% { rotate: -4deg; } }
@keyframes rock  { from { rotate: -3deg; } to { rotate: 3deg; } }
```

For rotating parts inside an SVG, set `transform-origin` in user-space px inline (`style={{ transformOrigin: "330px 78px" }}`).

Data moving through a diagram is a small accent-filled circle with an ink outline, riding `<animateMotion>` along an invisible path:

```tsx
<circle className="sk-accent" r={5} style={{ stroke: "var(--ink)", strokeWidth: 1.5 }}>
  <animateMotion dur="3s" repeatCount="indefinite" path="M60 80H660" />
</circle>
```

Rows that reorder (a ranking changing) use stepped keyframes with long holds. They sit still, swap, sit still, swap, for example `0%, 28% { translate: 0 0 } 34%, 61% { translate: 0 46px } ...` over 7.5s.

### 7d. Physical UI motion

UI elements behave like paper objects.

- **Stamp.** Starts at `scale: 2.2; rotate: -20deg; opacity: 0` and slams down with an overshoot curve `cubic-bezier(0.3, 1.6, 0.5, 1)` over 0.5s. Used for badges, popups, and "out!" messages.
- **Jiggle on hover.** `20% { rotate: 5deg; scale: 1.06 } 45% { rotate: -4deg } 70% { rotate: 2deg } 100% { rotate: 6deg; scale: 1.04 }`.
- **Thunk on click.** Squash to 0.86, overshoot to 1.08.
- **Ink splatter.** Several `radial-gradient` dots in the accent colour around a stamp, scaling from 0.6 to 1 with a springy curve on hover.
- **Draggable cutouts.** Pinned cards rotate a few degrees at rest, straighten and scale to 1.06 while dragged, and do a small squash (`40% { scale: 0.97 }`) when dropped.
- **Hand-drawn underline.** A wavy SVG path (`M2 9C14 3 24 13 36 8S58 3 70 8...`) with `vector-effect: non-scaling-stroke`, drawn on with the same dashoffset trick.

All motion respects `prefers-reduced-motion: reduce` by switching animations off. Drawings must look complete and correct when nothing animates.

## 8. The UI around the drawings

The same language carries into HTML elements so drawings do not sit inside sterile boxes.

**Inked cards.** The border is a pseudo-element run through the same wobble filter, so card outlines look hand-drawn too:

```css
.inked { position: relative; isolation: isolate; }
.inked::before {
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  border-radius: var(--wob);
  border: 1.7px solid var(--ink);
  background: var(--surface);
  filter: url(#ink-edge);
}
```

Put the filter on the `::before` only, never on the card itself, or the text inside wobbles.

**Uneven corners.** Buttons, pills, cards, and frames all use `border-radius: var(--wob)` (`16px 22px 14px 24px / 22px 14px 24px 16px`). Small checkboxes get `4px 6px 3px 5px` and `rotate: -4deg`.

**Dot-grid paper.** Drawing frames sit on a sunken dotted background:

```css
background: radial-gradient(circle, var(--line) 1px, transparent 1.3px) 0 0 / 16px 16px, var(--sunken);
```

**Dashed rules.** Inside cards, dividers are `1.4px dashed var(--line-2)`. Solid `1.7px var(--ink)` rules are for strong separators only.

**Highlighter headings.** A heading gets a marker swipe across its lower half:

```css
background: linear-gradient(transparent 55%, oklch(var(--blob) var(--h)) 55% 90%, transparent 90%);
```

**Tape.** Pinned cards have a strip of translucent tape at the top, 56×16px, `rotate: -3deg`, `background: color-mix(in oklab, var(--ink) 9%, transparent); backdrop-filter: blur(2px)`.

**Rubber stamp.** Mono uppercase text, `letter-spacing: 0.14em`, `2px solid currentColor` border plus a `1px` outline at `outline-offset: 3px` (the double ring of a real stamp), red accent colour, `filter: url(#ink-edge)`, resting at `rotate: -9deg`.

**Dither sweep on buttons.** On hover a 4px checkerboard (`conic-gradient`) masked into a soft band sweeps across the button using `transition: translate 0.6s steps(9)`. The `steps()` gives it a stop-motion, printed feel.

**Hand-drawn bar charts.** Progress bars are SVG. The fill is an accent rectangle whose right end is a slightly slanted point (`M3 4H{w}V18H4Z`), the track is a skewed outline (`M3 4 197 3 196 18 4 18Z`), and both sit inside the `ink-edge` filter.

**Asides and notes.** Handwritten text at 18 to 24px, `color: var(--muted)`, tilted `-1.5deg` to `-4deg`. Bullets are a handwritten `→`. Pointer notes start with `↙`.

**Emphasis.** Strike-throughs and X-outs are 2 to 3px strokes in hue 25, round caps. An X-out is two rotated pseudo-element bars at ±50°.

## 9. Diagrams in long-form pages

Article diagrams follow the same rules at a larger viewBox (`640 × 280`, `720 × 320`) and live in a figure:

- `<figure class="inked">` wrapping an `<svg role="img" aria-label="...">` with a real description of what the diagram shows.
- All content inside `<g filter="url(#ink-edge)">`.
- A handwritten `<figcaption>` that makes the point in one wry line, e.g. "rules retrieve, the model ranks".
- Small helpers keep it terse: `P` (ink path with `--k`), `F` (fill path, paper/accent/blob/zone), `T` (text with font, anchor, rotation, muted), `Node` (box + centred label + optional mono subtitle), `Mover` (animateMotion dot).
- A "zone" fill at `opacity: 0.18` of the accent colour shades regions (a rejected range, a danger area).
- Dotted texture fills use an SVG `<pattern>` of 1.7px circles every 7px.
- Dashed ink lines use `stroke-dasharray: 0.02 0.015` on a `pathLength=1` path.

## 10. Do not

- Do not use perfect `<rect>` or `<circle>` elements for drawn objects. Use paths with off-by-a-few coordinates.
- Do not put the blob inside the wobble filter.
- Do not use gradients, drop shadows, or 3D shading inside drawings. Flat fills only. Depth comes from paper layered over the blob.
- Do not use more than one accent hue per drawing. Ink, paper, one blob tint, one pop tint.
- Do not vary stroke width randomly. Ink is 2.3px. Emphasis strokes are 3px in the pop colour. Thin guides are 1.6px.
- Do not use `Math.random()` for anything rendered on the server. Use the hash function.
- Do not animate with smooth easing where the original uses discrete steps (boil, dither).
- Do not hardcode colours in SVG. Classes and CSS variables only, so dark mode works for free.
- Do not add stock illustrations, icon packs, or emoji as drawings.

## 11. Task

[Describe what to build here, e.g. "Make a set of six project-card illustrations for X, Y, Z in this style, plus the card component with hover redraw and boil." For each drawing, name the object, the one accent element, the handwritten label joke, and any mono data annotation.]

Deliver the drawings as `Drawing` data objects plus one `Ink` renderer component and the CSS above. Keep each drawing within the budget in section 5.
