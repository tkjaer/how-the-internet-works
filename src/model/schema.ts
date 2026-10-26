// Zod schemas for every kind of content definition. They are the single source of truth for the content types
// (see define.ts, which only imports their types), and they run in dev and in tests only: the production bundle never
// includes zod. Cross-references between items (a segment naming a technology, …) are checked in validate.ts.
import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use a lower-case kebab-case id, e.g. "cell-tower"');
const colour = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'use a #rrggbb colour');
const level = z.enum(['kid', 'nerd', 'both']);

/** A learn-more link (issue #4), in a content folder's `locales/<lang>.json` under `"learnMore"`: a page in that
 *  language (English links are every language's fallback). */
export const learnMore = z.strictObject({
  url: z.url({ protocol: /^https$/, error: 'use a full https:// URL' }),
  /** Link text, in the page's language. */
  title: z.string().min(1),
  level,
  /** The eras it is for (#180: RFC 793 in 1995 and 2010, RFC 9293 today). Default: every era. */
  eras: z.array(id).min(1).optional(),
});
export const learnMoreList = z.array(learnMore);

/** passive: passes the signal on without reading any of it (a splitter): it opens no layer and ends no link frame. */
export const role = z.enum(['endpoint', 'bridge', 'router', 'nat', 'passive']);

export const node = z.strictObject({
  /** device = a thing you can hold or point at; network = a group that expands into a sub-path; place = a building/area. */
  kind: z.enum(['device', 'network', 'place']),
  /** What it does to passing packets (a hop can override it). Default: router. */
  role: role.optional(),
  /** The "look inside" scene for this device, at every hop on a route (a scene with `explains: 'node'`). */
  dive: id.optional(),
});

/** Who runs a stretch of the route (your internet company, an exchange, a video company…): a network of its own. Path
 *  scenes draw the hops it runs as one region, so the reader sees where one network hands over to the next. */
export const owner = z.strictObject({});

/** How fast a link carries bits, each way, in bit/s (#59, how long it takes): for an access link what one home or
 *  phone gets (its line or plan), for a trunk the whole link. The slowest link on a route is its bottleneck. */
const rate = z.strictObject({ down: z.number().positive(), up: z.number().positive() });
export const technology = z.strictObject({
  /** How the theme draws the link. */
  look: z.enum(['radio', 'cable', 'fibre', 'trunk']),
  colour,
  /** The lower layers this technology adds, outermost first (the activity's flow adds the upper ones). */
  stack: z.array(id).min(1),
  /** The "look inside" scene for links of this technology. */
  dive: id.optional(),
  /** How fast it carries bits, in its era (a link may say otherwise). */
  rate,
});

/** A field value: a template with {facts} (see FACTS in packet.ts), the same both ways or one per direction. An empty
 *  value leaves the field out in that direction. */
const fieldValue = z.union([z.string(), z.strictObject({ up: z.string(), down: z.string() })]);
export const field = z.strictObject({
  /** Its string key: layer.<layer>.field.<id>.name / .about. */
  id,
  /** Size on the wire (for the header diagram and lengths). Omit for text or variable-size fields. */
  bits: z.number().int().positive().optional(),
  /** Its size in an era when it differed, by era (#180: RFC 793's 6 reserved bits and 6 flags in 1995). */
  bitsIn: z.record(id, z.number().int().positive()).optional(),
  value: fieldValue,
  /** Roles that act on it when the packet reaches them (true: every hop that receives this layer). */
  use: z.union([z.literal(true), z.array(role)]).optional(),
  /** Shown to kids (when it matters at the hop): true, or a kid-friendly value. Addresses show as names for kids. */
  kid: z.union([z.literal(true), fieldValue]).optional(),
});

export const layer = z.strictObject({
  /** Roles that open (read) this layer; everyone else leaves it closed. Default: everyone. */
  openAt: z.array(role).optional(),
  /** Its payload (the layers inside) is encrypted for anyone who doesn't open this layer. */
  seals: z.literal(true).optional(),
  /** A tunnel: its own addresses are the hops where it starts and ends, and the link frames around it end there. */
  tunnel: z.literal(true).optional(),
  /** Label-switched (MPLS): a router that gets it and sends it on forwards on this layer alone. It doesn't read the
   *  layers inside, and their TTL isn't counted down there: this layer's own {ttl} is, and is copied back when it
   *  comes off (RFC 3443's uniform model). */
  switched: z.literal(true).optional(),
  /** How outer layers name this one ({inner.<code>}), e.g. { ethertype: '0x0800 (IPv4)', ipproto: '6 (TCP)' }. */
  code: z.record(id, z.string()).optional(),
  /** Header fields, in wire order. */
  fields: z.array(field).min(1),
  /** Bytes of anything not described by bits (a text header, a body), per direction. */
  bytes: z.strictObject({ up: z.number().int().min(0), down: z.number().int().min(0) }).optional(),
  /** The "look inside" scene for this layer, at any hop that reads it (a scene with `explains: 'layer'`). */
  dive: id.optional(),
});

export const scene = z.strictObject({
  /** What the scene is a dive into: a link (its technology), a device (a node) or a layer (at one hop). Default: link. */
  explains: z.enum(['link', 'node', 'layer']).optional(),
});

const pt = z.tuple([z.number(), z.number()]);
const labelSide = z.enum(['above', 'below']);
/** [x, y, size, label side] in the scene's world (landscape 1600×900, portrait 900×1600). */
export const placement = z.tuple([z.number(), z.number(), z.number().positive(), labelSide.optional()]);
const linkLayout = z.strictObject({
  /** Curvature, as a fraction of the link length (+ bends to the left of travel). */
  bend: z.number().optional(),
  /** Label offset from the link's midpoint, and which end of the name sits there (default its middle): with `end` or
   *  `start` a name keeps beside the link however long it gets in another language. */
  label: z.tuple([z.number(), z.number(), z.enum(['start', 'middle', 'end']).optional()]).optional(),
  /** A hand-drawn curve instead (start, control, end points); it still follows its nodes when they move. */
  curve: z.tuple([pt, pt, pt]).optional(),
});
export const sceneLayout = z.strictObject({
  nodes: z.record(id, placement).optional(),
  /** Where an owner region's sign goes (default: centred above its region), keyed by owner id. */
  owners: z.record(id, pt).optional(),
  /** Keyed by "<from>-<to>" instance ids as seen in that scene. */
  links: z.record(z.string(), linkLayout).optional(),
  /** A place's overview only: where its era's props may go (#59, the era flavour), [x, y, w, h] (the centre and size
   *  of the box a prop keeps in), by spot name (`wall`, `desk`, `shelf`…); the era's art knows its spots. */
  props: z.record(id, z.tuple([z.number(), z.number(), z.number().positive(), z.number().positive()])).optional(),
});
/** Keyed by path scene: "overview" or a group node instance (e.g. "internet"). */
export const layout = z.record(id, z.strictObject({ landscape: sceneLayout.optional(), portrait: sceneLayout.optional() }));

export const hop = z.strictObject({
  /** Instance id (unique within a route). */
  at: id,
  /** The node definition; defaults to `at`. */
  node: id.optional(),
  /** The group node this hop lives inside (shown when that group is expanded). */
  in: id.optional(),
  role: role.optional(),
  /** Its address as seen by the next hop (IPv4 documentation ranges, please). */
  addr: z.string().optional(),
  /** NAT: the address it rewrites the client's source address to, with ":port" when it also rewrites the port. */
  natTo: z.string().regex(/^[^:]+(:\d{1,5})?$/, 'use "address" or "address:port"').optional(),
  /** Who runs it (content/owners/<id>). */
  owner: id.optional(),
});
export const link = z.strictObject({
  /** Technology id. */
  link: id,
  /** Override the technology's lower stack for this link (e.g. add a tunnel layer). */
  stack: z.array(id).min(1).optional(),
  /** Override the technology's dive scene (false = no dive here). */
  dive: z.union([id, z.literal(false)]).optional(),
  /** Roughly how long it is, in km (the trip's scale in the captions). */
  km: z.number().positive().optional(),
  /** Override the technology's rate here (2010's Wi‑Fi on a link of today's Wi‑Fi). */
  rate: rate.optional(),
});
export const aside = hop.extend({
  /** The hop it branches off from (an alternative path, drawn dashed; packets don't take it). */
  from: id,
  link: id,
});
/** A segment or an activity of another era (#59): the base it stands in for when the route is in that era (the
 *  route's era is its first place's). The base has no era: it serves every era without a variant of its own. */
const eraVariant = {
  /** The segment or activity this one is a version of; routes and URLs name the base. */
  variantOf: id.optional(),
  /** The era it is for (a variant's; a base has none). */
  era: id.optional(),
};
export const segment = z.strictObject({
  /** Hops and links, alternating, starting with a hop. A segment that isn't last in a route ends with a link. */
  hops: z.array(z.union([hop, link])).min(1),
  aside: z.array(aside).optional(),
  /** When a group is expanded, the hop that stands for "where you came from" (e.g. { internet: "home" }). */
  entry: z.record(id, id).optional(),
  layout: layout.optional(),
  ...eraVariant,
});

export const packet = z.strictObject({
  kind: id,
  /** up = client → server, down = server → client. */
  dir: z.enum(['up', 'down']),
  /** Seconds per link. */
  pace: z.number().positive(),
  /** Seconds between two packets (default: one at a time). */
  every: z.number().positive().optional(),
  offset: z.number().min(0).optional(),
  colour,
  /** Bytes of the whole thing the reader waits for, carried by this kind (the page, the video): the caption's "how
   *  long it takes" line (#59). On one kind going down, at most. */
  size: z.number().int().positive().optional(),
  /** Seconds it plays for, if it is watched as it arrives (a video): the line says how much faster it comes. */
  plays: z.number().positive().optional(),
});
export const flow = z.strictObject({
  id,
  /** Upper layers, outermost first (the technology of each link adds the lower ones). */
  stack: z.array(id).min(1),
  /** Transport ports ({sport}/{dport} in header fields): the client's (NATs may rewrite it) and the server's. */
  ports: z.strictObject({ client: z.number().int().min(1).max(65535), server: z.number().int().min(1).max(65535) }).optional(),
  packets: z.array(packet).min(1),
});
/** A place is where the device is (home, street, airplane…): the access segment from the device to where it joins the
 *  shared network, plus its backdrop. Every place can be combined with every activity. */
export const place = segment.extend({
  /** Sort order in the "Where are you?" picker (a variant's: among its place's ways of getting online). */
  order: z.number().optional(),
  /** Another way of getting online from the same place (`home` on the phone line): not a place of its own in the
   *  picker but one of its place's connections, named by its `access` string. */
  variantOf: id.optional(),
  /** When this way of getting online belongs (issue #59): the time machine switches among a place and its variants
   *  by era. Either every member of a family has one or none does. */
  era: id.optional(),
  /** A base place's picture in "Where are you?": a node of kind `place` whose art stands for it (the house). Its
   *  variants show it too. */
  picture: id.optional(),
});
/** An era (1995, 2010, today): a time the time machine can visit. Its strings are its name, kid and nerd (what
 *  getting online was like then) and a describe (what the time machine's picture of it shows). */
export const era = z.strictObject({
  /** For sorting, oldest first, and for the caption's chip ("🕰️ 1995"). */
  year: z.number().int(),
});
/** A route step: a place slot (filled with the chosen place) or a fixed segment. */
export const placeSlot = z.strictObject({
  place: id,
  /** Restrict this slot to some places (default: all). */
  only: z.array(id).min(1).optional(),
  default: id.optional(),
});
/** An activity is what you do on the device (watch a video, send a message…): the flows and the rest of the route. */
export const activity = z.strictObject({
  route: z.array(z.union([placeSlot, z.strictObject({ segment: id })])).min(1),
  /** Network nodes that expand into their own path scene; `{ id, in }` for one that lives inside another (a data
   *  centre inside the internet): its hops say `in: <id>`, and it is drawn as one node in the outer group's scene.
   *  `node` draws the group as another network node than its id (a server room where today has a data centre, #59):
   *  the hops and the path still say the id, so the morph between eras cross-fades the one into the other. */
  groups: z.array(z.union([id, z.strictObject({ id, in: id.optional(), node: id.optional() })])).optional(),
  flows: z.array(flow).min(1),
  layout: layout.optional(),
  order: z.number().optional(),
  ...eraVariant,
});

export const localeMeta = z.strictObject({ name: z.string().min(1), dir: z.enum(['ltr', 'rtl']), note: z.string().optional() });

/** A scene's spoken description (#53, a `describe` in any locale file): what the picture shows and what moves, for
 *  each level. Read on arrival by the announcer and by read aloud, so it is short. */
export const describeText = z.strictObject({ kid: z.string().min(1).max(400), nerd: z.string().min(1).max(400) });
