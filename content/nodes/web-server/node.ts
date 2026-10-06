import { defineNode } from '$core/define';

// A web server in 1995: a tower computer with one program (httpd) that reads each request and sends the file from its
// own disk. No cache in front of it and no copy anywhere else: this one computer is the web site.
export default defineNode({
  kind: 'device',
  role: 'endpoint',
  dive: 'server-inside',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Web_server', title: 'Web server', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Webserver', title: 'Webserver', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Webserver', title: 'Webserver', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/NCSA_HTTPd', title: 'NCSA HTTPd', level: 'nerd', lang: 'en' },
  ],
});
