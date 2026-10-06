import { defineNode } from '$core/define';

// A 10BASE-T hub (a multiport repeater), 1990s: every bit that comes in on one port goes out on all the others, so it
// reads nothing and the frames pass through it unchanged. Switches, which learn where each address is, took over later.
export default defineNode({
  kind: 'device',
  role: 'passive',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Ethernet_hub', title: 'Ethernet hub', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Hub_(Netzwerktechnik)', title: 'Hub (Netzwerktechnik)', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/10BASE-T', title: '10BASE-T', level: 'nerd', lang: 'en' },
  ],
});
