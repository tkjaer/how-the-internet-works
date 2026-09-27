<svelte:options namespace="svg" />
<script lang="ts">
  // Look inside the Wi-Fi link: bits riding a radio wave.
  import { WIFI, toScene, trackMatrix, wifiBits, wifiRings, wifiWave } from '../core/details';
  import { themeState, view } from '../state.svelte';
  import Text from './Text.svelte';
  const A = $derived(themeState.current.art);
  const C = $derived(themeState.current.colours);
  const o = $derived(view.orient);
  const wave = $derived(wifiWave(view.time));
  const d = $derived('M' + wave.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  const phone = $derived(toScene({ x: WIFI.phoneX, y: WIFI.y }, o));
  const ap = $derived(toScene({ x: WIFI.apX, y: WIFI.y }, o));
  const ringC = $derived(toScene({ x: WIFI.apX - 78, y: WIFI.y - 78 }, o));
  const bits = $derived(wifiBits(view.time).map((b) => {
    const top = { x: b.x, y: WIFI.bitsY }, foot = { x: b.x, y: WIFI.y - (b.bit ? WIFI.ampOne : WIFI.ampZero) - 16 };
    const stemA = { x: b.x, y: WIFI.bitsY + 36 };
    return { ...b, p: toScene(top, o), stem: [toScene(stemA, o), toScene(foot, o)] as [typeof top, typeof top] };
  }));
  const L = $derived(o === 'portrait'
    ? { bits: { x: 150, y: 820 }, carrier: { x: 700, y: 820 } }
    : { bits: { x: 815, y: 175 }, carrier: { x: 815, y: 690 } });
</script>

<A.Rings cx={ringC.x} cy={ringC.y} rings={wifiRings(view.time)} time={view.time} />
<A.Device id="phone" x={phone.x} y={phone.y} size={330} time={view.time} context="dive" focused={false} />
<A.Device id="ap" x={ap.x} y={ap.y} size={300} time={view.time} context="dive" focused={false} />
<g transform={trackMatrix(o)}>
  <A.Wave {d} points={wave} time={view.time} />
</g>
{#each bits as b (b.key)}
  <A.Bit x={b.p.x} y={b.p.y} bit={b.bit} alpha={b.alpha} stem={b.stem} time={view.time} colour={C.bit[b.bit]} />
{/each}
<Text x={L.bits.x} y={L.bits.y} k="wifi.bits" size={34} kind="big" />
<Text x={L.carrier.x} y={L.carrier.y} k="wifi.carrier" size={34} kind="big" colour={C.tech.wifi} />
