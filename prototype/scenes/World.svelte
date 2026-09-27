<svelte:options namespace="svg" />
<script lang="ts">
  // One rendering of the whole nested world through one camera. During portal / parallax transitions the app
  // renders two Worlds (source + target) with different cameras and scene mixes.
  import type { Cam } from '../core/camera';
  import type { LivePacket } from '../core/packets';
  import { CHILDREN, type SceneId } from '../core/scene';
  import { setWorld } from './ctx';
  import FibreDive from './FibreDive.svelte';
  import Nested from './Nested.svelte';
  import PathScene from './PathScene.svelte';
  import WifiDive from './WifiDive.svelte';

  let { cam, mix, uid, packets, focus, premount = null, opacity = 1, clip = null }: {
    cam: Cam; mix: Record<SceneId, number>; uid: string; packets: Record<'overview' | 'internet', LivePacket[]>;
    focus: { scene: SceneId; stop: string | null }; premount?: SceneId | null; opacity?: number; clip?: string | null;
  } = $props();
  setWorld({ get cam() { return cam; }, get uid() { return uid; } });
  const show = (s: SceneId) => mix[s] > 0.002 || premount === s;
</script>

<g class="world" {opacity} clip-path={clip ? `url(#${clip})` : undefined}>
  <g transform="translate({cam.x} {cam.y}) scale({cam.k})">
    <g opacity={mix.overview} display={mix.overview > 0.002 ? 'inline' : 'none'}>
      <PathScene id="overview" packets={packets.overview} focus={focus.scene === 'overview' ? focus.stop : null} />
    </g>
    {#each CHILDREN as c (c)}
      {#if show(c)}
        <Nested id={c} opacity={mix[c]}>
          {#if c === 'wifi'}<WifiDive />
          {:else if c === 'fibre'}<FibreDive />
          {:else}<PathScene id="internet" packets={packets.internet} focus={focus.scene === 'internet' ? focus.stop : null} />{/if}
        </Nested>
      {/if}
    {/each}
  </g>
</g>
