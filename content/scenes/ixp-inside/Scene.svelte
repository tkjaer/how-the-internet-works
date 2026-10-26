<svelte:options namespace="svg" />
<script lang="ts">
  // Inside an internet exchange: BGP notes ride the shared switch to the route server and back, but your parcel
  // crosses the switch straight from your ISP's port to the video company's.
  import { Node, Text, fill, legibleSize, nameOf, strings, view, type NodeSubject } from '$core/api';
  import { MEMBERS, OTHER_FLOWS, exchangeLayout, notesAt, otherFlowAt, parcelAt, portLink, wire } from './exchange';
  import type { Member as MemberId } from './types';
  import Fabric from './art/Fabric.svelte';
  import Member from './art/Member.svelte';
  import RouteServer from './art/RouteServer.svelte';
  import Carrier from './art/Carrier.svelte';
  import Note from './art/Note.svelte';

  let { subject, time }: { subject: NodeSubject; time: number } = $props();
  const S = strings('scene.ixp-inside');
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(!portrait && view.vp.h < 470);
  const night = $derived(view.mode === 'night');
  const technical = $derived(S('mode') === 'technical');
  const L = $derived(exchangeLayout(view.orient));
  const legible = legibleSize();
  const T = $derived(portrait
    ? { title: 0, label: 29, small: 24, server: 28, fabric: 27, tag: 26 }
    : compact ? { title: legible(42), label: 0, small: 0, server: legible(32), fabric: legible(31), tag: 0 }
    : { title: 42, label: 24, small: 21, server: 26, fabric: 28, tag: 23 });

  const before = $derived(subject.in ? subject.route.hops[subject.in.from] : null);
  const after = $derived(subject.out ? subject.route.hops[subject.out.to] : null);
  const inColour = $derived(subject.in?.tech.colour ?? 'var(--teal)');
  const outColour = $derived(subject.out?.tech.colour ?? inColour);
  const parcel = $derived(parcelAt(time, view.still, L));
  const notes = $derived(notesAt(time, view.still, L));
  const flows = $derived(OTHER_FLOWS.map((f) => otherFlowAt(time, view.still, L, f)));
  const serverActive = $derived(notes.some((n) => n.alpha > 0.05));
  const others = MEMBERS.filter((m) => m !== 'before' && m !== 'after');
  const colour = (m: MemberId) => m === 'before' ? inColour : m === 'after' ? outColour : OTHER_FLOWS[others.indexOf(m)].colour;
  const ends = $derived([
    subject.in && { link: subject.in, d: wire(L.inPort, L.members.before) },
    subject.out && { link: subject.out, d: wire(L.members.after, L.outPort) },
  ].filter((e) => !!e));
</script>

<g text-rendering="geometricPrecision">
  {#if T.title}<text x="800" y={compact ? 100 : 96} text-anchor="middle" font-family="var(--label-font)" font-size={T.title} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="7" paint-order="stroke">{S('heading')}</text>{/if}

  <rect x={portrait ? 30 : 60} y={portrait ? 150 : 140} width={portrait ? 840 : 1480} height={portrait ? 1360 : 730} rx="44" fill="var(--paper-2)" stroke="var(--line)" stroke-width="5" opacity="0.38" />

  <path d={wire(...L.serverCable)} stroke="var(--line)" stroke-width="16" stroke-linecap="round" opacity="0.6" />
  <path d={wire(...L.serverCable)} stroke="var(--orange)" stroke-width="8" stroke-linecap="round" />
  {#each MEMBERS as m (m)}
    {@const line = portLink(L, m)}
    {#if night}<path d={wire(...line)} stroke={colour(m)} stroke-width="34" stroke-linecap="round" opacity="0.11" />{/if}
    <path d={wire(...line)} stroke="var(--line)" stroke-width={m === 'before' || m === 'after' ? 28 : 14} stroke-linecap="round" opacity={m === 'before' || m === 'after' ? 1 : 0.55} />
    <path d={wire(...line)} stroke={colour(m)} stroke-width={m === 'before' || m === 'after' ? 16 : 7} stroke-linecap="round" />
  {/each}
  {#each ends as e (e.d)}
    {#if night}<path d={e.d} stroke={e.link.tech.colour} stroke-width="50" stroke-linecap="round" opacity="0.16" />{/if}
    <path d={e.d} stroke="var(--line)" stroke-width="28" stroke-linecap="round" />
    <path d={e.d} stroke={e.link.tech.colour} stroke-width="16" stroke-linecap="round" />
  {/each}

  <RouteServer box={L.routeServer} active={serverActive} {night} />
  <Text x={L.serverLabel.x} y={L.serverLabel.y} text={S('routeServer')} size={T.server} kind="node" anchor={L.serverLabel.anchor} />
  {#if T.small}<Text x={L.serverLine.x} y={L.serverLine.y} text={S('routeServerLine')} size={T.small} kind="link" colour="var(--orange)" anchor={L.serverLine.anchor} />{/if}

  <Fabric box={L.fabric} vertical={L.vertical} ports={[...Object.values(L.ports), L.serverCable[1]]} {night} />
  <Text x={L.fabricLabel.x} y={L.fabricLabel.y} text={S('fabric')} size={T.fabric} kind="node" anchor={L.fabricLabel.anchor} />
  {#if T.tag}
    <!-- Portrait runs the fabric upright, so the tag reads up along it, the way the parcel goes. -->
    <g transform={L.vertical ? `rotate(-90 ${L.straightTag.x} ${L.straightTag.y})` : undefined}>
      <Text x={L.straightTag.x} y={L.straightTag.y} text={S('straight')} size={T.tag} kind="link" colour="var(--line)" anchor={L.straightTag.anchor} />
    </g>
  {/if}

  {#each others as m (m)}
    <Member box={L.memberBoxes[m]} colour={colour(m)} {night} />
    {#if T.label && technical}<Text x={L.members[m].x} y={L.memberBoxes[m].y + L.memberBoxes[m].h + (portrait ? 30 : 32)} text={fill(S('member.as'), { n: 64506 + others.indexOf(m) })} size={T.small} kind="node" />{/if}
  {/each}
  {#if T.label && !technical}<Text x={L.othersLabel.x} y={L.othersLabel.y} text={S('member.other')} size={T.label} kind="node" anchor={L.othersLabel.anchor} />{/if}
  {#if before}
    <Node id={before.node.id} x={L.members.before.x} y={L.members.before.y} size={L.nodeSize} />
    {#if T.label}<Text x={L.inLabel.x} y={L.inLabel.y} text={nameOf(before)} size={T.label} kind="node" anchor={L.inLabel.anchor} fit />{/if}
  {/if}
  {#if after}
    <Node id={after.node.id} x={L.members.after.x} y={L.members.after.y} size={L.nodeSize} />
    {#if T.label}<Text x={L.outLabel.x} y={L.outLabel.y} text={nameOf(after)} size={T.label} kind="node" anchor={L.outLabel.anchor} fit />{/if}
  {/if}

  {#each flows as f, i (`${f.from}-${f.to}-${i}`)}
    <Carrier p={f.p} alpha={f.alpha} {time} kind="other" colour={f.colour} {night} />
  {/each}
  {#each notes as n, i (`${n.member}-${n.direction}-${i}`)}
    <Note p={n.p} alpha={n.alpha} {time} {night} />
  {/each}
  <Carrier p={parcel.p} alpha={parcel.alpha} {time} kind="parcel" colour="var(--sun)" {night} />

  {#if T.small}
    {#if subject.in}<Text x={L.inTech.x} y={L.inTech.y} text={strings(`tech.${subject.in.tech.id}`)('name')} size={T.small} kind="link" colour={inColour} anchor={L.inTech.anchor} />{/if}
    {#if subject.out}<Text x={L.outTech.x} y={L.outTech.y} text={strings(`tech.${subject.out.tech.id}`)('name')} size={T.small} kind="link" colour={outColour} anchor={L.outTech.anchor} />{/if}
  {/if}
</g>
