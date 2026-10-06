import { defineNode } from '$core/define';

// A 3G radio network controller: the box behind dozens of NodeBs that ends the radio layers (RLC, ciphering) and,
// with Direct Tunnel, puts the phone's packets in a GTP-U tunnel straight to the GGSN.
export default defineNode({
  kind: 'device',
  role: 'bridge',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Radio_Network_Controller', title: 'Radio Network Controller', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Radio_Network_Controller', title: 'Radio Network Controller', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/UMTS', title: 'UMTS', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Universal_Mobile_Telecommunications_System', title: 'Universal Mobile Telecommunications System', level: 'both', lang: 'de' },
  ],
});
