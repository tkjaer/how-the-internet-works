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
  id: 'storybook',
  themeColor: '#ffeccf',
  scheme: 'light',
  labelMinPx: 14,
  motion: { zoom: 'fly', feel: 'ease', speed: 1, spring: { damping: 0.55, frequency: 1.2 }, twosFps: 12 },
  timbre: { wave: 'triangle', blip: 660, noise: { freq: 820, q: 0.75 }, gain: 0.28, detune: 4, decay: 0.22 },
  colours: {
    tech: { wifi: '#72b8a5', ethernet: '#e78d44', fibre: '#3aaea1', backbone: '#9a6b45' },
    packet: { request: '#ffcf5d', video: '#bf6f8f' },
    dwdm: ['#e85d75', '#ffcf5d', '#55bfa3', '#4aa3cf'],
    bit: ['#72b8a5', '#f28f5b'],
  },
  art: { Backdrop, Device, Link, Packet, Hint, Tag, Label, Panel, Wave, Bit, Rings, Fibre, Route, Pulse, Prism, Emitter, Overlay },
});
