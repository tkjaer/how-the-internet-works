import { defineLayer } from '$core/define';

export default defineLayer({
  // the lines themselves are strings, so an era can have its own (`"1995": { "value": … }` in the locales)
  fields: [
    { id: 'start', value: { up: '@get', down: '@ok' }, use: ['endpoint'], kid: { up: '@ask', down: '@send' } },
    { id: 'header', value: { up: '@host', down: '@type' }, use: ['endpoint'] },
  ],
  // the rest of the headers, and this packet's share of the body
  bytes: { up: 360, down: 1300 },
  openAt: ['endpoint'],
  dive: 'http-chunk',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/HTTP', title: 'HTTP', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Hypertext_Transfer_Protocol', title: 'Hypertext Transfer Protocol', level: 'both', lang: 'de' },
  ],
});
