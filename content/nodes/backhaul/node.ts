import { defineNode } from '$core/define';

export default defineNode({
  kind: 'device',
  role: 'bridge',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/IEEE_802.1ad', title: 'IEEE 802.1ad (Q-in-Q)', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/IEEE_802.1ad', title: 'IEEE 802.1ad', level: 'nerd', lang: 'de' },
  ],
});
