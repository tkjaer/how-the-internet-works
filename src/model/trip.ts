// The trip's scale (issue #20): how far a packet goes, from the links' `km`, how long light takes for it, and whose
// networks it passes through.
import { within, type Route } from './resolve';

/** Light in glass fibre covers about 200 km per millisecond (two thirds of its speed in a vacuum). */
export const FIBRE_KM_PER_MS = 200;

/** Km along the chain from the start device to chain hop `i`. */
export const kmTo = (r: Route, i: number) => r.links.slice(0, Math.max(0, i)).reduce((s, l) => s + (l.km ?? 0), 0);
/** The whole trip, one way: the start device to the server. */
export const tripKm = (r: Route) => kmTo(r, r.chain.length - 1);
/** Light's time over `km` of fibre, in milliseconds. */
export const lightMs = (km: number) => km / FIBRE_KM_PER_MS;

/** The chain hops inside group `g`. */
const hopsIn = (r: Route, g: string) => r.chain.filter((h) => within(r.hops, h, g));
/** Km across group `g`: its own links, and the ones that lead in and out of it. */
export const groupKm = (r: Route, g: string) =>
  r.links.filter((l) => within(r.hops, r.hops[l.from], g) || within(r.hops, r.hops[l.to], g)).reduce((s, l) => s + (l.km ?? 0), 0);

/** The owners the packets pass through, in route order (only inside group `g`, if given); with `asides`, then those
 *  of the side branches too. */
export function ownersOf(r: Route, asides = false, g?: string): string[] {
  const out: string[] = [];
  const hops = [...(g ? hopsIn(r, g) : r.chain), ...(asides ? r.asides.map((a) => a.hop) : [])];
  for (const h of hops) if (h.owner && !out.includes(h.owner)) out.push(h.owner);
  return out;
}

/** A distance for people: metres under a km, one decimal under ten km, whole km beyond. */
export function formatKm(km: number, lang: string): string {
  if (km < 1) return new Intl.NumberFormat(lang, { style: 'unit', unit: 'meter', maximumSignificantDigits: 2 }).format(km * 1000);
  return new Intl.NumberFormat(lang, { style: 'unit', unit: 'kilometer', maximumFractionDigits: km < 10 ? 1 : 0 }).format(km);
}
/** Light's time over `km` of fibre, at Technical: microseconds under a millisecond. */
export function formatLight(km: number, lang: string): string {
  const ms = lightMs(km), us = ms < 1;
  return new Intl.NumberFormat(lang, { style: 'unit', unit: us ? 'microsecond' : 'millisecond', maximumSignificantDigits: 2 }).format(us ? ms * 1000 : ms);
}
