<script lang="ts">
  // Peek inside the followed packet: its nested envelopes for the link it is on right now. Each envelope is a
  // reusable layer component (prototype/layers/<id>) that decides what it shows from the context (issue #5).
  import type { LivePacket } from '../core/packets';
  import { contextFor, LAYERS, stackFor } from '../layers/stacks';
  import { loc, tr } from '../state.svelte';
  import Icon from './Icon.svelte';
  let { packet, onclose }: { packet: LivePacket; onclose: () => void } = $props();
  const ctx = $derived(contextFor(packet.kind, packet.pose.link, packet.pose.reverse, loc.level));
  const stack = $derived(stackFor(packet.pose.link));
  // re-mount (and re-animate the unwrap/rewrap) whenever the packet moves onto a new link
  const sig = $derived(`${packet.pose.link.id}:${packet.pose.reverse}`);
</script>

<aside class="peek card" data-ui aria-live="polite">
  <header>
    <h2>{tr(`peek.${packet.kind}`)}</h2>
    <button class="btn" onclick={onclose} aria-label={tr('peek.close')}><Icon name="close" /></button>
  </header>
  <p class="where">{tr('peek.where').replace('{from}', tr(`node.${ctx.from}`)).replace('{to}', tr(`node.${ctx.to}`))}</p>
  {#key sig}
    {@render nest(0)}
  {/key}
</aside>

{#snippet nest(i: number)}
  {@const Layer = LAYERS[stack[i]]}
  {#if Layer}
    <Layer {ctx} depth={i}>{#if i + 1 < stack.length}{@render nest(i + 1)}{/if}</Layer>
  {/if}
{/snippet}
