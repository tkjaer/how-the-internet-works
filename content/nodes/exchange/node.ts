import { defineNode } from '$core/define';

// The local telephone exchange: it connects a call through the phone network, a circuit kept open for the whole call.
// It doesn't read what's in the call (to it, a modem is just a very noisy talker).
export default defineNode({
  kind: 'device',
  role: 'bridge',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Telephone_exchange', title: 'Telephone exchange', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Telefoncentral', title: 'Telefoncentral', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Vermittlungsstelle', title: 'Vermittlungsstelle', level: 'both', lang: 'de' },
  ],
});
