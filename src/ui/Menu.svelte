<script lang="ts">
  // The chrome's ⋯ menu: the entries of menu.ts as a WAI-ARIA menu. Focus moves into it when it opens; the arrow
  // keys, Home and End move between its items; Esc closes it and gives focus back to ⋯, Tab closes it and moves on.
  // A list entry (the languages, too many to show side by side) opens its options in the menu's place: picking one,
  // Back or Esc shows the menu again, with focus on that entry.
  import { onMount, tick } from 'svelte';
  import { menuMove, type MenuEntry } from './menu';
  import Icon from './Icon.svelte';

  let { entries, label, back, onclose }: {
    entries: MenuEntry[]; label: string;
    /** The word on the way back from a list ("Back"). */
    back: string;
    /** Close it; `back`: give focus back to the button that opened it. */
    onclose: (back: boolean) => void;
  } = $props();
  let el: HTMLDivElement;
  const items = () => [...el.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
  onMount(() => items()[0]?.focus());
  /** The list entry whose options fill the menu, if one is open. */
  let open = $state<string | null>(null);
  const list = $derived(entries.find((m): m is Extract<MenuEntry, { kind: 'list' }> => m.kind === 'list' && m.id === open) ?? null);
  /** Open a list in the menu's place (focus on its chosen option), or go back to the menu (focus on the list's entry). */
  async function show(id: string | null) {
    const from = open;
    open = id;
    await tick();
    const all = items(), to = id ? all.find((i) => i.getAttribute('aria-checked') === 'true') : all.find((i) => i.dataset.list === from);
    (to ?? all[0])?.focus();
  }
  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return list ? show(null) : onclose(true); }
    if (e.key === 'Tab') return onclose(false);
    const all = items(), i = all.indexOf(document.activeElement as HTMLElement);
    const to = menuMove(e.key, i, all.length, getComputedStyle(el).direction === 'rtl');
    if (to === null) return;
    e.preventDefault(); e.stopPropagation();
    all[to]?.focus();
  }
</script>

<div class="pop card menu" role="menu" aria-label={list?.label ?? label} tabindex="-1" bind:this={el} {onkeydown}>
  {#if list}
    <button class="btn menu-item menu-back" role="menuitem" tabindex="-1" aria-label="{back}: {list.label}" onclick={() => show(null)}>
      <Icon name="back" /><span>{list.label}</span>
    </button>
    {#each list.options as o (o.id)}
      <button class="btn menu-item menu-pick" role="menuitemradio" aria-checked={list.value === o.id} class:on={list.value === o.id} tabindex="-1"
        onclick={() => { list.pick(o.id); show(null); }}>
        <span><span lang={o.lang}>{o.label}</span>{#if o.note}<small>{' · '}{o.note}</small>{/if}</span>
        {#if o.badge}<span class="menu-code" aria-hidden="true">{o.badge}</span>{/if}
      </button>
    {/each}
  {:else}
  {#each entries as m (m.id)}
    {#if m.kind === 'list'}
      {@const v = m.options.find((o) => o.id === m.value)}
      <button class="btn menu-item menu-next" role="menuitem" aria-haspopup="menu" data-list={m.id} tabindex="-1" onclick={() => show(m.id)}>
        {#if m.icon}<Icon name={m.icon} />{/if}<span>{m.label}<span class="sr">: </span></span>
        <span class="menu-value">{#if v}<span lang={v.lang}>{v.label}</span>{#if v.badge}<span class="menu-code" aria-hidden="true">{v.badge}</span>{/if}{/if}<Icon name="next" /></span>
      </button>
    {:else if m.kind === 'choice'}
      <div class="menu-row" role="group" aria-labelledby="menu-{m.id}">
        <span class="menu-label" id="menu-{m.id}">{#if m.icon}<Icon name={m.icon} />{/if}{m.label}</span>
        <span class="menu-opts">
          {#each m.options as o (o.id)}
            <button class="btn" role="menuitemradio" aria-checked={m.value === o.id} class:on={m.value === o.id} lang={o.lang} tabindex="-1"
              onclick={() => m.pick(o.id)}>{#if o.swatch}<span class="swatch" style:background={o.swatch}></span>{/if}{o.label}</button>
          {/each}
        </span>
      </div>
    {:else if m.kind === 'toggle'}
      <button class="btn menu-item" role="menuitemcheckbox" aria-checked={m.on} tabindex="-1" onclick={() => m.set(!m.on)}>
        {#if m.icon}<Icon name={m.icon} />{/if}<span>{m.label}: <b>{m.state}</b></span>
      </button>
    {:else}
      <button class="btn menu-item" role="menuitem" tabindex="-1" onclick={() => { onclose(false); m.run(); }}>
        {#if m.icon}<Icon name={m.icon} />{/if}<span>{m.label}</span>
      </button>
    {/if}
  {/each}
  {/if}
</div>
