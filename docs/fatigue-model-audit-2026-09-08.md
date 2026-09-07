# Fatigue model audit, 8 September 2026

## Implemented

- Independent McCauley 2024 comparison engine in `kalendars/js/recovery-model.js`, including reciprocal recovery feedback, circadian amplitude, and sleep inertia. Native PVT and KSS outputs remain separate from the product hybrid index.
- On-demand comparison under the model details. No continuous per-card computation, external service, wearable upload, or new runtime dependency.
- Comparison reuses the same latency-adjusted sleep intervals, dated night plans, inferred-history weights, and three post-call sleep scenarios. It does not modify saved assignments.
- Clearer early-morning work row: actual overlap clock times replace an unexplained duration.
- A reproducible equation-level FIPS check (`scripts/check-fatigue-fips.mjs`) takes the externally downloaded R file; FIPS code is not redistributed in the PWA.

## FIPS findings

Source: https://github.com/humanfactors/FIPS/blob/master/R/simulation_unifiedfatiguemodel.R

Downloaded file SHA256: `1034ddcff80e1433c7db352389e11ef821534ccd049d73081f1d227fb5a5c143`.

Twelve state-equation cases agree within 3.56e-15 with matched parameters, before the lower-asymptote floor is reached. This executes the simple arithmetic functions through a restricted R-to-JS expression adapter, NOT the complete R package. R is not installed here.

FIPS uses a different 2016 default parameter set from the PWA. Its fifth circadian harmonic is 0.0001 versus 0.001 in the current PWA, and it lacks the later lower-asymptote floor. These differences prevent claiming full end-to-end equivalence. The small harmonic discrepancy is documented rather than silently treating FIPS as a gold standard. FIPS is AGPL-3.0; no FIPS implementation is bundled in the site.

## 2024 implementation and verification

Source: McCauley et al., Tables 1–2 and equations 4 and 9:
https://doi.org/10.3389/fenvh.2024.1362755

Coordinates q = p - p_f - xi*h allow a direct independent implementation. The native prediction is p = q + p_f + xi*h. PVT and KSS use their separate published parameters. Initialization iterates an assumed 23:00–07:00 baseline to a daily equilibrium with tolerance 1e-9, consistent with the paper's equilibrium method. This assumed baseline is not personal sleep data.

Verification includes comparison of transformed equations to the full published equations, 5-minute versus 30-second RK4 integration, equilibrium convergence, restriction/recovery direction, sleep-boundary continuity, and inertia decay. These are numerical and regression checks, NOT independent clinical validation or reproduction of the paper's participant datasets.

Example with synthetic workers: 24h duty on September 7, 12h daytime duty on September 9, first of four night parts. At September 9 08:00:

| Post-call daytime/night opportunity | Existing hybrid | 2024 PVT lapses | 2024 KSS |
|---|---:|---:|---:|
| 2h / 6h | 27 | 5.45 | 4.23 |
| 3h / 7h | 21 | 4.92 | 3.99 |
| 4h / 8h | 16 | 5.00 | 3.92 |

15 minutes are deducted for each sleep onset. Later awakening can preserve more inertia at 08:00, so every metric need not strictly decrease with more sleep. This is not a reproduction of a named worker's full history. The comparison took about 96ms locally for this synthetic history; this is not a phone performance benchmark.

The published model does NOT establish that all workers must start the next shift in the red. Nor does KSS 4 mean 40% fatigue. The main hybrid remains experimental. A scientifically calibrated replacement for the product 0–100 mapping is still unresolved; no new model is silently installed as that replacement.

## Other project decisions

- Arcascope/circadian (MIT): useful for light-driven phase simulation, but actual light exposure is unavailable. Adding a personalised phase or melatonin amount would imply unavailable evidence. Keep current explicit clock-based circadian assumptions.
- Skeldon HCL: useful research on sleep/light interaction, not a ready calibrated predictor from this roster alone.
- HypnosPy: requires wearable measurements that are not available or requested. Not installed.
- Dawnward: jet-lag presentation ideas, not a validated shift-fatigue replacement. Not incorporated.

## Validation

87 tests passed at implementation, including shared forecast inputs and unchanged saved data. Public-source checks do not validate individual fatigue, actual sleep, clinical thresholds, or the existing hybrid weights. No GitHub push, service-worker release, or Cloudflare change was made for this audit.


## Radiology light scenarios (2026-09-08)

Implemented an on-demand JavaScript adaptation of Arcascope Forger99, preserving
its MIT notice in `kalendars/assets/licenses/LICENSE-arcascope.txt`.
Source: https://github.com/Arcascope/circadian/blob/main/circadian/models.py

User reports dim rooms with monitors and a dark sleeping room. Compare 10/30/100
photopic lux during duty, 0 during modelled sleep, 100/1000 during off-duty daytime
and 10 during off-duty night wakefulness. These are sensitivity choices, not
measured illumination or literature-calibrated radiology exposures. Spectrum,
actual outside light, chronotype and actual sleep are unknown. Photopic lux is
not melanopic EDI; this model does not represent monitor spectrum separately.

Uses the existing sleep timeline (including latency), dated plan revisions,
actual 3/4-person slots and custom boundaries. Central post-call sleep scenario
(3h daytime, 7h first home night) is explicit. Where the existing timeline has
inferred historical alternatives, light calculations retain their branches and
report the envelope, not a probability interval. Future roster entries cannot
change past integration; past night parts cannot be reassigned by this comparison.
No assignments are written.

Output is wrapped oscillator phase delay in hours at the end of the shift,
relative to a regular 07:00–23:00 light schedule with an entrained initial state.
It is not measured DLMO, a melatonin concentration, or fatigue severity. Positive
means later phase. Broad ranges crossing the phase wrap are labelled uncertain.
Do not add phase-hours to the 0–100 index: that coupling is not validated.

The UI puts this behind 'Gaismas ietekme uz nakts daļām' inside the curve section.
A 3.5 kB module, no Python runtime or network calls, yields between scenarios.
Checks: 5-minute vs 30-second integration, baseline convergence, exact light/sleep
boundaries, 3/4 custom-time integration, read-only behaviour and elapsed-part
preservation. All 94 tests passed. These are implementation checks, not clinical
validation. The earlier 02–06 driver row was removed at the user's request.

User requested removal of the light comparison UI. Button, result display and
click handler removed. Research API remains testable but is not invoked by the
UI, does not run in the background and does not modify fatigue scores.
