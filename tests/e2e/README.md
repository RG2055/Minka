# Minka browser regression tests

Behavioural checks that click through the real calendar and shell in Chromium.
They are separate from `kalendars/test/*.test.mjs` (source-level unit tests) and
are not part of the deployed site.

## Setup (once)

```bash
cd tests/e2e
npm install
npx playwright install chromium
```

## Run

Start the synthetic server in another terminal (`node scripts/local-audit-server.mjs`),
optionally the real-file server for the offline check (`node scripts/local-live-server.mjs 8024`), then:

```bash
node run-all.mjs http://127.0.0.1:8012 http://127.0.0.1:8024
```

| Script | Checks |
|---|---|
| `functional.mjs` | load without JS errors, day switching, worker modal, coffee, mood vote, comments, search, shift-timer colours, daily cat animation, night panel, month calendar, dock buttons, cross-frame storage sync, mobile |
| `shift-states.mjs` + `shift-assert.mjs` | shift lifecycle with timed fixture data: active, 3 min left, just ended, old completed, selected past/future day, 07:59 / 08:00 duty-day rollover, a live crossing of 16:00 |
| `hidden-polling.mjs` | news/weather do not poll while the app is hidden and catch up on return |
| `mobile-badge.mjs` | the birthday badge settles once in the right header row (with and without mobile-v2) |
| `offline.mjs` | after one visit the calendar loads offline from the service worker |

## Visual comparison (before/after a change)

Randomness is seeded per call site and animations are frozen, so identical code
gives identical screenshots except for a few known races (night-panel dream emoji,
the “63 % NOGURUMS” mood label, day-strip scroll position).

```bash
# 3 baseline runs on the version you compare against, then the changed version
for i in 1 2 3; do node visual-capture.mjs http://127.0.0.1:8013 out/base-$i; done
node visual-capture.mjs http://127.0.0.1:8012 out/after
node visual-compare.mjs out/base-1,out/base-2,out/base-3 out/after out/diff
```

`shift-states.mjs` output from two versions can be diffed the same way to prove
the shift lifecycle did not change.
