// Per-render contexts: the World (its camera – there can be two during a portal/parallax transition) and the
// Scene being drawn (its id and nesting scale), so labels can clamp to a readable on-screen size and backdrop
// layers can do depth parallax.
import { getContext, setContext } from 'svelte';
import type { Cam } from '../core/camera';
import type { SceneId } from '../core/scene';

export interface WorldCtx { readonly cam: Cam; readonly uid: string }
export interface SceneCtx { readonly id: SceneId; readonly scale: number }

export const setWorld = (w: WorldCtx) => setContext('world', w);
export const getWorld = () => getContext<WorldCtx>('world');
export const setScene = (s: SceneCtx) => setContext('scene', s);
export const getScene = () => getContext<SceneCtx | undefined>('scene') ?? { id: 'overview' as SceneId, scale: 1 };
