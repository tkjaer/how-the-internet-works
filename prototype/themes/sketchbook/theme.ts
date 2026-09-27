import { defineTheme } from '../_base';
import './tokens.css';

export default defineTheme({
  id: 'sketchbook',
  themeColor: '#070a24',
  scheme: 'dark',
  labelMinPx: 13,
  motion: { zoom: 'fly', feel: 'ease', speed: 0.9, spring: { damping: 0.7, frequency: 1.4 }, twosFps: 12 },
  timbre: { wave: 'sawtooth', blip: 1040, noise: { freq: 1400, q: 1.2 }, gain: 0.35, detune: 7, decay: 0.14 },
  colours: {
    tech: { wifi: '#3ef0ff', ethernet: '#ffb547', fibre: '#ff4fd8', backbone: '#a9b8ff' },
    packet: { request: '#ffe066', video: '#ff6b8b' },
    dwdm: ['#ff4d6d', '#ffd23f', '#3ef0a0', '#4dabff'],
    bit: ['#8190ff', '#ffe066'],
  },
});
