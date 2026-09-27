# how-the-internet-works
An explorable, zoomable explanation of how the internet works — from radio waves to peering.

## Run it

```sh
npm install && npm run dev   # then open http://localhost:5173/ (gallery) or /prototype/
npm run build                # type-check + static build into dist/
```

## The prototype (`prototype/`)

The same mini-scene (phone → Wi‑Fi → home router → fibre → the internet, and back) with semantic zoom into the
Wi‑Fi and fibre links, an internet you can unfold into its hops, packets you can follow and peek inside, and
**four swappable art styles**. Pick a style in the top bar or with `?style=storybook|neon|sketchbook|papercut`; the
flask button opens the lab with the interaction experiments. The comparison and recommendation is in
[docs/look-and-feel.md](docs/look-and-feel.md).

Everything is pluggable content:

| Folder | What | Add one by… |
|---|---|---|
| `locales/<lang>/strings.json` | language packs (`_meta.dir` for RTL) | adding a folder |
| `prototype/themes/<id>/` | a visual style: `meta.json`, `theme.ts` (motion, sound, colours, art-slot overrides), `tokens.css`, `art/*.svelte`, `locales/` | copying a theme folder; unset slots fall back to `themes/_base` |
| `prototype/layers/<id>/` | an envelope layer in the peek view (HTTP, TLS, TCP, IP, Wi‑Fi, Ethernet, GPON, MPLS) with its own strings | adding a folder and listing it in `layers/stacks.ts` |
| `prototype/core/scene.ts` | nodes, links (by technology), stops, learn-more links | data |

`npm run evaluate` (with `npx vite preview --port 5318` running on a fresh build) regenerates the screenshots and
frame-time metrics in `docs/`.

## Earlier rounds

We compared four rendering stacks and chose **Svelte 5 + SVG**:
[docs/visualisation-spikes.md](docs/visualisation-spikes.md). The discarded spikes are at git tag
`spikes/visualisation-v1`.
