<svelte:options namespace="svg" />
<script lang="ts">
  // A 1990s digital line (tdm.ts): frames of 8-bit timeslots, 8,000 a second each way, run along the wire between its
  // two ends. One card lays a frame out slot by slot (an ISDN PRI's callers, a leased E1's one pipe, a T1's 24 slots,
  // a GSM trunk's calls and SS7, the mast's line's calls in quarters); the other shows the bits as pulses on the copper,
  // ones alternating up and down.
  import { Node, Text, legibleSize, nameOf, strings, textBox, view, type LinkSubject } from '$core/api';
  import Card from '../copper-pulses/art/Card.svelte';
  import Slots from './art/Slots.svelte';
  import { lineCode, modeOf, pulsePath, quartersOf, slotsOf, train, type Kind, type Mode } from './tdm';

  let { subject, time }: { subject: LinkSubject; time: number } = $props();
  const S = strings('scene.tdm-frames');
  const legible = legibleSize();
  const technical = $derived(S('mode') === 'technical');
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(view.orient === 'landscape' && view.vp.h < 470);
  const fs = (size: number) => (compact ? legible(size) : size);

  const mode = $derived(modeOf(subject.link.tech.id));
  /** The line code's words: a PRI is an E1 too. */
  const line = $derived(mode === 't1' ? 't1' : 'e1');
  const colour = $derived(subject.link.tech.colour);
  const from = $derived(subject.route.hops[subject.run[0].from]);
  const to = $derived(subject.route.hops[subject.run[subject.run.length - 1].to]);
  const kinds = $derived(slotsOf(mode));
  const FILL: Record<Kind, string> = { sync: 'var(--sun)', signal: 'var(--teal)', yours: '', other: 'var(--sky)', idle: 'var(--paper-2)', pipe: '' };
  const fillOf = (k: Kind) => FILL[k] || colour;
  const fills = $derived(kinds.map(fillOf));
  const quarters = $derived(quartersOf(mode).map((q) => q && q.map(fillOf)));
  /** The signalling slot's letter on the grid: the D channel, SS7, the mast's LAPD. */
  const SIGNAL: Partial<Record<Mode, string>> = { trunk: 'S', abis: 'L' };
  /** The slots worth naming on the grid (technical): frame sync, the signalling, your call's slot. */
  const labels = $derived(technical ? kinds.map((k, i) => (k === 'sync' ? (mode === 't1' ? 'F' : '0') : k === 'signal' ? (SIGNAL[mode] ?? 'D') : k === 'yours' ? String(i) : '')) : []);
  /** The legend's words where a line names a slot its own way. */
  const KEY: Partial<Record<Mode, Partial<Record<Kind, string>>>> = {
    t1: { sync: 'fbit', pipe: 'pipeT1' },
    trunk: { signal: 'ss7', yours: 'circuit', other: 'circuits' },
    abis: { signal: 'lapd', yours: 'quarter', other: 'quarters' },
  };
  const legend = $derived([...new Set(kinds)].map((k) => ({ k, key: KEY[mode]?.[k] ?? k })));
  const cols = $derived(mode === 't1' ? 7 : 8);
  const rows = $derived(Math.ceil(kinds.length / cols));

  type Box = { x: number; y: number; w: number; h: number };
  const L = $derived.by((): { line: { x0: number; x1: number; y: number }; size: number; names: number; name: number; slot: number; cards: [Box, Box]; head: number; row: number; grid: number } => {
    if (portrait) return {
      line: { x0: 190, x1: 710, y: 250 }, size: 160, names: 390, name: 30, slot: 9,
      cards: [{ x: 50, y: 470, w: 800, h: 520 }, { x: 50, y: 1030, w: 800, h: 500 }], head: 36, row: 30, grid: 0.5,
    };
    if (compact) return {
      line: { x0: 260, x1: 1340, y: 160 }, size: 170, names: 310, name: 42, slot: 14,
      cards: [{ x: 40, y: 370, w: 745, h: 500 }, { x: 815, y: 370, w: 745, h: 500 }], head: 44, row: 34, grid: 0.4,
    };
    return {
      line: { x0: 260, x1: 1340, y: 250 }, size: 200, names: 385, name: 26, slot: 14,
      cards: [{ x: 90, y: 470, w: 690, h: 390 }, { x: 820, y: 470, w: 690, h: 390 }], head: 30, row: 24, grid: 0.5,
    };
  });
  const A = $derived(L.cards[0]), B = $derived(L.cards[1]);
  /** An end's name, under it but kept inside the frame (a long one on a phone: the trunk's "Telephone exchange"). */
  const nameX = (x: number, text: string) => {
    const half = textBox(text, legible(L.name), 'middle', 0.6, '--label-font').w / 2 + 8, w = portrait ? 900 : 1600;
    return Math.min(Math.max(x, A.x + half), w - A.x - half);
  };
  const t = $derived(view.still ? 1.5 : time);

  // the wire: one lane each way, frames running along it
  const wire = $derived({ x0: L.line.x0 + 110, x1: L.line.x1 - 110, up: L.line.y - 22, down: L.line.y + 22, h: portrait ? 22 : 28 });
  const SPEED = 70;
  const lanes = $derived([
    { y: wire.up, slots: train(t, mode, wire.x0, wire.x1, L.slot, L.slot * 2, SPEED, 1) },
    { y: wire.down, slots: train(t + 0.8, mode, wire.x0, wire.x1, L.slot, L.slot * 2, SPEED, -1) },
  ]);
  const slotW = (i: number) => (mode === 't1' && i === 0 ? L.slot / 3 : L.slot);
  /** The slot arriving at the far end now, bold on the grid. */
  const sweep = $derived(view.still ? -1 : lanes[0].slots.reduce((m, s) => (s.x > m.x ? s : m), { x: -Infinity, i: -1 }).i);

  // the frame card: the grid on the left, what each colour is on the right
  const cell = $derived(Math.min((A.w * L.grid) / cols, (A.h - 150) / rows));
  const legendX = $derived(A.x + 30 + cols * cell + 24);

  // the pulses card
  const code = $derived(lineCode(mode));
  const P = $derived({ x: B.x + 50, y: B.y + 84, w: B.w - 100, h: B.h - (compact ? 230 : 210) });
  const step = $derived(P.w / code.length);
  const beat = $derived(view.still ? -1 : Math.floor(t * 2.5) % code.length);
</script>

{#if !portrait && !compact}<text x="800" y="110" text-anchor="middle" font-size="42" font-weight="900" stroke="var(--paper)" stroke-width="7" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S(`${subject.link.tech.id}.title`)}</text>{/if}

<!-- the wire, one lane each way, with the frames running along it -->
{#each lanes as lane (lane.y)}
  <path d={`M${L.line.x0 + 90} ${lane.y} H${L.line.x1 - 90}`} stroke="var(--line)" stroke-width={wire.h + 12} stroke-linecap="round" opacity="0.18" />
  <path d={`M${L.line.x0 + 90} ${lane.y} H${L.line.x1 - 90}`} stroke={colour} stroke-width="5" stroke-linecap="round" />
  {#each lane.slots as s, k (k)}
    <rect x={s.x + 1} y={lane.y - wire.h / 2} width={slotW(s.i) - 2} height={wire.h} rx="3" fill={fills[s.i]} stroke="var(--line)" stroke-width="1.5" />
  {/each}
{/each}
<Node id={from.node.id} x={L.line.x0} y={L.line.y} size={L.size} />
<Node id={to.node.id} x={L.line.x1} y={L.line.y} size={L.size} />
<Text x={nameX(L.line.x0, nameOf(from))} y={L.names} text={nameOf(from)} size={L.name} kind="node" />
<Text x={nameX(L.line.x1, nameOf(to))} y={L.names} text={nameOf(to)} size={L.name} kind="node" />
<!-- the line's name; on a phone higher, clear of the mast, the tallest end -->
{#if !compact}<Text x={(L.line.x0 + L.line.x1) / 2} y={L.line.y - (portrait ? 105 : 62)} text={S('wire')} size={L.name} kind="big" />{/if}

<!-- one frame, slot by slot -->
<Card x={A.x} y={A.y} w={A.w} h={A.h} tint="var(--sun)" />
<text x={A.x + A.w / 2} y={A.y + 42} text-anchor="middle" font-size={fs(L.head)} font-weight="900" stroke="var(--paper)" stroke-width="6" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('frameTitle')}</text>
<Slots x={A.x + 30} y={A.y + 66} {cell} {cols} {fills} {quarters} {labels} {sweep} size={cell * 0.42} />
{#each legend as l, i (l.k)}
  {@const r = fs(L.row)}
  {@const y = A.y + 84 + i * r * 1.7}
  <rect x={legendX} y={y - r * 0.5} width={r} height={r} rx="4" fill={fillOf(l.k)} stroke="var(--line)" stroke-width="2" />
  <text x={legendX + r * 1.4} y={y + r * 0.35} font-size={r} font-weight="800" font-family="var(--label-font)" fill="var(--line)">{S(`legend.${l.key}`)}</text>
{/each}
<!-- short landscape: no room for the cards' footers (the caption says it) -->
{#if !compact}<text x={A.x + A.w / 2} y={A.y + A.h - 28} text-anchor="middle" font-size={L.row} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{S(`sum.${line}`)}</text>{/if}

<!-- the bits on the copper: pulses up and down -->
<Card x={B.x} y={B.y} w={B.w} h={B.h} tint="var(--berry)" />
<text x={B.x + B.w / 2} y={B.y + 42} text-anchor="middle" font-size={fs(L.head)} font-weight="900" stroke="var(--paper)" stroke-width="6" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S(`code.${line}.title`)}</text>
{#if beat >= 0}<rect x={P.x + beat * step} y={P.y - 6} width={step} height={P.h + 12} rx="8" fill="var(--sun)" opacity="0.35" />{/if}
<path d={`M${P.x} ${P.y + P.h / 2} H${P.x + P.w}`} stroke="var(--line)" stroke-width="2" opacity="0.3" />
<path d={pulsePath(code, P.x, P.y, P.w, P.h)} fill="none" stroke="var(--line)" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" opacity="0.26" />
<path d={pulsePath(code, P.x, P.y, P.w, P.h)} fill="none" stroke={colour} stroke-width="7" stroke-linejoin="round" stroke-linecap="round" />
{#each code as c, i (i)}
  <text x={P.x + (i + 0.45) * step} y={P.y + P.h + fs(L.row) * 1.3} text-anchor="middle" font-size={fs(L.row)} font-weight="900" font-family="var(--tag-font)" fill="var(--line)">{c.bit}</text>
  {#if c.v && technical}<text x={P.x + (i + 0.45) * step} y={P.y + P.h / 2 - (c.level * P.h) / 2 - 10} text-anchor="middle" font-size={fs(L.row)} font-weight="900" font-family="var(--tag-font)" fill="var(--line)">V</text>{/if}
{/each}
{#if !compact}<text x={B.x + B.w / 2} y={B.y + B.h - 28} text-anchor="middle" font-size={L.row} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{S(`code.${line}.line`)}</text>{/if}
