// Only reached for paths that are not a file in dist/: a folder address
// ("/", "/kalendars/") gets its index.html, as GitHub Pages serves it, and a
// folder without the closing slash ("/rad") is sent to "/rad/" like there
// (its page links relative to the folder).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    const last = url.pathname.slice(url.pathname.lastIndexOf('/') + 1);
    if (last && !last.includes('.')) {
      const probe = new URL(url);
      probe.pathname += '/index.html';
      const folder = await env.ASSETS.fetch(new Request(probe, { method: 'HEAD' }));
      if (folder.ok) {
        url.pathname += '/';
        return Response.redirect(url.toString(), 301);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
