<svelte:options namespace="svg" />
<script lang="ts">
  import { Node, TagAt, Text, nameOf, strings, view, type LayerSubject } from '$core/api';
  import { layoutFor, paintRows, parcelX, ramp, tlsMoment } from './tls';
  import Card from './art/Card.svelte';
  import Certificate from './art/Certificate.svelte';
  import Crow from './art/Crow.svelte';
  import LockedParcel from './art/LockedParcel.svelte';
  import Pot from './art/Pot.svelte';
  import StickerBook from './art/StickerBook.svelte';

  let { subject, time }: { subject: LayerSubject; time: number } = $props();
  const S = strings('scene.tls-lock');
  const L = $derived(layoutFor(view.orient, view.vp));
  const T = $derived(L.size);
  // Technical shows TLS 1.3's order: the keys first, then the (encrypted) certificate, so the paint card comes first
  const keysFirst = $derived(subject.ctx.level === 'technical');
  const m = $derived(tlsMoment(time, keysFirst));
  const isServer = $derived(subject.open && subject.ctx.to.node.id === subject.ctx.server.node.id);
  const endpoint = $derived(subject.open ? (isServer ? 'server' : 'client') : 'middle');
  const client = $derived(subject.ctx.client);
  const server = $derived(subject.ctx.server);
  const focused = $derived(endpoint === 'client' ? L.home[0] : endpoint === 'server' ? L.home[1] : L.hop);
  const focusedId = $derived(endpoint === 'client' ? client.node.id : endpoint === 'server' ? server.node.id : subject.ctx.to.node.id);
  const ends = $derived(endpoint === 'client' ? [L.ends[1]] : endpoint === 'server' ? [L.ends[0]] : L.ends);
  const endHops = $derived(endpoint === 'client' ? [server] : endpoint === 'server' ? [client] : [client, server]);
  const cert = $derived(L.cards[keysFirst ? 1 : 0]);
  const mix = $derived(L.cards[keysFirst ? 0 : 1]);
  const px = $derived(parcelX(m.u, L, endpoint));
  const titleY = (b: { y: number }) => b.y + (view.orient === 'portrait' ? 75 : L.compact ? 72 : 66);
  const clientLabel = $derived(nameOf(client));
  const serverLabel = $derived(S('label.server'));
  const P = $derived(paintRows(L, mix, view.orient, Math.max(clientLabel.length, serverLabel.length)));
  const crow = $derived(endpoint === 'middle'
    ? L.crow
    : { x: view.orient === 'portrait' ? (endpoint === 'server' ? 340 : 560) : 800, y: view.orient === 'portrait' ? 1145 : L.compact ? 625 : 505 });
  const wire = $derived(endpoint === 'middle'
    ? L.wire
    : { x1: crow.x - (view.orient === 'portrait' ? 140 : 200), x2: crow.x + (view.orient === 'portrait' ? 140 : 200), y: crow.y });
  const crowScale = $derived(view.orient === 'portrait' ? 1.15 : 1);
  const crowLabelSize = $derived(view.orient === 'portrait' ? T.text * 0.76 : T.text);
  // The crow's words go on the side away from the focused node.
  const crowRight = $derived(view.orient === 'portrait' && endpoint === 'server');
  const crowLabelX = $derived(crowRight ? crow.x + 90 : crow.x - (view.orient === 'portrait' ? 90 : 100));
  const crowLabelY = $derived(view.orient === 'portrait' ? 1084 : endpoint === 'middle' ? crow.y - 58 : crow.y + 40);
  const brown = 'var(--muted)';
  // each side's secret, and the public mix of it with the sun yellow: a pale blend that doesn't give the secret away
  const secrets = ['var(--accent)', 'var(--leaf)'];
  const mixes = ['var(--paint-peach)', 'var(--paint-lime)'];
  function roadName(h: LayerSubject['ctx']['client']) {
    if (view.orient === 'landscape') return nameOf(h);
    if (h.id === server.id || h.node.id === 'cdn') return S('label.server');
    if (h.node.id === 'router') return S('label.router');
    if (h.node.id === 'mobile-core') return S('label.core');
    return nameOf(h);
  }
</script>

<!-- THESIS: TLS is a three-beat secret handshake: prove the server and mix a shared colour (Technical shows the TLS 1.3 order: keys first, then the encrypted certificate), then lock the parcel. OWN-WORLD: the IP dive family staging, pinned paper cards over a straight road, storybook ink and big props. STORY: endpoints open TLS; middle hops and the crow see only public mixes (pale blends, never a secret colour) and locked parcels. FIRST VIEWPORT: client/server/hop on the bottom road; ID card and paint-mixing cards above. FORM: issue-brief layer-dive staging with a deterministic 16s loop. -->
<rect x={L.road.x0} y={L.road.y - 36} width={L.road.x1 - L.road.x0} height="72" rx="36" fill="var(--kraft)" stroke="var(--line)" stroke-width="6" />
<path d={`M${L.road.x0 + 50} ${L.road.y} H${L.road.x1 - 50}`} stroke="var(--paper)" stroke-width="7" stroke-dasharray="34 30" stroke-linecap="round" />

<Card x={cert.x} y={cert.y} w={cert.w} h={cert.h} tint="var(--sun)" />
<Text x={cert.x + 34} y={titleY(cert)} text={S(L.compact ? 'label.proveShort' : 'label.prove')} size={T.big} kind="big" anchor="start" />
<g opacity={m.beat === 'id' ? 1 : 0.48}>
  {#if view.orient === 'landscape'}
    <Certificate x={cert.x + (L.compact ? 38 : 40)} y={cert.y + (L.compact ? 96 : 86)} w={L.compact ? 300 : 275} h={L.compact ? 180 : 160} ok={ramp(m.idT, 1.0, 2.3)} />
    <StickerBook x={cert.x + (L.compact ? 360 : 350)} y={cert.y + (L.compact ? 96 : 86)} w={L.compact ? 300 : 238} h={L.compact ? 180 : 160} ok={ramp(m.idT, 1.2, 2.6)} />
    {#if !L.compact && m.beat !== 'id'}
      <Text x={cert.x + 178} y={cert.y + cert.h - 28} text={S('label.videoName')} size={T.text} kind="node" />
      <Text x={cert.x + 468} y={cert.y + cert.h - 28} text={S('label.stamps')} size={T.text} kind="node" />
    {/if}
  {:else}
    <Certificate x={cert.x + 45} y={cert.y + 92} w={335} h={180} ok={ramp(m.idT, 1.0, 2.3)} />
    <StickerBook x={cert.x + 405} y={cert.y + 92} w={330} h={180} ok={ramp(m.idT, 1.2, 2.6)} />
  {/if}
</g>
{#if m.beat === 'id'}<Text x={cert.x + cert.w / 2} y={cert.y + cert.h - (view.orient === 'portrait' ? 36 : L.compact ? 40 : 26)} text={S('label.tick')} size={T.text} kind="big" colour="var(--leaf-ink)" />{/if}

<Card x={mix.x} y={mix.y} w={mix.w} h={mix.h} tint="var(--teal)" />
<Text x={mix.x + 34} y={titleY(mix)} text={S(L.compact ? 'label.paintShort' : 'label.paint')} size={T.big} kind="big" anchor="start" />
{#each P.rows as y, r}
  <Text x={P.label} y={y + P.baseline} text={r === 0 ? clientLabel : serverLabel} size={P.words} kind="small" anchor="start" />
  <Pot x={P.pots[0]} y={y} colour="var(--sun)" scale={P.scale} />
  <Text x={P.signs[0]} y={y + P.baseline} text="+" size={T.big} kind="big" />
  <Pot x={P.pots[1]} y={y} colour={secrets[r]} scale={P.scale} />
  <Text x={P.signs[1]} y={y + P.baseline} text="=" size={T.big} kind="big" />
  <Pot x={P.pots[2]} y={y} colour={m.brown > 0.75 ? brown : mixes[r]} active={m.beat === 'brown'} scale={P.scale} />
{/each}

{#if endpoint === 'middle'}<line x1={crow.x} x2={crow.x} y1={crow.y + 28} y2={L.road.y - 42} stroke="var(--line)" stroke-width="7" stroke-linecap="round" opacity="0.75" />{/if}
<line x1={wire.x1} x2={wire.x2} y1={wire.y} y2={wire.y} stroke="var(--line)" stroke-width="5" stroke-linecap="round" opacity="0.65" />
<Crow x={crow.x} y={crow.y} look={m.swap} scale={crowScale} />
{#if m.beat !== 'locked' && !L.compact}
  <Text x={crowLabelX} y={crowLabelY} text={S('label.crowShort')} size={crowLabelSize} kind="big" anchor={crowRight ? 'start' : 'end'} />
{/if}
{#if m.beat === 'swap' || !subject.open}
  <Pot x={crow.x - (view.orient === 'portrait' ? 70 : 115)} y={crow.y + (view.orient === 'portrait' ? 70 : 72)} colour={mixes[0]} scale={view.orient === 'portrait' ? 0.64 : 0.82} />
  <Pot x={crow.x + (view.orient === 'portrait' ? 70 : 115)} y={crow.y + (view.orient === 'portrait' ? 70 : 72)} colour={mixes[1]} scale={view.orient === 'portrait' ? 0.64 : 0.82} />
{/if}

{#each ends as e, i}
  <Node id={endHops[i].node.id} x={e.x} y={e.y} size={e.size} />
  {#if L.endNames}<Text x={e.x} y={L.names} text={roadName(endHops[i])} size={T.text} kind="node" />{/if}
{/each}
<Node id={focusedId} x={focused.x} y={focused.y} size={focused.size} focused />
<Text x={focused.x} y={L.names} text={roadName(subject.ctx.to)} size={T.text} kind="big" />

<g transform="translate({px} {L.walk}) scale({L.parcel}) translate({-px} {-L.walk})">
  {#if m.beat === 'locked'}
    <LockedParcel x={px} y={L.walk} locked={1} scramble={!subject.open} scale={1} lockColour={brown} />
  {:else}
    <LockedParcel x={px} y={L.walk} locked={0} scramble={false} scale={0.92} />
  {/if}
</g>
{#if m.beat === 'locked' && (endpoint !== 'middle' || (view.orient === 'landscape' && Math.abs(px - L.hop.x) > L.hop.size / 2 + 60))}<Text x={px} y={L.walk - (view.orient === 'portrait' ? 118 : 145)} text={S('label.locked')} size={T.text} kind="big" />{/if}

{#if view.orient === 'landscape' && L.tags.length >= 2}
  <TagAt x={L.tags[keysFirst ? 1 : 0].x} y={L.tags[0].y} text={S('tag.chain')} size={T.tag} />
  <TagAt x={L.tags[keysFirst ? 0 : 1].x} y={L.tags[1].y} text={S('tag.ecdhe')} size={T.tag} />
{:else if L.tags.length}
  <TagAt x={L.tags[0].x} y={L.tags[0].y} text={S('tag.ecdhe')} size={T.tag} />
{/if}
