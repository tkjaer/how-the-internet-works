import { defineScene } from '$core/define';

export default defineScene({
  explains: 'layer',
  learnMore: [
    { url: 'https://simple.wikipedia.org/wiki/Transmission_Control_Protocol', title: 'TCP (Simple English)', level: 'kid', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Transmission_Control_Protocol', title: 'Transmission Control Protocol', level: 'both', lang: 'da' },
    { url: 'https://en.wikipedia.org/wiki/Transmission_Control_Protocol', title: 'Transmission Control Protocol', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Transmission_Control_Protocol', title: 'Transmission Control Protocol', level: 'both', lang: 'de' },
    { url: 'https://www.rfc-editor.org/rfc/rfc9293', title: 'RFC 9293: TCP', level: 'nerd', lang: 'en', eras: ['today'] },
    // RFC 9293 (2022) replaced it: before then TCP was RFC 793's
    { url: 'https://www.rfc-editor.org/rfc/rfc793', title: 'RFC 793: TCP', level: 'nerd', lang: 'en', eras: ['1995', '2010'] },
  ],
});
