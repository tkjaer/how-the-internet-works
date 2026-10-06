import { defineNode } from '$core/define';

export default defineNode({
  kind: 'device',
  role: 'bridge',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Wireless_access_point', title: 'Wireless access point', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Wireless_Access_Point', title: 'Wireless Access Point', level: 'both', lang: 'de' },
  ],
});
