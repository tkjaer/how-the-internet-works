import { defineNode } from '$core/define';

export default defineNode({
  kind: 'device',
  role: 'router',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Broadband_remote_access_server', title: 'Broadband network gateway', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Breitband-Zugangsserver', title: 'Breitband-Zugangsserver', level: 'nerd', lang: 'de' },
  ],
});
