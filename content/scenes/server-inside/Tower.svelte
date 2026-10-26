<svelte:options namespace="svg" />
<script lang="ts">
  // The 1995 web server (#59): a beige tower with its side off. The request comes off the hub's cable into the network
  // card, the one web program asks the hard disk, and the page, then its picture, goes back out the same way.
  import { Node, Text, legibleSize, nameOf, strings, view, type NodeSubject } from '$core/api';
  import { centre, filePath, formFor, roomFloor, towerAt, towerLayout, towerRooms } from './server';
  import type { Pt, TowerRoom } from './types';
  import Case from './art/Case.svelte';
  import Room from './art/Room.svelte';
  import Carrier from './art/Carrier.svelte';
  import Nic from './art/Nic.svelte';
  import Disk from './art/Disk.svelte';

  let { subject, time }: { subject: NodeSubject; time: number } = $props();
  const S = strings('scene.server-inside');
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(!portrait && view.vp.h < 470);
  const night = $derived(view.mode === 'night');
  const technical = $derived(S('mode') === 'technical');
  const L = $derived(towerLayout(view.orient, compact));
  const legible = legibleSize();
  const T = $derived(portrait ? { head: 34, body: 29, small: 24 } : compact ? { head: legible(43), body: 0, small: 0 } : { head: 27, body: 22, small: 18 });
  const statusW = $derived(compact ? 600 : portrait ? 700 : 560);

  const before = $derived(subject.in ? subject.route.hops[subject.in.from] : null);
  const inLink = $derived(subject.in);
  const state = $derived(towerAt(time, view.still, L));
  // the way through the case, from the disk to where the cable comes in
  const insideLine = $derived(filePath(L).slice(0, -1));
  const wire = (a: Pt, b: Pt) => `M${a.x} ${a.y} L${b.x} ${b.y}`;
  const poly = (pts: Pt[]) => `M${pts.map((p) => `${p.x} ${p.y}`).join(' L')}`;
  const tints: Record<TowerRoom, string> = { nic: 'var(--teal)', compute: 'var(--orange)', disk: 'var(--berry)' };
  const roomLine = (r: TowerRoom) => (compact ? '' : S(`${r}.line`));
  const requestForm = $derived(state.request.stage === 'in' && inLink ? formFor(inLink.tech.look) : 'parcel');
  const requestColour = $derived(state.request.stage === 'in' && inLink ? inLink.tech.colour : 'var(--sun)');
</script>

<!-- geometric text: the camera scales this panel every frame, and hinted text would be laid out again each time -->
<g text-rendering="geometricPrecision">
  {#if !portrait}<text x="800" y={compact ? 105 : 118} text-anchor="middle" font-family="var(--label-font)" font-size={compact ? legible(43) : 42} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="7" paint-order="stroke">{S('title')}</text>{/if}

  {#if inLink}
    {@const d = wire(L.inNode, insideLine.at(-1)!)}
    {#if night}<path d={d} stroke={inLink.tech.colour} stroke-width="58" stroke-linecap="round" opacity="0.18" />{/if}
    <path d={d} stroke="var(--line)" stroke-width="30" stroke-linecap="round" />
    <path d={d} stroke={inLink.tech.colour} stroke-width="18" stroke-linecap="round" />
  {/if}

  <Case box={L.case} {time} {night} fill="var(--tan-pale)" />
  <path d={poly(insideLine)} fill="none" stroke="var(--line)" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity="0.38" />

  {#each towerRooms as r (r)}
    {@const b = L.rooms[r]}
    {@const c = centre(b)}
    {@const { bottom, mid, h } = roomFloor(b, T.head, T.body)}
    <Room box={b} tint={tints[r]} title={S(`${r}.title`)} line={roomLine(r)} head={T.head} body={T.body}>
      {#if r === 'nic'}
        <Nic p={{ x: c.x, y: mid }} colour={inLink?.tech.colour ?? 'var(--teal)'} />
      {:else if r === 'compute'}
        {@const chip = Math.min(84, h - 30)}
        <!-- the program right of the empty slot, even in a narrow room -->
        {@const px = Math.max(c.x, b.x + chip + 122)}
        <rect x={b.x + 28} y={bottom - 30} width={b.w - 56} height="22" rx="7" fill="var(--stone)" stroke="var(--line)" stroke-width="4" />
        <!-- the chip and the disk need a floor; one the head has grown over (legible text, issue 182) has neither -->
        {#if chip >= 24}
          <rect x={b.x + 34} y={mid - chip / 2 - 8} width={chip} height={chip} rx="8" fill="var(--stone)" stroke="var(--line)" stroke-width="5" />
          <path d={`M${b.x + 34 + chip * 0.25} ${mid - 8} H${b.x + 34 + chip * 0.75} M${b.x + 34 + chip / 2} ${mid - chip * 0.25 - 8} V${mid + chip * 0.25 - 8}`} stroke="var(--line)" stroke-width="4" opacity="0.5" />
        {/if}
        <rect x={px - 72} y={mid - 50} width="144" height="84" rx="13" fill="var(--orange-soft)" stroke="var(--line)" stroke-width="6" />
        <rect x={px - 58} y={mid - 38} width="116" height="14" rx="5" fill="var(--sun)" />
        <path d={`M${px - 54} ${mid - 6} H${px + 40} M${px - 54} ${mid + 14} H${px + 18}`} stroke="var(--line)" stroke-width="5" stroke-linecap="round" opacity="0.6" />
        {#if T.small}<text x={px} y={mid - 62} text-anchor="middle" font-family="var(--label-font)" font-size={T.small} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="5" paint-order="stroke">{S('app')}</text>{/if}
      {:else}
        {@const disk = Math.min(h / 2.7, b.w / 3.4)}
        {#if disk >= 16}<Disk p={{ x: c.x, y: mid }} r={disk} {time} reading={state.reading} still={view.still} />{/if}
      {/if}
    </Room>
  {/each}

  <g opacity={state.statusAlpha}>
    <rect x={L.statusTag.x - statusW / 2} y={L.statusTag.y - (compact ? 36 : 31)} width={statusW} height={compact ? 72 : 62} rx="18" fill="var(--leaf-pale)" stroke="var(--line)" stroke-width="5" />
    <text x={L.statusTag.x} y={L.statusTag.y + (compact ? 14 : 12)} text-anchor="middle" font-family={technical ? 'var(--tag-font)' : 'var(--label-font)'} font-size={compact ? legible(30) : 25} font-weight="900" fill="var(--line)">{S(`ok.${state.file}`)}</text>
  </g>

  <Carrier p={state.request.p} form={requestForm} colour={requestColour} alpha={state.request.alpha} {time} {night} />
  <Carrier p={state.reply.p} form={state.file} colour="var(--berry)" alpha={state.reply.alpha} {time} {night} />

  {#if before}
    <Node id={before.node.id} x={L.inNode.x} y={L.inNode.y} size={L.nodeSize} />
    {#if !compact}<Text x={L.inLabel.x} y={L.inLabel.y} text={nameOf(before)} size={portrait ? 32 : 25} kind="node" anchor={L.inLabel.anchor} fit />{/if}
  {/if}
  {#if !compact && inLink}
    <Text x={L.inTag.x} y={L.inTag.y} text={strings(`tech.${inLink.tech.id}`)('name')} size={portrait ? 30 : 24} kind="link" colour={inLink.tech.colour} anchor={L.inTag.anchor} />
  {/if}
</g>
