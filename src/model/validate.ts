// Content validation for authors: every definition against its schema, every cross-reference, required English
// strings (a layer's header fields too), the learn-more links in the locale files and the presence of each scene's
// component. Runs in dev (errors go to the Vite overlay and the console),
// in `npm run check:content` and in the tests. Never in the production bundle.
import type { z } from 'zod';
import * as S from './schema';
import { FACT, FACTS } from './packet';
import { groupSpec, isLink } from './resolve';
import { inEra, nowEra, type Content } from './registry';
import { FALLBACK, type Json, type Pack } from './strings';

export interface Problem { file: string; where: string; message: string }

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/** "Did you mean …? Known: …" for an unknown id. */
function suggest(bad: string, known: string[]) {
  const best = known.map((k) => [k, distance(bad, k)] as const).sort((x, y) => x[1] - y[1])[0];
  const mean = best && best[1] <= Math.max(2, bad.length / 3) ? ` Did you mean "${best[0]}"?` : '';
  return `${mean} Known: ${known.join(', ') || '(none)'}.`;
}

export interface ValidateInput {
  content: Content;
  packs: Record<string, Pack>;
  /** Paths of the component files that exist (e.g. "/content/scenes/ip-post/Scene.svelte"). */
  files: string[];
  /** The locale files as written, by path ("/content/scenes/ip-post/locales/da.json"), to check their language, their
   *  `describe`s and their learn-more links. */
  locales?: Record<string, Json>;
}

export function validate({ content: c, packs, files, locales = {} }: ValidateInput): Problem[] {
  const out: Problem[] = [];
  const add = (file: string, where: string, message: string) => out.push({ file, where, message });
  const langs = Object.keys(packs);
  const en = packs[FALLBACK]?.strings ?? {};

  const schema = <T>(file: string, s: z.ZodType<T>, v: unknown, skip: (path: PropertyKey[]) => boolean = () => false, at: PropertyKey[] = []) => {
    const r = s.safeParse(v);
    if (!r.success) for (const i of r.error.issues) if (!skip(i.path)) add(file, [...at, ...i.path].map(String).join('.').replace(/\.(\d+)/g, '[$1]'), i.message);
  };
  const strip = <T extends { id: string; file: string }>(d: T) => { const { id: _i, file: _f, ...rest } = d; return rest; };
  const ref = (file: string, where: string, kind: keyof Content, id: string | undefined, label: string) => {
    if (id !== undefined && !c[kind][id]) add(file, where, `"${id}" is not ${label}.${suggest(id, Object.keys(c[kind]))}`);
  };
  const need = (file: string, key: string) => {
    if (!(key in en)) add(file, 'strings', `missing English string "${key}" (in ${file.replace(/[^/]+$/, '')}locales/en.json)`);
  };
  const needLevelled = (file: string, key: string) => {
    if (!(key in en) && !(`${key}.kid` in en)) add(file, 'strings', `missing English string "${key}" or "${key}.kid" (in ${file.replace(/[^/]+$/, '')}locales/en.json)`);
  };
  const has = (path: string) => files.includes(path);
  /** A dive must point at a scene that explains that kind of thing. */
  const dive = (file: string, where: string, id: string | undefined, kind: 'link' | 'node' | 'layer') => {
    if (id === undefined) return;
    const s = c.scenes[id];
    if (!s) return ref(file, where, 'scenes', id, 'a scene');
    const is = s.explains ?? 'link';
    const known = Object.values(c.scenes).filter((x) => (x.explains ?? 'link') === kind).map((x) => x.id);
    if (is !== kind) add(file, where, `"${id}" explains a ${is}; this needs a scene with \`explains: '${kind}'\`. Known: ${known.join(', ') || '(none)'}.`);
  };

  for (const n of Object.values(c.nodes)) {
    schema(n.file, S.node, strip(n));
    need(n.file, `node.${n.id}.name`);
    dive(n.file, 'dive', n.dive, 'node');
    if (n.dive && n.kind !== 'device') add(n.file, 'dive', `only a device has a dive (a ${n.kind} is drawn as a group, which opens up instead).`);
  }
  for (const o of Object.values(c.owners)) {
    schema(o.file, S.owner, strip(o));
    needLevelled(o.file, `owner.${o.id}.name`);
  }
  for (const t of Object.values(c.technologies)) {
    schema(t.file, S.technology, strip(t));
    t.stack?.forEach((l, i) => ref(t.file, `stack[${i}]`, 'layers', l, 'a layer'));
    dive(t.file, 'dive', t.dive, 'link');
    need(t.file, `tech.${t.id}.name`);
  }
  /** Codes layers give themselves for the layer outside them ({inner.ethertype}). */
  const codes = new Set(Object.values(c.layers).flatMap((l) => Object.keys(l.code ?? {})));
  for (const l of Object.values(c.layers)) {
    schema(l.file, S.layer, strip(l));
    needLevelled(l.file, `layer.${l.id}.name`);
    needLevelled(l.file, `layer.${l.id}.note`);
    need(l.file, `layer.${l.id}.line`);
    const seen = new Set<string>();
    l.fields?.forEach((f, i) => {
      const where = `fields[${i}]`;
      if (seen.has(f.id)) add(l.file, where, `"${f.id}" is already a field of this layer`);
      seen.add(f.id);
      needLevelled(l.file, `layer.${l.id}.field.${f.id}.name`);
      for (const e of Object.keys(f.bitsIn ?? {})) ref(l.file, `${where}.bitsIn.${e}`, 'eras', e, 'an era');
      const tpls = [f.value, typeof f.kid === 'object' || typeof f.kid === 'string' ? f.kid : ''].flatMap((v) => (typeof v === 'string' ? [v] : [v.up, v.down]));
      for (const t of tpls) {
        if (t.startsWith('@')) { needLevelled(l.file, `layer.${l.id}.value.${t.slice(1)}`); continue; }
        for (const [, name] of t.matchAll(new RegExp(FACT, 'g'))) {
          if ((FACTS as readonly string[]).includes(name.replace(/[+-]\d+$/, ''))) continue;
          if (name.startsWith('inner.') && codes.has(name.slice(6))) continue;
          add(l.file, `${where}.value`, `"{${name}}" is not a fact.${suggest(name, [...FACTS, ...[...codes].map((k) => `inner.${k}`)])}`);
        }
      }
    });
    dive(l.file, 'dive', l.dive, 'layer');
  }
  for (const s of Object.values(c.scenes)) {
    schema(s.file, S.scene, strip(s));
    if (!has(`/content/scenes/${s.id}/Scene.svelte`)) add(s.file, 'component', `add content/scenes/${s.id}/Scene.svelte`);
    need(s.file, `scene.${s.id}.title`);
  }

  const segmentLike = (file: string, def: { hops: unknown[]; aside?: { from: string; link: string; at: string; node?: string; owner?: string }[]; entry?: Record<string, string> }, s: z.ZodType, whole: unknown) => {
    const hops = Array.isArray(def.hops) ? def.hops : [];
    hops.forEach((h, i) => {
      const item = h as Record<string, unknown>;
      schema(file, ('link' in item ? S.link : S.hop) as z.ZodType, item);
      const where = `hops[${i}]`;
      if (i % 2 === 0 && 'link' in item) add(file, where, 'expected a hop ({ at: … }) here: hops and links alternate, starting with a hop');
      if (i % 2 === 1 && !('link' in item)) add(file, where, 'expected a link ({ link: … }) here: hops and links alternate, starting with a hop');
    });
    schema(file, s, whole, (p) => p[0] === 'hops' && p.length > 1);
    for (const [i, h] of (hops as Parameters<typeof isLink>[0][]).entries()) {
      if (isLink(h)) {
        ref(file, `hops[${i}].link`, 'technologies', h.link, 'a technology');
        h.stack?.forEach((l, k) => ref(file, `hops[${i}].stack[${k}]`, 'layers', l, 'a layer'));
        if (h.dive) dive(file, `hops[${i}].dive`, h.dive, 'link');
      } else {
        ref(file, `hops[${i}]`, 'nodes', h.node ?? h.at, 'a node (set "node" if the instance id differs)');
        if (h.in) ref(file, `hops[${i}].in`, 'nodes', h.in, 'a node');
        ref(file, `hops[${i}].owner`, 'owners', h.owner, 'an owner');
      }
    }
    const ids = new Set((hops as Parameters<typeof isLink>[0][]).flatMap((h) => (isLink(h) ? [] : [h.at])));
    def.aside?.forEach((a, i) => {
      ref(file, `aside[${i}]`, 'nodes', a.node ?? a.at, 'a node');
      ref(file, `aside[${i}].link`, 'technologies', a.link, 'a technology');
      ref(file, `aside[${i}].owner`, 'owners', a.owner, 'an owner');
      if (!ids.has(a.from)) add(file, `aside[${i}].from`, `"${a.from}" is not a hop in this segment.${suggest(a.from, [...ids])}`);
    });
    for (const [g, n] of Object.entries(def.entry ?? {})) { ref(file, `entry.${g}`, 'nodes', g, 'a node'); ref(file, `entry.${g}`, 'nodes', n, 'a node'); }
  };

  // a segment's or an activity's variant (#59) stands in for its base in one era: the base is no variant and has no
  // era (it serves every era without a variant of its own), and a base has one variant an era at most
  const variants = <T extends { id: string; file: string; variantOf?: string; era?: string }>(all: Record<string, T>, kind: 'segments' | 'activities', label: string) => {
    for (const v of Object.values(all)) {
      if (v.variantOf === undefined) {
        if (v.era !== undefined) add(v.file, 'era', `only a variant has an era: "${v.id}" is a base, which serves every era without a variant of its own (set "variantOf" to make it a variant)`);
        continue;
      }
      ref(v.file, 'variantOf', kind, v.variantOf, label);
      const of = all[v.variantOf];
      if (of?.variantOf !== undefined) add(v.file, 'variantOf', `"${v.variantOf}" is itself a variant of "${of.variantOf}"; use "${of.variantOf}"`);
      if (v.era === undefined) add(v.file, 'era', `a variant is for an era; add one (${Object.keys(c.eras).join(', ')})`);
      ref(v.file, 'era', 'eras', v.era, 'an era');
      const twin = Object.values(all).find((w) => w.id < v.id && w.variantOf === v.variantOf && w.era === v.era);
      if (twin && v.era !== undefined) add(v.file, 'era', `"${twin.id}" is already the variant of "${v.variantOf}" for the era "${v.era}"`);
      // its words are its base's block for its era, which loads with the past's other words (vite.config.ts `eraBlocks`)
      const dir = v.file.replace(/[^/]+$/, '');
      const own = Object.keys(locales).find((p) => p.startsWith(`/${dir}locales/`));
      if (own) add(own.slice(1), 'strings', `a variant has no strings or links of its own: write its strings in "${v.era ?? '<era>'}": { … } and give its links "eras": ["${v.era ?? '<era>'}"], in ${all[v.variantOf]?.file.replace(/[^/]+$/, '') ?? 'its base\'s folder '}locales/`);
    }
  };
  variants(c.segments, 'segments', 'a segment');
  variants(c.activities, 'activities', 'an activity');

  for (const s of Object.values(c.segments)) {
    segmentLike(s.file, s, S.segment, strip(s));
  }
  for (const p of Object.values(c.places)) {
    segmentLike(p.file, p, S.place, strip(p));
    need(p.file, `place.${p.id}.name`);
    // a variant hangs off a place of its own; both name their way of getting online for the picker
    if (p.variantOf !== undefined) {
      ref(p.file, 'variantOf', 'places', p.variantOf, 'a place');
      const of = c.places[p.variantOf];
      if (of?.variantOf !== undefined) add(p.file, 'variantOf', `"${p.variantOf}" is itself a variant of "${of.variantOf}"; use "${of.variantOf}"`);
      need(p.file, `place.${p.id}.access`);
      if (p.picture !== undefined) add(p.file, 'picture', `a variant shows the picture of "${p.variantOf}"; give it there`);
    } else {
      if (Object.values(c.places).some((v) => v.variantOf === p.id)) need(p.file, `place.${p.id}.access`);
      // where you are, in a sentence: the time machine's "In 1995 you'd have done this at home" (#59)
      need(p.file, `place.${p.id}.where`);
      // its picture in "Where are you?": a node that stands for a place (the house)
      if (p.picture === undefined) add(p.file, 'picture', 'a place needs a picture for "Where are you?": a node of kind "place" (the house)');
      else {
        ref(p.file, 'picture', 'nodes', p.picture, 'a node');
        const n = c.nodes[p.picture];
        if (n && n.kind !== 'place') add(p.file, 'picture', `"${p.picture}" is a ${n.kind}; the picture is a node of kind "place"`);
      }
    }
    ref(p.file, 'era', 'eras', p.era, 'an era');
  }
  const now = Object.keys(c.eras).length ? nowEra(c) : undefined;
  for (const e of Object.values(c.eras)) {
    schema(e.file, S.era, strip(e));
    if (!Object.values(c.places).some((p) => (p.era ?? now) === e.id)) add(e.file, 'era', `no place is in the era "${e.id}", so the time machine can't go there`);
    need(e.file, `era.${e.id}.name`);
    needLevelled(e.file, `era.${e.id}`);
    need(e.file, `era.${e.id}.describe.kid`);
  }
  // the time machine (#59) moves within a family by era: all of it has eras or none, and at least two of them
  for (const base of Object.values(c.places).filter((p) => p.variantOf === undefined)) {
    const family = Object.values(c.places).filter((p) => p.id === base.id || p.variantOf === base.id);
    const dated = family.filter((p) => p.era !== undefined);
    if (!dated.length) continue;
    for (const p of family) if (p.era === undefined) add(p.file, 'era', `"${base.id}" and its ways of getting online have eras, so this needs one too.`);
    if (new Set(dated.map((p) => p.era)).size < 2)
      add(base.file, 'era', `every way of getting online from "${base.id}" is in the era "${dated[0].era}"; a time machine needs two eras at least (or no era at all).`);
  }

  for (const a of Object.values(c.activities)) {
    schema(a.file, S.activity, strip(a));
    // a variant's strings are its base's (the era's block first), so it only says what differs
    if (a.variantOf === undefined) {
      need(a.file, `activity.${a.id}.title`);
      needLevelled(a.file, `activity.${a.id}`);
    }
    const steps = a.route ?? [];
    const slots = (x: typeof a) => JSON.stringify((x.route ?? []).flatMap((st) => ('place' in st ? [[st.place, st.only]] : [])));
    const base = a.variantOf === undefined ? undefined : c.activities[a.variantOf];
    if (base && slots(a) !== slots(base)) add(a.file, 'route', `a variant has the same place slots as its base "${base.id}" (the reader chooses the places, the era picks the variant)`);
    // the eras this activity is resolved in: a variant's own, or every era its variants leave to the base
    const eras = a.era !== undefined ? [a.era] : Object.keys(c.eras).filter((e) => !Object.values(c.activities).some((v) => v.variantOf === a.id && v.era === e));
    steps.forEach((st, i) => {
      if ('segment' in st) {
        ref(a.file, `route[${i}].segment`, 'segments', st.segment, 'a segment');
        const of = c.segments[st.segment]?.variantOf;
        if (of !== undefined) add(a.file, `route[${i}].segment`, `"${st.segment}" is a variant of "${of}"; name "${of}" (the route's era picks the variant)`);
      } else {
        st.only?.forEach((p, k) => ref(a.file, `route[${i}].only[${k}]`, 'places', p, 'a place'));
        ref(a.file, `route[${i}].default`, 'places', st.default, 'a place');
      }
    });
    const specs = (a.groups ?? []).map(groupSpec);
    specs.forEach((g, i) => {
      const at = typeof a.groups![i] === 'string' ? `groups[${i}]` : `groups[${i}].id`;
      ref(a.file, at, 'nodes', g.id, 'a node');
      if (specs.slice(0, i).some((p) => p.id === g.id)) add(a.file, at, `"${g.id}" is listed twice`);
      if (c.nodes[g.id] && c.nodes[g.id].kind !== 'network') add(a.file, at, `"${g.id}" is a ${c.nodes[g.id].kind}; only network nodes expand`);
      // a group nests in one listed before it, so nesting can't go round in a circle
      if (g.in && !specs.slice(0, i).some((p) => p.id === g.in)) add(a.file, `groups[${i}].in`, `"${g.in}" is not a group listed before "${g.id}"`);
      // the node that draws it (#59): its own, or another network node doing the same job in this era
      if (g.node !== undefined) {
        ref(a.file, `groups[${i}].node`, 'nodes', g.node, 'a node');
        const drawn = c.nodes[g.node];
        if (drawn && drawn.kind !== 'network') add(a.file, `groups[${i}].node`, `"${g.node}" is a ${drawn.kind}; only network nodes expand`);
      }
      need(a.file, `node.${g.node ?? g.id}.inside.title`);
    });
    a.flows?.forEach((f, i) => f.stack?.forEach((l, k) => ref(a.file, `flows[${i}].stack[${k}]`, 'layers', l, 'a layer')));
    // how long it takes (#59): the one thing the reader waits for has a size, and words say how long it takes
    const kinds = (a.flows ?? []).flatMap((f, i) => f.packets.map((p, k) => ({ p, at: `flows[${i}].packets[${k}]` })));
    for (const { p, at } of kinds) {
      if (p.size !== undefined && p.dir !== 'down') add(a.file, `${at}.size`, 'only a kind going down has a size: the thing the reader waits for');
      if (p.plays !== undefined && p.size === undefined) add(a.file, `${at}.plays`, 'a kind that plays needs a size, to say how long it takes to come');
    }
    const sized = kinds.filter(({ p }) => p.size !== undefined);
    if (sized.length > 1) add(a.file, `${sized[1].at}.size`, `one kind at most has a size (the thing the reader waits for); ${sized[0].at} has one`);
    if (sized.length) {
      const key = `activity.${a.variantOf ?? a.id}`, keys = a.era !== undefined && a.variantOf !== undefined ? [`${key}.${a.era}.takes`, `${key}.takes`] : [`${key}.takes`];
      if (!keys.some((k) => k in en || `${k}.kid` in en)) add(a.file, 'strings', `it has a size, so it needs words for how long it takes: "${keys[0]}" or "${keys[0]}.kid" (in content/activities/${a.variantOf ?? a.id}/locales/en.json)`);
    }

    // every combination of places must make a well-formed chain: each part starts with a hop, and every part but the
    // last ends with the link that joins it to the next; the chain ends at the server
    const options = steps.map((st) => ('segment' in st
      ? [...new Set(eras.map((e) => inEra(c.segments, st.segment, e)))]
      : Object.values(c.places).filter((p) => !st.only || st.only.includes(p.id))));
    steps.forEach((_, i) => {
      for (const d of options[i]) {
        if (!d || !Array.isArray(d.hops) || !d.hops.length) continue;
        const endsWithLink = isLink(d.hops[d.hops.length - 1]);
        const last = i === steps.length - 1;
        if (last && endsWithLink) add(d.file, 'hops', `the last part of "${a.id}" must end with a hop (the server), not a link`);
        if (!last && !endsWithLink) add(d.file, 'hops', `it comes before another part in "${a.id}", so it must end with the link that joins them`);
      }
    });
    const groupIds = new Set(specs.map((g) => g.id));
    for (const opt of options) for (const d of opt) (d?.hops ?? []).forEach((h, k) => {
      if (!isLink(h) && h.in && !groupIds.has(h.in)) add(d.file, `hops[${k}].in`, `"${h.in}" is not one of the groups of "${a.id}" (${[...groupIds].join(', ') || 'none'})`);
    });
    // layouts may only place instances that exist somewhere in the activity's routes
    const instances = new Set<string>([...groupIds]);
    for (const opt of options) for (const d of opt) {
      for (const h of d?.hops ?? []) if (!isLink(h)) instances.add(h.at);
      for (const x of d?.aside ?? []) instances.add(x.at);
      for (const e of Object.values(d?.entry ?? {})) instances.add(e);
    }
    const checkLayout = (file: string, layout: Record<string, Record<string, { nodes?: Record<string, unknown>; owners?: Record<string, unknown>; props?: object } | undefined>> | undefined, place = false) => {
      for (const [key, byOrient] of Object.entries(layout ?? {})) {
        if (key !== 'overview' && !groupIds.has(key)) add(file, `layout.${key}`, `"${key}" is not a path scene: use "overview" or a group (${[...groupIds].join(', ')})`);
        for (const [o, l] of Object.entries(byOrient)) {
          for (const id of Object.keys(l?.nodes ?? {}))
            if (!instances.has(id)) add(file, `layout.${key}.${o}.nodes.${id}`, `"${id}" is not a hop in any route of "${a.id}".${suggest(id, [...instances])}`);
          for (const id of Object.keys(l?.owners ?? {})) ref(file, `layout.${key}.${o}.owners.${id}`, 'owners', id, 'an owner');
          if (l?.props && !(place && key === 'overview')) add(file, `layout.${key}.${o}.props`, 'prop spots belong in a place\'s overview');
        }
      }
    };
    checkLayout(a.file, a.layout);
    for (const opt of options) for (const d of opt) if (d) checkLayout(d.file, d.layout, c.places[d.id] === d);
  }

  // every spoken description is { kid, nerd }, each short (a missing level or a typo shows here, with its file); a
  // file's learn-more links are its own top-level list, not in an era's block or anyone's words
  const describes = (file: string, obj: Json, where: string[]) => {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'learnMore') { if (where.length) add(file, [...where, k].join('.'), 'links go in the file\'s own "learnMore" list; a link for some eras only lists them in its "eras"'); }
      else if (k === 'describe') schema(file, S.describeText, v, () => false, [...where, k]);
      else if (typeof v === 'object') describes(file, v, [...where, k]);
    }
  };
  for (const [path, json] of Object.entries(locales)) describes(path.slice(1), json, []);

  // a locale file is for a language there is, and its learn-more links (#4) are for its language: each a https URL,
  // a title, a level and maybe some eras
  const SHOW_LINKS = ['nodes', 'owners', 'technologies', 'layers', 'scenes', 'places', 'activities'];
  for (const [path, json] of Object.entries(locales)) {
    const file = path.slice(1), [, , kind, , , name] = path.split('/'), lang = name.replace(/\.json$/, '');
    if (!langs.includes(lang)) add(file, 'language', `"${lang}" is not a language.${suggest(lang, langs)}`);
    if (!('learnMore' in json)) continue;
    if (!SHOW_LINKS.includes(kind)) { add(file, 'learnMore', `nothing shows the links of ${kind}: only of ${SHOW_LINKS.join(', ')}`); continue; }
    schema(file, S.learnMoreList, json.learnMore, () => false, ['learnMore']);
    const links = Array.isArray(json.learnMore) ? (json.learnMore as { eras?: unknown }[]) : [];
    links.forEach((l, i) => (Array.isArray(l?.eras) ? l.eras : []).forEach((e, j) => typeof e === 'string' && ref(file, `learnMore[${i}].eras[${j}]`, 'eras', e, 'an era')));
  }

  // de-duplicate (a place shared by several activities is checked once per activity)
  const seen = new Set<string>();
  return out.filter((p) => { const k = `${p.file}|${p.where}|${p.message}`; return !seen.has(k) && !!seen.add(k); });
}

export const formatProblems = (ps: Problem[]) => ps.map((p) => `${p.file} › ${p.where}: ${p.message}`).join('\n');

/** Translation coverage per language: how many of the English strings each language has. */
export function coverage(packs: Record<string, Pack>) {
  const en = Object.keys(packs[FALLBACK]?.strings ?? {});
  return Object.entries(packs).map(([lang, p]) => ({ lang, have: en.filter((k) => k in p.strings).length, total: en.length }));
}
