import { defineNode } from '$core/define';

// The data centre's edge router: its door to the exchange, where it speaks BGP for the video company
export default defineNode({
  kind: 'device',
  role: 'router',
});
