import { defineNode } from '$core/define';

// The street cabinet on the phone line: a DSLAM ends the copper pairs of the street and bridges their frames onto fibre.
export default defineNode({
  kind: 'device',
  role: 'bridge',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Digital_subscriber_line_access_multiplexer', title: 'DSLAM', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Digital_Subscriber_Line_Access_Multiplexer', title: 'Digital Subscriber Line Access Multiplexer', level: 'nerd', lang: 'de' },
  ],
});
