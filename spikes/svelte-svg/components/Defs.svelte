<svelte:options namespace="svg" />
<script lang="ts">
  import { BG, PACKET_COLOUR, WORLD } from '../../shared/scene';
  import { FIBRE } from '../../shared/details';
</script>

<defs>
  <radialGradient id="bg" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color={BG.top} /><stop offset="1" stop-color={BG.bottom} /></radialGradient>
  <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1.6" fill={BG.grid} /></pattern>
  {#each Object.entries(PACKET_COLOUR) as [k, c]}
    <radialGradient id="halo-{k}"><stop offset="0" stop-color={c} stop-opacity=".7" /><stop offset="1" stop-color={c} stop-opacity="0" /></radialGradient>
  {/each}
  {#each FIBRE.colours as c, i}
    <radialGradient id="glow-{i}"><stop offset="0" stop-color="#fff" /><stop offset=".25" stop-color={c} stop-opacity=".9" /><stop offset="1" stop-color={c} stop-opacity="0" /></radialGradient>
  {/each}
  <clipPath id="panel-clip"><rect x="0" y="0" width={WORLD.w} height={WORLD.h} rx="60" /></clipPath>
  <g id="parcel-request">
    <circle r="30" fill="url(#halo-request)" />
    <rect x="-13" y="-10" width="26" height="20" rx="5" fill={PACKET_COLOUR.request} />
    <path d="M-11 -7 L0 2 L11 -7" fill="none" stroke="#7a5a00" stroke-width="2.4" stroke-linecap="round" />
  </g>
  <g id="parcel-video">
    <circle r="38" fill="url(#halo-video)" />
    <rect x="-16" y="-16" width="32" height="32" rx="7" fill={PACKET_COLOUR.video} />
    <path d="M-5 -8 L-5 8 L8 0 Z" fill="#fff" />
  </g>
</defs>
