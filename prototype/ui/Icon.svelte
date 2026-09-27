<script lang="ts">
  import { ICON } from './icons';
  let { name, rotate = 0 }: { name: keyof typeof ICON; rotate?: number } = $props();
</script>

<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style:rotate="{rotate}deg"><path d={ICON[name]} /></svg>
