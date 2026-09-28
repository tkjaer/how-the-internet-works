<script lang="ts">
  // Top bar: breadcrumb, style switcher (only when more than one theme is installed), language, kid/nerd, sound.
  import { languages, setLevel } from '../core/i18n';
  import { go, type Route } from '../core/router';
  import { loc, setSound, settings, syncUrl, THEME_IDS, themeSwatches, tr } from '../state.svelte';
  import Icon from './Icon.svelte';

  let { route, small }: { route: Route; small: boolean } = $props();
  let open = $state<'style' | null>(null);
  const toggle = (p: 'style') => (open = open === p ? null : p);
  function pick(id: string) { settings.style = id; syncUrl(); open = null; }
  const crumbs = $derived(route.scene === 'overview' ? [] : [route.scene]);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && open && ((open = null), e.stopPropagation())} />
<nav class="chrome" data-ui>
  <div class="crumbs card">
    {#if crumbs.length}
      <button class="btn" onclick={() => go({ scene: 'overview' })}>{tr('nav.home')}</button>
      {#each crumbs as c}<span class="sep" aria-hidden="true">›</span><span class="here">{tr(`${c}.title`)}</span>{/each}
    {:else}
      <span class="here">{tr('overview.title')}</span>
    {/if}
  </div>
  <div class="controls">
    {#if THEME_IDS.length > 1}
      <button class="card btn" aria-haspopup="true" aria-expanded={open === 'style'} onclick={() => toggle('style')} title={tr('ui.style')}>
        <span class="swatch" style:background={themeSwatches[settings.style]}></span>
        {#if !small}<span>{tr(`style.${settings.style}`)}</span>{/if}
        <Icon name="down" />
      </button>
    {/if}
    <div class="card seg" role="group" aria-label={tr('ui.language')}>
      {#each languages as l}
        <button class="btn" class:on={loc.lang === l.code} lang={l.code} title={l.name} onclick={() => go({ lang: l.code }, true)}>{small ? l.code.toUpperCase() : l.name}</button>
      {/each}
    </div>
    <div class="card seg" role="group" aria-label={tr('ui.level')}>
      {#each ['kid', 'nerd'] as const as lv}
        <button class="btn" class:on={loc.level === lv} onclick={() => setLevel(lv)}>{tr(small ? `mode.${lv}.short` : `mode.${lv}`)}</button>
      {/each}
    </div>
    <div class="card">
      <button class="btn icon-btn" aria-pressed={settings.sound} title={tr(settings.sound ? 'ui.soundOn' : 'ui.soundOff')} onclick={() => setSound(!settings.sound)}><Icon name={settings.sound ? 'soundOn' : 'soundOff'} /></button>
    </div>
  </div>
  {#if open === 'style'}
    <div class="pop card styles" role="menu">
      <h3>{tr('ui.style')}</h3>
      {#each THEME_IDS as id}
        <button class="btn" role="menuitemradio" aria-checked={settings.style === id} class:on={settings.style === id} onclick={() => pick(id)}>
          <span class="swatch" style:background={themeSwatches[id]}></span>{tr(`style.${id}`)}
        </button>
      {/each}
    </div>
  {/if}
</nav>
