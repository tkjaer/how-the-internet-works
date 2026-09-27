// Hash router: #/<lang>/<scene>[/<stop>], e.g. #/da/wifi or #/en/internet/ixp. Deep links and Back/Forward work.
// Style and lab settings live in the query string (see settings.svelte.ts), so a URL captures a whole setup.
import { getLang, isLang, setLang, FALLBACK } from './i18n';
import { SCENES, stopsFor, type SceneId } from './scene';

export interface Route { lang: string; scene: SceneId; stop: string | null }
const listeners = new Set<(r: Route, prev: Route) => void>();

export function parse(hash = location.hash): Route {
  const [, lang, scene, stop] = hash.replace(/^#/, '').split('/');
  const navLang = navigator.language?.slice(0, 2);
  const s = (SCENES as readonly string[]).includes(scene) ? (scene as SceneId) : 'overview';
  return {
    lang: isLang(lang) ? lang : isLang(navLang) ? navLang : FALLBACK,
    scene: s,
    stop: stop && stopsFor(s).some((x) => x.id === stop && x.kind !== 'scene') ? stop : null,
  };
}

let route = parse();
export const current = () => route;
const hashOf = (r: Route) => `#/${r.lang}/${r.scene}${r.stop ? `/${r.stop}` : ''}`;

export function go(partial: Partial<Route>, replace = false) {
  const next: Route = { ...route, ...partial };
  if ('scene' in partial && partial.scene !== route.scene && !('stop' in partial)) next.stop = null;
  const hash = hashOf(next);
  if (hash === location.hash) return;
  const url = location.pathname + location.search + hash;
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  update();
}

function update() {
  const next = parse();
  const prev = route;
  const changed = next.lang !== prev.lang || next.scene !== prev.scene || next.stop !== prev.stop;
  route = next;
  setLang(route.lang);
  if (changed) listeners.forEach((fn) => fn(route, prev));
}

export function onRoute(fn: (r: Route, prev: Route) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function startRouter() {
  window.addEventListener('popstate', update);
  window.addEventListener('hashchange', update);
  setLang(route.lang);
  if (!location.hash) history.replaceState(null, '', location.pathname + location.search + hashOf(route));
  document.documentElement.lang = getLang();
  return route;
}
