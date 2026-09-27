<script lang="ts">
  // Big ◀ ▶ buttons for walking sideways along the path (portrait: ▼ ▲, since the path runs upwards).
  import { tr } from '../state.svelte';
  import Icon from './Icon.svelte';
  let { portrait, canPrev, canNext, onstep, nudge }: {
    portrait: boolean; canPrev: boolean; canNext: boolean; onstep: (d: -1 | 1) => void; nudge: { dir: number; n: number };
  } = $props();
  // Diagrams are not mirrored in RTL, so the arrows point where the camera goes: "next" is always to the right/up.
  const rot = (d: -1 | 1) => (portrait ? (d > 0 ? -90 : 90) : d > 0 ? 0 : 180);
</script>

{#each [-1, 1] as const as d}
  {#key nudge.dir === d ? nudge.n : 0}
    <button class="step card btn {d < 0 ? 'prev' : 'next'}" class:nudge={nudge.dir === d && nudge.n > 0} data-ui
      style:--nx="{portrait ? 0 : d * 6}px" style:--ny="{portrait ? -d * 6 : 0}px"
      aria-label={tr(d < 0 ? 'nav.prev' : 'nav.next')} onclick={() => onstep(d)} aria-disabled={d < 0 ? !canPrev : !canNext}>
      <Icon name="chevron" rotate={rot(d)} />
    </button>
  {/key}
{/each}
