# Visualisation tech spikes

> **Decision: Svelte 5 + SVG** (see [Recommendation](#recommendation)). Only that spike is kept in the repo
> (`spikes/svelte-svg`, with `spikes/shared` and `locales/`). The code of all four spikes, including the discarded
> SVG + GSAP, PixiJS and Three.js ones and the `scripts/evaluate.mjs` that produced the screenshots and measurements
> below, is preserved at git tag [`spikes/visualisation-v1`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/visualisation-v1).
> Links to the discarded spikes point at that tag.
>
> **Update (look-and-feel round):** the kept spike has since moved to `prototype/` (with `spikes/shared` folded into
> `prototype/core/`) and grew swappable visual themes. See [look-and-feel.md](look-and-feel.md). The `spikes/…` paths
> below now link to the tag.

Four disposable spikes that all implement **the same mini-scene**, so the rendering stack for the real app can be
picked on evidence rather than taste:

1. **Overview**: phone → Wi‑Fi access point → home router → internet, with parcels (packets) travelling continuously.
2. **Semantic zoom into the Wi‑Fi link**: the overview cross-fades into *bits riding a radio wave* (amplitude-shift keying).
3. **Semantic zoom into the fibre link**: light zig-zagging by total internal reflection, and four DWDM colours
   combined by a prism (mux) and split again (demux).
4. **The way back**: pinch or scroll out, the breadcrumb, <kbd>Esc</kbd> or browser Back. The URL hash always
   reflects where you are (`#/<lang>/<scene>`, e.g. `#/da/fibre`).

All text comes from language packs (`locales/en`, `locales/da`, plus an Arabic `locales/ar` **RTL test pack**
that deliberately omits the "for nerds" strings to exercise fallback). You can switch language and the kids/nerds
level at runtime.

**Try the kept spike:** `npm install && npm run dev`, then open http://localhost:5173/. For all four, check out the tag
(`git checkout spikes/visualisation-v1 && npm install && npm run dev`).

| Spike | Stack | Folder |
|---|---|---|
| 1 | Vanilla TS + **SVG + GSAP** (MotionPath) + d3-zoom | [`spikes/svg-gsap`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/visualisation-v1/spikes/svg-gsap) (tag only) |
| 2 | **Svelte 5 + SVG** (runes, `Tween`, transitions, CSS keyframes) | [`spikes/svelte-svg`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/visualisation-v1/spikes/svelte-svg) ✅ kept (now `prototype/`) |
| 3 | **PixiJS v8** (WebGL 2D) + pixi-filters bloom | [`spikes/pixi`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/visualisation-v1/spikes/pixi) (tag only) |
| 4 | **Three.js** "2.5D": tilted map, extruded SVG tokens, panels that fold up, bloom | [`spikes/three-25d`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/visualisation-v1/spikes/three-25d) (tag only) |

To keep the comparison fair, the spikes share everything except rendering (`spikes/shared/`):

- scene data (`scene.ts`, `details.ts`)
- the semantic-zoom camera maths (`camera.ts`: fit, clamp, cross-fade `mixes()`, enter/exit `decide()`, and a
  van Wijk "fly" interpolator)
- gestures (Pointer Events: wheel, drag, pinch, tap)
- the hash router
- the i18n lookup
- the DOM chrome (breadcrumb, language and level switches, caption card). The Svelte spike has its own `Chrome.svelte`;
  the vanilla `chrome.ts` and the `nav.ts` glue used by the other spikes are only at the tag.

## Screenshots

| | Overview (en) | Wi‑Fi (en) | Fibre (da) | Overview (ar, RTL) | Phone, Wi‑Fi (da) |
|---|---|---|---|---|---|
| SVG + GSAP | ![](img/svg-gsap-overview-en.jpg) | ![](img/svg-gsap-wifi-en.jpg) | ![](img/svg-gsap-fibre-da.jpg) | ![](img/svg-gsap-overview-ar.jpg) | ![](img/svg-gsap-wifi-da-mobile.jpg) |
| Svelte + SVG | ![](img/svelte-svg-overview-en.jpg) | ![](img/svelte-svg-wifi-en.jpg) | ![](img/svelte-svg-fibre-da.jpg) | ![](img/svelte-svg-overview-ar.jpg) | ![](img/svelte-svg-wifi-da-mobile.jpg) |
| PixiJS | ![](img/pixi-overview-en.jpg) | ![](img/pixi-wifi-en.jpg) | ![](img/pixi-fibre-da.jpg) | ![](img/pixi-overview-ar.jpg) | ![](img/pixi-wifi-da-mobile.jpg) |
| Three.js 2.5D | ![](img/three-25d-overview-en.jpg) | ![](img/three-25d-wifi-en.jpg) | ![](img/three-25d-fibre-da.jpg) | ![](img/three-25d-overview-ar.jpg) | ![](img/three-25d-wifi-da-mobile.jpg) |

The screenshots and [`spike-metrics.json`](spike-metrics.json) were produced by
[`scripts/evaluate.mjs`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/visualisation-v1/scripts/evaluate.mjs) at the tag (Playwright; run `npm run build`,
`npx vite preview --port 5318`, then `npm run evaluate`).

## Measurements

The page was loaded from the production build (`vite preview`, base `/how-the-internet-works/`) in headless
Chromium on a GPU (Apple M2 via ANGLE/Metal). Sizes count **everything the page actually fetched** (JS/CSS gzipped;
fonts are woff2 as served).

| | JS (gz) | CSS (gz) | Fonts | CPU ms/frame: overview | …during zoom flight | …overview @ 6× CPU throttle | …flight @ 6× |
|---|---:|---:|---:|---:|---:|---:|---:|
| SVG + GSAP | 61.7 kB | 3.4 kB | 75 kB | 0.6 | 2.3 | 1.1 | 10.1 |
| Svelte + SVG | **29.6 kB** | 3.7 kB | 75 kB | 0.9 | 1.9 | 1.7 | 8.0 |
| PixiJS | 162.7 kB | 2.8 kB | 237 kB¹ | 0.6 | 1.1 | 1.3 | **2.8** |
| Three.js | 177.1 kB | 2.8 kB | 75 kB | 2.5 | 2.7 | 6.0 | 6.4 |

All four held **60 fps** in every scenario on this machine, including 6× CPU throttling. The one exception is a
single 133 ms hitch in the Svelte spike on its first dive, where the detail scene is mounted lazily with `{#if}`.
Pre-mounting the next scene or keeping it mounted but hidden removes that hitch.

"CPU ms/frame" is main-thread task time (CDP `TaskDuration`) divided by frames. The budget at 60 fps is 16.7 ms.
Mid-range phones are roughly 4–6× slower than an M2 on single-thread JS, so the 6× columns are a rough "mid-range
phone" proxy.

**Caveat:** this metric does not include SVG rasterisation on the compositor/raster threads or GPU time, and that
is where SVG costs sit on real phones (large blurred filters, many animated strokes). The SVG spikes use modest
Gaussian-blur glows. On low-end Android, heavy SVG filters are the first thing to cut. Pixi/Three move that cost to
the GPU, which is why Pixi is cheapest under throttling.

¹ Pixi must preload *all* fonts before rasterising text into textures, including the 166 kB Arabic face, even when
the page is shown in English. DOM/SVG text lets the browser fetch a face only when a glyph needs it.

## Comparison

| Criterion | SVG + GSAP | Svelte + SVG | PixiJS | Three.js 2.5D |
|---|---|---|---|---|
| **Visual wow** | ★★★ Clean, crisp, glowy (SVG blur filters) | ★★★ Same look | ★★★★ Real bloom; glows feel "lit" | ★★★★★ Depth, fog, detail panels unfolding out of the map; most "cinematic" |
| **Zoom / semantic zoom** | ★★★★ d3-zoom with an interpolated fly; vector-perfect at every scale | ★★★★ Same maths driven by a Svelte `Tween` | ★★★★ Smooth; text needs re-rasterising after a zoom settles | ★★★ Striking, but the 2D pinch/zoom maths has to be mapped onto a perspective camera, and zoom-at-pointer is only approximate |
| **Touch / pinch** | ★★★★ d3-zoom built in | ★★★★ Shared Pointer-Events gestures | ★★★★ Same shared gestures | ★★★ Same, plus raycasting for taps |
| **Perf (mid-range phone, reasoned)** | ★★★ Fine for this density; SVG filters and many DOM nodes are the risk | ★★★ Same | ★★★★★ GPU batched, cheapest per frame | ★★★ Post-processing (bloom) is fill-rate heavy at DPR 3; needs quality tiers |
| **Authoring (Figma/Inkscape)** | ★★★★★ Drop in an SVG, keep ids/classes, animate them | ★★★★★ Same, and scenes become components | ★★ `Graphics.svg()` imports shapes but flattens them (no per-element animation, no text) | ★★ SVGLoader extrudes paths; no gradients, filters or text; art needs "3D-friendly" simplification |
| **Content-as-data / plugins** | ★★★ Imperative builders per scene | ★★★★★ A technology or layer is a folder with `scene.svelte` + data + locales; auto-registered via `import.meta.glob` | ★★★ Imperative scene builders | ★★ Every new scene needs 3D thinking (materials, depth, lighting) |
| **Bundle** | 62 kB | **30 kB** | 163 kB + all fonts | 177 kB |
| **Static hosting** (e.g. GitHub Pages) | ✅ Static | ✅ Static | ✅ Static | ✅ Static |
| **Accessibility** | ✅ Real DOM/SVG: `<title>`, focusable links, screen readers | ✅ Same | ❌ Canvas: needs a parallel DOM for a11y | ❌ Canvas (CSS2D labels help) |
| **Code size of spike** | ~250 lines | ~320 lines over 7 files | ~340 lines | ~440 lines |

### i18n / text handling

| | SVG + GSAP | Svelte + SVG | PixiJS | Three.js |
|---|---|---|---|---|
| **Crisp when zoomed** | ✅ Vector text, sharp at any zoom | ✅ Same | ⚠️ Text is a texture: blurry mid-zoom, re-rasterised on settle (`resolution` bump), with a visible "pop" | ✅ DOM labels via CSS2DRenderer are sharp, but fixed CSS size means they must be counter-scaled in code during a dive |
| **Different label lengths** (da is ~30% longer) | ✅ Browser text layout; `text-anchor: middle` keeps labels centred | ✅ Same | ⚠️ No automatic wrapping or fit; `wordWrapWidth` is manual | ✅ CSS layout |
| **Font loading** | ✅ `@font-face`, `unicode-range` subsets fetched on demand | ✅ Same | ❌ Must `document.fonts.load()` every face *before* creating text, or glyphs render in a fallback and stay wrong | ✅ Same as DOM |
| **Right-to-left (Arabic)** | ✅ Shaping and bidi by the browser; `direction` inherited from `<html dir>` | ✅ Same | ⚠️ Worked in Chrome canvas, but bidi/shaping of canvas text is engine-dependent; mixed "Wi‑Fi" + Arabic needs care | ✅ DOM, but CSS2D's absolute boxes needed `left:0` pinning or they jumped off-screen in RTL (found and fixed) |
| **Translators edit without touching code/SVG** | ✅ JSON packs; SVG art contains no text | ✅ Same; Svelte reactivity re-renders on language change for free | ✅ JSON packs, but every Text object must be re-created or updated by hand | ✅ JSON packs; labels are DOM |

In every spike the **chrome** (breadcrumb, buttons, caption) mirrors for RTL. The **diagrams themselves are not
mirrored**: they are physical/topological drawings, and "the phone on the left" is not a reading-direction concept.
The real app should keep this rule and let a scene opt in to mirroring if it ever needs to.

### Other observations

- **Semantic zoom model works everywhere.** Each detail scene is authored in its own 1600×900 space and nested at
  0.1 scale inside the link it explains. Cross-fading by log-zoom progress × distance from the centre felt natural
  in all four spikes. A settle rule ("enter above 55% progress, exit below 85%") turns free zooming into route
  changes. This model is renderer-independent and should graduate into the real app as-is.
- **Portrait phones are the real layout problem, not the tech.** A 16:9 overview on a 390 px wide phone makes
  labels about 6 px tall (see the phone screenshots). The real app needs a portrait variant of each scene's layout
  (a content/data concern: alternative node positions) and/or counter-scaled labels. SVG and DOM make both easy.
- **Pixi:** after `Graphics.svg()` you lose per-element access, so you can't blink "the router's LEDs" without
  redrawing them in code. Filters need `padding`, or the glow is clipped into visible rectangles.
- **Three:** Line2 "fat lines" silently vanished under a mirrored (y-down) parent until `side: DoubleSide`. This
  is typical of the time sink: impressive once working, but each new scene costs 3D problem-solving.
- **GSAP vs Svelte primitives:** GSAP's MotionPath and timelines are great for choreographed sequences ("parcel
  unpacks into bits"). Svelte's `Tween`/transitions plus CSS keyframes covered everything this mini-scene needed
  without GSAP. GSAP remains a drop-in inside Svelte for richer sequences.

### User feedback

After trying all four, the requester's reaction was that **the two SVG spikes (SVG + GSAP and Svelte + SVG) feel
the nicest**. That matches the measurements above.

## Considered, not spiked

- **Threlte / react-three-fiber:** a declarative wrapper around the same Three.js renderer. Spike 4 answers the
  underlying question ("is 3D worth it here?"); a wrapper would only change authoring ergonomics, not the
  trade-offs.
- **Rive / Lottie:** these are pre-authored animation *assets*, not a scene or zoom engine. They need an authoring
  tool and art we don't have yet. Either can be embedded inside any of the stacks above, e.g. a Lottie of a
  character "unpacking" a parcel inside a Svelte scene. Revisit once there is an illustrator. Weight: `lottie-web`
  is ~60 kB gz; the Rive runtime is WASM, ~150 kB+.
- **resvg-js:** a Rust/WASM SVG *rasteriser* (~2.5 MB WASM). It isn't a runtime renderer and has no animation or
  interaction, so it's not a candidate stack. It is a good **build-time tool**, though, for:
  - gallery thumbnails and Open Graph images
  - `prefers-reduced-motion` / no-JS static fallbacks
  - rasterising SVG art into textures if a canvas layer is ever used

## Recommendation

**Svelte 5 + SVG for scenes, DOM for text, with GSAP available for choreography. Add an optional canvas/WebGL
effects layer only where a scene proves it needs one.**

Why:

1. **Authoring and content-as-data fit best.** A technology, layer or scene can be a folder with a `.svelte`
   component, the artist's SVG (ids/classes preserved), a small data file and `locales/<lang>/*.json`. It is
   discovered with `import.meta.glob`, so adding content needs no core changes. That is exactly the plugin model the
   project wants (graph nodes/links → technologies → layer stacks → scenes).
2. **Best i18n story.** Text stays text: crisp at every zoom, laid out and shaped by the browser (Danish lengths,
   Arabic RTL), fonts loaded on demand, and accessible. Translators only edit JSON. Runtime switching and
   `#/<lang>/…` URLs already work in the spike.
3. **Smallest bundle (30 kB gz) and simplest code**, with Svelte reactivity doing the language/level/zoom plumbing.
4. **Performance is adequate and has a clear escape hatch.** For scenes that need hundreds of particles or real
   bloom, such as a busy DWDM spectrum or a crowded internet-exchange view, mount a small Pixi canvas *inside* that
   scene's SVG layer (a `<foreignObject>` or a positioned canvas). Keep the text and chrome in DOM. Pixi's numbers
   show it's the right tool for that niche.
5. **Three.js 2.5D was the most spectacular**, but it costs ~6× the JS, the fiddliest authoring, weaker
   accessibility and text, and more per-scene effort. Not worth it for the core. A later, isolated "fly-over"
   intro could still use it.

Carry forward from the spikes:

- `spikes/shared/camera.ts` (now `prototype/core/camera.ts`): the semantic-zoom maths (fit, clamp, `mixes`, `decide`, fly interpolator)
- `gestures.ts`
- the `#/<lang>/<scene>` router
- the locale-pack loader with English fallback and `_meta.dir`

Suggested next steps for the real app:

- Formalise the content schema (nodes, links + technology, layer stacks, scenarios, swappable segments).
- Add ICU MessageFormat for plurals/placeholders.
- Design portrait layouts per scene.
- Add a reduced-motion mode (static frames could be pre-rendered with resvg-js).
