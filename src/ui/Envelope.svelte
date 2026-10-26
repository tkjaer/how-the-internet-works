<script lang="ts">
  // One layer of the caught packet as the hop sees it (issue #17): its header fields with the values on the wire here,
  // what the hop uses highlighted and what it changed shown as old → new (read as "new, was old"). Sealed layers stay
  // shut. At Simple it shows only the fields that matter here, by name; at Technical every field. When the layer has a dive, its
  // head flies into it.
  import type { Snippet } from 'svelte';
  import type { FieldView, LayerView, Val } from '../model/packet';
  import { fill, loc, nameOf, tr, trFirst, trl, yours } from '../state.svelte';
  import type { Hop } from '../model/resolve';
  import Change from './Change.svelte';
  let { layer, client, depth, off = false, dive, children }: {
    layer: LayerView; client: Hop; depth: number; off?: boolean; dive?: (env: HTMLElement) => void; children?: Snippet;
  } = $props();
  let el: HTMLDivElement;
  const simple = $derived(loc.level === 'simple');
  const id = $derived(layer.id);
  const name = $derived(trl(`layer.${id}.name`));
  const sealed = $derived(layer.state === 'sealed');
  const fields = $derived(sealed ? [] : simple ? layer.fields.filter((f) => f.simple && (f.used || f.before || layer.change === 'added')) : layer.fields);
  const note = $derived(layer.state === 'closed' && simple ? fill(trFirst([`layer.${id}.sealed`], 'simple'), { yours: yours(client) }) : '');
  const who = (h: Hop) => (h === client ? yours(h) : nameOf(h));
  const show = (v: Val) => (v.key ? trl(v.key) : simple && v.who ? who(v.who) : v.text);
  const now = (f: FieldView) => show(simple && f.simple ? f.simple : f.value);
</script>

<div class="env env-{id} {layer.state}" class:added={layer.change === 'added'} class:off style:--d={depth} bind:this={el}>
  {#if dive}
    <button class="env-head env-go" onclick={() => dive(el)} aria-label={fill(tr('peek.look'), { name })}>{@render head()}
      <svg class="env-dive" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" /><circle cx="10.5" cy="10.5" r="4.2" /><path d="M13.6 13.6 L17.5 17.5" /></svg>
    </button>
  {:else}
    <div class="env-head">{@render head()}</div>
  {/if}
  {#if fields.length}
    <dl class="env-fields">
      {#each fields as f (f.id)}
        <div class:used={f.used} class:changed={!!f.before} title={f.used ? trl('peek.used') : undefined}>
          <dt>{trl(`layer.${id}.field.${f.id}.name`)}</dt>
          <dd dir={simple ? 'auto' : 'ltr'}>{#if f.before}<Change was={show(f.before)} now={now(f)} />{:else}{now(f)}{/if}{#if !simple && f.value.who}<small> · {who(f.value.who)}</small>{/if}</dd>
        </div>
      {/each}
    </dl>
  {/if}
  {#if note}<p class="env-sealed" dir="auto">{note}</p>{/if}
  {#if children}<div class="env-inner">{@render children()}</div>{/if}
</div>

{#snippet head()}
  {#if layer.change === 'added' && !off}<span class="env-tag on" aria-hidden="true">+</span>{/if}
  <span class="env-name">{name}</span>
  {#if sealed}
    <svg class="env-lock" viewBox="0 0 16 16" aria-label={trl('peek.sealed')}><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5 7 V5 a3 3 0 0 1 6 0 V7" fill="none" /></svg>
  {:else if layer.state === 'closed' && !simple}<span class="env-tag">{tr('peek.closed')}</span>{/if}
{/snippet}
