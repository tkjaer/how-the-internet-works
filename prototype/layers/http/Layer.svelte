<script lang="ts">
  import Envelope from '../_shared/Envelope.svelte';
  import { lt, type LayerCtx } from '../stacks';
  let { ctx, depth }: { ctx: LayerCtx; depth: number } = $props();
  const L = (k: string) => (void ctx.level, lt(`layer.http.${k}`, ctx.level));
  const req = $derived(ctx.packet === 'request');
  const fields = $derived<[string, string][]>(ctx.level === 'nerd'
    ? req ? [['', 'GET /v/cats/seg-042.m4s'], ['Host', 'video.example']] : [['', '200 OK'], ['Content-Type', 'video/mp4']]
    : []);
</script>

<Envelope id="http" name={L('name')} open {depth} {fields} note={L(req ? 'request' : 'video')} />
