<svelte:options namespace="svg" />
<script lang="ts">
  // Generic device icons in a 200×200 box. Colours come from CSS tokens, so any theme can reuse these.
  import type { DeviceProps } from '../../core/theme-types';
  let { id, x, y, size, focused }: DeviceProps = $props();
</script>

<g class="dev dev-{id}" class:focused transform="translate({x - size / 2} {y - size / 2}) scale({size / 200})">
  {#if id === 'phone'}
    <rect class="b" x="58" y="14" width="84" height="172" rx="18" />
    <rect class="s" x="67" y="32" width="66" height="126" rx="7" />
    <path class="a" d="M93 74 L93 106 L117 90 Z" />
  {:else if id === 'ap'}
    <line class="l" x1="62" y1="124" x2="48" y2="52" /><line class="l" x1="138" y1="124" x2="152" y2="52" />
    <circle class="a" cx="48" cy="48" r="9" /><circle class="a" cx="152" cy="48" r="9" />
    <rect class="b" x="28" y="118" width="144" height="50" rx="18" />
    <path class="w" d="M82 100 A26 26 0 0 1 118 100" /><path class="w" d="M70 88 A42 42 0 0 1 130 88" />
  {:else if id === 'router' || id === 'home'}
    <line class="l" x1="58" y1="88" x2="44" y2="34" /><line class="l" x1="142" y1="88" x2="156" y2="34" />
    <rect class="b" x="20" y="82" width="160" height="70" rx="18" />
    <circle class="a led" cx="50" cy="117" r="7" /><circle class="a led" cx="72" cy="117" r="7" /><circle class="a led" cx="94" cy="117" r="7" />
  {:else if id === 'internet'}
    <path class="b" d="M40 152 H162 A31 31 0 0 0 152 92 A44 44 0 0 0 72 80 A38 38 0 0 0 40 152 Z" />
    <circle class="s" cx="104" cy="120" r="24" /><ellipse class="w" cx="104" cy="120" rx="10" ry="24" /><line class="w" x1="80" y1="120" x2="128" y2="120" />
  {:else if id === 'cabinet'}
    <rect class="b" x="50" y="30" width="100" height="150" rx="10" /><line class="l" x1="100" y1="40" x2="100" y2="170" />
    <circle class="a" cx="90" cy="105" r="5" /><circle class="a" cx="110" cy="105" r="5" />
  {:else if id === 'backhaul'}
    <rect class="b" x="20" y="70" width="160" height="60" rx="10" />
    {#each [0, 1, 2, 3, 4, 5] as i}<rect class="s" x={34 + i * 23} y="90" width="16" height="12" rx="2" />{/each}
    <circle class="a led" cx="40" cy="116" r="4" /><circle class="a led" cx="54" cy="116" r="4" />
  {:else if id === 'bng'}
    <rect class="b" x="30" y="40" width="140" height="120" rx="14" /><rect class="s" x="60" y="70" width="80" height="60" rx="8" />
    <path class="a" d="M100 78 L122 88 V104 C122 116 112 122 100 126 C88 122 78 116 78 104 V88 Z" />
  {:else if id === 'core'}
    <circle class="b" cx="100" cy="100" r="70" />
    <path class="w" d="M60 100 H140 M100 60 V140 M72 72 L128 128 M128 72 L72 128" />
    <circle class="a" cx="100" cy="100" r="14" />
  {:else if id === 'transit'}
    <circle class="b" cx="100" cy="100" r="66" /><ellipse class="w" cx="100" cy="100" rx="28" ry="66" />
    <path class="w" d="M34 100 H166 M44 66 H156 M44 134 H156" />
  {:else if id === 'ixp'}
    <rect class="b" x="24" y="56" width="152" height="88" rx="16" />
    {#each [0, 1, 2, 3] as i}<circle class="a" cx={52 + i * 32} cy="100" r="10" />{/each}
    <path class="w" d="M52 100 Q84 70 116 100 T148 100" />
  {:else if id === 'cdn'}
    {#each [0, 1, 2] as i}<rect class="b" x="40" y={40 + i * 42} width="120" height="34" rx="8" /><circle class="a led" cx="62" cy={57 + i * 42} r="5" />{/each}
    <path class="s" d="M120 50 L120 66 L134 58 Z" />
  {/if}
</g>

<style>
  .b { fill: var(--dev-body, #2a3278); stroke: var(--dev-edge, #a9b8ff); stroke-width: 6; stroke-linejoin: round; }
  .s { fill: var(--dev-screen, #0c1640); }
  .a { fill: var(--dev-accent, #3ef0ff); }
  .l { stroke: var(--dev-edge, #a9b8ff); stroke-width: 8; stroke-linecap: round; }
  .w { fill: none; stroke: var(--dev-accent, #3ef0ff); stroke-width: 6; stroke-linecap: round; }
  .led { animation: blink 0.9s ease-in-out infinite alternate; }
  .led:nth-of-type(2n) { animation-delay: -0.4s; }
  @keyframes blink { to { opacity: 0.3; } }
</style>
