<svelte:options namespace="svg" />
<script lang="ts">
  // The phone line between a home's DSL modem and the DSLAM in the street cabinet: one thin twisted pair carrying a
  // slow phone-call wave and many small tones both ways. Cards: lanes by pitch (bits per tone), speed against line
  // length with this line marked, and (technical) crosstalk from the neighbours' pairs.
  import { Node, Text, labelInk, legibleSize, nameOf, strings, view, type LinkSubject } from '$core/api';
  import { toScene, trackMatrix } from '../copper-pulses/copper';
  import Card from '../copper-pulses/art/Card.svelte';
  import { LINE, MAX_KM, MAX_MBIT, bandSpans, lineTones, pitchX, speedAt, speedPath, toneBars, wirePath, type Band } from './tones';

  let { subject, time }: { subject: LinkSubject; time: number } = $props();
  const S = strings('scene.dsl-tones');
  const legible = legibleSize();
  const technical = $derived(S('mode') === 'technical');
  const o = $derived(view.orient);
  const portrait = $derived(o === 'portrait');
  const compact = $derived(o === 'landscape' && view.vp.h < 470);
  const fs = (size: number) => (compact ? legible(size) : size);
  const PAINT: Record<Band, string> = { voice: 'var(--orange)', up: 'var(--berry)', down: 'var(--teal)' };
  const INK: Record<Band, string> = { voice: 'var(--line)', up: 'var(--berry-ink)', down: 'var(--teal-ink)' };
  const WIRES = [wirePath(0), wirePath(1)];

  const km = $derived(subject.link.km ?? 0.4);
  const fromHop = $derived(subject.route.hops[subject.link.from]);
  const toHop = $derived(subject.route.hops[subject.link.to]);
  const trackShift = $derived(portrait || compact ? 0 : 110);
  const trackTransform = $derived(portrait ? trackMatrix(o) : `translate(0 ${trackShift})`);
  const fromPos = $derived(toScene({ x: LINE.fromX, y: LINE.nodeY + trackShift }, o));
  const toPos = $derived(toScene({ x: LINE.toX, y: LINE.nodeY + trackShift }, o));
  const tones = $derived(lineTones(time, view.still));
  const spans = $derived(bandSpans(technical));
  const bars = $derived(toneBars(spans, km, time, view.still, technical ? 0.016 : 0.024));
  const mbit = $derived(Math.round(speedAt(km) / 5) * 5);

  type Box = { x: number; y: number; w: number; h: number };
  const L = $derived.by((): { node: { size: number; from: { x: number; y: number }; to: { x: number; y: number } }; bands: Box; dist: Box; xtalk: Box; text: { title: number; head: number; body: number; tick: number } } => {
    if (portrait) return {
      node: { size: 170, from: { x: 220, y: 1570 }, to: { x: 220, y: 280 } },
      bands: technical ? { x: 330, y: 250, w: 540, h: 400 } : { x: 330, y: 330, w: 540, h: 440 },
      dist: technical ? { x: 330, y: 690, w: 540, h: 340 } : { x: 330, y: 830, w: 540, h: 440 },
      xtalk: { x: 330, y: 1070, w: 540, h: 340 },
      text: { title: 40, head: 34, body: 28, tick: 22 },
    };
    // a phone on its side: no title, the names in a row under the line, fewer and bigger words on the cards
    if (compact) return {
      node: { size: 170, from: { x: 30, y: 400 }, to: { x: 1570, y: 400 } },
      bands: technical ? { x: 70, y: 470, w: 460, h: 300 } : { x: 150, y: 450, w: 620, h: 410 },
      dist: technical ? { x: 570, y: 470, w: 460, h: 300 } : { x: 830, y: 450, w: 620, h: 410 },
      xtalk: { x: 1070, y: 470, w: 460, h: 300 },
      text: { title: 38, head: 44, body: 44, tick: 40 },
    };
    return {
      node: { size: 220, from: { x: fromPos.x + 60, y: fromPos.y + 145 }, to: { x: toPos.x - 40, y: toPos.y + 145 } },
      bands: technical ? { x: 70, y: 500, w: 560, h: 330 } : { x: 180, y: 500, w: 600, h: 330 },
      dist: technical ? { x: 660, y: 500, w: 420, h: 330 } : { x: 840, y: 500, w: 580, h: 330 },
      xtalk: { x: 1110, y: 500, w: 420, h: 330 },
      text: { title: 42, head: 30, body: 24, tick: 20 },
    };
  });

  // the lanes chart inside the bands card
  const C = $derived.by(() => {
    const B = L.bands, x0 = B.x + 40, x1 = B.x + B.w - 40;
    const base = B.y + B.h - (compact ? 70 : portrait ? 110 : 96), top = B.y + (compact ? 120 : 108);
    return { x0, w: x1 - x0, base, top, max: base - top - 8 };
  });
  const voice = $derived(spans.find((s) => s.band === 'voice')!);
  const humpD = $derived.by(() => {
    const a = C.x0 + voice.x0 * C.w, b = C.x0 + voice.x1 * C.w, h = C.max * 0.55;
    return `M${a} ${C.base} C${a + (b - a) * 0.3} ${C.base - h} ${a + (b - a) * 0.7} ${C.base - h} ${b} ${C.base} Z`;
  });
  const TICKS = [
    { key: 'tick.low', x: pitchX(138e3), anchor: 'middle' },
    { key: 'tick.mid', x: pitchX(3.75e6), anchor: 'middle' },
    { key: 'tick.top', x: 1, anchor: 'end' },
  ] as const;

  // the speed chart inside the distance card
  const G = $derived.by(() => {
    const D = L.dist, x0 = D.x + (compact ? 40 : 76), x1 = D.x + D.w - 40;
    const y0 = D.y + (compact ? 100 : 112), y1 = D.y + D.h - (compact ? 70 : portrait ? 110 : 96);
    return { x0, y0, w: x1 - x0, h: y1 - y0 };
  });
  const speedD = $derived(speedPath(G.x0, G.y0, G.w, G.h));
  const you = $derived({ x: G.x0 + (G.w * Math.min(km, MAX_KM)) / MAX_KM, y: G.y0 + G.h - (G.h * speedAt(km)) / MAX_MBIT });

  const head = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + 42 });
  const xtalkWire = (b: Box, y: number, phase: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = b.x + 40 + ((b.w - 80) * i) / 40;
      pts.push(`${x.toFixed(1)},${(y + Math.sin(i * 0.9 + phase) * 7).toFixed(1)}`);
    }
    return 'M' + pts.join(' ');
  };
</script>

{#if !portrait && !compact}<text x="800" y="130" text-anchor="middle" font-family="var(--label-font)" font-size={L.text.title} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="7" paint-order="stroke">{S('title')}</text>{/if}
<g transform={trackTransform}>
  <path d={`M${LINE.fromX + 100} ${LINE.nodeY} H${LINE.x0 + 20} M${LINE.x1 - 20} ${LINE.nodeY} H${LINE.toX - 100}`} stroke="var(--line)" stroke-width="22" stroke-linecap="round" opacity="0.2" />
  <path d={WIRES[0]} fill="none" stroke="var(--line)" stroke-width="13" stroke-linecap="round" opacity="0.24" />
  <path d={WIRES[0]} fill="none" stroke={subject.link.tech.colour} stroke-width="8" stroke-linecap="round" />
  <path d={WIRES[1]} fill="none" stroke="var(--paper)" stroke-width="10" stroke-linecap="round" />
  <path d={WIRES[1]} fill="none" stroke={subject.link.tech.colour} stroke-width="5" stroke-linecap="round" stroke-dasharray="22 30" />
  {#each tones as t (t.key)}
    <g opacity={t.alpha}>
      <path d={t.d} fill="none" stroke="var(--line)" stroke-width={t.band === 'voice' ? 11 : 9} stroke-linecap="round" stroke-linejoin="round" opacity="0.28" />
      <path d={t.d} fill="none" stroke={PAINT[t.band]} stroke-width={t.band === 'voice' ? 6 : 5} stroke-linecap="round" stroke-linejoin="round" />
    </g>
  {/each}
</g>
<Node id={fromHop.node.id} x={fromPos.x} y={fromPos.y} size={L.node.size} focused />
<Node id={toHop.node.id} x={toPos.x} y={toPos.y} size={L.node.size} />
{#if portrait}
  <text x={L.node.to.x} y={L.node.to.y} text-anchor="middle" font-family="var(--label-font)" font-size="30" font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" paint-order="stroke">{nameOf(toHop)}</text>
  <text x={L.node.from.x} y={L.node.from.y} text-anchor="middle" font-family="var(--label-font)" font-size="30" font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" paint-order="stroke">{nameOf(fromHop)}</text>
{:else}
  <Text x={L.node.from.x} y={L.node.from.y} text={nameOf(fromHop)} size={compact ? 42 : 25} kind="node" anchor={compact ? 'start' : 'middle'} fit />
  <Text x={L.node.to.x} y={L.node.to.y} text={nameOf(toHop)} size={compact ? 42 : 25} kind="node" anchor={compact ? 'end' : 'middle'} fit />
  {#if !compact}
    <text x="800" y="420" text-anchor="middle" font-family="var(--label-font)" font-size="26" font-weight="900" fill={labelInk(subject.link.tech.colour)} stroke="var(--paper)" stroke-width="6" paint-order="stroke">{S('lineLabel')}</text>
    <text x="800" y="456" text-anchor="middle" font-family="var(--label-font)" font-size="22" font-weight="800" fill="var(--line)" stroke="var(--paper)" stroke-width="6" paint-order="stroke">{S('lineSub')}</text>
  {/if}
{/if}

<!-- lanes by pitch: talk low, internet tones higher up, each bar a tone and its height the bits it carries -->
<Card x={L.bands.x} y={L.bands.y} w={L.bands.w} h={L.bands.h} tint="var(--berry)" />
<text x={head(L.bands).x} y={head(L.bands).y} text-anchor="middle" font-family="var(--label-font)" font-size={fs(L.text.head)} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" paint-order="stroke">{S('bandsTitle')}</text>
{#each spans as s, i (i)}
  <rect x={C.x0 + s.x0 * C.w} y={C.top} width={(s.x1 - s.x0) * C.w} height={C.base - C.top} fill={PAINT[s.band]} opacity="0.16" />
  {#if s.band !== 'voice' || !technical}
    <text x={C.x0 + ((s.x0 + s.x1) / 2) * C.w} y={C.top - 12} text-anchor="middle" font-family="var(--label-font)" font-size={fs(L.text.tick + 2)} font-weight="900" fill={INK[s.band]}>{S(`band.${s.band}`)}</text>
  {/if}
{/each}
<path d={humpD} fill={PAINT.voice} stroke="var(--line)" stroke-width="3" />
{#each bars as b (b.key)}
  {@const h = (C.max * b.bits) / 15}
  <rect x={C.x0 + b.x * C.w - 3} y={C.base - h} width="6" height={h} rx="2" fill={PAINT[b.band]} stroke="var(--line)" stroke-width="1.5" />
{/each}
<path d={`M${C.x0} ${C.base} H${C.x0 + C.w}`} stroke="var(--line)" stroke-width="4" stroke-linecap="round" />
{#if technical}
  {#each TICKS as t (t.key)}
    {#if !compact || t.key === 'tick.top'}<text x={C.x0 + t.x * C.w} y={C.base + L.text.tick + 8} text-anchor={t.anchor} font-family="var(--tag-font)" font-size={fs(L.text.tick)} font-weight="800" fill="var(--line)">{S(t.key)}</text>{/if}
  {/each}
{:else}
  <text x={C.x0} y={C.base + L.text.tick + 10} font-family="var(--label-font)" font-size={fs(L.text.tick + 2)} font-weight="800" fill="var(--line)">{S('lowNotes')}</text>
  <text x={C.x0 + C.w} y={C.base + L.text.tick + 10} text-anchor="end" font-family="var(--label-font)" font-size={fs(L.text.tick + 2)} font-weight="800" fill="var(--line)">{S('highNotes')}</text>
{/if}
{#if !compact}<text x={L.bands.x + 34} y={L.bands.y + L.bands.h - 26} font-family="var(--label-font)" font-size={L.text.body} font-weight="800" fill="var(--line)">{S('bandsLine')}</text>{/if}

<!-- speed against line length, this line marked -->
<Card x={L.dist.x} y={L.dist.y} w={L.dist.w} h={L.dist.h} tint="var(--teal)" />
<text x={head(L.dist).x} y={head(L.dist).y} text-anchor="middle" font-family="var(--label-font)" font-size={fs(L.text.head)} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" paint-order="stroke">{S('distTitle')}</text>
<path d={`M${G.x0} ${G.y0 - 10} V${G.y0 + G.h} H${G.x0 + G.w}`} fill="none" stroke="var(--line)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
{#if !compact}
  <text x={G.x0} y={G.y0 - 16} text-anchor="middle" font-family="var(--tag-font)" font-size={L.text.tick} font-weight="800" fill="var(--line)">{S('fast')}</text>
{/if}
<text x={G.x0} y={G.y0 + G.h + L.text.tick + 8} text-anchor="middle" font-family="var(--tag-font)" font-size={fs(L.text.tick)} font-weight="800" fill="var(--line)">0</text>
<text x={G.x0 + (G.w * 2) / MAX_KM} y={G.y0 + G.h + L.text.tick + 8} text-anchor="middle" font-family="var(--tag-font)" font-size={fs(L.text.tick)} font-weight="800" fill="var(--line)">{S('twoKm')}</text>
<path d={speedD} fill="none" stroke="var(--line)" stroke-width="13" stroke-linecap="round" opacity="0.26" />
<path d={speedD} fill="none" stroke="var(--blue)" stroke-width="7" stroke-linecap="round" />
<path d={`M${you.x} ${you.y} V${G.y0 + G.h}`} stroke="var(--line)" stroke-width="3" stroke-dasharray="6 7" />
<circle cx={you.x} cy={you.y} r="13" fill="var(--sun)" stroke="var(--face)" stroke-width="4" />
<text x={you.x + 22} y={you.y - 16} font-family="var(--label-font)" font-size={fs(L.text.tick + 4)} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" paint-order="stroke">{S('you').replace('{n}', String(mbit))}</text>
{#if !compact}<text x={L.dist.x + 34} y={L.dist.y + L.dist.h - 26} font-family="var(--label-font)" font-size={L.text.body} font-weight="800" fill="var(--line)">{S('distLine').replace('{m}', String(Math.round(km * 1000)))}</text>{/if}

{#if technical}
  <!-- crosstalk: the neighbours' pairs in the same cable leak into this one (vectoring, which cancels it, came in 2012) -->
  {@const V = L.xtalk}
  {@const ys = [V.y + (compact ? 120 : 110), V.y + (compact ? 175 : 160), V.y + (compact ? 230 : 210)]}
  <Card x={V.x} y={V.y} w={V.w} h={V.h} tint="var(--blue)" />
  <text x={head(V).x} y={head(V).y} text-anchor="middle" font-family="var(--label-font)" font-size={fs(L.text.head)} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" paint-order="stroke">{S('xtalkTitle')}</text>
  {#each ys as y, i (i)}
    <path d={xtalkWire(V, y, i * 1.4)} fill="none" stroke={i === 1 ? subject.link.tech.colour : 'var(--line)'} stroke-width={i === 1 ? 7 : 5} stroke-linecap="round" opacity={i === 1 ? 1 : 0.45} />
  {/each}
  {#each [0, 2] as i (i)}
    {@const x = V.x + V.w * 0.62}
    {@const y0 = ys[i] + (i === 0 ? 10 : -10)}
    {@const y1 = ys[1] + (i === 0 ? -12 : 12)}
    <path d={`M${x} ${y0} L${x + 10} ${(y0 + y1) / 2 - 4} L${x - 6} ${(y0 + y1) / 2 + 4} L${x + 4} ${y1}`} fill="none" stroke="var(--orange)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  {/each}
  {#if !compact}<text x={V.x + 34} y={V.y + V.h - 26} font-family="var(--label-font)" font-size={L.text.body} font-weight="800" fill="var(--line)">{S('xtalkLine')}</text>{/if}
{/if}
