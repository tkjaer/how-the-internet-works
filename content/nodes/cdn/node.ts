import { defineNode } from '$core/define';

// The cache server in the video company's data centre; its dive opens it up: the app in its container, the cache
// (a hit, or a miss that goes back to the origin) and the disks the video lives on
export default defineNode({
  kind: 'device',
  role: 'endpoint',
  dive: 'server-inside',
});
