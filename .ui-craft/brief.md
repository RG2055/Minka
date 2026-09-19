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
- Random guest appearance applies on the first open after reload as well as reopen; Pixel has no priority. Random Pixel and explicit Pixel layout selection default to album-following colors. Fixed palettes require an explicit palette choice.
