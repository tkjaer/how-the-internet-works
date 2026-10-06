import { defineNode } from '$core/define';

// An aggregation switch of 2010's three-tier data centre (#59): the middle of core → aggregation → access, where every
// rack's switch has its two uplinks and layer 2 ends. It stands at today's spine hop (the 2010 segment names it), so
// links and URLs carry over. Its dive shows the tree, with spanning tree blocking each rack's second uplink.
export default defineNode({
  kind: 'device',
  role: 'router',
  dive: 'three-tier',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Hierarchical_internetworking_model', title: 'Hierarchical internetworking model', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Hierarchisches_Internetworking-Modell', title: 'Hierarchisches Internetworking-Modell', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Spanning_Tree_Protocol', title: 'Spanning Tree Protocol', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Spanning_Tree_Protocol', title: 'Spanning Tree Protocol', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Network_switch', title: 'Network switch', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Switch', title: 'Switch', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Switch_(Netzwerktechnik)', title: 'Switch (Netzwerktechnik)', level: 'both', lang: 'de' },
  ],
});
