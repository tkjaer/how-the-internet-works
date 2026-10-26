<svelte:options namespace="svg" />
<script lang="ts">
  import { Node, TagAt, Text, legibleSize, nameOf, strings, view, type LayerSubject } from '$core/api';
  import Bars from './art/Bars.svelte';
  import Card from './art/Card.svelte';
  import Cloud from './art/Cloud.svelte';
  import File from './art/File.svelte';
  import Film from './art/Film.svelte';
  import Locked from './art/Locked.svelte';
  import Note from './art/Note.svelte';
  import { SEEN, bulk, httpMoment, layoutFor, lerp, seenSoFar, walkerX, type Quality, type Where } from './http';

  let { subject, time }: { subject: LayerSubject; time: number } = $props();
  const S = strings('scene.http-chunk');
  const legible = legibleSize();
  const ctx = $derived(subject.ctx);
  const L = $derived(layoutFor(view.orient, view.vp));
  const T = $derived(L.size);
  const portrait = $derived(view.orient === 'portrait');
  const technical = $derived(ctx.level === 'technical');
  const flow = $derived(subject.route.activity.flows.find((f) => f.id === ctx.flow));
  // HTTP inside TLS is locked at every hop between the ends; plain HTTP (1995, 2010) could be read on the way
  const lock = $derived(!!flow?.stack.includes('tls'));
  // a web page (1995) instead of a video: the page, then the picture on it, both read from the server's disk; no
  // quality to pick, no cache and no main copy far away
  const page = $derived(!!flow?.packets.some((p) => p.kind === 'page'));
  const where: Where = $derived(subject.open ? (ctx.to.id === ctx.server.id ? 'server' : 'client') : 'middle');
  const clientSpot = $derived(where === 'client' ? L.home[0] : L.ends[0]);
  const serverSpot = $derived(where === 'server' ? L.home[1] : L.ends[1]);
  const m = $derived(httpMoment(time));
  const file = $derived(m.chunk === 42 ? 'page' : 'picture');
  const [ask, answer] = $derived(L.cards);
  const titleY = (c: { y: number }) => c.y + (portrait ? 75 : L.compact ? 72 : 66);
  const top = (c: { y: number }) => c.y + L.head;
  const bottom = (c: { y: number; h: number }) => c.y + c.h - (portrait || L.compact ? 84 : 66);
  const statusY = (c: { y: number; h: number }) => c.y + c.h - (portrait || L.compact ? 30 : 24);

  // the request slip, and beside it how fast the connection is
  const meterW = $derived(page ? -20 : portrait ? 180 : L.compact ? 190 : 170);
  const slip = $derived({ x: ask.x + 30, y: top(ask), w: ask.w - 80 - meterW, h: bottom(ask) - top(ask) });
  const mono = $derived(legible(T.mono));
  const path = (n: number, q: Quality) => `/video/${q === 'med' ? '720p' : '360p'}/${n}.m4s`;
  // the whole request line if it fits the slip at a legible size, else just the chunk and its quality
  const fileName = $derived(file === 'page' ? '/index.html' : '/picture.gif');
  const fullLines = $derived(page ? [`GET ${fileName} HTTP/1.0`, `Accept: ${file === 'page' ? 'text/html' : 'image/gif'}`] : [`GET ${path(m.chunk, m.quality)}`, 'Host: video.example']);
  const slipLines = $derived(!L.compact && fullLines.every((l) => l.length * 0.6 * mono <= slip.w - 40)
    ? fullLines
    : page ? [`GET ${fileName}`, 'HTTP/1.0'] : [`GET …/${m.chunk}.m4s`, m.quality === 'med' ? '720p' : '360p']);
  const askStatus = $derived(page ? '' : m.beat === 'slower' ? S('status.slower') : m.beat === 'play' ? S('status.play') : '');

  // the cache shelf at the server, the main copy far away, and the status stamp
  const shelf = $derived({ x: answer.x + 30, y: top(answer), w: answer.w * 0.56, h: bottom(answer) - top(answer) });
  const side = $derived({ x: shelf.x + shelf.w + 20, w: answer.x + answer.w - 30 - (shelf.x + shelf.w + 20) });
  const slotW = $derived(shelf.w / 3);
  const plankY = $derived(shelf.y + shelf.h - 14);
  const filmK = $derived(Math.min(slotW * 0.84 / 144, shelf.h * 0.8 / 96));
  const slots = [{ n: 41, q: 'med' }, { n: 42, q: 'med' }, { n: 43, q: 'low' }] as const;
  const slotAt = (i: number, q: Quality) => ({ x: shelf.x + slotW * (i + 0.5), y: plankY - 48 * filmK * bulk({ kind: 'chunk', quality: q }) - 4 });
  const cloud = $derived({ x: side.x + side.w / 2, y: shelf.y + (portrait ? 60 : 50) });
  const stamp = $derived({ x: side.x + side.w / 2, y: bottom(answer) - (portrait ? 46 : L.compact ? 48 : 36) });
  const missing = $derived(m.beat === 'miss' && m.look > 0 && !m.stored);
  const shelfStatus = $derived(page ? (m.look > 0 ? S('shelf.disk') : '') : m.beat === 'hit' && m.look > 0 ? S('shelf.hit') : m.beat === 'miss' ? (m.stored ? S('shelf.kept') : m.fetch > 0 ? S('shelf.fetch') : m.look > 0 ? S('shelf.miss') : '') : '');

  // a sealed hop: what goes by, and how big
  const seen = $derived(seenSoFar(time));
  const seenW = $derived((ask.w - 60) / SEEN.length);
  const sizeWord = (w: (typeof SEEN)[number]) => S(`size.${w.kind === 'ask' ? 'ask' : w.quality}`);

  const walker = $derived(m.walker);
  const wx = $derived(walker ? walkerX(walker, L, where, page) : 0);
  const wk = $derived(walker ? L.parcel * bulk(walker, page) : 1);
  const names = $derived(view.orient === 'landscape' && L.endNames);
  const tags = $derived(L.tags[where]);
  const focusedSpot = $derived(where === 'client' ? clientSpot : where === 'server' ? serverSpot : L.hop);
</script>

<!-- THESIS: HTTP is a polite request slip and a stamped answer; the player picks the next chunk's quality from how fast
     the last one came. STORY: the ends read the slip, the shelf (cache hit, then a miss fetched from the main copy) and
     the 200 OK; every other hop sees locked boxes and only their sizes. -->
<rect x={L.road.x0} y={L.road.y - 36} width={L.road.x1 - L.road.x0} height="72" rx="36" fill="var(--kraft)" stroke="var(--line)" stroke-width="6" />
<path d={`M${L.road.x0 + 50} ${L.road.y} H${L.road.x1 - 50}`} stroke="var(--paper)" stroke-width="7" stroke-dasharray="34 30" stroke-linecap="round" />

{#if subject.open}
  <Card x={ask.x} y={ask.y} w={ask.w} h={ask.h} tint="var(--sun)" />
  <Text x={ask.x + 34} y={titleY(ask)} text={S('card.ask')} size={T.big} kind="big" anchor="start" />
  <rect x={slip.x} y={slip.y} width={slip.w} height={slip.h} rx="14" fill="var(--paper-white)" stroke="var(--line)" stroke-width="5" />
  <rect x={slip.x + 3} y={slip.y + 3} width={slip.w - 6} height="18" rx="10" fill="var(--sun)" />
  {#if technical}
    {#each slipLines as line, i}
      <text x={slip.x + 20} y={slip.y + 22 + (slip.h - 22) * (i + 1) / (slipLines.length + 1) + mono * 0.35} font-family="var(--mono-font)" font-size={mono} font-weight={i ? 600 : 800} fill="var(--line)" opacity={m.write}>{line}</text>
    {/each}
  {:else}
    {#if page}
      <Text x={slip.x + slip.w / 2} y={slip.y + 22 + (slip.h - 22) * 0.55} text={S(`slip.${file}`)} size={T.big} kind="big" />
    {:else}
      <Text x={slip.x + slip.w / 2} y={slip.y + 22 + (slip.h - 22) * 0.4} text={S('slip.chunk').replace('{n}', `${m.chunk}`)} size={T.big} kind="big" />
      <Text x={slip.x + slip.w / 2} y={slip.y + 22 + (slip.h - 22) * 0.78} text={S(`slip.${m.quality}`)} size={T.text} kind="node" colour={m.quality === 'low' ? 'var(--berry-ink)' : 'var(--teal-ink)'} />
    {/if}
  {/if}
  {#if !page}
    {@const mx = slip.x + slip.w + 20 + meterW / 2}
    {@const barsH = slip.h * 0.5}
    <Bars x={mx + barsH * 0.13} y={slip.y + 6} h={barsH} bars={m.bars} />
    <Text x={mx} y={slip.y + barsH + 6 + T.text * 1.25} text={S(m.bars > 2 ? 'meter.fast' : 'meter.slow', L.compact ? 'simple' : undefined)} size={L.compact ? T.text : T.text * 0.85} kind="node" />
  {/if}
  {#if askStatus}<Text x={ask.x + ask.w / 2} y={statusY(ask)} text={askStatus} size={T.status} kind="big" colour={m.beat === 'play' ? 'var(--leaf-ink)' : 'var(--berry-ink)'} />{/if}

  <Card x={answer.x} y={answer.y} w={answer.w} h={answer.h} tint="var(--berry)" />
  <Text x={answer.x + 34} y={titleY(answer)} text={S('card.answer')} size={T.big} kind="big" anchor="start" />
  <path d={`M${shelf.x} ${plankY} H${shelf.x + shelf.w}`} stroke="var(--wood)" stroke-width="12" stroke-linecap="round" />
  {#if page}
    {#each ['page', 'picture'] as const as f, i}
      {@const k = filmK * bulk({ kind: 'chunk', quality: 'med' })}
      <File x={shelf.x + shelf.w * (i + 0.5) / 2} y={plankY - 48 * k - 4} file={f} scale={k} glow={m.look > 0 && f === file} />
    {/each}
  {:else}
  {#each slots as s, i}
    {@const p = slotAt(i, s.q)}
    {@const k = filmK * bulk({ kind: 'chunk', quality: s.q })}
    {#if s.n !== 43 || m.stored}
      <Film x={p.x} y={p.y} scale={k} glow={(s.n === 42 && m.beat === 'hit' && m.look > 0) || (s.n === 43 && m.beat === 'miss')} />
      <Text x={p.x} y={p.y + T.text * 0.34} text={`${s.n}`} size={T.text} kind="big" />
    {:else}
      <rect x={p.x - 72 * k} y={p.y - 48 * k} width={144 * k} height={96 * k} rx="12" fill="none" stroke={missing ? 'var(--berry-dark)' : 'var(--kraft-dark)'} stroke-width={missing ? 6 : 4} stroke-dasharray="10 8" />
      <Text x={p.x} y={p.y + T.text * 0.34} text={missing ? '?' : `${s.n}`} size={T.text} kind="big" colour={missing ? 'var(--berry-ink)' : undefined} />
    {/if}
  {/each}
  <Cloud x={cloud.x} y={cloud.y} scale={Math.min(1, side.w / 190)} busy={m.beat === 'miss' && !m.stored} />
  {#if !L.compact && !m.ok && !m.fetch}<Text x={cloud.x} y={cloud.y + 50 + T.text * 0.9} text={S('origin')} size={T.text * 0.85} kind="node" />{/if}
  {#if m.fetch > 0 && m.fetch < 1}
    {@const to = slotAt(2, 'low')}
    <Film x={lerp(cloud.x, to.x, m.fetch)} y={lerp(cloud.y, to.y, m.fetch)} scale={filmK * bulk({ kind: 'chunk', quality: 'low' })} />
  {/if}
  {/if}
  {#if m.ok > 0}
    {@const w = Math.min(side.w, T.big * 4.2)}
    <g transform="translate({stamp.x} {stamp.y}) rotate(-8) scale({1.35 - 0.35 * m.ok})">
      <rect x={-w / 2} y={-T.big * 0.8} width={w} height={T.big * 1.6} rx="14" fill="var(--paper-white)" stroke="var(--leaf-dark)" stroke-width="7" />
      <Text x={0} y={T.big * 0.34} text="200 OK" size={T.big} kind="big" colour="var(--leaf-ink)" />
    </g>
  {/if}
  {#if shelfStatus}<Text x={answer.x + answer.w / 2} y={statusY(answer)} text={shelfStatus} size={T.status} kind="big" colour={page || m.beat === 'hit' || m.stored ? 'var(--leaf-ink)' : 'var(--berry-ink)'} />{/if}
{:else}
  <Card x={ask.x} y={ask.y} w={ask.w} h={ask.h} tint="var(--kraft-dark)" />
  <Text x={ask.x + 34} y={titleY(ask)} text={S('card.seen')} size={T.big} kind="big" anchor="start" />
  {#each SEEN as w, i}
    {@const x = ask.x + 30 + seenW * (i + 0.5)}
    {@const k = Math.min(seenW * 0.8 / 144, 0.85) * bulk(w, page)}
    {@const y = bottom(ask) - T.status * 1.4 - 48 * k}
    {#if i < seen}
      <Locked {x} {y} scale={k} {lock} />
    {:else}
      <rect x={x - 72 * k} y={y - 48 * k} width={144 * k} height={96 * k} rx="12" fill="none" stroke="var(--kraft-dark)" stroke-width="4" stroke-dasharray="10 8" />
    {/if}
    <Text x={x} y={top(ask) + T.big * 0.5} text={w.kind === 'ask' ? '→' : '←'} size={T.big} kind="big" />
    <Text x={x} y={bottom(ask) - T.status * 0.2} text={sizeWord(w)} size={T.status} kind="node" />
  {/each}
  {#if seen === SEEN.length}<Text x={ask.x + ask.w / 2} y={statusY(ask)} text={S('status.guess')} size={T.status} kind="big" colour="var(--berry-ink)" />{/if}

  <Card x={answer.x} y={answer.y} w={answer.w} h={answer.h} tint="var(--kraft-dark)" />
  <Text x={answer.x + 34} y={titleY(answer)} text={S('card.locked')} size={T.big} kind="big" anchor="start" />
  {@const lw = Math.min(answer.w - 60, 520)}
  {@const lx = answer.x + (answer.w - lw) / 2}
  {@const ly = top(answer)}
  {@const lh = bottom(answer) - ly}
  <rect x={lx} y={ly} width={lw} height={lh} rx="14" fill="var(--kraft)" stroke="var(--line)" stroke-width="5" />
  {#if lock}
    <path d={`M${lx + 40} ${ly + lh * 0.35} c40 -26 70 20 110 0 s70 -20 110 0 M${lx + 40} ${ly + lh * 0.68} c40 -26 70 20 110 0 s70 -20 110 0`} fill="none" stroke="var(--line)" stroke-width="6" stroke-linecap="round" opacity="0.7" />
    <g transform="translate({lx + lw - 90} {ly + lh / 2 - 10}) scale({Math.min(1.6, lh / 110)})">
      <path d="M-20 4 V-10 C-20 -34 20 -34 20 -10 V4" fill="none" stroke="var(--line)" stroke-width="8" stroke-linecap="round" />
      <rect x="-32" y="0" width="64" height="48" rx="10" fill="var(--muted)" stroke="var(--line)" stroke-width="6" />
      <circle cy="24" r="7" fill="var(--paper)" />
    </g>
  {:else}
    <path d={`M${lx + 40} ${ly + lh * 0.3} H${lx + lw - 40} M${lx + 40} ${ly + lh * 0.52} H${lx + lw - 90} M${lx + 40} ${ly + lh * 0.74} H${lx + lw - 60}`} fill="none" stroke="var(--line)" stroke-width="6" stroke-linecap="round" opacity="0.7" />
  {/if}
  <Text x={answer.x + answer.w / 2} y={statusY(answer)} text={S('status.locked')} size={T.status} kind="big" />
{/if}

<Node id={ctx.client.node.id} x={clientSpot.x} y={clientSpot.y} size={clientSpot.size} focused={where === 'client'} />
<Node id={ctx.server.node.id} x={serverSpot.x} y={serverSpot.y} size={serverSpot.size} focused={where === 'server'} />
{#if where === 'middle'}<Node id={ctx.to.node.id} x={L.hop.x} y={L.hop.y} size={L.hop.size} focused />{/if}
{#if names}
  <Text x={clientSpot.x} y={L.names} text={nameOf(ctx.client)} size={T.text} kind={where === 'client' ? 'big' : 'node'} fit />
  <Text x={serverSpot.x} y={L.names} text={nameOf(ctx.server)} size={T.text} kind={where === 'server' ? 'big' : 'node'} fit />
  {#if where === 'middle'}<Text x={L.hop.x} y={L.names} text={nameOf(ctx.to)} size={T.big} kind="big" fit />{/if}
{:else}
  <Text x={focusedSpot.x} y={L.names} text={nameOf(ctx.to)} size={T.big} kind="big" fit />
{/if}

{#if walker}
  {#if !subject.open}
    <Locked x={wx} y={L.walk} scale={wk} {lock} />
    {#if Math.abs(wx - L.hop.x) > L.hop.size / 2 + 72 * wk}<Text x={wx} y={L.walk - 48 * wk - 20} text={sizeWord(walker)} size={T.text} kind="big" />{/if}
  {:else if walker.kind === 'ask'}
    <Note x={wx} y={L.walk} scale={wk * 1.3} />
    {#if !page}<Text x={wx} y={L.walk + 4 * wk + T.text * 0.34} text={`${m.chunk}`} size={T.text} kind="big" />{/if}
  {:else if page}
    <File x={wx} y={L.walk} {file} scale={wk} />
  {:else}
    <Film x={wx} y={L.walk} scale={wk} />
    <Text x={wx} y={L.walk + T.text * 0.34} text={`${m.chunk}`} size={T.text} kind="big" />
  {/if}
{/if}

{#if subject.open && page && tags.length}
  {#if view.orient === 'landscape' && tags.length >= 2}<TagAt x={tags[0].x} y={tags[0].y} text={S('tag.request')} size={T.tag} fit />{/if}
  <TagAt x={tags.at(-1)!.x} y={tags.at(-1)!.y} text={S(`tag.${file}`)} size={T.tag} fit />
{:else if view.orient === 'landscape' && tags.length >= 2}
  <TagAt x={tags[0].x} y={tags[0].y} text={S(subject.open ? (m.beat === 'slower' ? 'tag.rate' : 'tag.mpd') : 'tag.length')} size={T.tag} fit />
  <TagAt x={tags[1].x} y={tags[1].y} text={S(subject.open ? (m.beat === 'hit' ? 'tag.hit' : m.beat === 'miss' ? 'tag.miss' : 'tag.range') : 'tag.guess')} size={T.tag} fit />
{:else if tags.length}
  <TagAt x={tags[0].x} y={tags[0].y} text={S(subject.open ? (m.beat === 'miss' ? 'tag.miss' : m.beat === 'slower' ? 'tag.rate' : m.beat === 'hit' ? 'tag.hit' : 'tag.range') : 'tag.length')} size={T.tag} fit />
{/if}
