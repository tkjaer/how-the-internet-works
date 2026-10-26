<svelte:options namespace="svg" />
<script lang="ts">
  // Look inside the home router: the switch's cable sockets, the Wi‑Fi radio, the brain (routing and NAT) and the
  // uplink: the fibre ONT, the modem for the phone line, or a cable socket of its own. A parcel comes in on the link
  // before (electric pushes on a cable), is plain bits inside, has its sender swapped by the brain and leaves on the
  // link after (as light on the fibre, tones on the phone line): the rooms it uses follow those links.
  import { Node, Text, clientAt, fill, legibleSize, nameOf, strings, textBox, view, type NodeSubject } from '$core/api';
  import { centre, formFor, parcelAt, roomFor, routerLayout, tripPath, uplinkOf } from './router';
  import type { Look, Room as RoomId } from './types';
  import Case from './art/Case.svelte';
  import Room from './art/Room.svelte';
  import Carrier from './art/Carrier.svelte';

  let { subject, time }: { subject: NodeSubject; time: number } = $props();
  const S = strings('scene.router-inside');
  const o = $derived(view.orient);
  const portrait = $derived(o === 'portrait');
  const compact = $derived(o === 'landscape' && view.vp.h < 470);
  const night = $derived(view.mode === 'night');
  const L = $derived(routerLayout(o, compact));
  // a phone on its side: no text under the theme's minimum on screen (about 42 world units there)
  const legible = legibleSize();
  const T = $derived(portrait ? { head: 34, body: 30, sticker: 28 } : compact ? { head: legible(44), body: 0, sticker: legible(42) } : { head: 27, body: 23, sticker: 19 });

  const before = $derived(subject.in ? subject.route.hops[subject.in.from] : null);
  const after = $derived(subject.out ? subject.route.hops[subject.out.to] : null);
  // a route always has a link on at least one side of a hop; with none on one side, the parcel comes in and goes out the same way
  const inLink = $derived((subject.in ?? subject.out)!);
  const outLink = $derived((subject.out ?? subject.in)!);
  const techOf = (l: typeof inLink) => ({ id: l.tech.id, look: l.tech.look as Look });
  const inRoom = $derived(roomFor(techOf(inLink), 'in'));
  const outRoom = $derived(roomFor(techOf(outLink), 'out'));
  // the uplink room is an ONT, a modem or a cable socket, by the line out (an ONT when this trip doesn't use it)
  const uplink = $derived(outRoom === 'ont' ? uplinkOf(techOf(outLink)) : 'ont');
  const path = $derived(tripPath(L, inRoom, outRoom));
  const parcel = $derived(parcelAt(time, view.still, path));
  const onLink = $derived(parcel.stage === 'in' ? inLink : parcel.stage === 'out' ? outLink : null);

  const client = $derived(subject.route.chain[0]);
  // NAPT swaps the address and the port: the sender as it arrives, and as it leaves
  const sender = (i: number) => {
    const c = clientAt(subject.route, i, subject.route.activity.flows[0]);
    return { full: c.port ? `${c.addr.text}:${c.port}` : c.addr.text, short: c.addr.text };
  };
  const stickers = $derived(S('mode') === 'technical'
    ? subject.hop.natTo ? [sender(subject.hop.index - 1), sender(subject.hop.index)] : [client.addr ?? '', subject.hop.addr ?? ''].map((a) => ({ full: a, short: a }))
    : [nameOf(client), S('outside')].map((who) => fill(S('from'), { who })).map((s) => ({ full: s, short: s })));
  /** The stickers' words in a room `w` wide: address:port where it fits (shrunk to no less than 80 %, and not at all
   *  in compact layouts, which keep their legible size), else the address alone. */
  function fitStickers(w: number) {
    const full = stickers.map((s) => s.full);
    if (stickers.every((s) => s.full === s.short)) return { texts: full, size: T.sticker };
    const widest = Math.max(...full.map((t) => textBox(t, T.sticker, 'middle').w));
    const size = widest <= w ? T.sticker : compact ? 0 : (T.sticker * w) / widest;
    return size >= T.sticker * 0.8 ? { texts: full, size } : { texts: stickers.map((s) => s.short), size: T.sticker };
  }
  const used = (r: RoomId) => r === 'brain' || r === inRoom || r === outRoom;
  const key = (r: RoomId) => (r === 'ont' ? uplink : r);
  const line = (r: RoomId) => (compact ? '' : S(`${key(r)}.${used(r) ? 'line' : 'idle'}`));
  const tints: Record<RoomId, string> = { switch: 'var(--orange)', wifi: 'var(--teal)', brain: 'var(--berry)', ont: 'var(--blue)' };
  const ROOMS: RoomId[] = ['switch', 'wifi', 'brain', 'ont'];
  const wire = (a: { x: number; y: number }, b: { x: number; y: number }) => `M${a.x} ${a.y} L${b.x} ${b.y}`;
  const linkName = (id: string) => strings(`tech.${id}`)('name');
  /** A little bundle of tones (a squiggle getting quicker), centred on x, y. */
  const tones = (x: number, y: number) => `M${x - 40} ${y} q7 -18 14 0 t14 0 q4 -14 8 0 t8 0 t8 0 q2.5 -10 5 0 t5 0 t5 0 t5 0`;
</script>

<!-- geometric text: the camera scales this panel every frame, and hinted text would be laid out again each time -->
<g text-rendering="geometricPrecision">
  {#if !portrait}<text x="800" y={compact ? 110 : 120} text-anchor="middle" font-family="var(--label-font)" font-size={compact ? legible(44) : 42} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="7" paint-order="stroke">{S('title')}</text>{/if}

  <!-- the links either side, in their technologies' colours: the medium changes inside the box -->
  {#each [[path[0], path[1], inLink], [path[path.length - 2], path[path.length - 1], outLink]] as const as [a, b, l], i (i)}
    <path d={wire(a, b)} stroke="var(--line)" stroke-width="30" stroke-linecap="round" />
    <path d={wire(a, b)} stroke={l.tech.colour} stroke-width="18" stroke-linecap="round" stroke-dasharray={l.tech.look === 'radio' ? '4 26' : undefined} />
    {#if night}<path d={wire(a, b)} stroke={l.tech.colour} stroke-width="54" stroke-linecap="round" opacity="0.18" />{/if}
  {/each}
  <Case box={L.case} antennas={L.antennas} {time} {night} />
  <!-- inside: the wires between the rooms it passes through -->
  <path d={`M${path.slice(1, -1).map((p) => `${p.x} ${p.y}`).join(' L')}`} fill="none" stroke="var(--line)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" />
  {#each ROOMS as r (r)}
    {@const b = L.rooms[r]}
    {@const c = centre(b)}
    {@const top = b.y + T.head * 1.9}
    {@const mid = (top + b.y + b.h - (T.body ? T.body * 1.9 : 0)) / 2}
    <Room part="room" box={b} tint={tints[r]} title={S(`${key(r)}.title`)} line={line(r)} used={used(r)} head={T.head} body={T.body}>
      {#if r === 'switch'}
        <!-- four cable sockets; the one the cable comes in (or goes out) by is lit -->
        {#each [0, 1, 2, 3] as k (k)}
          {@const sx = c.x + (k - 1.5) * (portrait ? 110 : 54)}
          <rect x={sx - 21} y={mid - 22} width="42" height="40" rx="5" fill={k === 0 && used(r) ? inLink.tech.colour : 'var(--paper-2)'} stroke="var(--line)" stroke-width="5" />
          <rect x={sx - 9} y={mid + 10} width="18" height="10" fill="var(--line)" />
        {/each}
      {:else if r === 'wifi'}
        {#each [1, 2, 3] as k (k)}
          <path d={`M${c.x - k * 22} ${mid + 14 - k * 6} A${k * 31} ${k * 31} 0 0 1 ${c.x + k * 22} ${mid + 14 - k * 6}`} fill="none" stroke="var(--teal)" stroke-width="8" stroke-linecap="round" />
        {/each}
        <circle cx={c.x} cy={mid + 18} r="9" fill="var(--line)" />
      {:else if r === 'brain'}
        <!-- the sender's sticker, before and after the brain swaps it -->
        {@const fit = fitStickers(b.w - 52)}
        {#each fit.texts as s, k (k)}
          {@const sy = mid + (k ? 1 : -1) * T.sticker * 1.25}
          {@const on = k === 1 ? parcel.swapped : !parcel.swapped}
          <rect x={b.x + 18} y={sy - T.sticker * 0.85} width={b.w - 36} height={T.sticker * 1.7} rx="8" fill={on ? 'var(--kraft)' : 'var(--paper-2)'} stroke="var(--line)" stroke-width="4" />
          <text x={c.x} y={sy + T.sticker * 0.36} text-anchor="middle" font-family={S('mode') === 'technical' ? 'var(--tag-font)' : 'var(--label-font)'} font-size={fit.size} font-weight="800" fill="var(--line)" text-decoration={k === 0 && parcel.swapped ? 'line-through' : undefined}>{s}</text>
        {/each}
      {:else if uplink === 'wan'}
        <!-- one cable socket of its own, for the cable out of the home; lit, as it's the way out -->
        <rect x={c.x - 21} y={mid - 22} width="42" height="40" rx="5" fill={outLink.tech.colour} stroke="var(--line)" stroke-width="5" />
        <rect x={c.x - 9} y={mid + 10} width="18" height="10" fill="var(--line)" />
      {:else}
        <!-- electric pushes in, flashes of light out (an ONT), or tones out on the phone line (a modem) -->
        <Carrier p={{ x: c.x - (portrait ? 110 : 68), y: mid }} form="spark" colour="var(--sun)" alpha={1} time={0} night={false} />
        <path d={`M${c.x - 30} ${mid} H${c.x + 22} m-14 -14 l14 14 l-14 14`} fill="none" stroke="var(--line)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
        {#if uplink === 'modem'}
          <path d={tones(c.x + (portrait ? 110 : 68), mid)} fill="none" stroke="var(--berry)" stroke-width="7" stroke-linecap="round" />
        {:else}
          <Carrier p={{ x: c.x + (portrait ? 110 : 68), y: mid }} form="light" colour="var(--teal)" alpha={1} time={0} night={false} />
        {/if}
      {/if}
    </Room>
  {/each}

  <Carrier p={parcel.p} form={onLink ? formFor(onLink.tech.look as Look) : 'parcel'} colour={onLink?.tech.colour ?? ''} alpha={parcel.alpha} {time} {night} />
  <!-- the rooms' titles and lines over the parcel: it passes through them (issue 137, labels win) -->
  {#each ROOMS as r (r)}
    <Room part="label" box={L.rooms[r]} tint={tints[r]} title={S(`${key(r)}.title`)} line={line(r)} used={used(r)} head={T.head} body={T.body} />
  {/each}

  {#if before}
    <Node id={before.node.id} x={L.inNode.x} y={L.inNode.y} size={L.nodeSize} />
    {#if !compact}<Text x={L.inLabel.x} y={L.inLabel.y} text={nameOf(before)} size={portrait ? 32 : 25} kind="node" fit />{/if}
  {/if}
  {#if after}
    <Node id={after.node.id} x={L.outNode.x} y={L.outNode.y} size={L.nodeSize} />
    {#if !compact}<Text x={L.outLabel.x} y={L.outLabel.y} text={nameOf(after)} size={portrait ? 32 : 25} kind="node" fit />{/if}
  {/if}
  {#if !compact}
    {#each [[path[0], path[1], inLink], [path[path.length - 2], path[path.length - 1], outLink]] as const as [a, b, l], i (i)}
      <Text x={(a.x + b.x) / 2 - (portrait ? 34 : 0)} y={(a.y + b.y) / 2 + (portrait ? 10 : -30)} text={linkName(l.tech.id)} size={portrait ? 30 : 24} kind="link" colour={l.tech.colour} anchor={portrait ? 'end' : 'middle'} />
    {/each}
  {/if}
</g>
