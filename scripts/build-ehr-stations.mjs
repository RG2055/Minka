#!/usr/bin/env node
/* EHR kanāli radio cilnei "EHR": nosaukums, grupa, logo, foto, krāsas un straume.
   Avots: ehr.fm "Online Radio" lapas dati (Inertia JSON, tas pats, ko rāda viņu vietne).
   Straumēm tīrā streamtheworld adrese (bez viņu lietotnes reklāmu ID).
     node scripts/build-ehr-stations.mjs   → data/ehr-stations.json  */
import { writeFile } from 'node:fs/promises';

const OUT = new URL('../data/ehr-stations.json', import.meta.url);
const UA = { 'User-Agent': 'Mozilla/5.0 (RG radio station list)' };
const home = await (await fetch('https://www.ehr.fm/', { headers: UA })).text();
const version = (home.match(/&quot;version&quot;:&quot;([0-9a-f]+)&quot;/) || [])[1];
if (!version) throw new Error('ehr.fm: Inertia version not found');
const page = await (await fetch('https://www.ehr.fm/online-radio', {
  headers: { ...UA, 'X-Inertia': 'true', 'X-Inertia-Version': version, 'X-Requested-With': 'XMLHttpRequest' }
})).json();
const channels = page?.props?.channels;
if (!Array.isArray(channels) || channels.length < 10) throw new Error('ehr.fm: channel list missing');

const stations = channels.filter(c => /^[A-Z0-9_]+$/.test(c.triton_mount || '')).map(c => ({
  mount: c.triton_mount,
  title: String(c.name || c.triton_mount).trim(),
  category: c.type === 'fm' ? 'FM radio' : String(c.parent_name || 'EHR').trim(),
  description: String(c.description || '').trim(),
  url: `https://playerservices.streamtheworld.com/api/livestream-redirect/${c.triton_mount}.mp3`,
  logo: c.logo_fallback || c.logo || '',
  icon: c.icon || '',
  photo: c.background_image_thumb || c.background_image || '',
  pattern: c.block_image || '',
  colors: [c.main_color, c.secondary_color].filter(v => /^#[0-9a-f]{6}$/i.test(v || ''))
}));
await writeFile(OUT, JSON.stringify(stations, null, 1) + '\n');
console.log(`data/ehr-stations.json: ${stations.length} kanāli`);
