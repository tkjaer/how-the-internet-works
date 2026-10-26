<svelte:options namespace="svg" />
<script lang="ts">
  // The 2010 data centre's tree of switches (three-tier): a core pair, the aggregation pair (this switch and its standby
  // twin) and the racks' access switches, each with an uplink to both of the pair. Spanning tree blocks the uplinks to
  // the standby switch (dashed, with a no-entry sign), so your parcel and every other rack's traffic go through this one.
  import { Node, Text, fill, legibleSize, nameOf, strings, view, type NodeSubject } from '$core/api';
  import { ACTIVE, AGGS, CORES, OTHER_FLOWS, RACKS, aggBox, blockAt, coreBox, coreLinks, otherFlowAt, parcelAt, peerLink, tierLayout, uplinks, wire } from './tier';
  import Spine from '../leaf-spine/art/Spine.svelte';
  import Leaf from '../leaf-spine/art/Leaf.svelte';
  import Carrier from '../leaf-spine/art/Carrier.svelte';

  let { subject, time }: { subject: NodeSubject; time: number } = $props();
  const S = strings('scene.three-tier');
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(!portrait && view.vp.h < 470);
  const night = $derived(view.mode === 'night');
  const technical = $derived(S('mode') === 'technical');
  const L = $derived(tierLayout(view.orient, compact));
  const legible = legibleSize();
  const T = $derived(portrait
    ? { label: 30, box: 28, tag: 30, sticker: 29, sign: 18 }
    : compact ? { label: 0, box: legible(40), tag: 0, sticker: legible(40), sign: 20 }
    : { label: 25, box: 24, tag: 24, sticker: 22, sign: 16 });

  const before = $derived(subject.in ? subject.route.hops[subject.in.from] : null);
  const after = $derived(subject.out ? subject.route.hops[subject.out.to] : null);
  // the links either side of the picture: into the load balancer, and from the rack's switch on to the server
  const behind = $derived(subject.in ? subject.route.links.find((l) => l.to === subject.in!.from) : undefined);
  const beyond = $derived(subject.out ? subject.route.links.find((l) => l.from === subject.out!.to) : undefined);
  const treeTech = $derived(subject.out?.tech ?? subject.in?.tech);
  const treeColour = $derived(treeTech?.colour ?? 'var(--blue)');
  const ups = $derived(uplinks(L));
  const peer = $derived(peerLink(L));
  const parcel = $derived(parcelAt(time, view.still, L));
  const others = $derived(OTHER_FLOWS.map((f) => otherFlowAt(time, view.still, L, f)));
  const otherColours = ['var(--teal)', 'var(--orange)', 'var(--berry)', 'var(--blue)', 'var(--leaf)', 'var(--mustard)'];
  // your way through: in to the load balancer, on to this switch, down to the rack (drawn with the uplinks), out to the server
  const ends = $derived([
    { tech: behind?.tech ?? subject.in?.tech, d: wire(L.inPort, L.before) },
    { tech: subject.in?.tech, d: wire(L.before, L.aggs[ACTIVE]) },
    { tech: beyond?.tech ?? subject.out?.tech, d: wire(L.racks.after, L.outPort) },
  ].flatMap((e) => (e.tech ? [{ tech: e.tech, d: e.d }] : [])));
  const stickerLines = $derived(technical ? [S('sticker'), S('sticker.rate')] : [S('sticker')]);
</script>

<g text-rendering="geometricPrecision">
  {#if !portrait}<text x="800" y={compact ? 110 : 95} text-anchor="middle" font-family="var(--label-font)" font-size={compact ? legible(44) : 42} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="7" paint-order="stroke">{S('heading')}</text>{/if}

  <rect x={portrait ? 45 : compact ? 80 : 120} y={portrait ? 250 : 145} width={portrait ? 810 : compact ? 1440 : 1360} height={portrait ? 1015 : compact ? 590 : 660} rx="42" fill="var(--paper-2)" stroke="var(--line)" stroke-width="5" opacity="0.42" />

  {#each coreLinks(L) as l (`${l.core}-${l.agg}`)}
    <path d={wire(l.a, l.b)} stroke="var(--line)" stroke-width="7" stroke-linecap="round" opacity="0.22" />
    <path d={wire(l.a, l.b)} stroke={treeColour} stroke-width="4" stroke-linecap="round" opacity="0.3" />
  {/each}
  <path d={wire(...peer)} stroke="var(--line)" stroke-width="7" stroke-linecap="round" opacity="0.22" />
  <path d={wire(...peer)} stroke={treeColour} stroke-width="4" stroke-linecap="round" opacity="0.3" />

  {#each ends as e (e.d)}
    {#if night}<path d={e.d} stroke={e.tech.colour} stroke-width="52" stroke-linecap="round" opacity="0.18" />{/if}
    <path d={e.d} stroke="var(--line)" stroke-width="28" stroke-linecap="round" />
    <path d={e.d} stroke={e.tech.colour} stroke-width="16" stroke-linecap="round" />
  {/each}

  {#each ups as u (`${u.rack}-${u.agg}`)}
    {#if u.blocked}
      <path d={wire(u.a, u.b)} stroke="var(--line)" stroke-width="7" stroke-linecap="round" stroke-dasharray="14 16" opacity="0.32" />
    {:else}
      {#if night}<path d={wire(u.a, u.b)} stroke={treeColour} stroke-width={u.yours ? 30 : 18} stroke-linecap="round" opacity={u.yours ? 0.18 : 0.08} />{/if}
      <path d={wire(u.a, u.b)} stroke="var(--line)" stroke-width={u.yours ? 12 : 8} stroke-linecap="round" opacity={u.yours ? 0.7 : 0.4} />
      <path d={wire(u.a, u.b)} stroke={treeColour} stroke-width={u.yours ? 7 : 4} stroke-linecap="round" opacity={u.yours ? 0.78 : 0.5} />
    {/if}
  {/each}
  <!-- spanning tree's no-entry signs, on the rack's end of each blocked uplink -->
  {#each ups.filter((u) => u.blocked) as u (u.rack)}
    {@const b = blockAt(u)}
    <circle cx={b.x} cy={b.y} r={T.sign} fill="var(--berry)" stroke="var(--line)" stroke-width="4" />
    <rect x={b.x - T.sign * 0.62} y={b.y - T.sign * 0.2} width={T.sign * 1.24} height={T.sign * 0.4} rx="2" fill="var(--paper-white)" />
  {/each}

  {#each CORES as i (i)}
    <Spine box={coreBox(L, i)} active={false} {night} />
    {#if !compact}<Text x={L.cores[i].x} y={coreBox(L, i).y - (portrait ? 18 : 14)} text={fill(S('core.label'), { n: i + 1 })} size={T.box} kind="node" />{/if}
  {/each}
  {#each AGGS as i (i)}
    <g opacity={i === ACTIVE ? 1 : 0.6}><Spine box={aggBox(L, i)} active={i === ACTIVE} {night} /></g>
    <Text x={L.aggs[i].x} y={aggBox(L, i).y - (portrait ? 18 : 14)} text={i === ACTIVE ? nameOf(subject.hop) : S('standby')} size={T.box} kind="node" />
  {/each}

  <rect x={L.sticker.x + 6} y={L.sticker.y + 8} width={L.sticker.w} height={L.sticker.h} rx="14" fill="var(--shade)" opacity="0.12" />
  <rect x={L.sticker.x} y={L.sticker.y} width={L.sticker.w} height={L.sticker.h} rx="14" fill="var(--kraft)" stroke="var(--line)" stroke-width="5" />
  {#each stickerLines as line, i (line)}
    <text x={L.sticker.x + L.sticker.w / 2} y={L.sticker.y + L.sticker.h / 2 + T.sticker * (i - (stickerLines.length - 1) / 2) * 1.08 + T.sticker * 0.34} text-anchor="middle" font-family={technical ? 'var(--tag-font)' : 'var(--label-font)'} font-size={T.sticker} font-weight="900" fill="var(--line)">{line}</text>
  {/each}

  {#if before}
    <Node id={before.node.id} x={L.before.x} y={L.before.y} size={L.nodeSize} />
    {#if T.label}<Text x={L.before.x} y={L.beforeBox.y + L.beforeBox.h + (portrait ? 42 : 38)} text={nameOf(before)} size={T.label} kind="node" />{/if}
  {/if}
  {#each RACKS as rack (rack)}
    {#if rack === 'after'}
      {#if after}
        <Node id={after.node.id} x={L.racks.after.x} y={L.racks.after.y} size={L.nodeSize} />
        {#if T.label}<Text x={L.racks.after.x - (portrait ? 20 : 0)} y={L.rackBoxes.after.y + L.rackBoxes.after.h + (portrait ? 42 : 38)} text={nameOf(after)} size={T.label} kind="node" anchor={portrait ? 'end' : 'middle'} />{/if}
      {/if}
    {:else}
      <Leaf box={L.rackBoxes[rack]} {night} />
      {#if T.label && !portrait}<Text x={L.racks[rack].x} y={L.rackBoxes[rack].y + L.rackBoxes[rack].h + 35} text={S('rack.other')} size={T.label} kind="node" />{/if}
    {/if}
  {/each}

  {#each others as f, i (i)}
    <Carrier p={f.p} alpha={f.alpha} {time} kind="other" colour={otherColours[i]} {night} />
  {/each}
  <Carrier p={parcel.p} alpha={parcel.alpha} {time} kind="yours" colour="var(--sun)" {night} />

  {#if T.tag && treeTech}
    <Text x={L.tag.x} y={L.tag.y} text={strings(`tech.${treeTech.id}`)('name')} size={T.tag} kind="link" colour={treeTech.colour} anchor={L.tag.anchor} />
  {/if}
</g>
