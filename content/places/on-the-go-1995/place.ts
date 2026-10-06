import { definePlace } from '$core/define';
import onTheGo from '../on-the-go/place';

// On the go in 1995: possible, but rare. A laptop dials the internet company through a GSM phone on a cable (circuit-
// switched data, 9.6 kbit/s). The call goes by radio to the mast (BTS), as quarter-slots of E1 lines through the mast
// controller (BSC) to the mobile switch (MSC), whose modems (the IWF) call on through the phone network like a
// computer at home; from the exchange on it is the dial-up's way into the ISP's modem bank. No IP before it.
export default definePlace({
  variantOf: 'on-the-go',
  order: 2.6,
  era: '1995',
  hops: [
    // the job's id stays `phone` (the thing that talks to the mast), so its radio dive keeps its address in every era
    { at: 'phone', node: 'laptop-gsm', addr: '203.0.113.52' },
    { link: 'gsm', km: 2 },
    { at: 'cell-tower', node: 'bts' },
    // Abis: the mast's E1 line to its controller
    { link: 'abis', km: 30 },
    { at: 'bsc', in: 'internet' },
    // Ater: on to the transcoder, which many networks kept at the mobile switch, so still in quarter-slots
    { link: 'abis', km: 100 },
    // the mobile network's door out in every era (today's UPF, 2010's GGSN): here the MSC and its modems (IWF)
    { at: 'mobile-core', node: 'msc', in: 'internet' },
    // the IWF's modem call, as a 64 kbit/s slot of an E1 between the switches (SS7 sets it up)
    { link: 'trunk', km: 15 },
    { at: 'exchange', in: 'internet' },
    // from here on it's the dial-up's way: a PRI into the ISP's rack of modems
    { link: 'pri', km: 20 },
    { at: 'bng', node: 'modem-bank', in: 'internet', owner: 'isp' },
    { link: 'ethernet', km: 0.005, rate: { down: 10e6, up: 10e6 } },
  ],
  layout: {
    // the same street, so the trip in time only swaps the device and the mast
    overview: onTheGo.layout!.overview,
    internet: {
      landscape: {
        nodes: { 'cell-tower': [70, 800, 100], bsc: [90, 490, 110], 'mobile-core': [240, 300, 120], exchange: [380, 700, 110], bng: [620, 480, 120, 'above'] },
        links: { 'exchange-bng': { bend: -0.2 } },
      },
      portrait: {
        nodes: { 'cell-tower': [100, 1520, 110], bsc: [570, 1485, 110], 'mobile-core': [805, 1475, 120, 'above'], exchange: [790, 1105, 120], bng: [480, 975, 120, 'above'] },
        links: { 'exchange-bng': { bend: 0.4 }, 'bng-core': { bend: -0.1 } },
        owners: { isp: [250, 1075] },
      },
    },
  },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Circuit_Switched_Data', title: 'Circuit Switched Data', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/GSM', title: 'GSM', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Circuit_Switched_Data', title: 'Circuit Switched Data', level: 'both', lang: 'de' },
  ],
});
