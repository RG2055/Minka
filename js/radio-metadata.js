/* Small on-demand metadata adapters. Playback remains owned by radio.js. */
(function () {
    const unavailableUntil = new Map();
    const streamURL = station => station?.stream_320 || station?.stream_128 || station?.stream_hls || station?.stream_64 || '';
    function track(artist, title, cover = '') {
        artist = String(artist || '').trim().slice(0, 300);
        title = String(title || '').trim().slice(0, 500);
        try { cover = new URL(cover).protocol === 'https:' ? cover : ''; } catch (_) { cover = ''; }
        return artist || title ? {artist, title, cover} : null;
    }
    function splitTitle(raw) {
        const text = String(raw || '').trim();
        const at = text.search(/\s[-–—]\s/);
        return at < 0 ? track('', text) : track(text.slice(0, at), text.slice(at + 3));
    }
    async function json(url, signal) {
        const r = await fetch(url, {signal, credentials:'omit', cache:'no-store'});
        if (!r.ok) throw new Error('Metadata unavailable');
        return r.json();
    }
    function parseIcecast(data, url) {
        const sources = data?.icestats?.source;
        const rows = Array.isArray(sources) ? sources : sources ? [sources] : [];
        const mount = new URL(url).pathname;
        const row = rows.find(s => { try { return new URL(s.listenurl).pathname === mount; } catch (_) { return false; } });
        return row ? row.artist ? track(row.artist, row.title) : splitTitle(row.title) : null;
    }
    // Eurozet's official history API is JSONP-only with a fixed callback.
    // Run it in a sandboxed frame, isolated from the app and other requests.
    function zetHistory(signal) {
        return new Promise((resolve, reject) => {
            const frame = document.createElement('iframe'); frame.hidden = true;
            frame.setAttribute('sandbox', 'allow-scripts');
            const cleanup = () => { window.removeEventListener('message', receive); signal.removeEventListener('abort', abort); frame.remove(); };
            const abort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
            const receive = event => {
                if (event.source !== frame.contentWindow || event.data?.type !== 'rg-zet-metadata') return;
                cleanup(); resolve(event.data.data);
            };
            window.addEventListener('message', receive); signal.addEventListener('abort', abort, {once:true});
            if (signal.aborted) { abort(); return; }
            const start = Math.floor(Date.now()/3600000)*3600 - 3600;
            const url = 'https://rds.eurozet.pl/reader/history.php?true=jsonData&startDate='+start+'&emitter=radiozet&trackCount=60&_='+Math.floor(Date.now()/30000);
            frame.srcdoc = '<script>function jsonData(data){parent.postMessage({type:"rg-zet-metadata",data:data},"*");}<\/script><script src="'+url+'"><\/script>';
            document.body.appendChild(frame);
        });
    }
    function parseZet(data, now = Date.now()) {
        const parts = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);
        const p = Object.fromEntries(parts.map(x => [x.type,x.value]));
        const wallNow = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
        const rows = data?.messages?.[0]; if (!Array.isArray(rows)) return null;
        const current = rows.map(row => ({row, start:Date.parse(String(row.rds_start).replace(' ','T')+'Z')}))
            .filter(x => Number.isFinite(x.start) && x.start <= wallNow).sort((a,b) => b.start-a.start)[0];
        if (!current) return null;
        const age = (wallNow-current.start)/1000, duration = Number(current.row.rds_duration)||180;
        if (age > Math.min(1200, duration+90)) return null;
        return track(current.row.rds_artist, current.row.rds_title, current.row.img);
    }
    async function icy(url, signal) {
        const r = await fetch(url, {headers:{'Icy-MetaData':'1'},signal,credentials:'omit',cache:'no-store'});
        if (!r.ok || !r.body) { await r.body?.cancel(); return null; }
        const reader = r.body.getReader(), limit = 128 * 1024;
        const buffer = new Uint8Array(limit); let length = 0;
        try {
            while (length < limit && !signal.aborted) {
                const chunk = await reader.read(); if (chunk.done) break;
                const bytes = chunk.value.subarray(0,limit-length); buffer.set(bytes,length); length+=bytes.length;
                // Some hosts send ICY but do not expose icy-metaint through CORS.
                const raw = new TextDecoder().decode(buffer.subarray(0,length));
                const found = raw.match(/StreamTitle='([\s\S]*?)';/);
                if (found) return splitTitle(found[1].replace(/\0/g,''));
            }
            return null;
        } finally { await reader.cancel().catch(() => {}); }
    }
    async function fetchMetadata(station, outerSignal) {
        const url = streamURL(station); if (!url.startsWith('https://')) return null;
        if ((unavailableUntil.get(url)||0) > Date.now()) return null;
        const controller = new AbortController();
        const abort = () => controller.abort(); outerSignal?.addEventListener('abort',abort,{once:true});
        if (outerSignal?.aborted) controller.abort();
        const timer = setTimeout(abort,7000), signal=controller.signal;
        try {
            let hit;
            if (/streamtheworld\.com\/RADIO_ZET\./i.test(url)) hit = parseZet(await zetHistory(signal));
            else if (/somafm\.com\//.test(url)) {
                const channel = new URL(url).pathname.split('/').pop().match(/^([a-z0-9]+)-\d+-(?:mp3|aac)/)?.[1];
                if (!channel) return null;
                const data = await json('https://somafm.com/songs/'+channel+'.json',signal), song=data.songs?.[0];
                hit = song && Date.now()/1000-Number(song.date)<1800 ? track(song.artist,song.title,song.albumArt) : null;
            } else if (/kexp(?:128)?\.mp3|kexp\.streamguys/.test(url)) {
                const data = await json('https://api.kexp.org/v2/plays/?limit=1',signal), song=data.results?.[0];
                hit = song?.play_type === 'trackplay' && Date.now()-Date.parse(song.airdate)<1800000 ? track(song.artist,song.song,song.image_uri) : null;
            } else if (/icecast\.radiofrance\.fr\/fip(?:-hifi)?\./.test(url)) {
                const data = await json('https://api.radiofrance.fr/livemeta/live/7/fip_extended',signal), song=data.now;
                hit = song ? track(song.interpreters,song.title || song.firstLine,song.cover ? 'https://www.radiofrance.fr/pikapi/images/'+encodeURIComponent(song.cover)+'/400x400' : '') : null;
            } else if (!/\.m3u8(?:$|\?)/i.test(url)) {
                // Icecast status is a small JSON request. Match the exact mount,
                // never take a different station from the same server.
                try { hit = parseIcecast(await json(new URL('/status-json.xsl',url).href,signal),url); } catch (_) {}
                if (!hit && !signal.aborted) hit = await icy(url,signal);
                if (!hit) unavailableUntil.set(url,Date.now()+300000);
            }
            return hit || null;
        } catch (error) {
            if (!outerSignal?.aborted) unavailableUntil.set(url,Date.now()+300000);
            return null;
        } finally {
            clearTimeout(timer); controller.abort(); outerSignal?.removeEventListener('abort',abort);
            while(unavailableUntil.size>100) unavailableUntil.delete(unavailableUntil.keys().next().value);
        }
    }
    window.rgRadioMetadata = {fetch:fetchMetadata, parseIcecast, parseZet, splitTitle};
})();
