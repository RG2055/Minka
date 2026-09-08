# Shared radio and music profile integration

Backend deployed on 2026-09-08; the updated host page and embedded player remain local. Reuses the existing `lacitis-api` D1 binding `DB`, PIN records and music libraries. Never create a separate radio PIN store or replace the existing database.

## Files

- `dezura-auth.mjs`: session-checked auth/library/radio API; PIN recovery; optional admin recovery.
- `schema.sql`: additive tables for sessions, attempts, radio preferences and recovery hashes.
- `build-worker.mjs`: integrates this handler into an exported copy of the existing bundled Worker, preserving its original auth and non-auth routes. New host/player calls use `/dezura/v2/*`; legacy `/dezura/*` calls retain their previous handler. Fails if expected source anchors differ.
- `player/`: local copy of the existing public Lācītis player with `shared-profile.js` bridge. The embedded player receives the same short-lived session, verifies it with the server and checks ownership before applying delayed library responses. Old library contents are retained.
- `local-db.mjs`: Node SQLite adapter for tests, not a production D1 replacement.
- `admin-recovery.mjs`: administrator CLI; reads `LACITIS_RECOVERY_ADMIN_KEY` from its environment, requires typing the account name, and displays a replacement recovery code. No PIN is read or sent back.

## Local checks

Requires Node with `node:sqlite` (tested on Node 24).

```sh
node --test integrations/lacitis/test/*.test.mjs kalendars/test/media-profile.test.mjs
node scripts/local-audit-server.mjs
```

The local test server listens only on `127.0.0.1:8012`; its synthetic database is `/tmp/minka-media-fixture.sqlite`. It uses synthetic calendar data and blocks external player requests. This is UI/auth verification, not a live radio-stream benchmark. Do not enter real staff PINs in synthetic test profiles.

## Review build and later deployment

Release procedure:

1. Save the existing Worker source/settings and a D1 Time Travel bookmark. Do not export private account data without authorization. Check ambiguous duplicate accounts by normalized name; the handler refuses to silently merge multiple PIN-protected accounts.
2. Review and apply `schema.sql` to the existing D1 DB. The migration only adds tables/indexes. Never drop the original `dezura_workers`, `dezura_pins`, or `dezura_libraries` tables.
3. Produce and review the integration from an up-to-date exported Worker:
   `node integrations/lacitis/build-worker.mjs /path/to/exported-worker.js /path/to/review-output`
4. Preserve the current D1 binding, CORS/origin configuration and all non-auth endpoints. If administrator recovery is desired, configure an independently generated secret of at least 32 characters under `LACITIS_RECOVERY_ADMIN_KEY`; do not put it in frontend code or Git.
5. Coordinate host page and embedded-player release. The new `/dezura/v2/library/*` routes require a session. Original `/dezura/*` routes are retained for old deployed players; their historical name-only library access is not secured by the new handler. Other deployed standalone clients have not been migrated here.
6. Verify login and song-library behavior only against approved production test accounts, plus recovery, revocation, CORS and selected-day UX. Do not assume the synthetic checks establish production compatibility.

The selected-day radiographer list is enforced in the host UI; the API has no authoritative server-side schedule feed. Sessions are account-scoped and expire at the next 08:00 duty-day boundary in Europe/Riga, including daylight-saving changes. PIN/recovery attempts are limited by account and source IP. Profile identifiers are normalized-name-derived for new accounts; renaming staff and collisions need administrator review.

## Recovery and data behavior

A random recovery code is shown once on first successful login; only its hash is stored. Recovery atomically changes the PIN, revokes sessions and rotates the code, preserving libraries and radio preferences. Administrator recovery is disabled without its separate secret and replaces the recovery code only; the user then chooses a new PIN. Identity verification by the administrator is an operational step outside this API.

Radio updates are typed operations with optimistic revisions and idempotent replay. The legacy music library still uses whole-document saves; simultaneous edits from different devices can overwrite one another. Avoid claiming concurrent merge support. Browser changes queued offline are stored under their original account, so logout cannot transfer them to another person.

Vendor UI dependencies are local MIT-licensed files. Driver.js supplies contextual steps; Floating UI supplies anchor positioning. The browser's native dialog handles modal focus. No React/runtime framework or external onboarding service is added.

## Production release 2026-09-08

The owner explicitly requested a complete reset of every shared profile, including PINs, radio preferences and music libraries. Before reset there were 98 worker records, 9 PINs and 3 libraries. An additive migration created the new media tables; an explicit one-time SQL operation then emptied all eight profile tables, retaining their schema and the migration record. No schedule/card/coffee database was cleared. No profile reset is included in normal deployment scripts.

`lacitis-api` version: `d1360c66-55ea-4485-8a0b-ddac22bcb0d6` (08:00 shift expiry; previous `84391506-23a1-49df-a092-97f8317e0bdd`). Existing D1 binding, compatibility date and flags were verified unchanged. With the owner’s explicit approval, `https://rg2055.github.io` was added to `LACITIS_ALLOWED_ORIGINS`; the existing `https://lacitis.pages.dev` entry remains. Both allowed origins and rejection of an unrelated origin were checked. Existing Worker source outside the new route dispatch was compared byte-for-byte. Anonymous versioned radio reads return 401; capabilities return version 2; the legacy endpoint retains its expected method response.

`media_identities` supports an explicitly reviewed canonical account mapping for ambiguous old names. No production mappings were inserted because the owner chose a full reset. The handler still refuses ambiguous PIN accounts unless a matching reviewed mapping exists.

Use `node scripts/local-live-server.mjs 8000` for the real-data local preview. It binds loopback only, serves project files without cache, and proxies only `/dezura/v2/*` to the existing production Worker. It never logs PINs or tokens. The synthetic server on 8012 remains separate; never enter real PINs there. Existing browser-local guest playlists are separate from Cloudflare profiles and were not erased.

The older deployed player is still compatible, including its prior save behavior. An already open old client may save its own local library again; the server-side reset does not erase data from every user's browser. Migrating those clients is a separate frontend rollout.

Live verification used only the owner’s newly created profile. Radio favorites persisted through reauthentication; the temporary test station was removed, leaving the owner’s two choices. One temporary music favorite was saved and then removed; D1 confirmed two radio favorites, zero music favorites and zero history entries. The owner’s card background and album-accent mode were inspected without changing settings. Logout cleared both radio and music identity. A page reload returns the calendar to today; a profile not on that day’s roster is consequently locked.

The local music profile now reports actual syncing/success/error state, forwarded by the player, instead of treating any active session as proof of a successful save. Regression coverage exercises the real state-message/render path. Full suite: 194 passing tests.

### Shift handover logout

The host persists the duty deadline and clears the shared radio/music session at 08:00 Riga time, independently of the selected calendar date. Visibility, focus, pageshow, network-resume and input guards catch sleeping or throttled tabs. Late load/save responses cannot restore an expired profile. The versioned API rejects expired sessions independently of the browser. A one-time SQL cap was successfully applied to existing session deadlines; no existing rows required shortening. PINs, recovery records, favorites and libraries remain intact. Legacy standalone routes retain their existing behavior. Full suite: 203 passing tests, including exact boundary, wake-up, delayed responses and DST cases.
