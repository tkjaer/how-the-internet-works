# how-the-internet-works
An explorable, zoomable explanation of how the internet works — from radio waves to peering.

## Run it

```sh
npm install && npm run dev   # then open http://localhost:5173/
npm run dev -- --host        # to try it on a phone on the same network
npm test                     # content validation, routes, layer stacks, URLs (Vitest)
npm run build                # type-check + static build into dist/
```

## What's in it

You pick **where you are** (at home on Wi‑Fi, on the street on 5G, at the desk on a cable) and **what you do**
(watch a video). You then see your packets travel through the access network, the ISP, an internet exchange and on
to a CDN server:
- **Zoom into** the internet to unfold its hops. The home route passes the fibre cabinet, the backhaul and the BNG; the street route passes the mobile core.
- **Look inside** the links: Wi‑Fi waves, light in a glass thread (shared by your street on the access fibre, colours sharing one thread on metro fibre, boosters every 80 km on the backbone), and 5G beams with their time × frequency seats. This goes up to three levels deep. Stepping sideways between dives zooms out, travels along the path and zooms back in.
- **Pause and catch a packet**, then step it hop by hop: its envelopes show what each box reads, uses and changes (MAC swaps at the Wi‑Fi access point, NAT and TTL at the home router, a GTP tunnel and carrier-grade NAT on 5G), with every header field for nerds and a protocol tree for details.
- **Switch place**: the scene morphs and the packets re-route.

It comes in kid and nerd levels, in English and Danish, by day and by night. Learn-more links point onwards.

The location is in the URL, e.g. `#/da/street/watch-video/internet/@mobile-core`; `?level=nerd` starts in nerd
mode, and `?mode=night` at night.

## How it's built

An engine in `src/` and content folders in `content/`. Nodes, technologies, layers, dive scenes, segments, places,
activities, languages, themes and learn-more links are each **added as a folder**, validated with zod:
- [docs/architecture.md](docs/architecture.md): the model, the scene tree, and the context scenes and layers get
- [docs/authoring.md](docs/authoring.md): how to add each kind of thing (with the laptop as a worked example)

`npm run evaluate` (with `npx vite preview --port 5318` running on a fresh build) regenerates the screenshots in
`docs/img/app-*` and the frame-time metrics in [docs/app-metrics.json](docs/app-metrics.json).

## Earlier rounds

We built the same scene in four art styles (storybook, neon blueprint, sketchbook, paper cut-out) with a feel lab
(portal / parallax / fly transitions, spring / ease / stop-motion, lively packets) and picked **Storybook + fly +
ease**: [docs/look-and-feel.md](docs/look-and-feel.md). The full exploration is at git tag
`spikes/look-and-feel-v1`.

We compared four rendering stacks and chose **Svelte 5 + SVG**:
[docs/visualisation-spikes.md](docs/visualisation-spikes.md). The discarded spikes are at git tag
`spikes/visualisation-v1`.

## License

How the Internet Works is © 2026 Thomas Kjær Aabo and free software under the
[GNU Affero General Public License, version 3 or later](LICENSE) (AGPL-3.0-or-later), with a few additional terms in
[NOTICE.md](NOTICE.md).

- **You may** use it, study it, share it, change it and host it, also commercially.
- **You must** share the source, under the same license, with everyone you give a copy to. If you change it, that
  includes your changes, and when people use your version over a network (a website counts), you must offer them its
  source too. And keep the author credit in its user interface, e.g. "Based on How the Internet Works by Thomas Kjær Aabo",
  like the app's own About entry (⋯ › About).
- **Screenshots**, screen recordings and printouts of the running app are yours to use under
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with credit to "How the Internet Works by Thomas Kjær Aabo",
  without any AGPL obligations.

The name and logo are not licensed for other uses, and dependencies keep their own licenses. Contributions are
welcome: see [CONTRIBUTING.md](CONTRIBUTING.md).
