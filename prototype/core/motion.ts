// Motion presets: easing curves, a closed-form damped spring, and the "on twos" stepped clock.
export type ZoomKind = 'fly' | 'portal' | 'parallax';
export type FeelKind = 'ease' | 'spring' | 'twos';

export interface MotionPreset {
  /** Default zoom transition for taps, breadcrumb, Back and steps. */
  zoom: ZoomKind;
  /** Default feel of every transition. */
  feel: FeelKind;
  /** Duration multiplier (1 = the camera's natural flight time). */
  speed: number;
  /** Spring character for feel = 'spring': damping ratio (<1 overshoots) and number of visible wobbles. */
  spring: { damping: number; frequency: number };
  /** Frames per second for 'twos' (stop-motion) stepping. */
  twosFps: number;
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Damped spring response from 0 → 1 over t ∈ [0,1] (settles by t = 1). damping < 1 overshoots. */
export function springCurve(damping: number, frequency: number) {
  const z = Math.min(0.99, Math.max(0.05, damping));
  const w = 2 * Math.PI * frequency;
  const wd = w * Math.sqrt(1 - z * z);
  const raw = (t: number) => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  const end = raw(1);
  return (t: number) => (t >= 1 ? 1 : t <= 0 ? 0 : raw(t) + (1 - end) * t);
}

export function feelCurve(feel: FeelKind, m: MotionPreset, durationMs: number): (t: number) => number {
  if (feel === 'spring') return springCurve(m.spring.damping, m.spring.frequency);
  if (feel === 'twos') {
    const steps = Math.max(2, Math.round((durationMs / 1000) * m.twosFps));
    return (t: number) => (t >= 1 ? 1 : easeInOutCubic(Math.floor(t * steps) / steps));
  }
  return easeInOutCubic;
}

/** Quantise a clock to `fps` (stop-motion look). */
export const stepClock = (t: number, fps: number) => Math.floor(t * fps) / fps;
