<svelte:options namespace="svg" />
<script lang="ts">
  // THESIS: the NR frame is a little radio conversation: ask the tower for seats, read the C-RNTI ticket, then prove
  // each piece arrived with HARQ before upper radio layers have to recover anything. 3G's HSPA frame tells the same
  // story (2 ms turns, an H-RNTI, HARQ in the NodeB): its devices are the route's first three, its numbers the layer's
  // fields, and its words the era's (`scene.nr-grant.2010`).
  import { Node, Text, fill, legibleSize, nameOf, strings, textBox, view, type LayerSubject } from '$core/api';
  import Card from './art/Card.svelte';
  import Piece from './art/Piece.svelte';
  import { combineAmount, layoutFor, mix, pieceOffset, sceneState, type Focus } from './grant';

  let { subject, time }: { subject: LayerSubject; time: number } = $props();
  const S = strings('scene.nr-grant');
  const legible = legibleSize();
  const ctx = $derived(subject.ctx);
  const technical = $derived(ctx.level === 'technical');
  // the phone, the tower and what's behind it (the mobile core; in 3G the radio controller)
  const phoneHop = $derived(ctx.client);
  const towerHop = $derived(subject.route.chain[1]);
  const coreHop = $derived(subject.route.chain[2]);
  const focus: Focus = $derived(ctx.role === 'endpoint' ? 'phone' : ctx.to.id === towerHop.id ? 'tower' : 'core');
  const L = $derived(layoutFor(view.orient, focus, view.vp));
  const T = $derived(L.size);
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(!!L.compact);
  const now = $derived(view.still ? 8.8 : time);
  const st = $derived(sceneState(now));
  const c0 = $derived(L.cards[0]);
  const c1 = $derived(L.cards[1]);
  const harqY = $derived(L.harq.y);
  const harqLeft = $derived(c1.x + c1.w * (portrait ? 0.24 : 0.26));
  const harqMid = $derived(c1.x + c1.w * 0.50);
  const harqRight = $derived(c1.x + c1.w * (portrait ? 0.76 : 0.74));
  const ticketK = $derived(st.phase === 'request' ? 0 : st.phase === 'grant' ? st.p : 1);
  const rowLit = $derived(st.phase !== 'request' && !(st.phase === 'grant' && st.p < 0.65));
  const askOn = $derived(st.phase === 'request' || (st.phase === 'grant' && st.p < 0.35));
  const listLabelY = $derived(L.schedule.y - L.schedule.row * 0.82);
  const rxX = $derived(c1.x + c1.w * (focus === 'phone' ? 0.20 : 0.80));
  const bubbleX = $derived(c1.x + c1.w * (portrait ? 0.72 : focus === 'phone' ? 0.20 : 0.82));
  const bubbleY = $derived(c1.y + (portrait ? 68 : compact ? 152 : 160));
  const resendK = $derived(st.phase === 'combine' ? st.p : st.phase === 'ack' ? 1 : 0);
  const clearK = $derived(st.phase === 'combine' ? Math.max(0, (st.p - 0.55) / 0.45) : st.phase === 'ack' ? 1 : 0);
  const phoneName = $derived(nameOf(phoneHop));
  const towerName = $derived(nameOf(towerHop));
  const coreName = $derived(nameOf(coreHop));
  // the layer's fields as they are in this direction; the phone's number is the one Simple shows
  const fields = $derived(subject.route.content.layers[subject.layer].fields);
  const vals = $derived(Object.fromEntries(fields.map((f) => [f.id, typeof f.value === 'string' ? f.value : f.value[ctx.dir]])));
  const rnti = $derived(vals[fields.find((f) => f.simple)!.id]);
  const simpleRnti = $derived(rnti.replace(/^0x/, ''));
  const ticketText = $derived(technical ? fill(S('label.ticketTechnical'), { n: rnti }) : fill(S('label.ticketSimple'), { n: simpleRnti }));
  const grantLine = $derived(technical ? S('label.grantTechnical') : S('label.grantSimple'));
  const scheduleRows = $derived(technical
    ? [
        { n: S('label.before'), seat: S('label.beforeSeat'), on: false },
        { n: rnti, seat: S('label.grantTechnical'), on: true },
        { n: S('label.after'), seat: S('label.afterSeat'), on: false },
      ]
    : [
        { n: fill(S('label.phoneNo'), { n: '1288' }), seat: S('label.otherTurn'), on: false },
        { n: fill(S('label.phoneNo'), { n: simpleRnti }), seat: S('label.myTurn'), on: true },
        { n: fill(S('label.phoneNo'), { n: '3066' }), seat: S('label.otherTurn'), on: false },
      ]);
  const scanOn = $derived(focus === 'phone' && (st.phase === 'grant' || st.phase === 'send'));
  const combine = $derived(combineAmount(st.phase, st.p));
  const smudge = $derived(st.phase === 'send' ? 0.65 : st.phase === 'nack' ? 1 : st.phase === 'combine' ? 1 - combine : 0);
  const nameSize = $derived(portrait ? 40 : compact ? 38 : 32);

  // the envelope's number: unscaled on a phone on its side, where it would fall under the label minimum (issue #33)
  const envScale = $derived(portrait ? 1.05 : compact ? 1 : 0.9);
  const envNo = $derived(technical ? rnti : simpleRnti);
  const envNoW = $derived(compact ? Math.max(84, textBox(envNo, legible(34), 'middle', 0.6, '--label-font').w + 24) : 84);

  function tx(a: number, b: number, p: number) { return mix(a, b, p); }
  function nameX(x: number, text: string, size: number) {
    const half = text.length * size * 0.32;
    return Math.max(L.road.x0 + half, Math.min(L.road.x1 - half, x));
  }
</script>

<path d={portrait
  ? `M0 ${L.road.y - 125} C160 ${L.road.y - 185} 325 ${L.road.y - 80} 500 ${L.road.y - 145} C640 ${L.road.y - 195} 735 ${L.road.y - 120} 900 ${L.road.y - 160} L900 1600 H0 Z`
  : `M0 ${L.road.y - 95} C230 ${L.road.y - 170} 360 ${L.road.y - 60} 600 ${L.road.y - 135} C840 ${L.road.y - 205} 1040 ${L.road.y - 75} 1600 ${L.road.y - 165} L1600 900 H0 Z`}
  fill="var(--meadow)" opacity="0.5" />
<rect x={L.road.x0} y={L.road.y - 36} width={L.road.x1 - L.road.x0} height="72" rx="36" fill="var(--kraft)" stroke="var(--line)" stroke-width="6" />
<path d={`M${L.road.x0 + 50} ${L.road.y} H${L.road.x1 - 50}`} stroke="var(--paper)" stroke-width="7" stroke-dasharray="34 30" stroke-linecap="round" />

<Card x={c0.x} y={c0.y} w={c0.w} h={c0.h} tint="var(--sun)" />
<Text x={c0.x + 34} y={c0.y + (portrait ? 82 : compact ? 78 : 70)} text={S('card.seat')} size={T.title} kind="big" anchor="start" />

{#if compact}
  <!-- one bubble: the ask, then the ticket -->
  <rect x={c0.x + 60} y={c0.y + 112} width={c0.w - 120} height="78" rx="22" fill="var(--paper-2)" stroke="var(--line)" stroke-width={askOn ? 4 : 5} />
  <Text x={c0.x + c0.w / 2} y={c0.y + 164} text={askOn ? S('label.ask') : ticketText} size={30} kind="big" colour="var(--brick)" />
{:else}
  <!-- 1) ask -->
  <g opacity={askOn ? 1 : 0.86}>
    <rect x={c0.x + (portrait ? 58 : 64)} y={c0.y + (portrait ? 116 : 98)} width={portrait ? 430 : 252} height={portrait ? 78 : 54} rx={portrait ? 24 : 18} fill="var(--paper-2)" stroke="var(--line)" stroke-width="4" />
    <Text x={c0.x + (portrait ? 273 : 190)} y={c0.y + (portrait ? 166 : 134)} text={S('label.ask')} size={portrait ? 27 : 25} kind="big" colour="var(--brick)" />
    <path d={`M${c0.x + (portrait ? 500 : 340)} ${c0.y + (portrait ? 160 : 126)} C${c0.x + c0.w * 0.56} ${c0.y + (portrait ? 108 : 98)} ${c0.x + c0.w * 0.65} ${c0.y + (portrait ? 108 : 98)} ${c0.x + c0.w * 0.72} ${c0.y + (portrait ? 152 : 125)}`} fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round" stroke-dasharray="12 10" opacity="0.65" />
  </g>

  <!-- 2) ticket -->
  <g opacity={ticketK > 0 ? 0.4 + ticketK * 0.6 : 0.25}>
    <rect x={c0.x + (portrait ? 340 : 390)} y={c0.y + (portrait ? 198 : 162)} width={portrait ? 410 : 230} height={portrait ? 96 : 62} rx="18" fill="var(--paper-2)" stroke="var(--line)" stroke-width="5" />
  </g>
  <Text x={c0.x + (portrait ? 545 : 505)} y={c0.y + (portrait ? 257 : 187)} text={portrait && !technical ? fill(S('label.ticketPortrait'), { n: simpleRnti }) : ticketText} size={portrait ? 25 : 22} kind="big" colour="var(--brick)" />
  {#if !portrait}<Text x={c0.x + 505} y={c0.y + 214} text={grantLine} size={20} kind="node" colour="var(--brick)" />{/if}
{/if}

<!-- 3) schedule list -->
{#if !compact}<Text x={L.schedule.x} y={listLabelY} text={S('label.schedule')} size={T.text * (portrait ? 0.78 : 0.72)} kind="big" anchor="start" colour="var(--brick)" />{/if}
{#each scheduleRows as row, i}
  {@const y = L.schedule.y + i * L.schedule.row}
  <rect x={L.schedule.x} y={y - T.small * (portrait ? 1.3 : compact ? 1.05 : 0.95)} width={L.schedule.w} height={T.small * (portrait ? 2.15 : compact ? 1.75 : 1.55)} rx="16" fill={row.on && rowLit ? 'var(--sun)' : 'var(--paper-2)'} stroke="var(--line)" stroke-width={row.on && rowLit ? 5 : 3} opacity={row.on || technical ? 1 : 0.78} />
  {#if row.on && scanOn}
    <circle cx={L.schedule.x + 18 + st.p * (L.schedule.w - 36)} cy={y} r={T.small * 0.62} fill="none" stroke="var(--teal)" stroke-width="7" opacity="0.82" />
  {/if}
  <Text x={L.schedule.x + (portrait ? 22 : 18)} y={y + T.small * 0.35} text={row.n} size={T.small * (portrait ? 0.92 : 0.9)} kind="node" anchor="start" colour={row.on && rowLit ? 'var(--face)' : undefined} on={row.on && rowLit ? 'var(--sun)' : undefined} />
  <Text x={L.schedule.x + L.schedule.w - (portrait ? 22 : 18)} y={y + T.small * 0.35} text={row.seat} size={T.small * (technical ? 0.74 : 0.78)} kind={row.on && rowLit ? 'big' : 'small'} anchor="end" colour={row.on && rowLit ? 'var(--face)' : 'var(--line)'} on={row.on && rowLit ? 'var(--sun)' : undefined} />
{/each}

<Card x={c1.x} y={c1.y} w={c1.w} h={c1.h} tint="var(--teal)" />
<Text x={c1.x + 34} y={c1.y + (portrait || compact ? 82 : 70)} text={S('card.harq')} size={T.title} kind="big" anchor="start" />
<g>
  {#if !technical}<g opacity="0.88">
    <Node id={(focus === 'phone' ? phoneHop : focus === 'tower' ? towerHop : coreHop).node.id} x={rxX} y={c1.y + c1.h - (portrait ? 92 : compact ? 150 : 66)} size={portrait || compact ? 62 : 68} />
  </g>{/if}
  {#if st.phase === 'combine'}
    <Piece x={harqMid - L.harq.gap * 0.45 + resendK * L.harq.gap * 0.35} y={harqY - resendK * T.piece * 0.05} size={T.piece} colour="var(--berry)" smudge={1 - clearK * 0.7} />
    <g opacity={1 - clearK * 0.75}>
      <Piece x={harqRight + L.harq.gap * 0.18 - resendK * L.harq.gap * 0.62} y={harqY + T.piece * 1.08 - resendK * T.piece * 0.95} size={T.piece} colour="var(--sun)" smudge={0.2 * (1 - clearK)} glow={resendK > 0.35} />
    </g>
    {#if clearK > 0.2}
      <Piece x={harqMid} y={harqY + T.piece * 0.05} size={T.piece * (0.8 + clearK * 0.2)} colour="var(--sun)" smudge={0} glow={true} label={clearK > 0.75 ? '✓' : ''} />
    {/if}
  {:else}
    {#each [0, 1, 2] as i}
      {@const sent = pieceOffset(i, st.phase, st.p)}
      <Piece x={tx(harqLeft - L.harq.gap * 0.55 + i * L.harq.gap * 0.55, harqMid - L.harq.gap * 0.55 + i * L.harq.gap * 0.55, sent)} y={harqY} size={T.piece} colour={i === 1 ? 'var(--berry)' : 'var(--sun)'} smudge={i === 1 ? smudge : 0} glow={st.phase === 'ack'} />
    {/each}
    {#if st.phase === 'ack'}
      <Piece x={harqMid} y={harqY} size={T.piece * 1.08} colour="var(--sun)" smudge={0} glow={true} label="✓" />
    {/if}
  {/if}
  {#if st.phase === 'nack' || st.phase === 'combine' || st.phase === 'ack'}
    <g transform="translate({bubbleX} {bubbleY})">
      <rect x={-T.text * (st.phase === 'ack' ? 1.35 : 1.65)} y={-T.text * 0.95} width={T.text * (st.phase === 'ack' ? 2.7 : 3.3)} height={T.text * 1.55} rx="16" fill="var(--paper-2)" stroke="var(--line)" stroke-width="5" />
      <path d={focus === 'phone' ? `M${-T.text * 0.55} ${T.text * 0.58} L${-T.text * 1.0} ${T.text * 1.0}` : `M${T.text * 0.55} ${T.text * 0.58} L${T.text * 1.0} ${T.text * 1.0}`} fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round" />
      <Text x={0} y={-T.text * 0.05} text={S(st.phase === 'ack' ? 'label.got' : 'label.again')} size={T.text} kind="big" colour={st.phase === 'ack' ? 'var(--leaf-ink)' : 'var(--berry-ink)'} />
    </g>
  {/if}
  {#if technical}
    <g opacity="0.95">
      <rect x={c1.x + c1.w * (portrait ? 0.53 : 0.52) - (portrait ? 170 : 150)} y={portrait ? c1.y + c1.h - 160 : harqY + T.piece * 0.78} width={portrait ? 340 : 300} height={portrait ? 40 : 32} rx="12" fill="var(--paper-2)" stroke="var(--line)" stroke-width="3" />
      <Text x={c1.x + c1.w * (portrait ? 0.53 : 0.52)} y={portrait ? c1.y + c1.h - 132 : harqY + T.piece * 1.05} text={S('label.harqTechnical')} size={portrait ? 24 : 22} kind="small" colour="var(--line)" />
    </g>
  {/if}
  {#if !technical}
    <Text x={c1.x + c1.w / 2} y={c1.y + c1.h - (portrait || compact ? 46 : 28)} text={S(st.phase === 'combine' ? 'label.combine' : st.phase === 'nack' ? (focus === 'phone' ? 'label.nack' : 'label.regrant') : st.phase === 'ack' ? 'label.ack' : 'label.check')} size={T.small} kind="big" colour={st.phase === 'nack' ? 'var(--berry-ink)' : 'var(--teal-ink)'} />
  {/if}
</g>

{#if technical && !compact}
  <g opacity="0.94">
    <rect x={c1.x + 34} y={c1.y + c1.h - (portrait ? 88 : 82)} width={c1.w - 68} height={portrait ? 72 : 42} rx="14" fill="var(--paper-2)" stroke="var(--line)" stroke-width="3" opacity="0.86" />
    {#if portrait}
      <Text x={c1.x + c1.w / 2} y={c1.y + c1.h - 42} text={fill(S('label.snShort'), vals)} size={18} kind="small" colour="var(--line)" />
    {:else}
      <Text x={c1.x + c1.w / 2} y={c1.y + c1.h - 53} text={fill(S('label.sn'), vals)} size={24} kind="small" colour="var(--line)" />
    {/if}
  </g>
{/if}

<Node id={phoneHop.node.id} x={L.phone.x} y={L.phone.y} size={L.phone.size} focused={focus === 'phone'} />
<Node id={towerHop.node.id} x={L.tower.x} y={L.tower.y} size={L.tower.size} focused={focus === 'tower'} />
<Node id={coreHop.node.id} x={L.core.x} y={L.core.y} size={L.core.size} focused={focus === 'core'} />
{#if (!compact && !portrait) || focus === 'phone'}<Text x={nameX(L.phone.x, phoneName, focus === 'phone' ? T.text : nameSize)} y={L.names} text={phoneName} size={focus === 'phone' ? T.text : nameSize} kind={focus === 'phone' ? 'big' : 'node'} />{/if}
{#if (!compact && !portrait) || focus === 'tower'}<Text x={nameX(L.tower.x, towerName, focus === 'tower' ? T.text : nameSize)} y={L.names} text={towerName} size={focus === 'tower' ? T.text : nameSize} kind={focus === 'tower' ? 'big' : 'node'} />{/if}
{#if (!compact && !portrait) || focus === 'core'}<Text x={nameX(L.core.x, coreName, focus === 'core' ? T.text : nameSize)} y={L.names} text={coreName} size={focus === 'core' ? T.text : nameSize} kind={focus === 'core' ? 'big' : 'node'} />{/if}

{#if st.phase === 'send'}
  <g transform="translate({tx(focus === 'tower' ? L.phone.x + 105 : L.tower.x - 95, focus === 'tower' ? L.tower.x - 112 : L.phone.x + 115, st.p)} {L.walk - 92 - Math.sin(now * 8) * 7}) scale({envScale})">
    <rect x="-72" y="-45" width="144" height="90" rx="14" fill="var(--paper-2)" stroke="var(--line)" stroke-width="6" />
    <path d="M-66 -38 L0 2 L66 -38" fill="none" stroke="var(--line)" stroke-width="5" opacity="0.65" />
    <rect x={-envNoW / 2} y="-2" width={envNoW} height="34" rx="8" fill="var(--sun)" stroke="var(--line)" stroke-width="4" />
    <Text x={0} y={24} text={envNo} size={34} kind="big" colour="var(--face)" on="var(--sun)" />
  </g>
{/if}
