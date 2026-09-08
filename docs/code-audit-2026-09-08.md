# Local code audit — 8 September 2026

Completed an audit pass across the desktop shell, mobile shell, radio/music code, calendar modules, API workers, Apps Script, and supporting assets. Changes remain local. Nothing was committed, pushed, deployed, or written to a live service.

The loader was excluded from changes. Loader-containing script/style blocks in all three HTML entry points match HEAD exactly. `sw.js` is unchanged. Follow-up verification also changes mobile night-panel rules in `kalendars/css/nightsplit-brand.css` and versions the changed script/style references. Loader code remains unchanged. Existing untracked work was preserved.

## Fixed locally

| Area | Finding and resulting behavior | Location |
| --- | --- | --- |
| Radio | A response for the previous station could overwrite the new station's metadata. Station generations now reject obsolete responses, including after switching to a station without metadata. | `js/radio.js:382` |
| Radio performance | Slow metadata polls could overlap. One poll runs per current station generation; identical artist/title/art responses no longer rewrite the UI, refit text, or emit artwork events. | `js/radio.js:382` |
| Desktop and mobile bolus sync | Simultaneous refreshes issued duplicate requests. Concurrent callers now share a request. A response started before a local edit cannot overwrite that edit after the existing time-based protection expires. | `index.html:3008`, `mobile.html:995` |
| Desktop and mobile bolus performance | Unchanged remote history caused storage writes and rebuilt the open panel. Unchanged responses now produce no storage writes or repaint callback. Remote deletions still correctly move the displayed timestamp backward. | Same sync functions |
| Desktop and mobile bolus saves | Any resolved HTTP response produced a success toast, including rejected saves. The client now requires both successful HTTP status and `{ok:true}` and bypasses caching for the write request. | `index.html:2878`, `mobile.html:978` |
| Mobile time picker | An old saved 17:00 entry opened at 09:00 could suggest 17:00 today, a future timestamp. It now selects the most recent matching clock time, consistent with desktop. | `mobile.html:958` |
| Calendar geometry | `requestAnimationFrame(autoSizeCards)` passed its timestamp as a container-width hint. The callback now measures the real width. | `kalendars/js/calendar_extras_v4.js:149` |
| Calendar accents | The accent pass reread computed root styles for every card after style writes. It now reuses the two role colors read at the beginning of the pass. | `kalendars/js/calendar_extras_v4.js:203` |
| Emoji sync | Background polling continued while hidden, allowed concurrent reads, rewrote unchanged data, and could overwrite a newer selection. Reads now pause while hidden or saving, coalesce, skip identical snapshots, and reject responses predating a local edit. Writes are serialized and each click is persisted locally immediately. | `kalendars/js/emoji.js:246` |
| Birthday loading | A failed first request remained permanently cached as the load promise. Failed reads can now retry; successful results remain cached. Authentication completion also triggers a retry. | `kalendars/js/monthcal.js:164` |
| Month overview | Fractional shift hours were rounded; 7.5h appeared as 8h. Decimal hours are preserved. Both stages of deferred fitting can now be cancelled during resize bursts. Parent messages must come from the same-origin parent window. | `kalendars/js/monthcal.js:62`, `:366`, `:691` |
| API request handling | Coffee and main API JSON limits were checked after buffering the entire request. Both readers now count streamed bytes, cancel oversized bodies, decode split UTF-8 correctly, and release their reader locks. | `cloudflare/coffee-api/src/index.js:19`, `cloudflare/minka-api/src/index.js:713` |
| API emoji enumeration | Only the first KV page was read, and night plans were fetched as if they were emoji entries. Enumeration now follows cursors and excludes internal plan/art/state keys before reading values. | `cloudflare/minka-api/src/index.js:386` |
| Login | An absent or empty password binding could produce a successful login response for a matching empty request. Login now fails closed. Existing protected-route authentication was already stricter. | `cloudflare/minka-api/src/index.js:279` |
| Coffee API | Accepted worker names such as `constructor` or `__proto__` could collide with object prototypes, break detail aggregation, or disappear from JSON. Count/detail maps now have no inherited prototype. | `cloudflare/coffee-api/src/index.js:155` |
| Apps Script history | Formatted spreadsheet date cells can be returned as Date objects. History reads attempted to parse their string representation as `DD.MM.YYYY`, silently omitting those rows. Reads now use the existing Date-aware parser. | `google_apps_script/minka_cloud.gs:69` |

## Verification

- Existing baseline: **103 tests passed**.
- Initial audit suite: **120 tests passed**, including 17 new regression tests in `kalendars/test/app-audit.test.mjs`.
- After the history follow-up: **133 tests passed**, including 13 additional delayed-response/render/retry tests in `kalendars/test/night-stats-loading.test.mjs`.
- Broad static pass: **56 tracked JS/GS/module files, 50 executable inline scripts, and 6 JSON files** checked without syntax/JSON failures. Static HTML script, image, stylesheet, iframe, and media references resolved locally. The documented `cloudflare-worker-ns-additions.js` insertion snippet was excluded from standalone syntax execution because it intentionally contains handler-level returns.
- `git diff --check` passed.
- Headless Chrome used a temporary profile, localhost server, synthetic staff/roster data, intercepted external page requests, and disabled service-worker registration in the test environment. It did not use the user's browser session or contact live application APIs.
- Desktop at 1440px, mobile at 390px, and standalone calendar at 1440px each rendered six synthetic worker cards, with no uncaught JavaScript exceptions or failed local resource requests. Document width matched viewport width in each case.
- Month view opened/closed in all three views; statistics opened in all three; both bolus panels opened; desktop radio controls toggled and radio modules initialized successfully.

Run the regression suite locally:

```sh
node --test kalendars/test/*.test.mjs cloudflare/feedback-api/test/*.test.mjs
```

The performance improvements are reductions in unnecessary work, verified through behavior tests: duplicate reads become one request; unchanged bolus responses cause zero saves/repaint callbacks; hidden emoji polls cause zero requests; identical radio metadata skips UI fitting. No production latency or percentage-speedup claim is made.

## Remaining findings and limits

These were identified during the audit and remain open:

1. **Shared skin updates can lose concurrent changes.** The main worker reads and overwrites the entire `skins:v1` map (`cloudflare/minka-api/src/index.js:454`, `:501`). Two devices updating different people can overwrite one another. This needs a storage/concurrency design change, such as independently stored person records or transactional coordination, with migration tests.
2. **Coffee counts and events are not atomic.** The count update precedes a separately caught event insert (`cloudflare/coffee-api/src/index.js:241`). An event-storage failure can leave totals and source/spend details inconsistent while the request reports success. The current compatibility fallback for unmigrated databases makes this a migration-sensitive change.
3. **Startup/cache risks were left unchanged to preserve loading behavior.** Service-worker activation migrates/deletes every other same-origin cache without checking an application prefix (`sw.js:60`, `:76`). Mobile's version-change cleanup still deletes schedule fallback caches (`mobile.html:1791`). These deserve a separate cache/update test pass before changing startup behavior.
4. **Bolus edit/delete identifies rows only by room and minute.** Two entries in the same room within one minute can be ambiguous (`google_apps_script/minka_cloud.gs:40`). Stable row identifiers require coordinated client/server changes and migration of existing history.
5. **Multipart uploads still buffer before validating actual size.** The skin-art route checks declared Content-Length but calls `request.formData()` before examining the image (`cloudflare/minka-api/src/index.js:430`). The JSON streaming fixes do not cover this path.

Coverage is a broad static/behavior audit with targeted fixes, not proof that every execution path is bug-free. Calendar model regressions, existing feedback authorization tests, and synchronization tests were run; model equations were not changed or medically validated. Bundled third-party libraries were not rewritten or subjected to an online vulnerability scan. Real audio playback, hosted music account actions, external weather/news services, production D1/KV behavior, actual Apps Script execution, and installed-PWA updates require integration checks outside this local-only run. Backend/App Script fixes will not affect the live application until separately deployed.


## Follow-up: slow “Šīs maiņas vēsture”

The initial browser smoke test did **not** open the night panel or simulate a slow history response. Its successful results did not establish that this panel loaded promptly. The user's report exposed that coverage gap.

The existing history reader discarded snapshots older than 12 hours for display, leaving the panel empty until `/api/ns-stats` replied. That route waits on an external Apps Script summary. History fetching was coupled to constructing the panel; existing idle rendering could already start it before the user opened the overlay, so saying it always started only on opening was incorrect.

Local changes in `kalendars/js/nightsplit.js`:

- Paint a valid saved snapshot immediately, even past 12 hours, and label old data with its saved date. Refresh it in the background.
- Start a shared history request after roster readiness without waiting for panel construction. Respect hidden-page and authentication state.
- Bound the whole read, including response-body parsing, to 15 seconds. Keep saved rows on failures; show an error when there is no saved history. A retry is allowed after a 30-second cooldown.
- Reopening an unchanged plan retries history too: the existing fast path reuses the panel DOM.
- Ignore obsolete rendering callbacks after a different selection, an empty plan, or panel replacement. Timed-out responses cannot overwrite a newer result.

Browser comparison used the actual local calendar and night scripts, synthetic staff, a 13-hour-old saved snapshot, and an artificial 10-second API response. A temporary localhost fixture supplied all API responses; a CSP blocked external requests. The previous night script came from HEAD, without modifying the working tree.

- Previous code: first history rows appeared **10,002 ms** after history-body creation.
- Changed code: saved history appeared in the same rendering turn (**under 1 ms** by the fixture observer). It initially showed the 10-night saved fixture and later updated to the 20-night response, removing the old-data label.
- Cold first visit, opened immediately without a saved snapshot: **10,001 ms**, as expected with the artificial 10-second response. No history was fabricated.
- One history request per page; no uncaught page errors in those runs. Screenshots of both open panels were inspected.
- These are synthetic measurements of time until rows are present, not a production network speedup or a guaranteed click-to-paint time. The cold first visit still depends on the external server. No backend was deployed.

The 13 added tests cover fresh/expired cache, prefetch completion, overlapping callers, changed/empty/detached panels, HTTP and malformed-response failures, hung headers/body, retry after timeout, late response rejection, hidden/auth state, and reopening an unchanged plan. Loader blocks and `sw.js` were compared with HEAD again and remain unchanged.


## Additional verification and fixes after the request for stronger assurance

The failure-recovery pass reproduced nine failing cases before repairs (hung bolus headers/body in both shells, hung emoji read/save queue, radio station-map failure/hang, malformed birthday data). A subsequent visible-emoji regression test also failed before repair. These were real coverage gaps; the previous green suite did not rule them out.

Local repairs:

- Bolus reads, emoji reads/saves, radio metadata requests, and birthday reads now have a 20-second deadline and abort signal. Timeouts release the client request/queue; late read responses cannot overwrite a later successful result. This does not prove a remote server cancelled a timed-out write.
- Failed radio station-map reads are retryable instead of permanently caching an empty map. Malformed birthday responses are retryable, and successful empty lists are still valid.
- Emoji updates now refresh the visible `.mk-mid-meta-emoji` badge and its animation glyph/home attribute. Before this repair the stored choice and hidden badge updated, but the visible initials could remain.
- Mobile night panels retain their readable width and scroll vertically rather than fitting a tall stacked layout to screen height. Re-fitting preserves scroll position. Controls wrap inside the panel, and history columns fit at 320px.

Final verification: **157 passing tests**, including **24 additional tests** in `kalendars/test/audit-failure-recovery.test.mjs`. The source syntax/JSON pass still covers 56 tracked scripts/modules, 50 inline scripts, and 6 JSON files. Loader-containing blocks were compared with HEAD; `sw.js` is unchanged. `git diff --check` passed.

Browser checks used the local UI with synthetic data and external connections blocked:

- Desktop: night open/close; ten further open/close cycles all retained exactly four history rows with one history request and no captured page exceptions. Month/week calendar and birthday list opened; bolus save produced a new history row and “Saglabāts”; statistics showed records and accepted sorting; radio panel and local station list opened; emoji save updated both visible ALPHA badges to 🦊.
- Mobile at 390×844: night open/close and actual scrolling to the history; bolus selection/save and new history row; statistics; system-info panel; calendar date selection updated the displayed date to 09.09.2026. No captured page exceptions.
- Desktop at 1440×1000 after mobile repairs: night content width and scroll width both 1262px, scale 1; screenshot inspected.
- Mobile at 320×740 after the narrow-column repair: history width/scroll width both 278px; header width/scroll width both 280px; history screenshot inspected after scrolling.
- Planner shell opens, but its external iframe is deliberately blocked by the isolated fixture. Real planner content, audio streaming, external fonts/icons, music authentication, actual cloud writes, and installed-PWA update behavior are **not** validated by this browser pass. Missing external icon fonts in screenshots are a fixture limitation. Device-size emulation is not a test on physical iOS/Android hardware.

A repeatable localhost-only synthetic fixture is saved as `scripts/local-audit-server.mjs`. Run `node scripts/local-audit-server.mjs`, then visit `http://127.0.0.1:8012/index.html` or `/mobile.html`. For slow/cold night history, use `/kalendars/index.html?delay=10000&cold=1`. Its injected fetch responses, token, and controls exist only in the test server responses; the app entry points do not contain the fixture. Test data is isolated by the 8012 origin. All existing open findings listed above remain open.

## Local radio ambience and Fluent dreams

The final design keeps the radio in its original rounded window. Its RADIO/MŪZIKA selector has translucent surfaces and inline Fluent-inspired SVG icons. A single host-level gradient creates continuous ambient colour around the radio and through the calendar. While active, calendar shell/side-column backgrounds and the old duty-list gradients are transparent, removing the rectangular patches; the bottom of each side column fades gently. The radio's own background, border and rounded corners remain. A conflicting legacy shadow transition no longer replaces the radio's minimize/restore slide.

The ambience follows the selected radio theme, or the existing album-accent result in album mode. It uses no additional audio/image sampling, canvas, JavaScript animation loop or polling. CSS animates only the background's transform. It pauses when the radio is minimized/closed, the page is hidden, or full-screen music covers the calendar. Reduced-motion and modest-device profiles keep it static. Calendar state arrives through validated same-origin parent messages.

Dreams reuse the existing local Fluent emoji frame strips, with one moving emoji and a thematic static companion per scene (stars, coffee, garden, music). There are no generated cat pictures or cloud-inside-cloud decorations. Sprite playback is capped at 12 frames/second and pauses outside the viewport, outside the night overlay, when the radio is expanded, and on hidden-page state. IntersectionObserver defers each strip's first load until visible. The four-phone dream for the next night slot is preserved. Old detached dream nodes are released.

Verification: **165 tests passed**, including 8 ambience/dream lifecycle tests. These cover hidden/expanded/minimized/closed state, full-screen music, reduced motion/modest devices, message origin/source validation, deferred strip loading, viewport pause, detached-node cleanup, existing assets/frame counts and four-phone content. Tests deliberately provide no timers, fetch or requestAnimationFrame to the ambience controller.

Browser checks on the isolated local fixture confirmed theme/album palette propagation, transparent RADIO/MŪZIKA controls, preserved 22px radio corners, five repeated minimize/restore cycles, paused+hidden ambience after minimizing, and paused dreams while the radio is expanded. At 390px width, off-screen dreams had no image src until scrolled into view; after scrolling, the three off-screen dreams were paused and the newly visible dream was running. Final computed styles confirmed transparent calendar/side-column/duty-list backgrounds and an intact radio image. Screenshots were inspected. Hidden installed-PWA state and low-spec hardware are covered by simulated lifecycle tests, not a physical old-PC benchmark. External audio/music services remain outside this synthetic check.

All work remains local. The loader-containing blocks and service worker remain unchanged.

Dream appearance correction: restored the original light SVG thought-cloud outline and its previous 76%-of-bed width/position (replacing the enlarged 92% oval). Fluent sprites and companions are smaller and sit inside the cloud. Visibility-based loading/pausing and the next-slot phone rule are unchanged. The 10 targeted dream/ambience tests passed, the open night panel was inspected in the local browser, and loader-block checks still passed.

Radio/music side-card follow-up: added a late scoped stylesheet for the existing `host-radio-open` state. Side cards use smaller spacing, icons and fatigue rings, retain names/shift/next-shift/month counts, and take their translucent colour from the radio palette. Decorative month dots are omitted only in this compact view to keep the numeric total on one line. Long lists scroll. There are no new scripts, timers, animation loops or changes to the loader. Browser fixture comparison at 1280px: radiographer card height changed from 155.85px to 94.87px (about 39% shorter); radiologist cards from 146.01px to 94.87px. Radio and music both used the compact layout, with no horizontal card overflow. The ordinary layout returns after minimizing.

Initials-flash follow-up: the first card render incorrectly used the day/night shift symbol as the personal badge when no personal emoji was set; the later emoji hook replaced it with initials. `buildMidMeta` now receives only the personal emoji, so initials render immediately. A regression executing the actual card builder failed before the fix (`☀️` instead of `AJ`) and passes for day/night cards with and without a personal emoji after the fix. The 35 targeted failure-recovery/dream/ambience tests passed; source syntax/JSON and diff checks passed, with loader blocks and service worker unchanged. In the garden dream, the butterfly is now left of the cat at its face, as confirmed by the user. The small cloud and existing Fluent animation remain; the local synthetic night panel was visually inspected.

Dream variety correction: expanded the four cat-led scenes into twelve distinct local Fluent subjects, with only two cat scenes. Added coffee/croissant, music, space travel, dolphin/sea, hedgehog/mushroom, rabbit/carrot, meditation/lotus, panda/bamboo, penguin/snow and rainbow/tulip. Stable per-person selection, one moving strip per cloud, small cloud dimensions, deferred loading and visibility/radio pausing remain. All twelve asset paths and frame counts were checked by the existing expanded asset test; all ten targeted dream/ambience tests passed. The local fixture visibly showed mixed subjects in the same night panel.

## Station picker follow-up

Station selection now leaves the picker open; close, Escape and outside-click dismiss it. The chosen station gets a checkmark rather than a misleading pause symbol. The panel matches the radio palette with a subdued gradient, smaller rows and SVG controls. A brief entrance replaces continuous effects; no blur or per-logo filters were added.

The picker builds its controls once, indexes searchable text once per catalogue, defers hidden catalogue rendering, and retains the existing list DOM/images, query and scroll position on reopen or selection. Selection updates only the old/new marks. Search debounce cannot revive a stale query after a source switch. Resizing keeps the picker and close button within the viewport. Local regression tests check these behaviours, including playback not closing the picker and catalogue replacement invalidating the cache.

Logo correction: the former Lacitis logo endpoint returned HTTP 404 (verified against its SWH URL). Local station logos now take precedence over stale feed covers. Added 79 small original logo files (about 403 KB total) with source URLs recorded in `data/radio-logos/sources.json`; these are lazy-loaded, not downloaded together by the app. They cover the mapped Latvian stations and many international entries in that catalogue, including ABC Lounge and Chilltrax. Stations without a verified logo retain a working local radio icon; not every international entry has a bespoke logo. No stream URLs or playback quality settings were changed. The fixture now serves ICO files too.

Validation: 28 targeted tests passed, including seven picker tests and existing audio/source regressions. Source syntax/JSON and diff checks passed; loader blocks and service worker remain unchanged. Browser fixture checks confirmed selecting Russian Mix keeps the panel open and updates the marker, searching/changing catalogue, retaining a query after close/reopen, closing by the cross and outside click, and successfully decoded real local LR1/LR2/LR3, SWH, EHR and Skonto logos. This establishes DOM/network work avoidance, not a physical old-PC CPU benchmark or an external-stream playback check.

Side-card fatigue appearance: replaced the older thick bubble rim, wavy clipping and decorative bubbles with static glass-like gradients, a thin light edge and a smooth tinted fill. Score calculation and markup are unchanged; the fill uses the existing score percentage and fatigue colour. No backdrop filter, animation or new JavaScript was introduced. Browser checks confirmed the usual 40px and radio-open 32px circles, readable score placement and computed `backdrop-filter: none` / `animation: none`. Syntax/JSON and diff checks passed; loader and service worker remain unchanged.

Curated random dreams: removed the rainbow scene and replaced fixed name hashing with a shuffled pool of 16 themed scenes (eight animals, eight objects). The pools alternate to keep neighbouring first assignments mixed, without repeats until the pool is exhausted. Per-person choices are cached for the selected roster date during the page session, so redraws and closing/reopening retain the dream; a new date or page load draws again. Existing Fluent strips, small clouds, four-phone rule and visibility/radio pause behaviour remain. Ten targeted tests passed, checking all assets/frame counts, distinct selections, object/animal balance, stable redraws and a fresh shuffle on date change. Browser inspection showed dolphin, flying saucer, fox and compass; closing/reopening retained those choices. Loader/static and diff checks passed.

Next-shift personal skins: each `.mk-next-person` now reads the full worker's saved image/art/gradient/tint and text/number colours through the existing skin pipeline. Changes, live preview, cloud refresh and resets include the next-shift pills. A dedicated `data-next-worker` attribute deliberately avoids existing today-only carryover cleanup and nameday hooks. Only each pill receives its background and static glass highlights; section titles, summaries and containers are unchanged. No new polling, particles, backdrop blur or animation. Three targeted tests passed for individual isolation, full-name resolution, image/gradient/tint/art switching and reset. Browser UI selection of Lavanda applied its background and text colours to ALPHA's next-shift pills while BETA/GAMMA/DELTA retained their defaults. The isolated fixture's generic `/api/skins` response can clear test selections on its next cloud refresh; real cloud persistence was not exercised. Syntax/JSON, loader and diff checks passed.

Fatigue liquid correction: replaced the flat simulated-glass treatment above with the existing mood glass lens asset and a separately clipped inner liquid vessel. The existing fatigue percentage controls its fill height, with a small elliptical surface highlight and translucent tint. Score calculation is unchanged. The only transition follows an actual height change; there is no continuous animation, backdrop blur or new asset. A dedicated score class keeps the compact radio rules from styling the vessel. Local browser inspection confirmed the same mood lens, a 58% fill (20.875px inside 36px), normal 40px size and radio-open 32px size with a 12px score. Both layouts were visually inspected. Source syntax/JSON and diff checks passed, with loader blocks and service worker unchanged.
