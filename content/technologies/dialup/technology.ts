import { defineTechnology } from '$core/define';

// Dial-up (the 1990s): the computer's modem phones the ISP. The call is one circuit through the telephone network,
// copper to the exchange and a 64 kbit/s timeslot on to the ISP's modems, carrying PPP as whistles and hiss.
export default defineTechnology({
  look: 'cable',
  colour: '#c25b4a',
  stack: ['ppp'],
  dive: 'modem-call',
  // V.34 (1994): 28.8 kbit/s each way, at best
  rate: { down: 28_800, up: 28_800 },
});
