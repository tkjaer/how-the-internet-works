<svelte:options namespace="svg" />
<script lang="ts">
  // ATM on a 1990s backbone (atm.ts): the router cuts your packet into 53-byte cells, each with a 5-byte label in front.
  // On the line, the cells stream through an ATM switch that reads only the label and swaps it for the next one; the
  // router at the far end glues the pieces back together. Cards: the packet cut into cells, and one cell's bytes.
  import { Node, Text, legibleSize, nameOf, strings, view, type LayerSubject } from '$core/api';
  import Card from '../copper-pulses/art/Card.svelte';
  import { CELL, HEADER, PACKET, PAYLOAD, cellsFor, cellsOnLine, lineBytes, overhead } from './atm';

  let { subject, time }: { subject: LayerSubject; time: number } = $props();
  const S = strings('scene.atm-cells');
  const legible = legibleSize();
  const technical = $derived(subject.ctx.level === 'technical');
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(view.orient === 'landscape' && view.vp.h < 470);
  const fs = (size: number) => (compact ? legible(size) : size);

  const link = $derived(subject.ctx.link);
  const from = $derived(subject.route.hops[link.from]);
  const to = $derived(subject.route.hops[link.to]);
  const colour = $derived(link.tech.colour);
  /** Made-up circuit labels (VPI/VCI) either side of the switch: each switch swaps the label for the next one. */
  const IN = '1/112', OUT = '1/87';

  type Box = { x: number; y: number; w: number; h: number };
  const L = $derived.by((): { line: { x0: number; x1: number; y: number }; size: number; names: number; name: number; cell: number; cards: [Box, Box]; head: number; row: number } => {
    if (portrait) return {
      line: { x0: 190, x1: 710, y: 250 }, size: 150, names: 390, name: 30, cell: 34,
      cards: [{ x: 50, y: 470, w: 800, h: 520 }, { x: 50, y: 1030, w: 800, h: 500 }], head: 36, row: 30,
    };
    if (compact) return {
      line: { x0: 260, x1: 1340, y: 160 }, size: 170, names: 310, name: 42, cell: 40,
      cards: [{ x: 40, y: 370, w: 745, h: 500 }, { x: 815, y: 370, w: 745, h: 500 }], head: 44, row: 34,
    };
    return {
      line: { x0: 260, x1: 1340, y: 250 }, size: 200, names: 385, name: 26, cell: 40,
      cards: [{ x: 90, y: 470, w: 690, h: 390 }, { x: 820, y: 470, w: 690, h: 390 }], head: 30, row: 24,
    };
  });
  const A = $derived(L.cards[0]), B = $derived(L.cards[1]);
  const t = $derived(view.still ? 1.2 : time);
  /** Room for a card's footer line; a short landscape screen has none, so the footers go (like the title). */
  const foot = $derived(compact ? 24 : 70);

  // the line: cells streaming through the switch in the middle
  const mid = $derived((L.line.x0 + L.line.x1) / 2);
  const wire = $derived({ x0: L.line.x0 + 110, x1: L.line.x1 - 110 });
  const cells = $derived(cellsOnLine(t, wire.x0, wire.x1, mid, L.cell, L.cell * 1.6, 80).filter((c) => Math.abs(c.x + L.cell / 2 - mid) > 60));
  const head = $derived(L.cell * 0.3);

  // the packet, cut up
  const n = cellsFor(PACKET);
  const cols = 8;
  const rows = Math.ceil(n / cols);
  const grid = $derived.by(() => {
    const top = A.y + 140, h = A.h - 140 - foot, w = A.w - 80, cell = Math.min(w / cols, h / rows);
    return { x: A.x + (A.w - cell * cols) / 2, y: top, cell };
  });
  const sweep = $derived(view.still ? -1 : Math.floor(t * 4) % n);
  const sum = $derived(S('cutLine').replace('{n}', String(n)).replace('{bytes}', String(lineBytes(PACKET))).replace('{pct}', String(Math.round(overhead(PACKET) * 100))));

  // one cell, byte by byte
  const bar = $derived({ x: B.x + 40, y: B.y + 84, w: B.w - 80, h: compact ? 60 : 54 });
  const headW = $derived((bar.w * HEADER) / CELL);
  const FIELDS = ['label', 'type', 'check', 'payload'] as const;
</script>

{#if !portrait && !compact}<text x="800" y="110" text-anchor="middle" font-size="42" font-weight="900" stroke="var(--paper)" stroke-width="7" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('title')}</text>{/if}

<!-- the line, with an ATM switch in the middle swapping each cell's label -->
<path d={`M${L.line.x0 + 90} ${L.line.y} H${L.line.x1 - 90}`} stroke="var(--line)" stroke-width="18" stroke-linecap="round" opacity="0.2" />
<path d={`M${L.line.x0 + 90} ${L.line.y} H${L.line.x1 - 90}`} stroke={colour} stroke-width="8" stroke-linecap="round" />
{#each cells as c (c.n)}
  <g transform={`translate(${c.x} ${L.line.y - L.cell / 2})`} stroke="var(--line)" stroke-width="3" stroke-linejoin="round">
    <rect width={L.cell} height={L.cell} rx="5" fill="var(--paper)" />
    <rect width={head} height={L.cell} rx="5" fill={c.swapped ? 'var(--teal)' : 'var(--orange)'} />
  </g>
{/each}
<g transform={`translate(${mid} ${L.line.y})`} stroke="var(--line)" stroke-width="5" stroke-linejoin="round">
  <rect x="-54" y="-44" width="108" height="88" rx="12" fill="var(--dev-body)" />
  <path d="M-34 -14 H22 M12 -24 L22 -14 L12 -4 M34 14 H-22 M-12 4 L-22 14 L-12 24" fill="none" stroke-width="5" stroke-linecap="round" />
</g>
<Text x={mid} y={L.line.y + 80} text={S('switch')} size={L.name} kind="node" />
{#if technical && !compact}
  <Text x={(wire.x0 + mid) / 2} y={L.line.y - 54} text={IN} size={L.name} kind="big" />
  <Text x={(mid + wire.x1) / 2} y={L.line.y - 54} text={OUT} size={L.name} kind="big" />
{/if}
<Node id={from.node.id} x={L.line.x0} y={L.line.y} size={L.size} focused={subject.ctx.to.id === from.id} />
<Node id={to.node.id} x={L.line.x1} y={L.line.y} size={L.size} focused={subject.ctx.to.id === to.id} />
<Text x={L.line.x0} y={L.names} text={nameOf(from)} size={L.name} kind="node" fit />
<Text x={L.line.x1} y={L.names} text={nameOf(to)} size={L.name} kind="node" fit />

<!-- your packet, cut into cells -->
<Card x={A.x} y={A.y} w={A.w} h={A.h} tint="var(--orange)" />
<text x={A.x + A.w / 2} y={A.y + 42} text-anchor="middle" font-size={fs(L.head)} font-weight="900" stroke="var(--paper)" stroke-width="6" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('cutTitle')}</text>
<rect x={A.x + 40} y={A.y + 78} width={A.w - 80} height={40} rx="8" fill="var(--sun)" stroke="var(--line)" stroke-width="3" />
<text x={A.x + A.w / 2} y={A.y + 98 + fs(L.row) * 0.35} text-anchor="middle" font-size={fs(L.row)} font-weight="900" stroke="var(--paper)" stroke-width="5" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('packet').replace('{bytes}', String(PACKET))}</text>
{#each Array.from({ length: n }, (_, i) => i) as i (i)}
  {@const c = grid.cell}
  {@const x = grid.x + (i % cols) * c}
  {@const y = grid.y + Math.floor(i / cols) * c}
  <rect x={x + 3} y={y + 3} width={c - 6} height={c - 6} rx="5" fill={i === n - 1 ? 'var(--berry)' : 'var(--paper-2)'} stroke="var(--line)" stroke-width={i === sweep ? 6 : 2} />
  <rect x={x + 3} y={y + 3} width={(c - 6) * 0.3} height={c - 6} rx="5" fill="var(--orange)" stroke="var(--line)" stroke-width="2" />
{/each}
{#if !compact}<text x={A.x + A.w / 2} y={A.y + A.h - 28} text-anchor="middle" font-size={fs(L.row)} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{sum}</text>{/if}

<!-- one cell -->
<Card x={B.x} y={B.y} w={B.w} h={B.h} tint="var(--teal)" />
<text x={B.x + B.w / 2} y={B.y + 42} text-anchor="middle" font-size={fs(L.head)} font-weight="900" stroke="var(--paper)" stroke-width="6" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('cellTitle')}</text>
<rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} rx="8" fill="var(--paper-2)" stroke="var(--line)" stroke-width="3" />
<rect x={bar.x} y={bar.y} width={headW} height={bar.h} rx="8" fill="var(--orange)" stroke="var(--line)" stroke-width="3" />
<text x={bar.x + headW + 16} y={bar.y + bar.h / 2 + fs(L.row) * 0.35} font-size={fs(L.row)} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{S('cellBytes').replace('{head}', String(HEADER)).replace('{body}', String(PAYLOAD))}</text>
{#each FIELDS as f, i (f)}
  {@const r = fs(L.row)}
  {@const gap = (B.h - bar.h - 84 - foot) / FIELDS.length}
  {@const y = bar.y + bar.h + 20 + gap * i + gap / 2}
  <rect x={B.x + 40} y={y - r * 0.55} width={r * 1.1} height={r * 1.1} rx="4" fill={f === 'payload' ? 'var(--paper-2)' : 'var(--orange)'} stroke="var(--line)" stroke-width="2" />
  <text x={B.x + 40 + r * 1.6} y={y + r * 0.35} font-size={r} font-weight="800" font-family="var(--label-font)" fill="var(--line)">{S(`field.${f}`)}</text>
{/each}
{#if !compact}<text x={B.x + B.w / 2} y={B.y + B.h - 28} text-anchor="middle" font-size={fs(L.row)} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{S('cellLine')}</text>{/if}
