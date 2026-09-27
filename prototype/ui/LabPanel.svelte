<script lang="ts">
  // Interaction-feel experiments. Every toggle is also a URL parameter, so a setup can be shared.
  import { settings, syncUrl, themeState, tr } from '../state.svelte';
  let { fps }: { fps: number } = $props();
  const rows = [
    { key: 'zoom', opts: ['auto', 'fly', 'portal', 'parallax'] },
    { key: 'feel', opts: ['auto', 'ease', 'spring', 'twos'] },
    { key: 'orient', opts: ['auto', 'landscape', 'portrait'] },
  ] as const;
  const set = (k: 'zoom' | 'feel' | 'orient', v: string) => { (settings as Record<string, unknown>)[k] = v; syncUrl(); };
  const auto = (k: 'zoom' | 'feel' | 'orient') => (k === 'orient' ? '' : ` (${tr(`lab.${k}.${themeState.current.motion[k]}`)})`);
</script>

<div class="lab">
  <h3>{tr('lab.title')}</h3>
  {#each rows as r}
    <div class="row">
      <span>{tr(`lab.${r.key}`)}</span>
      <div class="seg" role="group" aria-label={tr(`lab.${r.key}`)}>
        {#each r.opts as o}
          <button class="btn" class:on={settings[r.key] === o} onclick={() => set(r.key, o)}>{tr(`lab.${r.key}.${o}`)}{o === 'auto' ? auto(r.key) : ''}</button>
        {/each}
      </div>
    </div>
  {/each}
  <div class="row">
    <span>{tr('lab.alive')}</span>
    <div class="seg" role="group">
      <button class="btn" class:on={settings.alive} onclick={() => { settings.alive = true; syncUrl(); }}>{tr('lab.on')}</button>
      <button class="btn" class:on={!settings.alive} onclick={() => { settings.alive = false; syncUrl(); }}>{tr('lab.off')}</button>
    </div>
  </div>
  <div class="meter">{fps.toFixed(0)} fps</div>
</div>
