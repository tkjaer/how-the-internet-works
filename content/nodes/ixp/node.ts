import { defineNode } from '$core/define';

export default defineNode({
  kind: 'device',
  role: 'bridge',
  dive: 'ixp-inside',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Internet_exchange_point', title: 'Internet exchange points', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Internetknoten', title: 'Internetknoten', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Peering', title: 'Peering', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Peering', title: 'Peering', level: 'nerd', lang: 'de' },
  ],
});
