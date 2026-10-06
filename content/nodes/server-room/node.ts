import { defineNode } from '$core/define';

// A web site's server room in 1995 (#59): a small room at a university or a company, with a router on the T1, a hub
// and a few tower computers on shelves. It stands in for today's data centre (the activity's group spec names it), so
// the instance id `datacentre`, and every URL into it, is the same in every era.
export default defineNode({
  kind: 'network',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Server_room', title: 'Server room', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Server', title: 'Server', level: 'both', lang: 'da' },
    { url: 'https://en.wikipedia.org/wiki/Web_hosting_service', title: 'Web hosting service', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Webhosting', title: 'Webhosting', level: 'nerd', lang: 'de' },
  ],
});
