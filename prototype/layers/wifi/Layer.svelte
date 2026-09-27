<script lang="ts">
  import type { Snippet } from 'svelte';
  import Envelope from '../_shared/Envelope.svelte';
  import { dn, lt, type LayerCtx } from '../stacks';
  let { ctx, depth, children }: { ctx: LayerCtx; depth: number; children?: Snippet } = $props();
  const L = (k: string) => (void ctx.level, lt(`layer.wifi.${k}`, ctx.level));
  const up = $derived(ctx.to === 'ap');
  const fields = $derived<[string, string][]>(ctx.level === 'nerd'
    ? [[L('to'), up ? 'AP a4:2b:b0:11:22:33' : 'phone 6e:3f:9a:7c:01:be'], [L('band'), '5 GHz · ch 36 · 802.11ax']]
    : [[L('to'), dn(ctx.to)]]);
</script>

<Envelope id="wifi" name={L('name')} open {depth} {fields} note={L('note')}>{@render children?.()}</Envelope>
