import { defineLayer } from '$core/define';

export default defineLayer({
  seals: true,
  fields: [
    { id: 'type', bits: 8, value: '23 (application data)', use: ['endpoint'] },
    { id: 'version', bits: 16, value: '0x0303', use: ['endpoint'] },
    { id: 'length', bits: 16, value: '{payload+17}', use: ['endpoint'] },
  ],
  // after the ciphertext of the payload: TLS 1.3's inner content type (1 byte) and the authentication tag (16)
  bytes: { up: 17, down: 17 },
  openAt: ['endpoint'],
  dive: 'tls-lock',
  learnMore: [
    { url: 'https://simple.wikipedia.org/wiki/Transport_Layer_Security', title: 'TLS (Simple English)', level: 'kid', lang: 'en' },
    { url: 'https://en.wikipedia.org/wiki/Transport_Layer_Security', title: 'Transport Layer Security', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Transport_Layer_Security', title: 'Transport Layer Security', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Transport_Layer_Security', title: 'Transport Layer Security', level: 'both', lang: 'de' },
    { url: 'https://datatracker.ietf.org/doc/html/rfc8446', title: 'RFC 8446: TLS 1.3', level: 'nerd', lang: 'en' },
  ],
});
