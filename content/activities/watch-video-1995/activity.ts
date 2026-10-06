import { defineActivity } from '$core/define';
import watchVideo from '../watch-video/activity';

// "Get something big from far away", in 1995 (#59): a web page with a picture, not a video. Plain HTTP over TCP: SSL
// had just come out for shops, and video was barely possible on a modem. The route and layout are the base's (its
// segments have 1995 variants); the far end is a small server room, not a data centre, so that group is drawn by it.
const [video] = watchVideo.flows;
// the page isn't played as it comes, so it has no play time
const { plays: _plays, ...down } = video.packets[1];
export default defineActivity({
  ...watchVideo,
  variantOf: 'watch-video',
  era: '1995',
  groups: ['internet', { id: 'datacentre', in: 'internet', node: 'server-room' }],
  flows: [
    {
      id: 'page',
      stack: ['ip', 'tcp', 'http'],
      // Windows 95 picked its client ports from 1025 to 5000; the web server listens on port 80
      ports: { client: 1031, server: 80 },
      // the page and its picture: 40 kB
      packets: [video.packets[0], { ...down, kind: 'page', size: 40_000 }],
    },
  ],
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Web_page', title: 'Web page', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Webseite', title: 'Webseite', level: 'both', lang: 'de' },
    { url: 'https://www.rfc-editor.org/rfc/rfc1945', title: 'RFC 1945: HTTP/1.0 (1996)', level: 'nerd', lang: 'en' },
  ],
});
