# Accessibility (issue #53)

**Target.** WCAG 2.2 AA for the controls and navigation, and an *equivalent experience* of the picture: anything you
can learn or reach by looking and tapping, you can also learn or reach by keyboard, screen reader or listening.

The work comes in four slices:

| Slice | What | State |
|---|---|---|
| 1 | Pause everything, the automated check (axe + keyboard) in `npm run evaluate` and CI, focus and announcer fixes | done |
| 2 | A text map (list view) and the keyboard in the scene, sharing one focus model | done |
| 3 | Spoken descriptions of each scene (`describe`, kid/nerd, every language) and read aloud from ⋯ | done |
| 4 | Not by colour alone, non-text contrast, `forced-colors`, targets and 200 % zoom (with #45) | done |

## What works today

- **Pause.** ⏸ in the top bar, in every scene, freezes all motion: traffic, the dives (radio waves, light, copper,
  walking envelopes), the night sky and the doors' breathing (WCAG 2.2.2). It is remembered across reloads. Catching
  a packet pauses too; letting go resumes unless ⏸ is on. `prefers-reduced-motion` still removes the flights and the
  breathing as before.
- **Sound** (#189). On by default, but nothing plays before the first tap or key (the browser allows none), and
  every sound is short: a pop, a whoosh, a blip, the five-second modem handshake. The control to stop it is always
  one tap away (WCAG 1.4.2): the speaker button in the top bar on a desktop or tablet ("Mute sound", `aria-pressed`
  while muted), or Sound (a checkbox) in ⋯ on a phone. Muting stops everything at once, the handshake too, and is
  remembered; `?sound=off` in the link mutes it for that load. The picture never depends on it: the modem's speech
  bubble and the waves on the line tell the handshake without sound. Read aloud and the sounds share the speakers:
  the quiet ticks of packets you only watch wait while it speaks, and the other sounds are short and come with a
  tap.
- **Keyboard.** Everything in the chrome, the caption, the ladder, the peek, the ⋯ menu and the picker is a real
  button or link. Esc goes back up, closes a list, a menu or a dialog, folds an opened caption, or lets a caught
  packet go. ← → (▲ ▼ in portrait) step along, except inside an opened caption that scrolls (the arrows scroll it).
  Along the path they walk the whole trip (#169): on past the end of a group's stops, back out of it, and into the
  next group; ◀ ▶ then name where they go ("Into: The internet", "Back out: Your home"), in their accessible name
  and in a small label beside the button that says the same. On a portrait screen ▲ always shows its name ("Next
  stop"), in the button itself (#182), so it isn't mistaken for the caption's buttons below it. C folds the caption away and back (in the caption or
  the picture).
- **The keyboard in the scene.** The picture is one Tab stop, after the top bar (`ui/SceneKeys.svelte`, a
  `toolbar` named "The picture"): a real button over every spot of the scene, in a layer that moves with the camera,
  with a roving tabindex on where you are. The spots and their order come from one focus model (`spotsOf` in
  `model/focus.ts`): the whole scene first, then the stops in stepping order (the same as ← →), each with the doors it
  opens (`doorsOf`). On a stop the theme draws a two-tone ring round it (the art's `kbd`, the same ink and gap as the
  focus ring) and its door shows its label; the whole scene gets an outline 3 px on screen. Focus follows where you
  are and where you are follows focus: ← → (▲ ▼) step, Home and End go to the first and last stop, Enter or Space
  opens the stop's door (open up, then look inside, then change), Esc goes up. Each button says where it is ("Wi‑Fi,
  2 of 7, look inside"; the scene: "Watching a video, 7 stops"). The ring and the label show only for the keyboard
  (`:focus-visible`), not when focus lands in the scene after a tap. The buttons take no pointer events, so taps
  still hit the picture; screen readers' touch exploration, Voice Control and switch access reach them too.
- **The list view** (`ui/TextMap.svelte`, a lazy chunk): the whole scene tree as text, from "List view" in ⋯ or the
  skip link (the first Tab stop, "Skip to the list view"). A dialog over the page (`inert` meanwhile) that opens at
  where you are ("You are here", `aria-current="location"`) and marks the caught packet's hop. Each scene has a
  heading (deeper scenes, deeper levels: `role="heading"`, `aria-level`), its caption's tag and text and its door
  ("Open up", "Look inside"); a path scene lists its stops in stepping order (`model/textmap.ts`, `mapOf`: the same
  spots as the scene's keys), each with its text, "Go there", "Change" at the start, and the scenes it opens. A
  layer dive hangs under its hop, a run's dive under its first link. Going somewhere closes it and puts focus there
  in the scene; Esc or × gives focus back to what opened it. Print prints the list, on the page's paper. Each scene's
  description (slice 3, `describe`: what its picture shows) comes before its caption text, so the list is the
  picture's text alternative.
- **The time machine** (#59, `ui/TimeMachine.svelte`, a lazy chunk): its button in the top bar on every screen (a
  clock and the era you're in, "Today" or the year; its name "Travel in time: 1995", `aria-haspopup="dialog"` and
  `aria-expanded`), the 🕰️ chip in the caption on every overview and the same button in the list view open a dialog
  like the picker (the page behind it `inert`, Esc, × or a click outside closes it and gives focus back to its
  opener). Below 400 px day/night moves into ⋯ (a toggle, "Night: off"), so the row still fits and "Explore" keeps its
  word (#138: its icon alone, by the ☀, read as the sun). The eras are a native
  radio group in a `fieldset` ("When?"), so the arrow keys choose and a screen reader says "1995 Dial-up (the old
  days), radio button, 1 of 3"; it opens with focus on where you are ("You are here"), and each era's text and what
  its picture shows are the radio's description (`aria-describedby`). Choosing only chooses (and shows the text); the
  button ("Travel to 1995", or "Stay here") or Enter on a radio goes. Where the place had no way online in an era
  (the street in 1995), that era's stop is its own trip at home: a line under the eras says so, marked with the clock,
  and it is in the radio's description too, so it is heard before going. The trip is a place switch: when the morph
  lands, focus goes to the caption's heading and the announcer says the era first ("It's 1995.", "Back to today.",
  and why you are somewhere else), then what lies below and the new place's description. It adds no motion of its
  own; under `prefers-reduced-motion` the morph is a short cross-fade.
- **First-run coach marks** (#21, `ui/CoachMarks.svelte`, a lazy chunk): a first visit that starts at the top gets
  four short cards, pointing at "Open up", a "Look inside", "What can I explore?" and the time machine's button. A
  reader who had the first three before the time machine came gets its card alone, once ("New. Hop in the time
  machine: see this trip in 1995 or 2010.", no count). They don't take over: the
  card is a labelled `aside`, not a dialog, so it moves no focus and traps none; its Skip and Next come right after
  the skip link in the Tab order (the skip link stays first and on top). Esc, a tap anywhere but its buttons (which
  still does what it would have done) or going anywhere ends them. Meanwhile the scene holds still on the pause's clock (⏸
  still shows only the reader's own pause), and the doors are lit as by "What can I explore?". The announcer says
  each card ("Getting started. 1 of 4. …"), and read aloud reads it when it is on. With `prefers-reduced-motion` the
  card neither fades in nor glides. Shown once (`localStorage`); a link straight into a scene or a stop gets none.
- **Hints name keys after a key** (`view.keys`, set by the last input): "Press Enter to look inside. The arrow keys
  walk along." instead of "Tap the magnifier…" (`hint.*.keys`). The overview has a hint only for keys ("Tab into the
  picture…"): for a pointer, "What can I explore?" says what there is to tap.
- **"What can I explore?"** (#122) is a toggle button (`aria-pressed`). On, the caption's story gives way to a group
  ("What can I explore?") of groups by verb ("Look inside", "Open up", "How it travels", "What it carries", "Catch")
  of real buttons, one per door or packet kind; focus moves to the first and the announcer says how many there are
  ("7 things to explore"). Pointing at or focusing one (with a visible ring) lights its door in the scene. The button
  again, Esc, a door or a catch ends it; Esc from the list puts focus back on the button, and so does letting go of
  a packet caught from it. Off, the caption is the story alone; the arrow keys still walk the scene's stops either
  way, and the list view still lists every door. The list keeps the caption's height (it scrolls if it must, its
  buttons in the Tab order), so the folded card on a phone and the pill on a short landscape screen keep theirs.
- **A folded caption** (a phone, a short landscape screen) is a disclosure: its title is a real button
  (`aria-expanded`) that opens the rest. Text cut to two lines is still read in full; the parts folded away come back
  with the button, so nothing in it is out of reach. A tap anywhere on the folded caption opens it too (#138: a parent
  reading aloud didn't find the ⌃); that is a pointer shortcut only, the title stays the way in for the keyboard and
  screen readers. It never opens by itself: open, it covers the scene, and on a first visit the coach cards.
- **Folding the caption away** (#168), on any screen: a button in its corner, marked with a bar, not a chevron
  (#182; `aria-expanded`, "Fold the text away"), folds it to the pill, its title alone, and it stays so wherever you go until it's unfolded: a tap on the
  pill, its button (`aria-expanded="false"`, "Unfold the text") or C. C works while focus is in the caption or the
  picture (a character key, so only there: WCAG 2.1.4); the keys' hint names it. Focus that was on the button goes to
  the one that undoes it; from the picture it stays put. The scene doesn't move, and its doors still answer a tap.
- **Focus is never lost.** After a door, a ladder rung or a step, focus goes to where you are in the scene (its
  key), else the new caption's heading, if the control you used has gone (it never falls to the page or to something hidden). Catching a packet moves focus to the
  peek's heading, and letting go brings it back. The picker makes the page behind it `inert` and gives focus back to
  the button that opened it. Hidden parts (the caption during a flight or while a packet is caught) are `inert`.
- **Focus ring.** One two-tone ring for every control (`:focus-visible` in `ui/ui.css`): the theme's ink outside, the
  page colour between, so it shows on paper, sky and night (≥ 3:1, `model/contrast.test.ts`). A theme can recolour it
  (`--focus-ink`, `--focus-gap`) but not remove it.
- **Screen readers.**
  - Landmarks: the top bar is a `header`; the stage, caption and peek are `main`, under a visually hidden `h1`. The
    breadcrumb is a `nav` ("Where you are") with `aria-current="location"`.
  - `document.title` names the scene: "Radio waves · How the internet works".
  - **One announcer** (`ui/Announcer.svelte`, a visually hidden `role="status"`) says short lines instead of whole
    panels: on arrival the scene's title, what lies below it ("3 doors lead further down") and what the picture shows
    (`arrival` in `ui/announce.svelte.ts`); when focus moved to the caption's heading, which says the title, just the
    rest. At a stop along the way it says the stop's name and the first sentence of its caption. In the peek it says
    the hop ("Home router, 3 of 9. It swaps the address…"). Nothing else is `aria-live`.
- **Spoken descriptions.** Every scene has one (`describe`, kid and nerd, English, Danish and German): what the picture shows
  and what moves, in short sentences in the order you'd see things. A test fails if a scene a reader can reach has
  none in some language, at either level (no English fallback). How to write them: [authoring](authoring.md).
- **Read aloud.** "Read aloud" in ⋯ (after Sound, on a phone) has the browser's own voice read each scene as you arrive: its
  title, its description and the caption. It is offered only where the system has a voice for the page's language
  (no Danish voice, no Danish read aloud), is off by default, and is remembered. Turning it on says "Read aloud is
  on" (that tap is what lets iOS speak). While it is on, the caption has "Read again"; in the peek each hop is read.
  Going somewhere else cuts it off, and the quiet packet ticks wait while it speaks. Screen-reader users don't need
  it: the announcer speaks in their own voice.
  - Toggles keep their name and say their state with `aria-pressed` ("Pause all motion, pressed"). The level's
    buttons (Simple, Technical) say which one is on. The ladder's lists and the crumbs are disclosures (`aria-expanded`), not menus.
  - A changed header field reads "60, was 61" (`ui/Change.svelte`) instead of the struck-through old value and the
    new one run together.
  - Learn-more links in another language than the page carry `lang`.
- **Contrast.** The chrome's text pairs, including the "Change" link and the peek's old and new values, meet AA in day
  and night (`model/contrast.test.ts`). So do its non-text parts at 3:1 (WCAG 1.4.11): a card's edge on the page, a
  button's and a chip's edge in a card, what is on (the level, a pressed toggle, a rung), the caption's door chips
  and the scene's door badges, the focus ring and the keyboard's ring in the scene, and dark marks (`--face`) on
  bright bodies.
- **The scene's own text.** Labels are checked where they are drawn (`npm run evaluate -- --only=a11y`, below): 4.5:1
  (3:1 when large) on their halo or the picture behind them. A label in a technology's colour (a link's name) is
  mixed 40 % into the ink (`labelInk`, `render/colour.ts`; every technology's colour is tested in every theme and
  mode); a label in one of the palette's colours uses its ink tone (`--leaf-ink`, `--teal-ink`, `--berry-ink`). Ink
  on a bright body (a lit row, a sun-yellow sticker) is `--face`, which stays dark by night, with the body as its
  halo (`Text`'s `on`).
- **Not by colour alone.** The owners' regions (home, ISP, transit, the video's network) differ by their edge's
  dash pattern as well as colour, and carry their name. A request travels as a parcel, the answer as a round film
  reel. The fibre's colours are numbered at both ends (1, 2, 3…; λ1, λ2… for nerds) and the descriptions name them
  ("1 red, 2 yellow…"). The scene's doors differ by their mark (+, magnifier, ✎), not just their colour. `--only=vision`
  shows a few scenes and the chrome through protanopia, deuteranopia, tritanopia and achromatopsia to look at.
- **Forced colours** (Windows contrast themes, `forced-colors: active`): the chrome keeps its edges (buttons and
  chips get a `ButtonText` border, the caption's doors `LinkText`), what is on or pressed is `Highlight`, the focus
  ring is `Highlight`. In the scene, the keyboard's ring (`kbd-ink`, `kbd-gap`) is `Highlight` on `Canvas`, and the
  doors are `LinkText` badges with the hot one in `Highlight`; the rest of the picture keeps its colours.
- **Targets and zoom.** Every control is at least 24 × 24 px (WCAG 2.5.8), including the caption's chips and the
  inline learn-more links. At 200 % zoom (a 1280 px window: the evaluate's `zoom` view, 640 × 450 CSS px) the
  chrome wraps and scrolls and nothing is cut off; large text from the browser's settings is the same page zoom.

The stage SVG stays `aria-hidden`: its keys name the stops, its description is spoken on arrival and shown in the
list view. An entry node (the start of a group or a dive's ends) is not a stop of its own: Esc and the list view take
you up.

## How to check

```sh
npm run build && npx vite preview --host 127.0.0.1 --port 5318 &
npm run evaluate -- --only=a11y               # day
npm run evaluate -- --only=a11y --mode=night  # night
```

It prints each problem and exits non-zero if there is one; it writes no screenshots or metrics. CI runs both side by side
on every PR (the `a11y` job's day/night matrix in `.github/workflows/ci.yml`, "a11y (day)" and "a11y (night)", on the
self-hosted lab runners, with the lab PC's GPU). It checks each state once it stands still: the camera has landed and no CSS
animation or transition is running (`document.getAnimations()`), so nothing is judged mid-fade, however slow the
machine (#70). It checks:
- **axe-core** (WCAG 2.0, 2.1, 2.2 A and AA, plus best practice) on the overview, inside the internet, the Wi‑Fi,
  router and IP-layer dives, "What can I explore?" on (the overview and the Wi‑Fi dive), Danish nerd, a caught packet (and its details; on a phone, its sheet opened all the way, #139), the picker, the time machine (from the top bar; from the street on 1995, the era's own trip at home; from its chip in Danish), the open ladder, the ⋯
  menu and About, read aloud on (the caption's "Read again", ⋯ with its toggle), the scene's keys on a stop, the list
  view and the first-run coach marks (the first card, "What can I explore?" and the time machine's, and the one card a
  returning reader gets), a nerd's extra in a dive and the list view with it, on a desktop, a portrait phone and a short landscape screen, and most of them at 200 % zoom. **Zero
  violations** is the bar; there is no baseline of allowed ones.
- **Controls** in each of those states: at least 24 × 24 px, not cut off by the window or a box that doesn't scroll,
  and not under another control (an open pop-up aside). An open pop-up's own controls must be on top of everything,
  so ⋯ over a caught packet's panel is checked too (#90).
- **The scene's labels** in every path scene and dive, kid and nerd on a desktop and kid on a phone, the clock held
  still: each visible text (not faded below 60 %, not under the chrome or later art) against its halo, or the median
  of the pixels behind it with the text hidden, whichever is more. A halo in the ink's own tone (dark round dark)
  smears the letters, so it fails whatever the picture behind. No text may leave its panel (inside the frame) or, at
  the top level, the window; the path scenes are checked that way in Danish and nerd and in short landscape too (#90).
- **Tab once round** each of those states: focus must never land on the page, on something inert, hidden or off
  screen, or on a control without a visible ring (for the scene's keys: on a stop, the theme's ring in the scene).
- **Journeys:** "What can I explore?" (no list before it; pressed, focus in its list, the announcer says how many
  things; Esc brings the story back with focus on the button), a door from its list (focus stays somewhere visible,
  and it ends), catching a packet from it (focus on the peek), Tab in the peek, letting go (focus back on "What can I
  explore?"), ⋯ (focus in the menu, Esc back to ⋯), the picker (Tab stays in it, Esc back to its button), the
  time machine (it opens on where you are, Tab stays in it, Esc back to the chip; ← ← and Enter go to 1995, focus on
  the caption's heading, the announcer says the arrival; and back to today; from the top bar inside the TCP dive, at
  home and on the street: Esc back to the button, ← ← and Enter go to the TCP in 1995 (the PC's at home, the GSM
  laptop's on the street), focus on the caption's heading, the announcer says "It's 1995." first, and the button says
  1995),
  the scene's keys (Tab in, → → to the Wi‑Fi, Enter into its dive, Esc), the list view (the skip link opens it at
  where you are, Tab stays in it, Esc back to the skip link; from ⋯, a door in it lands in the scene), and read aloud:
  turned on in ⋯ it says so; through a door the announcer says the description, read aloud says the title, the
  description and the caption, and "Read again" says them again. The browser's voices are replaced by a fake one with
  an English and a Danish voice (a headless browser may have none), which notes what it was asked to say. Then the
  coach marks: a first visit gets them and the announcer says the first; Tab goes skip link, then the card; Next
  steps on and keeps focus; Esc ends them, leaves focus somewhere visible and they don't come back after a reload; a
  link into a scene gets none (and doesn't use them up); a tap on "Open up" ends them and opens it. A returning reader
  (`coached` `'1'`) gets the time machine's card alone, said as new with no count, and after Esc never again. Last,
  the walk (#169), on a desktop and a portrait phone: ▶ from the phone to the server through the internet and its
  data centre, each crossing named on the button and in its label alike ("Into: The internet", "Into: Data
  centre"), a bump at the end; ◀ walks it back exactly ("Back out: Your home") to the overview, and focus is left
  somewhere visible.

Every other page the evaluate opens (shots, timings, checks, the vision sheets) has had the coach marks already
(`coached` in `localStorage`), so none of them sees the cards.

`--only=perf` also times walking the scene's keys (`keysWalk`) and the time machine's trip to 1995 (`morphToDialup`).

axe can't judge SVG text over art (it reports it as "needs review"); the label check above does.

```sh
npm run evaluate -- --only=vision [--mode=night]   # .tmp/vision/*.jpg: colour-vision and forced-colours sheets
```

## Manual checklist

The automated check can't hear what a screen reader says. Before a release that touches the chrome, the caption, the
ladder or the peek, walk this with a real screen reader. **Not yet done for slice 1.**

**VoiceOver on macOS** (Safari, ⌘F5):
- [ ] VO-U (rotor): landmarks "banner", "main", "Where you are" navigation; one heading level 1.
- [ ] Tab from the top: every control is named; ⏸, ☀️/🌙 say "pressed" / "not pressed", not a changing name.
- [ ] Open a door from the caption: you hear the new scene's title once, then what lies below and its description,
      and focus is on its heading (VO-→ reads on into the caption).
- [ ] Step with ← →: each stop's title is spoken once; nothing re-reads the whole caption.
- [ ] Step ▶ on from the last stop before the internet: the button says "Into: The internet", and you arrive inside
      at its first stop; ◀ from there says "Back out: Your home".
- [ ] Catch a packet (its chip in the caption): focus moves to the peek; ◀ ▶ say "Home router, 3 of 9…"; a changed
      field says "…, was …"; Esc returns to where you were.
- [ ] On a phone, the peek's grip says "Show the whole panel, collapsed" / "expanded"; swiping on through the sheet
      reaches every envelope, its magnifier and "How it travels".
- [ ] Ladder: the current rung's list opens and closes ("expanded" / "collapsed"); Esc folds it.
- [ ] ⋯: a menu with Language (radio items), Read aloud (a checkbox; Sound too on a phone) and About; Esc returns to ⋯.
- [ ] Mute sound (desktop): says "Mute sound, toggle button, not pressed"; pressed, the sound stops at once, the modem's
      handshake too, and it is still muted after a reload.
- [ ] Read aloud (with VoiceOver off): turned on it says so; each door reads the title, the description and the
      caption; "Read again" repeats it; a new door cuts it off. In Danish it is only offered with a Danish voice
      installed.
- [ ] "Change" (the place): a dialog; Tab stays in it; Esc returns to "Change".
- [ ] Tab past the top bar into the picture: "The picture, toolbar", "Watching a video, 7 stops". → says "Phone, 1
      of 7, change where you are" once (and the announcer adds its first sentence); Enter on the Wi‑Fi looks inside.
- [ ] The skip link (first Tab) opens the list view at "You are here"; VO-⌘H walks the headings; "Go there" closes it
      and you are on that stop in the picture; Esc returns to the skip link.
- [ ] A first visit (clear the site's data): after a moment "Getting started. 1 of 3. …" is said once; Tab reaches
      the skip link, then Skip and Next; Next says "2 of 3. …"; Esc ends it, and it doesn't come back.
- [ ] Switch to Dansk: the Danish voice is used for the page (and English for an English learn-more link).

**VoiceOver on iOS** (Safari, triple-click side button):
- [ ] Swipe through the top bar and the caption in portrait and landscape: nothing hidden is reachable, nothing off
      screen.
- [ ] Double-tap a caption chip: the new scene is announced; the next swipe starts in the new caption.
- [ ] ⏸ stops all motion, also inside a dive, and stays paused after a reload.
- [ ] Sound plays from the first tap; Sound in ⋯ mutes it at once, and it stays muted after a reload.

**TalkBack on Android** (Chrome): the same as iOS.

Record the date, browser and screen reader with the result here when it is run.
