import { defineNode } from '$core/define';

export default defineNode({
  kind: 'device',
  role: 'endpoint',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Laptop', title: 'Laptop', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/B%C3%A6rbar_computer', title: 'Bærbar computer', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Notebook', title: 'Notebook', level: 'both', lang: 'de' },
  ],
});
