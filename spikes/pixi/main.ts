// Spike 3: PixiJS v8 (WebGL 2D). Same data, same SVG icons (parsed into Pixi Graphics), GPU glow.
import { Application, Container, Graphics, GraphicsContext, Sprite, Text, TextStyle, Texture, TilingSprite } from 'pixi.js';
import { AdvancedBloomFilter } from 'pixi-filters';
import { mountChrome } from '../shared/chrome';
import { dir, getLang, onLangChange, t } from '../shared/i18n';
import { createNav } from '../shared/nav';
import { mixes, type Cam } from '../shared/camera';
import {
  DETAIL_SCALE, PACKET_COLOUR, TECH_COLOUR, WORLD, bezier, detailRect, labelY, links, livePackets, nodes, packetPos,
  type DetailId, type SceneId, type SceneLink,
} from '../shared/scene';
import { FIBRE, WIFI, channelRoute, fibrePulses, wifiBits, wifiRings, wifiWave } from '../shared/details';

const FONT = ['Nunito Variable', 'Noto Sans Arabic Variable', 'system-ui', 'sans-serif'];
const stage = document.getElementById('stage')!;
stage.style.background = 'radial-gradient(ellipse at 50% 35%, #161c52, #070a24 80%)';
mountChrome('PixiJS (WebGL 2D)');

// Canvas text needs fonts loaded *before* rasterising, including the Arabic face.
async function loadFonts() {
  await Promise.all([
    document.fonts.load('800 26px "Nunito Variable"'),
    document.fonts.load('800 26px "Noto Sans Arabic Variable"', 'عربي'),
  ]);
}
await loadFonts();

const app = new Application();
await app.init({
  resizeTo: stage, antialias: true, backgroundAlpha: 0, autoDensity: true,
  resolution: Math.min(window.devicePixelRatio, 2), preference: 'webgl',
});
stage.append(app.canvas);

// ---------- helpers ----------
function radial(size: number, stops: [number, string][]) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return Texture.from(c);
}
const HALO = radial(128, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]);
const halo = (tint: string, size: number) => {
  const s = new Sprite(HALO);
  s.anchor.set(0.5); s.width = s.height = size; s.tint = tint; s.blendMode = 'add';
  return s;
};
const texts: Text[] = [];
const labelStyle = (size: number, fill = '#eef1ff') => new TextStyle({
  fontFamily: FONT, fontWeight: '800', fontSize: size, fill, align: 'center',
  stroke: { color: '#070a24', width: size * 0.3, join: 'round' },
});
function label(key: string, x: number, y: number, size = 26, fill?: string) {
  const tx = new Text({ text: t(key), style: labelStyle(size, fill), anchor: { x: 0.5, y: 0.78 } });
  tx.position.set(x, y);
  tx.label = key;
  texts.push(tx);
  return tx;
}
function strokeQuad(g: Graphics, l: SceneLink) {
  return g.moveTo(l.p0.x, l.p0.y).quadraticCurveTo(l.c.x, l.c.y, l.p1.x, l.p1.y);
}
const bloom = () => {
  const f = new AdvancedBloomFilter({ threshold: 0.2, bloomScale: 1.1, brightness: 1.05, blur: 8, quality: 5 });
  f.padding = 48; // the glow extends past the content bounds
  return f;
};

// ---------- scene graph ----------
const sky = new Container();
const world = new Container();
app.stage.addChild(sky, world);

const stars = Array.from({ length: 160 }, () => {
  const s = halo('#a9b8ff', 4 + Math.random() * 8);
  s.position.set(Math.random() * 3000 - 500, Math.random() * 2000 - 400);
  (s as Sprite & { tw: number }).tw = Math.random() * Math.PI * 2;
  sky.addChild(s);
  return s as Sprite & { tw: number };
});

// Overview
const overview = new Container();
world.addChild(overview);
const dotCanvas = document.createElement('canvas');
dotCanvas.width = dotCanvas.height = 40;
{ const g = dotCanvas.getContext('2d')!; g.fillStyle = '#26307a'; g.beginPath(); g.arc(20, 20, 1.6, 0, Math.PI * 2); g.fill(); }
const grid = new TilingSprite({ texture: Texture.from(dotCanvas), width: WORLD.w + 1600, height: WORLD.h + 1200 });
grid.position.set(-800, -600); grid.alpha = 0.7;
overview.addChild(grid);

const fx = new Container();              // glowing things get GPU bloom
fx.filters = [bloom()];
const linkStatic = new Graphics();
for (const l of links) {
  const col = TECH_COLOUR[l.tech];
  if (l.tech === 'wifi') continue;
  strokeQuad(linkStatic, l).stroke({ width: 26, color: col, alpha: 0.14, cap: 'round' });
  strokeQuad(linkStatic, l).stroke({ width: l.tech === 'ethernet' ? 12 : 7, color: col, alpha: l.tech === 'fibre' ? 0.8 : 1, cap: 'round' });
}
const linkAnim = new Graphics();
const arcs = new Graphics();
fx.addChild(linkStatic, linkAnim, arcs);
overview.addChild(fx);

for (const n of nodes) {
  const g = new Graphics().svg(n.svg);   // artist SVG → Pixi vector graphics
  g.pivot.set(100, 100);
  g.scale.set(n.size / 200);
  g.position.set(n.x, n.y);
  overview.addChild(g, label(n.label, n.x, labelY(n)));
}
const labelOff = { wifi: [-10, -58], ethernet: [0, 62], fibre: [92, 30] } as const;
for (const l of links) {
  const m = bezier(l, 0.5);
  overview.addChild(label(l.label, m.x + labelOff[l.tech][0], m.y + labelOff[l.tech][1], 22, TECH_COLOUR[l.tech]));
}
const hints = links.filter((l) => l.detail).map((l) => {
  const m = bezier(l, 0.5);
  const c = new Container();
  c.position.set(m.x, m.y);
  const ring = new Graphics().circle(0, 0, 34).stroke({ width: 3, color: '#ffffff' });
  const lens = new Graphics().circle(0, 0, 18).fill({ color: '#070a24', alpha: 0.55 }).stroke({ width: 4, color: '#ffffff' })
    .moveTo(12, 12).lineTo(24, 24).stroke({ width: 6, color: '#ffffff', cap: 'round' });
  c.addChild(ring, lens);
  overview.addChild(c);
  return ring;
});

const parcelCtx = {
  request: new GraphicsContext().roundRect(-13, -10, 26, 20, 5).fill(PACKET_COLOUR.request)
    .moveTo(-11, -7).lineTo(0, 2).lineTo(11, -7).stroke({ width: 2.4, color: '#7a5a00', cap: 'round' }),
  video: new GraphicsContext().roundRect(-16, -16, 32, 32, 7).fill(PACKET_COLOUR.video)
    .poly([-5, -8, -5, 8, 8, 0]).fill('#ffffff'),
};
const packetLayer = new Container();
overview.addChild(packetLayer);
const packetPool = new Map<string, Container>();

// Detail scenes – nested containers at 1/10 scale, exactly like the SVG spikes.
function detailContainer(id: DetailId) {
  const r = detailRect(id);
  const c = new Container();
  c.position.set(r.x, r.y);
  c.scale.set(DETAIL_SCALE);
  const mask = new Graphics().roundRect(0, 0, WORLD.w, WORLD.h, 60).fill('#ffffff');
  const body = new Container();
  body.mask = mask;
  const panel = new Graphics().rect(0, 0, WORLD.w, WORLD.h).fill('#0b1140');
  body.addChild(panel);
  const edge = new Graphics().roundRect(0, 0, WORLD.w, WORLD.h, 60).stroke({ width: 6, color: '#3a47a8' });
  c.addChild(mask, body, edge);
  c.visible = false;
  world.addChild(c);
  return { c, body };
}
function iconAt(svg: string, x: number, y: number, size: number) {
  const g = new Graphics().svg(svg);
  g.pivot.set(100, 100); g.scale.set(size / 200); g.position.set(x, y);
  return g;
}

// Wi-Fi detail
const wifi = detailContainer('wifi');
const phone = nodes.find((n) => n.id === 'phone')!, ap = nodes.find((n) => n.id === 'ap')!;
const rings = new Graphics();
const waveFx = new Container();
waveFx.filters = [bloom()];
const wave = new Graphics();
waveFx.addChild(wave);
const bitLayer = new Container();
wifi.body.addChild(iconAt(phone.svg, WIFI.phoneX, WIFI.y, 330), rings, iconAt(ap.svg, WIFI.apX, WIFI.y, 300), waveFx, bitLayer,
  label('wifi.bits', 815, 175, 34), label('wifi.carrier', 815, 690, 34, TECH_COLOUR.wifi));
const bitPool = new Map<number, Container>();
const bitStyle = (fill: string) => new TextStyle({ fontFamily: FONT, fontWeight: '900', fontSize: 40, fill });

// Fibre detail
const fibre = detailContainer('fibre');
const fstatic = new Graphics()
  .roundRect(FIBRE.x0, FIBRE.y - FIBRE.cladH / 2, FIBRE.x1 - FIBRE.x0, FIBRE.cladH, FIBRE.cladH / 2)
  .fill({ color: '#a9b8ff', alpha: 0.1 }).stroke({ width: 4, color: '#a9b8ff', alpha: 0.45 })
  .roundRect(FIBRE.x0, FIBRE.y - FIBRE.coreH / 2, FIBRE.x1 - FIBRE.x0, FIBRE.coreH, FIBRE.coreH / 2)
  .fill({ color: '#ffffff', alpha: 0.06 }).stroke({ width: 3, color: '#ffffff', alpha: 0.4 });
FIBRE.colours.forEach((c, i) => fstatic.poly(channelRoute(i).flatMap((p) => [p.x, p.y]), false).stroke({ width: 3, color: c, alpha: 0.18, join: 'round' }));
FIBRE.channelY.forEach((y, i) => {
  fstatic.roundRect(FIBRE.laserX - 40, y - 32, 80, 64, 16).fill('#1c2466').stroke({ width: 4, color: '#a9b8ff' })
    .circle(FIBRE.laserX + 22, y, 12).fill(FIBRE.colours[i])
    .roundRect(FIBRE.detectorX - 34, y - 32, 80, 64, 16).fill('#1c2466').stroke({ width: 4, color: '#a9b8ff' })
    .circle(FIBRE.detectorX - 14, y, 14).stroke({ width: 6, color: FIBRE.colours[i] });
});
fstatic.poly([FIBRE.muxX - 40, FIBRE.y - 90, FIBRE.muxX + 30, FIBRE.y, FIBRE.muxX - 40, FIBRE.y + 90]).fill({ color: '#a9b8ff', alpha: 0.18 }).stroke({ width: 5, color: '#eef1ff', join: 'round' })
  .poly([FIBRE.demuxX + 40, FIBRE.y - 90, FIBRE.demuxX - 30, FIBRE.y, FIBRE.demuxX + 40, FIBRE.y + 90]).fill({ color: '#a9b8ff', alpha: 0.18 }).stroke({ width: 5, color: '#eef1ff', join: 'round' });
for (let y = 300; y < FIBRE.y - 8; y += 12) fstatic.moveTo(600, y).lineTo(600, Math.min(y + 6, FIBRE.y - 8));
for (let y = FIBRE.y + FIBRE.cladH / 2 - 8; y < 620; y += 12) fstatic.moveTo(1000, y).lineTo(1000, Math.min(y + 6, 620));
fstatic.stroke({ width: 3, color: '#a9b8ff' });
const pulseFx = new Container();
pulseFx.filters = [bloom()];
const pulseG = new Graphics();
pulseG.blendMode = 'add';
const pulseHalos = fibrePulses(0).map((p) => halo(p.colour, 110));
pulseFx.addChild(...pulseHalos, pulseG);
fibre.body.addChild(fstatic, pulseFx,
  label('fibre.channels', 800, 120, 38), label('fibre.core', 600, 285, 30), label('fibre.cladding', 1000, 655, 30),
  label('fibre.mux', FIBRE.muxX - 20, 790, 28), label('fibre.demux', FIBRE.demuxX + 20, 790, 28));

// ---------- i18n: canvas text must be re-rasterised on language change ----------
onLangChange(async () => {
  await loadFonts();
  for (const tx of texts) tx.text = t(tx.label);
  void getLang(); void dir();
});

// ---------- camera ----------
let mix: Record<SceneId, number> = { overview: 1, wifi: 0, fibre: 0 };
let camK = 1;
const layers = { overview, wifi: wifi.c, fibre: fibre.c };
const nav = createNav(stage, (cam: Cam, vp) => {
  world.position.set(cam.x, cam.y);
  world.scale.set(cam.k);
  sky.position.set(cam.x * 0.04 - 200, cam.y * 0.04 - 100);
  camK = cam.k;
  mix = mixes(cam, vp);
  for (const [id, c] of Object.entries(layers) as [SceneId, Container][]) {
    c.alpha = mix[id];
    c.visible = mix[id] > 0.002;
  }
});
// Text is a bitmap: when the camera settles, re-rasterise visible labels at the on-screen scale to keep them crisp.
function sharpenText() {
  const dpr = app.renderer.resolution;
  for (const tx of texts) {
    let s = camK;
    for (let p = tx.parent; p && p !== world; p = p.parent) s *= p.scale.x;
    const res = Math.min(4, Math.max(1, s * dpr));
    if (Math.abs(tx.resolution - res) > 0.25) tx.resolution = res;
  }
}
nav.onSettle.add(sharpenText);
sharpenText();

// ---------- per-frame animation ----------
const wifiLink = links.find((l) => l.tech === 'wifi')!;
const fibreLink = links.find((l) => l.tech === 'fibre')!;
const arcAngle = Math.atan2(wifiLink.p0.y - wifiLink.p1.y, wifiLink.p0.x - wifiLink.p1.x);

app.ticker.add(() => {
  const time = performance.now() / 1000;
  for (const s of stars) s.alpha = 0.25 + 0.35 * Math.sin(time * 1.3 + s.tw);

  if (mix.overview > 0) {
    linkAnim.clear();
    // Wi-Fi: travelling dots
    for (let i = 0; i < 18; i++) {
      const tt = ((i + (time / 0.8) % 1) / 18);
      const p = bezier(wifiLink, tt);
      linkAnim.circle(p.x, p.y, 4.5);
    }
    linkAnim.fill(TECH_COLOUR.wifi);
    // Fibre: light flashes
    for (let i = 0; i < 2; i++) {
      const a = ((time / 1.1 + i / 2) % 1);
      const p0 = bezier(fibreLink, a), p1 = bezier(fibreLink, Math.min(1, a + 0.1));
      linkAnim.moveTo(p0.x, p0.y).lineTo(p1.x, p1.y);
    }
    linkAnim.stroke({ width: 4, color: '#ffffff', cap: 'round' });
    // radio arcs from the AP towards the phone
    arcs.clear();
    for (let i = 0; i < 3; i++) {
      const f = (time / 2.1 + i / 3) % 1;
      const r = 72 * (0.3 + 1.9 * f);
      const cx = wifiLink.p1.x + 10, cy = wifiLink.p1.y - 10;
      arcs.arc(cx, cy, r, arcAngle - 0.95, arcAngle + 0.95).stroke({ width: 3.5, color: TECH_COLOUR.wifi, alpha: 0.9 * (1 - f), cap: 'round' });
    }
    hints.forEach((h) => { const f = (time / 1.6) % 1; h.scale.set(0.8 + 1.1 * f); h.alpha = 0.9 * (1 - f); });

    const seen = new Set<string>();
    for (const p of livePackets(time)) {
      const pos = packetPos(p.spec, p.age);
      if (!pos) continue;
      seen.add(p.id);
      let c = packetPool.get(p.id);
      if (!c) {
        c = new Container();
        c.addChild(halo(PACKET_COLOUR[p.spec.kind], p.spec.kind === 'video' ? 90 : 70), new Graphics(parcelCtx[p.spec.kind]));
        packetLayer.addChild(c);
        packetPool.set(p.id, c);
      }
      c.position.set(pos.x, pos.y);
    }
    for (const [id, c] of packetPool) if (!seen.has(id)) { c.destroy({ children: true }); packetPool.delete(id); }
  }

  if (mix.wifi > 0) {
    const w = wifiWave(time);
    wave.clear();
    wave.poly(w.flatMap((p) => [p.x, p.y]), false).stroke({ width: 30, color: TECH_COLOUR.wifi, alpha: 0.15, join: 'round' });
    wave.poly(w.flatMap((p) => [p.x, p.y]), false).stroke({ width: 7, color: TECH_COLOUR.wifi, join: 'round' });
    rings.clear();
    for (const r of wifiRings(time)) rings.circle(WIFI.apX - 78, WIFI.y - 78, r.r).stroke({ width: 5, color: TECH_COLOUR.wifi, alpha: r.alpha });
    const seen = new Set<number>();
    for (const b of wifiBits(time)) {
      seen.add(b.key);
      let c = bitPool.get(b.key);
      if (!c) {
        const col = b.bit ? PACKET_COLOUR.request : '#8190ff';
        c = new Container();
        const g = new Graphics();
        for (let y = 36; y < WIFI.y - WIFI.bitsY - (b.bit ? WIFI.ampOne : WIFI.ampZero) - 16; y += 12) g.moveTo(0, y).lineTo(0, y + 4);
        g.stroke({ width: 3, color: col, alpha: 0.6 }).circle(0, 0, 34).fill('#0b1140').stroke({ width: 5, color: col });
        const tx = new Text({ text: String(b.bit), style: bitStyle(col), anchor: 0.5, resolution: 2 });
        c.addChild(g, tx);
        bitLayer.addChild(c);
        bitPool.set(b.key, c);
      }
      c.position.set(b.x, WIFI.bitsY);
      c.alpha = b.alpha;
    }
    for (const [k, c] of bitPool) if (!seen.has(k)) { c.destroy({ children: true }); bitPool.delete(k); }
  }

  if (mix.fibre > 0) {
    pulseG.clear();
    fibrePulses(time).forEach((p, i) => {
      pulseHalos[i].position.set(p.head.x, p.head.y);
      pulseG.poly(p.trail.flatMap((q) => [q.x, q.y]), false).stroke({ width: 12, color: p.colour, alpha: 0.9, cap: 'round', join: 'round' });
      pulseG.circle(p.head.x, p.head.y, 9).fill('#ffffff');
    });
  }
});

Object.assign(window, { __spike: { app } });
