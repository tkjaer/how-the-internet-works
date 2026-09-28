<svelte:options namespace="svg" />
<script lang="ts">
  // A "path scene": nodes + links + packets. Used for the overview and for the expanded internet.
  import type { LivePacket } from '../core/packets';
  import { bezier, labelY, linkPath, pathScene, type PathSceneId } from '../core/scene';
  import { themeState, view } from '../state.svelte';
  import TagAt from './TagAt.svelte';
  import Text from './Text.svelte';

  let { id, packets, focus }: { id: PathSceneId; packets: LivePacket[]; focus: string | null } = $props();
  const data = $derived(pathScene(id, view.orient));
  const W = $derived(view.orient === 'portrait' ? { w: 900, h: 1600 } : { w: 1600, h: 900 });
  const portrait = $derived(view.orient === 'portrait');
  const A = $derived(themeState.current.art);
  const C = $derived(themeState.current.colours);
</script>

<g class="scene scene-{id}">
  <A.Backdrop scene={id} orient={view.orient} w={W.w} h={W.h} time={view.time} />
  {#each data.links as l (l.id)}
    <A.Link link={l} d={linkPath(l)} colour={C.tech[l.tech]} time={view.time} focused={focus === l.id} />
  {/each}
  {#each data.nodes as n (n.id)}
    <A.Device id={n.id} x={n.x} y={n.y} size={n.size} time={view.time} context="path" focused={focus === n.id} />
  {/each}
  {#each data.nodes as n (n.id)}
    <Text x={n.x} y={labelY(n)} k={n.label} size={28} kind="node" />
    {#if n.tag && portrait}
      <!-- portrait: beside the node, towards the middle of the screen, where there is room for a long callout -->
      {@const right = n.x < W.w / 2}
      <TagAt x={n.x + (right ? 1 : -1) * (n.size / 2 + 14)} y={n.y + 8} k={n.tag} anchor={right ? 'start' : 'end'} />
    {:else if n.tag}
      <!-- landscape: stacked just beyond the name label; hugging the edge near the sides of the world -->
      {@const edge = n.x > W.w - 260 ? 'end' : n.x < 260 ? 'start' : 'middle'}
      <TagAt x={edge === 'end' ? n.x + n.size / 2 : edge === 'start' ? n.x - n.size / 2 : n.x}
        y={n.labelAbove ? labelY(n) - 44 : labelY(n) + 36} k={n.tag} anchor={edge} />
    {/if}
  {/each}
  {#each data.links as l (l.id)}
    {@const m = bezier(l, 0.5)}
    {@const lo = l.lo ?? [0, 50]}
    {#if l.label}<Text x={m.x + lo[0]} y={m.y + lo[1]} k={l.label} size={24} kind="link" colour={C.tech[l.tech]} />{/if}
    {#if l.tag && portrait}
      <TagAt x={m.x + (lo[0] < 0 ? 26 : -26)} y={m.y + 8} k={l.tag} anchor={lo[0] < 0 ? 'start' : 'end'} />
    {:else if l.tag}<TagAt x={m.x + lo[0]} y={m.y + lo[1] + (lo[1] < 0 ? -40 : 34)} k={l.tag} />{/if}
  {/each}
  {#if id === 'overview'}
    {#each data.links.filter((l) => l.dive) as l (l.id)}
      {@const m = bezier(l, 0.5)}
      <A.Hint kind="dive" x={m.x} y={m.y} time={view.time} />
    {/each}
    {#each data.nodes.filter((n) => n.expand) as n (n.id)}
      <A.Hint kind="expand" x={n.x + n.size * 0.36} y={n.y - n.size * 0.26} time={view.time} />
    {/each}
  {/if}
  {#each packets as p (p.id)}
    <A.Packet kind={p.kind} pose={p.pose} colour={C.packet[p.kind]} time={view.time} followed={view.followId === p.id} />
  {/each}
</g>
