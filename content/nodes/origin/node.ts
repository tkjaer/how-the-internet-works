import { defineNode } from '$core/define';

// The origin: the video company's main copy, in object storage in a cloud region far away (a side branch: only cache
// misses go there)
export default defineNode({
  kind: 'device',
  role: 'endpoint',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Object_storage', title: 'Object storage', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Objektspeicher', title: 'Objektspeicher', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Replication_(computing)', title: 'Replication', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Replikation_(Datenverarbeitung)', title: 'Replikation (Datenverarbeitung)', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Cloud_storage', title: 'Cloud storage', level: 'both', lang: 'en' },
  ],
});
