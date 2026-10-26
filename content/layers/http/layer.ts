import { defineLayer } from '$core/define';

export default defineLayer({
  // the lines themselves are strings, so an era can have its own (`"1995": { "value": … }` in the locales)
  fields: [
    { id: 'start', value: { up: '@get', down: '@ok' }, use: ['endpoint'], simple: { up: '@ask', down: '@send' } },
    { id: 'header', value: { up: '@host', down: '@type' }, use: ['endpoint'] },
  ],
  // the rest of the headers, and this packet's share of the body
  bytes: { up: 360, down: 1300 },
  openAt: ['endpoint'],
  dive: 'http-chunk',
});
