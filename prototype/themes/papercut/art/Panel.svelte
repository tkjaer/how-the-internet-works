<svelte:options namespace="svg" />
<script lang="ts">
  import type { PanelProps } from '../../../core/theme-types';
  import Depth from '../../../scenes/Depth.svelte';
  let { scene, part, w, h, orient }: PanelProps = $props();
  const port = $derived(orient === 'portrait');
</script>

{#if part === 'back'}
  <rect width={w} height={h} fill="var(--panel-paper)" />
  {#if scene === 'wifi'}
    <Depth d={0.45}>
      <path class="panel-shadow" d={port ? `M-80 ${h*.24} C180 ${h*.14} 320 ${h*.31} 520 ${h*.18} C690 ${h*.08} 820 ${h*.23} 980 ${h*.13} L980 ${h*.42} C690 ${h*.50} 530 ${h*.36} 330 ${h*.48} C120 ${h*.60} 10 ${h*.42} -80 ${h*.56} Z` : `M-80 165 C240 60 480 240 760 130 C980 30 1200 215 1680 80 L1680 315 C1260 430 940 270 700 375 C410 500 160 300 -80 420 Z`} />
      <path class="wifi-layer-a" d={port ? `M-80 ${h*.24} C180 ${h*.14} 320 ${h*.31} 520 ${h*.18} C690 ${h*.08} 820 ${h*.23} 980 ${h*.13} L980 ${h*.42} C690 ${h*.50} 530 ${h*.36} 330 ${h*.48} C120 ${h*.60} 10 ${h*.42} -80 ${h*.56} Z` : `M-80 165 C240 60 480 240 760 130 C980 30 1200 215 1680 80 L1680 315 C1260 430 940 270 700 375 C410 500 160 300 -80 420 Z`} />
    </Depth>
    <Depth d={0.85}>
      <path class="panel-shadow" d={port ? `M-60 ${h*.68} C120 ${h*.56} 290 ${h*.75} 450 ${h*.62} C620 ${h*.48} 770 ${h*.70} 960 ${h*.57} L960 ${h+60} L-60 ${h+60} Z` : `M-60 630 C230 510 470 720 770 570 C1010 445 1230 700 1660 540 L1660 960 L-60 960 Z`} />
      <path class="wifi-layer-b" d={port ? `M-60 ${h*.68} C120 ${h*.56} 290 ${h*.75} 450 ${h*.62} C620 ${h*.48} 770 ${h*.70} 960 ${h*.57} L960 ${h+60} L-60 ${h+60} Z` : `M-60 630 C230 510 470 720 770 570 C1010 445 1230 700 1660 540 L1660 960 L-60 960 Z`} />
    </Depth>
  {:else if scene === 'fibre'}
    <Depth d={0.4}>
      <path class="panel-shadow" d={port ? `M-80 ${h*.22} L970 ${h*.11} L970 ${h*.26} L-80 ${h*.39} Z` : `M-80 120 L1680 70 L1680 210 L-80 280 Z`} />
      <path class="strata-a" d={port ? `M-80 ${h*.22} L970 ${h*.11} L970 ${h*.26} L-80 ${h*.39} Z` : `M-80 120 L1680 70 L1680 210 L-80 280 Z`} />
    </Depth>
    <Depth d={0.7}>
      <path class="panel-shadow" d={port ? `M-80 ${h*.74} L970 ${h*.59} L970 ${h*.80} L-80 ${h*.95} Z` : `M-80 690 L1680 570 L1680 760 L-80 860 Z`} />
      <path class="strata-b" d={port ? `M-80 ${h*.74} L970 ${h*.59} L970 ${h*.80} L-80 ${h*.95} Z` : `M-80 690 L1680 570 L1680 760 L-80 860 Z`} />
    </Depth>
  {/if}
  <rect x="0" y="0" width={w} height="34" fill="var(--panel-inner-shadow)" opacity=".45" />
  <rect x="0" y="0" width="34" height={h} fill="var(--panel-inner-shadow)" opacity=".34" />
{:else}
  <rect x="10" y="10" width={w - 20} height={h - 20} rx="62" fill="none" stroke="var(--panel-mat-shadow)" stroke-width="38" transform="translate(10 12)" opacity=".42" />
  <rect x="10" y="10" width={w - 20} height={h - 20} rx="62" fill="none" stroke="var(--panel-mat)" stroke-width="38" />
  <path d={`M36 73 Q${w/2} 55 ${w-36} 70`} fill="none" stroke="var(--panel-inner-shadow)" stroke-width="14" stroke-linecap="round" opacity=".55" />
  <path d={`M72 38 Q54 ${h/2} 70 ${h-38}`} fill="none" stroke="var(--panel-inner-shadow)" stroke-width="14" stroke-linecap="round" opacity=".38" />
{/if}

<style>
  .panel-shadow { fill: var(--paper-shadow); transform: translate(10px, 12px); opacity: .32; }
  .wifi-layer-a { fill: var(--paper-deep); opacity: .46; }
  .wifi-layer-b { fill: var(--paper-teal); opacity: .46; }
  .strata-a { fill: var(--paper-coral); opacity: .45; }
  .strata-b { fill: var(--paper-sage); opacity: .6; }
</style>
