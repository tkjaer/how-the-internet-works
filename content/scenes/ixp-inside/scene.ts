import { defineScene } from '$core/define';

export default defineScene({
  explains: 'node',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Internet_exchange_point', title: 'Internet exchange point', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Internetknoten', title: 'Internetknoten', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Peering', title: 'Peering', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Peering', title: 'Peering', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Route_server', title: 'Route server', level: 'nerd', lang: 'en' },
  ],
});
