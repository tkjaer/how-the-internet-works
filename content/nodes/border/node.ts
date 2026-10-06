import { defineNode } from '$core/define';

// The ISP's border router (edge/peering router, ASBR): its door to the other networks, at the exchange or a carrier.
export default defineNode({
  kind: 'device',
  role: 'router',
  dive: 'border-inside',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Border_Gateway_Protocol', title: 'BGP', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Border_Gateway_Protocol', title: 'Border Gateway Protocol', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Multiprotocol_Label_Switching', title: 'MPLS (penultimate hop popping)', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Multiprotocol_Label_Switching', title: 'Multiprotocol Label Switching', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Autonomous_system_(Internet)', title: 'Autonomous system (ASBR)', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Autonomes_System', title: 'Autonomes System', level: 'nerd', lang: 'de' },
  ],
});
