# Radio UI

## Existing system
Preserve the existing Classic, Clean and Pioneer layouts. Pixel is an additional album-focused skin with muted Material-inspired surfaces and existing accent settings.

## Learned constraints
- 2026-09-19: Pixel Play/Pause must be a true circle, not an oval. Keep equal width and height in both states.
- 2026-09-19: Do not show a redundant “Skan” status or numeric volume badge. The existing play control and volume slider already communicate these states.
- 2026-09-19: Do not include a sleep timer (latest correction).
- 2026-09-19: Keep the skin button visible in every layout, including over album artwork. Guest skins must change even after a quick minimize/reopen.
- 2026-09-19: The transient volume readout must fit inside the compact Pixel meter; do not add a permanent volume badge.
- Work remains local until the user requests publishing.

- Pixel colors fill the entire body; named palettes and album colors remain selectable beside skins and participate in guest random rotation.
- Pixel defaults to the upstream WavySliderExpressive/Material wave, not generic bars. Manual spectrum changes remain available and persist.
- Place the Pixel wave below the artist and directly above the EQ presets.
- Header, 2026-09-19: always retain the panorama in every skin and random choice; only restyle controls/colors. Preserve layout. Selected and unselected days must share the same shape. Use readable Se / Sv weekday labels. Progress track ends use a subtle 2px radius, never asymmetric semicircles. Header preferences stay local; no login or publishing in this pass.
- Random guest appearance applies on the first open after reload as well as reopen; Pixel has no priority. Random Pixel and explicit Pixel layout selection default to album-following colors. Fixed palettes require an explicit palette choice.

- Header correction, 2026-09-19: put the appearance palette icon in the header action row beside the menu, never in the bottom dock. An open radio temporarily gives the header the actual album color; closing restores the saved header palette. Keep the panorama visible.

- 2026-09-19 correction: remove NumberFlow entirely; clock/countdown/percent update as plain text. New backgrounds must depict Latvia only. Include the newly generated Riga panorama plus a different Latvian landscape (Baltic coast), each following the existing Riga-time day-period schedule. Use Geist Sans for header/player UI and Geist Mono for time. Birthday display is a simple icon/name, not a pink pill.

- 2026-09-19: Cloud animation follows the visible sky crop of each Latvian panorama and its four time-of-day lighting states; keep drift in CSS. The header phone-directory action uses a handset/keypad icon and the label “Tālruņu numuri”, not a generic menu icon.

- Cloud visibility correction: retain the original slow 150s / 210s drift and travel distance. Improve texture sizing/contrast only; no extra particles, layers, or per-frame JavaScript.

- Cloud texture must never repeat as identical small stamps across the header; use a broad non-repeating crop with the original slow drift.

- Live header progress/countdown is shown only for the current duty-day (existing 08:00 rollover). Past/future dates hide the whole row and skip live progress calculations; selecting today resumes it. Retain the lightweight rollover check while browsing other dates.

- 2026-09-20: Apply the supplied duty-summary reference to both header wings: boxed role icon, role-colored heading (cyan radiographers, coral radiologists), aligned icon/label/name rows without separators and separate current/night count badges. Fit summaries to their content to avoid blank gaps. Radiographers have text on the left and counts on the right; radiologists mirror this, with counts on the left and right-aligned title/rows. Preserve role and shift-state colors, live data, person links and panorama; let long names wrap and expand the top row when needed. No extra animation or backdrop blur. Local only until requested.

- 2026-09-20 correction: radiologist sun/moon icons must form one vertical column. Keep header date/weather and news consistently top-aligned with a clear text hierarchy. Current/night counters are plain labels and colored numbers without boxes, backgrounds, borders or shadows; no colored side stripes on these or future UI elements. Night counts use mint green. No separators between duty rows or beside the count column.

- News correction: retain the original inline ticker layout, with time/category beside the headline. Do not stack metadata above the headline; preserve the original headline typography and wrapping.

- Today label belongs in the day rail beneath the actual current calendar date, never beside the large date and never on the selected past/future day. Temperature needs a readable number and a matching static weather icon; moon phase needs a larger SVG and readable illumination percentage. Use local Meteocons static assets; preserve existing weather animation costs. Keep date, weekday, birthday and weather content aligned, and keep radiologist names next to their time labels without a stretched gap.

- Header date block order: date, weekday/birthday, namedays, then temperature and moon phase.
