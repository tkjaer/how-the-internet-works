<script lang="ts">
  // IP is what every router reads. The access point (a bridge) doesn't; the home router rewrites the sender (NAT).
  import type { Snippet } from 'svelte';
  import Envelope from '../_shared/Envelope.svelte';
  import { ADDR, lt, type LayerCtx } from '../stacks';
  let { ctx, depth, children }: { ctx: LayerCtx; depth: number; children?: Snippet } = $props();
  const L = (k: string) => (void ctx.level, lt(`layer.ip.${k}`, ctx.level));
  const req = $derived(ctx.packet === 'request');
  const home = $derived(ctx.side === 'private' ? ADDR.phone : ADDR.public);
  const fields = $derived<[string, string][]>(ctx.level === 'nerd'
    ? [[L('from'), req ? home : ADDR.server], [L('to'), req ? ADDR.server : home], ['TTL', ctx.side === 'private' ? '64' : '61']]
    : [[L('from'), L(req ? 'you' : 'server')], [L('to'), L(req ? 'server' : 'you')]]);
  const note = $derived(ctx.role === 'nat' ? L(req ? 'nat' : 'unnat') : ctx.role === 'bridge' ? L('bridge') : ctx.role === 'router' ? L('read') : L('arrived'));
</script>

<Envelope id="ip" name={L('name')} open {depth} {fields} {note}>{@render children?.()}</Envelope>
