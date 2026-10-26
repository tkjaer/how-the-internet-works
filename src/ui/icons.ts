// Tiny inline UI icons (stroke paths in a 24×24 box). Kept as data so every theme's chrome can colour them.
export const ICON = {
  soundOff: 'M4 9h4l5-4v14l-5-4H4z M17 9l5 6 M22 9l-5 6',
  soundOn: 'M4 9h4l5-4v14l-5-4H4z M16.5 8.5a5 5 0 0 1 0 7 M19 6a8.5 8.5 0 0 1 0 12',
  speak: 'M4 4.5h16v11H10l-4.5 4v-4H4z M8 8.5h8 M8 12h5',
  /** a step along the path (drawn `solid`): a shaft and a filled head, not the caption's chevrons (#182) */
  arrow: 'M4 12h8 M11.5 5l8 7-8 7z',
  /** folding the caption away (#168): a bar at the bottom, as a window is minimised; no arrow or chevron (#182) */
  tuck: 'M6 18h12',
  close: 'M6 6l12 12 M18 6L6 18',
  palette: 'M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-1.3-1-1.7-1-2.9 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z M7.5 11.5h.01 M10 7.5h.01 M15 7.5h.01',
  down: 'M6 9l6 6 6-6',
  /** the languages in ⋯ (a globe: no flag, as a language is no country) */
  globe: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M3.5 9h17 M3.5 15h17 M12 3c-2.4 2.5-3.6 5.5-3.6 9s1.2 6.5 3.6 9 M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9',
  /** into a list in the ⋯ menu (the languages), and back out of it; mirrored right to left */
  next: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  look: 'M10.5 4.5a6 6 0 1 0 0 12a6 6 0 1 0 0-12z M15 15l5 5',
  open: 'M5 21V3h14v18 M5 3l9 3v16l-9-1z',
  explore: 'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1 M12 9.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z',
  pause: 'M9 6v12 M15 6v12',
  catch: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16z M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z',
  play: 'M8 5.5v13l10.5-6.5z',
  extra: 'M12 5v14 M5 12h14',
  wave: 'M2 12c2-6 4-6 5 0s3 6 5 0 3-6 5 0 3 6 5 0',
  day: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4',
  night: 'M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z',
  envelope: 'M3 6h18v12H3z M3 6l9 7 9-7',
  ladder: 'M7 3v18 M17 3v18 M7 7.5h10 M7 12h10 M7 16.5h10',
  lock: 'M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  more: 'M5 10.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3z M12 10.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3z M19 10.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3z',
  list: 'M9 6h11 M9 12h11 M9 18h11 M4.5 6h.01 M4.5 12h.01 M4.5 18h.01',
  time: 'M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5 M3.5 4v4.5H8 M12 7.5V12l3 2',
  takes: 'M12 6.5a7.25 7.25 0 1 0 0 14.5a7.25 7.25 0 1 0 0-14.5z M12 13.75V10 M9.5 3h5 M12 3v3.5 M18 6.5l1.5-1.5',
  info: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 11v5.5 M12 7.6v.01',
};
