import { defineNode } from '$core/define';

// A big network's router in the 1990s: a tall chassis full of line cards, where leased lines and the backbone's ATM
// circuits meet. It looks up every packet's address in its table (no MPLS labels yet).
export default defineNode({
  kind: 'device',
  role: 'router',
});
