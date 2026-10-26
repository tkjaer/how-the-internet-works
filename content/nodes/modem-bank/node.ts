import { defineNode } from '$core/define';

// The ISP's modem bank in the 1990s (a remote access server): a rack of digital modems on the phone company's ISDN
// lines. It answers the call, logs you in and gives your computer an address over PPP, then routes your packets.
export default defineNode({
  kind: 'device',
  role: 'router',
});
