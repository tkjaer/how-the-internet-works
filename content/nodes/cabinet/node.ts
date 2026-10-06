import { defineNode } from '$core/define';

export default defineNode({
  kind: 'device',
  role: 'passive',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Passive_optical_network', title: 'Passive optical network', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Passive_Optical_Network', title: 'Passive Optical Network', level: 'nerd', lang: 'de' },
  ],
});
