# Authoring content

Everything the reader sees is a folder under `content/`. This guide shows how to add each kind of thing. Adding a
folder never needs an engine change; if one seems to, open an issue. [architecture.md](architecture.md) explains how
the pieces fit together.

**The dev loop:** `npm run dev`, then edit and save.
- Mistakes show up in the browser's error overlay and the console, with the file, the field and a suggestion:

  ```
  content/places/desk/place.ts › hops[1].link: "ethernett" is not a technology. Did you mean "ethernet"? Known: backbone, ethernet, gpon, …
  content/nodes/laptop/node.ts › strings: missing English string "node.laptop.name" (in content/nodes/laptop/locales/en.json)
  ```

- `npm test` runs the same checks, plus a walk through every place × activity. `npm run check:content` also prints translation coverage.

**Rules that keep content pluggable:**
- **Folder name = id.** Use lower-case kebab-case (`cell-tower`).
- **Imports.** Definition files (`*.ts`) import only from `$core/define` and relative files. Svelte files import only from `$core/api` and relative files. A test enforces this.
- **Strings.** Every folder has `locales/en.json`; other languages are optional and fall back to English per string. Keys are namespaced for you: `content/nodes/laptop/locales/en.json` → `node.laptop.*`.
- **Levels.** Any string can be split by level: `"kid": "…", "nerd": "…"`, or `"stop": { "router": { "kid": …, "nerd": … } }`.
- **Spoken descriptions (`describe`, issue #53).** Every scene a reader can reach has a `"describe": { "kid": …, "nerd": … }`
  next to its caption text, in **every** shipped language (no English fallback: a test fails if one is missing, and
  lists the keys it tried). It is what the picture shows, for someone who can't see it: the announcer and read aloud
  say it on arrival. Write it to be heard: two to four short sentences, in the order you'd see things (the big
  picture, then along the path), saying what moves. Don't repeat the caption, which says what it means (it is read
  after it), and stay under 400 characters. It sits under the same key as the scene's own text, so a variant for one
  technology, device, hop or role is the same key with `.describe`:
  - a link or device dive: `describe`, or `<tech or node id>.describe`
  - a layer dive: `describe`, `<layer>.describe`, `role.<role>.describe`, `at.<node>.describe`, `sealed.describe`
    (most specific first, as for `kid`/`nerd`; `{hop}`, `{yours}`, `{layer}`, `{sender}` and `{next}` are filled in)
  - the overview: the place's own `describe` (one per place on the route, said in turn)
  - inside a group: the node's `inside.describe`, or a place's `inside.<group>.describe`
- **Addresses.** Use the documentation ranges: 192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24 for public addresses; 192.168.x, 10.x and 100.64/10 (CGNAT) for private ones.

## Worked example: a laptop on a cable at the desk

This was added in one content-only commit ("Content only: a laptop on a cable at the desk"), and later became one
of the ways online from home (#151). It is two folders.

**1. The node:** `content/nodes/laptop/`

```ts
// node.ts
import { defineNode } from '$core/define';
export default defineNode({
  kind: 'device',
  role: 'endpoint',             // opens every layer, like the phone
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Laptop', title: 'Laptop', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/B%C3%A6rbar_computer', title: 'Bærbar computer', level: 'both', lang: 'da' },
  ],
});
```

```svelte
<!-- art/Device.svelte: a body in a 200×200 box, in the theme's vocabulary -->
<svelte:options namespace="svg" />
<script module lang="ts">
  export const face: [number, number] = [100, 86];   // where a theme may draw a face
</script>
<rect class="body peach" x="34" y="30" width="132" height="104" rx="14" />
<rect class="screen" x="47" y="43" width="106" height="78" rx="8" />
…
```

```json
// locales/en.json (and da.json…)
{ "name": "Laptop", "yours": "your laptop", "kid": "A computer you can fold shut…", "nerd": "An endpoint like the phone, but wired…" }
```

**2. The place:** `content/places/desk/`

```ts
// place.ts: hops and links alternate, from the reader's device to where it joins the shared segment
import { definePlace } from '$core/define';
export default definePlace({
  variantOf: 'home',                                         // another way online from home (below)
  order: 1.1,                                                // its position in "How do you get online?"
  era: 'today',                                              // home's ways online have eras (the time machine)
  hops: [
    { at: 'laptop', addr: '192.168.1.40' },
    { link: 'ethernet', km: 0.003 },                         // an existing technology: its stack, look, colour and dive (copper); `km`: roughly how long
    { at: 'router', addr: '192.168.1.1', natTo: '203.0.113.7:61757' },
    { link: 'gpon', km: 1.2 },                               // its dive (the fibre scene in GPON mode) comes along
    { at: 'cabinet', in: 'internet', owner: 'isp' },         // `in`: shown when the internet is unfolded; `owner`: whose network it is
    …
    { link: 'backbone', km: 25 },                            // ends with the link into the activity's next segment
  ],
  entry: { internet: 'home' },                               // inside the internet, the house stands for "where you came from"
  layout: {
    overview: {
      landscape: { nodes: { laptop: [420, 575, 220], router: [1010, 580, 200] }, links: { 'laptop-router': { bend: -0.18, label: [0, 60] } } },
      portrait:  { nodes: { laptop: [300, 1320, 260], router: [560, 900, 230] } },
    },
    internet: { … },
  },
});
```

```svelte
<!-- art/Backdrop.svelte: optional. This one reuses the house and adds a desk -->
<script lang="ts">
  import { Depth, type PlaceBackdropProps } from '$core/api';
  import House from '../../home/art/Backdrop.svelte';
  let props: PlaceBackdropProps = $props();
</script>
<House {...props} />
<Depth d={1.03}> … the desk … </Depth>
```

```json
// locales/en.json: the place's name, its overview text, and what it says about stops in its own context
{
  "name": "At home, at the desk",
  "access": "Laptop on a cable",                             // its chip in "How do you get online?"
  "kid": "No radio this time: …", "nerd": "Wired: Ethernet frames go straight …",
  "tag":  { "laptop": "Ethernet · 192.168.1.40" },
  "stop": { "laptop": { "kid": "The laptop wants a video too. …", "nerd": "…" } }
}
```

That is all. At home, the picker now offers "Laptop on a cable" in every activity. Catching a packet shows an Ethernet frame on
the first hop and the NAT at the router, and `#/en/desk/watch-video/internet/home-cabinet` flies three levels down.

## Add a node

`content/nodes/<id>/`:
- `node.ts`: `kind` is `device`, or `network` for a group that unfolds into its own path scene (list it in the activity's `groups`). Add a default `role` and `learnMore`.
  A group can sit inside another one: list it as `{ id: 'datacentre', in: 'internet' }`, after its parent, and put its
  hops `in` it. It is drawn as one node in its parent's scene and unfolds into its own, entered from the hop before it.
- `art/Device.svelte`: optional; without it the theme draws a plain fallback body. Draw in a 200×200 box with the vocabulary classes: `body`, `peach`, `orange`, `teal`, `berry`, `cloud`, `screen`, `hi`, `button`, `accent`, `line`, `thin`, `wave`, `roof`. Export `face` if a face fits. It loads, as a small chunk of its own, with the first route that draws it (#91), so a new device adds nothing to the first load.
- `locales/en.json`:
  - `name` (required) and `kid`/`nerd` (the caption when it's the stop)
  - optionally `tag` (a small technical label in nerd mode) and `yours` ("your phone", used when this is the reader's device)
  - for network nodes, `inside` (`title`, `kid`, `nerd`, `describe`) for the unfolded scene, and optionally
    `inside.coach`: what a first visit's coach mark on its *Open up* says ("There's a whole world inside the
    internet — open it up!"; else a generic line, `coach.expand`)
- `art/Backdrop.svelte` (network nodes, optional): drawn over the theme's backdrop in the unfolded scene (the data
  centre's hall). It gets `PlaceBackdropProps`; keep it faint and cheap.

## Add a technology

`content/technologies/<id>/technology.ts`:

```ts
defineTechnology({ look: 'radio' | 'cable' | 'fibre' | 'trunk', colour: '#rrggbb', stack: ['<layer>', …], rate: { down, up }, dive?: '<scene>', learnMore })
```

- `rate` (required, bit/s each way): what a reader really got on it in the era it stands for, not the standard's peak
  (`hspa`: 2 Mbit/s, not HSDPA's 14), with a comment saying so. The route's slowest link sets the caption's "how long
  it takes" and how fast the parcels go (#59). A link can override it, as it can the stack (`home-dsl`'s Wi‑Fi is
  802.11n: `{ link: 'wifi', rate: { down: 50e6, up: 50e6 } }`).

- `stack` holds the **lower** layers, outermost first; the activity's flow adds IP and above. A link can override it (`{ link: 'metro-fibre', stack: ['ethernet', 'gtp'] }`).
- `look` picks how every theme draws the link, so a new technology needs no theme change.
- Strings: `name` (the link label), `kid`/`nerd`, and optionally `tag`.
- Every technology needs a `dive` (its signal: an existing scene with per-technology strings, or a new one), and every
  layer in its `stack` a layer dive, so a reader can always go all the way down (a content test checks this).
- Consecutive links with the same technology (and the same dive) are **one sideways stop** at dive level: they are one
  dive, with one magnifier on its links (placed clear of the devices and their names) and a "2 stretches · via …" line in its caption (issue #34). To make a stretch its own stop, give it its own technology
  or its own `dive` (the undersea cable is a `submarine` technology, not a backbone link with a note, #39).

## Add a layer (issue #5)

`content/layers/<id>/`:
- `layer.ts`: `defineLayer({ fields, openAt?, seals?, tunnel?, switched?, code?, bytes?, dive?, learnMore })`.
  - `fields`: its header, in wire order (see below).
  - `openAt`: the roles that read it (TCP, TLS and HTTP: `['endpoint']`). Everyone else leaves it closed. The default
    is everyone.
  - `seals: true`: what's inside is encrypted for every hop that doesn't open this layer (TLS).
  - `tunnel: true`: its addresses are the ends of the run of links that carry it, and the link frames around it end
    there too (GTP‑U: cell tower ↔ mobile core).
  - `switched: true`: a label-switched layer (MPLS). A router between two links that carry it only swaps the label:
    it reads nothing inside, its `{ttl}` is the layer's own, and the packet's TTL catches up where the label comes off.
    Dives see it as `ctx.switched` and look up `role.switched` text first.
  - `code`: how outer layers name this one, e.g. `{ ethertype: '0x0800 (IPv4)', ipproto: '6 (TCP)' }`.
  - `bytes`: size not described by `bits` (a text header, a body), `{ up, down }`.
  - `dive`: a layer dive scene (see below): its envelope in the peek gets a magnifier that flies into it.
- Strings: `name` and `note` (levelled), `line` (the one-line summary in the detail tree, with `{fieldId}` values),
  `sealed` (optional, levelled: what kids read on it where it's closed), and per field
  `field.<id>.name` (levelled) and `field.<id>.about`.

Then reference it from a technology `stack`, a link override, or a flow `stack`.

### Add a header field

A field is `{ id, bits?, value, use?, kid? }`:
- `bits`: its size on the wire. Give every field `bits` and the detail view draws the header diagram.
- `value`: a template. Plain text is the same on every hop (`'4'`, `'010 (DF)'`); `{ up, down }` differs by direction;
  facts fill in per link: `{src}` `{dst}` `{sport}` `{dport}` `{ttl}` `{mac.src}` `{mac.dst}` `{mac.tx}` `{mac.rx}`
  `{tunnel.src}` `{tunnel.dst}` `{len}` `{payload}` (`{payload+8}`) `{sum}` `{crc}` `{label}` `{ack}` `{inner.<code>}` (see
  [architecture](architecture.md#the-packet-model-modelpacketts)). `'@ask'` shows the string `value.ask` instead. An
  empty value leaves the field out in that direction.
- `use`: the roles that act on it when the packet arrives (`['router', 'nat']` for TTL), or `true` for every hop that
  receives the layer. Used fields are highlighted; kids see only used, changed or new fields.
- `kid`: show it to kids: `true` (addresses become names like "your phone") or a kid value.
- `bitsIn`: its size in an era where it differed, by era (`{ 1995: 6 }`: RFC 793's six reserved bits and six flags,
  before ECN took two of each). Give the era's own `about` in the layer's era block (`1995.field.<id>.about`).

```ts
{ id: 'ttl', bits: 8, value: '{ttl}', use: ['router', 'nat'], kid: true },
```

```json
"field": { "ttl": { "name": { "kid": "Steps left", "nerd": "Time to live" }, "about": "Each router takes one off; at 0 the packet is dropped." } }
```

Nothing is written per hop: values change because the route changes (a NAT's `natTo: 'addr:port'`, a router's TTL, a
bridge passing a frame on, a tunnel starting). The validator names unknown facts, codes and missing strings.

## Add a dive scene

A dive scene explains a link (`explains: 'link'`, the default: Wi-Fi, copper, fibre, 5G), a device (`explains:
'node'`, see "Add a device dive") or a layer at one hop (`explains: 'layer'`). Technologies and links may only point at
link scenes, devices only at device scenes, layers only at layer scenes.
A link scene is the **signal world**: no envelopes, only bits as waves, light or electricity; *how do the bits
move?* A layer scene is the **paper world** of envelopes and stickers; *who is this for, how is the road shared,
did it arrive intact?* Keep that split so the two don't become near-duplicates.

`content/scenes/<id>/`:
- `scene.ts`: `defineScene({ learnMore })`.
- `Scene.svelte`: gets `{ subject, time }`: the link it explains, with `subject.link.tech`, `subject.link.stack`, and its hops via `subject.route.hops[subject.link.from]`. It draws in the scene world (landscape 1600×900, portrait 900×1600; read `view.orient`). Build it from:
  - `time`, its clock (seconds), and `view.level`. Animate on `time`, not `view.time` (a content test checks): the
    clock holds still while the scene is hidden, so a dive mounted for a flight doesn't redraw unseen (#181). Pass it
    on to the scene's own art as a prop
  - `Node` (a device in the current theme)
  - `Text` (text that stays readable at any zoom)
  - `TagAt`
  - its own `art/*.svelte` and maths files
  - for a moment that plays once when the reader gets there (the dial-up handshake): `arrived()`, a function that
    turns true while the reader is at this scene (call it at init and derive it, `$derived(at())`, so it changes
    only when it flips), and `soundOut()`, the sound output (`{ ctx, dest }`) when sound is on and the reader's first
    tap or key has let audio start, else `null`. Read both in a `$effect`; it reruns when either changes (so a reader
    who arrived by link hears it from their first tap), and its cleanup stops the sound when the reader leaves or
    mutes. Keep it short (a few seconds) and only ever behind `soundOut()`.
- Strings: `title` (required) and `kid`/`nerd`. Per-technology variants such as `gpon.title` or `gpon.kid` win when the subject is that technology.
  When one scene explains several technologies that can sit next to each other on a route, give each its own
  `<tech>.title` and draw the difference: a reader steps from one stretch to the next and should see what changed (a
  content test checks the titles differ). `fibre-light` picks a mode from `subject.link.tech` (`light.ts` › `modeOf`):
  **access** (GPON: a splitter shares one thread with the street, the light coming home reaches every house, the houses
  take turns going up), **metro** (DWDM colours with mux and demux; the exchange's cross-connects too, with their own title and a LAN-WDM tag) , **long haul** (the backbone: eight colours,
  a booster every 80 km) and **under the sea** (`submarine`: a cable on the sea floor between two landing stations,
  a cross-section of it, repeaters every 60 km, `sea.ts`). The last two draw the stretch to scale from the links'
  `km` (`subject.run`, the links of the stretch: their `km` added up, one booster per span, a running km counter,
  #42), so give each link its real-ish `km`. Each mode is its own component with portrait, landscape and
  short-landscape layouts. 1995's technologies reuse the last two (`atm`: long haul, `submarine-sdh`: under the sea)
  with one colour on the thread, as before DWDM (1996), and their words under their own id (`light.ts` ›
  `oneColour`, `wordsOf`: `atm.title`, `submarine-sdh.kid`).
- `copper-pulses` picks its line code from the link's `rate` (`copper.ts` › `codeOf`): up to 10 Mbit/s it's
  10BASE-T's Manchester on two pairs taking turns (1995's ISP rack), up to 100 Mbit/s 100BASE-TX's MLT-3 on two
  pairs both ways at once (a 2010 home router's LAN ports: the `fast-ethernet` technology), above it 1000BASE-T's
  PAM-5 on four pairs both ways; a two-pair code's words are under its name (`manchester.title`, `mlt3.speed`).
- `tdm-frames` is every E1 and T1 (`pri`, `e1`, `t1`): its mode comes from the technology id (`tdm.ts` › `MODES`),
  and it draws the same row of timeslots as `modem-call`'s card (`tdm-frames/art/Slots.svelte`, imported by both).
- The caption adds **What it carries** chips by itself, one per layer in `subject.link.stack` that has a dive, and
  the dives of those layers get a **How it travels** chip back to this scene; the title names it there, so make it
  say what the signal is ("Electricity in copper").
- An optional `extra` (issue #31) is a nerd-only note under the caption's text, for what's next or beside the picture
  (PoE and 10GBASE-T on copper, Wi‑Fi 7 MLO, XGS-PON next to GPON) without a new scene. It is looked up like the
  text, most specific first: `<tech>.extra` then `extra` in a link or device dive; in a layer dive `at.<node>.extra`,
  `role.<role>.extra`, … then `extra`. Give it in every language (it is a plain string, nerd only); keep it to two or
  three sentences, since a phone's folded card cuts it to one line.

Point a technology's `dive` at it, or a single link's `dive`.

## Add a device dive

A device dive looks inside one device on the route (issue #9): the home router's switch, Wi‑Fi radio, routing and NAT
"brain" and fibre ONT; the cell tower's antennas, radio unit and baseband. Its story is the **medium conversion**:
what comes in on one link (a radio wave, electric pushes, light) is plain bits inside, is handled, and leaves on the
next link as something else. Readers get there by the magnifier on the device's corner, by tapping or pinching into
the device, or by stepping sideways from the link before or after it (link → device → link, issue #38); its URL step
is the hop id (`#/en/home/watch-video/router`).

- `content/nodes/<id>/node.ts`: `dive: '<scene id>'`. Only `kind: 'device'` nodes have one (a network is a group,
  which opens up into its own path instead), and only where the device is on the route's chain (not as a group's
  stand-in entry or on a side branch).
- `content/scenes/<id>/scene.ts`: `defineScene({ explains: 'node', learnMore })`.
- `Scene.svelte`: gets `{ subject }`, a `NodeSubject` (`import type { NodeSubject } from '$core/api'`):
  - `subject.hop`: the hop (its `node`, `role`, `addr`, `natTo`); `subject.sceneNode`: the device as drawn;
  - `subject.in` / `subject.out`: the route links arriving and leaving (null at an end of the route), with `tech`
    (`look`, `colour`, `id`), `stack` and their `from`/`to` hops; `subject.route`: the whole route.
  Draw the device opened up, with the devices before and after (`Node`, `nameOf`) and the links in their
  technologies' colours, and adapt to the links either side by their `tech.look`, not by device ids: the router
  scene lights the room the parcel comes in by (the switch for a cable, the Wi‑Fi radio for radio, the ONT for
  fibre) and veils the rest.
- Wrap the scene in `<g text-rendering="geometricPrecision">`. The camera rescales a device dive on every frame of the
  zoom out to the next stop, and Chrome lays hinted SVG text out again each time (this cost frames at 6× CPU).
- A phone on its side, as for layer dives: no text under 14 px (`legibleSize()`, about 42 world units there), so the
  router and the cell tower have a compact layout with wider rooms, their titles only and no device names.
- Strings: `title` and `kid`/`nerd`, or per device (`<node id>.title`, `<node id>.kid`…) for a scene serving several.
  The caption adds **What it carries** chips by itself: the envelopes of the links either side that have a dive, at
  this device; the depth ladder shows the envelopes it handles on one of its links, over that link's signal.
- A device with a dive of its own **ends a stretch**: two links of the same technology either side of it become two
  sideways stops, with the device between them. A device without one stays inside the stretch.
- Its layer dives (the peek) stack above it, as upper floors.

## Add a layer dive

A layer dive is one layer as seen at one hop: IP at the home router, TCP at your phone. Readers get there by tapping a
magnifier on an envelope in the peek panel (or by URL: `#/en/home/watch-video/router~ip`), and step up and down the
stack of the same hop with the ▲/▼ buttons, a vertical flick or the arrow keys. **One scene serves every hop**, so it
adapts to where it is opened rather than having near-duplicates (the IP dive is a signpost at a router, a swap
notebook at a NAT, a carrier-grade NAT at the mobile core, an envelope swap at a bridge, a door plate at an endpoint).

`content/scenes/<id>/`:
- `scene.ts`: `defineScene({ explains: 'layer', learnMore })`.
- `Scene.svelte`: gets `{ subject }`, a `LayerSubject` (`import type { LayerSubject } from '$core/api'`):
  - `subject.layer`: the layer id; `subject.open`: whether this hop reads it (else it is sealed here);
  - `subject.ctx`: the hop's `LayerCtx`: `to` (this hop, with its `role`), `link` (the link
    it arrived on), `client`/`server`, `src`/`dst`, `nat`, `ttl`, `dir`, `flow` and `level`;
  - `subject.route`: the whole route (`chain`, `links`, `asides`, `activity`), to build what the hop knows from it
    (the IP dive derives a router's signposts from the next and previous hops).
- Vary by context, most general first: `subject.open` (open vs sealed), `ctx.to.role` (`endpoint`, `nat`, `router`,
  `bridge`; a `passive` hop has no layer dives), then facts (`ctx.nat`, the link's `stack`). Avoid naming node ids.
- Draw it like the other layer dives so they read as a family: a road along the bottom with the client, the server
  and this hop (`Node`, focused) and names under them (`nameOf`); paper cards above it for the close-up; big
  walking parcels. Keep the flap at the top centre of the panel empty (the envelope panel is drawn there).
  Portrait (900×1600) and landscape (1600×900) are both needed; a short landscape screen (a phone on its side)
  benefits from a compact layout with bigger text and fewer labels (see `layoutFor` in `scenes/ip-post/post.ts`).
  Text never draws smaller than the theme's minimum on screen, so check the portrait phone for overlaps.
  That holds for `Text` and `Label`; raw `<text>` (inside a drawing) doesn't, so size it with `legibleSize()` from
  `$core/api` (`const legible = legibleSize()`, then `legible(36)` is 36 or the world size that shows as the minimum;
  inside a group scaled by `k`, use `legible(36 * k) / k`) and let its box grow with it. In short landscape 14 px is
  about 42 world units: hide detail that can't be that big (draw an envelope's rows as lines, shorten long values).
- Loop on `time` with a pure maths file (as `ip-post/post.ts`), so screenshots at a fixed clock are stable.
- Strings (`locales/en.json`, `da.json`), looked up most specific first for `title` and `kid`/`nerd`:
  1. `at.<node id>` (one hop, e.g. `at.mobile-core` for carrier-grade NAT)
  2. `role.<role>` (e.g. `role.nat`; a router that only switches an MPLS label tries `role.switched` first)
  3. `sealed` (when this hop can't open the layer)
  4. the plain `title`/`kid`/`nerd`

  Each is looked up first under the layer (`<layer>.at.<node id>`, `<layer>.role.<role>`, `<layer>.sealed`,
  `<layer>`), so **one scene can serve several layers** by switching on `subject.layer` (`sticker-doors` is
  Ethernet, VLAN and MPLS: the same box of doors with a different book).
  `{hop}` (this hop's name), `{yours}` ("your phone", "your PC") and `{layer}` are filled in: write `{yours}`, not
  "your phone", since the device depends on the place and the era. From the link frame, `{sender}` (the hop that
  wrote it: bridges pass frames on) and `{next}` (the next hop the packet goes to, the one a router ARPs for) are too:
  write those rather than an address or a device, which differ by hop and direction. Scene labels are your own keys,
  read with `strings('scene.<id>')`; nerd callouts conventionally live under `tag.*`.
- A link layer (one in a technology's `stack`: Wi‑Fi, Ethernet, GPON…) is the envelope for one stretch; its dive
  gets a **How it travels** chip down to that link's signal by itself. End kid texts with a line bridging down
  ("Underneath, it travels as flashes of light").

Then set `dive: '<id>'` in `content/layers/<layer>/layer.ts`. The layer panels of a hop stack vertically around it in
its path scene, so nothing else needs a layout. Dive scenes are loaded on demand, so they cost nothing at start-up.

## Add a segment

`content/segments/<id>/segment.ts`: `defineSegment({ hops, aside?, entry?, layout? })`. It is a reusable stretch of route that activities list in `route`. `aside` adds a dashed alternative branch that packets don't take (transit).

## Add an owner (issue #20)

The internet is a network of networks. `content/owners/<id>/owner.ts` (`defineOwner({})`) is a company that runs
some of the hops: your internet company, the exchange, the video company, a transit carrier. Its only string is
`name`, split by level (`"name": { "kid": "Your internet company", "nerd": "Your ISP · AS64500" }`; use the
documentation AS numbers 64496–64511).
- A hop (or `aside`) says `owner: '<id>'`. Inside a group, the hops of one owner get a tinted, rounded region, and the
  owners on the packets' way are named on a sign; a side branch's region stays faint and unnamed. The tone is the
  owner's place along the route, so it is the same colour in every scene.
- A layout may place the signs: `owners: { isp: [x, y] }` next to `nodes`; the region reaches out to the sign.
  Without one, the sign sits on the region's top edge.
- Give every link a rough `km`. The caption turns them into the trip's scale: how far the video is, how many
  companies carry it, how far a stop is from you and how long a link is (with light's time in fibre for nerds).

## Add a place

`content/places/<id>/`: as in the worked example.
- `place.ts` (`definePlace`) starts with the reader's device and ends with the link into the activity's next segment.
- `art/Backdrop.svelte` is optional.
- Strings: `name` (required), `kid`/`nerd`, `tag.<instance>`, `stop.<instance or link id>`, and `inside.<group>`.
- A place of its own (not a variant, below) says where it is, `where` ("at home", "on the go"), and has a `picture`
  in "Where are you?": a node of kind `place` whose art stands for it (`home`: the house; `on-the-go`: a phone on the
  move). Its variants show the same picture. Validation fails without them.
- A link's `label: [dx, dy]` is the offset of its name from its door badge (the link's midpoint, unless the badge
  slid along the link to keep off a device's name). A third entry, `'end'` or `'start'`, puts that end of the name
  there instead of its middle, so a long translation grows away from the link (the street's fibre in portrait:
  `label: [-66, 15, 'end']`). As the name and badge grow on a small screen the name moves out to stay clear of the
  badge, and where its spot is taken it goes to the nearest free side of the badge.
- On a small screen, names and badges draw up to about twice their authored size. Leave room for that:
  `overlap.test.ts` fails when names, badges, owner signs, nerd tags and devices overlap at that size, in any
  language. Tags shorten to their first fact, or wait for a zoom, where they have no room, but never on a big screen.
  When it fails, nudge the devices a little (it prints which two meet, at which size).

Validation checks that the place makes a well-formed route with every activity. To keep an activity to some places,
use `only: [...]` on its place slot.

### Another way online: a place variant (issue #3)

The same place reached another way (the house on the phone line rather than fibre, a block of flats with fibre to
the building, a laptop on a cable at the desk) is a place of its own with `variantOf: '<base>'` in `place.ts`:
- Its hops swap the start device, the access link and the devices around it (`desk`: a `laptop` on an `ethernet`
  cable to the router; `home-dsl`: a `dsl-router` with a modem, `vdsl` to a `dslam` in the street cabinet;
  `home-fttb`: an Ethernet riser to a `building-switch`, then `fttb` fibre; `home-dialup`: no router at all, the
  `laptop` dials over `dialup` to the telephone `exchange` and on to the ISP's modems at the `bng`, and PPP hands the
  laptop a public address).
- `layout: home.layout` (or `...home.layout` plus its own groups) keeps the base's spots, so its backdrop can redraw
  the same room (`home-dsl` puts a telephone in the house; `home-fttb` turns it into a flat in a block). A variant
  with other devices gives its own `layout` (`home-dialup`: the desk's computer, the line past the telephone).
  Reuse the base's backdrop pieces and existing device art where they fit: backdrops and device art load up front.
- Strings: the base and every variant need `access`, the short name of their way online, which mixes the device
  or the link in the house with the line where that tells them apart ("Wi‑Fi · fibre", "Laptop on a cable", "In a
  flat"). The picker lists the base once, and under it a row of `access` chips, one per family member of the era you
  are in, in `order` (the other eras' members are the time machine's). The time machine shows it under each era.
- Variants are one level deep: a variant of a variant fails validation, as does a missing `access`.
- URLs name the variant (`#/en/home-dsl/watch-video`), so every link, dive and list view works as for any place.

`placeFamily(id)` in `src/model/registry.ts` lists a place and its variants, `basePlace(id)` the base.

### Add an era (issue #59)

An era is a time the place looked different: the home in 1995 (dial-up on a PC), 2010 (DSL, a laptop on Wi‑Fi) and
today (fibre, a phone). The time machine (its button in the top bar, 🕰️ in the caption, "Travel in time" in the list
view) switches between the members of a place family by their era, so an era switch is a place switch: no new route,
URL or dive. From a place with no member in an era, it goes to that era's own trip, the first place of that era, and
says so. Every family has a member in each era today (on the go in 1995 is `on-the-go-1995`, a laptop on a GSM data
call), so this is for a family added later.
- `content/eras/<id>/era.ts`: `defineEra({ year: 1995 })`. The folder name is the id (`today` is the present,
  whose `year` is the current one). The panel lists eras by `year`.
- Strings in `locales/<lang>.json`: `name` (the year, or "Today"), `kid`/`nerd` (what home internet was like then, as
  the panel shows it) and `describe.kid`/`describe.nerd`: what the panel's picture of that era shows, which is the
  start device of that era's trip (its first hop: the PC, the laptop, the phone). Write `describe` in English, Danish
  and German. The place picker shows the time machine's line ("In 1995 you'd have done this at home.") under a place
  with no way online in the era you are in.
  Where an era has a member of the place's family, `at.<place>`, else `at.<base place>` (`kid`, `nerd`,
  `describe.kid`/`.nerd`), takes the place of the era's own words in the panel and the arrival (2010's `at.on-the-go`:
  phones on 3G; `at.desk-2010`: a cable to the DSL modem). The era texts load with the dive strings, when the panel
  opens.
- Each base place says where it is, `where` ("at home", "on the go"), for the time machine's "In 1995 you'd have
  done this at home." Validation fails on a base place without it.
- On the places: `era: '<id>'` in `place.ts`. Validation fails on an unknown era (with "did you mean"), on a family
  where only some members have an era, and on a family whose members all share one era (a time machine needs two).
  Two members of one era are fine (`home`, `desk` and `home-fttb` are all `today`): the time machine goes to the
  place you are at if it's of that era, else to the one of that era that starts the same way (the same signal on the
  first link: `desk`'s gigabit cable goes to `desk-2010`'s 100 Mbit/s one, both `copper-pulses`), else to the first
  by `order`.
- The internet inside is an era's own where a segment variant draws it (`isp-to-cdn-1995`: a small ISP, leased lines,
  CANTAT-3 and an American ATM backbone; `datacentre-1995`: a server room with a router, a hub and one web server,
  drawn by the `server-room` group node; `datacentre-2010`: a rented cage in a colocation centre, drawn by the
  `colocation` group node, its `spine` hop an `aggregation` switch whose dive is `three-tier`, not `leaf-spine`); a
  dive whose drawing changes with the era takes the route's era from its subject (`fibre-light` draws 2010's
  data-centre fibre in one colour: `ONE_COLOUR_IN` in `light.ts`); where a part is still today's drawing (DIX's
  switch in `ixp-inside`), its words say so plainly ("drawn as today") rather than describe today's technology as
  the era's. A dive's words for one device are keyed by its node, not its hop (`"1995": { "at": { "web-server": … } }`,
  not `at.cdn`). A test per era walks its routes and fails on a later technology unless the line says when it came,
  and on a dive's `at.<node>` words for a node no route of that era reaches: both read every word a route of their era can
  show: captions, names, tags, dives, labels and layer fields, what the peek says each hop does, and the one rate shown (the slowest link's, so the
  core's 100G, shared with today, never shows on a 2010 or 1995 route). `era-1995.test.ts` fails on MPLS, DWDM, 100G,
  VLANs, gigabit, NVMe, leaf–spine, a CDN, DSCP, ECN, ECMP…; `era-2010.test.ts` on Wi‑Fi 5 and up, 4G/5G, 100G without "new in
  2010", 100.64/10…, and the data centre's more strictly (leaf–spine, ECMP, 25–400G, k8s, NVMe…). Both walk with
  `src/test/era-walk.ts`, which reads every key of a dive the route reaches, so a word of a mode the era never draws
  (gigabit's PAM-5 card on 1995's copper) goes on the test's `UNSHOWN` list, with why.
- **Words for an era** (#59): any content item's locale file may hold a block for an era of the past, with the
  same keys as the rest of the file, for what is different then (`"1995": { "name": "Web server", "kid": … }` in
  `nodes/cdn`, `"1995": { "sealed": { … } }` in a dive). On a route of that era every lookup tries the block first,
  key by key, then today's words, so a dive needs no code to say "your PC" or "plain HTTP". A more specific key of
  today's still wins over a general one of the era (`sealed` over the era's `kid`), so put the era's words at the
  same depth (`"1995": { "sealed": … }`). A `describe` in a block needs both `kid` and `nerd`. Blocks load lazily
  (dives' with the dive strings, the rest as the small chunk of the words of the past), so they cost the first load
  nothing; write them in English, Danish and German.
- **An item that only exists in the past** (a place of 2010, a 3G mast, the RNC) keeps only its required, eager
  keys at the top (`name`, a place's `access`, a device's `yours`) and puts everything else in its era's block
  (`"2010": { "kid": …, "nerd": …, "stop": { … } }`): it is only ever shown on that era's routes, so its words load
  with the words of the past and cost the first load nothing.
- **A dive that serves an older technology too** (`nr-radio` for 5G and 3G): pick the drawing by the technology
  (or layer) id inside the scene, as `fibre-light` and `tdm-frames` do (a `MODES` table keyed by id), and the words
  by the scene's era block; take devices and field values from the route (`subject.ctx`, `subject.route`), not from
  ids. Keep links that name one technology on that technology or layer, not on the shared scene.
- **An activity or a segment of an era** (#59): `variantOf: '<base>'` and `era: '<id>'` in its definition make it
  stand in for the base on that era's routes (`watch-video-1995`: a web page over plain HTTP, no TLS). It has the
  same place slots as its base and names base segments (the era picks their variants too). It has no locale files:
  its words are the base's block for its era (`"1995": { "title": "Opening a web page with a picture", … }` in
  `activities/watch-video/locales/`), and what it doesn't say comes from the base. URLs name the base. Validation
  fails on a variant of a variant, a missing or unknown era, two variants for one era, other slots, a named variant
  segment, an era on a base, and locale files of its own.
- **When a hop's device changes between eras** (today's router, 2010's DSL router at the same stop), the morph
  cross-fades the two as they glide. Keep the stop's id the same in both places so it does.
- **Era flavour** (optional): a few small, cute details that make a trip feel like its time, on top of the theme (not
  a restyle). `art/Props.svelte` gets `EraPropsProps` and is drawn twice on the overview of each place of that era:
  `layer: 'back'` over the place's backdrop and under the links and devices, `'front'` over the devices. It draws
  into the place's **prop spots**, `props: { wall: [x, y, w, h], … }` in the overview layout of `place.ts` per
  orientation (a box it keeps in; skip the spots a place lacks), and on its devices (`devices`, by stop id: draw
  inside the device's box, clear of its face, like the buffering wheel on the laptop's screen). `traffic` says which
  ways packets are going on the first link (the modem's lights), `age` how long the place has been shown (the
  loaders), and `time`/`still` animate (still with reduced motion: lit, shown). `art/Packet.svelte`, if any, gets
  `{ dir, size }` and draws a small mark that the theme puts on the parcel and the reel (1995's stamp, 2010's shine).
  Both load as small chunks the first time that era is shown, so they cost the first load nothing. Rules: tokens
  only, no SVG filters, no brands; text (the calendar's year) through `Text`; the engine keeps props out of the
  accessibility tree, so mention the ones a reader would notice in the place's `describe`; and the overlap test
  checks the spots against every name, tag and door, in every language and level, so pick them where it's clear.

## Add an activity

`content/activities/<id>/activity.ts`:

```ts
defineActivity({
  route: [{ place: 'me', default: 'home' }, { segment: 'isp-to-cdn' }],
  groups: ['internet'], // or nested: ['internet', { id: 'datacentre', in: 'internet' }]
  // a group may be drawn by another network node (an era's server room): { id: 'datacentre', in: 'internet', node: 'server-room' }
  flows: [{ id: 'video', stack: ['ip', 'tcp', 'tls', 'http'],
            packets: [{ kind: 'request', dir: 'up', pace: 1.2, colour: '#ffcf5d' }, { kind: 'video', dir: 'down', pace: 1.3, every: 1.3, colour: '#bf6f8f' }] }],
  layout: { overview: { landscape: { nodes: { internet: [1380, 360, 250] } } } },
})
```

- **How long it takes (#59).** Give the one kind going down that the reader waits for a `size` in bytes (the whole
  page, clip or video), and `plays` in seconds if it's watched as it comes (`{ kind: 'video', …, size: 100_000_000,
  plays: 180 }`). Then a `takes` string (kid and nerd) is required, and the overview's caption shows it under the
  text, filled in: `{time}` (how long at the route's slowest link), `{size}`, `{rate}`, `{link}` (that link's name),
  `{plays}` and `{faster}` (how many times faster than it plays), and `{now}`/`{nowSize}` (today's thing, the base
  activity's, at this route's rate). An era variant's own words go in the base's era block
  (`"1995": { "takes": { … } }`); it's the bits alone, so say in the nerd text what adds to it.

Strings:
- `title` and `kid`/`nerd`: keep them device-neutral ("You ask for a video"), since any place can start it
- `peek.<kind>` ("Caught: a piece of video")
- `stop.*`

## Make art mode-aware (day and night, issue #43)

Storybook has a day and a night mode. The reader's OS setting picks the default; the ☀️/🌙 button and `?mode=day|night`
switch it. Night repaints everything through tokens, so art that follows these rules works at night without
extra effort:
- **Colours come from the theme's palette:** `fill="var(--peach)"`, `stroke="var(--line)"`,
  `style="color: var(--teal)"`. Never write a literal (`#ffcf5d`, `rgb(…)`, `white`). The palette is at the top of
  `content/themes/storybook/tokens.css`, and night overrides it in the `[data-mode='night']` block. If no
  colour fits, add a token to the day block and give it a night value.
- **Some tokens are lights,** plain by day and lit at night. Use them where something glows after dark:
  - `--window`: a window pane, framed in `--window-frame` (the outline by day, dark at night)
  - `--room`: a lit room seen from outside
  - `--lamp`: a lamp head or headlights
  - `--shade`: a drop shadow. At night it is near black, not brown.
- **For elements that only exist at night** (stars, a lamp's pool of light, a halo around a wave), wrap them in
  `{#if view.mode === 'night'}`. Draw halos as a wider, translucent copy of the stroke. Don't use SVG filters: they
  cost too much at 6× throttle and don't fit the paper look. A device's `accent` part (an LED) glows at night by
  itself.
- **Some colours really are fixed,** such as a fibre wavelength's colour or the T568 insulation colours of copper
  pairs. Mark them with a comment that starts with `fixed-colour:` and gives the reason:
  - on its own line, it covers the lines after it, up to the next blank line
  - at the end of a line, it covers that line only

  Data colours (a technology's or a packet's `colour`) are identity, not paint, and stay literal in the definition files.
- **Ink that stays readable** (#45):
  - Marks and text on a bright body (`--sun`, `--mustard`, `--lamp`, a lit sticker or row) are `--face`, not
    `--line`: `--line` turns pale at night. For a `Text` there, pass the body too (`colour="var(--face)"
    on="var(--sun)"`), so its halo doesn't smudge the dark ink.
  - Text on a mid-tone body (a teal door, a berry sticker) keeps `--line` with a `--paper` halo
    (`stroke="var(--paper)" paint-order="stroke"`).
  - A label in a palette colour uses its ink tone (`--leaf-ink`, `--teal-ink`, `--berry-ink`), not `--leaf-dark`. A
    `Text` in a data colour (`#…`) is mixed into the ink for you; for raw `<text>` use `labelInk(colour)`.
  - Don't let colour alone carry meaning: give it a number, a name, a shape or a pattern as well.
- **Tests check the rules:**
  - `art-colours.test.ts` flags literals in `content/**` art. It also checks that every `var(--x)` exists in the
    theme's day tokens, and that night only overrides tokens the day defines.
  - `contrast.test.ts` checks the chrome's text pairs (caption, chips, peek, tags, buttons, links, labels) for WCAG AA
    in both modes, its edges and rings at 3:1, and every technology's colour as a label.
  - `npm run evaluate -- --only=a11y` checks every scene's labels where they are drawn (see
    [accessibility](accessibility.md)).
- Look at it at night: `npm run dev`, then add `?mode=night` to the URL. `npm run evaluate -- --mode=night` takes the
  night screenshots and perf.

## Add a language

1. `content/locales/<lang>/meta.json`: `{ "name": "Dansk", "dir": "ltr" }` (`rtl` for Arabic, Hebrew…). `name` is
   written in the language itself; it also tells the theme which script's fonts to load.
2. `content/locales/<lang>/ui.json`: the chrome strings (copy `en/ui.json`).
3. Add `locales/<lang>.json` to any content folder you translate. Anything missing falls back to English. A string
   copied over still in English fails `src/translations.test.ts`: translate it, or, for a term your language keeps
   English on purpose (a header field name, router output), add it under your language in `KEEP_ENGLISH` there.
4. A new script (Arabic, Greek…) needs its font faces in the theme's `tokens.css`.

We ship only languages someone has reviewed (English, Danish and German for now, issue #11).

The language appears in the switcher at once and loads as its own small chunk. `npm run check:content` shows the coverage.

## Add a learn-more link (issue #4)

Add it to the `learnMore` list of the definition it explains (node, technology, layer, scene, place or activity):

```ts
{ url: 'https://da.wikipedia.org/wiki/5G', title: '5G', level: 'kid' | 'nerd' | 'both', lang: 'da' }
```

`title` is in the language of the page. The caption shows up to three links for the reader's level:
- in their own language first
- English nerd links always stay (marked "(en)")
- other English links only when there's nothing in their language

A link that is true of some eras only lists them: `eras: ['today']` for RFC 9293's TCP, `eras: ['1995', '2010']` for
RFC 793 (#180). Without `eras` it shows in every era; the era tests read every link a past trip shows.

## Checklist

- [ ] The folder name is the id; every hop, link and layer name exists (the dev overlay says what doesn't).
- [ ] `locales/en.json` has the required strings; `da.json` and `de.json` if you can. A new scene (or a new variant of one), and a
  new era, has a `describe` in English, Danish and German.
- [ ] Layout for both `landscape` and `portrait` on every path scene the item appears in (and in dive scenes), with
  nothing overlapping at the size things grow to on a small phone, in any language (`model/overlap.test.ts` and
  `model/doors.test.ts` check).
- [ ] A new technology has a `dive`, and each layer in its `stack` a layer dive (all the way down), and a `rate`
  true to its era.
- [ ] A dive's labels near its panel's edge (the device names at either end, its nerd tag) have `fit`, so they slide
  inside the frame at a phone's sizes and in longer languages; `npm run evaluate -- --only=fit` walks every dive on a
  phone, upright and on its side, and fails on anything cut (#136).
- [ ] Art uses palette tokens, not colour literals, and looks right at night (`?mode=night`).
- [ ] `npm test` and `npm run build` pass; have a look in `npm run dev` in both orientations.
- [ ] `npm run evaluate` if it adds animation (budget: p95 within one frame at 6× CPU throttle).
- [ ] `npm run evaluate -- --only=a11y` if it adds UI (zero axe violations, focus never lost; [accessibility](accessibility.md)).
