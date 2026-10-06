import { defineNode } from '$core/define';

// The video company's data centre (a CDN point of presence) next to the exchange: a group that unfolds into the path
// through it (issue #35)
export default defineNode({
  kind: 'network',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Data_center', title: 'Data center', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Datacenter', title: 'Datacenter', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Rechenzentrum', title: 'Rechenzentrum', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Content_delivery_network', title: 'Content delivery network', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Content_Delivery_Network', title: 'Content Delivery Network', level: 'nerd', lang: 'de' },
  ],
});
