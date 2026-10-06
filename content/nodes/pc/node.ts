import { defineNode } from '$core/define';

export default defineNode({
  kind: 'device',
  role: 'endpoint',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Desktop_computer', title: 'Desktop computer', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Station%C3%A6r_computer', title: 'Stationær computer', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Desktop-Computer', title: 'Desktop-Computer', level: 'both', lang: 'de' },
  ],
});
