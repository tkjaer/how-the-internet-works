import { defineLayer } from '$core/define';

export default defineLayer({
  dive: 'sticker-doors',
  fields: [
    // written fresh for every link: the MAC addresses of this stretch of cable
    { id: 'dst', bits: 48, value: '{mac.dst}', use: true, kid: true },
    { id: 'src', bits: 48, value: '{mac.src}', use: true, kid: true },
    { id: 'type', bits: 16, value: '{inner.ethertype}', use: true },
    { id: 'fcs', bits: 32, value: '{crc}', use: true },
  ],
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Network_switch', title: 'Network switch', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Netv%C3%A6rksswitch', title: 'Netværksswitch', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Switch_(Netzwerktechnik)', title: 'Switch (Netzwerktechnik)', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/MAC_address', title: 'MAC address', level: 'nerd', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/MAC-adresse', title: 'MAC-adresse', level: 'nerd', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/MAC-Adresse', title: 'MAC-Adresse', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Address_Resolution_Protocol', title: 'ARP', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/ARP', title: 'ARP', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Address_Resolution_Protocol', title: 'Address Resolution Protocol', level: 'both', lang: 'de' },
  ],
});
