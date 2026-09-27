<script lang="ts">
  import { fly } from 'svelte/transition';
  import { languages, setLevel } from '../../shared/i18n';
  import { go } from '../../shared/router';
  import type { SceneId } from '../../shared/scene';
  import { loc, tr } from '../loc.svelte';
  let { scene, spike }: { scene: SceneId; spike: string } = $props();
</script>

<header class="chrome-top">
  <a class="chip gallery-link" href="../../"><span aria-hidden="true">←</span> {tr('nav.gallery')}</a>
  <nav class="crumbs" aria-label="breadcrumb">
    <button class:here={scene === 'overview'} onclick={() => go({ scene: 'overview' })}>{tr('nav.home')}</button>
    {#if scene !== 'overview'}
      <span class="sep" transition:fly={{ x: -8, duration: 200 }}>›</span>
      <span class="here" transition:fly={{ x: -8, duration: 250 }}>{tr(`${scene}.title`)}</span>
    {/if}
  </nav>
  <div class="controls">
    <div class="seg langs" role="group" aria-label="Language">
      {#each languages as l}
        <button class:on={loc.lang === l.code} lang={l.code} title={l.name} onclick={() => go({ lang: l.code }, true)}>{l.code.toUpperCase()}</button>
      {/each}
    </div>
    <div class="seg level" role="group">
      <button class:on={loc.level === 'kid'} onclick={() => setLevel('kid')}>{tr('mode.kid')}</button>
      <button class:on={loc.level === 'nerd'} onclick={() => setLevel('nerd')}>{tr('mode.nerd')}</button>
    </div>
  </div>
</header>
{#key `${scene}|${loc.lang}|${loc.level}`}
  <footer class="caption show" in:fly={{ y: 16, duration: 450, delay: 150 }}>
    <h2>{tr(`${scene}.title`)}</h2>
    <p>{tr(`${scene}.${loc.level}`)}</p>
    <small class="hint">{tr(scene === 'overview' ? 'hint.tap' : 'hint.zoomOut')}</small>
  </footer>
{/key}
<div class="spike-badge">{spike}</div>
