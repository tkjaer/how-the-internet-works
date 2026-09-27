<script lang="ts">
  // The shared look of one envelope layer in the peek panel. Styled entirely with theme tokens (--env-*).
  import type { Snippet } from 'svelte';
  let { id, name, open, depth, fields = [], note = '', sealed = '', children }: {
    id: string; name: string; open: boolean; depth: number; fields?: [string, string][]; note?: string; sealed?: string; children?: Snippet;
  } = $props();
</script>

<div class="env env-{id}" class:sealed={!open} style:--d={depth}>
  <div class="env-head">
    <span class="env-name">{name}</span>
    {#if !open}
      <svg class="env-lock" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5 7 V5 a3 3 0 0 1 6 0 V7" fill="none" /></svg>
    {/if}
  </div>
  {#if fields.length}
    <dl class="env-fields">{#each fields as [k, v]}<div>{#if k}<dt>{k}</dt>{/if}<dd dir="auto">{v}</dd></div>{/each}</dl>
  {/if}
  {#if note}<p class="env-note" dir="auto">{note}</p>{/if}
  {#if open && children}
    <div class="env-inner">{@render children()}</div>
  {:else if !open && sealed}
    <p class="env-sealed" dir="auto">{sealed}</p>
  {/if}
</div>
