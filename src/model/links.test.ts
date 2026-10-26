import { describe, expect, it } from 'vitest';
import type { LearnMore } from '../define';
import { pickLinks } from './links';
import { linksOf, loadAllPacks, loadDiveStrings, loadPack, packs } from './strings';

const link = (url: string, more: Partial<LearnMore> = {}): LearnMore => ({ url: `https://${url}`, title: url, level: 'both', lang: 'en', ...more });

describe('learn-more links (pickLinks)', () => {
  it('shows a link for every era, or only in the eras it names (#180)', () => {
    const all = [link('tcp'), link('rfc9293', { eras: ['today'] }), link('rfc793', { eras: ['1995', '2010'] })];
    const urls = (era: string) => pickLinks(all, era, 'en', 'nerd').map((l) => l.title);
    expect(urls('today')).toEqual(['tcp', 'rfc9293']);
    expect(urls('1995')).toEqual(['tcp', 'rfc793']);
    expect(urls('2010')).toEqual(['tcp', 'rfc793']);
  });

  it('picks the reader’s level and language first, keeps English nerd links, and stops at the most', () => {
    const all = [link('en-kid', { level: 'kid' }), link('en-nerd', { level: 'nerd' }), link('da', { lang: 'da' }), link('en-both')];
    expect(pickLinks(all, 'today', 'da', 'nerd').map((l) => l.title)).toEqual(['da', 'en-nerd']);
    expect(pickLinks(all, 'today', 'en', 'kid').map((l) => l.title)).toEqual(['en-kid', 'en-both']);
    expect(pickLinks(all, 'today', 'en', 'nerd', 1).map((l) => l.title)).toEqual(['en-nerd']);
  });
});

describe('learn-more links in the locale files (#201)', () => {
  const langs = (lang: string, item: string) => [...new Set(linksOf(lang, [item]).map((l) => l.lang))];

  it('load with the strings: English at once, a layer\'s and a dive scene\'s with the dive strings', async () => {
    expect(packs.en.links['node.core']?.length).toBeGreaterThan(0);
    expect(packs.en.links['layer.tcp']).toBeUndefined();
    await loadDiveStrings();
    expect(packs.en.links['layer.tcp']?.length).toBeGreaterThan(0);
  });

  it('load with their language, each tagged with it', async () => {
    expect(packs.de.links['scene.tcp-pieces']).toBeUndefined();
    await loadPack('de');
    expect(packs.de.links['scene.tcp-pieces']?.map((l) => l.lang)).toEqual(['de']);
  });

  it('are a language\'s own, then the English ones, never another language\'s', async () => {
    await loadAllPacks();
    expect(langs('de', 'scene.tcp-pieces')).toEqual(['de', 'en']);
    expect(langs('da', 'scene.tcp-pieces')).toEqual(['da', 'en']);
    expect(langs('en', 'scene.tcp-pieces')).toEqual(['en']);
    expect(langs('da', 'node.mobile-core')).toEqual(['en']);
  });

  it('are no strings', async () => {
    await loadAllPacks();
    for (const [lang, p] of Object.entries(packs)) expect(Object.keys(p.strings).filter((k) => k.includes('learnMore')), lang).toEqual([]);
  });
});
