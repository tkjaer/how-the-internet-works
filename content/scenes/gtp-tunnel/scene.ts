import { defineScene } from '$core/define';

export default defineScene({
  explains: 'layer',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Cellular_network', title: 'Cellular network', level: 'kid', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Mobiltelefoni', title: 'Mobiltelefoni', level: 'kid', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Mobilfunknetz', title: 'Mobilfunknetz', level: 'kid', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/GPRS_Tunnelling_Protocol', title: 'GPRS Tunnelling Protocol', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/GPRS_Tunneling_Protocol', title: 'GPRS Tunneling Protocol', level: 'nerd', lang: 'de' },
    { url: 'https://portal.3gpp.org/desktopmodules/Specifications/SpecificationDetails.aspx?specificationId=1699', title: '3GPP TS 29.281', level: 'nerd', lang: 'en' },
  ],
});
