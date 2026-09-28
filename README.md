# how-the-internet-works
An explorable, zoomable explanation of how the internet works — from radio waves to peering.

## Run it

```sh
npm install && npm run dev   # then open http://localhost:5173/ (redirects to /prototype/)
npm run dev -- --host        # to try it on a phone on the same network
npm run build                # type-check + static build into dist/
```

## The prototype (`prototype/`)

The same mini-scene (phone → Wi‑Fi → home router → fibre → the internet, and back) with semantic zoom into the
Wi‑Fi and fibre links, an internet you can unfold into its hops, packets you can follow and peek inside, and
sideways stepping (flick, ◀ ▶ or the arrow keys). It is drawn in the **Storybook** style, lays out as a
horizontal path on wide screens and a vertical one on portrait phones, and has optional sound (muted by default).
The scene and language live in the hash, e.g. `/prototype/#/da/fibre`; `?level=nerd` starts in nerd mode.

Everything is pluggable content:

| Folder | What | Add one by… |
|---|---|---|
| `locales/<lang>/strings.json` | language packs (`_meta.dir` for RTL) | adding a folder |
| `prototype/themes/<id>/` | a visual style: `meta.json`, `theme.ts` (motion, sound, colours, art-slot overrides), `tokens.css`, `art/*.svelte`, `locales/` | copying `themes/storybook`; unset slots fall back to `themes/_base`. With more than one theme a style picker appears and `?style=<id>` selects one |
| `prototype/layers/<id>/` | an envelope layer in the peek view (HTTP, TLS, TCP, IP, Wi‑Fi, Ethernet, GPON, MPLS) with its own strings | adding a folder and listing it in `layers/stacks.ts` |
| `prototype/core/scene.ts` | nodes, links (by technology), stops, learn-more links | data |

`npm run evaluate` (with `npx vite preview --port 5318` running on a fresh build) regenerates the screenshots and
frame-time metrics in `docs/` for every theme present.

## Earlier rounds

We built the same scene in four art styles (storybook, neon blueprint, sketchbook, paper cut-out) with a feel lab
(portal / parallax / fly transitions, spring / ease / stop-motion, lively packets) and picked **Storybook + fly +
ease**: [docs/look-and-feel.md](docs/look-and-feel.md). The full exploration is at git tag
`spikes/look-and-feel-v1`.

We compared four rendering stacks and chose **Svelte 5 + SVG**:
[docs/visualisation-spikes.md](docs/visualisation-spikes.md). The discarded spikes are at git tag
`spikes/visualisation-v1`.
