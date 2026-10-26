// The learn-more links a card shows (the caption's, a layer's fields'), for the era, language and level (#180).
import type { LearnMore, Level } from '../define';

/** Links for the era and the level, at most `max`: those for every era and those that name it (RFC 793 in 1995,
 *  RFC 9293 today); in their own language if there are any (English technical links stay), else English. */
export function pickLinks(all: LearnMore[], era: string, lang: string, level: Level, max = 3): LearnMore[] {
  const fit = all.filter((l) => (l.level === 'both' || l.level === level) && (!l.eras || l.eras.includes(era)));
  const own = fit.filter((l) => l.lang === lang);
  const en = lang === 'en' ? [] : fit.filter((l) => l.lang === 'en' && !(own.length && l.level !== 'technical'));
  const seen = new Set<string>();
  return [...own, ...en].filter((l) => !seen.has(l.url) && seen.add(l.url)).slice(0, max);
}
