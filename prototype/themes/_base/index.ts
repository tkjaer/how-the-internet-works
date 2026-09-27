// Default art slots. Every slot is driven only by CSS tokens, so a new theme can start from tokens.css alone
// and override the slots that matter for its look.
import type { ArtSlots, Theme, ThemeInput } from '../../core/theme-types';
import Defs from './Defs.svelte';
import Backdrop from './Backdrop.svelte';
import Device from './Device.svelte';
import Link from './Link.svelte';
import Packet from './Packet.svelte';
import Hint from './Hint.svelte';
import Tag from './Tag.svelte';
import Label from './Label.svelte';
import Panel from './Panel.svelte';
import Wave from './Wave.svelte';
import Bit from './Bit.svelte';
import Rings from './Rings.svelte';
import Fibre from './Fibre.svelte';
import Route from './Route.svelte';
import Pulse from './Pulse.svelte';
import Prism from './Prism.svelte';
import Emitter from './Emitter.svelte';
import Overlay from './Overlay.svelte';

export const baseArt: ArtSlots = { Defs, Backdrop, Device, Link, Packet, Hint, Tag, Label, Panel, Wave, Bit, Rings, Fibre, Route, Pulse, Prism, Emitter, Overlay };

export const defineTheme = (t: ThemeInput): Theme => ({ ...t, art: { ...baseArt, ...t.art } });
