import { defineNode } from '$core/define';

// A laptop of the mid-1990s with a GSM phone on a cable to the data card in its side (a PC card, like Nokia's
// Cellular Data Card on a Nokia 2110): the laptop dials out through the phone at 9.6 kbit/s.
export default defineNode({
  kind: 'device',
  role: 'endpoint',
});
