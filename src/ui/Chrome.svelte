<script lang="ts">
  // Top bar: the depth ladder (breadcrumb, Ladder.svelte), "What can I explore?" (a toggle, #122: the doors light
  // up and the caption lists them; only where there is something to explore), the time machine (#59: on every screen, showing the era you're in), pause (all motion),
  // kid/nerd, day/night (when the theme has a night), mute (#189: one tap, on a desktop or tablet), and ⋯: a menu
  // (Menu.svelte, entries in `entries` below) with the language (a list it opens: each by its own name, its name in the
  // reader's language and its code), sound (on a phone, where the bar has no room for mute),
  // read aloud (where there is a voice for the language), the style (only when more than one theme is installed), the
  // list view (TextMap.svelte, opened by the app) and About. The controls keep to the end of the row, so one that comes
  // and goes doesn't move the others; on a phone they wrap under the ladder (below 400 px day/night is in ⋯ too, so
  // "Explore" keeps its word next to the time machine's button: its icon alone, by a sun, read as the sun, #138), and
  // on a short landscape screen it is one slim row. Toggles keep their name and say their state with aria-pressed.
  import type { Below } from '../model/ladder';
  import { languages } from '../model/strings';
  import { go } from '../router';
  import { canSpeak, hasNight, loc, setLevel, setMode, setSound, setSpeech, settings, syncUrl, THEME_IDS, themeSwatches, tr, view } from '../state.svelte';
  import type AboutT from './About.svelte';
  import Icon from './Icon.svelte';
  import Ladder from './Ladder.svelte';
  import type MenuT from './Menu.svelte';
  import { languageNote, type MenuEntry } from './menu';

  let { crumbs, below, roomy, onhot, small, short, wide, explore, canExplore, ontoggle, time, timeOpen, ontime, onpretime, paused, onpause, quiet, onmap }: {
    crumbs: { title: string; path: string[] }[]; small: boolean;
    /** What lies below the scene you're in (the ladder's last rung), room to keep a stack open, pointing at a door. */
    below: Below | null; roomy: boolean; onhot: (id: string | null) => void;
    /** A short landscape screen (a phone on its side). */
    short: boolean;
    /** Room for the long "What can I explore?" label. */
    wide: boolean;
    /** "What can I explore?" is on / there's anything to explore here (doors or packets; else it isn't shown). */
    explore: boolean; canExplore: boolean; ontoggle: () => void;
    /** The time machine's button: the year you're in (null: today), or no button (nowhere else in time to go). It
     *  opens the time machine (loaded when pointed at), and says whether it is open. */
    time: { year: number | null } | null; timeOpen: boolean; ontime: () => void; onpretime: () => void;
    /** All motion is paused (by the reader, or while a packet is caught). */
    paused: boolean; onpause: () => void;
    /** Hide the breadcrumb (a caught packet's panel names what you're looking at). */
    quiet: boolean;
    /** Open the list view (focus goes back to `from` when it closes). */
    onmap: (from: HTMLElement) => void;
  } = $props();
  /** What hangs off ⋯: its menu, or About. */
  let open = $state<'menu' | 'about' | null>(null);
  let more: HTMLButtonElement;
  // the menu and About load on first use (the menu as soon as ⋯ is pointed at or focused), off the first load
  let Menu = $state.raw<typeof MenuT | null>(null), About = $state.raw<typeof AboutT | null>(null);
  const loadMenu = async () => { Menu ??= (await import('./Menu.svelte')).default; };
  async function toggleMenu() {
    if (open === 'menu') return void (open = null);
    await loadMenu();
    open = 'menu';
  }
  async function showAbout() {
    About ??= (await import('./About.svelte')).default;
    open = 'about';
  }
  function close(back: boolean) { open = null; if (back) more.focus(); }
  // a tap or click outside closes it
  function onpointerdown(e: PointerEvent) {
    if (open && !(e.target as Element).closest?.('.menu, .about-box, .more-btn')) open = null;
  }
  /** A phone held upright: day/night goes in ⋯. */
  const narrow = $derived(view.vp.w < 400);
  const entries = $derived<MenuEntry[]>([
    ...(narrow && hasNight() ? [{ kind: 'toggle' as const, id: 'night', icon: view.mode, label: tr('ui.night'), on: view.mode === 'night',
      state: tr(view.mode === 'night' ? 'ui.on' : 'ui.off'), set: (on: boolean) => setMode(on ? 'night' : 'day') } satisfies MenuEntry] : []),
    { kind: 'list', id: 'lang', icon: 'globe', label: tr('ui.language'), value: loc.lang, pick: (lang) => go({ lang }, true),
      options: languages.map((l) => ({ id: l.code, label: l.name, lang: l.code, note: languageNote(l.code, l.name, loc.lang), badge: l.code.toUpperCase() })) },
    ...(small ? [{ kind: 'toggle' as const, id: 'sound', icon: settings.sound ? 'soundOn' : 'soundOff', label: tr('ui.sound'), on: settings.sound,
      state: tr(settings.sound ? 'ui.on' : 'ui.off'), set: setSound } satisfies MenuEntry] : []),
    ...(canSpeak() ? [{ kind: 'toggle' as const, id: 'speech', icon: 'speak' as const, label: tr('ui.speech'), on: settings.speech,
      state: tr(settings.speech ? 'ui.on' : 'ui.off'), set: setSpeech } satisfies MenuEntry] : []),
    ...(THEME_IDS.length > 1 ? [{ kind: 'choice' as const, id: 'style', label: tr('ui.style'), value: settings.style,
      pick: (id) => { settings.style = id; syncUrl(); },
      options: THEME_IDS.map((id) => ({ id, label: tr(`theme.${id}.name`), swatch: themeSwatches[id] })) } satisfies MenuEntry] : []),
    { kind: 'action', id: 'map', icon: 'list', label: tr('map.open'), run: () => onmap(more) },
    { kind: 'action', id: 'about', icon: 'info', label: tr('about.open'), run: showAbout },
  ]);
</script>

<svelte:window {onpointerdown} />
<header class="chrome" data-ui>
  <Ladder {crumbs} {below} {small} {short} {roomy} {quiet} {onhot} />
  <div class="controls">
    {#if canExplore}
      <div class="card">
        <button class="btn explore-btn" aria-pressed={explore} title={tr('explore.title')} onclick={ontoggle}>
          <Icon name="explore" /><span dir="auto">{tr(wide ? 'explore.title' : 'explore.short')}</span>
        </button>
      </div>
    {/if}
    {#if time}
      {@const era = time.year === null ? tr('time.now') : String(time.year)}
      <div class="card">
        <button class="btn time-btn" aria-haspopup="dialog" aria-expanded={timeOpen} aria-label="{tr('time.title')}: {era}" title={tr('time.title')}
          onpointerenter={onpretime} onfocus={onpretime} onclick={ontime}><Icon name="time" /><span dir="auto">{era}</span></button>
      </div>
    {/if}
    <div class="card">
      <button class="btn icon-btn" aria-pressed={paused} aria-label={tr('ui.pause')} title={tr('ui.pause')} onclick={onpause}><Icon name={paused ? 'play' : 'pause'} /></button>
    </div>
    <div class="card seg" role="group" aria-label={tr('ui.level')}>
      {#each ['kid', 'nerd'] as const as lv}
        <button class="btn" class:on={loc.level === lv} aria-pressed={loc.level === lv} onclick={() => setLevel(lv)}>{tr(small ? `mode.${lv}.short` : `mode.${lv}`)}</button>
      {/each}
    </div>
    {#if hasNight() && !narrow}
      <div class="card">
        <button class="btn icon-btn" aria-pressed={view.mode === 'night'} aria-label={tr('ui.night')} title={tr('ui.night')} onclick={() => setMode(view.mode === 'night' ? 'day' : 'night')}><Icon name={view.mode} /></button>
      </div>
    {/if}
    {#if !small}
      <div class="card">
        <button class="btn icon-btn" aria-pressed={!settings.sound} aria-label={tr('ui.mute')} title={tr('ui.mute')} onclick={() => setSound(!settings.sound)}><Icon name={settings.sound ? 'soundOn' : 'soundOff'} /></button>
      </div>
    {/if}
    <div class="card">
      <button class="btn icon-btn more-btn" bind:this={more} aria-haspopup="menu" aria-expanded={open === 'menu'} aria-label={tr('ui.more')} title={tr('ui.more')}
        onpointerenter={loadMenu} onfocus={loadMenu} onclick={toggleMenu}><Icon name="more" /></button>
    </div>
  </div>
  {#if open === 'menu' && Menu}<Menu {entries} label={tr('ui.more')} back={tr('ui.back')} onclose={close} />{/if}
  {#if open === 'about' && About}<About onclose={close} />{/if}
</header>
