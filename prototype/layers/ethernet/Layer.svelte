<script lang="ts">
  import type { Snippet } from 'svelte';
  import Envelope from '../_shared/Envelope.svelte';
  import { dn, lt, type LayerCtx } from '../stacks';
  let { ctx, depth, children }: { ctx: LayerCtx; depth: number; children?: Snippet } = $props();
  const L = (k: string) => (void ctx.level, lt(`layer.ethernet.${k}`, ctx.level));
  const vlan = $derived(ctx.link.id === 'cabinet-backhaul' || ctx.link.id === 'backhaul-bng');
  const fields = $derived<[string, string][]>(ctx.level === 'nerd'
    ? [[L('to'), `${dn(ctx.to)} · 3c:ec:ef:1a:9d:40`], ['EtherType', '0x0800 (IPv4)'], ...(vlan ? [['VLAN', '101 (S) · 2042 (C)'] as [string, string]] : [])]
    : [[L('to'), dn(ctx.to)]]);
</script>

<Envelope id="ethernet" name={L('name')} open {depth} {fields} note={vlan ? L('vlan') : L('note')}>{@render children?.()}</Envelope>
