import { defineNode } from '$core/define';

// The 3G packet core's serving node: it signs the phone in, tracks where it is and sets up its PDP context (the GTP
// tunnel). With Direct Tunnel the video's packets go past it, so it stands beside the path.
export default defineNode({
  kind: 'device',
  role: 'bridge',
});
