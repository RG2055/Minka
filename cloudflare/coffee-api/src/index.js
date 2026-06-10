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
        for (const row of rows.results || []) {
          totals[row.worker] = Math.max(0, Number(row.total) || 0);
        }
        return json({ ok: true, totals });
      }

      const date = cleanDate(url.searchParams.get('date'));
      if (!date) return json({ ok: false, error: 'date required' }, 400);

      const rows = await env.COFFEE_DB
        .prepare('SELECT worker, count, updated_at FROM coffee_counts WHERE date = ? ORDER BY worker')
        .bind(date)
        .all();

      const counts = {};
      const updated = {};
      for (const row of rows.results || []) {
        counts[row.worker] = Math.max(0, Number(row.count) || 0);
        updated[row.worker] = Number(row.updated_at) || 0;
      }
      return json({ ok: true, date, counts, updated });
    }

    if (request.method === 'POST') {
      const body = await readJson(request);
      const date = cleanDate(body.date);
      const worker = cleanWorker(body.worker);
      const delta = cleanDelta(body.delta);
      if (!date) return json({ ok: false, error: 'date required' }, 400);
      if (!worker) return json({ ok: false, error: 'worker required' }, 400);
      if (!delta) return json({ ok: false, error: 'delta required' }, 400);

      const now = Date.now();
      await env.COFFEE_DB
        .prepare(`
          INSERT INTO coffee_counts (date, worker, count, updated_at)
          VALUES (?, ?, max(0, ?), ?)
          ON CONFLICT(date, worker) DO UPDATE SET
            count = max(0, coffee_counts.count + excluded.count),
            updated_at = excluded.updated_at
        `)
        .bind(date, worker, delta, now)
        .run();

      const row = await env.COFFEE_DB
        .prepare('SELECT count, updated_at FROM coffee_counts WHERE date = ? AND worker = ?')
        .bind(date, worker)
        .first();

      return json({
        ok: true,
        date,
        worker,
        count: Math.max(0, Number(row && row.count) || 0),
        updatedAt: Number(row && row.updated_at) || now
      });
    }

    return json({ ok: false, error: 'method not allowed' }, 405);
  }
};
