import { defineScene } from '$core/define';

export default defineScene({
  explains: 'layer',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Routing_table', title: 'Routing table', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Routingtabelle', title: 'Routingtabelle', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Network_address_translation', title: 'Network address translation', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Netzwerkadress%C3%BCbersetzung', title: 'Netzwerkadressübersetzung', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Carrier-grade_NAT', title: 'Carrier-grade NAT', level: 'nerd', lang: 'en', eras: ['2010', 'today'] },
    { url: 'https://de.wikipedia.org/wiki/Carrier-grade_NAT', title: 'Carrier-grade NAT', level: 'nerd', lang: 'de', eras: ['2010', 'today'] },
  ],
});
