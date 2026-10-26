import { defineNode } from '$core/define';

// A web server in 1995: a tower computer with one program (httpd) that reads each request and sends the file from its
// own disk. No cache in front of it and no copy anywhere else: this one computer is the web site.
export default defineNode({
  kind: 'device',
  role: 'endpoint',
  dive: 'server-inside',
});
