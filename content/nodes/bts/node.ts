import { defineNode } from '$core/define';

// A GSM base station (BTS) of the 1990s: a lattice mast with rod aerials and its radios in a cabinet at the foot,
// and an E1 line back to its controller (the BSC).
export default defineNode({
  kind: 'device',
  role: 'bridge',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Base_transceiver_station', title: 'Base transceiver station', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Base_Transceiver_Station', title: 'Base Transceiver Station', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Cell_site', title: 'Cell site', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Mobilfunk-Basisstation', title: 'Mobilfunk-Basisstation', level: 'both', lang: 'de' },
  ],
});
