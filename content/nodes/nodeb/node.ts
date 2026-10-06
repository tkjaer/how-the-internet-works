import { defineNode } from '$core/define';

// A 3G base station (NodeB): three sector antennas on a mast, the HSDPA scheduler, and a line back to its RNC.
export default defineNode({
  kind: 'device',
  role: 'bridge',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Cell_site', title: 'Cell site', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Mobilfunk-Basisstation', title: 'Mobilfunk-Basisstation', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Node_B', title: 'Node B', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Node_B', title: 'Node B', level: 'nerd', lang: 'de' },
  ],
});
