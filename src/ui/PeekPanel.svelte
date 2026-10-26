<script lang="ts">
  // The caught packet at one hop (issue #17). Traffic is paused; ◀ ▶ step the packet along its path, spatially: the
  // button pointing the way it moves on screen (a response: ◀; portrait: ▲ / ▼) takes it on, and is the filled one. The panel shows
  // what this hop does, the envelopes taken off here, then the packet as it leaves: every layer sealed, closed or
  // opened, the fields the hop uses marked and the ones it changed as old → new. "Details" swaps the envelopes for
  // a protocol tree. A layer with a dive gets a magnifier that flies into it at this hop (issue #8), and below the
  // envelopes, the link they leave on leads down to how it carries them (issue #13).
  // Its title takes focus when it opens; each hop is announced, and read aloud when that is on (#53).
  // On a phone it is a `sheet` (#139): about a third of the screen, at the bottom (upright) or the side (on its side),
  // so the scene and the caught packet stay in view; under the hop's row it scrolls, and its grip opens it all the way.
  import { onMount, untrack } from 'svelte';
  import { hopStepFor, hopView, peekKeys, stepHop, type Dir, type LayerView } from '../model/packet';
  import type { Route } from '../model/resolve';
  import { layerPath, linkDivePath, linkOut } from '../model/tree';
  import { loadDive } from '../render/lazy.svelte';
  import { sceneTitle } from './caption';
  import { fill, loc, nameOf, readAloud, tr, trActivity, trFirst, trl, yours } from '../state.svelte';
  import { announce } from './announce.svelte';
  import Envelope from './Envelope.svelte';
  import FieldTree from './FieldTree.svelte';
  import Icon from './Icon.svelte';
  let { route, portrait, sheet, flow, kind, dir, hop, onstep, onclose, ondive, ondown }: {
    route: Route; portrait: boolean; sheet: boolean; flow: string; kind: string; dir: Dir; hop: number;
    onstep: (d: -1 | 1) => void; onclose: () => void; ondive: (path: string[], env: HTMLElement) => void;
    ondown: (path: string[]) => void;
  } = $props();
  let detail = $state(false), full = $state(false);
  const v = $derived(hopView(route, flow, dir, hop));
  const client = $derived(route.chain[0]);
  const n = $derived(route.chain.length);
  const at = $derived(v.hop);
  const first = $derived(dir === 'up' ? 0 : n - 1);
  const says = $derived(fill(trFirst(peekKeys(route, hop, dir), loc.level), { hop: at === client ? yours(at) : nameOf(at) }));
  const off = $derived(v.layers.filter((l) => l.change === 'removed'));
  const kept = $derived(v.layers.filter((l) => l.change !== 'removed'));
  // what changed here (at Simple: only the fields it shows)
  const changed = $derived(kept.flatMap((l) => l.fields.filter((f) => f.before && (loc.level === 'technical' || f.simple)).map((f) => trl(`layer.${l.id}.field.${f.id}.name`))));
  const dives = $derived(new Map(v.layers.flatMap((l) => {
    const p = layerPath(route, at.id, l.id);
    return p ? [[l.id, p] as const] : [];
  })));
  $effect(() => { for (const id of dives.keys()) void loadDive(route.content.layers[id].dive!); });
  const dive = (l: LayerView) => (dives.has(l.id) ? (env: HTMLElement) => ondive(dives.get(l.id)!, env) : undefined);
  const lname = (id: string) => trl(`layer.${id}.name`);
  const name = $derived(at === client ? yours(at) : nameOf(at));
  const count = $derived(fill(tr('peek.hop'), { n: Math.abs(hop - first) + 1, of: n }));
  let title: HTMLHeadingElement, scroller: HTMLDivElement;
  onMount(() => title.focus());
  // a sheet starts each hop at its top, with what the hop does
  $effect(() => { void hop; void dir; scroller.scrollTop = 0; });
  $effect(() => {
    const line = `${name}, ${count}. ${says}`;
    announce(line);
    untrack(() => readAloud(line));
  });
  const down = $derived.by(() => {
    const link = linkOut(route, hop, dir), path = link && linkDivePath(route, link);
    return path ? { path, name: sceneTitle(route, path, 'landscape') } : null;
  });
</script>

<section class="peek card" class:wide={detail} class:sheet class:full data-ui aria-labelledby="peek-title">
  <header>
    <h2 id="peek-title" tabindex="-1" bind:this={title}>{trActivity(route.activity, `peek.${kind}`)}</h2>
    <button class="btn chip" class:on={detail} aria-pressed={detail} onclick={() => (detail = !detail)}>{tr('peek.detail')}</button>
    <button class="btn" onclick={onclose} aria-label={tr('peek.close')}><Icon name="close" /></button>
  </header>
  <div class="hopnav" role="group" aria-label={tr('peek.path')}>
    {#snippet stepper(s: -1 | 1)}
      {@const d = hopStepFor(dir, s)}
      <button class="btn" class:fwd={d > 0} onclick={() => onstep(d)} disabled={stepHop(route, hop, dir, d) === null}
        aria-label={tr(d > 0 ? 'peek.next' : 'peek.prev')}><Icon name="arrow" solid rotate={portrait ? -90 * s : s > 0 ? 0 : 180} /></button>
    {/snippet}
    {@render stepper(-1)}
    <p><strong>{name}</strong><small>{count}</small></p>
    {@render stepper(1)}
  </div>
  {#if sheet}
    <button class="peek-grip" aria-expanded={full} aria-label={tr('peek.full')} title={tr('peek.full')} onclick={() => (full = !full)}></button>
  {/if}
  <div class="peek-scroll" bind:this={scroller}>
    <p class="where" dir="auto">{says}</p>
    {#if off.length || changed.length || v.layers.some((l) => l.change === 'added' && v.arrive)}
      <ul class="chips" aria-label={tr('peek.changed')}>
        {#each off as l}<li class="chip-off">− {lname(l.id)}</li>{/each}
        {#each kept.filter((l) => l.change === 'added' && v.arrive) as l}<li class="chip-on">+ {lname(l.id)}</li>{/each}
        {#each changed as c}<li class="chip-edit">✎ {c}</li>{/each}
      </ul>
    {/if}
    {#if dives.size && !detail}<p class="where dive-hint">{tr('peek.dive')}</p>{/if}
    <div class="peek-body">
      {#if detail}
        <FieldTree {v} {route} />
      {:else}
        {#key `${hop}:${dir}`}
          {#if off.length}
            <p class="off-label">{tr('peek.off')}</p>
            <div class="off-row">
              {#each off as l, i (l.id)}<Envelope layer={l} {client} depth={i} off dive={dive(l)} />{/each}
            </div>
          {/if}
          {@render nest(0)}
        {/key}
      {/if}
    </div>
    {#if down}
      <button class="btn chip travels door-down" onclick={() => ondown(down.path)}><Icon name="wave" /><span dir="auto">{fill(tr('peek.travels'), { name: down.name })}</span></button>
    {/if}
  </div>
</section>

{#snippet nest(i: number)}
  {@const l = kept[i]}
  {#if l}
    <Envelope layer={l} {client} depth={i} dive={dive(l)}>{#if i + 1 < kept.length}{@render nest(i + 1)}{/if}</Envelope>
  {/if}
{/snippet}
