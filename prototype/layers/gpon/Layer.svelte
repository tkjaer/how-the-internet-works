<script lang="ts">
  import type { Snippet } from 'svelte';
  import Envelope from '../_shared/Envelope.svelte';
  import { lt, type LayerCtx } from '../stacks';
  let { ctx, depth, children }: { ctx: LayerCtx; depth: number; children?: Snippet } = $props();
  const L = (k: string) => (void ctx.level, lt(`layer.gpon.${k}`, ctx.level));
  const fields = $derived<[string, string][]>(ctx.level === 'nerd'
    ? [['GEM port', '1127'], [L('colour'), ctx.to === 'router' || ctx.to === 'home' ? '1577 nm ↓' : '1270 nm ↑']]
    : [[L('colour'), L(ctx.to === 'router' || ctx.to === 'home' ? 'down' : 'up')]]);
</script>

<Envelope id="gpon" name={L('name')} open {depth} {fields} note={L('note')}>{@render children?.()}</Envelope>
