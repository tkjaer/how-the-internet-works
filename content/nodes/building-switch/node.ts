import { defineNode } from '$core/define';

// The switch in the basement of a block of flats: copper up to every flat, one fibre out to the ISP.
export default defineNode({
  kind: 'device',
  role: 'bridge',
});
