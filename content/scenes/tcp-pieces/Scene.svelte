<svelte:options namespace="svg" />
<script lang="ts">
  import { Node, TagAt, Text, fill, nameOf, strings, view, type LayerSubject } from '$core/api';
  import Box from './art/Box.svelte';
  import Card from './art/Card.svelte';
  import Pothole from './art/Pothole.svelte';
  import RoadBox from './art/RoadBox.svelte';
  import Ticket from './art/Ticket.svelte';
  import { ackTicket, ackX, cardGap, cardLabels, dupAcks, handshakeTicket, helloSpot, layoutFor, phase, roadX, serverBox, shelfBox, shelfFilled, ticketW, travellingBox, windowStart } from './tcp';

  let { subject, time }: { subject: LayerSubject; time: number } = $props();
  const S = strings('scene.tcp-pieces');
  const ctx = $derived(subject.ctx);
  const L = $derived(layoutFor(view.orient, view.vp));
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(view.orient === 'landscape' && !L.endNames);
  const serverFocus = $derived(subject.open && ctx.to.id === ctx.server.id);
  const clientFocus = $derived(subject.open && !serverFocus);
  const technical = $derived(ctx.level === 'technical');
  const clientSpot = $derived(subject.open ? (clientFocus ? L.home[0] : L.ends[0]) : L.ends[0]);
  const serverSpot = $derived(subject.open ? (serverFocus ? L.home[1] : L.ends[1]) : L.ends[1]);
  const hopSpot = $derived(subject.open ? null : L.hop);
  const beat = $derived(phase(time));
  const moving = $derived(travellingBox(time));
  const ack = $derived(ackTicket(time));
  const win = $derived(windowStart(time));
  const natSticker = $derived(ctx.nat ? `${ctx.nat.insidePort}↔${ctx.nat.outsidePort}` : '');
  const tagA = $derived(beat === 'handshake' ? S('tag.syn') : beat === 'send' ? S('tag.window') : beat === 'loss' ? fill(S('tag.dupAck'), { n: Math.max(1, dupAcks(time)) }) : beat === 'resend' ? S('tag.fast') : S('tag.order'));
  const tagB = $derived(ctx.nat ? (technical ? S('tag.nat').replace('{nat}', natSticker) : S('label.port')) : S('tag.seal'));
  const labels = $derived(cardLabels(time));
  const hello = $derived(helloSpot(L, portrait, clientSpot, hopSpot ?? serverSpot));
  const gap = $derived(cardGap(L.cards[0], portrait));

  function roadBoxX(): number | null {
    if (moving.x === null) return null;
    if (moving.lost && moving.x > 0.52) return L.pothole.x;
    return roadX(L, moving.x);
  }

  /** Keep a ticket inside the panel, and beside (not behind) the focused end. */
  function ticketX(x: number, text: string): number {
    const half = ticketW(text, L.text.label) / 2;
    const min = Math.max(L.road.x0 + 20, portrait ? 0 : clientSpot.x + clientSpot.size * 0.45) + half;
    const max = Math.min(L.road.x1 - 20, portrait ? Infinity : serverSpot.x - serverSpot.size * 0.45) - half;
    return min > max ? (min + max) / 2 : Math.max(min, Math.min(max, x));
  }
  const ticketY = $derived(portrait ? L.road.y - 285 : L.road.y - 225);
</script>

<rect x={L.road.x0} y={L.road.y - 36} width={L.road.x1 - L.road.x0} height="72" rx="36" fill="var(--kraft)" stroke="var(--line)" stroke-width="6" />
<path d={`M${L.road.x0 + 50} ${L.road.y} H${L.road.x1 - 50}`} stroke="var(--paper)" stroke-width="7" stroke-dasharray="34 30" stroke-linecap="round" />

<Card x={L.cards[0].x} y={L.cards[0].y} w={L.cards[0].w} h={L.cards[0].h} tint="var(--sun)" />
<Text x={L.cards[0].x + 34} y={L.cards[0].y + (portrait ? 82 : 72)} text={S('card.server')} size={L.text.title} kind="big" anchor="start" />
<g>
  {#each [1, 2, 3, 4, 5, 6, 7, 8] as n}
    {@const p = serverBox(L.cards[0], n, portrait)}
    <Box x={p.x} y={p.y} n={n} size={L.box} opacity={n < win ? 0.42 : 1} glow={n === 5 && (beat === 'loss' || beat === 'resend')} />
  {/each}
  <rect x={serverBox(L.cards[0], win, portrait).x - L.box * 0.68} y={serverBox(L.cards[0], win, portrait).y - L.box * 0.72} width={gap * 3 + L.box * 1.36} height={L.box * 1.45} rx="18" fill="none" stroke="var(--teal)" stroke-width="8" />
  {#if labels.server}
    <Text x={L.cards[0].x + L.cards[0].w / 2} y={L.cards[0].y + L.cards[0].h - (portrait ? 52 : 36)} text={S(`label.${labels.server}`)} size={L.text.label} kind="big" colour={labels.server === 'resend' ? 'var(--berry-ink)' : 'var(--teal-ink)'} />
  {/if}
</g>

<Card x={L.cards[1].x} y={L.cards[1].y} w={L.cards[1].w} h={L.cards[1].h} tint="var(--leaf)" />
<Text x={L.cards[1].x + 34} y={L.cards[1].y + (portrait ? 82 : 72)} text={S('card.phone')} size={L.text.title} kind="big" anchor="start" />
<g>
  {#each [1, 2, 3, 4, 5, 6, 7, 8] as n}
    {@const p = shelfBox(L.cards[1], n, portrait)}
    <rect x={p.x - L.box / 2} y={p.y - L.box / 2} width={L.box} height={L.box} rx="12" fill="var(--paper)" stroke={n === 5 && !shelfFilled(time, 5) ? 'var(--berry)' : 'var(--kraft-dark)'} stroke-width={n === 5 && !shelfFilled(time, 5) ? 7 : 4} stroke-dasharray={n === 5 && !shelfFilled(time, 5) ? '10 8' : undefined} opacity="0.85" />
    {#if shelfFilled(time, n)}<Box x={p.x} y={p.y} n={n} size={L.box} />{/if}
  {/each}
  {#if labels.shelf}
    <Text x={L.cards[1].x + L.cards[1].w / 2} y={L.cards[1].y + L.cards[1].h - (portrait ? 52 : 36)} text={S(`label.${labels.shelf}`)} size={L.text.label} kind="big" colour={labels.shelf === 'ready' ? 'var(--leaf-ink)' : labels.shelf === 'lost' ? 'var(--berry-ink)' : 'var(--line)'} />
  {/if}
</g>

{#if beat === 'handshake'}
  <Text x={hello.x} y={hello.y} text={S(compact ? 'label.hello' : 'label.handshake')} size={L.text.label} kind="big" colour="var(--teal-ink)" />
{/if}

<Pothole x={L.pothole.x} y={L.pothole.y} w={L.pothole.w} h={L.pothole.h} splash={moving.lost ? 1 : 0} />

{#if beat === 'handshake' && !compact}
  {#each handshakeTicket(time) as h}
    {#if h.on}
      {@const text = S(`handshake.${h.key}`)}
      <Ticket x={ticketX(h.back ? ackX(L, h.x) : roadX(L, 1 - h.x), text)} y={ticketY} {text} size={L.text.label} />
    {/if}
  {/each}
{:else}
  {@const x = roadBoxX()}
  {#if x !== null && moving.n}
    <RoadBox {x} y={L.road.y - 2} n={moving.n} sealed={!subject.open} glow={moving.glow} scale={L.parcel} port={!subject.open && ctx.nat && Math.abs(x - L.hop.x) < (portrait ? 135 : 170) ? (technical ? natSticker : S('label.port')) : ''} />
  {/if}
{/if}

{#if ctx.nat && !subject.open}
  <g transform="translate({L.hop.x + (portrait ? 138 : 145)} {L.hop.y - (portrait ? 40 : 45)}) rotate(-12)">
    <circle r="42" fill="var(--paper)" opacity="0.65" stroke="var(--line)" stroke-width="7" />
    <path d="M30 30 L68 68" stroke="var(--line)" stroke-width="9" stroke-linecap="round" />
  </g>
{/if}

<Node id={ctx.client.node.id} x={clientSpot.x} y={clientSpot.y} size={clientSpot.size} focused={clientFocus} />
<Node id={ctx.server.node.id} x={serverSpot.x} y={serverSpot.y} size={serverSpot.size} focused={serverFocus} />
{#if hopSpot}<Node id={ctx.to.node.id} x={hopSpot.x} y={hopSpot.y} size={hopSpot.size} focused />{/if}
{#if view.orient === 'landscape'}
  {#if L.endNames}
    <Text x={clientSpot.x} y={L.names} text={nameOf(ctx.client)} size={L.text.label} kind="node" fit />
    <Text x={serverSpot.x} y={L.names} text={nameOf(ctx.server)} size={L.text.label} kind="node" fit />
  {/if}
  {#if hopSpot}<Text x={hopSpot.x} y={L.names} text={nameOf(ctx.to)} size={L.text.title} kind="big" fit />{:else if !L.endNames}<Text x={ctx.to.id === ctx.server.id ? serverSpot.x : clientSpot.x} y={L.names} text={nameOf(ctx.to)} size={L.text.title} kind="big" fit />{/if}
{/if}

{#if beat !== 'handshake' && ack.x !== null && !compact}
  {@const text = S(`ack.${ack.text}`)}
  <Ticket x={ticketX(ackX(L, ack.x), text)} y={ticketY} {text} size={L.text.label} green />
{/if}

{#if view.orient === 'landscape'}
  {#if L.tags[0]}<TagAt x={L.tags[0].x} y={L.tags[0].y} text={tagA} size={L.text.tag} />{/if}
  {#if !subject.open && L.tags[1]}<TagAt x={L.tags[1].x} y={L.tags[1].y} text={tagB} size={L.text.tag} />{/if}
{:else if L.tags[0]}
  <TagAt x={L.tags[0].x} y={L.tags[0].y} text={subject.open ? tagA : tagB} size={L.text.tag} />
{/if}
