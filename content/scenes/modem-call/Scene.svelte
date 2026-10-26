<svelte:options namespace="svg" />
<script lang="ts">
  // A dial-up call: the computer's modem phones the internet company through the telephone exchange. Arriving plays
  // the handshake once (beeps, ring, the answer tone, the training screech) as waves on the line and words in a
  // speech bubble; with sound on, the modem's speaker plays it too, briefly. Cards: the handshake's steps, how slowly a
  // photo came in, and the phone being busy (simple) or the call's own timeslot on the trunk (technical). PPP has its own dive.
  import { untrack } from 'svelte';
  import { Node, Text, arrived, labelInk, legibleSize, nameOf, soundOut, strings, textBox, view, type LinkSubject } from '$core/api';
  import { toScene, trackMatrix } from '../copper-pulses/copper';
  import Card from '../copper-pulses/art/Card.svelte';
  import Slots from '../tdm-frames/art/Slots.svelte';
  import { LINE, NUMBER, PHOTO, SLOT, STEPS, dialled, handshake, photoIn, play, ripples, seconds, stepAt, type Ripple } from './modem';

  let { subject, time }: { subject: LinkSubject; time: number } = $props();
  const S = strings('scene.modem-call');
  const legible = legibleSize();
  const technical = $derived(S('mode') === 'technical');
  const o = $derived(view.orient);
  const portrait = $derived(o === 'portrait');
  const compact = $derived(o === 'landscape' && view.vp.h < 470);
  const fs = (size: number) => (compact ? legible(size) : size);

  // the call: the links around this one that carry the same envelope (PPP), from the computer's phone line through the
  // exchange's trunk to the ISP's modems
  const call = $derived.by(() => {
    const links = subject.route.links.filter((l) => !l.aside), proto = subject.link.stack[0];
    const same = (i: number) => links[i]?.stack[0] === proto;
    let a = links.findIndex((l) => l.id === subject.run[0].id), b = a;
    while (same(a - 1)) a--;
    while (same(b + 1)) b++;
    return links.slice(a, b + 1);
  });
  const ends = $derived({ from: subject.route.hops[call[0].from], to: subject.route.hops[call[call.length - 1].to] });
  const mids = $derived(call.slice(1).map((l, i) => ({ hop: subject.route.hops[l.from], x: LINE.x0 + ((LINE.x1 - LINE.x0) * (i + 1)) / call.length })));
  const midX = $derived(mids[0]?.x ?? (LINE.x0 + LINE.x1) / 2);

  // the handshake runs from the moment the reader arrives (or turns sound on here); seen from outside, it's online
  const arrival = arrived();
  const here = $derived(arrival());
  let since = $state(-1e6);
  $effect(() => {
    if (!here) return;
    const out = soundOut();
    untrack(() => (since = time));
    if (out) return play(out, handshake());
  });
  const s = $derived(view.still ? 4.2 : time - since);
  const t = $derived(view.still ? 2.4 : time);
  const step = $derived(stepAt(s));
  const stepIx = $derived(STEPS.findIndex((st) => st.id === step));
  const waves = $derived(ripples(s, t, midX));
  const shown = $derived(photoIn(s, view.still));
  const PAINT: Record<Ripple['tone'], string> = { call: 'var(--orange)', answer: 'var(--teal)', data: 'var(--berry)' };

  const trackShift = $derived(portrait || compact ? 0 : 110);
  const trackTransform = $derived(portrait ? trackMatrix(o) : `translate(0 ${trackShift})`);
  const at = (x: number) => toScene({ x, y: LINE.nodeY + trackShift }, o);
  const fromPos = $derived(at(LINE.fromX));
  const toPos = $derived(at(LINE.toX));

  type Box = { x: number; y: number; w: number; h: number };
  const L = $derived.by((): { size: number; mid: number; cards: [Box, Box, Box]; text: { head: number; row: number; body: number }; bubble: { x: number; y: number; size: number } } => {
    if (portrait) return {
      size: 170, mid: 140,
      cards: [{ x: 360, y: 170, w: 510, h: 380 }, { x: 360, y: 580, w: 510, h: 380 }, { x: 360, y: 990, w: 510, h: 380 }],
      text: { head: 34, row: 28, body: 26 }, bubble: { x: 370, y: 1460, size: 32 },
    };
    // a phone on its side: no title, the names in a row under the line, fewer and bigger words on the cards
    if (compact) return {
      size: 170, mid: 140,
      cards: [{ x: 40, y: 470, w: 490, h: 400 }, { x: 555, y: 470, w: 490, h: 400 }, { x: 1070, y: 470, w: 490, h: 400 }],
      text: { head: 44, row: 38, body: 40 }, bubble: { x: 260, y: 92, size: 40 },
    };
    return {
      size: 220, mid: 150,
      cards: [{ x: 70, y: 500, w: 460, h: 340 }, { x: 570, y: 500, w: 460, h: 340 }, { x: 1070, y: 500, w: 460, h: 340 }],
      text: { head: 30, row: 24, body: 24 }, bubble: { x: 270, y: 200, size: 30 },
    };
  });
  const A = $derived(L.cards[0]), B = $derived(L.cards[1]), C = $derived(L.cards[2]);
  const head = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + 42 });

  // the speech bubble: what the modem's speaker is saying right now
  const say = $derived(step === 'dial' ? S('say.dial').slice(0, Math.max(1, Math.round((S('say.dial').length * dialled(s)) / NUMBER.length))) : S(`say.${step}`));
  const bubbleW = $derived(textBox(say, L.bubble.size, 'start', 0.6, '--label-font').w + 44);
  const loud = $derived(step !== 'online');

  // the photo on the speed card
  const P = $derived.by(() => {
    const pad = compact ? 40 : 44;
    const y = B.y + (compact ? 84 : 82), h = B.h - (compact ? 84 + 80 : portrait ? 82 + 120 : 82 + 96);
    const w = Math.min(B.w - pad * 2, h * 1.5);
    return { x: B.x + (B.w - w) / 2, y, w, h };
  });
  const took = Math.round(seconds(PHOTO.kB, PHOTO.kbit));
</script>

{#if !portrait && !compact}<text x="800" y="130" text-anchor="middle" font-size="42" font-weight="900" stroke="var(--paper)" stroke-width="7" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('title')}</text>{/if}
<g transform={trackTransform}>
  <path d={`M${LINE.fromX + 100} ${LINE.nodeY} H${LINE.toX - 100}`} stroke="var(--line)" stroke-width="16" stroke-linecap="round" opacity="0.24" />
  <path d={`M${LINE.fromX + 100} ${LINE.nodeY} H${midX}`} stroke={subject.link.tech.colour} stroke-width="7" stroke-linecap="round" />
  <!-- past the exchange the call is a timeslot on a trunk: drawn doubled -->
  <path d={`M${midX} ${LINE.nodeY - 7} H${LINE.toX - 100} M${midX} ${LINE.nodeY + 7} H${LINE.toX - 100}`} stroke={call[call.length - 1].tech.colour} stroke-width="5" stroke-linecap="round" />
  {#each waves as w (w.key)}
    <g opacity={w.alpha}>
      <path d={w.d} fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.28" />
      <path d={w.d} fill="none" stroke={PAINT[w.tone]} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  {/each}
</g>
<Node id={ends.from.node.id} x={fromPos.x} y={fromPos.y} size={L.size} focused />
{#each mids as m (m.hop.id)}
  {@const p = at(m.x)}
  <Node id={m.hop.node.id} x={p.x} y={p.y} size={L.mid} />
{/each}
<Node id={ends.to.node.id} x={toPos.x} y={toPos.y} size={L.size} />

{#if portrait}
  {#each [{ h: ends.from, y: fromPos.y + 110 }, ...mids.map((m) => ({ h: m.hop, y: at(m.x).y + 100 })), { h: ends.to, y: toPos.y + 110 }] as n (n.h.id)}
    <text x="220" y={n.y} text-anchor="middle" font-size="28" font-weight="900" stroke="var(--paper)" stroke-width="6" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{nameOf(n.h)}</text>
  {/each}
{:else}
  <Text x={compact ? 30 : fromPos.x} y={compact ? 400 : fromPos.y + 145} text={nameOf(ends.from)} size={compact ? 42 : 25} kind="node" anchor={compact ? 'start' : 'middle'} fit />
  {#each mids as m (m.hop.id)}
    <Text x={m.x} y={compact ? 400 : at(m.x).y + 118} text={nameOf(m.hop)} size={compact ? 42 : 25} kind="node" anchor="middle" fit />
  {/each}
  <Text x={compact ? 1570 : toPos.x} y={compact ? 400 : toPos.y + 145} text={nameOf(ends.to)} size={compact ? 42 : 25} kind="node" anchor={compact ? 'end' : 'middle'} fit />
  {#if !compact}
    <!-- the two parts of the call: copper to the exchange, then the phone network -->
    {#each [{ x: (LINE.x0 + midX) / 2, key: 'loop' }, { x: (midX + LINE.x1) / 2, key: 'trunk' }] as seg (seg.key)}
      <text x={seg.x} y={LINE.nodeY + trackShift - 52} text-anchor="middle" font-family="var(--label-font)" font-size="24" font-weight="900" fill={labelInk(subject.link.tech.colour)} stroke="var(--paper)" stroke-width="6" paint-order="stroke">{S(`part.${seg.key}`)}</text>
    {/each}
  {/if}
{/if}

<!-- the modem's speaker: sound rings and a speech bubble -->
{#if loud && !view.still}
  {#each [0, 1, 2] as i (i)}
    {@const r = 30 + ((t * 60 + i * 26) % 78)}
    <path d={`M${fromPos.x + 40 + r * 0.7} ${fromPos.y - 40 - r * 0.7} a${r} ${r} 0 0 1 ${r * 0.3} ${r * 0.9}`} fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round" opacity={1 - (r - 30) / 78} />
  {/each}
{/if}
<g>
  <path d={`M${L.bubble.x + 24} ${L.bubble.y + 30} L${L.bubble.x - 4} ${L.bubble.y + 62} L${L.bubble.x + 52} ${L.bubble.y + 30} Z`} fill="var(--paper)" stroke="var(--line)" stroke-width="5" stroke-linejoin="round" />
  <rect x={L.bubble.x} y={L.bubble.y - L.bubble.size - 4} width={bubbleW} height={L.bubble.size * 2 - 4} rx="22" fill="var(--paper)" stroke="var(--line)" stroke-width="5" />
  <path d={`M${L.bubble.x + 27} ${L.bubble.y + 26} H${L.bubble.x + 49}`} stroke="var(--paper)" stroke-width="6" />
  <text x={L.bubble.x + 22} y={L.bubble.y + L.bubble.size * 0.32} font-size={L.bubble.size} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{say}</text>
</g>

<!-- the handshake, step by step -->
<Card x={A.x} y={A.y} w={A.w} h={A.h} tint="var(--orange)" />
<text x={head(A).x} y={head(A).y} text-anchor="middle" font-size={fs(L.text.head)} font-weight="900" stroke="var(--paper)" stroke-width="6" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('stepsTitle')}</text>
{#each STEPS as st, i (st.id)}
  {@const gap = (A.h - 96) / STEPS.length}
  {@const y = A.y + 84 + gap * i}
  {#if i === stepIx}<rect x={A.x + 22} {y} width={A.w - 44} height={gap - 6} rx="12" fill="none" stroke="var(--orange)" stroke-width="4" />{/if}
  <circle cx={A.x + 50} cy={y + gap / 2 - 3} r={fs(L.text.row) * 0.55} fill={i < stepIx ? 'var(--teal)' : 'var(--paper)'} fill-opacity={i < stepIx ? 0.4 : 1} stroke="var(--line)" stroke-width="3" />
  <text x={A.x + 50} y={y + gap / 2 - 3 + fs(L.text.row) * 0.33} text-anchor="middle" font-size={fs(L.text.row) * 0.8} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{i + 1}</text>
  <text x={A.x + 50 + fs(L.text.row) * 1.1} y={y + gap / 2 - 3 + fs(L.text.row) * 0.35} font-size={fs(L.text.row)} font-weight={i === stepIx ? 900 : 800} font-family="var(--label-font)" fill="var(--line)">{S(`step.${st.id}`)}</text>
{/each}

<!-- so slow: a photo arriving line by line at modem speed -->
<Card x={B.x} y={B.y} w={B.w} h={B.h} tint="var(--teal)" />
<text x={head(B).x} y={head(B).y} text-anchor="middle" font-size={fs(L.text.head)} font-weight="900" stroke="var(--paper)" stroke-width="6" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('slowTitle')}</text>
<rect x={P.x} y={P.y} width={P.w} height={P.h} fill="var(--sky)" />
<circle cx={P.x + P.w * 0.75} cy={P.y + P.h * 0.3} r={P.h * 0.14} fill="var(--sun)" stroke="var(--line)" stroke-width="3" />
<path d={`M${P.x} ${P.y + P.h * 0.72} Q${P.x + P.w * 0.3} ${P.y + P.h * 0.5} ${P.x + P.w * 0.6} ${P.y + P.h * 0.68} T${P.x + P.w} ${P.y + P.h * 0.62} V${P.y + P.h} H${P.x} Z`} fill="var(--grass-near)" stroke="var(--line)" stroke-width="3" />
<path d={`M${P.x + P.w * 0.2} ${P.y + P.h * 0.62} h${P.w * 0.16} v${-P.h * 0.16} l${-P.w * 0.08} ${-P.h * 0.12} l${-P.w * 0.08} ${P.h * 0.12} Z`} fill="var(--berry)" stroke="var(--line)" stroke-width="3" stroke-linejoin="round" />
{#if shown < 1}
  <rect x={P.x} y={P.y + P.h * shown} width={P.w} height={P.h * (1 - shown)} fill="var(--paper-2)" />
  <path d={`M${P.x} ${P.y + P.h * shown} H${P.x + P.w}`} stroke="var(--orange)" stroke-width="4" />
{/if}
<rect x={P.x} y={P.y} width={P.w} height={P.h} fill="none" stroke="var(--line)" stroke-width="5" rx="4" />
<text x={B.x + B.w / 2} y={B.y + B.h - (compact ? 30 : portrait ? 70 : 52)} text-anchor="middle" font-size={fs(L.text.body)} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{S('slowLine').replace('{s}', String(took))}</text>
{#if !compact}<text x={B.x + B.w / 2} y={B.y + B.h - (portrait ? 30 : 20)} text-anchor="middle" font-size={L.text.body - 2} font-weight="800" font-family="var(--label-font)" fill="var(--line)">{S('slowSub')}</text>{/if}

<Card x={C.x} y={C.y} w={C.w} h={C.h} tint="var(--berry)" />
{#if technical}
  <!-- the exchange gives the call its own timeslot on the trunk (an E1: 32 slots, 8000 times a second), held all call -->
  {@const cols = 8}
  {@const cell = Math.min((C.w - 80) / cols, (C.h - (compact ? 190 : 200)) / 4)}
  {@const gx = C.x + (C.w - cell * cols) / 2}
  <text x={head(C).x} y={head(C).y} text-anchor="middle" font-size={fs(L.text.head)} font-weight="900" stroke="var(--paper)" stroke-width="6" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('circuitTitle')}</text>
  <Slots x={gx} y={C.y + 82} {cell} {cols} fills={Array.from({ length: 32 }, (_, i) => (i === SLOT ? subject.link.tech.colour : 'var(--paper-2)'))} sweep={view.still ? -1 : Math.floor(t * 6) % 32} />
  <text x={C.x + C.w / 2} y={C.y + C.h - (compact ? 30 : 58)} text-anchor="middle" font-size={fs(L.text.body)} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{S('circuitLine').replace('{n}', String(SLOT))}</text>
  {#if !compact}<text x={C.x + C.w / 2} y={C.y + C.h - 22} text-anchor="middle" font-size={L.text.body - 2} font-weight="800" font-family="var(--label-font)" fill="var(--line)">{S('circuitSub')}</text>{/if}
{:else}
  <!-- the phone is busy while you're online -->
  {@const px = C.x + C.w / 2}
  {@const py = C.y + (compact ? 220 : portrait ? 200 : 180)}
  {@const k = compact ? 1.4 : 1.2}
  <text x={head(C).x} y={head(C).y} text-anchor="middle" font-size={fs(L.text.head)} font-weight="900" stroke="var(--paper)" stroke-width="6" paint-order="stroke" font-family="var(--label-font)" fill="var(--line)">{S('busyTitle')}</text>
  <g transform={`translate(${px} ${py}) scale(${k})`} stroke="var(--line)" stroke-width="5" stroke-linejoin="round">
    <path d="M-40 30 L-28 -16 H28 L40 30 Z" fill="var(--berry)" />
    <circle cx="0" cy="6" r="14" fill="var(--paper)" stroke-width="4" />
    <path d="M-46 -24 Q0 -44 46 -24 L40 -14 H-40 Z" fill="var(--berry)" />
  </g>
  {#if step === 'online' && !view.still}
    {#each [-1, 1] as side (side)}
      <text x={px + side * 95 * k} y={py - 10 + (Math.sin(t * 5) > 0 ? 0 : 6)} text-anchor="middle" font-size={fs(L.text.row)} font-weight="900" font-family="var(--label-font)" fill="var(--line)">{S('beep')}</text>
    {/each}
  {/if}
  <text x={C.x + C.w / 2} y={C.y + C.h - (compact ? 30 : 26)} text-anchor="middle" font-size={fs(L.text.body)} font-weight="800" font-family="var(--label-font)" fill="var(--line)">{S('busyLine')}</text>
{/if}
