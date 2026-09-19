# Local radio upgrade · 2026-09-19

Pixel is a fourth optional layout alongside Classic, Clean and Pioneer. It reuses the existing audio element, station picker, artwork, accent settings and visualization. Choose it in the appearance panel. Artwork, track information and circular transport are independently implemented design adaptations inspired by https://github.com/PixelPlayerHQ/PixelPlayer. No PixelPlayer assets or proprietary application source are bundled.

The shared radio EQ now has ten bands (31 Hz–16 kHz), seven presets, local persistence, bypass, reset, stereo balance and pre-boost headroom attenuation. Controls are native keyboard-accessible ranges in a modal dialog. This EQ operates across all four main radio layouts. Lācītis retains its existing sound profiles.

Both main radio and the embedded/standalone Lācītis player now restore listening volume and register Media Session metadata and transport actions. Support for physical media buttons depends on the browser and operating system.

User corrections applied: circular Play/Pause in both states; no timer, “Skan” label or redundant numeric volume button; appearance button outside the artwork; temporary volume OSD fits the short Pixel meter. Guest layout rotation includes Pixel and consumes a pending change when reopened before the idle callback. Signed-in personal layouts are preserved.

Validation: 373 Node tests passed across kalendars/test and integrations/lacitis/test. Browser checks covered all four layout transitions, appearance-button hit testing, EQ presets/bypass/reset, real radio stream state, Lācītis mute/restore, rapid reopen and volume-readout bounds. Pixel uses the existing desktop radio availability rules; mobile remains unchanged.

Initial implementation and verification were local. The owner subsequently authorized GitHub main and Cloudflare publication; release details follow. Local preview: http://127.0.0.1:8745/index.html.

## Pixel palettes and upstream wave · local followup

Six palettes color the whole shell, text, spectrum and controls. Olive follows the supplied PixelPlayer screenshot; the other coordinated palettes use the same Material color roles. Choose Pixel krāsas beside the layout, a Pixel card in the skin gallery, or No albuma for live artwork colors. Pixel participates in guest random rotation with one of these palettes. Selecting a photo switches from Pixel to Clean so the selected photo is visible.

Pixel defaults to PIXEL VILNIS when selected or randomly opened. A manually selected visualization (including off) is preserved on reload. The wave now sits below the artist and above EQ, as requested. Existing mobile availability rules are unchanged.

The current upstream PlayerSeekBar uses WavySliderExpressive, which delegates drawing to AndroidX LinearWavyProgressIndicator. The web adapter in js/radio-pixel.js ports that library's alternating quadratic half-wave geometry, using PixelPlayer's 30 dp wavelength, 5 dp stroke, 10 dp container geometry, and 20 dp/second travel. Radio audio level scales its amplitude; it occupies the live display width instead of representing a seek position. Rendering uses the existing audio analyser and frame scheduler; paused/hidden playback stops scheduling, and reduced motion freezes horizontal travel.

Source references:
- PixelPlayer commit 63cb59b97aff1d60c5aa46afdf5ce489e632b267: app/src/main/java/com/theveloper/pixelplay/presentation/components/subcomps/PlayerSeekBar.kt and WavySliderExpressive.kt.
- AndroidX: https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/internal/LinearWavyProgressModifiers.kt (updateFullPath). Copyright 2024 The Android Open Source Project. Apache License 2.0 retained in docs/licenses/Apache-2.0.txt. Port changes: Canvas2D API, browser pixel density, audio amplitude, existing scheduler, full-width live display.

Followup validation: 378 Node tests passed. Browser verification at 1470 and 960 px checked palette switching, named palette persistence, album-color updates, guest random rotation, default wave vs. manually saved mode across reload, circular 72 px transport, and wave placement between artist and EQ. The live stream reached readyState 4 with nonzero analyser samples and changing wave phase/amplitude; verification audio was routed through a zero-gain output in its isolated browser context. No project JavaScript errors were observed (external metadata requests returned 429).

## Random first open and album-color correction

The first radio open after reload now consumes a pending random guest look, including when lazy scripts finish after the reveal starts. Hidden prewarming leaves that first-open change pending. Random Pixel opens and explicit Pixel layout selection use album color mode; only an explicitly selected palette fixes the colors. This corrects the earlier random palette assignment that disabled album following. The Pixel wave remains its default. Existing signed-in profile preferences remain preserved.

Validation: 382 tests pass, including first-open/lazy-load/prewarm regressions and random Pixel album mode. In an isolated browser, the cold first open selected Clean; later random opens included all four layouts. Changing test artwork from red to blue changed the Pixel body from rgb(87,33,30) to rgb(23,40,96).


## Authorized production release · 2026-09-19

Frontend release: GitHub main, service-worker cache minka-4.6.657. Profile API: lacitis-api version 74176d9f-7164-414f-8ab9-37c4488df6d9, replacing 2b9e0e9d-6f83-40f3-a8f1-8402d7af64b3. The deployed bundle differs only in the two supported-layout lists in cleanRadio. Downloaded production source matched the repository baseline for this function before patching. After upload, source, D1/origin bindings, compatibility settings, observability, placement and remaining Worker settings were verified unchanged apart from the release annotation. No database migration or account-data operation was needed.

383 tests pass, including Pixel layout, palette/album mode, wave and spectrum-position persistence after reauthentication, plus account isolation. Inline scripts and privacy checks pass. Authenticated persistence was exercised in the local SQLite API harness; production verification checks the deployed source and anonymous API behavior without modifying any real account.
