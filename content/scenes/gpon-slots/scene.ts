import { defineScene } from '$core/define';

export default defineScene({
  explains: 'layer',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/10G-PON', title: 'XGS-PON', level: 'kid', lang: 'en' },
    { url: 'https://en.wikipedia.org/wiki/Passive_optical_network', title: 'Passive optical network', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Passive_Optical_Network', title: 'Passive Optical Network', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Dynamic_bandwidth_allocation', title: 'Dynamic bandwidth allocation', level: 'nerd', lang: 'en' },
    { url: 'https://www.itu.int/rec/T-REC-G.9807.1', title: 'ITU-T G.9807.1 (XGS-PON)', level: 'nerd', lang: 'en' },
  ],
});
