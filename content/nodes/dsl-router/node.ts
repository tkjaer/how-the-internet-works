import { defineNode } from '$core/define';

// A home router with a DSL modem inside, for the phone line: routes and NATs like the fibre one, then speaks tones.
export default defineNode({
  kind: 'device',
  role: 'nat',
  dive: 'router-inside',
});
