// rgapp.page: serves dist/ (built by scripts/build-pages.mjs) and sets how
// long browsers may keep each answer, plus a few safety headers.
//
// Caching:
//   - a file asked for with ?v=… never changes under that address (a change
//     gets a new ?v=), so the browser keeps it a year without asking again.
//     The service worker already treats these files the same way.
//   - HTML, the service worker and everything without ?v= is checked with the
//     server on every load (a cheap 304 when nothing changed), so a deploy
//     always lands.
// Folders: "/" and "/kalendars/" get their index.html, as GitHub Pages serves
// them, and "/rad" is sent to "/rad/" (its page links relative to the folder).
const LONG = 'public, max-age=31536000, immutable';
const CHECK = 'no-cache';
const SAFETY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // The app frames its own pages (calendar, player); nobody else may.
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

function finish(response, versioned) {
  const out = new Response(response.body, response);
  if (response.ok || response.status === 304) out.headers.set('Cache-Control', versioned ? LONG : CHECK);
  for (const [k, v] of Object.entries(SAFETY)) out.headers.set(k, v);
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const versioned = url.searchParams.has('v');
    if (url.pathname.endsWith('/')) {
      const index = new URL(url);
      index.pathname += 'index.html';
      return finish(await env.ASSETS.fetch(new Request(index, request)), false);
    }
    const last = url.pathname.slice(url.pathname.lastIndexOf('/') + 1);
    if (last && !last.includes('.')) {
      const probe = new URL(url);
      probe.pathname += '/index.html';
      const folder = await env.ASSETS.fetch(new Request(probe, { method: 'HEAD' }));
      if (folder.ok) {
        url.pathname += '/';
        return finish(Response.redirect(url.toString(), 301), false);
      }
    }
    return finish(await env.ASSETS.fetch(request), versioned && !/\.html$/.test(url.pathname));
  }
};
