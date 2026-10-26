import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const root = decodeURIComponent(new URL('.', import.meta.url).pathname);

/** `virtual:string-packs`: a loader per language other than English, each loading one chunk with all of that
 *  language's strings (content/locales/<lang>/ui.json + every content/<kind>/<id>/locales/<lang>.json). English ships
 *  in the main bundle as the fallback, so adding a language costs nothing for anyone who doesn't pick it; except its
 *  dive strings (layers: header field names and meanings; dive scenes: their captions and labels), only needed once a
 *  packet is caught or a dive is opened, and the eras' (the time machine's): `virtual:dive-strings` loads them as one
 *  chunk. The other folders' words for the eras of the past (`eraBlocks`) are `virtual:past-strings`, a small chunk
 *  loaded when a route of the past is shown. */
function stringPacks(): Plugin {
  const ID = 'virtual:string-packs', PACK = 'virtual:string-pack/', DIVES = 'virtual:dive-strings', PAST = 'virtual:past-strings';
  return {
    name: 'string-packs',
    resolveId: (id) => (id === ID || id === DIVES || id === PAST || id.startsWith(PACK) ? `\0${id}` : undefined),
    load(id) {
      if (id === `\0${DIVES}`) return `export const folders = import.meta.glob(['/content/layers/*/locales/en.json', '/content/scenes/*/locales/en.json', '/content/eras/*/locales/en.json'], { eager: true, import: 'default' });\n`;
      if (id === `\0${PAST}`) return `export const folders = import.meta.glob(['/content/*/*/locales/en.json', '!/content/layers/**', '!/content/scenes/**', '!/content/eras/**'], { eager: true, import: 'default', query: '?eras' });\n`;
      if (id === `\0${ID}`) {
        const langs = readdirSync(`${root}content/locales`).filter((l) => l !== 'en' && !l.startsWith('.'));
        return `export default {${langs.map((l) => `${JSON.stringify(l)}: () => import(${JSON.stringify(PACK + l)})`).join(', ')}};`;
      }
      if (id.startsWith(`\0${PACK}`)) {
        const lang = id.slice(PACK.length + 1);
        return `export const ui = import.meta.glob('/content/locales/${lang}/ui.json', { eager: true, import: 'default' });\n`
          + `export const folders = import.meta.glob('/content/*/*/locales/${lang}.json', { eager: true, import: 'default' });\n`;
      }
    },
  };
}

/** `?now` and `?eras` on a content folder's locale file (#59): its strings (and its `learnMore` links, #201) without its
 *  blocks for the eras of the past (`"1995": { … }`), or only those blocks. The main bundle's English takes the first and `virtual:past-strings` the
 *  second, so the words of the past cost nothing until a reader goes there. */
function eraBlocks(): Plugin {
  return {
    name: 'era-blocks',
    enforce: 'pre',
    transform(code, id) {
      const want = /\/locales\/[^/]+\.json\?(?:.*&)?(now|eras)(?:&|$)/.exec(id)?.[1];
      if (!want) return;
      const kept = Object.entries(JSON.parse(code)).filter(([k]) => /^\d+$/.test(k) === (want === 'eras'));
      return { code: `export default ${JSON.stringify(Object.fromEntries(kept))};\n`, map: null, moduleType: 'js' };
    },
  };
}

/** Who made the app and where its source is, for the About entry (the AGPL's Appropriate Legal Notices and source
 *  offer; NOTICE.md): from package.json, so the engine names no project. */
const pkg = JSON.parse(readFileSync(`${root}package.json`, 'utf8'));
const about = { name: 'How the Internet Works', author: pkg.author, year: 2026, license: pkg.license, source: pkg.homepage };

export default defineConfig({
  // A relative base: the same dist/ works at a site's root and under a sub-path (GitHub Pages' /<repo>/, a preview
  // folder). Routing is in the hash, so the page itself is always index.html.
  base: './',
  plugins: [svelte(), stringPacks(), eraBlocks()],
  define: { __ABOUT__: JSON.stringify(about) },
  resolve: {
    // Content folders import the engine only through $core/api (Svelte side) and $core/define (definition files).
    alias: { $core: `${root}src` },
  },
  build: { target: 'es2022' },
  // Tests run in Node but modules are transformed for the browser, so Svelte runes behave as in the app.
  test: { include: ['src/**/*.test.ts'], environment: './src/test/svelte-client-env.ts' },
});
