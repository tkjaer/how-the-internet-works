<svelte:options namespace="svg" />
<script lang="ts">
  // Look inside the cell tower: the antennas catch the phone's radio wave, the radio unit turns it into bits, baseband
  // wraps the parcel in the mobile network's tunnel envelope, and the fibre carries it onward as light.
  import { Node, Text, fill, legibleSize, nameOf, strings, view, type NodeSubject } from '$core/api';
  import { centre, formFor, parcelAt, towerLayout, tripPath } from './tower';
  import type { Pt, Room as RoomId } from './types';
  import Case from './art/Case.svelte';
  import Room from './art/Room.svelte';
  import Carrier from './art/Carrier.svelte';

  let { subject, time }: { subject: NodeSubject; time: number } = $props();
  const S = strings('scene.tower-inside');
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(!portrait && view.vp.h < 470);
  const night = $derived(view.mode === 'night');
  const technical = $derived(S('mode') === 'technical');
  const L = $derived(towerLayout(view.orient, compact));
  // a phone on its side: no text under the theme's minimum on screen (about 42 world units there)
  const legible = legibleSize();
  const T = $derived(portrait ? { head: 36, body: 30, sticker: 30 } : compact ? { head: legible(44), body: 0, sticker: 0 } : { head: 28, body: 23, sticker: 21 });
  const mast = $derived({ x: centre(L.rooms.radio).x, y0: L.rooms.radio.y + L.rooms.radio.h, y1: L.cabinet.y });

  const before = $derived(subject.in ? subject.route.hops[subject.in.from] : null);
  const after = $derived(subject.out ? subject.route.hops[subject.out.to] : null);
  const path = $derived(tripPath(L));
  const parcel = $derived(parcelAt(time, view.still, path));
  const onLink = $derived(parcel.stage === 'in' ? subject.in : parcel.stage === 'out' ? subject.out : null);
  // the tunnel runs from this tower's address to the next device's, read off the route
  const sticker = $derived(technical
    ? [fill(S('tunnel.from'), { addr: subject.hop.addr ?? '' }), fill(S('tunnel.to'), { addr: after?.addr ?? '' })]
    : [S('tunnel.title'), fill(S('tunnel.for'), { who: after ? nameOf(after) : '' })]);
  const line = (r: RoomId) => (compact || r === 'baseband' ? '' : S(`${r}.line`));
  const tints: Record<RoomId, string> = { antenna: 'var(--teal)', radio: 'var(--orange)', baseband: 'var(--berry)', fibre: 'var(--blue)' };
  const ROOMS: RoomId[] = ['antenna', 'radio', 'baseband', 'fibre'];
  const wire = (a: Pt, b: Pt) => `M${a.x} ${a.y} L${b.x} ${b.y}`;
  const linkName = (id: string) => strings(`tech.${id}`)('name');
  const ends = $derived([
    subject.in && { link: subject.in, d: wire(path[0], path[1]), tag: L.inTag },
    subject.out && { link: subject.out, d: wire(path[path.length - 2], path[path.length - 1]), tag: L.outTag },
  ].filter((e) => !!e));
</script>

<!-- geometric text: the camera scales this panel every frame, and hinted text would be laid out again each time -->
<g text-rendering="geometricPrecision">
  {#if !portrait}<text x="800" y={compact ? 110 : 120} text-anchor="middle" font-family="var(--label-font)" font-size={compact ? legible(44) : 42} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="7" paint-order="stroke">{S('title')}</text>{/if}

  <!-- the links either side, as the route draws them -->
  {#each ends as e (e.d)}
    {#if night}<path d={e.d} stroke={e.link.tech.colour} stroke-width="58" stroke-linecap="round" opacity="0.18" />{/if}
    <path d={e.d} stroke="var(--line)" stroke-width="30" stroke-linecap="round" />
    <path d={e.d} stroke={e.link.tech.colour} stroke-width="18" stroke-linecap="round" stroke-dasharray={e.link.tech.look === 'radio' ? '4 26' : undefined} />
  {/each}

  <Case {mast} cabinet={L.cabinet} />
  <path d={`M${path.slice(1, -1).map((p) => `${p.x} ${p.y}`).join(' L')}`} fill="none" stroke="var(--line)" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" />

  {#each ROOMS as r (r)}
    {@const b = L.rooms[r]}
    {@const c = centre(b)}
    {@const top = b.y + T.head * 1.9}
    {@const stickerH = T.sticker * 3.1}
    {@const bottom = b.y + b.h - (r === 'baseband' ? stickerH + 14 : T.body * 1.9)}
    {@const mid = (top + bottom) / 2}
    <Room box={b} tint={tints[r]} title={S(`${r}.title`)} line={line(r)} head={T.head} body={T.body}>
      {#if r === 'antenna'}
        {@const ph = Math.min(bottom - top - 24, 120)}
        {#each [-1, 1] as k (k)}
          <rect x={c.x + k * ph * 0.42 - ph * 0.17} y={mid - ph / 2} width={ph * 0.34} height={ph} rx={ph * 0.12} fill="var(--teal)" stroke="var(--line)" stroke-width="6" />
        {/each}
        <path d={`M${c.x - ph * 0.14} ${mid - ph * 0.2} q${ph * 0.14} ${ph * 0.2} 0 ${ph * 0.4} M${c.x + ph * 0.02} ${mid - ph * 0.3} q${ph * 0.2} ${ph * 0.3} 0 ${ph * 0.6}`} fill="none" stroke={subject.in?.tech.colour ?? 'var(--teal)'} stroke-width="6" stroke-linecap="round" />
      {:else if r === 'radio'}
        <rect x={c.x - 66} y={mid - 42} width="132" height="84" rx="18" fill="var(--orange-soft)" stroke="var(--line)" stroke-width="6" />
        <path d={`M${c.x - 42} ${mid - 14} H${c.x + 42} M${c.x - 42} ${mid + 14} H${c.x + 42}`} stroke="var(--line)" stroke-width="7" stroke-linecap="round" />
      {:else if r === 'baseband'}
        <Carrier p={{ x: c.x - 82, y: mid }} form="parcel" colour="var(--sun)" alpha={1} time={0} night={false} />
        <path d={`M${c.x - 34} ${mid} H${c.x + 28} m-14 -14 l14 14 l-14 14`} fill="none" stroke="var(--line)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
        <Carrier p={{ x: c.x + 82, y: mid }} form="envelope" colour="var(--teal)" alpha={1} time={0} night={false} />
        {#if T.sticker}
          {@const y = b.y + b.h - stickerH - 14}
          <rect x={b.x + 18} y={y} width={b.w - 36} height={stickerH} rx="9" fill="var(--kraft)" stroke="var(--line)" stroke-width="4" />
          {#each sticker as s, i (i)}
            <text x={c.x} y={y + T.sticker * (1.25 + i * 1.1)} text-anchor="middle" font-family="var(--tag-font)" font-size={T.sticker} font-weight="800" fill="var(--line)">{s}</text>
          {/each}
        {/if}
      {:else}
        {@const colour = subject.out?.tech.colour ?? 'var(--blue)'}
        {#each [-1, 0, 1] as k (k)}
          {@const yy = mid + k * 30}
          <path d={`M${b.x + 36} ${yy} C${c.x - 30} ${yy - 26} ${c.x + 30} ${yy + 26} ${b.x + b.w - 36} ${yy}`} fill="none" stroke={colour} stroke-width="8" stroke-linecap="round" opacity={0.58 + k * 0.13} />
        {/each}
      {/if}
    </Room>
  {/each}

  <Carrier p={parcel.p} form={onLink ? formFor(onLink.tech.look) : parcel.wrapped ? 'envelope' : 'parcel'} colour={onLink?.tech.colour ?? (parcel.wrapped ? 'var(--teal)' : 'var(--sun)')} alpha={parcel.alpha} {time} {night} />

  {#if before}
    <Node id={before.node.id} x={L.inNode.x} y={L.inNode.y} size={L.nodeSize} />
    {#if !compact}<Text x={L.inLabel.x} y={L.inLabel.y} text={nameOf(before)} size={portrait ? 32 : 25} kind="node" anchor={L.inLabel.anchor} fit />{/if}
  {/if}
  {#if after}
    <Node id={after.node.id} x={L.outNode.x} y={L.outNode.y} size={L.nodeSize} />
    {#if !compact}<Text x={L.outLabel.x} y={L.outLabel.y} text={nameOf(after)} size={portrait ? 32 : 25} kind="node" anchor={L.outLabel.anchor} fit />{/if}
  {/if}
  {#if !compact}
    {#each ends as e (e.d)}
      <Text x={e.tag.x} y={e.tag.y} text={linkName(e.link.tech.id)} size={portrait ? 30 : 24} kind="link" colour={e.link.tech.colour} anchor={e.tag.anchor} fit />
    {/each}
  {/if}
</g>
