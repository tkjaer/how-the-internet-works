<svelte:options namespace="svg" />
<script lang="ts">
  // Look inside the video cache server: light reaches the NIC, the video app in a container checks RAM and SSD, and a
  // miss asks the origin before storing a new local copy.
  import { Node, Text, legibleSize, nameOf, strings, view, type NodeSubject } from '$core/api';
  import { appPoint, cachePoint, centre, formFor, hitPath, internalPath, missReturnPath, originPath, requestPath, roomFloor, roomOrder, serverAt, serverLayout } from './server';
  import type { Pt, Room as RoomId } from './types';
  import Case from './art/Case.svelte';
  import Room from './art/Room.svelte';
  import Carrier from './art/Carrier.svelte';
  import Nic from './art/Nic.svelte';

  let { subject, time }: { subject: NodeSubject; time: number } = $props();
  const S = strings('scene.server-inside');
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(!portrait && view.vp.h < 470);
  const night = $derived(view.mode === 'night');
  const technical = $derived(S('mode') === 'technical');
  const L = $derived(serverLayout(view.orient, compact));
  const legible = legibleSize();
  const T = $derived(portrait ? { head: 34, body: 29, small: 24 } : compact ? { head: legible(43), body: 0, small: 0 } : { head: 27, body: 22, small: 18 });
  const statusW = $derived(compact ? 600 : portrait ? 700 : 560);

  const before = $derived(subject.in ? subject.route.hops[subject.in.from] : null);
  const inLink = $derived(subject.in);
  const originAside = $derived(subject.route.asides.filter((a) => a.link.from === subject.hop.id)[0] ?? null);
  const hasOrigin = $derived(!!originAside);
  const state = $derived(serverAt(time, view.still, L, hasOrigin));
  const reqPath = $derived(requestPath(L));
  const hitVideoPath = $derived(hitPath(L));
  const missVideoPath = $derived(missReturnPath(L));
  const app = $derived(appPoint(L));
  const cache = $derived(cachePoint(L));
  const originLine = $derived(originPath(L));
  const insideLine = $derived(internalPath(L));
  const wire = (a: Pt, b: Pt) => `M${a.x} ${a.y} L${b.x} ${b.y}`;
  const poly = (pts: Pt[]) => `M${pts.map((p) => `${p.x} ${p.y}`).join(' L')}`;
  const linkName = (id: string) => strings(`tech.${id}`)('name');
  const tints: Record<RoomId, string> = { nic: 'var(--teal)', compute: 'var(--orange)', memory: 'var(--sun)', ssd: 'var(--berry)' };
  const roomLine = (r: RoomId) => (compact ? '' : S(`${r}.line`));
  const requestForm = $derived(state.request.stage === 'in' && inLink ? formFor(inLink.tech.look) : 'parcel');
  const requestColour = $derived(state.request.stage === 'in' && inLink ? inLink.tech.colour : 'var(--sun)');
  const activePath = $derived(state.hit ? hitVideoPath : missVideoPath);
</script>

<!-- geometric text: the camera scales this panel every frame, and hinted text would be laid out again each time -->
<g text-rendering="geometricPrecision">
  {#if !portrait}<text x="800" y={compact ? 105 : 118} text-anchor="middle" font-family="var(--label-font)" font-size={compact ? legible(43) : 42} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="7" paint-order="stroke">{S('title')}</text>{/if}

  {#if inLink}
    {@const d = wire(reqPath[0], reqPath[1])}
    {#if night}<path d={d} stroke={inLink.tech.colour} stroke-width="58" stroke-linecap="round" opacity="0.18" />{/if}
    <path d={d} stroke="var(--line)" stroke-width="30" stroke-linecap="round" />
    <path d={d} stroke={inLink.tech.colour} stroke-width="18" stroke-linecap="round" />
  {/if}

  {#if originAside}
    {@const d = wire(originLine[0], originLine[1])}
    {#if night}<path d={d} stroke={originAside.link.tech.colour} stroke-width="42" stroke-linecap="round" opacity={state.originActive ? 0.18 : 0.08} />{/if}
    <path d={d} stroke="var(--line)" stroke-width="17" stroke-linecap="round" stroke-dasharray="18 18" opacity="0.45" />
    <path d={d} stroke={originAside.link.tech.colour} stroke-width="9" stroke-linecap="round" stroke-dasharray="18 18" opacity={state.originActive ? 0.9 : 0.45} />
  {/if}

  <Case box={L.case} {time} {night} />
  <path d={poly(insideLine)} fill="none" stroke="var(--line)" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity="0.38" />
  <path d={poly(activePath)} fill="none" stroke="var(--berry)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.28" stroke-dasharray={state.hit ? undefined : '16 16'} />

  {#each roomOrder as r (r)}
    {@const b = L.rooms[r]}
    {@const c = centre(b)}
    {@const { top, bottom, mid, h } = roomFloor(b, T.head, T.body)}
    <Room box={b} tint={tints[r]} title={S(`${r}.title`)} line={roomLine(r)} head={T.head} body={T.body} active={true}>
      {#if r === 'nic'}
        <Nic p={{ x: c.x, y: mid }} colour={inLink?.tech.colour ?? 'var(--teal)'} />
      {:else if r === 'compute'}
        <rect x={b.x + 28} y={bottom - 42} width={b.w - 56} height="30" rx="8" fill="var(--stone)" stroke="var(--line)" stroke-width="4" />
        {#each [0, 1, 2] as k (k)}
          {@const on = k === 1}
          {@const bx = b.x + 30 + k * ((b.w - 92) / 3)}
          <rect x={bx} y={mid - 54} width={(b.w - 110) / 3} height="82" rx="13" fill={on ? 'var(--orange-soft)' : 'var(--paper-2)'} stroke="var(--line)" stroke-width={on ? 6 : 4} />
          <rect x={bx + 14} y={mid - 34} width={(b.w - 110) / 3 - 28} height="16" rx="5" fill={on ? 'var(--sun)' : 'var(--kraft)'} />
          {#if on}
            {@const cx = bx + (b.w - 110) / 6}
            <path d={`M${cx - 9} ${mid - 6} v26 l22 -13 z`} fill="var(--face)" />
            {#if T.small}<text x={cx} y={mid - 66} text-anchor="middle" font-family="var(--label-font)" font-size={T.small} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="5" paint-order="stroke">{S('app')}</text>{/if}
          {/if}
        {/each}
      {:else if r === 'memory'}
        <!-- memory sticks, each with its light; a floor too low for them (the head grown legible, issue 182) has none -->
        {@const stick = h - 36}
        {#if stick >= 28}
          {#each [0, 1, 2, 3] as k (k)}
            <rect x={b.x + 34 + k * ((b.w - 88) / 4)} y={top + 22} width={(b.w - 122) / 4} height={stick} rx="10" fill="var(--leaf-pale)" stroke="var(--line)" stroke-width="4" />
            <circle cx={b.x + 48 + k * ((b.w - 88) / 4)} cy={mid + 18} r="5" fill="var(--teal)" />
          {/each}
        {/if}
        <Carrier p={{ x: c.x, y: mid - 28 }} form="video" colour="var(--berry)" alpha={state.hit ? 0.55 : state.copyAlpha * 0.7} {time} night={false} />
      {:else}
        {#each [0, 1, 2] as k (k)}
          {@const yy = top + 28 + k * ((bottom - top - 44) / 2)}
          <path d={`M${b.x + 32} ${yy} H${b.x + b.w - 32}`} stroke="var(--line)" stroke-width="7" stroke-linecap="round" opacity="0.8" />
          {#each [0, 1, 2] as j (j)}
            {@const filled = state.hit || state.copyAlpha > 0.05 || !(k === 1 && j === 2)}
            <rect x={b.x + 45 + j * ((b.w - 118) / 3)} y={yy - 30} width={(b.w - 146) / 3} height="42" rx="7" fill={filled ? 'var(--berry)' : 'var(--paper-2)'} stroke="var(--line)" stroke-width="4" opacity={filled ? (k === 1 && j === 2 ? state.copyAlpha : 0.86) : 0.45} />
          {/each}
        {/each}
      {/if}
    </Room>
  {/each}

  <g opacity={state.statusAlpha}>
    <rect x={L.statusTag.x - statusW / 2} y={L.statusTag.y - (compact ? 36 : 31)} width={statusW} height={compact ? 72 : 62} rx="18" fill={state.hit ? 'var(--leaf-pale)' : 'var(--flap)'} stroke="var(--line)" stroke-width="5" />
    <text x={L.statusTag.x} y={L.statusTag.y + (compact ? 14 : 12)} text-anchor="middle" font-family={technical ? 'var(--tag-font)' : 'var(--label-font)'} font-size={compact ? legible(30) : 25} font-weight="900" fill="var(--line)">{state.hit ? S('hit') : S('miss')}</text>
  </g>

  <Carrier p={state.request.p} form={requestForm} colour={requestColour} alpha={state.request.alpha} {time} {night} />
  <Carrier p={state.video.p} form="video" colour="var(--berry)" alpha={state.video.alpha} {time} {night} />

  {#if before}
    <Node id={before.node.id} x={L.inNode.x} y={L.inNode.y} size={L.nodeSize} />
    {#if !compact}<Text x={L.inLabel.x} y={L.inLabel.y} text={nameOf(before)} size={portrait ? 32 : 25} kind="node" anchor={L.inLabel.anchor} fit />{/if}
  {/if}
  {#if originAside}
    <Node id={originAside.hop.node.id} x={L.originNode.x} y={L.originNode.y} size={L.originSize} />
    {#if !compact}<Text x={L.originLabel.x} y={L.originLabel.y} text={nameOf(originAside.hop)} size={portrait ? 29 : 24} kind="node" anchor={L.originLabel.anchor} fit />{/if}
    <Text x={L.originNote.x} y={L.originNote.y} text={technical ? S('origin.technical') : S('origin.simple')} size={portrait ? 25 : compact ? 24 : 21} kind="link" colour={originAside.link.tech.colour} anchor={L.originNote.anchor} />
  {/if}
  {#if !compact && inLink}
    <Text x={L.inTag.x} y={L.inTag.y} text={linkName(inLink.tech.id)} size={portrait ? 30 : 24} kind="link" colour={inLink.tech.colour} anchor={L.inTag.anchor} />
  {/if}
  {#if !compact && originAside}
    <Text x={L.originTag.x} y={L.originTag.y} text={linkName(originAside.link.tech.id)} size={portrait ? 27 : 22} kind="link" colour={originAside.link.tech.colour} anchor={L.originTag.anchor} />
  {/if}
</g>
