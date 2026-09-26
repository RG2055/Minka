// Only reached for paths that are not a file in dist/: a folder address
// ("/", "/kalendars/") gets its index.html, as GitHub Pages serves it.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  }
};
