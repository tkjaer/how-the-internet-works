// Spike 1: plain SVG + GSAP (MotionPathPlugin) + d3-zoom. No framework.
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { select } from 'd3-selection';
import 'd3-transition';
import { zoom as d3zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
import { mountChrome } from '../shared/chrome';
import '../shared/svg-scene.css';
import { applyDataI18n, onLangChange } from '../shared/i18n';
import { current, go, onRoute, startRouter } from '../shared/router';
import {
  BG, DETAIL_SCALE, labelY, PACKET_COLOUR, TECH_COLOUR, WORLD, detailRect, links, linkPath, bezier, nodes, packets,
  type DetailId, type SceneId,
} from '../shared/scene';
import { clampCam, decide, fitScene, mixes, viewportFor, type Cam, DETAILS } from '../shared/camera';
import { FIBRE, WIFI, channelRoute, fibrePulses, wifiBits, wifiRings, wifiWave } from '../shared/details';

gsap.registerPlugin(MotionPathPlugin);
startRouter();
mountChrome('SVG + GSAP + d3-zoom');

const SVGNS = 'http://www.w3.org/2000/svg';
const stage = document.getElementById('stage')!;
const pts = (p: { x: number; y: number }[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
/** Embed an artist-authored SVG file as a nested <svg> – exactly what a Figma/Inkscape export gives you. */
const icon = (svg: string, cx: number, cy: number, size: number, cls = '') =>
  svg.replace('<svg ', `<svg class="${cls}" x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" `);
const label = (key: string, x: number, y: number, size = 26, extra = '') =>
  `<text class="label" data-i18n="${key}" x="${x}" y="${y}" font-size="${size}" ${extra}></text>`;

const wifiLink = links.find((l) => l.tech === 'wifi')!;
const ap = nodes.find((n) => n.id === 'ap')!;
const phone = nodes.find((n) => n.id === 'phone')!;

stage.innerHTML = `
<svg id="svg" xmlns="${SVGNS}" width="100%" height="100%">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${BG.top}"/><stop offset="1" stop-color="${BG.bottom}"/></radialGradient>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1.6" fill="${BG.grid}"/></pattern>
    <radialGradient id="halo"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    ${Object.entries(PACKET_COLOUR).map(([k, c]) => `<radialGradient id="halo-${k}"><stop offset="0" stop-color="${c}" stop-opacity=".7"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('')}
    ${FIBRE.colours.map((c, i) => `<radialGradient id="glow-${i}"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="${c}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('')}
    <clipPath id="panel-clip"><rect x="0" y="0" width="${WORLD.w}" height="${WORLD.h}" rx="60"/></clipPath>
    <g id="parcel-request"><circle r="30" fill="url(#halo-request)"/><rect x="-13" y="-10" width="26" height="20" rx="5" fill="${PACKET_COLOUR.request}"/><path d="M-11 -7 L0 2 L11 -7" fill="none" stroke="#7a5a00" stroke-width="2.4" stroke-linecap="round"/></g>
    <g id="parcel-video"><circle r="38" fill="url(#halo-video)"/><rect x="-16" y="-16" width="32" height="32" rx="7" fill="${PACKET_COLOUR.video}"/><path d="M-5 -8 L-5 8 L8 0 Z" fill="#fff"/></g>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g id="camera">
    <g id="overview">
      <rect x="-800" y="-600" width="${WORLD.w + 1600}" height="${WORLD.h + 1200}" fill="url(#dots)" opacity=".7"/>
      <g id="links">
        ${links.map((l) => `
          <g class="link link-${l.tech}" data-detail="${l.detail ?? ''}">
            <path class="glow" d="${linkPath(l)}" stroke="${TECH_COLOUR[l.tech]}"/>
            <path class="core" id="path-${l.id}" d="${linkPath(l)}" stroke="${TECH_COLOUR[l.tech]}"/>
            ${l.tech === 'fibre' ? `<path class="light" d="${linkPath(l)}"/>` : ''}
            ${l.detail ? `<path class="hit" d="${linkPath(l)}"/>` : ''}
          </g>`).join('')}
      </g>
      <g id="radio">${[0, 1, 2].map(() => `<path class="arc" d="M-40 -60 A72 72 0 0 0 -40 60" />`).join('')}</g>
      <g id="nodes">
        ${nodes.map((n) => `<g class="node" id="node-${n.id}">${icon(n.svg, n.x, n.y, n.size)}${label(n.label, n.x, labelY(n))}</g>`).join('')}
      </g>
      <g id="link-labels">
        ${links.map((l) => { const m = bezier(l, 0.5); const off = { wifi: [-10, -58], ethernet: [0, 62], fibre: [92, 30] }[l.tech]; return label(l.label, m.x + off[0], m.y + off[1], 22, `fill="${TECH_COLOUR[l.tech]}"`); }).join('')}
      </g>
      <g id="hints">
        ${links.filter((l) => l.detail).map((l) => { const m = bezier(l, 0.5); return `<g class="hint" data-detail="${l.detail}" transform="translate(${m.x} ${m.y})"><circle class="ring" r="34"/><circle r="18" class="lens"/><path d="M12 12 L24 24" class="lens-handle"/></g>`; }).join('')}
      </g>
      <g id="packets"></g>
    </g>
    ${detailGroup('wifi', `
      ${icon(phone.svg, WIFI.phoneX, WIFI.y, 330)}
      <g id="rings"></g>
      ${icon(ap.svg, WIFI.apX, WIFI.y, 300)}
      <path id="wave-glow" class="wave-glow"/>
      <path id="wave" class="wave"/>
      <g id="bits"></g>
      ${label('wifi.bits', 815, 175, 34, 'class="label big"')}
      ${label('wifi.carrier', 815, 690, 34, `class="label big" fill="${TECH_COLOUR.wifi}"`)}
    `)}
    ${detailGroup('fibre', `
      ${label('fibre.channels', 800, 120, 38, 'class="label big"')}
      <rect class="cladding" x="${FIBRE.x0}" y="${FIBRE.y - FIBRE.cladH / 2}" width="${FIBRE.x1 - FIBRE.x0}" height="${FIBRE.cladH}" rx="${FIBRE.cladH / 2}"/>
      <rect class="core" x="${FIBRE.x0}" y="${FIBRE.y - FIBRE.coreH / 2}" width="${FIBRE.x1 - FIBRE.x0}" height="${FIBRE.coreH}" rx="${FIBRE.coreH / 2}"/>
      ${FIBRE.colours.map((c, i) => `<polyline class="route" points="${pts(channelRoute(i))}" stroke="${c}"/>`).join('')}
      ${FIBRE.channelY.map((y, i) => `
        <rect class="box" x="${FIBRE.laserX - 40}" y="${y - 32}" width="80" height="64" rx="16"/><circle cx="${FIBRE.laserX + 22}" cy="${y}" r="12" fill="${FIBRE.colours[i]}"/>
        <rect class="box" x="${FIBRE.detectorX - 34}" y="${y - 32}" width="80" height="64" rx="16"/><circle cx="${FIBRE.detectorX - 14}" cy="${y}" r="14" fill="none" stroke="${FIBRE.colours[i]}" stroke-width="6"/>`).join('')}
      <path class="prism" d="M${FIBRE.muxX - 40} ${FIBRE.y - 90} L${FIBRE.muxX + 30} ${FIBRE.y} L${FIBRE.muxX - 40} ${FIBRE.y + 90} Z"/>
      <path class="prism" d="M${FIBRE.demuxX + 40} ${FIBRE.y - 90} L${FIBRE.demuxX - 30} ${FIBRE.y} L${FIBRE.demuxX + 40} ${FIBRE.y + 90} Z"/>
      <g id="pulses"></g>
      <line class="leader" x1="600" y1="300" x2="600" y2="${FIBRE.y - 8}"/>${label('fibre.core', 600, 285, 30, 'class="label big"')}
      <line class="leader" x1="1000" y1="${FIBRE.y + FIBRE.cladH / 2 - 8}" x2="1000" y2="620"/>${label('fibre.cladding', 1000, 655, 30, 'class="label big"')}
      ${label('fibre.mux', FIBRE.muxX - 20, 790, 28, 'class="label big"')}
      ${label('fibre.demux', FIBRE.demuxX + 20, 790, 28, 'class="label big"')}
    `)}
  </g>
</svg>`;

function detailGroup(id: DetailId, body: string) {
  const r = detailRect(id);
  return `<g class="detail" id="detail-${id}" transform="translate(${r.x} ${r.y}) scale(${DETAIL_SCALE})" opacity="0">
    <g clip-path="url(#panel-clip)"><rect class="panel" width="${WORLD.w}" height="${WORLD.h}" />${body}</g>
    <rect class="panel-edge" width="${WORLD.w}" height="${WORLD.h}" rx="60"/>
  </g>`;
}


applyDataI18n(stage);
onLangChange(() => applyDataI18n(stage));

// ---------------- camera: d3-zoom drives the <g id="camera"> transform ----------------
const svg = select<SVGSVGElement, unknown>('#svg');
const camEl = document.getElementById('camera')!;
const layers = {
  overview: document.getElementById('overview')!,
  wifi: document.getElementById('detail-wifi')!,
  fibre: document.getElementById('detail-fibre')!,
} satisfies Record<SceneId, Element>;
let vp = viewportFor(stage);
let cam: Cam = fitScene(current().scene, vp);
let mix = mixes(cam, vp);
let programmatic = false;

const zoom = d3zoom<SVGSVGElement, unknown>()
  .clickDistance(8)
  .constrain((t) => { const c = clampCam({ x: t.x, y: t.y, k: t.k }, vp); return zoomIdentity.translate(c.x, c.y).scale(c.k); })
  .on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
    cam = { x: e.transform.x, y: e.transform.y, k: e.transform.k };
    camEl.setAttribute('transform', e.transform.toString());
    mix = mixes(cam, vp);
    for (const [id, el] of Object.entries(layers) as [SceneId, Element][]) {
      el.setAttribute('opacity', mix[id].toFixed(3));
      el.setAttribute('display', mix[id] > 0.002 ? 'inline' : 'none');
    }
  })
  .on('end', () => {
    if (programmatic) return;
    const next = decide(cam, vp, current().scene);
    if (next && next !== current().scene) go({ scene: next });
    else if (current().scene !== 'overview') {
      const f = fitScene(current().scene, vp);
      if (Math.abs(f.k - cam.k) / f.k > 0.01 || Math.hypot(f.x - cam.x, f.y - cam.y) > 2) flyTo(current().scene, 450);
    }
  });
svg.call(zoom).on('dblclick.zoom', null);

function flyTo(scene: SceneId, duration?: number) {
  const c = fitScene(scene, vp);
  const target = zoomIdentity.translate(c.x, c.y).scale(c.k);
  programmatic = true;
  // d3-zoom transitions use van Wijk smooth zoom (interpolateZoom) out of the box
  svg.transition().duration(duration ?? 1300).ease((t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2))
    .call(zoom.transform, target)
    .on('end interrupt', () => setTimeout(() => { programmatic = false; }));
}
svg.call(zoom.transform, zoomIdentity.translate(cam.x, cam.y).scale(cam.k));
onRoute((r) => flyTo(r.scene));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') go({ scene: 'overview' }); });
new ResizeObserver(() => { vp = viewportFor(stage); const c = fitScene(current().scene, vp); svg.call(zoom.transform, zoomIdentity.translate(c.x, c.y).scale(c.k)); }).observe(stage);
document.querySelectorAll<SVGGElement>('.link[data-detail]:not([data-detail=""])').forEach((g) =>
  g.addEventListener('click', () => { if (current().scene === 'overview') go({ scene: g.dataset.detail as DetailId }); }));

// ---------------- overview animation with GSAP ----------------
const packetLayer = document.getElementById('packets')!;
for (const spec of packets) {
  const copies = Math.ceil(spec.duration / spec.every);
  for (let i = 0; i < copies; i++) {
    const el = document.createElementNS(SVGNS, 'use');
    el.setAttribute('href', `#parcel-${spec.kind}`);
    packetLayer.append(el);
    gsap.set(el, { autoAlpha: 0 });
    const tl = gsap.timeline({ repeat: -1, delay: spec.offset + i * spec.every, repeatDelay: copies * spec.every - spec.duration });
    const seg = spec.duration / spec.route.length;
    const forward = spec.kind === 'request';
    tl.set(el, { autoAlpha: 1 });
    spec.route.forEach((id, n) => tl.to(el, {
      duration: seg, ease: n === 0 ? 'power1.in' : n === spec.route.length - 1 ? 'power1.out' : 'none',
      motionPath: { path: `#path-${id}`, align: `#path-${id}`, alignOrigin: [0.5, 0.5], start: forward ? 0 : 1, end: forward ? 1 : 0 },
    }));
    tl.set(el, { autoAlpha: 0 });
  }
}
gsap.to('.link-wifi .core', { strokeDashoffset: -40, duration: 0.8, repeat: -1, ease: 'none' });
gsap.to('.link .light', { strokeDashoffset: -266, duration: 1.1, repeat: -1, ease: 'none' });
gsap.fromTo('.hint .ring', { scale: 0.8, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 1.9, opacity: 0, duration: 1.6, repeat: -1, ease: 'power2.out' });
gsap.to('#node-router circle', { opacity: 0.25, duration: 0.18, repeat: -1, yoyo: true, repeatDelay: 0.4, stagger: { each: 0.23, from: 'random', repeat: -1, yoyo: true } });
// radio arcs radiate from the AP towards the phone
const angle = Math.atan2(wifiLink.p0.y - wifiLink.p1.y, wifiLink.p0.x - wifiLink.p1.x) * 180 / Math.PI;
document.querySelectorAll<SVGPathElement>('#radio .arc').forEach((arc, i) => {
  gsap.fromTo(arc,
    { attr: { transform: `translate(${wifiLink.p1.x + 10} ${wifiLink.p1.y - 10}) rotate(${angle + 180}) scale(0.3)` }, opacity: 0.9 },
    { attr: { transform: `translate(${wifiLink.p1.x + 10} ${wifiLink.p1.y - 10}) rotate(${angle + 180}) scale(2.2)` }, opacity: 0, duration: 2.1, repeat: -1, delay: i * 0.7, ease: 'power1.out' });
});

// ---------------- detail scenes: per-frame procedural drawing on gsap.ticker ----------------
const wave = document.getElementById('wave')!, waveGlow = document.getElementById('wave-glow')!;
const bitLayer = document.getElementById('bits')!, ringLayer = document.getElementById('rings')!, pulseLayer = document.getElementById('pulses')!;
const bitEls = new Map<number, SVGGElement>();
const rings = Array.from({ length: 4 }, () => ringLayer.appendChild(document.createElementNS(SVGNS, 'circle')));
const pulses = fibrePulses(0).map((p) => {
  const g = pulseLayer.appendChild(document.createElementNS(SVGNS, 'g'));
  g.setAttribute('class', 'pulse');
  g.innerHTML = `<circle r="46" fill="url(#glow-${p.channel})"/><polyline stroke="${p.colour}" opacity=".85"/><circle r="9" fill="#fff"/>`;
  return g;
});

gsap.ticker.add((time) => {
  if (mix.wifi > 0) {
    const d = pts(wifiWave(time));
    wave.setAttribute('d', `M${d}`);
    waveGlow.setAttribute('d', `M${d}`);
    wifiRings(time).forEach((r, i) => {
      rings[i].setAttribute('cx', String(WIFI.apX - 78)); rings[i].setAttribute('cy', String(WIFI.y - 78));
      rings[i].setAttribute('r', r.r.toFixed(1)); rings[i].setAttribute('opacity', r.alpha.toFixed(3));
    });
    const seen = new Set<number>();
    for (const b of wifiBits(time)) {
      seen.add(b.key);
      let g = bitEls.get(b.key);
      if (!g) {
        g = bitLayer.appendChild(document.createElementNS(SVGNS, 'g'));
        g.setAttribute('class', 'bit');
        const c = b.bit ? PACKET_COLOUR.request : '#8190ff';
        g.innerHTML = `<line y1="36" y2="${WIFI.y - WIFI.bitsY - (b.bit ? WIFI.ampOne : WIFI.ampZero) - 16}" stroke="${c}"/><circle r="34" fill="#0b1140" stroke="${c}"/><text fill="${c}">${b.bit}</text>`;
        bitEls.set(b.key, g);
      }
      g.setAttribute('transform', `translate(${b.x.toFixed(1)} ${WIFI.bitsY})`);
      g.setAttribute('opacity', b.alpha.toFixed(3));
    }
    for (const [k, g] of bitEls) if (!seen.has(k)) { g.remove(); bitEls.delete(k); }
  }
  if (mix.fibre > 0) {
    fibrePulses(time).forEach((p, i) => {
      const [halo, line, head] = pulses[i].children as unknown as SVGElement[];
      halo.setAttribute('cx', p.head.x.toFixed(1)); halo.setAttribute('cy', p.head.y.toFixed(1));
      head.setAttribute('cx', p.head.x.toFixed(1)); head.setAttribute('cy', p.head.y.toFixed(1));
      line.setAttribute('points', pts(p.trail));
    });
  }
});

// Expose for the evaluation script.
Object.assign(window, { __spike: { go, current, DETAILS } });
