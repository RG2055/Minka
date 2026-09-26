const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Max-Age': '86400'
};

// ── Login check ──────────────────────────────────────────────────────────
// The app sends the same bearer token it uses for minka-api; that worker is
// asked (service binding AUTH) whether it is valid, so the password lives in
// one place. While older cached clients still call without a token, a missing
// token is only logged; REQUIRE_AUTH = "1" turns it into a 401. A wrong token
// is always refused.
const GOOD_TOKENS = new Map();
async function checkAuth(request, env) {
  const header = request.headers.get('authorization') || '';
  if (!header) return 'missing';
  const until = GOOD_TOKENS.get(header);
  if (until && until > Date.now()) return 'ok';
  if (!env.AUTH) return 'unchecked';
  try {
    const r = await env.AUTH.fetch('https://minka-api/api/me', { headers: { authorization: header } });
    if (r.ok) {
      if (GOOD_TOKENS.size > 50) GOOD_TOKENS.clear();
      GOOD_TOKENS.set(header, Date.now() + 10 * 60000);
      return 'ok';
    }
    return r.status === 401 ? 'bad' : 'unchecked';
  } catch (_e) {
    // minka-api briefly unreachable: do not lock people out of coffee.
    return 'unchecked';
  }
}
function authRefusal(state, env, path, method) {
  if (state === 'bad') return 'Unauthorized';
  if (state === 'missing') {
    if (env.REQUIRE_AUTH === '1') return 'Unauthorized';
    console.log(JSON.stringify({ message: 'request without login', path, method }));
  }
  return '';
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

async function readJson(request, maxBytes = 16 * 1024) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > maxBytes || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('body too large');
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (_e) {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function cleanDate(value) {
  const s = String(value || '').trim();
  const match = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return '';
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 2020 || year > 2100) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? s : '';
}

const TOTALS_CACHE_KEY = new Request('https://minka-coffee.cache/totals');
const edgeCache = () => (typeof caches !== 'undefined' ? caches.default : null);

function cleanMonth(value) {
  const match = String(value || '').trim().match(/^(\d{2})\.(\d{4})$/);
  if (!match) return '';
  const month = Number(match[1]);
  const year = Number(match[2]);
  return month >= 1 && month <= 12 && year >= 2020 && year <= 2100 ? match[1] + '.' + match[2] : '';
}

function cleanWorker(value) {
  const worker = String(value || '').trim().replace(/\s+/g, ' ');
  if (!worker || worker.length > 64 || /[<>&"'`\\\u0000-\u001f\u007f]/.test(worker)) return '';
  return worker;
}

function cleanDelta(value) {
  const n = Math.trunc(Number(value) || 0);
  return n === -2 || n === -1 || n === 1 || n === 2 ? n : 0;
}

// The drinks the app ships with today. The list is here so a reply always
// carries every known source, even one nobody has logged yet — but it is not a
// gate: an unknown slug that looks like a source is stored as it is, so a drink
// added in the app starts counting before this worker is redeployed. Only the
// bookkeeping value 'adjustment' and junk are turned away.
const KNOWN_SOURCES = ['philips', 'lofbergs', 'narvesen', 'monster', 'monsterultra', 'redbull', 'brite', 'cupcoffee', 'mycoffee'];
const SOURCE_ALIASES = {
  'löfbergs': 'lofbergs', 'monster-ultra': 'monsterultra', monsterwhite: 'monsterultra', ultra: 'monsterultra',
  'red-bull': 'redbull', redbul: 'redbull', 'cup-coffee': 'cupcoffee', cita: 'cupcoffee', other: 'cupcoffee',
  'my-coffee': 'mycoffee', mana: 'mycoffee', manakafija: 'mycoffee'
};

function cleanSource(value) {
  const s = String(value || '').trim().toLowerCase();
  if (!s) return 'philips';
  if (SOURCE_ALIASES[s]) return SOURCE_ALIASES[s];
  if (/^[a-z][a-z0-9-]{1,23}$/.test(s) && s !== 'adjustment') return s;
  return 'philips';
}

function cleanSize(value) {
  const s = String(value || '').trim().toUpperCase();
  return /^(M|L|XL)$/.test(s) ? s : '';
}

function cleanPriceCents(value) {
  // The client always sends an integer number of cents (priceCents), so treat the
  // value as cents directly. The old "n > 50 ? n : n*100" heuristic wrongly ×100'd
  // any price under 0.50 € (e.g. 40 cents -> 40.00 €).
  if (value === undefined || value === null || value === '') return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const cents = Math.round(n);
  if (cents < 0) return 0;
  if (cents > 5000) return 5000;
  return cents;
}

function ensureDetail(details, worker) {
  if (!Object.prototype.hasOwnProperty.call(details, worker)) {
    const sources = {};
    for (const key of KNOWN_SOURCES) sources[key] = 0;
    details[worker] = { sources, spendCents: 0 };
  }
  return details[worker];
}

async function readCoffeeEvents(env, whereSql, binds) {
  try {
    // Net all deltas per source so a "minus" (logged with its source) reduces that
    // source's count. Everything except the bookkeeping rows is aggregated:
    // legacy source-less removals were logged as 'adjustment' and are ignored,
    // and a drink added in the app is counted without touching this worker.
    const known = "source IS NOT NULL AND source <> '' AND source <> 'adjustment'";
    const where = whereSql ? `${whereSql} AND ${known}` : `WHERE ${known}`;
    const rows = await env.COFFEE_DB
      .prepare(`
        SELECT worker, source,
          SUM(delta) AS total,
          SUM(CASE WHEN delta > 0 THEN price_cents ELSE 0 END) AS spend_cents
        FROM coffee_events
        ${where}
        GROUP BY worker, source
      `)
      .bind(...binds)
      .all();
    return rows.results || [];
  } catch (_e) {
    // Old deployed D1 databases may not have the details table until the
    // migration is applied. Keep the legacy count API alive.
    return [];
  }
}

async function readCoffeeEventsByDay(env, pattern) {
  try {
    const rows = await env.COFFEE_DB
      .prepare(`
        SELECT date, worker, source,
          SUM(delta) AS total,
          SUM(CASE WHEN delta > 0 THEN price_cents ELSE 0 END) AS spend_cents
        FROM coffee_events
        WHERE date LIKE ?1 AND source IS NOT NULL AND source <> '' AND source <> 'adjustment'
        GROUP BY date, worker, source
      `)
      .bind(pattern)
      .all();
    return rows.results || [];
  } catch (_e) {
    return [];
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/api/coffee') {
      return json({ ok: false, error: 'not found' }, 404);
    }

    if (!env.COFFEE_DB) {
      return json({ ok: false, error: 'COFFEE_DB binding missing' }, 500);
    }

    const refusal = authRefusal(await checkAuth(request, env), env, url.pathname, request.method);
    if (refusal) return json({ ok: false, error: refusal }, 401);

    if (request.method === 'GET') {
      // All-time totals per worker (used by the stats leaderboard) — sums every
      // day in D1 so past days logged on other devices are included.
      if (url.searchParams.get('totals')) {
        // All-time totals scan every row, so the reply is shared for 30 s at
        // the edge; a coffee added or removed clears it (see the POST below).
        const cached = edgeCache() ? await edgeCache().match(TOTALS_CACHE_KEY).catch(() => null) : null;
        if (cached) return json(await cached.json());
        const rows = await env.COFFEE_DB
          .prepare('SELECT worker, SUM(count) AS total FROM coffee_counts GROUP BY worker')
          .all();
        const totals = Object.create(null);
        const details = Object.create(null);
        for (const row of rows.results || []) {
          totals[row.worker] = Math.max(0, Number(row.total) || 0);
        }
        const eventRows = await readCoffeeEvents(env, '', []);
        for (const row of eventRows) {
          const worker = row.worker;
          const source = cleanSource(row.source);
          const d = ensureDetail(details, worker);
          d.sources[source] = (d.sources[source] || 0) + Math.max(0, Number(row.total) || 0);
          d.spendCents += Math.max(0, Number(row.spend_cents) || 0);
        }
        Object.keys(totals).forEach(worker => {
          const d = ensureDetail(details, worker);
          const detailed = Object.values(d.sources).reduce((a, b) => a + (Number(b) || 0), 0);
          if (detailed < totals[worker]) d.sources.philips += totals[worker] - detailed;
        });
        const reply = { ok: true, totals, details };
        if (edgeCache()) await edgeCache().put(TOTALS_CACHE_KEY, new Response(JSON.stringify(reply), {
          headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' }
        })).catch(() => {});
        return json(reply);
      }

      // Every day of one month in a single reply, so the month line and stats
      // read the same numbers as the database instead of stitching together
      // whichever days a device happened to cache (and never refreshing them).
      const month = cleanMonth(url.searchParams.get('month'));
      if (month) {
        const pattern = '__.' + month;
        const rows = await env.COFFEE_DB
          .prepare('SELECT date, worker, count FROM coffee_counts WHERE date LIKE ?1')
          .bind(pattern)
          .all();
        const days = Object.create(null);
        const day = (date) => days[date] || (days[date] = { counts: Object.create(null), details: Object.create(null) });
        for (const row of rows.results || []) {
          day(row.date).counts[row.worker] = Math.max(0, Number(row.count) || 0);
        }
        const eventRows = await readCoffeeEventsByDay(env, pattern);
        for (const row of eventRows) {
          if (!days[row.date]) continue;
          const d = ensureDetail(days[row.date].details, row.worker);
          d.sources[cleanSource(row.source)] = (d.sources[cleanSource(row.source)] || 0) + Math.max(0, Number(row.total) || 0);
          d.spendCents += Math.max(0, Number(row.spend_cents) || 0);
        }
        for (const date of Object.keys(days)) {
          const { counts, details } = days[date];
          Object.keys(counts).forEach(worker => {
            const d = ensureDetail(details, worker);
            const detailed = Object.values(d.sources).reduce((a, b) => a + (Number(b) || 0), 0);
            if (detailed < counts[worker]) d.sources.philips += counts[worker] - detailed;
          });
        }
        return json({ ok: true, month, days });
      }

      const date = cleanDate(url.searchParams.get('date'));
      if (!date) return json({ ok: false, error: 'date required' }, 400);

      const rows = await env.COFFEE_DB
        .prepare('SELECT worker, count, updated_at FROM coffee_counts WHERE date = ? ORDER BY worker')
        .bind(date)
        .all();

      const counts = Object.create(null);
      const updated = Object.create(null);
      const details = Object.create(null);
      for (const row of rows.results || []) {
        counts[row.worker] = Math.max(0, Number(row.count) || 0);
        updated[row.worker] = Number(row.updated_at) || 0;
      }
      const eventRows = await readCoffeeEvents(env, 'WHERE date = ?1', [date]);
      for (const row of eventRows) {
        const worker = row.worker;
        const source = cleanSource(row.source);
        const d = ensureDetail(details, worker);
        d.sources[source] = (d.sources[source] || 0) + Math.max(0, Number(row.total) || 0);
        d.spendCents += Math.max(0, Number(row.spend_cents) || 0);
      }
      Object.keys(counts).forEach(worker => {
        const d = ensureDetail(details, worker);
        const detailed = Object.values(d.sources).reduce((a, b) => a + (Number(b) || 0), 0);
        if (detailed < counts[worker]) d.sources.philips += counts[worker] - detailed;
      });
      return json({ ok: true, date, counts, updated, details });
    }

    if (request.method === 'POST') {
      const body = await readJson(request);
      if (!body) return json({ ok: false, error: 'invalid body' }, 400);
      const date = cleanDate(body.date);
      const worker = cleanWorker(body.worker);
      const delta = cleanDelta(body.delta);
      const hasSource = body.source !== undefined && body.source !== null && body.source !== '';
      const source = cleanSource(body.source);
      const size = cleanSize(body.size);
      // The picker owns the current price (including local overrides), so persist
      // exactly the validated cents it sent instead of silently changing Löfbergs.
      const priceCents = cleanPriceCents(body.priceCents ?? body.price);
      if (!date) return json({ ok: false, error: 'date required' }, 400);
      if (!worker) return json({ ok: false, error: 'worker required' }, 400);
      if (!delta) return json({ ok: false, error: 'delta required' }, 400);

      const now = Date.now();
      // NOTE: the update must use the RAW delta (?3), not excluded.count —
      // excluded.count is already clamped to max(0, delta), which silently
      // turned negative deltas into +0 and made "minus a coffee" a no-op.
      await env.COFFEE_DB
        .prepare(`
          INSERT INTO coffee_counts (date, worker, count, updated_at)
          VALUES (?1, ?2, max(0, ?3), ?4)
          ON CONFLICT(date, worker) DO UPDATE SET
            count = max(0, coffee_counts.count + ?3),
            updated_at = ?4
        `)
        .bind(date, worker, delta, now)
        .run();

      try {
        await env.COFFEE_DB
          .prepare(`
            INSERT INTO coffee_events (date, worker, source, size, price_cents, delta, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
          `)
          .bind(date, worker, delta > 0 ? source : (hasSource ? source : 'adjustment'), delta > 0 ? size : '', delta > 0 ? priceCents : 0, delta, now)
          .run();
      } catch (_e) {}

      if (edgeCache()) await edgeCache().delete(TOTALS_CACHE_KEY).catch(() => {});

      const row = await env.COFFEE_DB
        .prepare('SELECT count, updated_at FROM coffee_counts WHERE date = ? AND worker = ?')
        .bind(date, worker)
        .first();

      return json({
        ok: true,
        date,
        worker,
        source,
        size,
        priceCents: delta > 0 ? priceCents : 0,
        count: Math.max(0, Number(row && row.count) || 0),
        updatedAt: Number(row && row.updated_at) || now
      });
    }

    return json({ ok: false, error: 'method not allowed' }, 405);
  }
};
