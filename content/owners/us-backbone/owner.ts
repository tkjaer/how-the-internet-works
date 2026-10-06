import { defineOwner } from '$core/define';

// A big American network in 1995 (an MCI or a Sprint): its backbone joins the cable's landing to the far side of the
// country, and it sells leased lines to universities and companies.
export default defineOwner({
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Internet_backbone', title: 'Internet backbone', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Internet-Backbone', title: 'Internet-Backbone', level: 'both', lang: 'de' },
  ],
});
