import { defineTechnology } from '$core/define';

// The short fibres inside one company's data centre: between its edge router, load balancers, spines and racks (a
// leaf–spine fabric)
export default defineTechnology({
  look: 'fibre',
  colour: '#5a8fc8',
  stack: ['ethernet'],
  dive: 'fibre-light',
  // 100 Gbit/s between the fabric's switches
  rate: { down: 100e9, up: 100e9 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Data_center', title: 'Data center', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Rechenzentrum', title: 'Rechenzentrum', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Terabit_Ethernet', title: '200G and 400G Ethernet', level: 'nerd', lang: 'en', eras: ['today'] },
  ],
});
