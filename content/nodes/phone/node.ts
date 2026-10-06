import { defineNode } from '$core/define';

export default defineNode({
  kind: 'device',
  role: 'endpoint',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Smartphone', title: 'Smartphone', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Smartphone', title: 'Smartphone', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Smartphone', title: 'Smartphone', level: 'both', lang: 'de' },
  ],
});
