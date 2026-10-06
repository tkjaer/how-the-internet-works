# Look and feel: four styles, one scene

> **Decision record.** After this exploration the prototype was slimmed to the chosen direction: Storybook, fly
> transitions, ease, auto layout and plain packets. The full exploration (all four styles and every feel-lab
> option) is kept at git tag [`spikes/look-and-feel-v1`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/look-and-feel-v1). Check out the tag
> (`git checkout spikes/look-and-feel-v1 && npm install && npm run dev`) to try the other styles and the lab. The
> style and lab URLs below only work there.
>
> **Update (core architecture):** `prototype/` has since become the app: an engine in `src/` and content folders in
> `content/`. See [architecture.md](architecture.md). The paths below refer to the prototype as it was (tag
> `spikes/look-and-feel-v1`, or the commit before the core architecture).

The rendering stack is settled (Svelte 5 + SVG + DOM text; see [visualisation-spikes.md](visualisation-spikes.md)).
This round explores what people actually notice: **the art style** and **the interaction feel**.

The same mini-world is built in four swappable styles:
- an overview (phone → Wi-Fi access point → home router → the internet)
- a Wi-Fi dive (bits on a radio wave)
- a fibre dive (light bouncing inside the glass, several colours sharing one thread)
- a new internet sub-path ("tap the cloud and it unfolds": street cabinet → backhaul → ISP gateway → ISP core →
  internet exchange / transit → video server)

## Decision (after trying it)

| | Picked | Instead of |
|---|---|---|
| **Style** | **Storybook** | neon, sketchbook, paper cut-out |
| **Zoom transition** | **Fly** (camera flight), for dives too | portal, parallax fade |
| **Motion feel** | **Ease** | spring, stop-motion |
| **Layout** | **Auto** (vertical path on portrait screens) | forced landscape / portrait |
| **Lively packets** | **Off** (plain gliding couriers) | squash & stretch, anticipation, trails |
| **Doors** (issue #19) | **One verb, one mark each**: *Look inside* (teal lens, magnifier), *Open up* (orange lens, a door), *Change* (berry square, arrows); *Catch* is kept for packets. Things that open breathe at rest and glow when pointed at; labels show when pointed at or with *What can I explore?*, and never over the scene's own words: a label that has no room waits for a zoom (#137) | three similar small round badges and a generic hint in the caption |

### What was kept

The slimmed `prototype/` keeps only Storybook, and removes the lab and the variants nobody picked:
- **Removed:** the neon, sketchbook and papercut themes (with their fonts, strings, sound timbres and rough.js);
  the portal and parallax transitions; the spring and stop-motion ("twos") feel; lively packets (squash and
  stretch, anticipation, trails); the sketchbook line boil; the forced-orientation override; the fps counter;
  the style gallery start page.
- **Kept:** the theme plug-in structure (`themes/_base` fallbacks, discovery via `import.meta.glob`, `?style=<id>`)
  so another theme, e.g. a nerd-mode one, can drop in. The style picker hides itself while there is only one theme.
  Also kept: fly + ease, landscape and portrait layouts picked from the aspect ratio, follow + peek, learn-more
  links, sideways stepping, sound (on by default since #189) and `npm run evaluate` (screenshots + frame times).

The recommendation and notes below are the pre-decision write-up, kept as the record of the exploration. The
screenshots show each style's original defaults (storybook with spring and lively packets), taken at the tag.

At the tag, try it with:

```sh
git checkout spikes/look-and-feel-v1
npm install && npm run dev      # then open http://localhost:5173/
```

| Style | URL (at the tag) |
|---|---|
| Storybook | `/prototype/?style=storybook` |
| Neon blueprint | `/prototype/?style=neon` |
| Sketchbook | `/prototype/?style=sketchbook` |
| Paper cut-out | `/prototype/?style=papercut` |

At the tag, the ⚗ button opens the **feel lab**, where you can change the zoom transition, the motion feel, the
layout and whether packets are lively. Every setting ends up in the URL, e.g.
`?style=sketchbook&zoom=portal&feel=spring&orient=portrait`, so a setup can be shared. The scene and language live
in the hash (`#/da/fibre`).

## The four styles

### Desktop (1440×900)

| | Overview | Wi-Fi dive | Fibre dive | Inside the internet |
|---|---|---|---|---|
| **Storybook** | ![](img/lf-storybook-overview-desktop.jpg) | ![](img/lf-storybook-wifi-desktop.jpg) | ![](img/lf-storybook-fibre-desktop.jpg) | ![](img/lf-storybook-internet-desktop.jpg) |
| **Neon** | ![](img/lf-neon-overview-desktop.jpg) | ![](img/lf-neon-wifi-desktop.jpg) | ![](img/lf-neon-fibre-desktop.jpg) | ![](img/lf-neon-internet-desktop.jpg) |
| **Sketchbook** | ![](img/lf-sketchbook-overview-desktop.jpg) | ![](img/lf-sketchbook-wifi-desktop.jpg) | ![](img/lf-sketchbook-fibre-desktop.jpg) | ![](img/lf-sketchbook-internet-desktop.jpg) |
| **Paper cut-out** | ![](img/lf-papercut-overview-desktop.jpg) | ![](img/lf-papercut-wifi-desktop.jpg) | ![](img/lf-papercut-fibre-desktop.jpg) | ![](img/lf-papercut-internet-desktop.jpg) |

### Portrait phone (390×844)

| | Overview | Wi-Fi dive | Fibre dive | Inside the internet |
|---|---|---|---|---|
| **Storybook** | ![](img/lf-storybook-overview-phone.jpg) | ![](img/lf-storybook-wifi-phone.jpg) | ![](img/lf-storybook-fibre-phone.jpg) | ![](img/lf-storybook-internet-phone.jpg) |
| **Neon** | ![](img/lf-neon-overview-phone.jpg) | ![](img/lf-neon-wifi-phone.jpg) | ![](img/lf-neon-fibre-phone.jpg) | ![](img/lf-neon-internet-phone.jpg) |
| **Sketchbook** | ![](img/lf-sketchbook-overview-phone.jpg) | ![](img/lf-sketchbook-wifi-phone.jpg) | ![](img/lf-sketchbook-fibre-phone.jpg) | ![](img/lf-sketchbook-internet-phone.jpg) |
| **Paper cut-out** | ![](img/lf-papercut-overview-phone.jpg) | ![](img/lf-papercut-wifi-phone.jpg) | ![](img/lf-papercut-fibre-phone.jpg) | ![](img/lf-papercut-internet-phone.jpg) |

### Nerd mode, Danish and follow + peek

| | Nerd (desktop) | Nerd, Danish (phone) | Following a packet (desktop) | Following a packet (phone) |
|---|---|---|---|---|
| **Storybook** | ![](img/lf-storybook-overview-nerd-desktop.jpg) | ![](img/lf-storybook-internet-nerd-da-phone.jpg) | ![](img/lf-storybook-peek-desktop.jpg) | ![](img/lf-storybook-peek-phone.jpg) |
| **Neon** | ![](img/lf-neon-overview-nerd-desktop.jpg) | ![](img/lf-neon-internet-nerd-da-phone.jpg) | ![](img/lf-neon-peek-desktop.jpg) | ![](img/lf-neon-peek-phone.jpg) |
| **Sketchbook** | ![](img/lf-sketchbook-overview-nerd-desktop.jpg) | ![](img/lf-sketchbook-internet-nerd-da-phone.jpg) | ![](img/lf-sketchbook-peek-desktop.jpg) | ![](img/lf-sketchbook-peek-phone.jpg) |
| **Paper cut-out** | ![](img/lf-papercut-overview-nerd-desktop.jpg) | ![](img/lf-papercut-internet-nerd-da-phone.jpg) | ![](img/lf-papercut-peek-desktop.jpg) | ![](img/lf-papercut-peek-phone.jpg) |

The screenshots are regenerated by `scripts/evaluate.mjs` (see [Performance](#performance)).

### Storybook: a warm picture book

- **World.** A cream sky with soft hills. The home is a cut-away house: one room with the phone, the access point
  on the wall and the home router, so the Wi‑Fi hop crosses the room and only the fibre leaves the house (in
  portrait the router sits up in the attic). The internet is a smiling cloud beyond the hills, and inside it the hops sit
  along a winding road.
- **Characters.** Devices have friendly faces. Packets are **little couriers** with blinking eyes and running legs,
  carrying a parcel (the request) or a film reel (the video). They kick up dust puffs when they land.
- **Nerd tags** are luggage tags on strings.
- **Default motion:** a camera flight with a soft spring (slight overshoot).
- **Default sound:** a marimba-ish triangle blip.
- **Type:** Baloo 2, and JetBrains Mono for nerd tags. (Baloo Bhaijaan 2, the same design family, covered
  Arabic while there was an Arabic test pack; issue #11 dropped it.)
- **Strength:** the most "for the kids" of the four. The courier characters give the abstract idea of a packet
  something to care about, and to follow.
- **Weakness:** the densest style. On a portrait phone the overview is busy, and it will need the most art per
  new device.

#### Focus (issue #53)

Keyboard focus is one ring for every control, drawn by the engine: the style's ink (3 px) outside a gap in the page
colour (2 px), so it reads as a dark ring on paper and a pale one at night, on any card or on the sky. Storybook's
own card outline gives way to it while a control is focused. In the picture the same two tones ring the stop the
keyboard is on (the `Device` and `Link` art's `kbd`: the page colour, the ink, the page colour, round the device or
along the link), and the whole scene, when it has focus, gets a rounded outline 3 px on screen at any zoom. Only the
keyboard sees them: a tap doesn't. See [accessibility](accessibility.md).

#### Day and night (issue #43)

Night is a **mode** of Storybook, not a fifth style: the same picture book, read by moonlight.
- **How it's chosen.** The default follows the OS (`prefers-color-scheme`). The ☀️/🌙 button in the chrome
  switches it and remembers the choice, and `?mode=day|night` in the URL wins. The switch is a sunset: night falls
  from the top of the sky in about 1.3 s, and day rises from the horizon. It is instant under
  `prefers-reduced-motion`.
- **Palette.**
  - The sky is deep indigo and the paper a darker blue.
  - Outlines and ink turn pale, moonlit cream, so the drawn line still leads the eye.
  - Hills are dark blue-green.
  - Warm lights stay warm: the sun's yellow becomes lamplight.
  - Data colours (a technology's line, a packet) stay the same, so a reader who switches still recognises them.
    The couriers keep dark ink faces (`--face`) and get a dark outline with a pale moonlit rim, so a yellow request
    stays readable on the night sky and in the lit room.
- **Night-only touches:**
  - a crescent moon and stars, a few of which twinkle
  - lit windows and a lamp-lit room at home
  - a street lamp with a pool of light, and car headlights on the street
  - a warm glow behind the internet town
  - device LEDs that glow
  - halos around Wi‑Fi waves, 5G beams, light pulses in fibre and pulses in copper

  Glows are wide translucent strokes, never SVG filters. At 6× throttle night costs the same frame rate as day.
- **Contrast.** Text in the chrome (caption, chips, peek, tags, buttons, links) meets WCAG AA in both modes, and a test
  checks it (`src/model/contrast.test.ts`). The day palette was darkened slightly where it fell short. Edges,
  what is on and the rings reach 3:1. In the scene, marks and text on a bright body (a sun-yellow sticker, a lit
  row, a mustard plate) are drawn in `--face`, never `--line`, which turns pale by night. A label in a data colour is
  mixed into the ink; one in a palette colour uses its `-ink` tone (`--leaf-ink`, `--teal-ink`, `--berry-ink`). See
  [accessibility](accessibility.md).

| | Day | Night |
|---|---|---|
| Home | ![](img/app-storybook-home-desktop.jpg) | ![](img/app-storybook-night-home-desktop.jpg) |
| On the street | ![](img/app-storybook-on-the-go-desktop.jpg) | ![](img/app-storybook-night-on-the-go-desktop.jpg) |
| The internet | ![](img/app-storybook-internet-desktop.jpg) | ![](img/app-storybook-night-internet-desktop.jpg) |
| Wi‑Fi dive | ![](img/app-storybook-wifi-desktop.jpg) | ![](img/app-storybook-night-wifi-desktop.jpg) |
| Fibre, long haul | ![](img/app-storybook-backbone-desktop.jpg) | ![](img/app-storybook-night-backbone-desktop.jpg) |
| Undersea cable | ![](img/app-storybook-submarine-desktop.jpg) | ![](img/app-storybook-night-submarine-desktop.jpg) |
| TLS dive | ![](img/app-storybook-tls-desktop.jpg) | ![](img/app-storybook-night-tls-desktop.jpg) |
| Peek, phone | ![](img/app-storybook-peek-on-the-go-phone.jpg) | ![](img/app-storybook-night-peek-on-the-go-phone.jpg) |

Caption notes (a nerd's "Extra" in the physical dives, #31) are 14 px under the caption's text with their name in the
door ink; on a phone's folded card they are cut to one line.

### Neon blueprint: the old style pushed further

- **World.** A dark HUD: two parallax grids, registration crosshairs, corner brackets, scanlines and a vignette in
  screen space. Devices are wireframes with glowing strokes and blinking LEDs. The Wi-Fi dive looks like an
  oscilloscope.
- **Packets** are glowing diamonds (request) and chevrons (video) with tapered light trails. A targeting reticle
  locks onto the followed packet.
- **Nerd tags** are mono bracket callouts. The chrome is glass with notched corners and uppercase buttons.
- **Default motion:** a snappy expo ease, slightly faster than the others.
- **Default sound:** a bright sawtooth blip.
- **Type:** Space Grotesk, JetBrains Mono and Noto Sans Arabic.
- **Strength:** the best for nerd mode. Protocol names, addresses and numbers look at home here.
- **Weakness:** the least warm, and the most expensive to run (see [Performance](#performance)).
- **How the glow is made:** by duplicate wide translucent strokes under the bright stroke, with no SVG blur.

### Sketchbook: dad's paper diagrams, brought to life

- **World.** Off-white graph paper with a ruled margin, pencil-grey and blue-ballpoint lines, highlighter
  accents, hatching instead of fills, and dive panels that are index cards taped to the page.
- **Line boil.** Every static stroke is drawn with rough.js and gently boils: 3 pre-generated seeds are cycled at
  ~8 fps, like hand-drawn animation. The Wi-Fi link is a dotted line with little radio squiggles.
- **Packets** are scribbled envelopes with pencil speed lines.
- **Nerd tags** are margin notes with arrows.
- **Default motion:** "on twos". Everything moves at 12 fps stop-motion, so the camera and packets move in small
  steps like a flip-book. Turn it off in the lab (Motion feel → Ease/Spring) to compare.
- **Type:** Patrick Hand, with Baloo Bhaijaan 2 for Arabic.
- **Strength:** the most personal, and the lightest in both font weight and CPU. New content can be rough and
  still look intentional.
- **Weakness:** the boil and the twos are an acquired taste. They read as "alive" to some people and as "juddery"
  to others.

### Paper cut-out: a craft-paper diorama

- **World.** A dusk diorama of layered paper hills, mountains and fronds. These are real **depth layers**
  (`<Depth>`), so they slide against each other as the camera moves. Hard offset shadows are drawn as duplicate
  shapes, not filters.
- **Pieces.** Chunky cut-paper devices; paper badges for "look inside" (magnifier) and "expand" (map). Links are
  paper strips: a dashed Wi-Fi arc, a mustard cable, a cream fibre ribbon.
- **Packets** are folded envelopes (request) and paper planes (video).
- **Nerd tags** are sticky folded labels.
- **Default motion:** the parallax cross-fade with a gentle spring, which shows the layers off.
- **Default sound:** a paper rustle.
- **Type:** Fredoka, with Baloo Bhaijaan 2 for Arabic. Reem Kufi was tried for Arabic first, but it turned muddy
  under the thick label halo at small sizes.
- **Strength:** the strongest sense of place and depth. Zooming feels like moving *into* a world.
- **Weakness:** it's easy to lose contrast between the layers (link labels needed a heavy halo), and dusk
  colours are less cheerful than storybook's.

## How a style plugs in

A style is a folder, discovered with `import.meta.glob`. Nothing in the core names a style. The slimmed
prototype still works this way with just [`themes/storybook`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/look-and-feel-v1/prototype/themes/storybook); the other three
are at the tag ([neon](https://github.com/tkjaer/how-the-internet-works/tree/spikes/look-and-feel-v1/prototype/themes/neon), [sketchbook](https://github.com/tkjaer/how-the-internet-works/tree/spikes/look-and-feel-v1/prototype/themes/sketchbook),
[papercut](https://github.com/tkjaer/how-the-internet-works/tree/spikes/look-and-feel-v1/prototype/themes/papercut)).

```
prototype/themes/<id>/
  theme.ts        defineTheme({ id, scheme, motion preset, sound timbre, colours, art: { …slot overrides } })
  tokens.css      CSS tokens and chrome, scoped to :root[data-style="<id>"]
  meta.json       order + swatch for the style picker (eager, tiny)
  art/*.svelte    art slots: Backdrop, Overlay, Device, Link, Route, Packet, Hint, Tag, Label, Panel,
                  Wave, Bit, Rings, Fibre, Pulse, Prism, Emitter, Defs
  locales/*.json  the style's own strings (its name in the picker), merged into i18n
```

- **Loading.** `theme.ts` and its CSS and fonts are lazy, so only the active style's code and fonts are
  downloaded. `meta.json` and the locales are eager, so the picker can show every style.
- **Fallbacks.** `themes/_base/` has a default for every slot, driven only by CSS tokens. A new style can start
  as just `tokens.css` and override slots one by one. A new device or link technology renders with the `_base`
  art in every style until a style draws its own.
- **Motion presets.** At the tag, `motion: { zoom, feel, speed, spring: { damping, frequency }, twosFps }` set the
  defaults, and the lab's "Auto (…)" option meant "whatever this style prefers". The slimmed prototype keeps only
  `motion: { speed }` (a flight-duration multiplier).
- **Sound timbres.** `timbre: { wave, blip, noise, gain, … }` feeds the Web Audio synth in `core/sound.ts`.
- **Screen space.** Screen-space art (paper grain, scanlines, vignette) goes in `Overlay`, outside the camera
  transform, so it is rasterised once and not on every zoom frame.
- **Text.** All visible text comes from locale packs. Art contains no text; labels are DOM/SVG text placed by the
  scene, and each style only styles them.

Themes plug in just as well as the other content types. Four styles were built in parallel with **no core
changes**. The one gotcha: a style's CSS must not re-position the fixed chrome (`.caption`, `.peek`, `.pop`), and
neon and papercut both did so by accident at first.

## Interaction experiments

The lab and the variants that weren't picked (portal, parallax fade, spring, stop-motion, lively packets) are
only at the tag: see [`App.svelte`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/look-and-feel-v1/prototype/App.svelte), [`core/motion.ts`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/look-and-feel-v1/prototype/core/motion.ts),
[`core/packets.ts`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/look-and-feel-v1/prototype/core/packets.ts) and [`ui/LabPanel.svelte`](https://github.com/tkjaer/how-the-internet-works/tree/spikes/look-and-feel-v1/prototype/ui/LabPanel.svelte).

### Zoom transitions (lab → Zoom transition)

- **Fly** is a van Wijk "zoom out a bit, pan, zoom in" camera flight. It's the most spatially honest: you
  always know where you are. It's the best for sideways steps, the breadcrumb and Back.
- **Portal**: the tapped thing's badge opens a circle that grows from its position and reveals the dive scene,
  while the overview keeps scaling up behind it (with spring overshoot). Out is the reverse: the circle shrinks
  back into the badge. It makes "going **inside** the thing" very literal, which suits kids. It's the most
  "magic" of the three.
- **Parallax fade**: a cross-fade where the backdrop, midground and foreground scale at different rates. It's
  calm and the cheapest to run, and it's the `prefers-reduced-motion` default. In papercut, where the backdrop
  is real paper layers, it looks best.
- **Pinch and scroll** always stay continuous semantic zoom, whatever transition is picked. The transition only
  applies to taps, buttons, the breadcrumb and Back.

### Motion feel (lab → Motion feel)

- **Ease** is a crisp expo/cubic ease.
- **Spring** is a critically under-damped spring per style, e.g. storybook with damping 0.55 overshoots a
  little, and papercut with 0.7 hardly overshoots. It makes arrivals feel physical. It's great for kids, but too
  much bounce on every sideways step gets tiring.
- **Stop-motion ("twos")** quantises the whole clock (the camera, packets and waves) to 12 fps. In sketchbook,
  together with the line boil, it looks like a flip-book. In the other styles it just looks like dropped frames,
  so only sketchbook defaults to it.

### Lively packets (lab → Lively packets)

- **Squash and stretch** come from real speed and acceleration.
- **Anticipation** is a short wind-up at a node before leaving, then a **landing squash** on arrival.
- **Style trails**: dust puffs, light trails, pencil speed lines, a paper tail.
- **Storybook's couriers** also run with a step cycle.
- **Off** gives plain sliding shapes. Compare the two: with it off the scene looks like a diagram, and with it on
  it looks like something is happening. Keep it on.

### Follow a packet and peek inside (issue #5)

Tap a packet to follow it. The hit target is at least 48 CSS px, so small fingers can do it. What happens:

- **Time slows** to about a third of normal speed.
- **The camera** zooms to about 1.8× and tracks the packet, keeping it clear of the peek panel (on a phone a sheet
  of about a third of the screen, #139).
- **The peek panel** shows the envelopes nested inside each other: the link frame ⊃ IP ⊃ TCP ⊃ TLS ⊃ HTTP.
  - **Each hop swaps the outer envelope**: a Wi-Fi frame, then Ethernet, then a GPON frame on the fibre, then
    Ethernet/MPLS in the core.
  - **The home router** shows the NAT rewrite of the sender address.
  - **Intermediate hops** show TCP/TLS/HTTP **sealed** (🔒 "only your phone and the server open this"); they
    only read IP. The phone and the server are endpoints, where everything opens.
  - **Kid labels** use the envelope metaphor (address label, numbered piece, lock, the letter). Nerd mode shows
    real fields (addresses, ports, sequence numbers, TLS 1.3, `GET /video/720p/42.m4s`).

Each layer is its own component in `prototype/layers/<id>/` (`http`, `tls`, `tcp`, `ip`, `wifi`, `ethernet`,
`gpon`, `mpls`), with its own locale strings. Each one takes a context prop
`{ packet, link, from, to, role: endpoint | bridge | nat | router, side, level }` and decides for itself what to
show. The stack comes from `layers/stacks.ts`: lower layers per link technology, plus the shared upper layers.
The same TCP component is reused on phone → AP and on router → ISP, as issue #5 asks. The layer panels use theme
tokens, so they restyle with each style for free (see the peek screenshots).

Tapping the × button, pressing Esc or tapping empty space ends the follow, and the camera flies back.

> **Since issue #17** following is replaced by **pause, catch and step**: pause freezes all motion (since #53, in
> dives too), a tapped packet
> waits at a hop, and ◀ ▶ step it along its path. They are spatial: the button pointing the way the packet moves on
> screen (a request ▶, the video coming back ◀; ▲ / ▼ in portrait) takes it on and is the filled one. The peek shows the packet as it leaves that hop, with what the hop
> used (soft yellow, `--env-used`) and changed (struck-through old value → new, `--env-change`), kid fields only or
> every header field for nerds, and a Details protocol tree. See [architecture](architecture.md#pause-catch-and-step-issue-17).

### Sound (on by default, one tap to mute; issue #189)

All sounds are **synthesised with the Web Audio API**, so there are no audio files and no licences to track:

- a filtered-noise **whoosh** on zoom
- a soft **swish** on a sideways step
- a **pop** when you tap a packet
- a **blip** when the followed packet arrives, or you step a caught one; other arrivals, the ones you only watch,
  get a quiet tick, at most one every 1.8 s and none while read aloud speaks. It is about 7 dB under the quietest
  tap sound, the swish (K-weighted over 100 ms; it used to be level with it)
- the **modem handshake** in the dial-up dive: touch tones, a ring, the answer tone and the training screech, about
  five seconds, once when you arrive (or turn sound on there). Muted, the speech bubble and the waves on the line
  tell the same story. It plays through one level of its own, so its loudest part, the touch tones, is level with
  the loud blip (#191; it used to be about 13 dB louder)

Levels, measured as K-weighted loudness over the loudest 100 ms (#191): the loud blip about −21 LUFS, pop −26,
bump −27, whoosh −31 to −33, swish −39, the quiet tick −45; the handshake's touch tones −20, its other parts −24 to
−30. Even all at once, nothing peaks above 0.6.

Each style has a timbre: storybook a marimba-ish triangle, neon a sawtooth, sketchbook noise-heavy pencil
scratches, papercut a paper rustle.

Sound is **on by default** (#189: it adds depth, and the modem is a favourite), but a browser lets no audio start
before the reader's first tap or key, so nothing plays before it: the `AudioContext` is created (or resumed) inside
that first gesture (`wakeOnGesture` in `engine/sound.ts`), and the tap's own pop or whoosh plays. Muting is one tap,
the speaker button in the top bar on a desktop or tablet (in ⋯ on a phone, upright or on its side, where the bar has
no room); it stops everything at once, the handshake too, and is remembered. `?sound=off` (or `on`) in the link wins
for that load, for a classroom, a kiosk or an embed.

### Touch, sideways and big targets

- **Tap** a door to go down a level: a magnifier (*Look inside*) or the *Open up* door. Tapping a link or a device
  that has a door opens it too (the home router and the cell tower have a magnifier on their corner: look inside a
  device, issue #9); tapping any other device or link selects it as the current stop and shows its caption. The caption tells the
  story; *What can I explore?* (a toggle, issue #122) lights the doors up with their labels and swaps the caption's
  text for them as chips (*Look inside*, *Open up*, *How it travels*, *What it carries*, *Catch*), in the same space.
  Tapping it again, Esc, the scene or a door brings the story back (see "Doors" in [architecture.md](architecture.md)).
- **Tap a parcel** to catch it. A finger lands a moment behind a moving one, so the tap area trails it by a quarter
  of a second; *Catch* in the explore list catches one of a kind without aiming.
- **Pinch or scroll** is continuous zoom. Zooming far enough out goes back up a level, as does the round ⌃
  button, Esc, the breadcrumb or browser Back.
- **Flick** left or right, or up and down in portrait, to step to the previous or next stop at the current
  level. A slow drag still pans. The ◀ ▶ buttons and the arrow keys do the same.
  - The overview's stops are phone → Wi-Fi → AP → cable → router → fibre → internet.
  - The sub-path's stops are its hops. At dive level, flicking moves between the dives in route order: Wi‑Fi →
    cable → inside the home router → fibre (issue #38).
  - At dive level the camera doesn't jump from one dive to the next: it **zooms out, travels along the path and
    zooms back in** (issue #36), so you see the device between the two links, where the medium changes; from a link into the device's own dive
    and on to the next link it travels half as far each time. The
    highlight hops link → device → link on the way. It's calm on purpose (about 3 s to a neighbour): the
    camera slows past each device, a small pill there names the change ("Wi‑Fi → Cable"), and a pill at the
    bottom says where from and to. Quick repeated steps join into one, slightly quicker glide. With
    `prefers-reduced-motion` it cuts straight to the next dive.
  - With `prefers-reduced-motion` nothing flies (issue #41): every move (stepping, zooming in and out, the
    breadcrumb and its ladder, switching places, letting a packet go) cuts there under a quick 220 ms
    cross-fade, and an envelope opened from the peek doesn't grow into its dive. The URL and where focus goes
    are the same either way.
  - A run of links with the same technology is **one stop** (issue #34): inside the internet you step from the
    street's shared fibre (access) to the colours of the metro fibre and on to the long-haul backbone, and each
    looks different, instead of stepping through six identical "light in a glass thread" dives. The run has one
    magnifier, on its links and never over a device or its name (the run's glow shows what it covers), and its caption says what it covers ("3 stretches · via ISP core and Internet exchange").
  - The buttons point where the camera will go, so they are not mirrored in RTL.
  - A step button with nothing that way shrinks to a small ghost at its edge of the screen (it keeps focus, and a
    press still nudges it), so it doesn't cover the scene.
  - **One verb, one mark** (issue #182). On a phone held upright the step buttons sit just above the caption, whose
    corner has its own two buttons, and three chevrons side by side were easy to mix up. So each verb has its own
    shape: travelling along is a **solid arrow** (the step buttons, and the peek's ◀ ▶), opening and closing the
    caption is a **chevron** (its title's ⌃ ⌄, the only chevrons left), and folding it away is a **bar at the
    bottom**, as a window is minimised. The way on (▶, ▲ in portrait) is the filled button (`--btn-on`), as the
    peek's step on is; on a portrait screen it is also a pill that says where it goes ("Next stop", "Into: The
    internet"), so a child reads it rather than guessing from a shape. Its words are its accessible name. The way
    back stays a plain round button (its crossing in a small label above, as before), so the two don't look alike
    either.
- **Targets.** Badges, packets and the big round ◀ ▶ ⌃ buttons have 48 px+ hit areas (44 px for ▲ ▼ on a portrait
  phone). The chrome buttons are 31–40 px on a phone so they fit on two rows; nothing is under 24 px (WCAG 2.5.8).
  That's fine for grown-ups, but a bit small for the youngest.

### Portrait phone layout

- **Layout.** On a tall screen the path runs **vertically**: the phone is at the bottom and the internet at the
  top, so data goes "up to the cloud". The dives and the internet sub-path have their own portrait layouts, and
  the portrait overview is cropped tighter so the devices come out bigger.
- **Labels** are counter-scaled with a minimum on-screen size per style (13–14 px). Some labels flip above or
  below per orientation.
- **Chrome** fits on two tight rows (breadcrumb, then the controls at the end of the row), and the caption sits at
  the bottom where thumbs are. Language, sound, the style and About live in the ⋯ menu, so the controls fit a 360 px
  phone; below 400 px day/night does too, so *Explore* keeps its word (its ✷ alone, next to the ☀, was taken for the
  sun; issue #138); *Explore* is only there when there is something to explore (doors, a dive's envelopes, packets), and the others keep their place
  when it goes. The level's buttons say *Simple* / *Tech* there (da *Enkel* / *Teknisk*; #141). One row doesn't fit: the controls take about 230 of 360–390 px and would cut every breadcrumb short.
  The scene fades out under the bar (`--bar-fade`, the paper by default), so labels that slide under it don't show
  between the buttons. The breadcrumb is the depth ladder (#22, #14): its last rung carries a small mark of what lies
  below (a ladder and the count of doors, or a pip per envelope in a layer dive) and opens the list as a menu; on a
  big screen the count is in words ("4 ways down"), on a phone it's a badge whose words are its accessible name. Only
  a roomy desktop keeps a layer stack open beside the scene.
- **Caption** (issue #54). Folded to its title and two lines of the text (exploring: two rows of chips in their
  place, the title then only for screen readers; issue #122), so the scene keeps most of the
  screen. The title is a button (with `aria-expanded`): it opens the whole caption over the scene, up to the top bar
  and scrolling beyond that, with the scale line, the place, the gesture hint and *Want to know more?*. A tap anywhere on the folded caption opens it too (issue
  #138; it never opens by itself, which would cover the scene, and on a first visit the coach cards). The title
  again, or Esc, folds it, and so does going somewhere else. The scene doesn't move while it is open. The folded text
  is only cut short on screen: a screen reader reads it all, and the rest is one tap away. On a bigger screen the
  caption is never cut. The ▲ ▼ buttons sit on its top corners.
- **Folding the caption away** (issue #168). A round button in the caption's corner, marked with a bar at the bottom
  (issue #182; on every screen, and a phone's card has it beside its ⌃), folds it to the short landscape screen's pill: the title alone, bottom centre, so the scene can be
  seen. It stays folded through dives, travel and the time machine until a tap on the pill or C unfolds it (in memory
  only; a phone still starts with its own fold). The scene keeps its place: it doesn't refit as the caption folds or
  unfolds. Exploring while it's folded, the pill is the row of chips.
- **Phone on its side** (landscape, under 500 px tall; issue #15). The chrome is one slim row: the breadcrumb keeps
  its last two steps, with the rest behind "…". The caption is a one-line pill with the title, and tapping it opens
  the whole caption over the scene; exploring, the pill is one row of chips instead (as wide as the screen allows,
  scrolling sideways), at the same height. The scene keeps about 280 of 390 px (it had 105–145).
  - A dive fills that height, its border and flap tucked under the bars' edges (issue #33). Even so, 14 px on screen is
    about 42 world units, so dives here use a compact layout: bigger text, fewer labels, and small detail (the rows of
    an envelope, long MAC addresses, the nerd field list) drawn as lines or shortened. The caption still names it all.
  - The caught packet's panel goes in two columns, the hop and its words on the left and the envelopes beside them,
    so the envelopes get the height. The time machine is a wider, low card: the eras in a row, each picture beside
    its year and way online, and the chosen era's text under them (issue #136).
- **Dives fit their panel** (issue #136). A device's name at the edge of a dive grows on a phone and is longer in
  Danish; it slides in from the frame rather than being cut by it (`fit` on `Text` and `TagAt`). Two link dives
  whose panels overlap (close links on a phone, as the two fibres of a block of flats) never show at once: the one
  nearer the middle fades the other out, as beside a device's dive. `npm run evaluate -- --only=fit` walks every dive
  on a phone, upright and on its side, in both languages, by kids and nerds, and fails on anything cut.
- **Overrides.** The layout is picked from the aspect ratio. At the tag, the lab (Layout → Landscape/Portrait,
  or `?orient=portrait`) forces either one. The slimmed prototype only picks from the aspect ratio.

### Simple vs Technical, per style

The two levels are "Simple" and "Technical" to readers (`kid` and `nerd` in content; #141). Simple uses fewer, bigger
labels and plain-language captions. Technical keeps them and adds in-scene technical
tags (802.11ax · 5 GHz · 1024-QAM, 1000BASE-T, XGS-PON, NAT → 203.0.113.7, AS64500 · BGP, …) plus nerdier
captions and peek fields. Each style draws the tags its own way: luggage tags, HUD callouts, margin notes or
sticky labels. Technical tags are kept left-to-right even in a right-to-left language, so `192.168.1.23` doesn't
get reordered.

### "Want to know more?" (issue #4)

Every caption has a small learn-more slot, fed by per-scene data (`{ url, title, level }`). Links are filtered
by kid/nerd level, use the reader's language when a link exists in it, and otherwise fall back to English
(marked "(en)"). There are 1–2 real links per scene, mainly Wikipedia in English, Danish and German. Each style styles
the slot, but it's in the same place everywhere.

## Performance

Measured by `scripts/evaluate.mjs`: a production build (`vite preview`), headless Chromium, a **390×844 @2×
portrait phone** viewport, at **1× and 6× CPU throttling** via CDP. It measures:
- idle
- a flight into the fibre dive
- fibre idle
- the flight back out
- follow mode

The table shows the main-thread CPU time per frame at 6× throttle (lower is better; the budget is 16.7 ms) and
the worst frame. Every style held 60 fps at p95 in every phase.

| Style | Idle | Fly to fibre | Fibre idle | Fly out | Follow | Worst frame | JS (gz) | CSS (gz) | Fonts |
|---|---|---|---|---|---|---|---|---|---|
| Storybook | 2.6 ms | 8.6 ms | 4.4 ms | 5.4 ms | 5.2 ms | 67 ms¹ | 61 kB | 4.4 kB | 109 kB |
| Neon | 8.7 ms | 11.6 ms | 8.3 ms | 10.7 ms | 9.4 ms | 117 ms¹ ² | 60 kB | 4.7 kB | 223 kB |
| Sketchbook | 1.9 ms | 3.1 ms | 2.0 ms | 2.6 ms | 3.8 ms | 17 ms | 69 kB | 4.5 kB | 95 kB |
| Paper cut-out | 2.2 ms | 10.4 ms | 3.4 ms | 8.5 ms | 3.2 ms | 17 ms | 60 kB | 5.4 kB | 67 kB |

¹ A one-off hitch the first time the fibre world is mounted. Pre-mounting the dive while the camera starts
flying would remove it.
² At 1× (unthrottled). At 6× the same run was smooth, so the first-mount cost varies from run to run.

The full numbers (p50/p95/worst/cpu for both throttles) are in
[`look-and-feel-metrics.json`](look-and-feel-metrics.json). `npm run evaluate` still works on the slimmed
prototype. It measures every theme present (now only Storybook) and keeps the other styles' entries in the JSON
and their screenshots in `docs/img/` as they are. A re-run on the slimmed Storybook build (not committed, so the table stays
comparable) gave 57 kB JS (gz), 8.1 ms/frame for the flight into the fibre at 6×, and a worst frame of 17 ms: the
first-mount hitch is gone.

### What was learned

- **No SVG filters inside the camera.** No style uses `feTurbulence`, blur or `drop-shadow` on anything that
  moves or zooms. Glow is layered strokes (neon), shadows are offset duplicate shapes (storybook, papercut), and
  paper grain is a static pattern in the screen-space overlay. The earlier spikes had already shown that
  filtered layers re-rasterise on every zoom frame.
- **Neon is the most expensive** at ~9–12 ms/frame at 6×. The cost comes from many translucent layered strokes,
  animated LEDs and trails. It's still within budget, but it has the least headroom. The scanlines are in screen
  space.
- **Sketchbook is the cheapest** despite rough.js, because the boil cycles pre-generated paths instead of
  regenerating them. The first version generated them lazily and hit p95 ~50 ms on the first flight, so paths
  are now **prewarmed at idle**. A core-level "prewarm hook" for theme art would be cleaner than each style doing
  it itself. The twos clock also means the DOM only changes 12 times a second.
- **Papercut's depth layers** cost ~10 ms/frame during flights at 6×, which is the price of moving several large
  paper shapes independently.
- **Dropped:** papercut first used a CSS `radial-gradient()` as an SVG fill for the vignette. SVG doesn't
  support that, and it rendered as a black rectangle. It's now a static SVG `radialGradient`.
- **Fonts** are all self-hosted OFL faces via @fontsource, subset to Latin (Latin + Arabic while the prototypes
  had an Arabic test pack). Only the active style's fonts load. Neon was the heaviest (223 kB), because Noto Sans
  Arabic alone is 162 kB; Latin readers paid ~61 kB.
- **Caveat:** CPU throttling doesn't throttle the GPU. Raster cost on a real mid-range phone (big filled paper
  shapes, many translucent strokes) needs a check on an actual device. Try the styles on the kids' phones and
  tablets with the lab's fps counter (at the tag).

## Recommendation

- **Pick one style for the kids, not four.** The theme plumbing works, but every new device, technology and
  scene needs art in each style that should look finished. Four art directions means four times the art.
  - **Storybook** is the strongest candidate for the kids. The courier characters make packets something you
    *want* to follow, the house makes "home network" obvious, and the picture-book palette is the friendliest.
  - **Paper cut-out** is the close second. It has the best depth and zoom feel, but it's less cheerful.
  - **Sketchbook** is the most personal (it *is* dad's paper diagrams) and the cheapest to extend. Pick it if
    you'd rather draw new content quickly than polish it.
- **Neon as the nerd skin.** It suits the nerd level, so it could remain an optional second style, or become what
  nerd mode switches to. Its tags and HUD are the best home for protocol detail.
- **Interaction defaults:**
  - Fly for sideways steps, the breadcrumb and Back.
  - Portal for "look inside" dives, and fly for "expand" (the sub-path is a place you travel along).
  - Spring feel with a small overshoot.
  - Lively packets on.
  - Parallax fade for reduced motion.
  - Keep "twos" only if sketchbook wins.
- **Keep follow + peek.** It turns the envelope idea (issue #5) into something you can see happen at each hop,
  and it's the part most likely to make a kid ask "why is that one locked?".
- **Sound:** keep it, muted by default, but it needs ears. Try it with the kids and cut anything that gets
  annoying after a minute.

## Open questions (to decide after trying it with the kids)

Questions 1–3 are settled by the [decision](#decision-after-trying-it): storybook, fly and ease. Question 4
(stop-motion) is moot now that sketchbook isn't the pick. The rest are still open.

1. **Which style?** Did the kids gravitate to one? Did they want to follow the couriers (storybook) or the paper
   planes (papercut)? Is "dad's drawings" (sketchbook) a feature for them?
2. **Portal or fly into dives?** Is the portal circle magical or disorienting? Do they understand where they are
   after it?
3. **Spring or ease?** Does the spring overshoot delight or get tiring on repeated sideways steps?
4. **Stop-motion.** In sketchbook, does "twos" read as hand-made or as laggy?
5. **Sound.** Keep it? Which timbre? Should the followed packet's arrival blip be louder? (#189: kept, on by
   default, and the arrivals you only watch quieter.)
6. **Portrait path direction.** Is "up to the cloud" (phone at the bottom) right? Would a zig-zag or a
   left-to-right scroll read better on a phone?
7. **Swipe to step vs swipe to pan.** A fast flick steps and a slow drag pans. Do small fingers trigger the wrong
   one?
8. **Nerd mode.** Should it change the style (e.g. switch to neon) or only the labels?
9. **Arabic.** Settled (issue #11): dropped for now. We ship only languages we can review (English, Danish and German);
   the engine keeps RTL support for a reviewed language later.
10. **Deeper hops.** The sub-path hops are "recursion-ready" but don't expand yet. Which one first: BNG / ISP
    core, the IXP (peering agreements), or the video server (CDN caches)?
11. **Issue #3, more access technologies.** xDSL, FTTH/FTTB, PON and dial-up become new `Link` techs with their
    own layer stacks (`TECH_STACK` in `layers/stacks.ts`) and optional art per style. Should they appear as
    alternative first hops in the overview (a "how does *your* home connect?" picker), or as separate scenes?
12. **Issue #2, IoT and LoRaWAN.** The node/link model should cope (a LoRa sensor → gateway → network server is
    just another path with a `lora` tech and stack), but it needs a second "request" story, e.g. "the plant sensor
    says it's thirsty". Which story?
13. **Issue #4, learn-more links.** Is Wikipedia OK for the kid level, or should kid links point to curated
    kid-friendly resources, and in Danish where possible?
14. **Issue #5, reusable layers.** The layer components are reused along the path already. The next step is
    letting a *scene* reuse them, e.g. the TCP layer as its own zoomable dive at any hop. Is that the "down the
    layers" direction you want?

**Status after the core architecture** ([architecture.md](architecture.md)):
- **10.** Scenes now nest to any depth; the access fibre inside the internet is the first third level. Dives into *nodes* (the BNG, the IXP, the CDN) are the next step.
- **11.** Answered by *places*: each access technology is a place in the "Where are you?" picker, with its own route and backdrop. The desk (a laptop on a cable) was added that way, as content only.
- **12.** Plugs in as a place plus an activity (see the table in architecture.md). The story is still open.
- **13.** Links are now per level and per language, and fall back to English. Curating kid-friendly Danish sources is still open.
- **14.** Layers are reusable per hop, with a context (`LayerCtx`). "Down the layers" dives are a follow-up issue.
