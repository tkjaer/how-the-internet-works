import { defineNode } from '$core/define';

// A spine switch of the data centre's leaf–spine (Clos) fabric; its dive shows the many equal roads (ECMP)
export default defineNode({
  kind: 'device',
  role: 'router',
  dive: 'leaf-spine',
});
