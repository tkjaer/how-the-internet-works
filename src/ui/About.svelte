<script lang="ts">
  // About, from the ⋯ menu: the credit, the licence and the source (the AGPL's Appropriate Legal Notices and its
  // source offer to network users; NOTICE.md). Who and where come from package.json (__ABOUT__, vite.config.ts).
  import { onMount } from 'svelte';
  import { counting, doNotTrack, setCounting } from '../count.svelte';
  import { fill, tr } from '../state.svelte';
  import Icon from './Icon.svelte';

  let { onclose }: { onclose: (back: boolean) => void } = $props();
  const { name, author, year, license, source } = __ABOUT__;
  // The browser already asks not to be tracked: then nothing is counted, and there's no switch to show.
  const dnt = doNotTrack();
  let el: HTMLElement;
  onMount(() => el.focus());
  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onclose(true); }
  }
</script>

<div class="pop card about-box" role="dialog" aria-labelledby="about-title" tabindex="-1" bind:this={el} {onkeydown}>
  <div class="about-head">
    <h3 id="about-title">{tr('about.title')}</h3>
    <button class="btn" aria-label={tr('ui.close')} title={tr('ui.close')} onclick={() => onclose(true)}><Icon name="close" /></button>
  </div>
  <p class="about-credit">{fill(tr('about.credit'), { name, author })}</p>
  <p class="about-fine">© {year} {author} · {license}</p>
  <p>{tr('about.legal')}</p>
  <p>{tr('about.shots')}</p>
  {#if dnt}
    <p>{tr('about.countDnt')}</p>
  {:else}
    <p>{tr('about.countWhat')}</p>
    <button class="btn menu-item about-count" role="switch" aria-checked={counting.on} onclick={() => setCounting(!counting.on)}>
      <span>{tr('about.count')}: <b>{tr(counting.on ? 'ui.on' : 'ui.off')}</b></span>
    </button>
  {/if}
  <p class="about-links">
    <a href={source} target="_blank" rel="noopener">{tr('about.source')}</a>
    <a href="{source}/blob/main/LICENSE" target="_blank" rel="noopener">{tr('about.license')}</a>
    <a href="{source}/blob/main/NOTICE.md" target="_blank" rel="noopener">{tr('about.terms')}</a>
    <a href="{source}/blob/main/CONTRIBUTORS.md" target="_blank" rel="noopener">{tr('about.contributors')}</a>
    <a href="{source}/blob/main/docs/privacy.md" target="_blank" rel="noopener">{tr('about.privacy')}</a>
  </p>
</div>
