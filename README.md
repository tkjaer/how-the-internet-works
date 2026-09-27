# how-the-internet-works
An explorable, zoomable explanation of how the internet works — from radio waves to peering.

## Visualisation spikes

Before building the real app we compared four rendering stacks on the same mini-scene
(phone → Wi‑Fi → router → fibre → internet, with semantic zoom into the Wi‑Fi and fibre links).

- **Gallery:** https://tkjaer.github.io/how-the-internet-works/
- **Write-up and recommendation:** [docs/visualisation-spikes.md](docs/visualisation-spikes.md)

```sh
npm install
npm run dev        # gallery at http://localhost:5173/
npm run build      # static site in dist/ (base /how-the-internet-works/)
```

Text lives in language packs under `locales/<lang>/strings.json`; add a folder to add a language.
