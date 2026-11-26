// Serve the prototypes at http://127.0.0.1:8012/__rg2/... (same origin as Minka, so its stylesheets/assets load as-is).
const fs = require('fs');
module.exports = async function routeProto(ctx) {
  await ctx.route(/^http:\/\/127\.0\.0\.1:8012\/__rg2\/(.*?)(\?.*)?$/, (r) => {
    const m = /\/__rg2\/([^?]*)/.exec(r.request().url()); const f = __dirname + '/' + (m[1].startsWith('dist/') || m[1].startsWith('pages/') ? m[1] : m[1] === 'days.json' ? 'data/days.json' : m[1]);
    const type = f.endsWith('.html') ? 'text/html' : f.endsWith('.json') ? 'application/json' : 'text/javascript';
    try { r.fulfill({ status: 200, contentType: type, body: fs.readFileSync(f) }); } catch (_) { r.fulfill({ status: 404, body: '' }); }
  });
};
