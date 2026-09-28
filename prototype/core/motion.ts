// Motion: the easing used by every camera transition, and a theme's motion preset.
export interface MotionPreset {
  /** Duration multiplier (1 = the camera's natural flight time). */
  speed: number;
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
