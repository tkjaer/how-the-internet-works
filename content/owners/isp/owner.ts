import { defineOwner } from '$core/define';

// Your internet company: the access network, its core and its border routers are one network (one AS).
export default defineOwner({
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Autonomous_system_(Internet)', title: 'Autonomous system', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Autonomes_System', title: 'Autonomes System', level: 'nerd', lang: 'de' },
  ],
});
