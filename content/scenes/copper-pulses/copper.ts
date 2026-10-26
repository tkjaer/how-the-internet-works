type Orient = 'landscape' | 'portrait';
export interface Pt { x: number; y: number }

export const trackMatrix = (o: Orient) => (o === 'portrait' ? 'matrix(0 -1 1 0 0 1600)' : '');
export const toScene = (p: Pt, o: Orient): Pt => (o === 'portrait' ? { x: p.y, y: 1600 - p.x } : p);

// fixed-colour: the pairs' own insulation colours (T568), the same by day and by night
export const PAIRS = [
  { name: 'orange', colour: '#f28f5b', y: 144 },
  { name: 'green', colour: '#72b8a5', y: 194 },
  { name: 'blue', colour: '#4aa3cf', y: 244 },
  { name: 'brown', colour: '#9b6a46', y: 294 },
] as const;

export const COPPER = {
  fromX: 150,
  toX: 1450,
  nodeY: 220,
  cableX0: 300,
  cableX1: 1300,
  jacketY: 220,
  jacketH: 220,
  pairAmp: 15,
  twist: 145,
  speed: 185,
};

function smooth(t: number) { return t * t * (3 - 2 * t); }
function pathFor(pair: number, wire: 0 | 1) {
  const p = PAIRS[pair];
  const pts: Pt[] = [];
  const phase = wire ? Math.PI : 0;
  for (let i = 0; i <= 64; i++) {
    const x = COPPER.cableX0 + ((COPPER.cableX1 - COPPER.cableX0) * i) / 64;
    const y = p.y + Math.sin(((x - COPPER.cableX0) / COPPER.twist) * Math.PI * 2 + phase) * COPPER.pairAmp;
    pts.push({ x, y });
  }
  return 'M' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

export const WIRE_PATHS = PAIRS.flatMap((p, pair) => ([
  { pair, d: pathFor(pair, 0), colour: p.colour, stripe: false },
  { pair, d: pathFor(pair, 1), colour: p.colour, stripe: true },
]));

function wirePoint(pair: number, x: number, wire: 0 | 1): Pt {
  const phase = wire ? Math.PI : 0;
  return { x, y: PAIRS[pair].y + Math.sin(((x - COPPER.cableX0) / COPPER.twist) * Math.PI * 2 + phase) * COPPER.pairAmp };
}

/** How the bits go onto the pairs: gigabit's PAM-5 on all four, both ways at once; 100BASE-TX's MLT-3 (a 2010 home's
 *  router), one pair each way, both at once; or 10BASE-T's Manchester code (1995), one pair each way and the other two
 *  unused, the two ends taking turns (half duplex, on a hub). */
export type Code = 'pam5' | 'mlt3' | 'manchester';
export const codeOf = (bps: number): Code => (bps <= 10e6 ? 'manchester' : bps <= 100e6 ? 'mlt3' : 'pam5');

/** The pairs drawn bright: at Simple one of gigabit's four (the others alike); 10BASE-T and 100BASE-TX use only two. */
export const litPairs = (code: Code, technical: boolean): number[] => (code !== 'pam5' ? [0, 1] : technical ? [0, 1, 2, 3] : [0]);

export function copperSparks(t: number, still: boolean, technical: boolean, code: Code = 'pam5') {
  const tt = still ? 3.2 : t;
  const span = COPPER.cableX1 - COPPER.cableX0;
  const turns = code === 'manchester', twoPairs = code !== 'pam5';
  const lit = litPairs(code, technical);
  const out = [] as { key: string; pair: number; dir: 1 | -1; head: Pt; trail: Pt[]; colour: string; alpha: number }[];
  for (let pair = 0; pair < PAIRS.length; pair++) {
    for (const dir of [1, -1] as const) {
      // 10BASE-T and 100BASE-TX: the first pair carries one way, the second the other (10BASE-T only one at a time)
      if (twoPairs && (pair > 1 || dir !== (pair === 0 ? 1 : -1))) continue;
      const g = turns ? ((tt * COPPER.speed + pair * span) % (2 * span)) / span : ((tt * COPPER.speed + pair * 92 + (dir < 0 ? span * 0.47 : 0)) % span) / span;
      const f = Math.min(g, 1);
      const x = dir > 0 ? COPPER.cableX0 + f * span : COPPER.cableX1 - f * span;
      const edge = g > 1 ? 0 : Math.min((x - COPPER.cableX0) / 95, (COPPER.cableX1 - x) / 95, 1);
      const wire = dir > 0 ? 0 : 1;
      const trail: Pt[] = [];
      for (let i = 0; i < 7; i++) trail.push(wirePoint(pair, x - dir * i * 18, wire));
      const dim = lit.includes(pair) ? 1 : 0.28;
      out.push({ key: `${pair}-${dir}`, pair, dir, head: trail[0], trail, colour: dir > 0 ? PAIRS[pair].colour : 'var(--sun)', alpha: smooth(Math.max(0, edge)) * dim });
    }
  }
  return out;
}

export function squareWavePath(x: number, y: number, w: number, h: number, bits: number[]) {
  const step = w / bits.length;
  let d = `M${x} ${y + (bits[0] ? h * 0.18 : h * 0.76)}`;
  for (let i = 0; i < bits.length; i++) {
    d += ` H${(x + (i + 1) * step).toFixed(1)}`;
    if (i < bits.length - 1) d += ` V${(y + (bits[i + 1] ? h * 0.18 : h * 0.76)).toFixed(1)}`;
  }
  return d;
}

const pamLevels = [0, 2, -1, 1, -2, 0, 1, -1, 2, 0];
export function pamPath(x: number, y: number, w: number, h: number) {
  const step = w / pamLevels.length;
  const map = (v: number) => y + h * (0.5 - v / 5);
  let d = `M${x} ${map(pamLevels[0]).toFixed(1)}`;
  for (let i = 0; i < pamLevels.length; i++) {
    d += ` H${(x + (i + 1) * step).toFixed(1)}`;
    if (i < pamLevels.length - 1) d += ` V${map(pamLevels[i + 1]).toFixed(1)}`;
  }
  return d;
}

/** 10BASE-T's Manchester code: every bit flips the line in its middle, low to high for a 1 and high to low for a 0
 *  (IEEE 802.3), so the receiver finds its clock in the data itself. */
export function manchesterPath(x: number, y: number, w: number, h: number, bits: number[]) {
  const half = w / bits.length / 2;
  const lv = (high: boolean) => (y + (high ? 0 : h)).toFixed(1);
  const levels = bits.flatMap((b) => [!b, !!b]);
  let d = `M${x} ${lv(levels[0])}`;
  for (let i = 0; i < levels.length; i++) {
    d += ` H${(x + (i + 1) * half).toFixed(1)}`;
    if (i < levels.length - 1 && levels[i + 1] !== levels[i]) d += ` V${lv(levels[i + 1])}`;
  }
  return d;
}

/** 100BASE-TX's MLT-3: the line steps through 0, +1, 0, −1 in turn, one step for each 1 and none for a 0, so it
 *  changes at most once a bit and its fundamental is a quarter of the 125 MBd (the 4B5B code's 1s keep it moving). */
export function mlt3Levels(bits: number[]): number[] {
  const cycle = [0, 1, 0, -1];
  let i = 0;
  return bits.map((b) => cycle[(i += b) % 4]);
}
export function mlt3Path(x: number, y: number, w: number, h: number, bits: number[]) {
  const step = w / bits.length;
  const lv = (v: number) => (y + (h * (1 - v)) / 2).toFixed(1);
  const levels = mlt3Levels(bits);
  let d = `M${x} ${lv(levels[0])}`;
  for (let i = 0; i < levels.length; i++) {
    d += ` H${(x + (i + 1) * step).toFixed(1)}`;
    if (i < levels.length - 1 && levels[i + 1] !== levels[i]) d += ` V${lv(levels[i + 1])}`;
  }
  return d;
}

function ease(t: number) { return t * t * (3 - 2 * t); }
/** An eye diagram: many symbols laid over each other, moving between neighbouring levels (0 top, 1 bottom). */
export function eyePaths(levels: number[], count = 3 * (levels.length - 1)): Pt[][] {
  const gaps = levels.length - 1;
  return Array.from({ length: count }, (_, i) => {
    const gap = i % gaps;
    const reverse = Math.floor(i / gaps) % 2 === 1;
    const wobble = (Math.floor(i / (2 * gaps)) - 0.5) * 0.018;
    const a = levels[gap], b = levels[gap + 1];
    const pts: Pt[] = [];
    for (let s = 0; s <= 42; s++) {
      const u = s / 42;
      const m = ease(u);
      const y = (reverse ? b + (a - b) * m : a + (b - a) * m) + Math.sin((u * 2 + i * 0.37) * Math.PI) * wobble;
      pts.push({ x: u, y });
    }
    return pts;
  });
}

/** Each code's card: its level marks and its eye (PAM-5's four small eyes, MLT-3's two, Manchester's one big one). */
export const CODES = {
  pam5: { labels: ['+2', '+1', '0', '−1', '−2'], eye: eyePaths([0.08, 0.29, 0.5, 0.71, 0.92]) },
  mlt3: { labels: ['+1', '0', '−1'], eye: eyePaths([0.08, 0.5, 0.92]) },
  manchester: { labels: ['+V', '−V'], eye: eyePaths([0.08, 0.92], 6) },
} satisfies Record<Code, { labels: string[]; eye: Pt[][] }>;
