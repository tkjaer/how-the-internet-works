<script lang="ts">
  // TCP stays sealed on the way: only the phone and the server open it. The home router peeks at the port (NAT).
  import type { Snippet } from 'svelte';
  import Envelope from '../_shared/Envelope.svelte';
  import { lt, type LayerCtx } from '../stacks';
  let { ctx, depth, children }: { ctx: LayerCtx; depth: number; children?: Snippet } = $props();
  const L = (k: string) => (void ctx.level, lt(`layer.tcp.${k}`, ctx.level));
  const open = $derived(ctx.role === 'endpoint');
  const req = $derived(ctx.packet === 'request');
  const fields = $derived<[string, string][]>(ctx.level === 'nerd'
    ? open || ctx.role === 'nat'
      ? [[L('ports'), req ? '51034 → 443' : '443 → 51034'], ...(open ? [[L('seq'), req ? '1 · ACK 88 321' : '88 321 · len 1 380'] as [string, string]] : [])]
      : []
    : open ? [[L('piece'), req ? '1' : '42']] : []);
  const note = $derived(open ? '' : ctx.role === 'nat' && ctx.level === 'nerd' ? L('peek') : '');
</script>

<Envelope id="tcp" name={L('name')} {open} {depth} {fields} {note} sealed={L('sealed')}>{@render children?.()}</Envelope>
