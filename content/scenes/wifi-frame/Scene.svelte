<svelte:options namespace="svg" />
<script lang="ts">
  import { Node, TagAt, Text, fakeMac, fill, legibleSize, nameOf, strings, textBox, view, yours, type LayerSubject } from '$core/api';
  import Card from './art/Card.svelte';
  import Envelope from './art/Envelope.svelte';
  import { airPulse, bob, layoutFor, sceneState } from './frame';

  let { subject, time }: { subject: LayerSubject; time: number } = $props();

  const S = strings('scene.wifi-frame');
  const legible = legibleSize();
  const ctx = $derived(subject.ctx);
  const route = $derived(subject.route);
  const technical = $derived(ctx.level === 'technical');
  const down = $derived(ctx.dir === 'down' || ctx.role === 'endpoint');
  const L = $derived(layoutFor(view.orient, view.vp));
  const T = $derived(L.size);
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(!!L.compact);
  const clock = $derived(view.still ? 7.8 : time);
  const st = $derived(sceneState(clock, L, down));
  const phoneHop = $derived(route.hops[ctx.link.from] ?? ctx.client);
  const apHop = $derived(route.hops[ctx.link.to] ?? ctx.to);
  const routerHop = $derived(route.chain[(apHop?.index ?? ctx.to.index) + 1] ?? ctx.server);
  const focusId = $derived(ctx.to.id);
  const shortMac = (id: string) => `…${fakeMac(id).slice(-5)}`;
  /** The neighbour waiting its turn on the air: the other kind of device than yours. */
  const neighbour = $derived(phoneHop.node.id === 'laptop' ? 'phone' : 'laptop');
  const phoneName = $derived(technical ? shortMac(phoneHop.id) : yours(phoneHop));
  const apName = $derived(technical ? shortMac(apHop.id) : S('label.ap'));
  const routerName = $derived(technical ? shortMac(routerHop.id) : S('label.router'));
  const c0 = $derived(L.cards[0]);
  const c1 = $derived(L.cards[1]);
  const rowShort = (key: string, value: string, hot = false) => ({ label: S(key), value, hot });
  const rowTechnical = (label: string, value: string, hot = false) => ({ label, value, hot });
  const radioRows = $derived.by(() => down
    ? [rowShort('label.for', phoneName, true), rowShort('label.from', apName), rowShort('label.cameFrom', routerName)]
    : [rowShort('label.for', apName, true), rowShort('label.from', phoneName), rowShort('label.thenTo', routerName)]);
  const cableRows = $derived.by(() => down
    ? [rowShort('label.for', phoneName, true), rowShort('label.from', routerName)]
    : [rowShort('label.for', routerName, true), rowShort('label.from', phoneName)]);
  const radioFields = $derived.by(() => [
    rowTechnical(S('field.fc'), down ? S('field.fromDs') : S('field.toDs'), true),
    rowTechnical(S('field.duration'), '44 µs'),
    rowTechnical('addr1', down ? phoneName : apName, true),
    rowTechnical('addr2', down ? apName : phoneName),
    rowTechnical('addr3', routerName),
    rowTechnical(S('field.seq'), down ? '0x7c10' : '0x0a30'),
    rowTechnical('FCS', down ? '0x51b7e20c' : '0x8d42c3a1'),
  ]);
  const cableFields = $derived.by(() => down
    ? [rowTechnical('Eth DA', phoneName, true), rowTechnical('Eth SA', routerName)]
    : [rowTechnical('Eth DA', routerName, true), rowTechnical('Eth SA', phoneName)]);
  const radioStrip = $derived.by(() => [
    `FC ${down ? 'FromDS' : 'ToDS'} · Dur44 · Seq${down ? '7c10' : '0a30'}`,
    `A1 ${down ? phoneName : apName} · A2 ${down ? apName : phoneName} · A3 ${routerName}`,
    `FCS ${down ? '51b7e20c' : '8d42c3a1'} · CCMP`,
  ]);
  const cableStrip = $derived.by(() => [
    `DA ${down ? phoneName : routerName}`,
    `SA ${down ? routerName : phoneName}`,
  ]);
  const dsText = $derived(technical ? S(down ? 'tag.fromDs' : 'tag.toDs') : down ? fill(S('label.radioToYou'), { yours: yours(phoneHop) }) : S('label.radioToAp'));
  const swapText = $derived(down ? S('label.cableBecomesRadio') : S('label.radioBecomesCable'));
  const ackText = $derived(technical ? S('label.ackTechnical') : S('label.gotIt'));
  const titleY = $derived(c0.y + (portrait || compact ? 82 : 74));
  const title2Y = $derived(c1.y + (portrait || compact ? 82 : 74));
  const simpleEnvScale = $derived(portrait ? 0.84 : compact ? 1.1 : 1.02);
  const envLeftX = $derived(c0.x + c0.w * (portrait ? 0.24 : 0.25));
  const envRightX = $derived(c0.x + c0.w * (portrait ? 0.24 : 0.75));
  const envY = $derived(c0.y + (portrait ? 165 : c0.h * 0.66));
  const env2Y = $derived(c0.y + (portrait ? 318 : c0.h * 0.66));
  const nameX = (x: number, text: string, size: number) => {
    const half = text.length * size * 0.25;
    return Math.max(L.road.x0 + half, Math.min(L.road.x1 - half, x));
  };
  const timeline = $derived(technical
    ? [S('label.aifs'), S('label.backoff'), S('label.data'), portrait || compact ? S('label.ackTechnical') : S('label.sifsAck')]
    : [S('label.listenSimple'), S('label.waitSimple'), S('label.sendSimple'), S('label.gotItStep')]);
  const lineY = $derived(c1.y + c1.h * (compact ? 0.56 : 0.50));
  // a phone on its side: no laptop on the card (it waits on the road anyway), so the timeline spans the card and its
  // words and pop-ups keep to the theme's label minimum (issue #33)
  const tlX0 = $derived(c1.x + (compact ? 110 : c1.w * 0.30));
  const tlX1 = $derived(c1.x + c1.w - (portrait ? 82 : compact ? 110 : 72));
  const popPx = $derived(compact ? legible(40) : 0);
  const measure = (text: string, size: number) => textBox(text, size, 'middle', 0.6, '--label-font').w;
  const tlStep = $derived((tlX1 - tlX0) / 3);
  const clashX = $derived(tlX0 + tlStep * 2);
  const ackW = $derived(compact ? measure(ackText, popPx) + 56 : portrait ? 350 : 260);
  const ackX = $derived(compact ? Math.min(tlX1 - 30, c1.x + c1.w - 24 - ackW / 2) : tlX1 - (portrait ? 100 : 30));
  const tagTexts = $derived(technical
    ? [S('tag.csma'), S('tag.encrypt'), S('tag.sequence')]
    : [S('tag.everyone'), S('tag.gotIt')]);
</script>

<!-- shared road -->
<path d={portrait
  ? `M0 ${L.road.y - 105} C150 ${L.road.y - 165} 300 ${L.road.y - 70} 455 ${L.road.y - 135} C620 ${L.road.y - 205} 745 ${L.road.y - 105} 900 ${L.road.y - 155} L900 1600 H0 Z`
  : `M0 ${L.road.y - 90} C255 ${L.road.y - 165} 415 ${L.road.y - 45} 640 ${L.road.y - 130} C880 ${L.road.y - 225} 1080 ${L.road.y - 70} 1600 ${L.road.y - 160} L1600 900 H0 Z`}
  fill="var(--meadow)" opacity="0.46" />
<rect x={L.road.x0} y={L.road.y - 36} width={L.road.x1 - L.road.x0} height="72" rx="36" fill="var(--kraft)" stroke="var(--line)" stroke-width="6" />
<path d={`M${L.road.x0 + 50} ${L.road.y} H${L.road.x1 - 50}`} stroke="var(--paper)" stroke-width="7" stroke-dasharray="34 30" stroke-linecap="round" />
<path d={`M${L.phone.x + 50} ${L.road.y - 92} Q${L.ap.x} ${L.road.y - 170} ${L.router.x - 52} ${L.road.y - 92}`} fill="none" stroke="var(--line)" stroke-width="8" stroke-linecap="round" stroke-dasharray="20 18" opacity={0.20 + airPulse(clock) * 0.18} />

<!-- card 1: addresses -->
<Card x={c0.x} y={c0.y} w={c0.w} h={c0.h} tint="var(--sun)" />
<Text x={c0.x + 34} y={titleY} text={S('label.threeAddresses')} size={T.big} kind="big" anchor="start" />
{#if !compact}
<rect x={c0.x + c0.w - (portrait ? 310 : 220)} y={c0.y + (portrait ? 18 : 28)} width={portrait ? 270 : 185} height={portrait ? 54 : 34} rx="17" fill="var(--paper)" stroke="var(--line)" stroke-width="3" opacity="0.96" />
<text x={c0.x + c0.w - (portrait ? 175 : 128)} y={c0.y + (portrait ? 54 : 53)} text-anchor="middle" font-family="var(--label-font)" font-size={portrait ? 31 : 19} font-weight="900" fill="var(--brick)">{dsText}</text>
{/if}

{#if technical && !compact}
  {#if portrait}
    <rect x={c0.x + 34} y={c0.y + 124} width={c0.w - 68} height="212" rx="20" fill="var(--paper-2)" stroke="var(--line)" stroke-width="5" />
    <Text x={c0.x + 58} y={c0.y + 166} text={S('label.radioEnvelope')} size="30" kind="big" anchor="start" />
    {#each radioStrip as line, i}
      <text x={c0.x + 58} y={c0.y + 215 + i * 46} font-family="var(--tag-font)" font-size="30" font-weight="800" fill="var(--line)">{line}</text>
    {/each}
    <rect x={c0.x + 34} y={c0.y + 350} width={c0.w - 68} height="150" rx="20" fill="var(--mint)" stroke="var(--line)" stroke-width="5" />
    <Text x={c0.x + 58} y={c0.y + 398} text={S('label.cableEnvelope')} size="28" kind="big" anchor="start" />
    {#each cableStrip as line, i}
      <text x={c0.x + 58} y={c0.y + 450 + i * 34} font-family="var(--tag-font)" font-size="32" font-weight="800" fill="var(--line)">{line}</text>
    {/each}
  {:else}
    <rect x={c0.x + 30} y={c0.y + 126} width={c0.w * 0.58} height={c0.h - 158} rx="20" fill="var(--paper-2)" stroke="var(--line)" stroke-width="5" />
    <rect x={c0.x + c0.w * 0.66} y={c0.y + 126} width={c0.w * 0.29} height={c0.h - 158} rx="20" fill="var(--mint)" stroke="var(--line)" stroke-width="5" />
    <Text x={c0.x + 54} y={c0.y + 166} text={S('label.radioEnvelope')} size={25} kind="big" anchor="start" />
    <Text x={c0.x + c0.w * 0.68} y={c0.y + 166} text={S('label.cableEnvelope')} size={23} kind="big" anchor="start" />
    {#each radioStrip as line, i}
      <text x={c0.x + 54} y={c0.y + 212 + i * 34} font-family="var(--tag-font)" font-size="18" font-weight="800" fill="var(--line)">{line}</text>
    {/each}
    {#each cableStrip as line, i}
      <text x={c0.x + c0.w * 0.68} y={c0.y + 215 + i * 31} font-family="var(--tag-font)" font-size="18" font-weight="800" fill="var(--line)">{line}</text>
    {/each}
  {/if}
{:else if portrait}
  <Envelope x={envLeftX} y={envY} scale={simpleEnvScale} kind={down ? 'cable' : 'radio'} rows={[]} />
  <Envelope x={envRightX} y={env2Y} scale={simpleEnvScale} kind={down ? 'radio' : 'cable'} rows={[]} />
  {#each (down ? cableRows : radioRows) as r, i}
    <text x={c0.x + 330} y={c0.y + (down ? 200 : 196) + i * 55} font-family="var(--label-font)" font-size="34" font-weight={r.hot ? 900 : 800} fill="var(--line)">{r.label}: {r.value}</text>
  {/each}
  {#each (down ? radioRows : cableRows) as r, i}
    <text x={c0.x + 330} y={c0.y + (down ? 354 : 388) + i * 55} font-family="var(--label-font)" font-size="34" font-weight={r.hot ? 900 : 800} fill="var(--line)">{r.label}: {r.value}</text>
  {/each}
{:else}
  <Envelope x={envLeftX} y={envY} scale={simpleEnvScale} kind={down ? 'cable' : 'radio'} rows={down ? cableRows : radioRows} blank={compact} title={compact ? '' : S(down ? 'label.cableEnvelope' : 'label.radioEnvelope')} />
  <path d={`M${envLeftX + 152} ${envY} H${envRightX - 152}`} stroke="var(--line)" stroke-width="6" stroke-linecap="round" opacity="0.72" />
  <path d={`M${envRightX - 157} ${envY - 13} L${envRightX - 138} ${envY} L${envRightX - 157} ${envY + 13}`} fill="none" stroke="var(--line)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.72" />
  <Envelope x={envRightX} y={envY} scale={simpleEnvScale} kind={down ? 'radio' : 'cable'} rows={down ? radioRows : cableRows} blank={compact} title={compact ? '' : S(down ? 'label.radioEnvelope' : 'label.cableEnvelope')} />
{/if}

<!-- card 2: taking turns -->
<Card x={c1.x} y={c1.y} w={c1.w} h={c1.h} tint="var(--teal)" />
<Text x={c1.x + 34} y={title2Y} text={S('label.takingTurns')} size={T.big} kind="big" anchor="start" />
{#if !compact}<Node id={neighbour} x={c1.x + c1.w * 0.15} y={lineY + (portrait ? 10 : 4)} size={portrait ? 98 : 82} />{/if}
{#if !portrait && !compact}<Text x={c1.x + c1.w * 0.15} y={lineY + 72} text={S('label.neighbour')} size={21} kind="small" />{/if}
<path d={`M${tlX0} ${lineY} H${tlX1}`} stroke="var(--line)" stroke-width="6" stroke-linecap="round" opacity="0.45" />
{#each timeline as label, i}
  {@const x = tlX0 + i * tlStep}
  <circle cx={x} cy={lineY} r={portrait ? 12 : 10} fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
  <text x={x} y={lineY + (portrait ? 52 : compact ? 58 : 39)} text-anchor="middle" font-family="var(--tag-font)" font-size={portrait ? 32 : compact ? legible(42) : 18} font-weight="800" fill="var(--line)">{label}</text>
{/each}
<circle cx={tlX0 + (tlStep * st.air.cursor)} cy={lineY} r={portrait ? 18 : 15} fill="var(--sun)" stroke="var(--line)" stroke-width="5" />
<g opacity={st.air.clash || st.air.noAck ? 1 : 0}>
  {#if st.air.clash}
    <path d={`M${clashX - 52} ${lineY - 76} l24 24 l-24 20 l34 14 l-10 30`} fill="none" stroke="var(--berry)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    <rect x={clashX - (compact ? 190 : 148)} y={lineY - 102} width="92" height="44" rx="12" fill="var(--sun)" stroke="var(--line)" stroke-width="4" />
    <rect x={clashX + (compact ? 98 : 48)} y={lineY - 102} width="92" height="44" rx="12" fill="var(--sun)" stroke="var(--line)" stroke-width="4" />
    <Text x={clashX} y={lineY - 70} text={S('label.bump')} size={portrait ? 25 : 22} kind="big" colour="var(--brick)" />
  {:else if compact}
    {@const w = measure(S('label.noAck'), popPx) + 48}
    <rect x={clashX - w / 2} y={lineY - 118} width={w} height={popPx * 1.5} rx="16" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
    <text x={clashX} y={lineY - 118 + popPx * 1.1} text-anchor="middle" font-family="var(--label-font)" font-size={popPx} font-weight="900" fill="var(--brick)">{S('label.noAck')}</text>
  {:else}
    <rect x={clashX - (portrait ? 125 : 100)} y={lineY - 110} width={portrait ? 250 : 200} height={portrait ? 68 : 54} rx="16" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
    <text x={clashX} y={lineY - (portrait ? 66 : 64)} text-anchor="middle" font-family="var(--label-font)" font-size={portrait ? 32 : 21} font-weight="900" fill="var(--brick)">{S('label.noAck')}</text>
  {/if}
</g>
<g opacity={st.air.retry ? 1 : 0} transform={`translate(${tlX0 + tlStep * 2 + 36} ${lineY - 55}) rotate(-6)`}>
  {#if compact}
    {@const w = measure(S('label.retryFlag'), popPx) + 32}
    <rect x={-w / 2} y={-popPx * 0.7} width={w} height={popPx * 1.4} rx="13" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
    <Text x="0" y={popPx * 0.36} text={S('label.retryFlag')} size={popPx} kind="big" colour="var(--brick)" />
  {:else}
    <rect x="-47" y="-22" width="94" height="44" rx="13" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
    <Text x="0" y="8" text={S('label.retryFlag')} size={portrait ? 22 : 20} kind="big" colour="var(--brick)" />
  {/if}
</g>
<g transform={`translate(${ackX} ${lineY - (portrait ? 96 : 82)})`} opacity={st.air.ack ? 1 : 0}>
  <rect x={-ackW / 2} y={compact ? -popPx * 0.8 : -34} width={ackW} height={compact ? popPx * 1.6 : 68} rx="20" fill="var(--leaf)" stroke="var(--line)" stroke-width="4" />
  <text x="0" y={compact ? popPx * 0.36 : 9} text-anchor="middle" font-family="var(--label-font)" font-size={compact ? popPx : portrait ? 28 : 24} font-weight="900" fill="var(--leaf-ink)">{ackText}</text>
</g>
{#if !portrait && !compact}<Text x={c1.x + c1.w / 2} y={c1.y + c1.h - 27} text={technical ? fill(S('label.technicalStrip'), { seq: down ? '0x7c10' : '0x0a30' }) : S('label.simpleStrip')} size={20} kind={technical ? 'small' : 'big'} colour="var(--brick)" />{/if}

<!-- nodes on the road -->
<Node id={phoneHop.node.id} x={L.phone.x} y={L.phone.y} size={L.phone.size} focused={focusId === phoneHop.id} />
<g opacity="0.45"><Node id={neighbour} x={L.laptop.x} y={L.laptop.y} size={L.laptop.size} /></g>
<Node id={apHop.node.id} x={L.ap.x} y={L.ap.y} size={L.ap.size} focused={focusId === apHop.id} />
<Node id={routerHop.node.id} x={L.router.x} y={L.router.y} size={L.router.size} />
{#if !compact}
  {#if portrait}
    {#if focusId === phoneHop.id}<Text x={nameX(L.phone.x, nameOf(phoneHop), 31)} y={L.names - 20} text={nameOf(phoneHop)} size="38" kind="big" />{/if}
    {#if focusId === apHop.id}<Text x={nameX(L.ap.x, nameOf(apHop), 34)} y={L.names + 28} text={nameOf(apHop)} size="38" kind="big" />{/if}
  {:else}
    <Text x={nameX(L.phone.x, nameOf(phoneHop), T.text)} y={L.names} text={nameOf(phoneHop)} size={focusId === phoneHop.id ? T.big : T.text} kind={focusId === phoneHop.id ? 'big' : 'node'} />
    <Text x={nameX(L.ap.x, nameOf(apHop), T.big)} y={L.names} text={nameOf(apHop)} size={focusId === apHop.id ? T.big : T.text} kind={focusId === apHop.id ? 'big' : 'node'} />
    <Text x={nameX(L.router.x, nameOf(routerHop), T.text)} y={L.names} text={nameOf(routerHop)} size={T.text} kind="node" />
  {/if}
{:else if !(st.walk?.swapping && focusId === apHop.id)}
  <!-- (the swap's words take this spot for a moment) -->
  <Text x={nameX(focusId === phoneHop.id ? L.phone.x : L.ap.x, nameOf(ctx.to), T.big)} y={L.names} text={nameOf(ctx.to)} size={T.big} kind="big" />
{/if}

{#if st.walk}
  <g transform="translate({st.walk.x} {st.walk.y + bob(clock, !st.walk.swapping)}) scale({T.envelope})">
    <Envelope x={0} y={0} scale={portrait ? 0.48 : 0.58} kind={st.walk.kind === 'cable' ? 'cable' : 'radio'} rows={[]} walking time={clock} open={st.walk.swapping} />
    {#if st.walk.swapping}
      <Text x="0" y="102" text={swapText} size="26" kind="big" colour="var(--brick)" />
    {/if}
  </g>
{/if}

{#each tagTexts.slice(0, L.tags.length) as tag, i}
  <TagAt x={L.tags[i].x} y={L.tags[i].y} text={tag} size={T.tag} />
{/each}
