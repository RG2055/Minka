// Stream proxy for internet radio, mounted on the Vite dev and preview servers.
//
// Webamp plays through a Web Audio graph, so its <audio> element is created
// with crossOrigin="anonymous" and the browser refuses any stream that does
// not send Access-Control-Allow-Origin. Almost no radio server does, which is
// why stations "do not work" when the page is opened in a normal browser.
//
// Fetching the stream here and re-serving it same-origin fixes that, and gives
// two more things Winamp had: plain http:// stations play on an https:// page,
// and the SHOUTcast/Icecast "now playing" title is read from the ICY metadata
// and exposed at /stream-title so the player can show it.
//
// The upstream is read over a raw socket rather than Node's http client:
// SHOUTcast v1 answers "ICY 200 OK", which the HTTP parser rejects.

import net from "node:net";
import tls from "node:tls";

const MAX_REDIRECTS = 5;
const CONNECT_TIMEOUT_MS = 12000;
const USER_AGENT = "WinampMPEG/5.09 (WebampPWA)";
const nowPlaying = new Map();

function parseHead(head) {
  const lines = head.split(/\r?\n/);
  const statusLine = lines.shift() ?? "";
  const status = /^(?:ICY|HTTP\/\d(?:\.\d)?)\s+(\d{3})/i.exec(statusLine);
  const headers = {};
  for (const line of lines) {
    const index = line.indexOf(":");
    if (index > 0) {
      headers[line.slice(0, index).trim().toLowerCase()] = line.slice(index + 1).trim();
    }
  }
  return { status: status ? Number(status[1]) : 0, headers };
}

// Opens the upstream and resolves with the socket once the headers have
// arrived. Any body bytes that came with the head are returned too.
function openUpstream(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new URL(url);
    } catch {
      reject(new Error("Bad stream address"));
      return;
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      reject(new Error("Only http(s) streams are supported"));
      return;
    }

    const secure = target.protocol === "https:";
    const port = Number(target.port) || (secure ? 443 : 80);
    const socket = secure
      ? tls.connect({ host: target.hostname, port, servername: target.hostname })
      : net.connect({ host: target.hostname, port });
    let head = Buffer.alloc(0);
    let settled = false;

    const fail = (error) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(error);
      }
    };

    socket.setTimeout(CONNECT_TIMEOUT_MS, () => fail(new Error("The stream did not answer in time")));
    socket.on("error", fail);
    socket.on(secure ? "secureConnect" : "connect", () => {
      socket.write(
        `GET ${target.pathname}${target.search} HTTP/1.0\r\n` +
        `Host: ${target.host}\r\n` +
        `User-Agent: ${USER_AGENT}\r\n` +
        "Icy-MetaData: 1\r\n" +
        "Accept: */*\r\n" +
        "Connection: close\r\n\r\n"
      );
    });
    socket.on("data", function onData(chunk) {
      if (settled) {
        return;
      }
      head = Buffer.concat([head, chunk]);
      const end = head.indexOf("\r\n\r\n");
      if (end === -1) {
        if (head.length > 64 * 1024) {
          fail(new Error("The stream sent no headers"));
        }
        return;
      }
      socket.removeListener("data", onData);
      socket.setTimeout(0);
      const { status, headers } = parseHead(head.subarray(0, end).toString("latin1"));
      const rest = head.subarray(end + 4);

      if (status >= 300 && status < 400 && headers.location) {
        settled = true;
        socket.destroy();
        if (redirects >= MAX_REDIRECTS) {
          reject(new Error("Too many redirects"));
        } else {
          resolve(openUpstream(new URL(headers.location, target).href, redirects + 1));
        }
        return;
      }
      if (status !== 200) {
        fail(new Error(`The stream answered with HTTP ${status || "?"}`));
        return;
      }
      settled = true;
      socket.pause();
      resolve({ socket, headers, rest, url: target.href });
    });
  });
}

// Splits an ICY stream into audio and metadata blocks: every `interval` audio
// bytes comes one length byte (x16) then a "StreamTitle='...';" record.
function createIcyParser(interval, onTitle) {
  let audioLeft = interval;
  let metaLeft = 0;
  let meta = [];

  return (chunk) => {
    const audio = [];
    let offset = 0;
    while (offset < chunk.length) {
      if (metaLeft > 0) {
        const piece = chunk.subarray(offset, offset + metaLeft);
        meta.push(piece);
        metaLeft -= piece.length;
        offset += piece.length;
        if (metaLeft === 0) {
          const text = Buffer.concat(meta).toString("utf8").replace(/\0+$/, "");
          meta = [];
          audioLeft = interval;
          const match = /StreamTitle='((?:[^'\\]|\\.|'(?!;))*)';/.exec(text);
          if (match) {
            onTitle(match[1].replace(/\\'/g, "'").trim());
          }
        }
      } else if (audioLeft === 0) {
        metaLeft = chunk[offset] * 16;
        offset += 1;
        if (metaLeft === 0) {
          audioLeft = interval;
        }
      } else {
        const piece = chunk.subarray(offset, offset + audioLeft);
        audio.push(piece);
        audioLeft -= piece.length;
        offset += piece.length;
      }
    }
    return audio;
  };
}

function contentTypeFor(headers, url) {
  const type = (headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
  const map = { "audio/aacp": "audio/aac", "audio/x-aac": "audio/aac", "audio/x-mpeg": "audio/mpeg", "audio/mp3": "audio/mpeg", "application/ogg": "audio/ogg" };
  if (map[type]) return map[type];
  if (type.startsWith("audio/") || type.startsWith("video/")) return type;
  const path = url.split(/[?#]/)[0].toLowerCase();
  if (path.endsWith(".aac")) return "audio/aac";
  if (path.endsWith(".ogg") || path.endsWith(".opus")) return "audio/ogg";
  return "audio/mpeg";
}

function readTarget(req) {
  const url = new URL(req.url, "http://localhost");
  return { path: url.pathname, target: url.searchParams.get("u") ?? "" };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

async function handleStream(req, res, target) {
  let upstream;
  try {
    upstream = await openUpstream(target);
  } catch (error) {
    sendJson(res, 502, { error: error?.message ?? String(error) });
    return;
  }

  const { socket, headers, rest } = upstream;
  const interval = Number(headers["icy-metaint"]);
  const parser = Number.isInteger(interval) && interval > 0
    ? createIcyParser(interval, (title) => nowPlaying.set(target, { title, name: headers["icy-name"] ?? "", at: Date.now() }))
    : null;

  if (!nowPlaying.has(target) && headers["icy-name"]) {
    nowPlaying.set(target, { title: "", name: headers["icy-name"], at: Date.now() });
  }

  res.writeHead(200, {
    "Content-Type": contentTypeFor(headers, upstream.url),
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store, no-transform",
    "X-Icy-Name": encodeURIComponent(headers["icy-name"] ?? ""),
    "X-Icy-Genre": encodeURIComponent(headers["icy-genre"] ?? ""),
    "X-Icy-Br": headers["icy-br"] ?? ""
  });
  if (req.method === "HEAD") {
    socket.destroy();
    res.end();
    return;
  }

  const forward = (chunk) => {
    const pieces = parser ? parser(chunk) : [chunk];
    for (const piece of pieces) {
      if (!res.write(piece)) {
        socket.pause();
        res.once("drain", () => socket.resume());
      }
    }
  };

  if (rest.length > 0) {
    forward(rest);
  }
  socket.on("data", forward);
  socket.on("end", () => res.end());
  socket.on("error", () => res.end());
  res.on("close", () => socket.destroy());
  socket.resume();
}

function middleware(req, res, next) {
  const { path, target } = readTarget(req);

  if (path === "/stream-proxy/ping") {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (path === "/stream-title") {
    sendJson(res, 200, nowPlaying.get(target) ?? { title: "", name: "" });
    return;
  }
  if (path !== "/stream") {
    next();
    return;
  }
  if (!target) {
    sendJson(res, 400, { error: "Missing stream address (?u=)" });
    return;
  }
  void handleStream(req, res, target);
}

/** Plain Node middleware `(req, res, next)`: works with Express, Connect, Vite, Fastify's middie, etc. */
export const streamProxyMiddleware = middleware;

/** Vite plugin that mounts the middleware on the dev and preview servers. */
export function streamProxy() {
  return {
    name: "webamp-stream-proxy",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}
