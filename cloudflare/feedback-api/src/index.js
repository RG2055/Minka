const REACTIONS = new Set(["excellent", "good", "ok", "bad", "terrible"]);
const MESSAGE_KINDS = new Set(["comment", "suggestion"]);
const FEEDBACK_PATHS = new Set([
  "/api/feedback",
  "/api/feedback/days",
  "/api/feedback/rating",
  "/api/feedback/message"
]);

function corsHeaders(request) {
  const headers = new Headers({
    "access-control-allow-origin": request.headers.get("origin") || "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "cache-control": "no-store",
    "vary": "Origin",
    "x-content-type-options": "nosniff"
  });
  return headers;
}

function json(request, data, status = 200) {
  const headers = corsHeaders(request);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}

async function readLimitedJson(request, maxBytes = 8 * 1024) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes || !request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("body too large");
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

function cleanDay(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2020 || year > 2100) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function cleanReaction(value) {
  const reaction = String(value || "").trim().toLowerCase();
  return REACTIONS.has(reaction) ? reaction : "";
}

function cleanKind(value, optional = false) {
  const kind = String(value || "").trim().toLowerCase();
  if (!kind && optional) return "";
  return MESSAGE_KINDS.has(kind) ? kind : "";
}

function cleanText(value) {
  if (typeof value !== "string") return "";
  const text = value.replace(/\r\n?/g, "\n").trim();
  if (!text || text.length > 700 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return "";
  return text;
}

function cleanClientId(value) {
  const clientId = String(value || "").trim();
  return /^[a-zA-Z0-9_-]{8,80}$/.test(clientId) ? clientId : "";
}

function cleanEditToken(value, optional = false) {
  const token = String(value || "").trim();
  if (!token && optional) return "";
  // 32 random bytes encoded as unpadded base64url are exactly 43 characters.
  return /^[a-zA-Z0-9_-]{43}$/.test(token) ? token : "";
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value) {
  const hex = String(value || "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function digestEditToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return new Uint8Array(digest);
}

async function hashEditToken(token) {
  return bytesToHex(await digestEditToken(token));
}

function timingSafeEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array) || left.byteLength !== right.byteLength) {
    return false;
  }
  if (typeof crypto.subtle.timingSafeEqual === "function") {
    return crypto.subtle.timingSafeEqual(left, right);
  }
  // Node's Web Crypto used by local tests does not expose the Workers-only
  // timingSafeEqual extension. Both inputs are fixed-size SHA-256 digests.
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function ownsMessage(env, clientId, editToken) {
  const result = await env.DB.prepare(
    "SELECT edit_token_hash FROM feedback_messages WHERE client_id = ?1"
  ).bind(clientId).all();
  const row = (result.results || [])[0];
  const expected = hexToBytes(row && row.edit_token_hash);
  if (!expected) return false;
  return timingSafeEqual(await digestEditToken(editToken), expected);
}

function mapMessage(row) {
  return {
    id: Number(row.id),
    clientId: row.client_id,
    date: row.shift_day,
    kind: row.kind,
    text: row.body,
    createdAt: Number(row.created_at) || 0
  };
}

async function getDayGroups(request, env, url) {
  const kind = cleanKind(url.searchParams.get("kind"));
  if (!kind) return json(request, { ok: false, error: "valid kind required" }, 400);
  const requestedLimit = Math.trunc(Number(url.searchParams.get("limit")) || 90);
  const limit = Math.min(180, Math.max(1, requestedLimit));
  const [result, totalResult] = await env.DB.batch([env.DB.prepare(`
    SELECT shift_day, COUNT(*) AS entry_count, MAX(created_at) AS last_activity
    FROM feedback_messages
    WHERE kind = ?1
    GROUP BY shift_day
    ORDER BY shift_day DESC
    LIMIT ?2
  `).bind(kind, limit), env.DB.prepare(`
    SELECT COUNT(*) AS entry_count
    FROM feedback_messages
    WHERE kind = ?1
  `).bind(kind)]);
  const totalRow = (totalResult.results || [])[0];
  return json(request, {
    ok: true,
    kind,
    total: Math.max(0, Number(totalRow && totalRow.entry_count) || 0),
    days: (result.results || []).map((row) => ({
      date: row.shift_day,
      count: Math.max(0, Number(row.entry_count) || 0),
      lastActivity: Math.max(0, Number(row.last_activity) || 0)
    }))
  });
}

async function getFeedback(request, env, url) {
  const date = cleanDay(url.searchParams.get("date"));
  const rawKind = url.searchParams.get("kind");
  const kind = cleanKind(rawKind, true);
  if (!date) return json(request, { ok: false, error: "valid date required" }, 400);
  if (rawKind && !kind) return json(request, { ok: false, error: "invalid kind" }, 400);

  const includeMessages = url.searchParams.get("messages") !== "0";
  const requestedLimit = Math.trunc(Number(url.searchParams.get("limit")) || 50);
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const rawBefore = Math.trunc(Number(url.searchParams.get("before")) || 0);
  const before = rawBefore > 0 ? rawBefore : Number.MAX_SAFE_INTEGER;
  const ratingsQuery = env.DB.prepare(
    "SELECT reaction, count, updated_at FROM feedback_ratings WHERE shift_day = ?1"
  ).bind(date);
  const countsQuery = env.DB.prepare(`
    SELECT kind, COUNT(*) AS entry_count
    FROM feedback_messages
    WHERE shift_day = ?1
    GROUP BY kind
  `).bind(date);
  const messagesQuery = kind
    ? env.DB.prepare(`
        SELECT id, client_id, shift_day, kind, body, created_at
        FROM feedback_messages
        WHERE shift_day = ?1 AND kind = ?2 AND id < ?3
        ORDER BY id DESC LIMIT ?4
      `).bind(date, kind, before, limit + 1)
    : env.DB.prepare(`
        SELECT id, client_id, shift_day, kind, body, created_at
        FROM feedback_messages
        WHERE shift_day = ?1 AND id < ?2
        ORDER BY id DESC LIMIT ?3
      `).bind(date, before, limit + 1);

  const results = includeMessages
    ? await env.DB.batch([ratingsQuery, messagesQuery, countsQuery])
    : await env.DB.batch([ratingsQuery, countsQuery]);
  const ratingResult = results[0];
  const messageResult = includeMessages ? results[1] : { results: [] };
  const countResult = includeMessages ? results[2] : results[1];
  const ratings = {};
  for (const row of ratingResult.results || []) {
    const reaction = cleanReaction(row.reaction);
    if (reaction) ratings[reaction] = Math.max(0, Number(row.count) || 0);
  }
  const messageRows = (messageResult.results || []).slice(0, limit);
  const messages = messageRows.map(mapMessage);
  const entryCounts = { comment: 0, suggestion: 0 };
  for (const row of countResult.results || []) {
    const entryKind = cleanKind(row.kind);
    if (entryKind) entryCounts[entryKind] = Math.max(0, Number(row.entry_count) || 0);
  }
  return json(request, {
    ok: true,
    date,
    ratings,
    entryCounts,
    messages,
    hasMore: (messageResult.results || []).length > limit,
    nextBefore: messages.length ? messages[messages.length - 1].id : null
  });
}

async function addRating(request, env) {
  const body = await readLimitedJson(request);
  const date = cleanDay(body?.date);
  const reaction = cleanReaction(body?.reaction);
  const delta = Math.trunc(Number(body?.delta) || 0);
  if (!date) return json(request, { ok: false, error: "valid date required" }, 400);
  if (!reaction) return json(request, { ok: false, error: "invalid reaction" }, 400);
  if (delta < 1 || delta > 1000) return json(request, { ok: false, error: "delta must be 1-1000" }, 400);

  const now = Date.now();
  const results = await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO feedback_ratings (shift_day, reaction, count, updated_at)
      VALUES (?1, ?2, ?3, ?4)
      ON CONFLICT(shift_day, reaction) DO UPDATE SET
        count = feedback_ratings.count + excluded.count,
        updated_at = excluded.updated_at
    `).bind(date, reaction, delta, now),
    env.DB.prepare(
      "SELECT count, updated_at FROM feedback_ratings WHERE shift_day = ?1 AND reaction = ?2"
    ).bind(date, reaction)
  ]);
  const row = (results[1].results || [])[0];
  return json(request, {
    ok: true,
    date,
    reaction,
    count: Math.max(0, Number(row?.count) || 0),
    updatedAt: Number(row?.updated_at) || now
  });
}

async function addMessage(request, env) {
  const body = await readLimitedJson(request);
  const date = cleanDay(body?.date);
  const kind = cleanKind(body?.kind);
  const text = cleanText(body?.text);
  const clientId = cleanClientId(body?.clientId);
  // Optional during rollout so an older cached PWA can still post. Such a
  // legacy message is readable but intentionally cannot be edited or deleted.
  const editToken = cleanEditToken(body?.editToken, true);
  if (!date) return json(request, { ok: false, error: "valid date required" }, 400);
  if (!kind) return json(request, { ok: false, error: "invalid kind" }, 400);
  if (!text) return json(request, { ok: false, error: "text must be 1-700 characters" }, 400);
  if (!clientId) return json(request, { ok: false, error: "valid clientId required" }, 400);
  if (body?.editToken && !editToken) return json(request, { ok: false, error: "invalid editToken" }, 400);

  const createdAt = Date.now();
  const editTokenHash = editToken ? await hashEditToken(editToken) : null;
  const results = await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO feedback_messages (client_id, shift_day, kind, body, created_at, edit_token_hash)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      ON CONFLICT(client_id) DO NOTHING
    `).bind(clientId, date, kind, text, createdAt, editTokenHash),
    env.DB.prepare(`
      SELECT id, client_id, shift_day, kind, body, created_at
      FROM feedback_messages WHERE client_id = ?1
    `).bind(clientId)
  ]);
  const row = (results[1].results || [])[0];
  if (!row) return json(request, { ok: false, error: "message unavailable" }, 500);
  return json(request, { ok: true, message: mapMessage(row) }, 201);
}

async function editMessage(request, env) {
  const body = await readLimitedJson(request);
  const clientId = cleanClientId(body?.clientId);
  const editToken = cleanEditToken(body?.editToken);
  const text = cleanText(body?.text);
  if (!clientId) return json(request, { ok: false, error: "valid clientId required" }, 400);
  if (!editToken) return json(request, { ok: false, error: "valid editToken required" }, 400);
  if (!text) return json(request, { ok: false, error: "text must be 1-700 characters" }, 400);
  if (!await ownsMessage(env, clientId, editToken)) {
    return json(request, { ok: false, error: "message mutation not authorized" }, 403);
  }
  const result = await env.DB.prepare(`
    UPDATE feedback_messages SET body = ?1 WHERE client_id = ?2
    RETURNING id, client_id, shift_day, kind, body, created_at
  `).bind(text, clientId).all();
  const row = (result.results || [])[0];
  if (!row) return json(request, { ok: false, error: "message not found" }, 404);
  return json(request, { ok: true, message: mapMessage(row) });
}

async function deleteMessage(request, env) {
  const body = await readLimitedJson(request);
  const clientId = cleanClientId(body?.clientId);
  const editToken = cleanEditToken(body?.editToken);
  if (!clientId) return json(request, { ok: false, error: "valid clientId required" }, 400);
  if (!editToken) return json(request, { ok: false, error: "valid editToken required" }, 400);
  if (!await ownsMessage(env, clientId, editToken)) {
    return json(request, { ok: false, error: "message mutation not authorized" }, 403);
  }
  const result = await env.DB.prepare(
    "DELETE FROM feedback_messages WHERE client_id = ?1 RETURNING id"
  ).bind(clientId).all();
  if (!(result.results || []).length) return json(request, { ok: false, error: "message not found" }, 404);
  return json(request, { ok: true, deleted: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return json(request, { ok: true, service: "minka-feedback-api" });
    }

    try {
      if (url.pathname === "/api/feedback/days" && request.method === "GET") return await getDayGroups(request, env, url);
      if (url.pathname === "/api/feedback" && request.method === "GET") return await getFeedback(request, env, url);
      if (url.pathname === "/api/feedback/rating" && request.method === "POST") return await addRating(request, env);
      if (url.pathname === "/api/feedback/message" && request.method === "POST") return await addMessage(request, env);
      if (url.pathname === "/api/feedback/message" && request.method === "PATCH") return await editMessage(request, env);
      if (url.pathname === "/api/feedback/message" && request.method === "DELETE") return await deleteMessage(request, env);
      if (FEEDBACK_PATHS.has(url.pathname)) return json(request, { ok: false, error: "Method not allowed" }, 405);
      return json(request, { ok: false, error: "Not found" }, 404);
    } catch (error) {
      console.error(JSON.stringify({
        message: "feedback request failed",
        path: url.pathname,
        error: error instanceof Error ? error.message : String(error)
      }));
      return json(request, { ok: false, error: "Feedback storage unavailable" }, 500);
    }
  }
};
