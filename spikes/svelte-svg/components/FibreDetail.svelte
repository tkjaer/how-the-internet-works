<svelte:options namespace="svg" />
<script lang="ts">
  import { FIBRE, channelRoute, fibrePulses } from '../../shared/details';
  import { pts } from '../../shared/svg-helpers';
  import { tr } from '../loc.svelte';
  let { time }: { time: number } = $props();
  const F = FIBRE;
  const pulses = $derived(fibrePulses(time));
</script>

<text class="label big" x="800" y="120" font-size="38">{tr('fibre.channels')}</text>
<rect class="cladding" x={F.x0} y={F.y - F.cladH / 2} width={F.x1 - F.x0} height={F.cladH} rx={F.cladH / 2} />
<rect class="core" x={F.x0} y={F.y - F.coreH / 2} width={F.x1 - F.x0} height={F.coreH} rx={F.coreH / 2} />
{#each F.colours as c, i}<polyline class="route" points={pts(channelRoute(i))} stroke={c} />{/each}
{#each F.channelY as y, i}
  <rect class="box" x={F.laserX - 40} y={y - 32} width="80" height="64" rx="16" />
  <circle cx={F.laserX + 22} cy={y} r="12" fill={F.colours[i]} />
  <rect class="box" x={F.detectorX - 34} y={y - 32} width="80" height="64" rx="16" />
  <circle cx={F.detectorX - 14} cy={y} r="14" fill="none" stroke={F.colours[i]} stroke-width="6" />
{/each}
<path class="prism" d="M{F.muxX - 40} {F.y - 90} L{F.muxX + 30} {F.y} L{F.muxX - 40} {F.y + 90} Z" />
<path class="prism" d="M{F.demuxX + 40} {F.y - 90} L{F.demuxX - 30} {F.y} L{F.demuxX + 40} {F.y + 90} Z" />
{#each pulses as p}
  <g class="pulse">
    <circle r="46" cx={p.head.x} cy={p.head.y} fill="url(#glow-{p.channel})" />
    <polyline stroke={p.colour} opacity=".85" points={pts(p.trail)} />
    <circle r="9" cx={p.head.x} cy={p.head.y} fill="#fff" />
  </g>
{/each}
<line class="leader" x1="600" y1="300" x2="600" y2={F.y - 8} />
<text class="label big" x="600" y="285" font-size="30">{tr('fibre.core')}</text>
<line class="leader" x1="1000" y1={F.y + F.cladH / 2 - 8} x2="1000" y2="620" />
<text class="label big" x="1000" y="655" font-size="30">{tr('fibre.cladding')}</text>
<text class="label big" x={F.muxX - 20} y="790" font-size="28">{tr('fibre.mux')}</text>
<text class="label big" x={F.demuxX + 20} y="790" font-size="28">{tr('fibre.demux')}</text>
