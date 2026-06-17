const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Max-Age': '86400'
};

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

async function readJson(request) {
  try {
    return await request.json();
  } catch (_e) {
    return {};
  }
}

function cleanDate(value) {
  const s = String(value || '').trim();
  return /^\d{2}\.\d{2}\.\d{4}$/.test(s) ? s : '';
}

function cleanWorker(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

function cleanDelta(value) {
  const n = Math.trunc(Number(value) || 0);
  if (n > 20) return 20;
  if (n < -20) return -20;
  return n;
}

function cleanSource(value) {
  const s = String(value || 'philips').trim().toLowerCase();
  if (s === 'lofbergs' || s === 'löfbergs') return 'lofbergs';
  if (s === 'narvesen') return 'narvesen';
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
  if (!details[worker]) {
    details[worker] = {
      sources: { philips: 0, lofbergs: 0, narvesen: 0 },
      spendCents: 0
    };
  }
  return details[worker];
}

async function readCoffeeEvents(env, whereSql, binds) {
  try {
    // Net all deltas per source so a "minus" (logged with its source) reduces that
    // source's count. Only the three real sources are aggregated — legacy
    // source-less removals were logged as 'adjustment' and are ignored here.
    const known = "source IN ('philips','lofbergs','narvesen')";
    const where = whereSql ? `${whereSql} AND ${known}` : `WHERE ${known}`;
    const rows = await env.COFFEE_DB
      .prepare(`
        SELECT worker, source,
          SUM(delta) AS total,
          SUM(CASE WHEN delta > 0 THEN price_cents * delta ELSE 0 END) AS spend_cents
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

    if (request.method === 'GET') {
      // All-time totals per worker (used by the stats leaderboard) — sums every
      // day in D1 so past days logged on other devices are included.
      if (url.searchParams.get('totals')) {
        const rows = await env.COFFEE_DB
          .prepare('SELECT worker, SUM(count) AS total FROM coffee_counts GROUP BY worker')
          .all();
        const totals = {};
        const details = {};
        for (const row of rows.results || []) {
          totals[row.worker] = Math.max(0, Number(row.total) || 0);
        }
        const eventRows = await readCoffeeEvents(env, '', []);
        for (const row of eventRows) {
          const worker = row.worker;
          const source = cleanSource(row.source);
          const d = ensureDetail(details, worker);
          d.sources[source] = Math.max(0, Number(row.total) || 0);
          d.spendCents += Math.max(0, Number(row.spend_cents) || 0);
        }
        Object.keys(totals).forEach(worker => {
          const d = ensureDetail(details, worker);
          const detailed = Object.values(d.sources).reduce((a, b) => a + (Number(b) || 0), 0);
          if (detailed < totals[worker]) d.sources.philips += totals[worker] - detailed;
        });
        return json({ ok: true, totals, details });
      }

      const date = cleanDate(url.searchParams.get('date'));
      if (!date) return json({ ok: false, error: 'date required' }, 400);

      const rows = await env.COFFEE_DB
        .prepare('SELECT worker, count, updated_at FROM coffee_counts WHERE date = ? ORDER BY worker')
        .bind(date)
        .all();

      const counts = {};
      const updated = {};
      const details = {};
      for (const row of rows.results || []) {
        counts[row.worker] = Math.max(0, Number(row.count) || 0);
        updated[row.worker] = Number(row.updated_at) || 0;
      }
      const eventRows = await readCoffeeEvents(env, 'WHERE date = ?1', [date]);
      for (const row of eventRows) {
        const worker = row.worker;
        const source = cleanSource(row.source);
        const d = ensureDetail(details, worker);
        d.sources[source] = Math.max(0, Number(row.total) || 0);
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
      const date = cleanDate(body.date);
      const worker = cleanWorker(body.worker);
      const delta = cleanDelta(body.delta);
      const hasSource = body.source !== undefined && body.source !== null && body.source !== '';
      const source = cleanSource(body.source);
      const size = cleanSize(body.size);
      const priceCents = source === 'lofbergs' ? 140 : cleanPriceCents(body.priceCents ?? body.price);
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
