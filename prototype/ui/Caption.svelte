<script lang="ts">
  // Bottom caption: title + kid/nerd text, a gesture hint and a small "Want to know more?" slot (issue #4).
  import { getLang } from '../core/i18n';
  import { LEARN_MORE, type SceneId } from '../core/scene';
  import { loc, tr } from '../state.svelte';
  let { scene, title, body, hint, hidden, el = $bindable() }: { scene: SceneId; title: string; body: string; hint: string; hidden: boolean; el?: HTMLElement } = $props();
  const links = $derived.by(() => {
    void loc.lang;
    const all = LEARN_MORE[scene].filter((l) => l.level === 'both' || l.level === loc.level);
    // a link in the reader's own language replaces the English one with the same title
    const own = all.filter((l) => l.lang === getLang());
    return all.filter((l) => (l.lang ? l.lang === getLang() : !own.some((o) => o.title === l.title))).slice(0, 2);
  });
</script>

<section class="caption card" class:hide={hidden} data-ui bind:this={el} aria-live="polite">
  <h2 dir="auto">{title}</h2>
  <p dir="auto">{body}</p>
  <div class="foot">
    {#if hint}<span class="hint">{hint}</span>{/if}
    {#if links.length}
      <span class="more"><span>{tr('more.title')}</span>
        {#each links as l}<a href={l.url} target="_blank" rel="noopener" hreflang={l.lang ?? 'en'}>{tr(l.title)}{l.lang ? '' : getLang() !== 'en' ? ' (en)' : ''}</a>{/each}
      </span>
    {/if}
  </div>
</section>
