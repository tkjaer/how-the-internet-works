// Hash router: #/<lang>/<scene>, e.g. #/da/wifi. Deep links and Back/Forward work.
import { dir, getLang, isLang, setLang, FALLBACK } from './i18n';
import { SCENES, type SceneId } from './scene';

export interface Route { lang: string; scene: SceneId }
const listeners = new Set<(r: Route) => void>();

export function parse(hash = location.hash): Route {
  const [, lang, scene] = hash.replace(/^#/, '').split('/');
  const navLang = navigator.language?.slice(0, 2);
  return {
    lang: isLang(lang) ? lang : isLang(navLang) ? navLang : FALLBACK,
    scene: (SCENES as readonly string[]).includes(scene) ? (scene as SceneId) : 'overview',
  };
}

let route = parse();

export const current = () => route;

export function go(partial: Partial<Route>, replace = false) {
  const next = { ...route, ...partial };
  const hash = `#/${next.lang}/${next.scene}`;
  if (hash === location.hash) return;
  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
  update();
}

function update() {
  const next = parse();
  const changed = next.lang !== route.lang || next.scene !== route.scene;
  route = next;
  setLang(route.lang);
  if (changed) listeners.forEach((fn) => fn(route));
}

export function onRoute(fn: (r: Route) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function startRouter() {
  window.addEventListener('popstate', update);
  window.addEventListener('hashchange', update);
  setLang(route.lang);
  document.documentElement.dir = dir();
  if (!location.hash) history.replaceState(null, '', `#/${route.lang}/${route.scene}`);
  document.documentElement.lang = getLang();
  return route;
}
