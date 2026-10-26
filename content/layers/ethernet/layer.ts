import { defineLayer } from '$core/define';

export default defineLayer({
  dive: 'sticker-doors',
  fields: [
    // written fresh for every link: the MAC addresses of this stretch of cable
    { id: 'dst', bits: 48, value: '{mac.dst}', use: true, simple: true },
    { id: 'src', bits: 48, value: '{mac.src}', use: true, simple: true },
    { id: 'type', bits: 16, value: '{inner.ethertype}', use: true },
    { id: 'fcs', bits: 32, value: '{crc}', use: true },
  ],
});
