import { defineOwner } from '$core/define';

// The video company's own network: its caches in a data centre near you.
export default defineOwner({
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Content_delivery_network', title: 'Content delivery network', level: 'nerd', lang: 'en', eras: ['2010', 'today'] },
    { url: 'https://de.wikipedia.org/wiki/Content_Delivery_Network', title: 'Content Delivery Network', level: 'nerd', lang: 'de', eras: ['2010', 'today'] },
  ],
});
