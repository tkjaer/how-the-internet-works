export interface Pt { x: number; y: number }
export interface Box { x: number; y: number; w: number; h: number }
export interface Tag extends Pt { anchor: 'start' | 'middle' | 'end' }

export type Member = 'before' | 'other1' | 'other2' | 'other3' | 'other4' | 'after';
export type ParcelStage = 'in' | 'fabric' | 'out';
export type NoteStage = 'to-server' | 'from-server';

export interface ExchangeLayout {
  /** The shared switch: lying along the scene in landscape, standing up the middle in portrait. */
  fabric: Box;
  vertical: boolean;
  routeServer: Box;
  /** The route server's own cable: from its box to its port on the fabric (it is a member of the LAN too). */
  serverCable: [Pt, Pt];
  members: Record<Member, Pt>;
  memberBoxes: Record<Member, Box>;
  ports: Record<Member, Pt>;
  inPort: Pt;
  outPort: Pt;
  nodeSize: number;
  /** How far along its way the parcel waits in the still pose: on the fabric, clear of its name. */
  still: number;
  fabricLabel: Tag;
  straightTag: Tag;
  serverLabel: Tag;
  serverLine: Tag;
  inLabel: Tag;
  outLabel: Tag;
  inTech: Tag;
  outTech: Tag;
  /** Where the other members' one shared name goes (each gets its AS number at Technical). */
  othersLabel: Tag;
}

export interface Moving<S extends string> { p: Pt; stage: S; alpha: number }
export interface Parcel extends Moving<ParcelStage> { from: Member; to: Member }
export interface Note extends Moving<NoteStage> { member: Member; direction: 'up' | 'down' }
export interface FlowSpec { from: Member; to: Member; phase: number; still: number; colour: string }
export interface Flow extends Moving<'fabric'> { from: Member; to: Member; colour: string }

export interface FabricProps { box: Box; vertical: boolean; ports: Pt[]; night: boolean }
export interface MemberProps { box: Box; colour: string; night: boolean }
export interface RouteServerProps { box: Box; active: boolean; night: boolean }
export interface CarrierProps { p: Pt; alpha: number; time: number; kind: 'parcel' | 'other'; colour: string; night: boolean }
export interface NoteProps { p: Pt; alpha: number; time: number; night: boolean }
