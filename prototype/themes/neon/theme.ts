import { defineTheme } from '../_base';
import Backdrop from './art/Backdrop.svelte';
import Bit from './art/Bit.svelte';
import Defs from './art/Defs.svelte';
import Device from './art/Device.svelte';
import Emitter from './art/Emitter.svelte';
import Fibre from './art/Fibre.svelte';
import Hint from './art/Hint.svelte';
import Label from './art/Label.svelte';
import Link from './art/Link.svelte';
import Overlay from './art/Overlay.svelte';
import Packet from './art/Packet.svelte';
import Panel from './art/Panel.svelte';
import Prism from './art/Prism.svelte';
import Pulse from './art/Pulse.svelte';
import Rings from './art/Rings.svelte';
import Route from './art/Route.svelte';
import Tag from './art/Tag.svelte';
import Wave from './art/Wave.svelte';
import './tokens.css';

export default defineTheme({
  id: 'neon',
  themeColor: '#020613',
  scheme: 'dark',
  labelMinPx: 13,
  motion: { zoom: 'fly', feel: 'ease', speed: 0.85, spring: { damping: 0.76, frequency: 1.55 }, twosFps: 14 },
  timbre: { wave: 'sawtooth', blip: 1040, noise: { freq: 1900, q: 1.5 }, gain: 0.36, detune: 11, decay: 0.12 },
  colours: {
    tech: { wifi: '#3ef0ff', ethernet: '#ffb547', fibre: '#ff4fe9', backbone: '#caff5a' },
    packet: { request: '#ffbd4a', video: '#ff4fe9' },
    dwdm: ['#ff4fe9', '#ffbd4a', '#caff5a', '#3ef0ff'],
    bit: ['#7e92ff', '#ffe96b'],
  },
  art: { Defs, Backdrop, Device, Link, Packet, Hint, Tag, Label, Panel, Wave, Bit, Rings, Fibre, Route, Pulse, Prism, Emitter, Overlay },
});
