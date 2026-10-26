import { defineNode } from '$core/define';

// The origin: the video company's main copy, in object storage in a cloud region far away (a side branch: only cache
// misses go there)
export default defineNode({
  kind: 'device',
  role: 'endpoint',
});
