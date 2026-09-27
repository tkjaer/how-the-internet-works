// Optional, kid-friendly sound effects synthesised with the Web Audio API – no audio files, so no licences.
// Muted by default; the AudioContext is only created after the user turns sound on (a user gesture).
export interface Timbre {
  /** Oscillator for blips/pops. */
  wave: OscillatorType;
  /** Base pitch (Hz) of the arrival blip. */
  blip: number;
  /** Band-pass centre (Hz) and Q of the noise used for whooshes. */
  noise: { freq: number; q: number };
  /** Overall level 0..1. */
  gain: number;
  /** A second, detuned voice for a richer tone (cents), 0 = off. */
  detune: number;
  /** Decay of the percussive sounds in seconds. */
  decay: number;
}

export const DEFAULT_TIMBRE: Timbre = { wave: 'sine', blip: 880, noise: { freq: 900, q: 0.8 }, gain: 0.5, detune: 0, decay: 0.18 };

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private lastQuiet = 0;
  enabled = false;
  timbre: Timbre = DEFAULT_TIMBRE;

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on && !this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
      const n = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, n, n);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    if (on) void this.ctx?.resume();
  }

  private ready() { return this.enabled && this.ctx && this.master && this.ctx.state === 'running' ? this.ctx : null; }

  private tone(freq: number, dur: number, level: number, bend = 1, delay = 0) {
    const ctx = this.ready(); if (!ctx) return;
    const t0 = ctx.currentTime + delay, T = this.timbre;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(level * T.gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(this.master!);
    for (const cents of T.detune ? [-T.detune, T.detune] : [0]) {
      const o = ctx.createOscillator();
      o.type = T.wave; o.detune.value = cents;
      o.frequency.setValueAtTime(freq, t0);
      o.frequency.exponentialRampToValueAtTime(freq * bend, t0 + dur);
      o.connect(g); o.start(t0); o.stop(t0 + dur + 0.02);
    }
  }

  private noise(dur: number, level: number, f0: number, f1: number) {
    const ctx = this.ready(); if (!ctx || !this.noiseBuf) return;
    const t0 = ctx.currentTime, T = this.timbre;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = T.noise.q;
    bp.frequency.setValueAtTime(f0, t0);
    bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(level * T.gain, t0 + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  /** Zooming in (up = true) or out. */
  whoosh(up: boolean, durMs = 900) {
    const f = this.timbre.noise.freq, d = Math.min(1.4, durMs / 1000);
    this.noise(d, 0.9, up ? f * 0.5 : f * 2, up ? f * 2.2 : f * 0.45);
  }
  /** Stepping sideways. */
  swish() { const f = this.timbre.noise.freq; this.noise(0.28, 0.6, f * 1.6, f * 0.8); }
  /** A tap on something. */
  pop() { this.tone(this.timbre.blip * 0.5, this.timbre.decay * 0.7, 0.7, 1.8); }
  /** Arrival. Quiet arrivals (not followed) are throttled so a busy scene doesn't chatter. */
  blip(loud: boolean, kind: 'request' | 'video' = 'video') {
    const now = performance.now();
    if (!loud) { if (now - this.lastQuiet < 1800) return; this.lastQuiet = now; }
    const f = this.timbre.blip * (kind === 'request' ? 1.26 : 1);
    this.tone(f, this.timbre.decay, loud ? 0.9 : 0.12);
    if (loud) this.tone(f * 1.5, this.timbre.decay * 1.4, 0.7, 1, 0.09);
  }
  /** Reached the end of a row of stops. */
  bump() { this.tone(this.timbre.blip * 0.25, 0.16, 0.6, 0.7); }
}

export const sfx = new Sfx();
