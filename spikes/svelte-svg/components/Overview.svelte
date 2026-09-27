<svelte:options namespace="svg" />
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { TECH_COLOUR, WORLD, bezier, labelY, linkPath, links, livePackets, nodes, packetPos } from '../../shared/scene';
  import { icon } from '../../shared/svg-helpers';
  import { tr } from '../loc.svelte';
  let { time, opacity }: { time: number; opacity: number } = $props();

  const wifi = links.find((l) => l.tech === 'wifi')!;
  const arcAngle = (Math.atan2(wifi.p0.y - wifi.p1.y, wifi.p0.x - wifi.p1.x) * 180) / Math.PI + 180;
  const labelOffset = { wifi: [-10, -58], ethernet: [0, 62], fibre: [92, 30] } as const;
  const arcs = $derived([0, 1, 2].map((i) => ((time / 2.1 + i / 3) % 1)));
  const live = $derived(livePackets(time).map((p) => ({ id: p.id, kind: p.spec.kind, pos: packetPos(p.spec, p.age) })));
</script>

<g id="overview" {opacity} display={opacity > 0.002 ? 'inline' : 'none'}>
  <rect x="-800" y="-600" width={WORLD.w + 1600} height={WORLD.h + 1200} fill="url(#dots)" opacity=".7" />
  {#each links as l}
    <g class="link link-{l.tech}">
      <path class="glow" d={linkPath(l)} stroke={TECH_COLOUR[l.tech]} />
      <path class="core" d={linkPath(l)} stroke={TECH_COLOUR[l.tech]} />
      {#if l.tech === 'fibre'}<path class="light" d={linkPath(l)} />{/if}
    </g>
  {/each}
  <g id="radio">
    {#each arcs as f}
      <path class="arc" d="M-40 -60 A72 72 0 0 0 -40 60" opacity={0.9 * (1 - f)}
        transform="translate({wifi.p1.x + 10} {wifi.p1.y - 10}) rotate({arcAngle}) scale({0.3 + 1.9 * f})" />
    {/each}
  </g>
  {#each nodes as n, i (n.id)}
    <g class="node" id="node-{n.id}" in:fade={{ delay: 150 + i * 150, duration: 500 }}>
      {@html icon(n.svg, n.x, n.y, n.size)}
      <text class="label" x={n.x} y={labelY(n)} font-size="26">{tr(n.label)}</text>
    </g>
  {/each}
  {#each links as l}
    {@const m = bezier(l, 0.5)}
    <text class="label" x={m.x + labelOffset[l.tech][0]} y={m.y + labelOffset[l.tech][1]} font-size="22" fill={TECH_COLOUR[l.tech]}>{tr(l.label)}</text>
  {/each}
  {#each links.filter((l) => l.detail) as l}
    {@const m = bezier(l, 0.5)}
    <g class="hint" transform="translate({m.x} {m.y})">
      <circle class="ring pulse" r="34" />
      <circle r="18" class="lens" />
      <path d="M12 12 L24 24" class="lens-handle" />
    </g>
  {/each}
  {#each live as p (p.id)}
    {#if p.pos}<use href="#parcel-{p.kind}" x={p.pos.x} y={p.pos.y} />{/if}
  {/each}
</g>

<style>
  .link-wifi .core { animation: dash 0.8s linear infinite; }
  .link .light { animation: light 1.1s linear infinite; }
  .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 1.6s ease-out infinite; }
  :global(#node-router circle) { animation: blink 0.9s ease-in-out infinite alternate; }
  :global(#node-router circle:nth-of-type(2)) { animation-delay: -0.3s; }
  :global(#node-router circle:nth-of-type(3)) { animation-delay: -0.55s; animation-duration: 0.6s; }
  :global(#node-router circle:nth-of-type(4)) { animation-delay: -0.1s; animation-duration: 1.3s; }
  @keyframes dash { to { stroke-dashoffset: -40; } }
  @keyframes light { to { stroke-dashoffset: -266; } }
  @keyframes pulse { from { transform: scale(0.8); opacity: 0.9; } to { transform: scale(1.9); opacity: 0; } }
  @keyframes blink { to { opacity: 0.25; } }
</style>
