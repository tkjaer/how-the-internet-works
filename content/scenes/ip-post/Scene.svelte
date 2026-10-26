<svelte:options namespace="svg" />
<script lang="ts">
  // Look at the address label (IP) at one hop. What happens depends on who reads it: a router picks the next road by
  // its signposts, a NAT swaps the sender sticker and notes it in its notebook (a carrier's NAT does it for a whole
  // street of phones), a bridge doesn't read it at all and only swaps the link envelope, and an endpoint checks it's
  // for itself and hands the contents up.
  import { Node, TagAt, Text, fakeMac, fill, nameOf, strings, ttlAt, view, yours, type LayerSubject } from '$core/api';
  import { bob, carrierNat, layoutFor, match, moment, near, parcelX, ramp, roads, type Mode } from './post';
  import Card from './art/Card.svelte';
  import Lens from './art/Lens.svelte';
  import Parcel from './art/Parcel.svelte';
  import Sign from './art/Sign.svelte';
  let { subject, time }: { subject: LayerSubject; time: number } = $props();
  const S = strings('scene.ip-post');
  const IP = strings('layer.ip');
  const LN = strings('layer');
  const UP = 'var(--sun)', DOWN = 'var(--berry)', OLD = 'var(--teal)', NEW = 'var(--orange)';

  const ctx = $derived(subject.ctx);
  const route = $derived(subject.route);
  const technical = $derived(ctx.level === 'technical');
  // a router that only switches the label doesn't read this label either: it just swaps the envelopes
  const mode = $derived<Mode>(ctx.switched ? 'bridge' : ctx.role);
  const L = $derived(layoutFor(view.orient, view.vp));
  const T = $derived(L.size);
  const m = $derived(moment(time));
  const idx = $derived(ctx.to.index);
  const atServer = $derived(ctx.to.id === ctx.server.id);
  /** The TTL arriving here and leaving, each way (it drops by more than one where a label comes off and it catches up). */
  const ttlUp = $derived([ttlAt(route, idx - 1, 'up'), ttlAt(route, idx, 'up')]);
  const ttlDown = $derived([ttlAt(route, idx, 'down'), ttlAt(route, idx - 1, 'down')]);
  /** Which way each leg's parcel travels: passing hops see one go out and one come back; an endpoint receives first. */
  const legUp = $derived<[boolean, boolean]>(mode === 'endpoint' && !atServer ? [false, true] : [true, false]);
  const up = $derived(legUp[m.leg]);

  // addresses and Simple-level names on the label, as they arrive here
  const serverAddr = $derived(ctx.server.addr ?? '');
  const clientAddr = $derived(ctx.dir === 'up' ? ctx.src : ctx.dst);
  const me = $derived(technical ? clientAddr : yours(ctx.client));
  const them = $derived(technical ? serverAddr : IP('server'));
  const cgnat = $derived(!!ctx.nat && carrierNat(ctx.nat.inside));
  const PORT = $derived(ctx.nat?.insidePort ?? 0);
  const OUT = $derived(ctx.nat?.outsidePort ?? PORT);
  const inside = $derived(technical ? `${ctx.nat?.inside}:${PORT}` : yours(ctx.client));
  const outside = $derived(technical ? `${ctx.nat?.outside}:${OUT}` : nameOf(ctx.to));

  // the job at this hop, 0..1 through the act (1 once done on this leg)
  const act = $derived(m.phase === 'act' ? m.p : m.phase === 'in' ? 0 : 1);
  /** An endpoint writes the label of what it sends, from the start of its second leg until the parcel leaves. */
  const writing = $derived(m.phase === 'in' ? m.p * 0.7 : m.phase === 'act' ? 0.7 + 0.3 * ramp(m.p, 0, 0.3) : 1);
  const x = $derived(parcelX(m, L, mode, atServer));
  const walking = $derived(m.phase === 'in' || m.phase === 'out');

  interface Row { k: string; v: string; was?: string; swap?: number; lit: boolean; typed?: number }
  const rows = $derived.by<Row[]>(() => {
    const from: Row = { k: IP('from'), v: up ? me : them, lit: false };
    const to: Row = { k: IP('to'), v: up ? them : me, lit: false };
    const [ttlIn, ttlOut] = up ? ttlUp : ttlDown;
    let ttl = String(ttlIn);
    if (mode === 'nat') {
      if (up) Object.assign(from, { was: inside, v: outside, swap: act });
      else Object.assign(to, { was: outside, v: inside, swap: act });
    }
    if (mode === 'router' || mode === 'nat') {
      (up ? to : from).lit = mode === 'router' && m.phase === 'act';
      if (act > 0.5) ttl = `${ttlIn} → ${ttlOut}`;
    }
    if (mode === 'endpoint') {
      if (m.leg === 0) to.lit = act > 0.35 && m.phase === 'act';
      else { from.typed = ramp(writing, 0, 0.45); to.typed = ramp(writing, 0.5, 0.95); ttl = '64'; }
    }
    return technical ? [from, to, { k: 'TTL', v: ttl, lit: false, typed: to.typed }] : [from, to];
  });

  // router: signposts built from the route
  const side = $derived(route.asides.some((a) => a.link.from === ctx.to.id || a.link.to === ctx.to.id));
  const clientSide = $derived(route.chain.slice(1, idx).reverse().find((h) => h.natTo));
  const signs = $derived(roads(clientAddr, serverAddr, nameOf(clientSide ?? ctx.client), nameOf(ctx.server), side));
  const lit = $derived(match(signs, up ? serverAddr : clientAddr));

  // NAT: the notebook (a carrier's is full of neighbours sharing the same outside address)
  const other = $derived(ctx.client.node.id === 'laptop' ? 'phone' : 'laptop');
  const notes = $derived.by(() => {
    const a = ctx.nat?.inside ?? '';
    const others = cgnat
      ? [[near(a, 0), PORT, OUT + 1], [near(a, 1), 49152, OUT + 2], [near(a, 2), 60311, OUT + 3]] as const
      : [[near(a, 0), PORT, OUT + 1]] as const;
    return [
      { you: true, name: fill(S('you'), { name: nameOf(ctx.client) }), inside: `${a}:${PORT}`, port: OUT },
      ...others.map(([ip, p, o]) => ({ you: false, name: cgnat ? S('neighbour') : nameOf(other), inside: `${ip}:${p}`, port: o })),
    ];
  });
  const written = $derived(m.leg === 1 ? 1 : ramp(act, 0.45, 0.9));

  // bridge: the link envelopes coming off and going on
  const nextLink = $derived(route.links[ctx.dir === 'up' ? idx : idx - 1]);
  const stackName = (ids: string[]) => ids.map((id) => LN(`${id}.name`, 'simple'));
  const offNames = $derived(stackName((up ? ctx.link : nextLink)?.stack ?? []));
  const onNames = $derived(stackName((up ? nextLink : ctx.link)?.stack ?? []));
  const wrapColours = [OLD, NEW];
  // a bridge passes the frame's MACs on; only a tunnel end (where the frame ends) puts its own on the next one
  const macTag = $derived(!ctx.macs ? S('tag.noMac')
    : ctx.frame.dst.id === ctx.to.id ? fill(S('tag.mac'), { mac: fakeMac(ctx.to.id) }) : S('tag.macPassed'));

  // endpoint: whose door, and the layer the contents go up to
  const flowStack = $derived(route.activity.flows.find((f) => f.id === ctx.flow)?.stack ?? []);
  const above = $derived(flowStack[flowStack.indexOf(subject.layer) + 1]);
  const plate = $derived(technical ? (atServer ? serverAddr : clientAddr) : atServer ? IP('server') : yours(ctx.client));

  const hopSpot = $derived(mode === 'endpoint' ? L.home[atServer ? 1 : 0] : L.hop);
  const ends = $derived(mode === 'endpoint' ? [L.ends[atServer ? 0 : 1]] : L.ends);
  const endIds = $derived(mode === 'endpoint' ? [atServer ? ctx.client : ctx.server] : [ctx.client, ctx.server]);
  const card = $derived(L.card);
  /** Cards fit their rows. */
  const lines = $derived(mode === 'nat' ? notes.length : mode === 'bridge' ? offNames.length + onNames.length : 2.6);
  const rowGap = $derived(T.text * 1.3);
  const cardRow = (i: number) => card.y + 78 + T.big * 0.55 + T.text * 0.7 + i * rowGap;
  const cardH = $derived(Math.min(card.h, cardRow(lines - 1) - card.y + T.text * 0.7 + 34));
  const lab = $derived(L.label);
  const rowY = (i: number) => lab.y + 82 + T.big * 0.55 + T.text * 0.72 + i * T.text * 1.6;
  const labH = $derived(Math.min(lab.h, rowY(rows.length - 1) - lab.y + T.text * 0.72 + 36));
  const valueX = $derived(lab.x + T.text * 4.1);
  const cardTitle = $derived(S(mode === 'router' ? 'signs' : mode === 'nat' ? 'notebook' : mode === 'bridge' ? 'swap' : 'door'));
  const tags = $derived<string[]>(mode === 'router' ? [S(side ? 'tag.lpm' : 'tag.default'), fill(S(ttlUp[1] < ttlUp[0] - 1 ? 'tag.ttlLabel' : 'tag.ttl'), { a: String(ttlUp[0]), b: String(ttlUp[1]) })]
    : mode === 'nat' ? [S(cgnat ? 'tag.cgnat' : 'tag.nat'), S('tag.ports')]
    : mode === 'bridge' ? [macTag, S('tag.untouched')]
    : [S('tag.proto'), S('tag.ttl64')]);
</script>

<!-- the road -->
<rect x={L.road.x0} y={L.road.y - 36} width={L.road.x1 - L.road.x0} height="72" rx="36" fill="var(--kraft)" stroke="var(--line)" stroke-width="6" />
<path d={`M${L.road.x0 + 50} ${L.road.y} H${L.road.x1 - 50}`} stroke="var(--paper)" stroke-width="7" stroke-dasharray="34 30" stroke-linecap="round" />

<!-- the address label, close up -->
<Card x={lab.x} y={lab.y} w={lab.w} h={labH} tint={mode === 'bridge' ? 'var(--stone)' : UP} />
<Text x={lab.x + 34} y={lab.y + 72} text={IP('name', ctx.level)} size={T.big} kind="big" anchor="start" />
{#each rows as r, i}
  {@const y = rowY(i)}
  {@const w = lab.x + lab.w - valueX - 8}
  <Text x={lab.x + 34} y={y + T.text * 0.35} text={r.k} size={T.text} kind="small" anchor="start" />
  {#if r.was !== undefined}
    {@const off = ramp(r.swap ?? 1, 0, 0.45)}
    {@const on = ramp(r.swap ?? 1, 0.45, 0.9)}
    {#if off < 1}
      <g transform="translate({off * 60} {-off * 16}) rotate({off * 7} {valueX} {y})" opacity={1 - off}>
        <rect x={valueX - 16} y={y - T.text * 0.72} width={w} height={T.text * 1.44} rx="12" fill="var(--paper-2)" stroke="var(--line)" stroke-width="3" />
        <Text x={valueX} y={y + T.text * 0.35} text={r.was} size={T.text} kind="node" anchor="start" />
      </g>
    {/if}
    {#if on > 0}
      <g opacity={on} transform="translate({(1 - on) * 50} 0)">
        <rect x={valueX - 16} y={y - T.text * 0.72} width={w} height={T.text * 1.44} rx="12" fill={NEW} stroke="var(--line)" stroke-width="4" />
        <Text x={valueX} y={y + T.text * 0.35} text={r.v} size={T.text} kind="node" anchor="start" colour="var(--face)" on={NEW} />
      </g>
    {/if}
  {:else}
    <rect x={valueX - 16} y={y - T.text * 0.72} width={w} height={T.text * 1.44} rx="12" fill={r.lit ? UP : 'var(--paper-2)'} stroke="var(--line)" stroke-width={r.lit ? 5 : 3} />
    <Text x={valueX} y={y + T.text * 0.35} text={r.typed === undefined ? r.v : r.v.slice(0, Math.ceil(r.v.length * r.typed))} size={T.text} kind="node" anchor="start" colour={r.lit ? 'var(--face)' : undefined} on={r.lit ? UP : undefined} />
  {/if}
{/each}
{#if mode === 'bridge'}
  <!-- eyes shut: a bridge never reads this label -->
  <g transform="translate({lab.x + lab.w - 70} {lab.y + 58})">
    <circle r="36" fill="var(--paper-2)" stroke="var(--line)" stroke-width="5" />
    <path d="M-20 -2 Q-12 8 -4 -2 M4 -2 Q12 8 20 -2 M-10 14 Q0 20 10 14" fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round" />
  </g>
{/if}

<!-- this hop's own tool -->
{#if mode === 'router'}
  <rect x={card.x + card.w / 2 - 10} y={card.y - 10} width="20" height={hopSpot.y - card.y} rx="8" fill="var(--cardboard)" stroke="var(--line)" stroke-width="5" />
  {#each signs as s, i}
    {@const h = card.h / signs.length}
    {@const y = card.y + h * (i + 0.5)}
    {@const on = i === lit ? (m.phase === 'act' ? ramp(m.p, 0.35, 0.6) : m.phase === 'out' ? 1 : 0) : 0}
    <Sign x={card.x + card.w / 2} {y} w={card.w * 0.92} h={Math.min(h * 0.78, T.text * 2)} to={s.to} lit={on} />
    <Text x={card.x + card.w / 2 + (s.to === 'back' ? 14 : -14)} y={y + T.text * 0.35} text={technical ? s.prefix : s.name ?? S('elsewhere')} size={T.text} kind="node" colour={on > 0.5 ? 'var(--face)' : undefined} on={on > 0.5 ? 'var(--sun)' : undefined} />
  {/each}
{:else}
  <Card x={card.x} y={card.y} w={card.w} h={cardH} tint={mode === 'nat' ? NEW : mode === 'bridge' ? OLD : 'var(--leaf)'} />
  <Text x={card.x + 34} y={card.y + 72} text={technical && mode === 'nat' ? fill(S('table'), { addr: ctx.nat?.outside ?? '' }) : cardTitle} size={T.big} kind="big" anchor="start" />
  {#if mode === 'nat'}
    {#each notes as r, i}
      {@const y = cardRow(i)}
      {@const on = r.you && m.leg === 1 && m.phase === 'act'}
      <g opacity={r.you ? written : 1}>
        {#if r.you}<rect x={card.x + 18} y={y - T.text * 0.75} width={card.w - 36} height={T.text * 1.45} rx="12" fill={on ? UP : 'var(--paper-2)'} stroke="var(--line)" stroke-width={on ? 5 : 0} />{/if}
        <Text x={card.x + 34} y={y + T.text * 0.35} text={technical ? r.inside : r.name} size={T.text * (technical ? 0.85 : 1)} kind={r.you ? 'node' : 'small'} anchor="start" colour={on ? 'var(--face)' : undefined} on={on ? UP : undefined} />
        <Text x={card.x + card.w - 34} y={y + T.text * 0.35} text={technical ? `:${r.port}` : fill(S('ticket'), { n: String(r.port) })} size={T.text * (technical ? 0.85 : 1)} kind={r.you ? 'node' : 'small'} anchor="end" colour={on ? 'var(--face)' : undefined} on={on ? UP : undefined} />
      </g>
    {/each}
  {:else if mode === 'bridge'}
    {@const envs = [...offNames.map((t, i) => ({ t, on: false, head: i === 0 })), ...onNames.map((t, i) => ({ t, on: true, head: i === 0 }))]}
    {#each envs as l, i}
      {@const y = cardRow(i)}
      {#if l.head}
        <g transform="translate({card.x + 60} {y})">
          <rect x="-26" y="-18" width="52" height="36" rx="7" fill={wrapColours[l.on === up ? 1 : 0]} stroke="var(--line)" stroke-width="4" />
          <path d="M-22 -14 L0 2 L22 -14" fill="none" stroke="var(--face)" stroke-width="3" />
          <circle cx="24" cy="-18" r="14" fill="var(--paper)" stroke="var(--line)" stroke-width="4" />
          <path d={l.on ? 'M16 -18 H32 M24 -26 V-10' : 'M16 -18 H32'} stroke="var(--line)" stroke-width="4" stroke-linecap="round" />
        </g>
      {/if}
      <Text x={card.x + 112} y={y + T.text * 0.35} text={l.t} size={T.text} kind="node" anchor="start" />
    {/each}
  {:else}
    {@const py = card.y + 84 + T.big * 0.55 + T.text * 0.9}
    {@const sy = card.y + cardH - 45}
    <rect x={card.x + 30} y={py - T.text * 0.9} width={card.w - 60} height={T.text * 1.8} rx="14" fill="var(--mustard)" stroke="var(--line)" stroke-width="5" />
    <circle cx={card.x + 50} cy={py} r="6" fill="var(--face)" /><circle cx={card.x + card.w - 50} cy={py} r="6" fill="var(--face)" />
    <Text x={card.x + card.w / 2} y={py + T.text * 0.35} text={plate} size={T.text} kind="node" colour="var(--face)" on="var(--mustard)" />
    {#if m.leg === 0 && act > 0.35}
      <Text x={card.x + card.w / 2} y={sy} text={act > 0.6 && above ? fill(S('up'), { layer: LN(`${above}.name`, ctx.level) }) : S('match')} size={T.text} kind="big" colour="var(--leaf-ink)" />
    {:else if m.leg === 1 && m.phase !== 'rest'}
      <Text x={card.x + card.w / 2} y={sy} text={S('write')} size={T.text} kind="big" colour="var(--brick)" />
    {/if}
  {/if}
{/if}

<!-- who's on the road -->
{#if mode === 'nat'}
  {#each L.extras.slice(0, cgnat ? 3 : 1) as e}
    <Node id={cgnat ? ctx.client.node.id : other} x={e.x} y={e.y} size={e.size} />
  {/each}
{/if}
{#each ends as e, i}
  <Node id={endIds[i].node.id} x={e.x} y={e.y} size={e.size} />
  {#if L.endNames}<Text x={e.x} y={L.names} text={nameOf(endIds[i])} size={T.text} kind="node" fit />{/if}
{/each}
<Node id={ctx.to.node.id} x={hopSpot.x} y={hopSpot.y} size={hopSpot.size} focused />
<Text x={hopSpot.x} y={L.names} text={nameOf(ctx.to)} size={T.big} kind="big" fit />

{#if x !== null}
  <g transform="translate({x} {L.walk}) scale({L.parcel}) translate({-x} {-L.walk})">
    <Parcel {x} y={L.walk + bob(time, walking)} colour={up ? UP : DOWN} {walking} {time}
      wrap={mode === 'bridge' ? { colour: wrapColours[m.leg], lift: ramp(act, 0.05, 0.5) } : null}
      next={mode === 'bridge' ? { colour: wrapColours[1 - m.leg], drop: ramp(act, 0.5, 0.95) } : null} />
    {#if m.phase === 'act' && mode !== 'bridge' && !(mode === 'endpoint' && m.leg === 1)}
      <Lens x={x - 10} y={L.walk - 70} r={44} {time} />
    {/if}
  </g>
{/if}
{#if mode === 'endpoint' && m.leg === 0 && (m.phase === 'out' || (m.phase === 'act' && act > 0.55))}
  <!-- the contents go up to the next layer -->
  {@const k = m.phase === 'act' ? ramp(act, 0.55, 1) * 0.3 : 0.3 + 0.7 * m.p}
  <g transform="translate({L.doorstep[atServer ? 1 : 0]} {L.walk - 130 - k * L.rise})" opacity={1 - ramp(k, 0.8, 1)}>
    <rect x="-44" y="-38" width="88" height="76" rx="12" fill="var(--teal)" stroke="var(--line)" stroke-width="6" />
    <path d="M-44 -14 H44" stroke="var(--line)" stroke-width="4" opacity="0.35" />
    <Text x={0} y={22} text="1" size={44} kind="big" />
  </g>
{/if}

{#each tags.slice(0, L.tags.length) as t, i}<TagAt x={L.tags[i].x} y={L.tags[i].y} text={t} size={view.orient === 'portrait' ? 40 : 28} />{/each}
