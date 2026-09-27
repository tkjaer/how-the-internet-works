# how-the-internet-works
An explorable, zoomable explanation of how the internet works — from radio waves to peering.

## Visualisation spike

We compared four rendering stacks on the same mini-scene (phone → Wi‑Fi → router → fibre → internet, with
semantic zoom into the Wi‑Fi and fibre links) and chose **Svelte 5 + SVG**. The write-up with screenshots,
measurements and the reasoning is in [docs/visualisation-spikes.md](docs/visualisation-spikes.md). The discarded
spikes' code is at git tag `spikes/visualisation-v1`.

Run it locally:

```sh
npm install && npm run dev   # then open http://localhost:5173/
npm run build                # type-check + static build into dist/
```

Text lives in language packs under `locales/<lang>/strings.json`; add a folder to add a language.
