import { defineNode } from '$core/define';

// The data centre's edge router: its door to the exchange, where it speaks BGP for the video company
export default defineNode({
  kind: 'device',
  role: 'router',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Edge_device', title: 'Edge device', level: 'nerd', lang: 'en' },
    { url: 'https://en.wikipedia.org/wiki/Router_(computing)', title: 'Router', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Router', title: 'Router', level: 'both', lang: 'de' },
  ],
});
