import { defineNode } from '$core/define';

// A 3G base station (NodeB): three sector antennas on a mast, the HSDPA scheduler, and a line back to its RNC.
export default defineNode({
  kind: 'device',
  role: 'bridge',
});
