// =============================================================
// PIEVIENO ŠO KODU SAVĀ CLOUDFLARE WORKER
// =============================================================
// 1. nsTtl funkciju pievieno ĀRPUS fetch handler (augšā, blakus citām helper funkcijām)
// 2. Abus if blokus pievieno IEKŠĀ fetch handler, pirms esošajiem routes
// =============================================================

// ---------- 1. HELPER (ārpus fetch handler) ----------

function nsTtl(dateStr) {
  const [dd, mm, yy] = dateStr.split(".").map(Number);
  const exp = new Date(Date.UTC(yy, mm - 1, dd + 1, 6, 0, 0)); // nākamā diena 08:00 UTC+2
  const ttl = Math.floor((exp.getTime() - Date.now()) / 1000);
  return Math.max(ttl, 120);
}

// ---------- 2. ROUTES (iekšā fetch handler) ----------

// GET /api/ns-order?date=DD.MM.YYYY
if (url.pathname === "/api/ns-order" && method === "GET") {
  const date = url.searchParams.get("date");
  if (!date) return json(request, { ok: false, error: "date required" }, 400);
  const val = await env.MINKA_EMOJI.get("ns::" + date);
  return json(request, val ? JSON.parse(val) : {});
}

// POST /api/ns-order
if (url.pathname === "/api/ns-order" && method === "POST") {
  const body = await readJson(request);
  if (!body?.date) return json(request, { ok: false, error: "date required" }, 400);
  const ttl = nsTtl(body.date);
  await env.MINKA_EMOJI.put("ns::" + body.date, JSON.stringify({
    order: body.order || [],
    sh: typeof body.sh === "number" ? body.sh : 0,
    ei: typeof body.ei === "number" ? body.ei : 2,
    savedAt: body.savedAt || Date.now()
  }), { expirationTtl: ttl });
  return json(request, { ok: true });
}
