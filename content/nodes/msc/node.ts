import { defineNode } from '$core/define';

// A GSM mobile switching centre (MSC) of the 1990s: the mobile network's telephone exchange. For a data call its
// interworking function (IWF), a rack of modems, ends the radio link protocol and calls on as an ordinary modem.
export default defineNode({
  kind: 'device',
  role: 'bridge',
});
