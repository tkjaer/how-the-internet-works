import { defineNode } from '$core/define';

export default defineNode({
  kind: 'device',
  role: 'router',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Multiprotocol_Label_Switching', title: 'MPLS', level: 'nerd', lang: 'en', eras: ['2010', 'today'] },
    { url: 'https://de.wikipedia.org/wiki/Multiprotocol_Label_Switching', title: 'Multiprotocol Label Switching', level: 'nerd', lang: 'de', eras: ['2010', 'today'] },
  ],
});
