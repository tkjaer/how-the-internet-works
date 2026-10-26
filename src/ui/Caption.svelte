<script lang="ts">
  // Bottom caption: it tells the story. Title + simple/technical text, its notes (a Technical extra, #31), "Read again" while read
  // aloud is on (#53), the keys' hint after a key, where you are (tap to change), the time machine (#59: on every
  // overview; the year when it isn't today's) and "Want to know more?" (#4).
  // "What can I explore?" (`explore`, #122) swaps all of that for the doors you can open from here, in the same space
  // (its height is kept, the list scrolls if it must): chips by verb (Look inside, Open up, How it travels, What it
  // carries) and the packets to catch, the keyboard and screen-reader way in. Pointing at or focusing a chip lights its
  // door in the scene (`onhot`).
  // It may fold (`fold`, from `captionFold`) so the scene keeps the screen; its title is then a button that opens the
  // whole caption over the scene (Esc or the title folds it again), and it folds up again when the caption changes. A
  // tap anywhere on the folded caption opens it too (#138: a child read the two lines and never found the rest; the
  // title stays the way in for the keyboard and screen readers). It doesn't open by itself: open, it covers the scene.
  // How it folds:
  // - `pill` (a short landscape screen): a one-line pill with the title (exploring: a row of chips);
  // - `card` (a portrait phone): the title and the text cut to two lines (exploring: the chips, its title then only
  //   for screen readers); where you are and learn-more links show once it's open. The text is all there for screen
  //   readers either way.
  // Its own button (in its corner, a bar at the bottom: not a chevron, which opens and closes it, nor an arrow, which
  // steps; #182) or C, while focus is in it or in the picture, folds it away by hand (`tucked`, #168): the title alone
  // in the pill, on every screen, until it is unfolded again (a tap on the pill, its chevron or C), wherever you go
  // meanwhile. App keeps the scene where it was, so nothing in the scene moves.
  // Hidden (during a flight, while a packet is caught), it is inert: nothing in it can be focused or read. Its title
  // takes focus when a navigation took it away (App.svelte); open over the scene and taller than the screen, it can be
  // focused to scroll it.
  import { tick } from 'svelte';
  import { loc, tr } from '../state.svelte';
  import type { CaptionDoor, CaptionFold, CaptionText } from './caption';
  import Icon from './Icon.svelte';
  let { text, place, onplace, time, ontime, onpretime, ondoor, onhot, explore, catches, oncatch, onread, hidden, fold, tucked = $bindable(false), el = $bindable() }: {
    text: CaptionText; place: string; onplace: () => void;
    /** The time machine's chip: none here (null), or the year of an older era (null in the newest), and opening it
     *  (`onpretime` as it is pointed at or focused, to load it). */
    time: { year: number | null } | null; ontime: () => void; onpretime: () => void;
    /** Read the caption aloud again; no button without it (read aloud off, or no voice). */
    onread?: () => void;
    /** Packet kinds to catch here (issue #17), and catching one (both listed only while exploring). */
    catches: { kind: string; name: string }[]; oncatch: (kind: string) => void;
    /** Open a door / point at it (its badge in the scene glows) or stop pointing (null). */
    ondoor: (d: CaptionDoor) => void; onhot: (id: string | null) => void;
    /** "What can I explore?" is on: the doors instead of the story (#122). */
    /** `fold` is the screen's (`captionFold`); `tucked`, folded away by hand (#168). */
    explore: boolean; hidden: boolean; fold: CaptionFold; tucked?: boolean; el?: HTMLElement;
  } = $props();
  let openFor = $state<string | null>(null);
  /** The folded caption's height while it is open over the scene, so the scene doesn't move. */
  let foldH = $state(0);
  let toggleEl = $state<HTMLButtonElement>(), foldEl = $state<HTMLButtonElement>();
  /** How it folds now: tucked away, it is the pill. */
  const shown = $derived(tucked ? 'pill' : fold);
  const open = $derived(!!shown && openFor === text.title);
  $effect.pre(() => { void shown; void explore; openFor = null; });
  /** The story's height (and fold), kept while it shows: the doors take its place, not more. A new fold (the screen
   *  turned) lets them take what they need. */
  let story = $state<{ h: number; fold: CaptionFold } | null>(null);
  $effect(() => {
    const c = el;
    if (!c || explore) return;
    const ro = new ResizeObserver(() => { if (!explore) story = { h: c.offsetHeight, fold: shown }; });
    ro.observe(c);
    return () => ro.disconnect();
  });
  const lockH = $derived(explore && story && story.fold === shown ? story.h : 0);
  /** The button in its corner: where it isn't a pill already, and not over the scene. */
  const foldable = $derived(!tucked && fold !== 'pill' && !open && !explore);
  function toggle() {
    if (tucked) return tuck(false);
    if (!open) foldH = el?.offsetHeight ?? 0;
    openFor = open ? null : text.title;
  }
  /** Fold it away or back; focus that was in it goes to the button that undoes it. */
  function tuck(on: boolean) {
    const had = !!el?.contains(document.activeElement);
    tucked = on;
    if (had) void tick().then(() => (on ? toggleEl : (foldEl ?? toggleEl))?.focus());
  }
  /** C: what its corner button does (the pill a short landscape screen folds it to opens over the scene, as a tap does). */
  function flip() {
    if (tucked || (fold !== 'pill' && !open)) tuck(!tucked);
    else toggle();
  }
  function onclick(e: MouseEvent) {
    if (shown && !open && !explore && !(e.target as Element).closest('button, a')) toggle();
  }
  function onkeydown(e: KeyboardEvent) {
    if (e.defaultPrevented) return;
    if (e.key.toLowerCase() === 'c' && !e.altKey && !e.ctrlKey && !e.metaKey && !hidden && el) {
      // only while focus is in the caption or the picture (a character key, WCAG 2.1.4)
      const at = document.activeElement;
      if (!at || !(el.contains(at) || at.closest('.scene-keys')) || at.closest('[inert]')) return;
      e.preventDefault();
      return flip();
    }
    if (e.key !== 'Escape' || !open) return;
    e.preventDefault();
    if (el?.contains(document.activeElement)) toggleEl?.focus();
    openFor = null;
  }
  const icon = { dive: 'look', expand: 'open', down: 'wave', up: 'envelope' } as const;
  let inner = $state<HTMLElement>(), scrolls = $state(false);
  $effect(() => {
    const p = inner;
    if (!p || !open) return void (scrolls = false);
    const ro = new ResizeObserver(() => (scrolls = p.scrollHeight > p.clientHeight));
    ro.observe(p);
    return () => ro.disconnect();
  });
  const verbs = $derived((['dive', 'expand', 'down', 'up'] as const).map((kind) => ({ kind, doors: text.doors.filter((d) => d.kind === kind) })).filter((v) => v.doors.length));
</script>

<svelte:window {onkeydown} />
<!-- a tap on the folded caption opens it; its title is the button for the keyboard and screen readers -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<section class="caption card" class:hide={hidden} class:compact={shown === 'pill'} class:folded={shown === 'card'} class:open class:exploring={explore} class:foldable
  data-ui bind:this={el} {onclick} style:height={lockH ? `${lockH}px` : shown === 'card' && open ? `${foldH}px` : undefined} inert={hidden}>
  <!-- open and taller than the screen, it is a Tab stop, so it can be scrolled from the keyboard -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="cap-in" class:card={open} bind:this={inner} tabindex={scrolls ? 0 : undefined} data-scroll={scrolls || undefined}>
    {#if explore}
      <h2 dir="auto" tabindex="-1" class:sr={!!shown}>{text.title}</h2>
      <div class="doors" role="group" aria-label={tr('explore.title')}>
        {#each verbs as v (v.kind)}
          <span class="verb door-{v.kind}" role="group" aria-label={tr(`door.${v.kind}`)}>
            <span class="verb-name" aria-hidden="true"><Icon name={icon[v.kind]} /><span dir="auto">{tr(`door.${v.kind}`)}:</span></span>
            {#each v.doors as d (d.id)}
              <button class="btn chip door" onclick={() => ondoor(d)} onpointerenter={() => onhot(d.id)} onpointerleave={() => onhot(null)}
                onfocus={(e) => e.currentTarget.matches(':focus-visible') && onhot(d.id)} onblur={() => onhot(null)}>{d.name}</button>
            {/each}
          </span>
        {/each}
        {#if catches.length}
          <span class="verb door-catch" role="group" aria-label={tr('door.catch')}>
            <span class="verb-name" aria-hidden="true"><Icon name="catch" /><span dir="auto">{tr('door.catch')}:</span></span>
            {#each catches as c (c.kind)}<button class="btn chip door" onclick={() => oncatch(c.kind)}>{c.name}</button>{/each}
          </span>
        {/if}
      </div>
    {:else}
      {#if shown}
        <h2 dir="auto" tabindex="-1">
          <button class="cap-toggle" bind:this={toggleEl} aria-expanded={open} aria-keyshortcuts={tucked ? 'C' : undefined}
            title={tr(tucked ? 'caption.unfold' : open ? 'caption.close' : 'caption.open')} onclick={toggle}>
            <span>{text.title}</span><Icon name="down" rotate={open ? 0 : 180} />
          </button>
        </h2>
      {:else}
        <h2 dir="auto" tabindex="-1">{text.title}</h2>
      {/if}
      {#if foldable}
        <button class="btn cap-fold" bind:this={foldEl} aria-expanded="true" aria-label={tr('caption.fold')} title={tr('caption.fold')} aria-keyshortcuts="C"
          onclick={() => tuck(true)}><Icon name="tuck" /></button>
      {/if}
      {#if text.tag}<div class="tag" dir="auto">{text.tag}</div>{/if}
      <p dir="auto">{text.body}</p>
      {#each text.notes as n (n.kind)}
        <p class="note" dir="auto"><span class="note-name"><Icon name={n.kind} />{tr(`note.${n.kind}`)}:</span> {n.text}</p>
      {/each}
      <div class="foot">
        {#if onread}<button class="btn chip read" onclick={onread}><Icon name="speak" />{tr('caption.read')}</button>{/if}
        <button class="btn chip place" onclick={onplace}>{place} · <u>{tr('ui.changePlace')}</u></button>
        {#if time}
          <button class="btn chip time" aria-haspopup="dialog" onclick={ontime} onpointerenter={onpretime} onfocus={onpretime}>
            <Icon name="time" /><span class:sr={time.year}>{tr('time.title')}{time.year ? ':' : ''}</span>{time.year}
          </button>
        {/if}
        {#if text.hint}<span class="hint">{text.hint}</span>{/if}
        {#if text.links.length}
          <span class="more"><span>{tr('more.title')}</span>
            {#each text.links as l}<a href={l.url} target="_blank" rel="noopener" hreflang={l.lang} lang={l.lang}>{l.title}{l.lang !== loc.lang ? ` (${l.lang})` : ''}</a>{/each}
          </span>
        {/if}
      </div>
    {/if}
  </div>
</section>
