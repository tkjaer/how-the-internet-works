import { beforeAll, describe, expect, it } from 'vitest';
import { layerKeys } from './describe';
import { resolveRoute } from './resolve';
import { layerCtx } from './stack';
import { firstOf, loadPack, lookupLevel, packs } from './strings';
import type { SceneRef } from './tree';

const home = resolveRoute({ activity: 'watch-video', places: ['home'] });
const street = resolveRoute({ activity: 'watch-video', places: ['on-the-go'] });
const link = (r: typeof home, id: string) => r.links.find((l) => l.id === id)!;

describe('addresses', () => {
  it('rewrites the source at the home NAT', () => {
    const inside = layerCtx(home, link(home, 'ap-router'), 'video', 'request', 'up', 'simple');
    expect([inside.src, inside.dst]).toEqual(['192.168.1.23', '198.51.100.20']);
    expect(inside.nat).toEqual({ inside: '192.168.1.23', outside: '203.0.113.7', insidePort: 51034, outsidePort: 61757 });
    expect([inside.sport, inside.dport]).toEqual([51034, 443]);
    const outside = layerCtx(home, link(home, 'router-cabinet'), 'video', 'request', 'up', 'simple');
    expect(outside.src).toBe('203.0.113.7');
    const back = layerCtx(home, link(home, 'phone-ap'), 'video', 'video', 'down', 'simple');
    expect([back.src, back.dst]).toEqual(['198.51.100.20', '192.168.1.23']);
  });

  it('does carrier-grade NAT in the mobile core', () => {
    const tunnel = layerCtx(street, link(street, 'cell-tower-mobile-core'), 'video', 'request', 'up', 'technical');
    expect(tunnel.src).toBe('100.64.12.7');
    expect(tunnel.nat).toEqual({ inside: '100.64.12.7', outside: '192.0.2.44', insidePort: 51034, outsidePort: 20517 });
    const out = layerCtx(street, link(street, 'mobile-core-core'), 'video', 'request', 'up', 'technical');
    expect([out.src, out.sport]).toEqual(['192.0.2.44', 20517]);
    const back = layerCtx(street, link(street, 'mobile-core-core'), 'video', 'video', 'down', 'technical');
    expect([back.dst, back.dport, back.sport]).toEqual(['192.0.2.44', 20517, 443]);
  });

  it('knows when the next hop only switches a label (#134)', () => {
    const at = (l: string, dir: 'up' | 'down') => layerCtx(home, link(home, l), 'video', 'request', dir, 'technical').switched;
    expect(at('bng-core', 'up')).toBe(true);
    expect(at('core-border', 'down')).toBe(true);
    // the edges push and pop: they read the packet
    expect(at('olt-bng', 'up')).toBe(false);
    expect(at('core-border', 'up')).toBe(false);
    expect(at('phone-ap', 'up')).toBe(false);
  });

  it('looks up a label-switching router’s own role text before the router’s', () => {
    const keys = (hop: string) => layerKeys(home, { kind: 'layer', dive: 'ip-post', at: { hop, layer: 'ip' } } as SceneRef);
    expect(keys('core').slice(0, 3)).toEqual(['scene.ip-post.ip.at.core', 'scene.ip-post.ip.role.switched', 'scene.ip-post.ip.role.router']);
    expect(keys('border')).not.toContain('scene.ip-post.role.switched');
  });
});

describe('link frames (#132)', () => {
  const ids = (c: ReturnType<typeof layerCtx>) => [c.frame.src.id, c.frame.dst.id, c.next?.id ?? null];
  const ctx = (r: typeof home, l: string, dir: 'up' | 'down') => layerCtx(r, link(r, l), 'video', 'request', dir, 'technical');

  it('passes a frame through bridges with the MACs of the hops at either end', () => {
    expect(ids(ctx(home, 'phone-ap', 'up'))).toEqual(['phone', 'router', 'router']);
    expect(ids(ctx(home, 'border-ixp', 'up'))).toEqual(['border', 'dc-router', 'dc-router']);
    expect(ids(ctx(home, 'cabinet-olt', 'up'))).toEqual(['router', 'bng', 'bng']);
  });

  it('names the next hop on the outgoing link, the way the packet goes (what a router ARPs for)', () => {
    expect(ids(ctx(home, 'ap-router', 'up'))).toEqual(['phone', 'router', 'bng']);
    expect(ids(ctx(home, 'router-cabinet', 'down'))).toEqual(['bng', 'router', 'phone']);
    expect(ctx(home, 'rack-switch-cdn', 'up').next).toBeNull();
  });

  it('ends a frame at a tunnel end, and has no MACs on a phone line', () => {
    expect(ctx(street, 'phone-cell-tower', 'up').frame.dst.id).toBe('cell-tower');
    expect(ctx(home, 'phone-ap', 'up').macs).toBe(true);
    const dialup = resolveRoute({ activity: 'watch-video', places: ['home-dialup'] });
    expect(ctx(dialup, 'pc-exchange', 'up').macs).toBe(false);
  });
});

describe('strings', () => {
  beforeAll(() => loadPack('da'));
  it('loads languages other than English on demand', async () => {
    expect(packs.en.strings['node.phone.name']).toBe('Phone');
    await loadPack('da');
    expect(Object.keys(packs.da.strings).length).toBeGreaterThan(100);
  });
  it('falls back level → level-less → English', () => {
    expect(lookupLevel('da', 'node.phone.name', 'simple')).toBe('Telefon');
    expect(lookupLevel('da', 'layer.tcp.name', 'technical')).toBeTruthy();
    const untranslated = { ...packs, da: { ...packs.da, strings: {} } };
    expect(lookupLevel('da', 'node.cabinet.simple', 'simple', untranslated)).toBe(lookupLevel('en', 'node.cabinet.simple', 'simple'));
  });
  it('prefers the most specific source', () => {
    expect(firstOf('en', ['place.on-the-go.stop.phone', 'activity.watch-video.stop.phone'], 'simple')).toContain('even out here');
    expect(firstOf('en', ['place.home.stop.phone', 'activity.watch-video.stop.phone'], 'simple')).toContain('cat video');
  });
});
