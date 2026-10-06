import { defineNode } from '$core/define';

// The OLT at the exchange: the active end of the home's PON. It ends XGS-PON and bridges the Ethernet frames on.
export default defineNode({
  kind: 'device',
  role: 'bridge',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Optical_line_termination', title: 'Optical line termination', level: 'nerd', lang: 'en' },
    { url: 'https://en.wikipedia.org/wiki/IEEE_802.1ad', title: 'IEEE 802.1ad (Q-in-Q)', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/IEEE_802.1ad', title: 'IEEE 802.1ad', level: 'nerd', lang: 'de' },
  ],
});
