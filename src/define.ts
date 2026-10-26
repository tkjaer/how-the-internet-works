// The typed helpers content definition files use: `export default defineNode({ … })`. They return their input
// unchanged; the types come from the zod schemas (type-only import: zod never reaches the production bundle).
import type { z } from 'zod';
import type * as S from './model/schema';

/** A learn-more link as the app shows it: its `lang` is the locale file's it came from. */
export type LearnMore = z.infer<typeof S.learnMore> & { lang: string };
export type Role = z.infer<typeof S.role>;
export type NodeDef = z.infer<typeof S.node>;
/** An owner defines nothing but itself (its folder): its name and links are in its locale files. (The schema's `{}`
 *  infers as `Record<string, never>`, which no item with an id would fit.) */
export type OwnerDef = Record<never, never>;
export type TechDef = z.infer<typeof S.technology>;
export type LayerDef = z.infer<typeof S.layer>;
export type SceneDef = z.infer<typeof S.scene>;
export type Placement = z.infer<typeof S.placement>;
type Layout = z.infer<typeof S.layout>;
export type SceneLayout = z.infer<typeof S.sceneLayout>;
export type HopDef = z.infer<typeof S.hop>;
export type LinkDef = z.infer<typeof S.link>;
type AsideDef = z.infer<typeof S.aside>;
export type SegmentDef = z.infer<typeof S.segment>;
type PacketDef = z.infer<typeof S.packet>;
export type FlowDef = z.infer<typeof S.flow>;
export type PlaceDef = z.infer<typeof S.place>;
export type EraDef = z.infer<typeof S.era>;
type PlaceSlotDef = z.infer<typeof S.placeSlot>;
export type ActivityDef = z.infer<typeof S.activity>;
export type LocaleMeta = z.infer<typeof S.localeMeta>;
export type Level = 'simple' | 'technical';
export type Orient = 'landscape' | 'portrait';
/** Day or night: the page's `data-mode`, and `view.mode` for art. */
export type Mode = 'day' | 'night';

export const defineNode = (d: NodeDef) => d;
export const defineOwner = (d: OwnerDef) => d;
export const defineTechnology = (d: TechDef) => d;
export const defineLayer = (d: LayerDef) => d;
export const defineScene = (d: SceneDef) => d;
export const defineSegment = (d: SegmentDef) => d;
export const definePlace = (d: PlaceDef) => d;
export const defineEra = (d: EraDef) => d;
export const defineActivity = (d: ActivityDef) => d;
