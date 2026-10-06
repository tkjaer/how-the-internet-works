import { defineActivity } from '$core/define';
import watchVideo from '../watch-video/activity';

// "Get something big from far away", in 2010 (#59): a small video, fetched as one file over plain HTTP (video sites
// moved to HTTPS a few years later). The route and layout are the base's (its data centre has a 2010 variant, a
// three-tier tree); that group is drawn by a colocation hall, not today's PoP, for its own backdrop.
const [video] = watchVideo.flows;
export default defineActivity({
  ...watchVideo,
  variantOf: 'watch-video',
  era: '2010',
  groups: ['internet', { id: 'datacentre', in: 'internet', node: 'colocation' }],
  flows: [
    {
      ...video,
      stack: ['ip', 'tcp', 'http'],
      // Windows 7 picks its client ports from 49152 up; the video server listens on port 80
      ports: { client: 50112, server: 80 },
      // the same 3 minutes in 360p (YouTube's usual then, about 0.75 Mbit/s)
      packets: [video.packets[0], { ...video.packets[1], size: 17_000_000 }],
    },
  ],
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Progressive_download', title: 'Progressive download', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Progressive_Download', title: 'Progressive Download', level: 'both', lang: 'de' },
  ],
});
