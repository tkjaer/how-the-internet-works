import { defineTheme } from '../_base';
import './tokens.css';
import './art/prewarm';
import Defs from './art/Defs.svelte';
import Backdrop from './art/Backdrop.svelte';
import Device from './art/Device.svelte';
import Link from './art/Link.svelte';
import Packet from './art/Packet.svelte';
import Hint from './art/Hint.svelte';
import Tag from './art/Tag.svelte';
import Label from './art/Label.svelte';
import Panel from './art/Panel.svelte';
import Wave from './art/Wave.svelte';
import Bit from './art/Bit.svelte';
import Rings from './art/Rings.svelte';
import Fibre from './art/Fibre.svelte';
import Route from './art/Route.svelte';
import Pulse from './art/Pulse.svelte';
import Prism from './art/Prism.svelte';
import Emitter from './art/Emitter.svelte';
import Overlay from './art/Overlay.svelte';

export default defineTheme({
  id: 'sketchbook',
  themeColor: '#f6f0df',
  scheme: 'light',
  labelMinPx: 14,
  motion: { zoom: 'fly', feel: 'twos', speed: 0.95, spring: { damping: 0.82, frequency: 1.15 }, twosFps: 12 },
  timbre: { wave: 'triangle', blip: 520, noise: { freq: 2200, q: 0.65 }, gain: 0.42, detune: 5, decay: 0.11 },
  colours: {
    tech: { wifi: '#2f6fa6', ethernet: '#c88422', fibre: '#d9558c', backbone: '#4a5362' },
    packet: { request: '#ffe56e', video: '#ff9ec4' },
    dwdm: ['#e9476e', '#f1bb31', '#45a86f', '#4b8ed8'],
    bit: ['#5379b8', '#d38b22'],
  },
  art: { Defs, Backdrop, Device, Link, Packet, Hint, Tag, Label, Panel, Wave, Bit, Rings, Fibre, Route, Pulse, Prism, Emitter, Overlay },
});
