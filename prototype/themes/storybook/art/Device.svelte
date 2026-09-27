<svelte:options namespace="svg" />
<script lang="ts">
  import type { DeviceProps } from '../../../core/theme-types';
  let { id, x, y, size, time, context, focused }: DeviceProps = $props();
  const blink = $derived(Math.sin(time * 3 + id.length * 0.7) > 0.93);
  const bob = $derived(context === 'dive' ? Math.sin(time * 1.5 + id.length) * 3 : 0);
  const face = $derived(({ phone: [100, 118], ap: [100, 146], router: [100, 121], internet: [104, 132], home: [100, 128], cabinet: [100, 108], backhaul: [100, 112], bng: [100, 112], core: [100, 106], transit: [100, 108], ixp: [100, 105], cdn: [100, 112] } as Record<string, [number, number]>)[id]);
</script>

<g class="storybook-device dev-{id}" class:focused transform="translate({x - size / 2} {y - size / 2 + bob}) scale({size / 200})">
  {#if focused}<circle class="focus" cx="100" cy="100" r="98" />{/if}
  {#if id === 'phone'}
    <rect class="body peach" x="57" y="12" width="86" height="176" rx="24" />
    <rect class="screen" x="69" y="32" width="62" height="118" rx="14" />
    <path class="hi" d="M82 47 h32 a8 8 0 0 1 8 8 v8 H82 Z" />
    <circle class="button" cx="100" cy="168" r="7" />
  {:else if id === 'ap'}
    <path class="line" d="M56 120 L42 46 M144 120 L158 46" />
    <circle class="accent" cx="42" cy="46" r="11" /><circle class="accent" cx="158" cy="46" r="11" />
    <rect class="body teal" x="24" y="112" width="152" height="58" rx="24" />
    <path class="wave" d="M78 101 A30 30 0 0 1 122 101 M66 88 A48 48 0 0 1 134 88" />
  {:else if id === 'router'}
    <path class="line" d="M52 91 L36 38 M148 91 L164 38" />
    <rect class="body orange" x="18" y="82" width="164" height="76" rx="24" />
    <circle class="accent" cx="47" cy="122" r="7" /><circle class="accent" cx="70" cy="122" r="7" /><circle class="accent" cx="93" cy="122" r="7" />
    <path class="hi" d="M36 94 h102 a10 10 0 0 1 10 10 v8 H36 Z" />
  {:else if id === 'internet'}
    <path class="body cloud" d="M38 154 H162 A32 32 0 0 0 152 91 A45 45 0 0 0 72 78 A40 40 0 0 0 38 154 Z" />
    <path class="wave" d="M76 126 H132 M104 94 V156 M83 106 C98 116 113 116 128 106 M83 146 C98 136 113 136 128 146" />
  {:else if id === 'home'}
    <path class="body peach" d="M34 90 L100 35 L166 90 V166 H34 Z" />
    <path class="roof" d="M24 96 L100 30 L176 96" />
    <rect class="screen" x="78" y="112" width="44" height="54" rx="6" />
  {:else if id === 'cabinet'}
    <rect class="body berry" x="51" y="28" width="98" height="152" rx="16" />
    <path class="line thin" d="M100 42 V168 M62 72 H138" />
    <circle class="accent" cx="84" cy="112" r="6" /><circle class="accent" cx="116" cy="112" r="6" />
  {:else if id === 'backhaul'}
    <rect class="body teal" x="19" y="68" width="162" height="66" rx="17" />
    {#each [0,1,2,3,4,5] as i}<rect class="screen" x={35 + i * 23} y="88" width="16" height="14" rx="3" />{/each}
    <circle class="accent" cx="44" cy="119" r="4" /><circle class="accent" cx="60" cy="119" r="4" />
  {:else if id === 'bng'}
    <rect class="body orange" x="31" y="39" width="138" height="122" rx="22" />
    <path class="screen" d="M100 70 L128 84 V107 C128 122 114 132 100 137 C86 132 72 122 72 107 V84 Z" />
  {:else if id === 'core'}
    <circle class="body teal" cx="100" cy="100" r="68" />
    <path class="wave" d="M58 100 H142 M100 58 V142 M70 70 L130 130 M130 70 L70 130" />
    <circle class="accent" cx="100" cy="100" r="15" />
  {:else if id === 'transit'}
    <circle class="body peach" cx="100" cy="100" r="66" />
    <ellipse class="wave" cx="100" cy="100" rx="30" ry="66" />
    <path class="wave" d="M35 100 H165 M47 67 H153 M47 133 H153" />
  {:else if id === 'ixp'}
    <rect class="body berry" x="23" y="55" width="154" height="90" rx="22" />
    {#each [0,1,2,3] as i}<circle class="accent" cx={52 + i * 32} cy="100" r="10" />{/each}
    <path class="wave" d="M52 100 Q84 70 116 100 T148 100" />
  {:else if id === 'cdn'}
    {#each [0,1,2] as i}<rect class="body orange" x="39" y={38 + i * 43} width="122" height="36" rx="10" />{/each}
    <path class="screen" d="M119 49 L119 67 L136 58 Z" />
    <circle class="accent" cx="62" cy="56" r="5" /><circle class="accent" cx="62" cy="99" r="5" /><circle class="accent" cx="62" cy="142" r="5" />
  {/if}
  <g class="face" transform="translate({face[0]} {face[1]})">
    <ellipse class="eye" cx="-18" cy="-7" rx="5.5" ry={blink ? 1.4 : 6} />
    <ellipse class="eye" cx="18" cy="-7" rx="5.5" ry={blink ? 1.4 : 6} />
    <path class="smile" d="M-15 12 Q0 24 15 12" />
  </g>
</g>

<style>
  .focus { fill: #fff6d7; stroke: #efb159; stroke-width: 7; opacity: .8; }
  .body, .screen { stroke: #6b3f2a; stroke-width: 6; stroke-linejoin: round; }
  .body { fill: #f6b56b; }
  .peach { fill: #ffd89c; } .orange { fill: #f19a55; } .teal { fill: #72b8a5; } .berry { fill: #bd6b87; } .cloud { fill: #fff7df; }
  .screen { fill: #fff1d1; }
  .roof, .line, .wave, .smile { fill: none; stroke: #6b3f2a; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
  .thin { stroke-width: 4; opacity: .55; }
  .wave { stroke-width: 6; }
  .accent, .button { fill: #ffcf5d; stroke: #6b3f2a; stroke-width: 4; }
  .hi { fill: #fff6d7; opacity: .55; }
  .eye { fill: #6b3f2a; }
</style>
