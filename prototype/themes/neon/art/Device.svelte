<svelte:options namespace="svg" />
<script lang="ts">
  import type { DeviceProps } from '../../../core/theme-types';
  let { id, x, y, size, time, focused }: DeviceProps = $props();
  const led = $derived(0.25 + 0.75 * Math.sin(time * 4.7 + size * 0.03) ** 2);
</script>

<g class="dev dev-{id}" class:focused transform="translate({x - size / 2} {y - size / 2}) scale({size / 200})">
  <g class="glow">{@render glyph()}</g>
  <g class="bright">{@render glyph()}</g>
  {#if focused}
    <path class="focus" d="M10 50V10H50M150 10H190V50M190 150V190H150M50 190H10V150" />
  {/if}
</g>

{#snippet glyph()}
  {#if id === 'phone'}
    <rect class="b" x="58" y="14" width="84" height="172" rx="18" />
    <rect class="s" x="68" y="32" width="64" height="126" rx="6" />
    <path class="w" d="M78 54H122M78 138H122M94 74L94 106L118 90Z" />
    <circle class="a" cx="100" cy="171" r="4" style:opacity={led} />
  {:else if id === 'ap'}
    <line class="l" x1="62" y1="126" x2="48" y2="46" /><line class="l" x1="138" y1="126" x2="152" y2="46" />
    <circle class="a" cx="48" cy="44" r="8" style:opacity={led} /><circle class="a" cx="152" cy="44" r="8" style:opacity={1 - led * 0.45} />
    <rect class="b" x="28" y="118" width="144" height="50" rx="12" />
    <path class="w" d="M82 100A26 26 0 0 1 118 100M70 88A42 42 0 0 1 130 88M49 139H151" />
  {:else if id === 'router' || id === 'home'}
    <line class="l" x1="58" y1="88" x2="44" y2="34" /><line class="l" x1="142" y1="88" x2="156" y2="34" />
    <rect class="b" x="20" y="82" width="160" height="70" rx="14" />
    <path class="w" d="M42 101H158M42 135H96" />
    <circle class="a" cx="50" cy="118" r="5" style:opacity={led} /><circle class="a" cx="72" cy="118" r="5" style:opacity={0.35 + led * 0.55} /><circle class="a" cx="94" cy="118" r="5" style:opacity={0.9 - led * 0.5} />
  {:else if id === 'internet'}
    <path class="b" d="M40 152H162A31 31 0 0 0 152 92A44 44 0 0 0 72 80A38 38 0 0 0 40 152Z" />
    <circle class="s" cx="104" cy="120" r="25" />
    <path class="w" d="M80 120H128M104 96V144M90 101Q104 112 118 101M90 139Q104 128 118 139" />
  {:else if id === 'cabinet'}
    <rect class="b" x="50" y="30" width="100" height="150" rx="8" />
    <path class="w" d="M100 40V170M66 58H90M110 58H134M66 142H134" />
    <circle class="a" cx="88" cy="104" r="5" style:opacity={led} /><circle class="a" cx="112" cy="104" r="5" style:opacity={0.9 - led * 0.45} />
  {:else if id === 'backhaul'}
    <rect class="b" x="20" y="70" width="160" height="60" rx="9" />
    {#each [0, 1, 2, 3, 4, 5] as i}<rect class="s" x={34 + i * 23} y="90" width="16" height="12" rx="2" />{/each}
    <path class="w" d="M30 82H170M30 121H170" />
    <circle class="a" cx="40" cy="116" r="4" style:opacity={led} />
  {:else if id === 'bng'}
    <rect class="b" x="30" y="40" width="140" height="120" rx="12" />
    <rect class="s" x="60" y="70" width="80" height="60" rx="6" />
    <path class="w" d="M100 78L122 88V104C122 116 112 122 100 126C88 122 78 116 78 104V88ZM48 56H152M48 144H152" />
  {:else if id === 'core'}
    <circle class="b" cx="100" cy="100" r="70" />
    <path class="w" d="M60 100H140M100 60V140M72 72L128 128M128 72L72 128" />
    <circle class="a" cx="100" cy="100" r="13" style:opacity={led} />
  {:else if id === 'transit'}
    <circle class="b" cx="100" cy="100" r="66" />
    <path class="w" d="M34 100H166M44 66H156M44 134H156M100 34C126 62 126 138 100 166M100 34C74 62 74 138 100 166" />
  {:else if id === 'ixp'}
    <rect class="b" x="24" y="56" width="152" height="88" rx="12" />
    {#each [0, 1, 2, 3] as i}<circle class="a" cx={52 + i * 32} cy="100" r="9" style:opacity={i % 2 ? led : 0.95 - led * 0.4} />{/each}
    <path class="w" d="M52 100Q84 70 116 100T148 100M52 124H148" />
  {:else if id === 'cdn'}
    {#each [0, 1, 2] as i}<rect class="b" x="40" y={40 + i * 42} width="120" height="34" rx="6" />{/each}
    <path class="w" d="M58 57H112M58 99H112M58 141H112" />
    <circle class="a" cx="132" cy="57" r="5" style:opacity={led} /><circle class="a" cx="132" cy="99" r="5" style:opacity={0.4 + led * 0.4} /><circle class="a" cx="132" cy="141" r="5" style:opacity={0.95 - led * 0.3} />
    <path class="a-fill" d="M118 50L118 66L134 58Z" />
  {/if}
{/snippet}

<style>
  .glow .b, .glow .s, .glow .l, .glow .w { fill: none; stroke: var(--dev-edge, #3ef0ff); stroke-width: 13; opacity: 0.11; stroke-linecap: round; stroke-linejoin: round; }
  .glow .a, .glow .a-fill { fill: var(--dev-accent, #fff06a); opacity: 0.16; }
  .bright .b { fill: var(--dev-body, rgba(6,18,48,.74)); stroke: var(--dev-edge, #3ef0ff); stroke-width: 4.5; stroke-linejoin: round; }
  .bright .s { fill: rgba(0, 8, 24, 0.72); stroke: var(--dev-screen-edge, #225d84); stroke-width: 2.2; }
  .bright .a { fill: var(--dev-accent, #fff06a); }
  .bright .a-fill { fill: var(--dev-accent, #fff06a); opacity: 0.86; }
  .bright .l, .bright .w { fill: none; stroke: var(--dev-accent, #3ef0ff); stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; }
  .focus { fill: none; stroke: #fff; stroke-width: 5; opacity: .72; stroke-linecap: square; }
  .focused .bright .b { stroke: #fff; }
</style>
