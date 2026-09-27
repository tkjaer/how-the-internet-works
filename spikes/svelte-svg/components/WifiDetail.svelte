<svelte:options namespace="svg" />
<script lang="ts">
  import { PACKET_COLOUR, TECH_COLOUR, nodes } from '../../shared/scene';
  import { WIFI, wifiBits, wifiRings, wifiWave } from '../../shared/details';
  import { icon, pts } from '../../shared/svg-helpers';
  import { tr } from '../loc.svelte';
  let { time }: { time: number } = $props();
  const phone = nodes.find((n) => n.id === 'phone')!, ap = nodes.find((n) => n.id === 'ap')!;
  const d = $derived('M' + pts(wifiWave(time)));
</script>

{@html icon(phone.svg, WIFI.phoneX, WIFI.y, 330)}
<g id="rings">
  {#each wifiRings(time) as r}<circle cx={WIFI.apX - 78} cy={WIFI.y - 78} r={r.r} opacity={r.alpha} />{/each}
</g>
{@html icon(ap.svg, WIFI.apX, WIFI.y, 300)}
<path class="wave-glow" {d} />
<path class="wave" {d} />
{#each wifiBits(time) as b (b.key)}
  {@const c = b.bit ? PACKET_COLOUR.request : '#8190ff'}
  <g class="bit" transform="translate({b.x} {WIFI.bitsY})" opacity={b.alpha}>
    <line y1="36" y2={WIFI.y - WIFI.bitsY - (b.bit ? WIFI.ampOne : WIFI.ampZero) - 16} stroke={c} />
    <circle r="34" fill="#0b1140" stroke={c} />
    <text fill={c}>{b.bit}</text>
  </g>
{/each}
<text class="label big" x="815" y="175" font-size="34">{tr('wifi.bits')}</text>
<text class="label big" x="815" y="690" font-size="34" fill={TECH_COLOUR.wifi}>{tr('wifi.carrier')}</text>
