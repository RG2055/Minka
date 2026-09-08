# Cloudflare release 2026-09-08

Backend changes are deployed. The frontend release targets GitHub `main` with service-worker cache version `minka-4.6.584`, as explicitly requested by the owner. The loader blocks remain unchanged; only the cache-version constant in `sw.js` changes. Google Apps Script source fixes are included in Git, but that separate service has not been deployed.

## Deployed versions

| Worker | Current version | Previous version |
| --- | --- | --- |
| lacitis-api | d1360c66-55ea-4485-8a0b-ddac22bcb0d6 | 84391506-23a1-49df-a092-97f8317e0bdd |
| minka-api | 05daed51-d8cd-4307-9496-571183cdcd5a | 93ab3d0c-008c-42d1-9733-ec67cba75be2 |
| minka-coffee-api | 217cd339-14bb-469e-b016-9d32fd6023df | 3b130f3d-fb35-413c-bf84-584625c93038 |

Downloaded source and settings were compared before deployment. Existing compatibility dates/flags, database and KV bindings, variables and secret bindings were preserved. The only deliberate configuration change was adding `https://rg2055.github.io` to the existing Lācītis origin allowlist after explicit user approval. Feedback API and unrelated Workers were not deployed.

Lācītis keeps its original `/dezura/*` handler and other routes. New host/player calls use `/dezura/v2/*`. Existing source outside that dispatch was checked byte-for-byte against the deployed original. Legacy clients keep their old behavior; the new session protections do not retroactively protect legacy name-only library endpoints.

## Explicitly requested profile reset

The owner requested and confirmed deletion of every shared profile, including PINs, radio settings/favorites and Lācītis libraries. Before reset: 98 worker records, 9 PINs, 3 libraries. All eight profile tables were emptied after the additive media schema migration. Post-reset counts were zero; the existing migration record remained. Schedule, card, emoji and coffee data were not cleared.

The database schema was reviewed for foreign keys and triggers before reset. No tables or database bindings were dropped. A D1 Time Travel bookmark was captured before mutation. Private release artifacts and the bookmark are in `/tmp/minka-release-20260908`; these temporary files are not a permanent backup. Full database export was rejected by automatic approval review and was not performed. Time Travel avoids downloading other users’ private data.

The server reset does not erase browser-local data on every device. Old already-open standalone players can still save their own local library through their legacy API. Those clients need a separate coordinated frontend rollout.

## Verification

- 208 Node tests passed, including account isolation, PIN recovery, failure/timeout handling, favorites, selected-day restrictions and the real music save-status message/render path.
- Syntax checks covered 56 tracked scripts, 50 inline scripts and 6 JSON files; new local modules were checked separately. Loader comparison and `git diff --check` passed.
- Live API checks passed for capabilities, unauthorized profile reads, legacy method handling, main authentication, valid/invalid coffee dates and the local profile proxy.
- CORS checks passed for Minka and Lācītis origins; an unrelated origin was not allowed.
- Only Rihards was used for authenticated live testing. The user entered the new PIN and handled the recovery code themselves.
- Radio favorites persisted after reauthentication. A temporary Record favorite was removed, preserving the user's Remix and CAPITAL FM choices.
- A temporary music favorite was saved to D1 and removed. Final D1 counts: 2 radio favorites, 0 music favorites, 0 music history entries.
- The personal card option showed Rihards' saved cyborg background, with album colors active. Inspection was cancelled without changing his settings.
- Logout cleared both radio and embedded music identities; the local page was left in guest mode.

Reloading the page returns the calendar to today. If the logged-in person is not on that day's roster, the profile locks as designed; this required reauthentication during the future-day test. A physical old-PC performance benchmark and exhaustive third-party audio-stream testing were not performed.

## Rollback boundaries

A Worker regression can be rolled back to its previous version without removing additive tables. Do not restore the entire database merely to roll back code: doing so would undo the explicitly requested reset and overwrite profiles created afterward. A D1 restore requires a separate deliberate data-recovery decision. Keep the new frontend local if rolling back the versioned profile API.

Run `node scripts/local-live-server.mjs 8000` for real-data local preview. The synthetic server on 8012 is a separate fixture and must not receive real PINs.

## Shift handover follow-up

Version d1360c66-55ea-4485-8a0b-ddac22bcb0d6 makes new versioned sessions expire at the next 08:00 Europe/Riga duty boundary. The local frontend also persists that deadline, checks it after sleep and blocks late responses. Nine additional tests cover exact handover, wake-up, delayed responses, server enforcement and DST. Existing session deadlines were capped at 2026-09-09T05:00:00Z; SQL succeeded and no session rows required shortening. This change does not remove profile data or change legacy standalone routes, bindings or origin settings.

## GitHub frontend release

Cloudflare deployment inspection confirmed all three versions above were already active; this frontend release does not redeploy them. The profile module matches the previously deployed build. Privacy checks cover the staged release; local drafts, raw audit outputs, temporary exports and unrelated art experiments are excluded. Latest syntax checks cover 80 JavaScript modules, 51 inline scripts and 10 JSON files. Release includes shared profiles, recovery, duty-boundary logout, personal appearance restoration, station logos/picker, desktop media toolbar, mobile radio exclusion and continuous calendar surfaces. Cache activation already discards old JS/CSS/HTML entries, so the version bump refreshes changed code without changing loader behavior.
