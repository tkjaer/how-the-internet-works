<svelte:options namespace="svg" />
<script lang="ts">
  import type { DeviceProps } from '../../../core/theme-types';
  import Rough from './Rough.svelte';
  import { rcircle, rellipse, rline, rpath, rpoly, rrect } from './rough';
  let { id, x, y, size, time, focused }: DeviceProps = $props();
  const s = $derived(size / 200);
</script>

<g class="dev dev-{id}" class:focused transform="translate({x - size / 2} {y - size / 2}) scale({s})">
  {#if focused}
    <Rough opacity={0.55} paths={rellipse(`focus-${id}`, 100, 108, 188, 142, time, { stroke: 'var(--highlighter-yellow)', strokeWidth: 16, fill: 'none', roughness: 2.2 })} />
  {/if}

  {#if id === 'phone'}
    <Rough opacity={0.25} paths={rrect('phone-shadow', 61, 20, 86, 170, 18, time, { stroke: 'var(--shadow)', strokeWidth: 5, fill: 'var(--shadow)', fillStyle: 'hachure', hachureGap: 11 })} />
    <Rough paths={rrect('phone-body', 56, 12, 86, 174, 18, time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 })} />
    <Rough paths={rrect('phone-screen', 68, 34, 62, 118, 8, time, { stroke: 'var(--ink-blue)', strokeWidth: 3, fill: 'var(--screen-paper)', fillStyle: 'hachure', hachureGap: 10 })} />
    <Rough paths={rpoly('phone-play', [[92, 76], [92, 110], [118, 93]], time, { stroke: 'var(--crayon-pink)', strokeWidth: 3, fill: 'var(--highlighter-pink)', fillStyle: 'hachure', hachureGap: 7 })} />
    <Rough paths={rline('phone-button', 91, 166, 111, 166, time, { stroke: 'var(--pencil)', strokeWidth: 4 })} />

  {:else if id === 'ap'}
    <Rough paths={rline('ap-ant-l', 63, 126, 47, 45, time, { stroke: 'var(--pencil)', strokeWidth: 6 })} />
    <Rough paths={rline('ap-ant-r', 137, 126, 154, 45, time, { stroke: 'var(--pencil)', strokeWidth: 6 })} />
    <Rough paths={rcircle('ap-knob-l', 47, 43, 9, time, { stroke: 'var(--pencil)', strokeWidth: 4, fill: 'var(--crayon-green)', fillStyle: 'hachure' })} />
    <Rough paths={rcircle('ap-knob-r', 154, 43, 9, time, { stroke: 'var(--pencil)', strokeWidth: 4, fill: 'var(--crayon-green)', fillStyle: 'hachure' })} />
    <Rough paths={rrect('ap-base', 28, 116, 144, 54, 18, time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 })} />
    <Rough paths={rpath('ap-wave-a', 'M78 99 Q100 78 122 99', time, { stroke: 'var(--ink-blue)', strokeWidth: 4, fill: 'none' })} />
    <Rough paths={rpath('ap-wave-b', 'M66 88 Q100 57 134 88', time, { stroke: 'var(--ink-blue)', strokeWidth: 4, fill: 'none' })} />

  {:else if id === 'router'}
    <Rough paths={rline('router-ant-l', 58, 88, 42, 34, time, { stroke: 'var(--pencil)', strokeWidth: 6 })} />
    <Rough paths={rline('router-ant-r', 142, 88, 158, 34, time, { stroke: 'var(--pencil)', strokeWidth: 6 })} />
    <Rough paths={rrect('router-body', 20, 82, 160, 72, 18, time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 })} />
    {#each [0, 1, 2] as i}<Rough paths={rcircle(`router-led-${i}`, 50 + i * 22, 118, 6, time + i, { stroke: 'var(--pencil)', strokeWidth: 2, fill: 'var(--crayon-green)' })} />{/each}
    <Rough paths={rline('router-smile', 116, 118, 152, 118, time, { stroke: 'var(--ink-blue)', strokeWidth: 4 })} />

  {:else if id === 'internet'}
    <Rough opacity={0.25} paths={rpath('cloud-shadow', 'M38 155 H164 Q185 153 184 130 Q184 105 158 96 Q146 63 108 66 Q73 61 60 91 Q31 94 29 125 Q27 149 38 155 Z', time, { stroke: 'var(--shadow)', strokeWidth: 7, fill: 'var(--shadow)', fillStyle: 'hachure', hachureGap: 13 })} />
    <Rough paths={rpath('cloud-body', 'M34 150 H164 Q185 149 184 128 Q183 105 157 96 Q145 63 107 66 Q73 61 59 91 Q31 94 28 124 Q26 147 34 150 Z', time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--cloud-paper)', fillStyle: 'hachure', hachureGap: 12 })} />
    <Rough paths={rellipse('cloud-globe', 105, 118, 56, 44, time, { stroke: 'var(--ink-blue)', strokeWidth: 3, fill: 'none' })} />
    <Rough paths={rline('cloud-globe-h', 78, 118, 132, 118, time, { stroke: 'var(--ink-blue)', strokeWidth: 3 })} />
    <Rough paths={rline('cloud-globe-v', 105, 97, 105, 140, time, { stroke: 'var(--ink-blue)', strokeWidth: 3 })} />

  {:else if id === 'home'}
    <Rough paths={rpoly('home-roof', [[28, 102], [100, 38], [172, 102]], time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--highlighter-yellow)', fillStyle: 'hachure', hachureGap: 10 })} />
    <Rough paths={rrect('home-body', 44, 94, 112, 76, 8, time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 10 })} />
    <Rough paths={rrect('home-door', 88, 122, 26, 48, 4, time, { stroke: 'var(--pencil)', strokeWidth: 3, fill: 'var(--screen-paper)', fillStyle: 'hachure' })} />
    <Rough paths={rrect('home-window', 124, 116, 22, 22, 3, time, { stroke: 'var(--ink-blue)', strokeWidth: 3, fill: 'none' })} />

  {:else if id === 'cabinet'}
    <Rough paths={rrect('cabinet-body', 52, 28, 96, 150, 10, time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 })} />
    <Rough paths={rline('cabinet-door', 100, 38, 100, 168, time, { stroke: 'var(--pencil)', strokeWidth: 3 })} />
    <Rough paths={rcircle('cabinet-knob-a', 90, 103, 5, time, { stroke: 'var(--pencil)', strokeWidth: 2, fill: 'var(--crayon-pink)' })} />
    <Rough paths={rcircle('cabinet-knob-b', 111, 103, 5, time, { stroke: 'var(--pencil)', strokeWidth: 2, fill: 'var(--crayon-pink)' })} />

  {:else if id === 'backhaul' || id === 'cdn'}
    {#each id === 'cdn' ? [0, 1, 2] : [1] as row}
      <Rough paths={rrect(`${id}-server-${row}`, id === 'cdn' ? 42 : 20, id === 'cdn' ? 42 + row * 42 : 70, id === 'cdn' ? 116 : 160, id === 'cdn' ? 32 : 62, 8, time + row, { stroke: 'var(--pencil)', strokeWidth: 4, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 })} />
      <Rough paths={rcircle(`${id}-led-${row}`, id === 'cdn' ? 62 : 42, id === 'cdn' ? 58 + row * 42 : 116, 5, time + row, { stroke: 'var(--pencil)', strokeWidth: 2, fill: 'var(--crayon-green)' })} />
    {/each}
    {#if id === 'backhaul'}
      {#each [0, 1, 2, 3, 4] as i}<Rough paths={rrect(`backhaul-port-${i}`, 44 + i * 23, 91, 15, 12, 2, time, { stroke: 'var(--ink-blue)', strokeWidth: 2, fill: 'none' })} />{/each}
    {:else}
      <Rough paths={rpoly('cdn-play', [[118, 50], [118, 68], [136, 59]], time, { stroke: 'var(--crayon-pink)', strokeWidth: 3, fill: 'var(--highlighter-pink)' })} />
    {/if}

  {:else if id === 'bng'}
    <Rough paths={rrect('bng-body', 30, 40, 140, 120, 14, time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 })} />
    <Rough paths={rpath('bng-shield', 'M100 77 L124 88 V105 Q124 119 100 128 Q76 119 76 105 V88 Z', time, { stroke: 'var(--ink-blue)', strokeWidth: 4, fill: 'var(--highlighter-blue)', fillStyle: 'hachure', hachureGap: 8 })} />

  {:else if id === 'core' || id === 'transit'}
    <Rough paths={rcircle(`${id}-globe`, 100, 100, id === 'core' ? 68 : 64, time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--cloud-paper)', fillStyle: 'hachure', hachureGap: 12 })} />
    <Rough paths={rline(`${id}-h`, 38, 100, 162, 100, time, { stroke: 'var(--ink-blue)', strokeWidth: 4 })} />
    <Rough paths={rline(`${id}-v`, 100, 38, 100, 162, time, { stroke: 'var(--ink-blue)', strokeWidth: 4 })} />
    {#if id === 'core'}
      <Rough paths={rline('core-d1', 60, 60, 140, 140, time, { stroke: 'var(--ink-blue)', strokeWidth: 3 })} />
      <Rough paths={rline('core-d2', 140, 60, 60, 140, time, { stroke: 'var(--ink-blue)', strokeWidth: 3 })} />
    {:else}
      <Rough paths={rellipse('transit-meridian', 100, 100, 54, 128, time, { stroke: 'var(--ink-blue)', strokeWidth: 3, fill: 'none' })} />
      <Rough paths={rpath('transit-lat-a', 'M50 68 Q100 82 150 68', time, { stroke: 'var(--ink-blue)', strokeWidth: 3, fill: 'none' })} />
      <Rough paths={rpath('transit-lat-b', 'M50 132 Q100 118 150 132', time, { stroke: 'var(--ink-blue)', strokeWidth: 3, fill: 'none' })} />
    {/if}

  {:else if id === 'ixp'}
    <Rough paths={rrect('ixp-board', 26, 56, 148, 88, 15, time, { stroke: 'var(--pencil)', strokeWidth: 5, fill: 'var(--device-paper)', fillStyle: 'hachure', hachureGap: 9 })} />
    {#each [0, 1, 2, 3] as i}<Rough paths={rcircle(`ixp-dot-${i}`, 54 + i * 31, 100, 9, time + i, { stroke: 'var(--pencil)', strokeWidth: 3, fill: 'var(--crayon-green)' })} />{/each}
    <Rough paths={rpath('ixp-cable', 'M54 100 Q86 72 117 100 T148 100', time, { stroke: 'var(--ink-blue)', strokeWidth: 4, fill: 'none' })} />
  {/if}
</g>
