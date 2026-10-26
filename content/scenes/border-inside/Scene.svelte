<svelte:options namespace="svg" />
<script lang="ts">
  // The ISP border router as a little customs desk: MPLS is peeled off, BGP notes fill the RIB, and the chosen exit is
  // the exchange while the paid transit door stays dim.
  import { Node, Text, legibleSize, nameOf, strings, view, type NodeSubject } from '$core/api';
  import { borderLayout, exitTrack, inTrack, parcelAt, routeNotesAt, stickerAt } from './border';
  import type { Pt } from './types';
  import Case from './art/Case.svelte';
  import Board from './art/Board.svelte';
  import Carrier from './art/Carrier.svelte';
  import Sticker from './art/Sticker.svelte';
  import Note from './art/Note.svelte';

  let { subject, time }: { subject: NodeSubject; time: number } = $props();
  const S = strings('scene.border-inside');
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(!portrait && view.vp.h < 470);
  const night = $derived(view.mode === 'night');
  const technical = $derived(S('mode') === 'technical');
  const legible = legibleSize();
  const L = $derived(borderLayout(view.orient, compact));
  const T = $derived(portrait
    ? { title: 0, label: 29, board: 28, row: 24, detail: 20, tag: 24, link: 26 }
    : compact
      ? { title: legible(44), label: 0, board: legible(40), row: legible(30), detail: 0, tag: 0, link: 0 }
      : { title: 42, label: 25, board: 27, row: 22, detail: 18, tag: 21, link: 21 });

  const before = $derived(subject.in ? subject.route.hops[subject.in.from] : null);
  const exchange = $derived(subject.out ? subject.route.hops[subject.out.to] : null);
  const transitAside = $derived(subject.route.asides.find((a) => a.link.from === subject.hop.id) ?? null);
  const inLink = $derived(subject.in);
  const outLink = $derived(subject.out);
  const hasMpls = $derived((inLink?.stack ?? inLink?.tech.stack ?? []).includes('mpls'));
  const parcel = $derived(parcelAt(time, view.still, L));
  const sticker = $derived(stickerAt(parcel));
  const notes = $derived(routeNotesAt(time, view.still, L, !!transitAside));
  const pLine = (pts: Pt[]) => `M${pts.map((p) => `${p.x} ${p.y}`).join(' L')}`;
  const wire = (a: Pt, b: Pt) => `M${a.x} ${a.y} L${b.x} ${b.y}`;
  const linkName = (id: string) => strings(`tech.${id}`)('name');
  const boardFont = $derived(technical ? 'var(--tag-font)' : 'var(--label-font)');
  const rowText = $derived({
    destination: { a: S('rib.dest'), b: S('rib.target') },
    exchange: { a: S('rib.exchange'), b: S('rib.exchange.detail') },
    transit: { a: S('rib.transit'), b: S('rib.transit.detail') },
  });
  const dest = $derived(L.rows.destination);
  const choiceRows = ['exchange', 'transit'] as const;
</script>

<g text-rendering="geometricPrecision">
  {#if T.title}<Text x="800" y={compact ? 100 : 105} text={S('heading')} size={T.title} kind="big" />{/if}

  {#if inLink}
    {@const d = wire(L.inNode, L.inPort)}
    {#if night}<path d={d} stroke={inLink.tech.colour} stroke-width="52" stroke-linecap="round" opacity="0.16" />{/if}
    <path d={d} stroke="var(--line)" stroke-width="30" stroke-linecap="round" />
    <path d={d} stroke={inLink.tech.colour} stroke-width="17" stroke-linecap="round" />
  {/if}

  {#if outLink}
    {@const d = wire(L.outPort, L.exchangeNode)}
    {#if night}<path d={d} stroke={outLink.tech.colour} stroke-width="52" stroke-linecap="round" opacity="0.18" />{/if}
    <path d={d} stroke="var(--line)" stroke-width="28" stroke-linecap="round" />
    <path d={d} stroke={outLink.tech.colour} stroke-width="16" stroke-linecap="round" />
  {/if}

  {#if transitAside}
    {@const d = wire(L.transitPort, L.transitNode)}
    {#if night}<path d={d} stroke={transitAside.link.tech.colour} stroke-width="42" stroke-linecap="round" opacity="0.08" />{/if}
    <path d={d} stroke="var(--line)" stroke-width="18" stroke-linecap="round" stroke-dasharray="18 18" opacity="0.42" />
    <path d={d} stroke={transitAside.link.tech.colour} stroke-width="9" stroke-linecap="round" stroke-dasharray="18 18" opacity="0.42" />
  {/if}

  <Case box={L.case} lineCard={L.lineCard} active={parcel.stage === 'pop'} {night} {time} />

  <path d={pLine([...inTrack(L), ...exitTrack(L, 'exchange').slice(1, 3)])} fill="none" stroke="var(--line)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.42" />
  <path d={pLine(exitTrack(L, 'exchange').slice(0, 3))} fill="none" stroke="var(--leaf-ink)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity={0.2 + parcel.chosenAlpha * 0.8} />
  {#if transitAside}<path d={pLine(exitTrack(L, 'transit').slice(0, 3))} fill="none" stroke="var(--line)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="16 16" opacity="0.3" />{/if}

  <Board box={L.table} active={parcel.chosenAlpha > 0.05} {night} />
  <text x={L.table.x + 34} y={L.table.y + (portrait ? 52 : compact ? 58 : 48)} font-family="var(--label-font)" font-size={T.board} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" paint-order="stroke">{S('rib.title')}</text>

  <rect x={dest.x} y={dest.y} width={dest.w} height={dest.h} rx="14" fill="var(--paper-2)" stroke="var(--line)" stroke-width="3" opacity="0.96" />
  {#if !compact}<text x={dest.x + 20} y={dest.y + dest.h * 0.62} font-family={boardFont} font-size={T.row} font-weight="900" fill="var(--line)">{rowText.destination.a}</text>{/if}
  <text x={compact ? dest.x + dest.w / 2 : dest.x + dest.w - 20} y={dest.y + dest.h * 0.62} text-anchor={compact ? 'middle' : 'end'} font-family={boardFont} font-size={T.row} font-weight="900" fill="var(--brick)">{rowText.destination.b}</text>

  {#each choiceRows as row (row)}
    {#if row === 'exchange' || transitAside}
      {@const b = L.rows[row]}
      {@const chosen = row === 'exchange'}
      {@const alpha = chosen ? parcel.chosenAlpha : 0}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="16" fill={chosen ? 'var(--leaf-pale)' : 'var(--paper)'} stroke={chosen ? 'var(--leaf-dark)' : 'var(--line)'} stroke-width={chosen ? 3 + alpha * 4 : 3} opacity={chosen ? 0.72 + alpha * 0.28 : 0.52} />
      <text x={b.x + 20} y={b.y + (T.detail ? b.h * 0.45 : b.h * 0.63)} font-family={boardFont} font-size={T.row} font-weight="900" fill="var(--line)">{rowText[row].a}</text>
      {#if T.detail}<text x={b.x + 20} y={b.y + b.h * 0.78} font-family={boardFont} font-size={T.detail} font-weight="800" fill={chosen ? 'var(--leaf-ink)' : 'var(--brick)'}>{rowText[row].b}</text>{/if}
      {#if chosen}<text x={b.x + b.w - 34} y={b.y + b.h * 0.61} text-anchor="middle" font-family="var(--label-font)" font-size={T.row * 1.45} font-weight="900" fill="var(--leaf-ink)" opacity={alpha}>✓</text>{/if}
    {/if}
  {/each}

  {#if hasMpls && T.tag && parcel.popped}
    <Text x={L.popTag.x} y={L.popTag.y} text={S('pop.tag')} size={T.tag} kind="link" colour="var(--berry)" anchor={L.popTag.anchor} />
  {/if}

  {#each notes as n (`${n.source}`)}
    <Note p={n.p} alpha={n.alpha} text={S('note.short')} colour={n.source === 'exchange' ? outLink?.tech.colour ?? 'var(--teal)' : transitAside?.link.tech.colour ?? 'var(--orange)'} {night} />
  {/each}

  <Carrier p={parcel.p} alpha={parcel.alpha} stickerAlpha={hasMpls && !parcel.stickerDetached ? parcel.stickerAlpha : 0} {time} {night} />
  {#if hasMpls && parcel.stickerDetached}<Sticker p={sticker.p} alpha={sticker.alpha} text={S('pop.short')} detached={sticker.detached} />{/if}

  {#if before}
    <Node id={before.node.id} x={L.inNode.x} y={L.inNode.y} size={L.nodeSize} />
    {#if T.label}<Text x={L.inLabel.x} y={L.inLabel.y} text={nameOf(before)} size={T.label} kind="node" anchor={L.inLabel.anchor} fit />{/if}
  {/if}
  {#if exchange}
    <Node id={exchange.node.id} x={L.exchangeNode.x} y={L.exchangeNode.y} size={L.nodeSize} />
    {#if T.label}<Text x={L.exchangeLabel.x} y={L.exchangeLabel.y} text={nameOf(exchange)} size={T.label} kind="node" anchor={L.exchangeLabel.anchor} fit />{/if}
  {/if}
  {#if transitAside}
    <Node id={transitAside.hop.node.id} x={L.transitNode.x} y={L.transitNode.y} size={L.transitSize} />
    {#if T.label}<Text x={L.transitLabel.x} y={L.transitLabel.y} text={nameOf(transitAside.hop)} size={T.label} kind="node" anchor={L.transitLabel.anchor} fit />{/if}
  {/if}

  {#if T.link && inLink}<Text x={L.inTag.x} y={L.inTag.y} text={linkName(inLink.tech.id)} size={T.link} kind="link" colour={inLink.tech.colour} anchor={L.inTag.anchor} />{/if}
  {#if T.link && outLink}<Text x={L.exchangeTag.x} y={L.exchangeTag.y} text={linkName(outLink.tech.id)} size={T.link} kind="link" colour={outLink.tech.colour} anchor={L.exchangeTag.anchor} />{/if}
  {#if T.link && transitAside}<Text x={L.transitTag.x} y={L.transitTag.y} text={linkName(transitAside.link.tech.id)} size={T.link} kind="link" colour={transitAside.link.tech.colour} anchor={L.transitTag.anchor} />{/if}
</g>
