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
});
