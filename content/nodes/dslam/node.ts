import { defineNode } from '$core/define';

// The street cabinet on the phone line: a DSLAM ends the copper pairs of the street and bridges their frames onto fibre.
export default defineNode({
  kind: 'device',
  role: 'bridge',
});
