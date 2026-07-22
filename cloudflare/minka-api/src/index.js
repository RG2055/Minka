function nsTtl(dateStr) {
  const [dd, mm, yy] = dateStr.split(".").map(Number);
  const exp = new Date(Date.UTC(yy, mm - 1, dd + 1, 6, 0, 0));
  const ttl = Math.floor((exp.getTime() - Date.now()) / 1000);
  return Math.max(ttl, 120);
}

const PAIR_TTL_SECONDS = 120;
const PAIR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createPairCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += PAIR_ALPHABET[byte & 31];
  return code;
}

async function hashPairCode(code) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function pairDatabase(env) {
  return typeof env.DB.withSession === "function" ? env.DB.withSession("first-primary") : env.DB;
}

async function ensurePairSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS pair_codes (
      code_hash TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      used_at INTEGER
    )
  `).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS pair_codes_expiry_idx ON pair_codes(expires_at)").run();
}

const SKINS_KEY = "skins:v1";
const SKIN_ART_PREFIX = "skin-art::";
const SKIN_ART_MAX_BYTES = 96 * 1024;
const SKIN_ART_ID_RE = /^[a-f0-9]{32}$/;
const SKIN_PART_RE = /^(img:[\w-]{1,24}|art:[a-f0-9]{32}|grad:[a-z]{1,16}|hue:\d{1,3},\d{1,3},\d{1,3}|txt:\d{1,3},\d{1,3},\d{1,3}|num:\d{1,3},\d{1,3},\d{1,3}|na:(0(\.\d{1,2})?|1)|em:(0(\.\d{1,2})?|1)|emn:[01]|fx:[a-z]{1,12}|fxs:[0-3](\.\d{1,2})?)$/;

function cleanSkinWorker(value) {
  if (typeof value !== "string") return "";
  const worker = value.trim().replace(/\s+/g, " ").toUpperCase();
  return worker.length >= 1 && worker.length <= 64 ? worker : "";
}

function cleanSkinValue(value) {
  if (typeof value !== "string" || value.length > 220) return "";
  const skin = value.trim();
  const parts = skin.split(";");
  if (parts.length < 1 || parts.length > 10 || parts.some((part) => !SKIN_PART_RE.test(part))) return "";
  return skin;
}

function skinArtId(skin) {
  const match = String(skin || "").match(/(?:^|;)art:([a-f0-9]{32})(?:;|$)/);
  return match ? match[1] : "";
}

function replaceSkinBackground(skin, backgroundPart) {
  const parts = String(skin || "").split(";").filter(Boolean);
  const rest = parts.filter((part) => !/^(?:img|art|grad|hue):/.test(part));
  return [backgroundPart, ...rest].join(";");
}

function createSkinArtId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function ascii(bytes, offset, length) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function webpDimensions(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") return null;
  const type = ascii(bytes, 12, 4);
  if (type === "VP8X") {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
    };
  }
  if (type === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff
    };
  }
  if (type === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10)
    };
  }
  return null;
}

async function readSkins(env, strict = false) {
  try {
    const raw = await env.MINKA_EMOJI.get(SKINS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (strict) throw error;
    return {};
  }
}

async function pushNightStats(env, payload) {
  try {
    if (!env.NS_STATS_URL) return;

    await fetch(env.NS_STATS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        date: payload.date || "",
        savedAt: payload.savedAt || Date.now(),
        order: Array.isArray(payload.order) ? payload.order : [],
        sh: typeof payload.sh === "number" ? payload.sh : 0,
        ei: typeof payload.ei === "number" ? payload.ei : 0,
        beds: payload.beds && typeof payload.beds === "object" ? payload.beds : {},
        source: "cloudflare"
      })
    });
  } catch (err) {
    console.log("NS stats push failed:", String(err));
  }
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { headers: cors(request) });
    }

    const skinAssetMatch = url.pathname.match(/^\/skin-assets\/([a-f0-9]{32})\.webp$/);
    if (skinAssetMatch && method === "GET") {
      const image = await env.MINKA_EMOJI.get(SKIN_ART_PREFIX + skinAssetMatch[1], { type: "arrayBuffer", cacheTtl: 86400 });
      if (!image) return new Response("Not found", { status: 404 });
      const headers = new Headers(cors(request));
      headers.set("content-type", "image/webp");
      headers.set("cache-control", "public, max-age=31536000, immutable");
      headers.set("etag", '"' + skinAssetMatch[1] + '"');
      headers.set("x-content-type-options", "nosniff");
      return new Response(image, { headers });
    }

    if (url.pathname === "/api/login" && method === "POST") {
      const body = await readJson(request);
      if (!body || body.password !== env.APP_PASSWORD) {
        return json(request, { ok: false, error: "Wrong password" }, 401);
      }
      return json(request, { ok: true, token: env.APP_PASSWORD });
    }

    if (url.pathname === "/api/pair/claim" && method === "POST") {
      const body = await readJson(request);
      const code = String(body?.code || "").trim();
      if (!/^[A-Z2-9]{8}$/.test(code)) {
        return json(request, { ok: false, error: "Invalid or expired pairing code" }, 410);
      }

      const db = pairDatabase(env);
      try {
        await ensurePairSchema(db);
      } catch (error) {
        console.log("Pairing storage unavailable:", String(error));
        return json(request, { ok: false, error: "Pairing storage unavailable" }, 500);
      }
      const now = Math.floor(Date.now() / 1000);
      let result;
      try {
        const codeHash = await hashPairCode(code);
        result = await db.prepare(`
          UPDATE pair_codes
          SET used_at = ?1
          WHERE code_hash = ?2
            AND used_at IS NULL
            AND expires_at >= ?1
        `).bind(now, codeHash).run();
      } catch (error) {
        console.log("Pairing claim failed:", String(error));
        return json(request, { ok: false, error: "Pairing claim failed" }, 500);
      }

      if (Number(result?.meta?.changes || 0) !== 1) {
        return json(request, { ok: false, error: "Invalid or expired pairing code" }, 410);
      }

      return json(request, { ok: true, token: env.APP_PASSWORD });
    }

    if (!isAuthed(request, env)) {
      return json(request, { ok: false, error: "Unauthorized" }, 401);
    }

    if (url.pathname === "/api/pair/new" && method === "POST") {
      const db = pairDatabase(env);
      await ensurePairSchema(db);
      const now = Math.floor(Date.now() / 1000);
      const code = createPairCode();
      const codeHash = await hashPairCode(code);
      const expiresAt = now + PAIR_TTL_SECONDS;

      await db.prepare("DELETE FROM pair_codes WHERE expires_at < ?1 OR used_at IS NOT NULL").bind(now).run();
      await db.prepare("INSERT INTO pair_codes (code_hash, expires_at, used_at) VALUES (?1, ?2, NULL)").bind(codeHash, expiresAt).run();

      return json(request, { ok: true, code, ttl: PAIR_TTL_SECONDS, expiresAt });
    }

    if (url.pathname === "/api/me" && method === "GET") {
      return json(request, { ok: true });
    }

    if (url.pathname === "/api/birthdays" && method === "GET") {
      let birthdays = [];
      try {
        const parsed = JSON.parse(env.BIRTHDAYS_JSON || "[]");
        const list = Array.isArray(parsed) ? parsed : parsed.birthdays;
        birthdays = Array.isArray(list) ? list.map((b) => {
          const d = String((b && (b.d || b.date || b.day)) || "").trim();
          const dm = d.match(/^(\d{1,2})\.(\d{1,2})(?:\.\d{4})?$/);
          const name = String((b && b.name) || "").trim();
          if (!dm || !name) return null;
          return { d: dm[1].padStart(2, "0") + "." + dm[2].padStart(2, "0"), name };
        }).filter(Boolean) : [];
      } catch (err) {
        birthdays = [];
      }
      return json(request, { ok: true, birthdays });
    }

    if (url.pathname === "/api/phones" && method === "GET") {
      const rows = await env.DB.prepare(
        "SELECT id, name, phone, cat, sub FROM phones WHERE hidden = 0 ORDER BY name ASC"
      ).all();
      return json(request, rows.results || []);
    }

    if (url.pathname === "/api/phones" && method === "POST") {
      const body = await readJson(request);
      if (!body?.name || !body?.phone) {
        return json(request, { ok: false, error: "name and phone required" }, 400);
      }
      await env.DB.prepare(
        "INSERT INTO phones (name, phone, cat, sub) VALUES (?, ?, ?, ?)"
      ).bind(body.name, body.phone, body.cat || "", body.sub || "").run();
      return json(request, { ok: true });
    }

    if (url.pathname === "/api/emoji" && method === "GET") {
      const worker = url.searchParams.get("worker");
      if (worker) {
        const one = await env.MINKA_EMOJI.get(worker);
        return json(request, { worker, emoji: one || null });
      }
      const list = await env.MINKA_EMOJI.list();
      const out = {};
      for (const key of list.keys) {
        out[key.name] = await env.MINKA_EMOJI.get(key.name);
      }
      return json(request, out);
    }

    if (url.pathname === "/api/emoji" && method === "POST") {
      const body = await readJson(request);
      if (!body?.worker) {
        return json(request, { ok: false, error: "worker required" }, 400);
      }
      if (!body.emoji) {
        await env.MINKA_EMOJI.delete(body.worker);
        return json(request, { ok: true, removed: true });
      }
      await env.MINKA_EMOJI.put(body.worker, body.emoji);
      return json(request, { ok: true });
    }

    if (url.pathname === "/api/skin-art" && method === "POST") {
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > SKIN_ART_MAX_BYTES + 48 * 1024) {
        return json(request, { ok: false, error: "image too large" }, 413);
      }

      let form;
      try {
        form = await request.formData();
      } catch (_error) {
        return json(request, { ok: false, error: "invalid form data" }, 400);
      }
      const workerName = cleanSkinWorker(form.get("worker"));
      const image = form.get("image");
      if (!workerName) {
        return json(request, { ok: false, error: "worker must be 1-64 characters" }, 400);
      }
      if (!image || typeof image.arrayBuffer !== "function" || image.type !== "image/webp") {
        return json(request, { ok: false, error: "384x384 WebP image required" }, 400);
      }
      if (image.size < 32 || image.size > SKIN_ART_MAX_BYTES) {
        return json(request, { ok: false, error: "image must be at most 96 KB" }, 413);
      }

      const imageBuffer = await image.arrayBuffer();
      const dimensions = webpDimensions(imageBuffer);
      const isCurrentSquare = dimensions && dimensions.width === 384 && dimensions.height === 384;
      const isLegacyWide = dimensions && dimensions.width === 480 && dimensions.height === 270;
      if (!isCurrentSquare && !isLegacyWide) {
        return json(request, { ok: false, error: "image must be exactly 384x384" }, 400);
      }

      const skins = await readSkins(env, true);
      const previousSkin = skins[workerName] || "";
      const previousArtId = skinArtId(previousSkin);
      const artId = createSkinArtId();
      const artKey = SKIN_ART_PREFIX + artId;
      const nextSkin = cleanSkinValue(replaceSkinBackground(previousSkin, "art:" + artId));
      if (!nextSkin) return json(request, { ok: false, error: "invalid resulting skin" }, 400);

      await env.MINKA_EMOJI.put(artKey, imageBuffer, { metadata: { worker: workerName, contentType: "image/webp" } });
      try {
        skins[workerName] = nextSkin;
        await env.MINKA_EMOJI.put(SKINS_KEY, JSON.stringify(skins));
      } catch (error) {
        await env.MINKA_EMOJI.delete(artKey);
        throw error;
      }
      if (previousArtId && previousArtId !== artId) {
        await env.MINKA_EMOJI.delete(SKIN_ART_PREFIX + previousArtId);
      }
      return json(request, {
        ok: true,
        worker: workerName,
        skin: nextSkin,
        artId,
        asset: "/skin-assets/" + artId + ".webp"
      });
    }

    if (url.pathname === "/api/skins" && method === "GET") {
      return json(request, await readSkins(env));
    }

    if (url.pathname === "/api/skins" && method === "POST") {
      const body = await readJson(request);
      const worker = cleanSkinWorker(body?.worker);
      if (!worker) {
        return json(request, { ok: false, error: "worker must be 1-64 characters" }, 400);
      }
      if (!Object.prototype.hasOwnProperty.call(body || {}, "skin")) {
        return json(request, { ok: false, error: "skin required" }, 400);
      }

      const skin = body.skin === null ? null : cleanSkinValue(body.skin);
      if (body.skin !== null && !skin) {
        return json(request, { ok: false, error: "invalid skin" }, 400);
      }

      const skins = await readSkins(env, true);
      const previousArtId = skinArtId(skins[worker]);
      const nextArtId = skinArtId(skin);
      if (skin === null) delete skins[worker];
      else skins[worker] = skin;
      await env.MINKA_EMOJI.put(SKINS_KEY, JSON.stringify(skins));
      if (previousArtId && previousArtId !== nextArtId) {
        await env.MINKA_EMOJI.delete(SKIN_ART_PREFIX + previousArtId);
      }
      return json(request, { ok: true, worker, skin });
    }

    if (url.pathname === "/api/ns-order" && method === "GET") {
      const date = url.searchParams.get("date");
      if (!date) return json(request, { ok: false, error: "date required" }, 400);
      const val = await env.MINKA_EMOJI.get("ns::" + date);
      return json(request, val ? JSON.parse(val) : {});
    }

    if (url.pathname === "/api/ns-order" && method === "POST") {
      const body = await readJson(request);
      if (!body?.date) return json(request, { ok: false, error: "date required" }, 400);

      const ttl = nsTtl(body.date);
      const orderPayload = {
        order: body.order || [],
        sh: typeof body.sh === "number" ? body.sh : 0,
        ei: typeof body.ei === "number" ? body.ei : 2,
        mode: body.mode === "freq" ? "freq" : "fatigue",
        savedAt: body.savedAt || Date.now()
      };

      await env.MINKA_EMOJI.put(
        "ns::" + body.date,
        JSON.stringify(orderPayload),
        { expirationTtl: ttl }
      );

      await pushNightStats(env, {
        date: body.date,
        savedAt: orderPayload.savedAt,
        order: orderPayload.order,
        sh: orderPayload.sh,
        ei: orderPayload.ei
      });

      return json(request, { ok: true });
    }

    if (url.pathname === "/api/ns-rooms" && method === "GET") {
      const date = url.searchParams.get("date");
      if (!date) return json(request, { ok: false, error: "date required" }, 400);
      const val = await env.MINKA_EMOJI.get("nsrooms::" + date);
      return json(request, val ? JSON.parse(val) : {});
    }

    if (url.pathname === "/api/ns-rooms" && method === "POST") {
      const body = await readJson(request);
      if (!body?.date) return json(request, { ok: false, error: "date required" }, 400);

      const beds = (body.beds && typeof body.beds === "object") ? body.beds : {};
      const ttl = nsTtl(body.date);

      const roomsPayload = {
        beds: {
          main_left_top: typeof beds.main_left_top === "string" ? beds.main_left_top : "",
          main_left_bottom: typeof beds.main_left_bottom === "string" ? beds.main_left_bottom : "",
          main_right_top: typeof beds.main_right_top === "string" ? beds.main_right_top : "",
          nmp_center: typeof beds.nmp_center === "string" ? beds.nmp_center : ""
        },
        savedAt: body.savedAt || Date.now()
      };

      await env.MINKA_EMOJI.put(
        "nsrooms::" + body.date,
        JSON.stringify(roomsPayload),
        { expirationTtl: ttl }
      );

      await pushNightStats(env, {
        date: body.date,
        savedAt: roomsPayload.savedAt,
        beds: roomsPayload.beds
      });

      return json(request, { ok: true });
    }


    if (url.pathname === "/api/ns-stats" && method === "GET") {
      if (!env.NS_STATS_URL) {
        return json(request, { ok: false, error: "NS_STATS_URL missing" }, 500);
      }
      try {
        const upstream = await fetch(env.NS_STATS_URL, {
          method: "GET",
          headers: { accept: "application/json" }
        });
        const text = await upstream.text();
        if (!upstream.ok) {
          return json(request, { ok: false, error: "Upstream night stats fetch failed", status: upstream.status }, 502);
        }
        try {
          return json(request, JSON.parse(text));
        } catch (err) {
          return json(request, { ok: false, error: "Upstream night stats returned invalid JSON" }, 502);
        }
      } catch (err) {
        return json(request, { ok: false, error: "Night stats proxy failed" }, 502);
      }
    }

    if (url.pathname === "/api/schedule" && method === "GET") {
      if (!env.SOURCE_URL) {
        return json(request, { ok: false, error: "SOURCE_URL missing" }, 500);
      }
      const upstream = await fetch(env.SOURCE_URL, {
        method: "GET",
        headers: { accept: "application/json" }
      });
      if (!upstream.ok) {
        return json(request, { ok: false, error: "Upstream schedule fetch failed", status: upstream.status }, 502);
      }
      const data = await upstream.json();
      return json(request, data);
    }

    if (url.pathname === "/api/residents" && method === "GET") {
      if (!env.RESIDENTS_SOURCE_URL) {
        return json(request, { ok: false, error: "RESIDENTS_SOURCE_URL missing" }, 500);
      }
      const upstream = await fetch(env.RESIDENTS_SOURCE_URL, {
        method: "GET",
        headers: { accept: "application/json" }
      });
      if (!upstream.ok) {
        return json(request, { ok: false, error: "Upstream residents fetch failed", status: upstream.status }, 502);
      }
      const data = await upstream.json();
      return json(request, data);
    }

    return json(request, { ok: false, error: "Not found" }, 404);
  }
};

export default worker;

function isAuthed(request, env) {
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${env.APP_PASSWORD}`;
}

function cors(request) {
  const origin = request.headers.get("origin") || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type, authorization"
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors(request),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}
