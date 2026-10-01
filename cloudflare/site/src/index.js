// rgapp.page: serves dist/ (built by scripts/build-pages.mjs) and sets how
// long browsers may keep each answer, plus the safety headers (CSP among
// them), /.well-known/security.txt and the CSP report endpoint.
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
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // Content Security Policy, enforced part: no plugins, no <base> hijack, no
  // framing by other sites, no form posts elsewhere. None of these are used.
  'Content-Security-Policy': "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'",
  // The full policy runs in report-only mode first: the browser keeps loading
  // everything and posts what it would have blocked to /csp-report (Workers
  // logs). Once the reports are clean it moves into the enforced header.
  'Content-Security-Policy-Report-Only': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.youtube.com https://s.ytimg.com",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "font-src 'self' data: https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://lacitis.pages.dev https://www.youtube.com https://www.youtube-nocookie.com https://grafika-planotajs.pages.dev https://pusdieninas.pages.dev",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    'report-uri /csp-report',
    'report-to csp'
  ].join('; '),
  'Reporting-Endpoints': 'csp="/csp-report"'
};

// Where to report a security problem (RFC 9116). Renew Expires before it passes.
const SECURITY_TXT = [
  'Contact: mailto:security@rgapp.page',
  'Expires: 2027-10-01T00:00:00.000Z',
  'Preferred-Languages: lv, en',
  'Canonical: https://rgapp.page/.well-known/security.txt',
  'Policy: https://rgapp.page/privatums.html',
  ''
].join('\n');

// CSP violation reports (both the old report-uri and the Reporting API
// format). Only the blocked address, the rule and the page path are logged.
async function cspReport(request) {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const text = (await request.text()).slice(0, 16384);
  let items = [];
  try {
    const data = JSON.parse(text);
    items = Array.isArray(data) ? data.map((r) => r && r.body) : [data && data['csp-report']];
  } catch { /* not JSON: ignore */ }
  for (const r of items.filter(Boolean).slice(0, 20)) {
    const page = r.documentURL || r['document-uri'] || '';
    console.log(JSON.stringify({
      csp: r.effectiveDirective || r['effective-directive'] || r['violated-directive'],
      blocked: String(r.blockedURL || r['blocked-uri'] || '').slice(0, 200),
      page: page ? new URL(page, 'https://rgapp.page').pathname : '',
      source: String(r.sourceFile || r['source-file'] || '').slice(0, 200),
      line: r.lineNumber || r['line-number'] || 0,
      mode: r.disposition || ''
    }));
  }
  return new Response(null, { status: 204 });
}

function finish(response, versioned) {
  const out = new Response(response.body, response);
  if (response.ok || response.status === 304) out.headers.set('Cache-Control', versioned ? LONG : CHECK);
  for (const [k, v] of Object.entries(SAFETY)) out.headers.set(k, v);
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/csp-report') return cspReport(request);
    if (url.pathname === '/.well-known/security.txt' || url.pathname === '/security.txt') {
      return finish(new Response(SECURITY_TXT, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }), false);
    }
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
