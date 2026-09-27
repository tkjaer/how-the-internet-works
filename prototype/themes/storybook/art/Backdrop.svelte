<svelte:options namespace="svg" />
<script lang="ts">
  import type { BackdropProps } from '../../../core/theme-types';
  import Depth from '../../../scenes/Depth.svelte';
  let { scene, orient, w, h, time }: BackdropProps = $props();
  const portrait = $derived(orient === 'portrait');
  const cloudBob = $derived(Math.sin(time * 0.55) * 4);
</script>

<!-- THESIS: teach networks as a warm picture-book journey, not a glowing tech diagram. OWN-WORLD: peach sky, rolling green paper hills, chunky brown outlines, smiling devices, luggage tags. STORY: packets run from a cut-away home through roads, radio, fibre and a cloud-town internet. FIRST VIEWPORT: house sits low/left, internet town beyond hills, labels float like painted signs. FORM: brief-pinned flat storybook world, springy motion, no SVG filters. -->

{#if scene === 'overview'}
  <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="var(--sky, #ffeccf)" />
  <Depth d={0.35}>
    <circle cx={portrait ? 170 : 1320} cy={portrait ? 170 : 150} r={portrait ? 62 : 70} fill="#ffcf5d" stroke="#6b3f2a" stroke-width="6" />
    <path d={portrait ? 'M500 185 C535 135 615 145 628 198 C690 194 720 235 692 275 H485 C450 252 456 203 500 185 Z' : 'M160 130 C194 86 268 96 282 145 C340 142 368 178 342 214 H146 C112 193 123 145 160 130 Z'} fill="#fff7df" stroke="#6b3f2a" stroke-width="6" />
    <path d={portrait ? 'M100 420 C132 384 192 392 205 436 C252 435 279 464 260 498 H86 C60 478 69 438 100 420 Z' : 'M760 96 C792 62 850 70 862 112 C912 112 940 142 918 174 H744 C714 157 724 113 760 96 Z'} fill="#fffaf0" stroke="#6b3f2a" stroke-width="5" opacity="0.95" />
  </Depth>
  <Depth d={0.62}>
    <path d={portrait ? `M-80 ${h * 0.38} C180 ${h * 0.26} 400 ${h * 0.50} 700 ${h * 0.33} C900 ${h * 0.22} 1100 ${h * 0.34} 1050 ${h * 0.48} L1050 ${h * 1.4} H-80 Z` : `M-100 500 C170 350 360 520 580 410 C820 290 1050 470 1280 330 C1450 230 1700 340 1740 490 L1740 1100 H-100 Z`} fill="#b9d887" stroke="#6b3f2a" stroke-width="7" />
  </Depth>
  <Depth d={0.82}>
    <path d={portrait ? `M-100 ${h * 0.56} C160 ${h * 0.44} 310 ${h * 0.63} 520 ${h * 0.52} C700 ${h * 0.43} 860 ${h * 0.50} 1020 ${h * 0.44} L1020 ${h * 1.4} H-100 Z` : `M-120 650 C130 520 330 670 550 560 C780 450 1020 660 1270 505 C1450 395 1650 460 1740 560 L1740 1100 H-120 Z`} fill="#8fc978" stroke="#6b3f2a" stroke-width="8" />
  </Depth>
  <Depth d={0.42}>
    <g transform={portrait ? 'translate(545 250) scale(1.05)' : 'translate(1260 250)'}>
      <path d="M-120 110 C-92 58 -20 58 0 102 C42 84 92 112 92 160 C92 198 58 224 18 218 H-110 C-158 218 -186 186 -174 150 C-166 126 -148 114 -120 110 Z" fill="#fff6df" stroke="#6b3f2a" stroke-width="7" />
      <path d="M-55 166 q16 18 34 0" fill="none" stroke="#6b3f2a" stroke-width="5" stroke-linecap="round" />
      <circle cx="-65" cy="143" r="6" fill="#6b3f2a" />
      <circle cx="-8" cy="143" r="6" fill="#6b3f2a" />
      <g fill="#f28f5b" stroke="#6b3f2a" stroke-width="4">
        <rect x="20" y="130" width="34" height="58" rx="5" />
        <rect x="58" y="112" width="42" height="76" rx="5" fill="#72b8a5" />
        <rect x="104" y="138" width="30" height="50" rx="5" fill="#e4a342" />
      </g>
    </g>
  </Depth>
  <Depth d={1.03}>
    {#if portrait}
      <g transform="translate(34 1070)">
        <path d="M40 230 H812 V500 H40 Z" fill="#ffd89c" stroke="#6b3f2a" stroke-width="9" />
        <path d="M-5 235 L430 20 L855 235 Z" fill="#f28057" stroke="#6b3f2a" stroke-width="9" stroke-linejoin="round" />
        <path d="M93 288 H740 V468 H93 Z" fill="#fff2d7" stroke="#6b3f2a" stroke-width="5" opacity="0.72" />
        <path d="M420 286 V468 M96 374 H738" stroke="#6b3f2a" stroke-width="4" opacity="0.25" />
      </g>
    {:else}
      <g transform="translate(54 290)">
        <path d="M55 130 H1070 V500 H55 Z" fill="#ffd89c" stroke="#6b3f2a" stroke-width="9" />
        <path d="M0 136 L275 0 L555 136 Z" fill="#f28057" stroke="#6b3f2a" stroke-width="9" stroke-linejoin="round" />
        <path d="M555 136 L795 12 L1128 136 Z" fill="#ed9b55" stroke="#6b3f2a" stroke-width="9" stroke-linejoin="round" />
        <path d="M120 190 H1020 V452 H120 Z" fill="#fff2d7" stroke="#6b3f2a" stroke-width="5" opacity="0.74" />
        <path d="M505 188 V452 M120 318 H1020" stroke="#6b3f2a" stroke-width="4" opacity="0.24" />
      </g>
    {/if}
  </Depth>
{:else if scene === 'internet'}
  <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="var(--sky, #ffeccf)" />
  <Depth d={0.42}>
    <circle cx={portrait ? 730 : 1360} cy={portrait ? 120 : 115} r="56" fill="#ffcf5d" stroke="#6b3f2a" stroke-width="6" />
    <path d={portrait ? 'M-80 650 C170 500 340 680 560 540 C720 438 920 545 1020 475 L1020 1760 H-80 Z' : 'M-100 430 C210 270 430 470 680 340 C950 200 1180 420 1500 250 C1640 190 1760 250 1780 340 L1780 1050 H-100 Z'} fill="#acd87e" stroke="#6b3f2a" stroke-width="7" />
  </Depth>
  <Depth d={0.75}>
    <path d={portrait ? 'M-100 940 C150 805 310 980 530 875 C715 786 900 855 1030 785 L1030 1760 H-100 Z' : 'M-120 610 C150 460 360 640 580 530 C820 410 1040 620 1290 470 C1450 380 1660 430 1760 520 L1760 1050 H-120 Z'} fill="#78bd6d" stroke="#6b3f2a" stroke-width="8" />
    <path d={portrait ? 'M190 1510 C310 1320 570 1180 690 1020 C760 920 740 810 650 710' : 'M80 700 C300 560 500 735 720 585 C950 430 1210 610 1510 640'} fill="none" stroke="#6b3f2a" stroke-width="54" stroke-linecap="round" opacity="0.22" />
    <path d={portrait ? 'M190 1510 C310 1320 570 1180 690 1020 C760 920 740 810 650 710' : 'M80 700 C300 560 500 735 720 585 C950 430 1210 610 1510 640'} fill="none" stroke="#f3c989" stroke-width="38" stroke-linecap="round" />
    <path d={portrait ? 'M190 1510 C310 1320 570 1180 690 1020 C760 920 740 810 650 710' : 'M80 700 C300 560 500 735 720 585 C950 430 1210 610 1510 640'} fill="none" stroke="#fff7dc" stroke-width="5" stroke-linecap="round" stroke-dasharray="22 28" />
  </Depth>
  <Depth d={0.56}>
    <g transform={portrait ? 'translate(540 240) scale(.95)' : 'translate(1060 150)'} fill="#f28f5b" stroke="#6b3f2a" stroke-width="5">
      <rect x="0" y="110" width="46" height="120" rx="7" />
      <rect x="55" y="70" width="58" height="160" rx="7" fill="#72b8a5" />
      <rect x="124" y="34" width="50" height="196" rx="7" fill="#e4a342" />
      <rect x="186" y="92" width="70" height="138" rx="7" fill="#bf6f8f" />
      <path d="M-38 236 H300" stroke-linecap="round" />
      <g fill="#fff2d7" stroke-width="3">
        {#each [0,1,2,3] as i}<rect x={67} y={92 + i * 28} width="28" height="14" rx="3" />{/each}
        {#each [0,1,2] as i}<rect x={137} y={58 + i * 38} width="24" height="16" rx="3" />{/each}
      </g>
    </g>
  </Depth>
{/if}
