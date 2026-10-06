import { defineNode } from '$core/define';

export default defineNode({
  kind: 'network',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Internet', title: 'Internet', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Internet', title: 'Internet', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Internet', title: 'Internet', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Border_Gateway_Protocol', title: 'Border Gateway Protocol', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Border_Gateway_Protocol', title: 'Border Gateway Protocol', level: 'nerd', lang: 'de' },
  ],
});
