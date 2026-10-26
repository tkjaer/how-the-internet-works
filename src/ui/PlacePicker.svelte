<script lang="ts">
  // "Where are you?" / "What are you doing?": every place folder is offered in every activity (unless the activity's
  // slot says `only`). A place's variants (other ways of getting online from it) are not places of their own: when
  // the chosen place has some of its era, "How do you get online?" offers them. The picker stays in the era you are
  // in (#59): each place goes to its member of that era, or, with none, to the era's own trip, with the time
  // machine's line under it ("In 1995 you'd have done this at home"), part of the option's description and said on
  // arrival (with the Technical note, as the time machine's arrival). Other years are the time machine's ("Other years" opens it). A card on wide screens, a bottom sheet on
  // phones.
  import { onMount } from 'svelte';
  import { activityIds, basePlace, content, inEra } from '../model/registry';
  import { resolveRoute } from '../model/resolve';
  import { deviceArt, loadRouteArt } from '../render/lazy.svelte';
  import { nav, themeState, tr, trActivity, view } from '../state.svelte';
  import Icon from './Icon.svelte';
  import { allowedPlaces, iconOf, placeOptions, waysOnline } from './picker';
  import type { elsewhere as Elsewhere } from './time';

  let { places, activity, slot, elsewhere, onpick, onclose, ontime }: {
    places: string[]; activity: string; slot: number;
    /** The time machine's line for a place with no way online in this era (loaded with it, `ui/time.ts`). */
    elsewhere?: typeof Elsewhere;
    /** Go: the places or the activity, and what to say on arrival when a place took you to the era's own trip. */
    onpick: (p: { places?: string[]; activity?: string; said?: string }) => void; onclose: () => void;
    /** Open the time machine (#59), where there is another era to go to. */
    ontime?: () => void;
  } = $props();
  const A = $derived(themeState.current.art);
  const allowed = $derived(allowedPlaces(activity, slot));
  const here = $derived(places[slot]);
  const options = $derived(placeOptions(here, nav.route.era, allowed));
  const ways = $derived(waysOnline(here, nav.route.era, allowed));
  let dialog: HTMLDivElement;
  onMount(() => dialog.querySelector<HTMLButtonElement>('.option.on, .option')?.focus());
  const placesWith = (id: string) => places.map((p, i) => (i === slot ? id : p));
  /** Pointed at or focused: fetch that place's art ahead of the tap (#91). */
  const ahead = (id: string) => void loadRouteArt(resolveRoute({ activity, places: placesWith(id) }));
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (onclose(), e.stopPropagation())} />
<div class="picker-back" data-ui onclick={onclose} role="presentation"></div>
<div class="picker card" bind:this={dialog} class:sheet={view.orient === 'portrait'} data-ui role="dialog" aria-modal="true" aria-labelledby="pick-where">
  <header>
    <h2 id="pick-where">{tr('pick.where')}</h2>
    <button class="btn" onclick={onclose} aria-label={tr('ui.close')}><Icon name="close" /></button>
  </header>
  <div class="options places">
    {#each options as o (o.id)}
      {@const icon = iconOf(o.id)}
      {@const art = deviceArt(icon)}
      {@const line = o.instead && elsewhere?.(o.instead, o.to !== here)}
      <button class="btn option" class:on={o.on} aria-pressed={o.on} aria-describedby={line ? `pick-i-${o.id}` : undefined}
        onclick={() => onpick({ places: placesWith(o.to), said: o.instead ? elsewhere?.(o.instead, false) : undefined })}
        onpointerenter={() => ahead(o.to)} onfocus={() => ahead(o.to)}>
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <A.Device id={icon} Art={art.Art} face={art.face} pending={art.pending} x={100} y={100} size={190} time={view.time} context="dive" focused={false} />
        </svg>
        <span>{tr(`place.${o.instead ? basePlace(o.id) : o.to}.name`)}</span>
        {#if line}<small id="pick-i-{o.id}" class="instead" aria-hidden="true"><Icon name="time" />{line}</small>{/if}
      </button>
    {/each}
  </div>
  {#if ways.length > 1}
    <h2>{tr('pick.access')}</h2>
    <div class="options">
      {#each ways as v (v)}
        <button class="btn option row" class:on={v === here} aria-pressed={v === here} onclick={() => onpick({ places: placesWith(v) })} onpointerenter={() => ahead(v)} onfocus={() => ahead(v)}>
          <span>{tr(`place.${v}.access`)}</span>
        </button>
      {/each}
    </div>
  {/if}
  {#if ontime}<button class="btn years" aria-haspopup="dialog" onclick={ontime}><Icon name="time" />{tr('pick.years')}</button>{/if}
  <h2>{tr('pick.what')}</h2>
  <div class="options">
    {#each activityIds() as a (a)}
      <button class="btn option wide" class:on={a === activity} aria-pressed={a === activity} onclick={() => onpick({ activity: a })}>
        <span>{trActivity(inEra(content.activities, a, nav.route.era), 'title')}</span>
      </button>
    {/each}
  </div>
</div>
