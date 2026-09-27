// Spike 4: Three.js "2.5D" – tilted map, upright SVG tokens, bloom, and detail scenes that
// pop up out of the ground as you dive in. Labels are DOM (CSS2DRenderer) so they stay crisp.
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { mountChrome } from '../shared/chrome';
import { onLangChange, t } from '../shared/i18n';
import { createNav } from '../shared/nav';
import { fitScene, mixes, type Cam, type Viewport } from '../shared/camera';
import {
  DETAIL_SCALE, PACKET_COLOUR, TECH_COLOUR, WORLD, bezier, detailRect, links, livePackets, nodes, packetPos,
  type DetailId, type Pt, type SceneId,
} from '../shared/scene';
import { FIBRE, WIFI, channelRoute, fibrePulses, wifiBits, wifiRings, wifiWave } from '../shared/details';

const stage = document.getElementById('stage')!;
mountChrome('Three.js 2.5D');

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.append(renderer.domElement);
const labels = new CSS2DRenderer();
Object.assign(labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
stage.append(labels.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#070a24');
scene.fog = new THREE.Fog('#070a24', 1000, 4000);
const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 20000);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.55, 0.62);
composer.addPass(bloom);
composer.addPass(new OutputPass());

scene.add(new THREE.AmbientLight('#8fa0ff', 1.6));
const sun = new THREE.DirectionalLight('#ffffff', 2.2);
sun.position.set(-400, 900, 700);
scene.add(sun);

/** 2D world (x right, y down) → 3D ground (x right, z towards viewer). */
const G = (x: number, y: number, h = 0) => new THREE.Vector3(x - WORLD.w / 2, h, y - WORLD.h / 2);
const fades: { obj: THREE.Object3D; layer: SceneId }[] = [];
const lineMats: LineMaterial[] = [];

// ---------- helpers ----------
const loader = new SVGLoader();
/** Build an upright 3D token from an artist SVG (fills extruded, strokes as ribbons). */
function svgToken(svg: string, size: number) {
  const data = loader.parse(svg);
  const inner = new THREE.Group();
  let z = 0;
  for (const path of data.paths) {
    const style = path.userData!.style as { fill?: string; stroke?: string } & Parameters<typeof SVGLoader.pointsToStroke>[1];
    if (style.fill && style.fill !== 'none') {
      const geo = new THREE.ExtrudeGeometry(path.toShapes(), { depth: 4, bevelEnabled: false });
      const col = new THREE.Color().setStyle(style.fill);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, side: THREE.DoubleSide, transparent: true }));
      m.position.z = z; z += 1.5; inner.add(m);
    }
    if (style.stroke && style.stroke !== 'none') {
      for (const sub of path.subPaths) {
        const geo = SVGLoader.pointsToStroke(sub.getPoints(), style);
        if (!geo) continue;
        const col = new THREE.Color().setStyle(style.stroke);
        const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.5, side: THREE.DoubleSide, transparent: true }));
        m.position.z = z + 4.2; inner.add(m);
      }
      z += 1.5;
    }
  }
  inner.position.set(-100, -100, 0);
  const g = new THREE.Group();
  g.add(inner);
  g.scale.set(size / 200, -size / 200, size / 200);
  return g;
}
function glowMat(color: string, intensity = 2.2, opacity = 1) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, transparent: true, opacity, userData: { base: opacity } });
}
function fatLine(color: string, width: number, opacity = 1) {
  // DoubleSide: Line2 builds its quads in screen space, so a mirrored parent (y-down content) would cull them.
  const mat = new LineMaterial({ color, linewidth: width, transparent: true, opacity, worldUnits: false, side: THREE.DoubleSide });
  mat.userData.base = opacity;
  lineMats.push(mat);
  return new Line2(new LineGeometry(), mat);
}
const labelEls: HTMLElement[] = [];
function label(key: string, cls = '') {
  const el = document.createElement('div');
  const txt = el.appendChild(document.createElement('span'));
  el.className = `label3d ${cls}`;
  txt.dataset.key = key;
  txt.textContent = t(key);
  labelEls.push(txt);
  return new CSS2DObject(el);
}
onLangChange(() => labelEls.forEach((el) => (el.textContent = t(el.dataset.key!))));
function circleTexture(text: string, colour: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0b1140'; g.strokeStyle = colour; g.lineWidth = 9;
  g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = colour; g.font = '900 72px "Nunito Variable", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- overview ----------
const overview = new THREE.Group();
scene.add(overview);
fades.push({ obj: overview, layer: 'overview' });

{
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0b1036'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#2a3490'; g.beginPath(); g.arc(32, 32, 2.6, 0, Math.PI * 2); g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5000 / 40, 3500 / 40);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 3500), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  ground.rotation.x = -Math.PI / 2;
  overview.add(ground);
}
{
  const n = 900, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 6000 + Math.random() * 3000, th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.45;
    pos.set([Math.cos(th) * Math.cos(ph) * r, Math.sin(ph) * r + 200, Math.sin(th) * Math.cos(ph) * r], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#a9b8ff', size: 2, sizeAttenuation: false, fog: false })));
}

for (const n of nodes) {
  const tok = svgToken(n.svg, n.size);
  tok.position.copy(G(n.x, n.y, n.size / 2));
  overview.add(tok);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(n.size * 0.42, 40), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, userData: { base: 0.35 } }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.y = 0.45;
  shadow.position.copy(G(n.x, n.y, 0.5));
  overview.add(shadow);
  const l = label(n.label);
  if (n.labelAbove) { l.position.copy(G(n.x, n.y, n.size + 8)); l.center.set(0.5, 1); }
  else { l.position.copy(G(n.x, n.y + n.size * 0.32, 0)); l.center.set(0.5, 0); }
  overview.add(l);
}
const curves = new Map(links.map((l) => [l.id, new THREE.QuadraticBezierCurve3(G(l.p0.x, l.p0.y, 3), G(l.c.x, l.c.y, 3), G(l.p1.x, l.p1.y, 3))]));
for (const l of links) {
  const m = bezier(l, 0.5);
  if (l.tech !== 'wifi') {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curves.get(l.id)!, 64, l.tech === 'ethernet' ? 6 : 4, 12), glowMat(TECH_COLOUR[l.tech], l.tech === 'fibre' ? 2.4 : 1.1));
    overview.add(tube);
  }
  const lb = label(l.label, `tech-${l.tech}`);
  lb.position.copy(G(m.x, m.y + (l.tech === 'ethernet' ? 50 : -40), 0));
  overview.add(lb);
  if (l.detail) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(30, 36, 48), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, userData: { base: 1 } }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(G(m.x, m.y, 4));
    ring.userData.hint = true;
    overview.add(ring);
  }
}
const wifiLink = links.find((l) => l.tech === 'wifi')!, fibreLink = links.find((l) => l.tech === 'fibre')!;
const wifiDots = new THREE.InstancedMesh(new THREE.SphereGeometry(4.5, 12, 8), glowMat(TECH_COLOUR.wifi, 2.5), 18);
overview.add(wifiDots);
const arcs = [0, 1, 2].map(() => {
  const a = Math.atan2(wifiLink.p0.y - wifiLink.p1.y, wifiLink.p0.x - wifiLink.p1.x);
  const m = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 48, 1, -a - 0.95, 1.9), new THREE.MeshBasicMaterial({ color: TECH_COLOUR.wifi, transparent: true, side: THREE.DoubleSide, userData: { base: 1 } }));
  m.rotation.x = -Math.PI / 2;
  m.position.copy(G(wifiLink.p1.x + 10, wifiLink.p1.y - 10, 2));
  overview.add(m);
  return m;
});
const flash = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), glowMat('#ffffff', 4));
overview.add(flash);
const packetGeo = { request: new THREE.BoxGeometry(26, 20, 10), video: new THREE.BoxGeometry(32, 32, 12) };
const packetPool = new Map<string, THREE.Mesh>();

// ---------- detail scenes: panels that fold up out of the ground ----------
function detailPanel(id: DetailId) {
  const r = detailRect(id);
  const hinge = new THREE.Group();                         // rotates the panel up from flat
  hinge.position.copy(G(r.x, r.y + r.h, 0));  // hinge on the near edge
  const content = new THREE.Group();                       // local 1600×900, y down
  content.position.set(0, r.h, 0);
  content.scale.set(DETAIL_SCALE, -DETAIL_SCALE, DETAIL_SCALE);
  hinge.add(content);
  const edge = fatLine('#3a47a8', 3);
  const rr = new THREE.Shape();
  rr.moveTo(60, 0); rr.lineTo(1540, 0); rr.quadraticCurveTo(1600, 0, 1600, 60); rr.lineTo(1600, 840); rr.quadraticCurveTo(1600, 900, 1540, 900);
  rr.lineTo(60, 900); rr.quadraticCurveTo(0, 900, 0, 840); rr.lineTo(0, 60); rr.quadraticCurveTo(0, 0, 60, 0);
  (edge.geometry as LineGeometry).setPositions(rr.getPoints(8).flatMap((p) => [p.x, p.y, 0]));
  content.add(edge);
  const back = new THREE.Mesh(new THREE.ShapeGeometry(rr, 8), new THREE.MeshBasicMaterial({ color: '#0b1140', transparent: true, opacity: 0.94, side: THREE.DoubleSide, userData: { base: 0.94 } }));
  back.position.z = -4;
  content.add(back);
  hinge.visible = false;
  scene.add(hinge);
  fades.push({ obj: hinge, layer: id });
  return { hinge, content };
}
const at = (o: THREE.Object3D, x: number, y: number, z = 0) => { o.position.set(x, y, z); return o; };
// DOM labels have a fixed CSS size, so detail labels are counter-scaled while their panel is still small.
const detailLabels: { el: HTMLElement; id: DetailId }[] = [];
function localLabel(content: THREE.Object3D, key: string, x: number, y: number, cls = 'big') {
  const l = label(key, cls);
  detailLabels.push({ el: l.element, id: content === wifi.content ? 'wifi' : 'fibre' });
  content.add(at(l, x, y));
}

// Wi-Fi
const wifi = detailPanel('wifi');
const phone = nodes.find((n) => n.id === 'phone')!, ap = nodes.find((n) => n.id === 'ap')!;
{
  const p = svgToken(phone.svg, 330); p.scale.y *= -1; wifi.content.add(at(p, WIFI.phoneX, WIFI.y, 4));
  const a = svgToken(ap.svg, 300); a.scale.y *= -1; wifi.content.add(at(a, WIFI.apX, WIFI.y, 4));
}
const waveGlow = fatLine(TECH_COLOUR.wifi, 14, 0.18), wave = fatLine(TECH_COLOUR.wifi, 4);
(wave.material as LineMaterial).color.multiplyScalar(1.6);
wifi.content.add(at(waveGlow, 0, 0, 6), at(wave, 0, 0, 8));
const ringLines = Array.from({ length: 4 }, () => {
  const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(new THREE.Path().absarc(0, 0, 1, 0, Math.PI * 2).getPoints(64)),
    new THREE.LineBasicMaterial({ color: TECH_COLOUR.wifi, transparent: true }));
  wifi.content.add(at(l, WIFI.apX - 78, WIFI.y - 78, 2));
  return l;
});
const bitTex = { 1: circleTexture('1', PACKET_COLOUR.request), 0: circleTexture('0', '#8190ff') };
const bitPool = new Map<number, THREE.Sprite>();
localLabel(wifi.content, 'wifi.bits', 815, 175);
localLabel(wifi.content, 'wifi.carrier', 815, 690, 'big tech-wifi');

// Fibre – a real glass cylinder
const fibre = detailPanel('fibre');
{
  const len = FIBRE.x1 - FIBRE.x0;
  const clad = new THREE.Mesh(new THREE.CylinderGeometry(FIBRE.cladH / 2, FIBRE.cladH / 2, len, 48, 1, false),
    new THREE.MeshStandardMaterial({ color: '#a9b8ff', transparent: true, opacity: 0.16, roughness: 0.1, metalness: 0.2, depthWrite: false, userData: { base: 0.16 } }));
  clad.rotation.z = Math.PI / 2;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(FIBRE.coreH / 2, FIBRE.coreH / 2, len, 32, 1, false),
    new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, depthWrite: false, userData: { base: 0.12 } }));
  core.rotation.z = Math.PI / 2;
  fibre.content.add(at(clad, (FIBRE.x0 + FIBRE.x1) / 2, FIBRE.y, 0), at(core, (FIBRE.x0 + FIBRE.x1) / 2, FIBRE.y, 0));
  FIBRE.channelY.forEach((y, i) => {
    const box = () => new THREE.Mesh(new THREE.BoxGeometry(80, 64, 30), new THREE.MeshStandardMaterial({ color: '#1c2466', emissive: '#1c2466', transparent: true }));
    fibre.content.add(at(box(), FIBRE.laserX, y, 0), at(box(), FIBRE.detectorX + 6, y, 0));
    fibre.content.add(at(new THREE.Mesh(new THREE.SphereGeometry(12, 16, 12), glowMat(FIBRE.colours[i], 3)), FIBRE.laserX + 22, y, 18));
    fibre.content.add(at(new THREE.Mesh(new THREE.TorusGeometry(14, 3.5, 8, 32), glowMat(FIBRE.colours[i], 1.5)), FIBRE.detectorX - 14, y, 18));
    const route = new THREE.Line(new THREE.BufferGeometry().setFromPoints(channelRoute(i).map((p) => new THREE.Vector3(p.x, p.y, 0))),
      new THREE.LineBasicMaterial({ color: FIBRE.colours[i], transparent: true, opacity: 0.25, userData: { base: 0.25 } }));
    fibre.content.add(route);
  });
  for (const [x, flip] of [[FIBRE.muxX - 10, 1], [FIBRE.demuxX + 10, -1]] as const) {
    const prism = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 70, 3), new THREE.MeshStandardMaterial({ color: '#a9b8ff', emissive: '#3a47a8', transparent: true, opacity: 0.5, userData: { base: 0.5 } }));
    prism.rotation.x = Math.PI / 2;
    prism.rotation.y = flip > 0 ? Math.PI / 2 : -Math.PI / 2;
    fibre.content.add(at(prism, x, FIBRE.y, 0));
  }
}
const pulseMeshes = fibrePulses(0).map((p) => {
  const head = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 12), glowMat(p.colour, 4));
  const trail = fatLine(p.colour, 5);
  (trail.material as LineMaterial).color.multiplyScalar(2);
  fibre.content.add(head, at(trail, 0, 0, 0));
  return { head, trail };
});
localLabel(fibre.content, 'fibre.channels', 800, 120);
localLabel(fibre.content, 'fibre.core', 600, 285);
localLabel(fibre.content, 'fibre.cladding', 1000, 655);
localLabel(fibre.content, 'fibre.mux', FIBRE.muxX - 20, 790);
localLabel(fibre.content, 'fibre.demux', FIBRE.demuxX + 20, 790);

const style = document.createElement('style');
style.textContent = `
  /* CSS2DRenderer positions via transform only; in RTL an unanchored absolute box would start at the right edge */
  .label3d span { display: inline-block; transform-origin: 50% 50%; }
  .label3d { left: 0; top: 0; font-family: var(--font); font-weight: 800; font-size: 14px; color: #eef1ff; white-space: nowrap;
    text-shadow: 0 0 3px #070a24, 0 0 3px #070a24, 0 1px 6px #070a24; transition: opacity .2s; }
  .label3d.big { font-size: 17px; }
  .label3d.tech-wifi { color: ${TECH_COLOUR.wifi}; } .label3d.tech-ethernet { color: ${TECH_COLOUR.ethernet}; } .label3d.tech-fibre { color: ${TECH_COLOUR.fibre}; }
  @media (max-width: 700px) { .label3d { font-size: 11px; } .label3d.big { font-size: 13px; } }
`;
document.head.append(style);

// ---------- camera: shared 2D camera → tilted 3D pose ----------
let mix: Record<SceneId, number> = { overview: 1, wifi: 0, fibre: 0 };
let vpNow: Viewport | null = null;
const tmp = new THREE.Vector3();

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  labels.setSize(w, h);
  bloom.resolution.set(w, h);
  camera.aspect = w / h;
  lineMats.forEach((m) => m.resolution.set(w, h));
}
resize();
new ResizeObserver(resize).observe(stage);

function applyCam(c: Cam, vp: Viewport) {
  vpNow = vp;
  mix = mixes(c, vp);
  const dive = Math.max(mix.wifi, mix.fibre);
  const areaY = vp.top + (vp.h - vp.top - vp.bottom) / 2;
  const cx = (vp.w / 2 - c.x) / c.k, cy = (areaY - c.y) / c.k;
  const visW = vp.w / c.k;
  const elev = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(52, 4, dive));
  // as a panel stands up, aim at its upright plane (near edge of its footprint)
  const target = G(cx, cy + dive * WORLD.h * DETAIL_SCALE / 2, THREE.MathUtils.lerp(0, 45, dive));
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  const dist = visW / 2 / Math.tan(hfov / 2);
  camera.position.set(target.x, target.y + Math.sin(elev) * dist, target.z + Math.cos(elev) * dist);
  camera.lookAt(target);
  camera.near = dist * 0.02; camera.far = Math.max(dist * 40, 20000);
  camera.setViewOffset(vp.w, vp.h, 0, (vp.bottom - vp.top) / 2, vp.w, vp.h);
  camera.updateProjectionMatrix();
  (scene.fog as THREE.Fog).near = dist * 1.2;
  (scene.fog as THREE.Fog).far = dist * 3.5;
  for (const { obj, layer } of fades) {
    const a = mix[layer];
    obj.visible = a > 0.002;
    if (!obj.visible) continue;
    if (layer !== 'overview') (obj as THREE.Group).rotation.x = -(1 - a) * Math.PI / 2;
    obj.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (mat && 'opacity' in mat) { mat.transparent = true; mat.opacity = (mat.userData.base ?? 1) * a; }
      if (o instanceof CSS2DObject) o.element.style.opacity = String(a);
    });
  }
  for (const { el, id } of detailLabels) {
    const s = Math.min(1, c.k / fitScene(id, vp).k);
    (el.firstChild as HTMLElement).style.transform = `scale(${s.toFixed(3)})`;
  }
}

// Tap → raycast onto the ground plane → world coords → shared hit-test.
const ray = new THREE.Raycaster(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const toWorld = (sx: number, sy: number): Pt | null => {
  ray.setFromCamera(new THREE.Vector2((sx / stage.clientWidth) * 2 - 1, -(sy / stage.clientHeight) * 2 + 1), camera);
  const hit = ray.ray.intersectPlane(ground, tmp);
  return hit ? { x: hit.x + WORLD.w / 2, y: hit.z + WORLD.h / 2 } : null;
};
const nav = createNav(stage, applyCam, { toWorld });

// ---------- per-frame ----------
const m4 = new THREE.Matrix4();
renderer.setAnimationLoop(() => {
  const time = performance.now() / 1000;
  if (mix.overview > 0) {
    for (let i = 0; i < 18; i++) {
      const p = curves.get(wifiLink.id)!.getPoint((i + (time / 0.8) % 1) / 18);
      wifiDots.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z));
    }
    wifiDots.instanceMatrix.needsUpdate = true;
    arcs.forEach((a, i) => {
      const f = (time / 2.1 + i / 3) % 1;
      a.scale.setScalar(72 * (0.3 + 1.9 * f));
      (a.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - f) * mix.overview;
    });
    flash.position.copy(curves.get(fibreLink.id)!.getPoint((time / 1.1) % 1)).setY(5);
    overview.children.forEach((o) => {
      if (!o.userData.hint) return;
      const f = (time / 1.6) % 1;
      o.scale.setScalar(0.8 + 1.1 * f);
      ((o as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - f) * mix.overview;
    });
    const seen = new Set<string>();
    for (const p of livePackets(time)) {
      const pos = packetPos(p.spec, p.age);
      if (!pos) continue;
      seen.add(p.id);
      let m = packetPool.get(p.id);
      if (!m) {
        m = new THREE.Mesh(packetGeo[p.spec.kind], glowMat(PACKET_COLOUR[p.spec.kind], 1.6));
        overview.add(m);
        packetPool.set(p.id, m);
      }
      m.position.copy(G(pos.x, pos.y, 22 + Math.sin(time * 6 + pos.x * 0.02) * 3));
      m.rotation.y = time * 1.5;
      (m.material as THREE.MeshStandardMaterial).opacity = mix.overview;
    }
    for (const [id, m] of packetPool) if (!seen.has(id)) { overview.remove(m); (m.material as THREE.Material).dispose(); packetPool.delete(id); }
  }
  if (mix.wifi > 0) {
    const w = wifiWave(time).flatMap((p) => [p.x, p.y, 0]);
    (wave.geometry as LineGeometry).setPositions(w);
    (waveGlow.geometry as LineGeometry).setPositions(w);
    wifiRings(time, 4, 2.4, 300).forEach((r, i) => {
      ringLines[i].scale.setScalar(r.r);
      (ringLines[i].material as THREE.LineBasicMaterial).opacity = r.alpha * mix.wifi;
    });
    const seen = new Set<number>();
    for (const b of wifiBits(time)) {
      seen.add(b.key);
      let s = bitPool.get(b.key);
      if (!s) {
        s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bitTex[b.bit as 0 | 1], transparent: true }));
        s.scale.set(70, -70, 1);
        wifi.content.add(s);
        bitPool.set(b.key, s);
      }
      s.position.set(b.x, WIFI.bitsY, 10);
      s.material.opacity = b.alpha * mix.wifi;
    }
    for (const [k, s] of bitPool) if (!seen.has(k)) { wifi.content.remove(s); s.material.dispose(); bitPool.delete(k); }
  }
  if (mix.fibre > 0) {
    fibrePulses(time).forEach((p, i) => {
      pulseMeshes[i].head.position.set(p.head.x, p.head.y, 0);
      (pulseMeshes[i].trail.geometry as LineGeometry).setPositions(p.trail.flatMap((q) => [q.x, q.y, 0]));
    });
  }
  if (vpNow) composer.render();
  labels.render(scene, camera);
});

Object.assign(window, { __spike: { renderer, scene, nav } });
