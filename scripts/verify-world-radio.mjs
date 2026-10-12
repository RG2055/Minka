#!/usr/bin/env node
/* Pārbaudīts pasaules radio saraksts radio "Atklāj" rindai.
   Radio atskaņotājs lieto crossOrigin="anonymous" (ekvalaizers, vizualizācijas),
   tāpēc pārlūkā skan tikai stacijas, kuru serveris atbild ar CORS atļauju.
   Skripts paņem populārākās https MP3/AAC stacijas no Radio Browser un katru
   pārbauda tāpat kā pārlūks: atbilde 200, audio saturs, Access-Control-Allow-Origin
   un pirmie baiti dažu sekunžu laikā. Strādājošās (līdz 80, ne vairāk par 6 no
   vienas valsts) ieraksta data/radio-world-verified.json.

   Node pārbaude ir tikai priekšatlase: daži serveri (piem. SomaFM) CORS galveni
   sūta, bet Chrome audio elements tos tik un tā noraida ("Format error"). Tāpēc:
     1) node scripts/verify-world-radio.mjs            → .radio-candidates.json
     2) lietotnē (localhost) pārbauda katru kandidātu ar audio elementu
        crossOrigin="anonymous" un saglabā strādājošo id sarakstu (ok.json)
     3) node scripts/verify-world-radio.mjs --final ok.json → data/radio-world-verified.json  */
import { writeFile } from 'node:fs/promises';

const HOSTS = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info'];
const ORIGIN = 'https://rgapp.page';
const WANT = 80, PER_COUNTRY = 6, CONCURRENCY = 12, TIMEOUT = 7000;
const OUT = new URL('../data/radio-world-verified.json', import.meta.url);
const CANDIDATES = new URL('../.radio-candidates.json', import.meta.url);   // starpfails, nav lapā
// Latvijai tuvākās un mūzikas valstis vispirms; ziņas, sarunas, sports, reliģija ārā.
const PREFER = ['LT','EE','FI','SE','NO','DK','DE','NL','GB','IE','FR','BE','CH','AT','PL','CZ','IT','ES','PT','US','CA','AU','UA','HU','GR','RO','JP','BR'];
const SKIP_TAGS = /\b(news|talk|sport|sports|religio|christian|gospel|church|islam|quran|bible|politic|kids|children)\b/i;
// Īss, tīrs nosaukums: bez "(mp3)", "256K", "HQ" un garām astēm aiz " - ", " | ", "@".
const cleanTitle = name => {
  let t = String(name).replace(/^[#\s]+/, '').replace(/\((?:[^)]*\b(?:mp3|aac|kbps|\d{2,3}k|hq|hd)\b[^)]*)\)/gi, '')
    .replace(/\b\d{2,3}\s?k(?:bps)?\b/gi, '').replace(/\s*[|]\s*HQ\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  if (t.length > 28) { const cut = t.slice(3).search(/\s[-|@:–]\s|\s@|\s\(/); if (cut >= 0) t = t.slice(0, cut + 3); }
  if (t.length > 40) t = t.slice(0, 38).trim() + '…';
  return t.replace(/[\s\-|:]+$/, '') || String(name).slice(0, 40);
};
const rank = row => { const i = PREFER.indexOf(row.countrycode); return i < 0 ? PREFER.length : i; };
const { readFile } = await import('node:fs/promises');
const finalArg = process.argv.indexOf('--final');

const names = new Intl.DisplayNames(['lv'], { type: 'region' });
const countryName = code => { try { return names.of(code) || code; } catch (_) { return code; } };

async function catalogue() {
  const path = '/json/stations/search?order=clickcount&reverse=true&limit=400&hidebroken=true&is_https=true';
  for (const host of HOSTS) {
    try {
      const r = await fetch(host + path, { headers: { 'User-Agent': 'RG-radio-verify/1.0' }, signal: AbortSignal.timeout(15000) });
      if (r.ok) return await r.json();
    } catch (_) {}
  }
  throw new Error('Radio Browser nav sasniedzams');
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  const started = Date.now();
  try {
    const r = await fetch(url, { headers: { Origin: ORIGIN, 'User-Agent': 'Mozilla/5.0 RG-radio-verify' }, signal: controller.signal, redirect: 'follow' });
    const acao = r.headers.get('access-control-allow-origin') || '';
    const type = (r.headers.get('content-type') || '').toLowerCase();
    if (!r.ok || !r.body) return { ok: false, why: 'status ' + r.status };
    if (!new URL(r.url).protocol.startsWith('https')) return { ok: false, why: 'redirect to http' };
    if (acao !== '*' && acao !== ORIGIN) return { ok: false, why: 'no CORS' };
    if (!/audio|mpeg|aac|ogg|octet-stream/.test(type)) return { ok: false, why: 'type ' + type };
    const reader = r.body.getReader();
    let bytes = 0;
    while (bytes < 4096) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
    }
    try { await reader.cancel(); } catch (_) {}
    return bytes >= 4096 ? { ok: true, ms: Date.now() - started } : { ok: false, why: 'too few bytes' };
  } catch (e) {
    return { ok: false, why: e.name === 'AbortError' ? 'timeout' : String(e.message || e).slice(0, 60) };
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

if (finalArg > 0) {
  const ok = new Set(JSON.parse(await readFile(process.argv[finalArg + 1], 'utf8')));
  const cand = JSON.parse(await readFile(CANDIDATES, 'utf8'));
  const perCountry = new Map(), out = [];
  for (const st of cand) {
    if (!ok.has(st.id) || out.length >= WANT || (perCountry.get(st.country) || 0) >= PER_COUNTRY) continue;
    perCountry.set(st.country, (perCountry.get(st.country) || 0) + 1);
    out.push(st);
  }
  await writeFile(OUT, JSON.stringify({ checked: new Date().toISOString(), origin: ORIGIN, browserVerified: true, stations: out }, null, 1) + '\n');
  console.log(`pārlūkā strādā ${ok.size}, saglabātas ${out.length} (${perCountry.size} valstis)`);
  process.exit(0);
}
const rows = (await catalogue()).filter(row => !SKIP_TAGS.test(String(row.tags || '') + ' ' + String(row.name || ''))).filter(row => {
  const url = String(row.url_resolved || row.url || '');
  return url.startsWith('https://') && !url.includes('.m3u8') && /^(MP3|AAC|AAC\+)$/i.test(row.codec || '')
    && /^[a-f0-9-]{36}$/i.test(row.stationuuid || '') && String(row.name || '').trim();
});
console.log(`kandidāti: ${rows.length}`);

const results = new Array(rows.length);
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < rows.length) {
    const i = next++;
    results[i] = await probe(rows[i].url_resolved || rows[i].url);
  }
}));

const seen = new Set(), out = [];
const why = new Map();
const order = rows.map((row, i) => i).sort((a, b) => rank(rows[a]) - rank(rows[b]) || a - b);
order.forEach(i => {
  const row = rows[i], res = results[i];
  if (!res.ok) { why.set(res.why, (why.get(res.why) || 0) + 1); return; }
  const country = /^[A-Z]{2}$/.test(row.countrycode) ? row.countrycode : '';
  const name = String(row.name).trim();
  const key = name.toLowerCase().replace(/\s+/g, ' ');
  if (seen.has(key)) return;
  seen.add(key);
  const url = row.url_resolved || row.url;
  const favicon = String(row.favicon || '').trim().replace(/^http:\/\//i, 'https://');
  out.push({
    id: row.stationuuid, catalogKey: 'rb:' + row.stationuuid, title: cleanTitle(name), group: 'world', country,
    tooltip: [countryName(country), String(row.tags || '').split(',').filter(Boolean).slice(0, 3).join(', ')].filter(Boolean).join(' · '),
    cover: favicon.startsWith('https://') ? favicon : '', stream_320: url, stream_128: url, stream_hls: '', stream_64: '', prefix: '',
    codec: String(row.codec || '').slice(0, 20), bitrate: Number(row.bitrate) || 0, verifiedMs: res.ms
  });
});

await writeFile(CANDIDATES, JSON.stringify(out) + '\n');
console.log(`node pārbaude: ${results.filter(r => r.ok).length}/${rows.length} → kandidāti ${out.length} (.radio-candidates.json)`);
console.log('neizgāja:', Object.fromEntries([...why].sort((a, b) => b[1] - a[1]).slice(0, 8)));
