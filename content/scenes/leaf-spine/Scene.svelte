<svelte:options namespace="svg" />
<script lang="ts">
  // The data centre's leaf–spine fabric: every leaf has a fibre to every spine. ECMP hashes this flow to one spine,
  // so the reader's parcel uses the same crossroad every time while background traffic spreads over all four.
  import { Node, Text, fill, legibleSize, nameOf, strings, view, type NodeSubject } from '$core/api';
  import { HIGHLIGHT_SPINE, LEAVES, OTHER_FLOWS, SPINES, fabricLayout, fabricLinks, otherFlowAt, parcelAt, spineBox, wire } from './fabric';
  import Spine from './art/Spine.svelte';
  import Leaf from './art/Leaf.svelte';
  import Carrier from './art/Carrier.svelte';

  let { subject, time }: { subject: NodeSubject; time: number } = $props();
  const S = strings('scene.leaf-spine');
  const portrait = $derived(view.orient === 'portrait');
  const compact = $derived(!portrait && view.vp.h < 470);
  const night = $derived(view.mode === 'night');
  const technical = $derived(S('mode') === 'technical');
  const L = $derived(fabricLayout(view.orient, compact));
  const legible = legibleSize();
  const T = $derived(portrait
    ? { title: 38, label: 30, spine: 28, tag: 30, sticker: 29 }
    : compact ? { title: legible(44), label: 0, spine: legible(42), tag: 0, sticker: legible(42) }
    : { title: 42, label: 25, spine: 24, tag: 24, sticker: 22 });

  const before = $derived(subject.in ? subject.route.hops[subject.in.from] : null);
  const after = $derived(subject.out ? subject.route.hops[subject.out.to] : null);
  const fabricTech = $derived(subject.in?.tech ?? subject.out?.tech);
  const fabricColour = $derived(fabricTech?.colour ?? 'var(--blue)');
  const links = $derived(fabricLinks(L));
  const parcel = $derived(parcelAt(time, view.still, L));
  const others = $derived(OTHER_FLOWS.map((f) => otherFlowAt(time, view.still, L, f)));
  const otherColours = ['var(--teal)', 'var(--orange)', 'var(--berry)', 'var(--blue)', 'var(--leaf)', 'var(--mustard)', 'var(--teal-dark)', 'var(--orange-soft)'];
  const ends = $derived([
    subject.in && { link: subject.in, d: wire(L.inPort, L.leaves.before) },
    subject.out && { link: subject.out, d: wire(L.leaves.after, L.outPort) },
  ].filter((e) => !!e));
  const stickerLines = $derived(technical ? [S('sticker'), fill(S('sticker.mod'), { n: HIGHLIGHT_SPINE })] : [S('sticker')]);
</script>

<g text-rendering="geometricPrecision">
  {#if !portrait}<text x="800" y={compact ? 110 : 95} text-anchor="middle" font-family="var(--label-font)" font-size={T.title} font-weight="900" fill="var(--line)" stroke="var(--paper)" stroke-width="7" paint-order="stroke">{S('heading')}</text>{/if}

  <rect x={portrait ? 45 : compact ? 80 : 120} y={portrait ? 250 : compact ? 145 : 145} width={portrait ? 810 : compact ? 1440 : 1360} height={portrait ? 1015 : compact ? 590 : 610} rx="42" fill="var(--paper-2)" stroke="var(--line)" stroke-width="5" opacity="0.42" />

  {#each ends as e (e.d)}
    {#if night}<path d={e.d} stroke={e.link.tech.colour} stroke-width="52" stroke-linecap="round" opacity="0.18" />{/if}
    <path d={e.d} stroke="var(--line)" stroke-width="28" stroke-linecap="round" />
    <path d={e.d} stroke={e.link.tech.colour} stroke-width="16" stroke-linecap="round" />
  {/each}

  {#each links as l (`${l.leaf}-${l.spine}`)}
    {#if night}<path d={wire(l.a, l.b)} stroke={fabricColour} stroke-width={l.highlighted ? 30 : 18} stroke-linecap="round" opacity={l.highlighted ? 0.18 : 0.08} />{/if}
    <path d={wire(l.a, l.b)} stroke="var(--line)" stroke-width={l.highlighted ? 12 : 7} stroke-linecap="round" opacity={l.highlighted ? 0.7 : 0.22} />
    <path d={wire(l.a, l.b)} stroke={fabricColour} stroke-width={l.highlighted ? 7 : 4} stroke-linecap="round" opacity={l.highlighted ? 0.78 : 0.26} />
  {/each}

  {#each SPINES as i (i)}
    <Spine box={spineBox(L, i)} active={i === HIGHLIGHT_SPINE} {night} />
    {#if !(compact || portrait) || i === HIGHLIGHT_SPINE}
      <Text x={L.spines[i].x} y={spineBox(L, i).y - (portrait ? 18 : 14)} text={i === HIGHLIGHT_SPINE ? nameOf(subject.hop) : fill(S('spine.label'), { n: i })} size={T.spine} kind="node" />
    {/if}
  {/each}

  <rect x={L.sticker.x + 6} y={L.sticker.y + 8} width={L.sticker.w} height={L.sticker.h} rx="14" fill="var(--shade)" opacity="0.12" />
  <rect x={L.sticker.x} y={L.sticker.y} width={L.sticker.w} height={L.sticker.h} rx="14" fill="var(--kraft)" stroke="var(--line)" stroke-width="5" />
  {#each stickerLines as line, i (line)}
    <text x={L.sticker.x + L.sticker.w / 2} y={L.sticker.y + L.sticker.h / 2 + T.sticker * (i - (stickerLines.length - 1) / 2) * 1.08 + T.sticker * 0.34} text-anchor="middle" font-family={technical ? 'var(--tag-font)' : 'var(--label-font)'} font-size={T.sticker} font-weight="900" fill="var(--line)">{line}</text>
  {/each}

  {#each LEAVES as leaf (leaf)}
    {#if leaf === 'before' && before}
      <Node id={before.node.id} x={L.leaves.before.x} y={L.leaves.before.y} size={L.nodeSize} />
      {#if T.label}<Text x={L.leaves.before.x + (portrait ? 20 : 0)} y={L.leafBoxes.before.y + L.leafBoxes.before.h + (portrait ? 42 : 38)} text={nameOf(before)} size={T.label} kind="node" anchor={portrait ? 'start' : 'middle'} />{/if}
    {:else if leaf === 'after' && after}
      <Node id={after.node.id} x={L.leaves.after.x} y={L.leaves.after.y} size={L.nodeSize} />
      {#if T.label}<Text x={L.leaves.after.x - (portrait ? 20 : 0)} y={L.leafBoxes.after.y + L.leafBoxes.after.h + (portrait ? 42 : 38)} text={nameOf(after)} size={T.label} kind="node" anchor={portrait ? 'end' : 'middle'} />{/if}
    {:else if leaf === 'other1' || leaf === 'other2'}
      <Leaf box={L.leafBoxes[leaf]} {night} />
      {#if T.label && !portrait}<Text x={L.leaves[leaf].x} y={L.leafBoxes[leaf].y + L.leafBoxes[leaf].h + 35} text={S('leaf.other')} size={T.label} kind="node" />{/if}
    {/if}
  {/each}

  {#each others as f, i (`${f.from}-${f.to}-${i}`)}
    <Carrier p={f.p} alpha={f.alpha} {time} kind="other" colour={otherColours[i]} {night} />
  {/each}
  <Carrier p={parcel.p} alpha={parcel.alpha} {time} kind="yours" colour="var(--sun)" {night} />

  {#if T.tag && fabricTech}
    <Text x={L.fabricTag.x} y={L.fabricTag.y} text={strings(`tech.${fabricTech.id}`)('name')} size={T.tag} kind="link" colour={fabricTech.colour} anchor={L.fabricTag.anchor} />
  {/if}
</g>
