<script lang="ts">
  import type { Snippet } from 'svelte';
  import Envelope from '../_shared/Envelope.svelte';
  import { lt, type LayerCtx } from '../stacks';
  let { ctx, depth, children }: { ctx: LayerCtx; depth: number; children?: Snippet } = $props();
  const L = (k: string) => (void ctx.level, lt(`layer.mpls.${k}`, ctx.level));
  const fields = $derived<[string, string][]>(ctx.level === 'nerd' ? [[L('label'), '24012 · TC 0 · TTL 62']] : []);
</script>

<Envelope id="mpls" name={L('name')} open {depth} {fields} note={L('note')}>{@render children?.()}</Envelope>
