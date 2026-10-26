<svelte:options namespace="svg" />
<script lang="ts">
  // XGS-PON as a layer frame, not as light: a shared paper road where downstream envelopes are heard by every house
  // and upstream bursts fit into OLT-granted time slots.
  import { Node, TagAt, Text, fill, nameOf, strings, view, type LayerSubject } from '$core/api';
  import Card from './art/Card.svelte';
  import FrameEnvelope from './art/FrameEnvelope.svelte';
  import House from './art/House.svelte';
  import { layoutFor, sceneState, slotX } from './gpon';

  let { subject, time }: { subject: LayerSubject; time: number } = $props();
  const S = strings('scene.gpon-slots');
  const L = $derived(layoutFor(view.orient, view.vp));
  const T = $derived(L.size);
  const technical = $derived(subject.ctx.level === 'technical');
  const compact = $derived(!!L.compact);
  const portrait = $derived(view.orient === 'portrait');
  const st = $derived(sceneState(view.still ? 3.1 : time));
  const activeTurns = $derived(subject.ctx.role === 'bridge');
  const c0 = $derived(L.cards[0]);
  const c1 = $derived(L.cards[1]);
  const namesY = $derived(L.names);
  const tagTexts = $derived(
    compact
      ? []
      : technical
        ? (portrait ? [] : [S('tag.down'), S('tag.up')])
        : [S('label.keeps'), S('label.yourTurn')]
  );
  const houseNumbers = ['884', '231', '1127', '640'];
  // the XGEM header, one row a field (the Port-ID row lit)
  const fieldRows = $derived([
    fill(S('field.pli'), { value: '424' }),
    S('field.keyidx'),
    S(technical ? 'field.portTechnical' : 'field.portSimple'),
    S('field.optlf'),
    fill(S('field.hec'), { value: '0x1c2' }),
  ]);
  const portRow = 2;
  const slotLabels = $derived(technical ? ['0x21', '0x8A', '0x467', '0x133'] : ['1', '2', '3', '4']);
  const yourSlot = 2;
  const mix = (a: number, b: number, k: number) => a + (b - a) * k;
  const down = $derived.by(() => {
    const fieldW = technical && !compact && !portrait ? Math.min(270, c0.w * 0.42) : 0;
    const x0 = c0.x + (fieldW ? fieldW + 50 : compact ? 42 : 52);
    const w = c0.w - (fieldW ? fieldW + 82 : compact ? 84 : 104);
    const olt = { x: x0 + w / 2, y: c0.y + (portrait ? 145 : compact ? 118 : 118) };
    const splitter = { x: x0 + w / 2, y: c0.y + (portrait ? 280 : compact ? 218 : 218) };
    const houseY = c0.y + c0.h - (portrait ? 110 : compact ? 78 : 92);
    const houseSize = portrait ? 76 : compact ? 48 : 60;
    const houses = [0, 1, 2, 3].map((i) => ({
      x: x0 + (w * (i + 0.5)) / 4,
      y: houseY,
      size: i === 2 ? houseSize * 1.08 : houseSize,
    }));
    return { fieldW, x0, w, olt, splitter, houses, houseSize };
  });
  const up = $derived.by(() => {
    const strip = {
      x: c1.x + (portrait ? 54 : compact ? 58 : 64),
      y: c1.y + (portrait ? 190 : compact ? 168 : 150),
      w: c1.w - (portrait ? 108 : compact ? 116 : 128),
      h: portrait ? 108 : compact ? 92 : 88,
    };
    const grant = {
      x: c1.x + (portrait ? 70 : compact ? 78 : 82),
      y: c1.y + c1.h - (portrait ? 78 : compact ? 58 : 64),
      w: portrait ? 330 : compact ? 250 : 270,
      h: portrait ? 66 : compact ? 50 : 54,
    };
    return { strip, grant };
  });
  const burstX = $derived(slotX(up.strip, st.slot) + up.strip.w / 8);
  const dotY = $derived(up.strip.y - (portrait ? 30 : 34));
  const burstY = $derived(mix(dotY - (portrait ? 44 : 34), dotY, st.slotP));
  const lowerBurstY = $derived(up.strip.y + up.strip.h + (portrait ? 42 : 44));
  const slotLabelSize = $derived(portrait ? 24 : compact ? 22 : 26);
  const badgeSize = $derived(portrait ? 30 : compact ? 20 : 24);
  const downPoint = (h: { x: number; y: number; size: number }, progress: number) => {
    const p = Math.max(0, Math.min(1, progress));
    if (p < 0.45) {
      const k = p / 0.45;
      return { x: mix(down.olt.x, down.splitter.x, k), y: mix(down.olt.y + 36, down.splitter.y, k) };
    }
    const k = (p - 0.45) / 0.55;
    return { x: mix(down.splitter.x, h.x, k), y: mix(down.splitter.y, h.y - h.size * 0.66, k) };
  };
  const roadNameX = (x: number, text: string, size: number) => {
    const half = text.length * size * 0.25;
    return Math.max(L.road.x0 + half, Math.min(L.road.x1 - half, x));
  };
</script>

<!-- shared road along the bottom -->
<path d={portrait
  ? `M0 ${L.road.y - 125} C210 ${L.road.y - 200} 370 ${L.road.y - 80} 560 ${L.road.y - 145} C700 ${L.road.y - 190} 805 ${L.road.y - 130} 900 ${L.road.y - 160} L900 1600 H0 Z`
  : `M0 ${L.road.y - 95} C260 ${L.road.y - 165} 460 ${L.road.y - 65} 690 ${L.road.y - 130} C940 ${L.road.y - 200} 1180 ${L.road.y - 70} 1600 ${L.road.y - 170} L1600 900 H0 Z`}
  fill="var(--meadow)" opacity="0.52" />
<rect x={L.road.x0} y={L.road.y - 36} width={L.road.x1 - L.road.x0} height="72" rx="36" fill="var(--kraft)" stroke="var(--line)" stroke-width="6" />
<path d={`M${L.road.x0 + 50} ${L.road.y} H${L.road.x1 - 50}`} stroke="var(--paper)" stroke-width="7" stroke-dasharray="34 30" stroke-linecap="round" />
<Node id={subject.ctx.client.node.id} x={L.client.x} y={L.client.y} size={L.client.size} />
<Node id={subject.ctx.to.node.id} x={L.hop.x} y={L.hop.y} size={L.hop.size} focused />
<Node id={subject.ctx.server.node.id} x={L.server.x} y={L.server.y} size={L.server.size} />
{#if !compact && !portrait}
  <Text x={roadNameX(L.client.x, nameOf(subject.ctx.client), T.text)} y={namesY} text={nameOf(subject.ctx.client)} size={T.text} kind="node" />
  <Text x={roadNameX(L.server.x, nameOf(subject.ctx.server), T.text)} y={namesY} text={nameOf(subject.ctx.server)} size={T.text} kind="node" />
{/if}
{#if !compact}<Text x={roadNameX(L.hop.x, nameOf(subject.ctx.to), T.big)} y={namesY} text={nameOf(subject.ctx.to)} size={T.big * (portrait ? 0.92 : 1)} kind="big" />{/if}

<!-- downstream broadcast card -->
<Card x={c0.x} y={c0.y} w={c0.w} h={c0.h} tint="var(--teal)" active={!activeTurns} />
<Text x={c0.x + 34} y={c0.y + (portrait || compact ? 82 : 70)} text={S(compact ? 'label.everyoneCompact' : 'label.everyone')} size={compact ? T.big * 0.76 : T.big} kind="big" anchor="start" />
<g>
  {#if technical && !compact && !portrait}
    <Text x={c0.x + 34} y={c0.y + 116} text={S('label.header')} size={T.text * 0.76} kind="small" anchor="start" />
    {#each fieldRows as row, i}
      <rect x={c0.x + 28} y={c0.y + 130 + i * 40} width={down.fieldW - 34} height="34" rx="10" fill={i === portRow ? 'var(--sun)' : 'var(--paper-2)'} stroke="var(--line)" stroke-width={i === portRow ? 4 : 2.5} />
      <Text x={c0.x + 44} y={c0.y + 154 + i * 40} text={row} size={T.text * 0.7} kind={i === portRow ? 'node' : 'small'} anchor="start" colour={i === portRow ? 'var(--face)' : undefined} on={i === portRow ? 'var(--sun)' : undefined} />
    {/each}
  {/if}
  <Node id="olt" x={down.olt.x} y={down.olt.y} size={portrait ? 78 : compact ? 54 : 60} />
  <path d={`M${down.olt.x} ${down.olt.y + (portrait ? 38 : 30)} L${down.splitter.x} ${down.splitter.y - 18}`} stroke="var(--line)" stroke-width="5" stroke-linecap="round" opacity="0.85" />
  <g transform="translate({down.splitter.x} {down.splitter.y})">
    <path d="M0 -24 L28 0 L0 24 L-28 0 Z" fill="var(--kraft)" stroke="var(--line)" stroke-width="5" />
    <circle r="7" fill="var(--teal)" stroke="var(--line)" stroke-width="2" />
  </g>
  {#if !compact}
    <rect x={down.splitter.x + (portrait ? 48 : 42)} y={down.splitter.y - (portrait ? 19 : 17)} width={portrait ? 150 : 104} height={portrait ? 36 : 30} rx="10" fill="var(--paper)" opacity="0.9" />
    <Text x={down.splitter.x + (portrait ? 62 : 54)} y={down.splitter.y + (portrait ? 8 : 7)} text={S('label.splitterShort')} size={T.text * 0.56} kind="small" anchor="start" />
  {/if}
  {#each down.houses as h, i}
    <path d={`M${down.splitter.x} ${down.splitter.y + 13} L${h.x} ${h.y - h.size * 0.48}`} stroke={i === 2 ? 'var(--accent)' : 'var(--muted)'} stroke-width={i === 2 ? 6 : 3.5} stroke-linecap="round" opacity={i === 2 ? 0.9 : 0.52} />
    {#if i === 2}
      <Node id="router" x={h.x} y={h.y} size={h.size * 1.1} />
    {:else}
      <House x={h.x} y={h.y} size={h.size} />
    {/if}
    {@const bw = Math.max(h.size * 0.72, houseNumbers[i].length * badgeSize * 0.62 + 14)}
    <rect x={h.x - bw / 2} y={h.y + h.size * 0.62} width={bw} height={badgeSize * 1.35} rx="8" fill={i === 2 ? 'var(--sun)' : 'var(--paper-2)'} stroke="var(--line)" stroke-width={i === 2 ? 4 : 3} />
    <Text x={h.x} y={h.y + h.size * 0.62 + badgeSize * 1.0} text={houseNumbers[i]} size={badgeSize} kind={i === 2 ? 'node' : 'small'} colour={i === 2 ? 'var(--face)' : undefined} on={i === 2 ? 'var(--sun)' : undefined} />
  {/each}
  {#each down.houses as h, i}
    {@const p = downPoint(h, st.down)}
    <FrameEnvelope x={p.x} y={p.y} scale={T.env * (i === 2 ? 0.72 : 0.6)} label="" kept={i === 2 && st.keep > 0.45} muted={i !== 2 && st.keep > 0.2} locked={i !== 2} checked={i === 2 && st.keep > 0.55} walking={!view.still} time={time + i} />
  {/each}
</g>

<!-- upstream time-slot card -->
<Card x={c1.x} y={c1.y} w={c1.w} h={c1.h} tint="var(--berry)" active={activeTurns} />
<Text x={c1.x + 34} y={c1.y + (portrait || compact ? 82 : 70)} text={S(compact ? 'label.turnsCompact' : 'label.turns')} size={compact ? T.big * 0.76 : T.big} kind="big" anchor="start" />
<g>
  <rect x={up.strip.x} y={up.strip.y} width={up.strip.w} height={up.strip.h} rx="18" fill="var(--paper-2)" stroke="var(--line)" stroke-width="5" />
  {#each [0, 1, 2, 3] as slot}
    {@const x = slotX(up.strip, slot)}
    {@const w = up.strip.w / 4}
    <rect x={x + 5} y={up.strip.y + 8} width={w - 10} height={up.strip.h - 16} rx="13" fill={slot === yourSlot ? 'var(--sun)' : 'var(--kraft)'} stroke="var(--line)" stroke-width={slot === yourSlot ? 5 : 2.5} opacity={slot === yourSlot ? 1 : 0.72} />
    {#if technical}
      <path d={`M${x} ${up.strip.y + up.strip.h + 8} V${up.strip.y + up.strip.h + 20}`} stroke="var(--line)" stroke-width="3" />
      <Text x={x + w / 2} y={up.strip.y + up.strip.h * 0.60} text={slotLabels[slot]} size={slotLabelSize} kind={slot === yourSlot ? 'node' : 'small'} colour={slot === yourSlot ? 'var(--face)' : undefined} on={slot === yourSlot ? 'var(--sun)' : undefined} />
    {:else}
      <Text x={x + w / 2} y={up.strip.y + up.strip.h * 0.60} text={portrait ? String(slot + 1) : `${S('label.slot')} ${slot + 1}`} size={slotLabelSize * 0.82} kind={slot === yourSlot ? 'node' : 'small'} colour={slot === yourSlot ? 'var(--face)' : undefined} on={slot === yourSlot ? 'var(--sun)' : undefined} />
    {/if}
  {/each}
  {#if technical && !portrait && !compact}
    <Text x={up.strip.x} y={up.strip.y + up.strip.h + (portrait ? 45 : 36)} text="0 µs" size={T.text * 0.48} kind="small" anchor="start" />
    <Text x={up.strip.x + up.strip.w} y={up.strip.y + up.strip.h + (portrait ? 45 : 36)} text="125 µs" size={T.text * 0.48} kind="small" anchor="end" />
  {/if}
  {#each [0, 1, 2, 3] as slot}
    {@const x = slotX(up.strip, slot) + up.strip.w / 8}
    <circle cx={x} cy={dotY} r={slot === st.slot ? 11 : 7} fill={slot === yourSlot ? 'var(--sun)' : 'var(--teal)'} stroke="var(--line)" stroke-width="3" opacity={slot === st.slot ? 1 : 0.5} />
  {/each}
  <g transform="translate({burstX} {burstY})">
    <rect x={portrait ? -34 : -28} y={portrait ? -20 : -16} width={portrait ? 68 : 56} height={portrait ? 40 : 32} rx="10" fill={st.slot === yourSlot ? 'var(--sun)' : 'var(--teal)'} stroke="var(--line)" stroke-width="4" />
    <path d={portrait ? 'M-22 -5 H22 M-16 8 H16' : 'M-18 -4 H18 M-13 7 H13'} stroke="var(--face)" stroke-width="4" stroke-linecap="round" />
  </g>
  {#if !technical}
    {#each [0, 1, 2, 3] as slot}
      {@const x = slotX(up.strip, slot) + up.strip.w / 8}
      <g transform="translate({x} {lowerBurstY})" opacity={slot === st.slot ? 1 : 0.55}>
        <path d="M0 -15 V15 M-14 -7 L14 7 M-14 7 L14 -7" stroke={slot === yourSlot ? 'var(--accent)' : 'var(--teal)'} stroke-width={slot === st.slot ? 7 : 5} stroke-linecap="round" />
        <circle r={slot === st.slot ? 9 : 6} fill="var(--paper)" stroke="var(--line)" stroke-width="3" />
      </g>
    {/each}
    {#if !compact}
      <Text x={slotX(up.strip, yourSlot) + up.strip.w / 8} y={lowerBurstY + (portrait ? 48 : 40)} text={S('label.yourTurnShort')} size={portrait ? 28 : 25} kind="big" colour="var(--brick)" />
    {/if}
  {/if}
</g>
{#if !compact && technical}
  <rect x={c1.x + (portrait ? 30 : 48)} y={c1.y + c1.h - (portrait ? 88 : 62)} width={c1.w - (portrait ? 60 : 96)} height={portrait ? 64 : 42} rx="14" fill="var(--paper-2)" stroke="var(--line)" stroke-width="4" />
  <Text x={c1.x + c1.w / 2} y={c1.y + c1.h - (portrait ? 47 : 34)} text={S('label.technicalGrant')} size={portrait ? 26 : 26} kind="big" />
{/if}

{#each tagTexts.slice(0, L.tags.length) as tag, i}
  <TagAt x={L.tags[i].x} y={L.tags[i].y} text={tag} size={T.tag} />
{/each}
