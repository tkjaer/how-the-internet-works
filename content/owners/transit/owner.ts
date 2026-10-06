import { defineOwner } from '$core/define';

// A big carrier that your internet company pays to reach everything the exchange doesn't.
export default defineOwner({
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Peering', title: 'Peering and transit', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Peering', title: 'Peering', level: 'nerd', lang: 'de' },
  ],
});
