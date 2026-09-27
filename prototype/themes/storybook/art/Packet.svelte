<svelte:options namespace="svg" />
<script lang="ts">
  import type { PacketProps } from '../../../core/theme-types';
  let { kind, pose, colour, time, followed, alive }: PacketProps = $props();
  const facing = $derived(Math.cos(pose.angle) < 0 ? -1 : 1);
  const run = $derived(alive && pose.phase === 'go' ? Math.sin(pose.step * Math.PI * 2) : 0);
  const crouch = $derived(alive && pose.phase === 'wait' ? 5 : alive && pose.phase === 'land' ? 3 : 0);
  const lean = $derived(alive ? facing * (pose.phase === 'wait' ? -10 : pose.phase === 'land' ? 5 : Math.min(15, pose.speed * 13)) : 0);
  const blink = $derived(Math.sin(time * 4.2 + pose.seg) > 0.94);
</script>

<g class="courier" transform="translate({pose.x} {pose.y})">
  {#if followed}<ellipse cx="0" cy="28" rx="40" ry="15" fill="#fff0b3" stroke="#6b3f2a" stroke-width="4" opacity="0.85" />{/if}
  {#each pose.trail as p, i}
    <circle cx={p.x - pose.x} cy={p.y - pose.y + 27} r={Math.max(2, 8 - i)} fill="#d9a66b" opacity={alive ? Math.max(0, 0.38 - i * 0.045) : 0.06} />
  {/each}
  <g transform="rotate({lean}) scale({facing * pose.sx} {pose.sy}) translate(0 {crouch})">
    <g class="legs" stroke="#6b3f2a" stroke-width="6" stroke-linecap="round">
      <path d="M-11 20 L{-22 - run * 9} {34 + Math.abs(run) * 4}" />
      <path d="M10 20 L{21 + run * 9} {34 + Math.abs(run) * 4}" />
    </g>
    <circle class="body" cy="0" r="22" fill={colour} />
    <path class="highlight" d="M-12 -12 C-2 -22 13 -15 15 -4 C7 -9 -2 -10 -12 -4 Z" />
    <ellipse class="eye" cx="-8" cy="-4" rx="3.4" ry={blink ? 0.8 : 4.2} />
    <ellipse class="eye" cx="8" cy="-4" rx="3.4" ry={blink ? 0.8 : 4.2} />
    <path class="smile" d="M-7 8 Q0 14 8 8" />
    {#if kind === 'request'}
      <g transform="translate(26 -2) rotate(-8)">
        <rect class="parcel" x="-2" y="-14" width="28" height="25" rx="4" />
        <path class="parcel-line" d="M12 -14 V11 M-2 -2 H26" />
      </g>
    {:else}
      <g transform="translate(28 -1) rotate(-8)">
        <rect class="film" x="-3" y="-14" width="31" height="26" rx="5" />
        <circle cx="6" cy="-2" r="5" fill="#fff7df" stroke="#6b3f2a" stroke-width="3" />
        <path d="M18 -10 V8" stroke="#fff7df" stroke-width="4" stroke-linecap="round" />
      </g>
    {/if}
  </g>
</g>

<style>
  .body, .parcel, .film { stroke: #6b3f2a; stroke-width: 5; }
  .highlight { fill: #fff7df; opacity: .48; }
  .eye { fill: #6b3f2a; }
  .smile { fill: none; stroke: #6b3f2a; stroke-width: 3.4; stroke-linecap: round; }
  .parcel { fill: #c58a54; }
  .parcel-line { fill: none; stroke: #6b3f2a; stroke-width: 3; stroke-linecap: round; opacity: .8; }
  .film { fill: #72b8a5; }
</style>
