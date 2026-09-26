# Google Apps Script

The app talks only to Cloudflare. These scripts run in the owner's Google
account; Cloudflare (`cloudflare/minka-api`) calls them with the shared key
`APPS_SCRIPT_KEY`, which each script checks against its Script Property
`MINKA_KEY`. Without the key they answer `{"error":"forbidden"}`.

| Project (Apps Script) | Used for | Called by |
| --- | --- | --- |
| Minka – Grafiks API | Radiographer + radiologist schedule with cell colours; hourly trigger copies the department's `GRAFIKS.xlsx` into the radiologist mirror sheet | `SOURCE_URL` — the cron copy in `upstream_cache` every 2 min |
| Minka – Rezidentu API | Residents from the same mirror (for the planned radiologist/resident app) | `RESIDENTS_SOURCE_URL` |
| Minka – Bolus API | Archive copy of every Bolus change (D1 `bolus_entries` is the store) | `BOLUS_SHEET_URL` |
| Minka – Nakts statistika API | Archive copy of every night plan (D1 `night_stats_log` is the store) | `NS_STATS_URL` |

Current sources are kept locally in `google_apps_script/live/` (git-ignored:
they contain colleague names and sheet IDs). Every deployment also keeps its
version history in Apps Script (Deploy → Manage deployments).

`minka_cloud.gs` is an older Bolus version, kept for reference only.
