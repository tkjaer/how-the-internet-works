<svelte:options namespace="svg" />
<script lang="ts">
  // A path scene: backdrop, owner regions, links, nodes, labels, technical tags, doors and packets. The root scene also draws the chosen places' backdrops (the house, the street), their era's props (#59) and the swap door on the
  // start device; a group's scene draws the road the packets take through it. Doors (model/doors.ts) are drawn in two
  // parts: a glow around what they open, under the nodes, and a badge over them. Owner regions (model/regions.ts) too:
  // their areas under the road, their signs over the devices.
  import { curvePath, WORLD_SIZE } from '../engine/geometry';
  import { perPx, pts } from '../engine/svg';
  import { trafficOn, type LivePacket } from '../engine/packets';
  import { badgeBox, badgeSize, doorsOf, layoutDoors, type Door } from '../model/doors';
  import { placeTexts, type Per } from '../model/labels';
  import { propSpots, type PathScene, type SNode } from '../model/layout';
  import { regionsOf } from '../model/regions';
  import { chainOf, diveRuns } from '../model/tree';
  import { eraOf } from '../model/registry';
  import type { Route } from '../model/resolve';
  import { loc, nameOf, nameW, routeKeys, themeState, tr, trFirst, trl, view } from '../state.svelte';
  import { untrack } from 'svelte';
  import { getScene, getWorld, legibleSize, tagSize } from './ctx';
  import { publishDoors } from './drawn.svelte';
  import { deviceArt, eraArt, groupBackdrop, placeBackdrop } from './lazy.svelte';
  import Arrive from './Arrive.svelte';
  import TagAt from './TagAt.svelte';
  import Text from './Text.svelte';

  let { route, ps, packets, focus, root, places, hot = null, lit = false, kbd = false }: {
    route: Route; ps: PathScene; packets: LivePacket[]; focus: string | null; root: boolean;
    /** Place backdrops to draw (root only); defaults to the route's places. */
    places?: { id: string; alpha: number; dx: number }[];
    /** The door pointed at (its item id), and whether "What can I explore?" lights every door up. */
    hot?: string | null; lit?: boolean;
    /** The focused stop has keyboard focus: ring it. */
    kbd?: boolean;
  } = $props();
  const world = getWorld(), scene = getScene();
  const W = $derived(WORLD_SIZE[view.orient]);
  const portrait = $derived(view.orient === 'portrait');
  const A = $derived(themeState.current.art);
  const technical = $derived(loc.level === 'technical');
  const backdrops = $derived(places ?? route.slots.map((s) => ({ id: s.place, alpha: 1, dx: 0 })));
  const mark = $derived(eraArt(route.era)?.Packet ?? null);
  // the era's props (root only): the devices to draw on, the traffic on the first link for the modem's lights, and the
  // time since each place appeared, for the loaders shown while its video starts
  const shown = new Map<string, number>();
  const appeared = (place: string) => shown.get(place) ?? shown.set(place, untrack(() => scene.time)).get(place)!;
  $effect(() => {
    const ids = new Set(backdrops.map((b) => b.id));
    for (const id of shown.keys()) if (!ids.has(id)) shown.delete(id);
  });
  const devices = $derived(root ? Object.fromEntries(ps.nodes.map((n) => [n.id, n])) : {});
  const nodeTag = (n: SNode) => (technical ? trFirst([...routeKeys(`tag.${n.id}`), `node.${n.node.id}.tag`]) : '');
  const flowColour = (flow: string, kind: string) =>
    route.activity.flows.find((f) => f.id === flow)?.packets.find((p) => p.kind === kind)?.colour ?? '#fff';
  const GroupBackdrop = $derived(ps.group ? groupBackdrop(route.hops[ps.group].node.id) : null);
  const regions = $derived(regionsOf(route, ps));
  // only the networks on the packets' way are named: a side branch is just faintly there
  const named = $derived(regions.filter((g) => !g.aside));
  const road = $derived(root ? '' : `M${pts(chainOf(route, ps.group, view.orient).pts)}`);
  // the road is the route's final shape: during a place morph it fades in with the route's newcomers
  const roadAlpha = $derived(Math.min(1, ...ps.links.filter((l) => ps.route.includes(l.id)).map((l) => l.alpha)));
  const signPx = $derived(Math.max(24, themeState.current.labelMinPx / (world.cam.k * scene.frame.s)));
  // text keeps inside the world at the size it is drawn (model/labels.ts)
  const legible = legibleSize(), tagPx = tagSize();
  const sizes = $derived({ name: legible(28), link: legible(24), tag: tagPx(20), sign: signPx });
  const per: Per = (text, font) => {
    void themeState.current.id;
    return perPx(text, font === 'tag' ? '--tag-font' : '--label-font');
  };
  const doors = $derived(doorsOf(ps, root, diveRuns(route, ps.group, view.orient).byLink, view.orient, nameW));
  const doorPx = $derived(badgeSize(themeState.current.labelMinPx, world.cam.k * scene.frame.s));
  const doorTime = $derived(view.still ? 0 : scene.time);
  const doorLabel = (d: Door) => tr(`door.${d.kind}`);
  const labelW = (d: Door) => per(doorLabel(d), 'label') * doorPx;
  const linkTag = (l: PathScene['links'][number]) => (technical ? trFirst([...routeKeys(`tag.${l.id}`), `tech.${l.link.tech.id}.tag`]) : '');
  const texts = $derived.by(() => {
    const badges = doors.map((d) => badgeBox(d.at, doorPx));
    return placeTexts({
      nodes: ps.nodes.map((n) => ({ n, name: nameOf(n.node.id), tag: nodeTag(n) })),
      links: root ? ps.links.map((l) => ({ l, name: tr(`tech.${l.link.tech.id}.name`), tag: linkTag(l), badge: badges[doors.findIndex((d) => d.links.includes(l.id))] })) : [],
      signs: named.map((g) => ({ at: g.sign, name: trl(`owner.${g.owner}.name`) })),
      badges,
    }, sizes, per, W, portrait);
  });
  // lit labels keep off the scene's text (#137); the hit test and the coach cards read the badges as drawn
  const boxes = $derived(layoutDoors(doors, doorPx, lit, hot, labelW, { texts: texts.texts, arts: texts.arts, W }));
  publishDoors(() => ps.key, () => ({ doors, badges: boxes, size: doorPx }));
  const doorTarget = (d: Door) => {
    if (d.links.length) return { d: d.links.map((id) => curvePath(ps.links.find((k) => k.id === id)!)).join(' ') };
    const n = ps.nodes.find((k) => k.id === d.id)!;
    return { x: n.x, y: n.y, size: n.size };
  };
</script>

{#snippet flavour(layer: 'back' | 'front')}
  {#each backdrops as b (b.id)}
    {@const Props = eraArt(eraOf(b.id, route.content))?.Props}
    {#if Props}
      <g aria-hidden="true" opacity={b.alpha < 1 ? b.alpha : undefined} transform={b.dx ? `translate(${b.dx} 0)` : undefined}>
        <Props {layer} spots={propSpots(route.content.places[b.id], view.orient)} {devices} traffic={trafficOn(packets, ps.route[0])}
          age={scene.time - appeared(b.id)} time={view.still ? 0 : scene.time} still={view.still} />
      </g>
    {/if}
  {/each}
{/snippet}

{#snippet packet(p: LivePacket)}
  <A.Packet kind={p.kind} dir={p.dir} pose={p.pose} colour={p.colour ?? flowColour(p.flow, p.kind)} time={scene.time} followed={view.followId === p.id} {mark} />
{/snippet}

{#snippet door(d: Door, i: number, part: 'glow' | 'badge')}
  <A.Hint kind={d.kind} {part} x={d.at.x} y={boxes[i].y} flip={boxes[i].flip} label={doorLabel(d)} labelW={labelW(d)} labelled={boxes[i].labelled}
    size={doorPx} hot={hot === d.id || (lit && part === 'glow')} target={doorTarget(d)} time={doorTime} />
{/snippet}

<g class="scene scene-{ps.key}">
  <A.Backdrop kind={root ? 'root' : 'group'} orient={view.orient} w={W.w} h={W.h} time={scene.time} />
  {#if ps.group}
    <Arrive of={GroupBackdrop}>{#snippet children(G)}<G orient={view.orient} w={W.w} h={W.h} time={scene.time} />{/snippet}</Arrive>
  {/if}
  {#if root}
    {#each backdrops as b (b.id)}
      <Arrive of={placeBackdrop(b.id)}>
        {#snippet children(B)}<g opacity={b.alpha} transform={b.dx ? `translate(${b.dx} 0)` : undefined}><B orient={view.orient} w={W.w} h={W.h} time={scene.time} /></g>{/snippet}
      </Arrive>
    {/each}
    {@render flavour('back')}
  {/if}
  {#each regions as g (g.owner)}
    <A.Region part="area" d={g.d} tone={g.tone} aside={g.aside} x={g.sign.x} y={g.sign.y} label="" size={signPx} />
  {/each}
  {#if road && roadAlpha > 0}
    <g opacity={roadAlpha < 1 ? roadAlpha : undefined}><A.Road d={road} orient={view.orient} time={scene.time} /></g>
  {/if}
  {#each ps.links as l (l.id)}
    <g opacity={l.alpha < 1 ? l.alpha : undefined}>
      <A.Link look={l.link.tech.look} d={curvePath(l)} curve={l} colour={l.link.tech.colour} dashed={l.dashed} time={scene.time} focused={focus === l.id} kbd={kbd && focus === l.id} />
    </g>
  {/each}
  {#each doors as d, i (d.id)}{@render door(d, i, 'glow')}{/each}
  {#each ps.nodes as n (n.id)}
    {@const art = deviceArt(n.node.id)}
    {#if n.was}
      {@const was = deviceArt(n.was.node.id)}
      <g opacity={n.was.alpha}>
        <A.Device id={n.was.node.id} Art={was.Art} face={was.face} pending={was.pending} x={n.x} y={n.y} size={n.size} time={scene.time} context="path" focused={false} kbd={false} />
      </g>
    {/if}
    <g opacity={n.alpha < 1 ? n.alpha : undefined}>
      <A.Device id={n.node.id} Art={art.Art} face={art.face} pending={art.pending} x={n.x} y={n.y} size={n.size} time={scene.time} context="path" focused={focus === n.id} kbd={kbd && focus === n.id} />
    </g>
  {/each}
  {#if root}{@render flavour('front')}{/if}
  <!-- the packets go beneath the text (#137, labels win: a parcel at rest on a link doesn't hide its name) -->
  {#each packets as p (p.id)}{#if view.followId !== p.id}{@render packet(p)}{/if}{/each}
  <!-- beneath the node names and tags: when it gets crowded (technical tags), the boxes stay readable -->
  {#each named as g, i (g.owner)}
    <A.Region part="sign" d={g.d} tone={g.tone} aside={g.aside} x={texts.signs[i].x} y={texts.signs[i].y} label={trl(`owner.${g.owner}.name`)} size={signPx} />
  {/each}
  {#each ps.nodes as n, i (n.id)}
    {@const at = texts.nodes[i]}
    {#if n.was}<g opacity={n.was.alpha}><Text x={at.name.x} y={at.name.y} text={tr(`node.${n.was.node.id}.name`)} size={28} kind="node" /></g>{/if}
    <g opacity={n.alpha < 1 ? n.alpha : undefined}>
      <Text x={at.name.x} y={at.name.y} text={nameOf(n.node.id)} size={28} kind="node" />
      {#if at.tag}<TagAt x={at.tag.x} y={at.tag.y} text={at.tag.text} anchor={at.tag.anchor} />{/if}
    </g>
  {/each}
  {#if root}
    {#each ps.links as l, i (l.id)}
      {@const at = texts.links[i]}
      <g opacity={l.alpha < 1 ? l.alpha : undefined}>
        <Text x={at.name.x} y={at.name.y} text={tr(`tech.${l.link.tech.id}.name`)} size={24} kind="link" colour={l.link.tech.colour} anchor={at.name.anchor} />
        {#if at.tag}<TagAt x={at.tag.x} y={at.tag.y} text={at.tag.text} anchor={at.tag.anchor} />{/if}
      </g>
    {/each}
  {/if}
  <!-- the packet a reader follows (or caught) is on top of everything but the doors -->
  {#each packets as p (p.id)}{#if view.followId === p.id}{@render packet(p)}{/if}{/each}
  {#each doors as d, i (d.id)}{@render door(d, i, 'badge')}{/each}
</g>
