<script lang="ts">
  import type { Snippet } from 'svelte';
  import Envelope from '../_shared/Envelope.svelte';
  import { lt, type LayerCtx } from '../stacks';
  let { ctx, depth, children }: { ctx: LayerCtx; depth: number; children?: Snippet } = $props();
  const L = (k: string) => (void ctx.level, lt(`layer.tls.${k}`, ctx.level));
  const fields = $derived<[string, string][]>(ctx.level === 'nerd' ? [['', 'TLS 1.3 · AES-128-GCM']] : []);
</script>

<Envelope id="tls" name={L('name')} open={ctx.role === 'endpoint'} {depth} {fields} note={L('note')} sealed={L('sealed')}>{@render children?.()}</Envelope>
