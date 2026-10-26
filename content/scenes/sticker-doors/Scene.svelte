<svelte:options namespace="svg" />
<script lang="ts">
  import { Node, Text, fakeLabel, fakeMac, fill, legibleSize, nameOf, strings, ttlAt, view, yours, type LayerSubject } from '$core/api';
  import Card from './art/Card.svelte';
  import StickerParcel from './art/StickerParcel.svelte';
  import { bob, layoutFor, moment, parcelX, ramp, type LayerKind, type RoleKind } from './sticker';

  let { subject, time }: { subject: LayerSubject; time: number } = $props();
  const S = strings('scene.sticker-doors');
  const legible = legibleSize();
  const ctx = $derived(subject.ctx);
  const technical = $derived(ctx.level === 'technical');
  const layer = $derived<LayerKind>(subject.layer === 'vlan' || subject.layer === 'mpls' ? subject.layer : 'ethernet');
  const role = $derived<RoleKind>(ctx.role);
  const L = $derived(layoutFor(view.orient, view.vp));
  const T = $derived(L.text);
  const short = (mac: string) => (L.compact ? `…${mac.slice(-8)}` : mac);
  const m = $derived(moment(view.still ? 5.4 : time));
  const x = $derived(parcelX(L, m));
  const moving = $derived(m.phase === 'arrive' || m.phase === 'reply' || m.phase === 'straight');
  const labelled = (i: number) => !!subject.route.links[i]?.stack.includes(subject.layer);
  const labelIn = $derived(labelled(ctx.to.index - 1)), labelOut = $derived(labelled(ctx.to.index));
  // the labels each next router asked for, as the packet model has them
  const inLabel = $derived(fakeLabel(ctx.to.id, 'up'));
  const outLabel = $derived(fakeLabel(subject.route.chain[ctx.to.index + 1]?.id ?? ctx.to.id, 'up'));
  const action = $derived.by(() => {
    if (layer === 'vlan') return ctx.to.id === 'bng' ? 'vlan.bng' : 'vlan.pass';
    // told the way requests go: a label on the way in and out is swapped, only on the way out pushed, only in popped
    if (layer === 'mpls') return labelIn && labelOut ? 'mpls.swap' : labelIn ? 'mpls.pop' : 'mpls.push';
    return role === 'bridge' ? 'ethernet.bridge' : 'ethernet.me';
  });
  const actionTint = $derived(layer === 'vlan' ? 'var(--teal)' : layer === 'mpls' ? 'var(--berry)' : role === 'bridge' ? 'var(--sun)' : 'var(--orange)');
  const bookTint = $derived(layer === 'vlan' ? 'var(--leaf)' : layer === 'mpls' ? 'var(--wood)' : 'var(--teal)');
  // the frame's own MACs, as the packet model has them (a bridge passes them on: they are the routers' either side)
  const srcMac = $derived(fakeMac(ctx.frame.src.id));
  const dstMac = $derived(fakeMac(ctx.frame.dst.id));
  const who = (h: LayerSubject['ctx']['to']) => (h.id === ctx.client.id ? yours(h) : nameOf(h));
  // ARP asks for the next hop on the outgoing link; an endpoint answers through its gateway, the frame's sender
  const arpHop = $derived(ctx.next ?? ctx.frame.src);
  const arpTarget = $derived(technical ? arpHop.addr ?? S(ctx.next ? 'book.nextHop' : 'book.gateway') : who(arpHop));
  const arpMac = $derived(fakeMac(arpHop.id));
  const laneRows = $derived(ctx.to.id === 'bng'
    ? [['S-VID', '101'], ['C-VID', '2042'], [S('book.owner'), technical ? S('book.subscriber') : S('book.you')]]
    : [[S('book.street'), '101'], [S('book.house'), '2042'], [S('book.otherStreet'), '102']]);
  const mplsRows = $derived(action === 'mpls.push'
    ? [['IP', `${S('book.push')} ${outLabel}`], [outLabel, `${S('book.door')} 3`]]
    : action === 'mpls.pop'
      ? [[inLabel, S('book.pop')], ['IP', S('book.readNext')]]
      : [[`${S('book.in')} ${inLabel}`, `${S('book.door')} 3`], [S('book.out'), outLabel]]);
  const bookRows = $derived.by(() => {
    if (layer === 'vlan') return laneRows;
    if (layer === 'mpls') return mplsRows;
    if (role === 'bridge') return [
      [technical ? srcMac : who(ctx.frame.src), '1'],
      [m.learned ? (technical ? dstMac : S('label.reply')) : S('label.unknown'), m.learned ? '2' : '?'],
      ...(technical ? [[S('book.age'), '~300 s']] : []),
    ];
    return [
      [arpTarget, short(m.learned ? arpMac : 'ff:ff:ff:ff:ff:ff')],
      [technical ? S('book.fcs') : S('book.check'), m.phase === 'fanout' ? S('book.drop') : 'OK'],
      ...(technical ? [['IPv6', 'NDP']] : []),
    ];
  });
  const packetSticker = $derived(layer === 'vlan' ? '101' : layer === 'mpls' ? (m.learned ? mplsRight : mplsLeft) : role === 'bridge' ? (m.learned ? '2' : '') : S('sticker.meShort'));
  const isPortrait = $derived(view.orient === 'portrait');
  const rowY = (i: number) => L.cards[1].y + (isPortrait ? 148 : L.compact ? 142 : 112) + i * (isPortrait ? 62 : L.compact ? 58 : 44);
  const doorPulse = $derived(m.phase === 'fanout' ? ramp(m.p, 0.05, 0.85) : m.phase === 'straight' ? 1 : 0);
  const peel = $derived(role !== 'bridge' && layer === 'ethernet' ? (m.phase === 'fanout' ? ramp(m.p, 0, 0.6) : m.phase === 'straight' ? 1 : 0) : 0);
  // a phone on its side: a bigger drawing and words (never under the theme's label minimum) and shorter MACs (issue #33)
  const actionScale = $derived(isPortrait ? 1.05 : L.compact ? 1.15 : 0.95);
  const actionY = $derived(L.cards[0].y + (isPortrait ? 198 : L.compact ? 186 : 158));
  const inner = (size: number, k = 1) => (L.compact ? legible(size * actionScale * k) / (actionScale * k) : size);
  const rowPx = $derived(L.compact ? legible(42) : 0);
  // each drawing is lopsided around its origin; nudge it back to the card's middle
  const actionDx = $derived(layer === 'mpls' ? 0 : layer === 'vlan' ? 10 : role === 'bridge' ? 39 : -73);
  const steps = $derived([S(`mini.${action}.a`), S(`mini.${action}.b`)].map((t) => fill(t, { in: inLabel, out: outLabel })));
  const fieldsLine = $derived(layer === 'vlan'
    ? '0x88a8 S101 · 0x8100 C2042'
    : layer === 'mpls'
      ? `${mplsLeft} → ${mplsRight} · TC 0 · S 1 · TTL ${labelTtl}`
      : `dst …${dstMac.slice(-5)} · src …${srcMac.slice(-5)} · 0x0800`);
  // the label's own TTL: the one it goes out with, or (popped) came in with
  const labelTtl = $derived(ttlAt(subject.route, labelOut ? ctx.to.index : ctx.to.index - 1, 'up', true));
  const mplsLeft = $derived(action === 'mpls.push' ? 'IP' : inLabel);
  const mplsRight = $derived(action === 'mpls.pop' ? 'IP' : outLabel);
  const mplsMid = $derived(action === 'mpls.pop' ? 'pop' : '');
</script>

<defs>
  <marker id="arrow-sticker" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 Z" fill="var(--line)" />
  </marker>
</defs>

{#snippet smallEnvelope(x0: number, y0: number, tint: string, label: string, opacity = 1, scale = 1)}
  <g transform="translate({x0} {y0}) scale({scale})" opacity={opacity}>
    <rect x="-48" y="-35" width="96" height="70" rx="12" fill={tint} stroke="var(--line)" stroke-width="5" />
    <path d="M-42 -29 L0 3 L42 -29" fill="none" stroke="var(--line)" stroke-width="4" opacity="0.65" />
    <rect x="-33" y="0" width="66" height="26" rx="6" fill="var(--paper)" stroke="var(--line)" stroke-width="3" />
    {#if label}<text x="0" y="26" text-anchor="middle" font-size={inner(label.length <= 3 ? 42 : 30, scale)} font-family="system-ui, sans-serif" font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" stroke-linejoin="round" paint-order="stroke">{label}</text>{/if}
  </g>
{/snippet}

{#snippet tinyDoorBox(x0: number, y0: number, scale = 1, vlan = false)}
  <g transform="translate({x0} {y0}) scale({scale})">
    <rect x="-125" y="-70" width="250" height="140" rx="22" fill="var(--kraft-edge)" stroke="var(--line)" stroke-width="6" />
    {#each [0, 1, 2, 3] as i}
      {@const lane = !vlan || i === 0 || i === 2}
      <rect x={-104 + i * 56} y="-22" width="42" height="70" rx="8" fill={vlan ? (lane ? 'var(--teal)' : 'var(--stone)') : 'var(--paper-2)'} stroke="var(--line)" stroke-width="4" opacity={vlan && !lane ? 0.55 : 1} />
      <text x={-83 + i * 56} y="25" text-anchor="middle" font-size={inner(39, scale)} font-family="system-ui, sans-serif" font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" stroke-linejoin="round" paint-order="stroke">{i + 1}</text>
    {/each}
  </g>
{/snippet}

<rect x={L.road.x0} y={L.road.y - 36} width={L.road.x1 - L.road.x0} height="72" rx="36" fill="var(--kraft)" stroke="var(--line)" stroke-width="6" />
<path d={`M${L.road.x0 + 50} ${L.road.y} H${L.road.x1 - 50}`} stroke="var(--paper)" stroke-width="7" stroke-dasharray="34 30" stroke-linecap="round" />

<Card x={L.cards[0].x} y={L.cards[0].y} w={L.cards[0].w} h={L.cards[0].h} tint={actionTint} />
<Text x={L.cards[0].x + 34} y={L.cards[0].y + (isPortrait || L.compact ? 82 : 62)} text={S(`card.${layer === 'mpls' ? 'label' : 'action'}`)} size={T.title * (L.compact ? 0.62 : 1)} kind="big" anchor="start" />
<g transform="translate({L.cards[0].x + L.cards[0].w / 2 + actionDx * actionScale} {actionY}) scale({actionScale})">
  {#if layer === 'ethernet' && role === 'bridge'}
    {@render tinyDoorBox(0, 8, 0.92, false)}
    {@render smallEnvelope(-170 + 38 * ramp(m.p, 0, 0.6), 0, 'var(--sun)', '', 1, 0.68)}
    {#each [-42, 15, 72] as dx, i}
      <path d={`M-64 -6 Q${-16 + i * 12} ${-88 - i * 18} ${dx} -56`} fill="none" stroke="var(--berry)" stroke-width="7" stroke-linecap="round" stroke-dasharray="16 12" opacity={doorPulse * 0.72} />
      {@render smallEnvelope(dx, -78 - i * 12, 'var(--sun)', '', doorPulse * 0.5, 0.45)}
    {/each}
    {#if m.phase === 'straight'}
      <path d="M-62 -5 C-10 -92 24 -92 18 -38" fill="none" stroke="var(--leaf-dark)" stroke-width="9" stroke-linecap="round" marker-end="url(#arrow-sticker)" />
    {/if}
  {:else if layer === 'ethernet'}
    {@render smallEnvelope(-86, 6, 'var(--orange)', '', 1, 0.88)}
    <g transform="translate({-86 - peel * 50} {-30 - peel * 8}) rotate({-18 * peel})" opacity={1 - peel * 0.35}>
      <rect x="-64" y="-28" width="128" height="56" rx="12" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
      <text x="0" y="11" text-anchor="middle" font-size={inner(36)} font-family="system-ui, sans-serif" font-weight="900" fill="var(--leaf-ink)">For ✓</text>
    </g>
    <rect x="8" y="-80" width="124" height="58" rx="16" fill="var(--paper)" stroke="var(--line)" stroke-width="5" />
    <text x="70" y="-41" text-anchor="middle" font-size={inner(L.compact ? 36 : 34)} font-family="system-ui, sans-serif" font-weight="900" fill="var(--leaf-ink)">FCS ✓</text>
    <g opacity={m.phase === 'lookup' || m.phase === 'fanout' ? 1 : 0.45}>
      <path d="M-8 42 C42 96 117 84 145 42" fill="none" stroke="var(--teal)" stroke-width="8" stroke-linecap="round" stroke-dasharray="18 14" />
      <rect x="8" y="40" width="285" height="58" rx="18" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
      <text x="150" y="78" text-anchor="middle" font-size={inner(36)} font-family="system-ui, sans-serif" font-weight="900" fill="var(--line)">{S('label.whoHasShort')}</text>
      <rect x="224" y="-24" width="72" height="56" rx="16" fill="var(--leaf)" stroke="var(--line)" stroke-width="4" opacity={m.phase === 'fanout' || m.phase === 'straight' ? 1 : 0.25} />
      <path d="M243 5 L256 18 L278 -10" fill="none" stroke="var(--line)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity={m.phase === 'fanout' || m.phase === 'straight' ? 1 : 0.25} />
    </g>
  {:else if layer === 'vlan'}
    {@render tinyDoorBox(0, 16, 0.92, true)}
    {@render smallEnvelope(-150, 0, 'var(--teal)', '101', 1, 0.85)}
    <path d="M-74 0 C-24 -74 42 -74 66 -38" fill="none" stroke="var(--teal)" stroke-width="9" stroke-linecap="round" opacity={0.9} />
    <path d="M-72 -4 C-12 74 90 74 84 25" fill="none" stroke="var(--stone)" stroke-width="7" stroke-linecap="round" stroke-dasharray="12 12" opacity="0.35" />
    {#if action === 'vlan.bng'}
      <g transform="translate(104 -55) rotate(-8)">
        <rect x="-54" y="-26" width="108" height="52" rx="12" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
        <text x="0" y="9" text-anchor="middle" font-size={inner(L.compact ? 36 : 30)} font-family="system-ui, sans-serif" font-weight="900" fill="var(--line)">TAGS</text>
      </g>
      <path d="M62 -28 Q102 -84 143 -55" fill="none" stroke="var(--berry)" stroke-width="7" stroke-linecap="round" />
    {/if}
  {:else}
    <g transform="translate(-110 -6)">
      <path d="M-100 44 H115" stroke="var(--line)" stroke-width="16" stroke-linecap="round" />
      <path d="M-90 44 H105" stroke="var(--paper)" stroke-width="5" stroke-dasharray="18 14" stroke-linecap="round" />
      <rect x="-112" y="-58" width="166" height="64" rx="16" fill={action === 'mpls.push' ? 'var(--paper-2)' : 'var(--berry)'} stroke="var(--line)" stroke-width="5" />
      <text x="-29" y="-13" text-anchor="middle" font-size={inner(48)} font-family="system-ui, sans-serif" font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" stroke-linejoin="round" paint-order="stroke">{mplsLeft}</text>
      <path d="M72 -25 H142" stroke="var(--line)" stroke-width="7" stroke-linecap="round" marker-end="url(#arrow-sticker)" />
      {#if mplsMid}
        <rect x="66" y={L.compact ? -70 : -64} width="90" height={L.compact ? 40 : 32} rx="10" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
        <text x="111" y="-38" text-anchor="middle" font-size={inner(L.compact ? 36 : 34)} font-family="system-ui, sans-serif" font-weight="900" fill="var(--line)">{mplsMid}</text>
      {/if}
      <rect x="166" y="-58" width="166" height="64" rx="16" fill={action === 'mpls.pop' ? 'var(--paper-2)' : 'var(--berry)'} stroke="var(--line)" stroke-width="5" />
      <text x="249" y="-13" text-anchor="middle" font-size={inner(48)} font-family="system-ui, sans-serif" font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="6" stroke-linejoin="round" paint-order="stroke">{mplsRight}</text>
    </g>
  {/if}
</g>
{#if isPortrait || L.compact}
  {#each steps as step, i}
    <Text x={L.cards[0].x + L.cards[0].w / 2} y={L.cards[0].y + L.cards[0].h - (L.compact ? 68 : 100) + i * (L.compact ? 50 : 62)} text={i ? `→ ${step}` : step} size={32} kind="big" colour="var(--brick)" />
  {/each}
{:else}
  <Text x={L.cards[0].x + L.cards[0].w / 2} y={L.cards[0].y + L.cards[0].h - 24} text={`${steps[0]}  →  ${steps[1]}`} size={22} kind="big" colour="var(--brick)" />
{/if}

<Card x={L.cards[1].x} y={L.cards[1].y} w={L.cards[1].w} h={L.cards[1].h} tint={bookTint} />
{#if L.compact}
  <text x={L.cards[1].x + 38} y={L.cards[1].y + 92} font-size="58" font-family="system-ui, sans-serif" font-weight="800" fill="var(--line)">{S(layer === 'mpls' ? 'card.lfib' : layer === 'vlan' ? 'card.lanes' : role === 'bridge' ? 'card.macBook' : 'card.arpBook')}</text>
  {#each bookRows.slice(0, 2) as r, i}
    <rect x={L.cards[1].x + 34} y={L.cards[1].y + 134 + i * 78} width={L.cards[1].w - 68} height={rowPx * 1.45} rx="14" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
    <text x={L.cards[1].x + 58} y={L.cards[1].y + 134 + i * 78 + rowPx * 1.08} font-size={rowPx} font-family="system-ui, sans-serif" font-weight="800" fill="var(--line)">{r[0]}</text>
    <text x={L.cards[1].x + L.cards[1].w - 58} y={L.cards[1].y + 134 + i * 78 + rowPx * 1.08} text-anchor="end" font-size={rowPx} font-family="system-ui, sans-serif" font-weight="800" fill="var(--brick)">{r[1]}</text>
  {/each}
{:else}
  <Text x={L.cards[1].x + 34} y={L.cards[1].y + (isPortrait ? 88 : 72)} text={S(layer === 'mpls' ? 'card.lfib' : layer === 'vlan' ? 'card.lanes' : role === 'bridge' ? 'card.macBook' : 'card.arpBook')} size={T.title} kind="big" anchor="start" />
  {#each bookRows as r, i}
    {@const y = rowY(i)}
    <rect x={L.cards[1].x + 28} y={y - T.small * 0.78} width={L.cards[1].w - 56} height={T.small * 1.42} rx="13" fill={i === 0 && (m.phase === 'lookup' || m.phase === 'straight') ? 'var(--paper-2)' : 'var(--paper)'} stroke="var(--line)" stroke-width={i === 0 && (m.phase === 'lookup' || m.phase === 'straight') ? 5 : 2} opacity="0.96" />
    <Text x={L.cards[1].x + 48} y={y + T.small * 0.35} text={r[0]} size={T.small} kind="node" anchor="start" />
    <Text x={L.cards[1].x + L.cards[1].w - 48} y={y + T.small * 0.35} text={r[1]} size={T.small} kind="big" anchor="end" colour={i === 0 ? 'var(--brick)' : 'var(--line)'} />
  {/each}
{/if}

{#if technical && !L.compact}
  {@const c = L.cards[1]}
  {@const fs = isPortrait ? 32 : 20}
  <rect x={c.x + 28} y={c.y + c.h - fs * 2.9} width={c.w - 56} height={fs * 2} rx="14" fill="var(--paper-2)" stroke="var(--line)" stroke-width="4" />
  <text x={c.x + c.w / 2} y={c.y + c.h - fs * 1.55} text-anchor="middle" font-family="var(--tag-font)" font-size={fs} font-weight="800" fill="var(--line)">{fieldsLine}</text>
{/if}

<Node id={ctx.client.node.id} x={L.ends[0].x} y={L.ends[0].y} size={L.ends[0].size} />
<Node id={ctx.server.node.id} x={L.ends[1].x} y={L.ends[1].y} size={L.ends[1].size} />

<g>
  <rect x={L.box.x} y={L.box.y} width={L.box.w} height={L.box.h} rx="28" fill="var(--kraft-edge)" stroke="var(--line)" stroke-width="7" />
  <path d={`M${L.box.x + 28} ${L.box.y + 58} H${L.box.x + L.box.w - 28}`} stroke="var(--paper)" stroke-width="8" stroke-linecap="round" opacity="0.55" />
  {#each L.doors as d, i}
    {@const sameLane = layer !== 'vlan' || i === 0 || i === 2}
    {@const active = (role === 'bridge' && layer === 'ethernet' && ((m.phase === 'fanout' && i > 0) || (m.phase === 'straight' && i === 1))) || (layer === 'vlan' && sameLane && i !== 3) || (layer === 'mpls' && i === 2)}
    <rect x={d.x - 35} y={d.y - 82} width="70" height="82" rx="10" fill={layer === 'vlan' ? (sameLane ? 'var(--teal)' : 'var(--stone)') : 'var(--paper-2)'} stroke={active ? 'var(--accent)' : 'var(--line)'} stroke-width={active ? 7 : 5} />
    <Text x={d.x} y={d.y - 28} text={String(i + 1)} size={T.small * 1.28} kind="big" colour="var(--line)" />
  {/each}
  <Node id={ctx.to.node.id} x={L.hop.x} y={L.hop.y} size={L.hop.size} focused />
</g>

{#if layer === 'ethernet' && role === 'bridge' && m.phase === 'fanout'}
  {#each L.doors.slice(1) as d, i}
    <path d={`M${L.doors[0].x} ${L.doors[0].y - 112} Q${(L.doors[0].x + d.x) / 2} ${L.doors[0].y - 190 - i * 18} ${d.x} ${d.y - 112}`} fill="none" stroke="var(--berry)" stroke-width="8" stroke-linecap="round" stroke-dasharray="18 14" opacity={0.3 + 0.55 * ramp(m.p, 0.1, 0.8)} />
  {/each}
{:else if layer === 'ethernet' && role !== 'bridge' && m.phase === 'fanout'}
  {#each L.doors as d}
    <path d={`M${L.doors[1].x} ${L.doors[1].y - 112} Q${(L.doors[1].x + d.x) / 2} ${L.doors[1].y - 185} ${d.x} ${d.y - 112}`} fill="none" stroke="var(--teal)" stroke-width="7" stroke-linecap="round" stroke-dasharray="16 14" opacity="0.55" />
  {/each}
{/if}

{#if !isPortrait && !L.compact}
  <Text x={L.ends[0].x} y={L.names} text={nameOf(ctx.client)} size={T.small} kind="node" fit />
  <Text x={L.ends[1].x} y={L.names} text={nameOf(ctx.server)} size={T.small} kind="node" fit />
{/if}
{#if !L.compact}<Text x={L.hop.x} y={L.names} text={nameOf(ctx.to)} size={T.title * (isPortrait ? 0.82 : 1)} kind="big" fit />{/if}

<StickerParcel x={x} y={L.walk + bob(time, moving)} scale={T.parcel} legible={L.compact ? legible : undefined} tint={actionTint} sticker={packetSticker} moving={moving} {time} smudge={layer === 'ethernet' && role !== 'bridge' && m.phase === 'fanout'} />

{#if layer === 'ethernet' && role !== 'bridge' && m.phase === 'lookup'}
  <g transform="translate({L.box.x + L.box.w / 2} {L.box.y - 55})">
    <rect x="-118" y="-34" width="236" height="68" rx="22" fill="var(--paper)" stroke="var(--line)" stroke-width="5" />
    <Text x="0" y="12" text={S('label.whoHasShort')} size={T.small} kind="big" />
  </g>
{/if}
