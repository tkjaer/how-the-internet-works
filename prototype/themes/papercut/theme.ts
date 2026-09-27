import { defineTheme } from '../_base';
import './tokens.css';
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
  id: 'papercut',
  themeColor: '#244257',
  scheme: 'light',
  labelMinPx: 13,
  motion: { zoom: 'parallax', feel: 'spring', speed: 1.05, spring: { damping: 0.7, frequency: 1.0 }, twosFps: 12 },
  timbre: { wave: 'triangle', blip: 600, noise: { freq: 2500, q: 1.6 }, gain: 0.34, detune: 5, decay: 0.18 },
  colours: {
    tech: { wifi: '#2f9aa0', ethernet: '#d59a34', fibre: '#f4e3a0', backbone: '#2d5870' },
    packet: { request: '#e9b44c', video: '#e76f51' },
    dwdm: ['#e76f51', '#e9b44c', '#62a87c', '#2f9aa0'],
    bit: ['#2d5870', '#e76f51'],
  },
  art: { Backdrop, Device, Link, Packet, Hint, Tag, Label, Panel, Wave, Bit, Rings, Fibre, Route, Pulse, Prism, Emitter, Overlay },
});
