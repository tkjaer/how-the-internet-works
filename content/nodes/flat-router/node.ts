import { defineNode } from '$core/define';

// The home router in a flat with fibre to the building: Wi-Fi in, NAT, and out through a plain Ethernet port to the
// switch in the basement (no light box of its own: the fibre ends downstairs).
export default defineNode({
  kind: 'device',
  role: 'nat',
  dive: 'router-inside',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Residential_gateway', title: 'Home router', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Residential_Gateway', title: 'Residential Gateway', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Network_address_translation', title: 'Network address translation', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Netzwerkadress%C3%BCbersetzung', title: 'Netzwerkadressübersetzung', level: 'nerd', lang: 'de' },
  ],
});
