/* On-demand Radio Browser directory. No requests until browsing or resolving
   saved rb: UUIDs. The existing player owns playback and profile persistence. */
(function () {
    const HOSTS = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info'];
    const PAGE_SIZE = 60, TTL = 5 * 60 * 1000;
    const cache = new Map(), pending = new Map();
    let preferredHost = 0;
    const uuid = value => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
    function safeURL(value) {
        try {
            const u = new URL(value);
            if (u.protocol !== 'https:' || u.username || u.password || /^(localhost|127\.|10\.|192\.168\.|\[|169\.254\.)/i.test(u.hostname)) return '';
            return u.href;
        } catch (_) { return ''; }
    }
    function normalize(row) {
        const url = safeURL(row?.url_resolved || row?.url);
        if (!url || !uuid(row?.stationuuid) || !String(row?.name || '').trim()) return null;
        const country = /^[A-Z]{2}$/.test(row.countrycode) ? row.countrycode : '';
        return { id: row.stationuuid, catalogKey: 'rb:' + row.stationuuid,
            title: String(row.name).trim().slice(0, 180), group: 'world', country,
            tooltip: [countryName(country), String(row.tags || '').split(',').filter(Boolean).slice(0, 3).join(', ')].filter(Boolean).join(' · '),
            cover: safeURL(row.favicon), stream_320: url, stream_128: url,
            stream_hls: row.hls === 1 || url.includes('.m3u8') ? url : '', stream_64: '', prefix: '',
            codec: String(row.codec || '').slice(0, 20), bitrate: Number(row.bitrate) || 0 };
    }
    let names;
    try { names = new Intl.DisplayNames(['lv'], { type: 'region' }); } catch (_) {}
    function countryName(code) { try { return names?.of(code) || code; } catch (_) { return code; } }
    async function request(path) {
        const hit = cache.get(path);
        if (hit && Date.now() - hit.time < TTL) return hit.data;
        if (pending.has(path)) return pending.get(path);
        const task = (async () => {
            for (let attempt = 0; attempt < HOSTS.length; attempt++) {
                const host = (preferredHost + attempt) % HOSTS.length;
                const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 5000);
                try {
                    const response = await fetch(HOSTS[host] + path, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
                    if (!response.ok) throw new Error('catalog HTTP ' + response.status);
                    const data = await response.json();
                    if (!Array.isArray(data) && !(path === '/json/stats' && Number.isFinite(data?.stations))) throw new Error('Invalid catalogue');
                    preferredHost = host;
                    cache.delete(path); cache.set(path, {time: Date.now(), data});
                    while (cache.size > 8) cache.delete(cache.keys().next().value);
                    return data;
                } catch (_) { /* Try a different public mirror. */ }
                finally { clearTimeout(timer); }
            }
            throw new Error('Staciju katalogs pašlaik nav sasniedzams. Mēģini vēlreiz.');
        })();
        pending.set(path, task);
        try { return await task; } finally { pending.delete(path); }
    }
    async function search({ country = '', genre = '', query = '', offset = 0, bitrateMin = 0 } = {}) {
        const params = new URLSearchParams({ hidebroken: 'true', order: 'clickcount', reverse: 'true', limit: String(PAGE_SIZE), offset: String(Math.max(0, offset)) });
        if (/^[A-Z]{2}$/.test(country)) params.set('countrycode', country);
        if (genre) params.set('tag', genre.slice(0, 60));
        if ([128, 192, 256].includes(Number(bitrateMin))) params.set('bitrateMin', String(bitrateMin));
        if (query.trim()) params.set('name', query.trim().slice(0, 100));
        const rows = await request('/json/stations/search?' + params);
        const seen = new Set(), items = [];
        for (const row of rows) {
            if (row.lastcheckok !== 1) continue;
            const station = normalize(row);
            if (!station || seen.has(station.stream_128)) continue;
            seen.add(station.stream_128); items.push(station);
        }
        return { items, hasNext: rows.length === PAGE_SIZE, offset };
    }
    async function countries() {
        const rows = await request('/json/countrycodes?hidebroken=true');
        return rows.filter(row => /^[A-Z]{2}$/.test(row.name) && row.stationcount > 0)
            .map(row => ({code: row.name, name: countryName(row.name), count: Number(row.stationcount)})).sort((a, b) => a.name.localeCompare(b.name, 'lv'));
    }
    async function genres() {
        const rows = await request('/json/tags?hidebroken=true&order=stationcount&reverse=true&limit=100');
        return rows.filter(row => typeof row.name === 'string' && row.name.length <= 60 && row.stationcount > 0)
            .map(row => ({name: row.name, count: Number(row.stationcount)}));
    }
    let featuredRequest = null;
    function featured() {
        if (!featuredRequest) featuredRequest = fetch('data/radio-featured.json?v=20260910').then(r => {
            if (!r.ok) throw new Error('Neizdevās ielādēt staciju izlasi.');
            return r.json();
        }).catch(error => { featuredRequest = null; throw error; });
        return featuredRequest;
    }
    async function resolve(keys) {
        const ids = [...new Set(keys.map(key => String(key).replace(/^rb:/, '')).filter(uuid))];
        const result = keys.some(key => key.startsWith('featured:')) ? (await featured()).filter(s => keys.includes(s.catalogKey)) : [];
        for (let i = 0; i < ids.length; i += 40) {
            const rows = await request('/json/stations/byuuid?uuids=' + ids.slice(i, i + 40).join(','));
            result.push(...rows.map(normalize).filter(Boolean));
        }
        return result;
    }
    window.rgRadioCatalog = { search, countries, genres, resolve, featured, stats: () => request('/json/stats'), normalize, PAGE_SIZE };
})();
