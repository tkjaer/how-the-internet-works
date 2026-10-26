import { defineNode } from '$core/define';

// A GSM base station controller (BSC): it runs dozens of masts, gives each call its time slot and hands a phone on
// from mast to mast. It doesn't open the call; it switches its quarter-slots on towards the mobile switch.
export default defineNode({
  kind: 'device',
  role: 'bridge',
});
