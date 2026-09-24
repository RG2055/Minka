# Minka: Material 3 Expressive audits (2026-09-24)

Fāze 1 no specifikācijas. Tikai audits, kods šajā fāzē nav mainīts.
Izņēmums: līkne "Komandas sajūta" pie "Novērtē maiņu" (atsevišķs uzdevums, lokāli, nav commitots).

Avoti: `index.html` (čaula: doks, radio, Lācītis, lapas), `kalendars/index.html` + `kalendars/js/**` + `kalendars/css/**` (kalendāra iframe), `mobile.html` + `kalendars/css/mobile-v2.css` (telefons), `js/radio*.js`, `css/radio*.css`.

## Kopaina skaitļos

| Rādītājs | Vērtība | Ko tas nozīmē |
|---|---|---|
| Ielādētie CSS faili kalendārā | ~45 (+19 `<style>` bloki) | stili slāņoti ar `!important` pa virsu viens otram |
| Dažādas `border-radius` vērtības | 112 | nav formu skalas |
| Dažādas `cubic-bezier` līknes | 33 | nav kustības tokenu |
| Dažādi hex toņi | ~1800 | nav krāsu lomu |
| "M3" tokenu saimes | 6 atsevišķas: `--m3` (nakts panelis, 2 varianti), `--m3` (kafija, silts), `--m3c` (saziņa), `--m3x` (sava noskaņa), `--pp` (kartītes logs), `--stx` (statistika) | katram logam savs "primary": `#7fdcea`, `#ffb77c`, `#7fd8c6`, `#10b981`, `#a8c7fa`, `#1fe091` |
| `@keyframes` | 215 | 164 no tām `infinite` |
| `transition: all` | 49 | galvenokārt `bundle.css`, `improvements.css`, `theme.css`, `glow_cards_v2.css` |
| `backdrop-filter` deklarācijas | 374 | low-spec režīmā lielākā daļa jau nogriezta |
| `startViewTransition` / `view-transition-name` | 0 | View Transitions netiek lietotas |
| WAAPI `.animate()` | 8 vietas | radio morph, kartīšu dim, burbuļu "pop", kaķis |

Divi atradumi, kas ietekmē visu plānu:

1. **Kalendāra iframe vienmēr ir `mk-low-spec`** (`kalendars/index.html:100`, `lowSpec: true` cieti ierakstīts). `css/page/auth-overlay.css:61` tad uzliek `animation-duration: 0.01ms !important` visiem elementiem. Praktiski **visas CSS keyframe animācijas kalendārā jau ir izslēgtas**. Strādā tikai `transition` un WAAPI. Šī ir tagadējā "LITE" versija: nevis vienkāršota kustība, bet kustības nav vispār, un telpiskā saikne pazūd.
2. **Čaulā `prefers-reduced-motion` un vājš dators ir sapludināti** (`index.html:281`: `lowSpec = reduceMotion || mem <= 8 || cores <= 4`). Chrome `deviceMemory` rāda ne vairāk kā 8, tāpēc katrs Chrome uz Windows ir "low-spec". Tie ir tieši tie divi jēdzieni, kurus specifikācija liek turēt atsevišķi.

## 1. Virsmu un mijiedarbību karte

Apzīmējumi: **M3** = jau M3 stilā, **daļēji** = M3 idejas, bet sava tokenu saime, **legacy** = vecais stils, **izslēgts** = galvene, vizuāli neaiztikt. **Perf** = jutīgs pret veiktspēju.

### Čaula (`index.html`)

| Virsma | Kur | Stāvoklis | Piezīmes |
|---|---|---|---|
| Doks (Nakts, Bolus, Kalendārs, Plānotājs, Statistika, Radio, Vairāk) | `#bottomBtnBar`, `#dockShelf` | legacy | stikls + neona apmales; low-spec to nogriež |
| "Vairāk" izvēlne | `#dockMoreMenu` (`index.html:2535`) | daļēji | fade + scale 170 ms, blur 22px + saturate; easing nav tokens |
| Radio logs, 5 izkārtojumi (classic, clean, pioneer, pixel, amp) | `#radioWindow`, `js/radio*.js`, `css/radio*.css` | legacy (skini ir identitāte) | Perf; skinus nemainīt |
| Radio atvēršana/aizvēršana | `mkRadioReveal` (`index.html:1066`) | daļēji | jau ir WAAPI "slab" morph no doka pogas (300 ms), bet saturs nav nepārtraukts, ir `setTimeout` taimeri |
| Radio stacijas, EQ, "slow FX", akcenta izvēle, tēmas panelis | `#stationOverlay`, `#slowFxPanel`, `#accentPicker`, `#themePanel` | legacy | `station-picker-enter` keyframe |
| Lācītis (mūzika): mini konsole, pilnais panelis, lapas | `#lacMiniConsole`, `#lacitisFullPanel`, `#lacitisSheet` | legacy (Spotify stils) | docked ↔ full ir klases maiņa bez telpiskas saiknes |
| Plānotājs, Pusdienas (iframe lapas) | `#planotajsSheet`, `#pusdienasSheet` | legacy | |
| Bolus lapa | `#bolus-sheet` (`index.html:4331–4700`) | legacy | CSS ģenerēts JS virknēs, 6+ pārrakstoši varianti |
| Mediju profils | `css/media-profile.css` | daļēji | `media-profile-enter` |
| Mobilais QR dialogs | `#mobileQrModal` | legacy | |

### Kalendārs (`kalendars/`)

| Virsma | Kur | Stāvoklis | Piezīmes |
|---|---|---|---|
| Ainaviskā galvene, datuma josla, lomu kopsavilkumi, laikapstākļi, vārdadienas birka, meklēšanas palaidējs | `mk-*header*.css`, `header-*.js` | **izslēgts** | vadīklas drīkst saņemt kopīgos stāvokļa slāņus un fokusu |
| Darbinieku kartītes (sānu, vidus, skini, piedevas) | `calendar.js`, `card-*.js`, `side-cards-v2.css`, `mk-mid-*` | legacy (sejas ir identitāte) | Perf; `transition: all` uz hover |
| Mood kartīte "Novērtē maiņu", saziņa, sava noskaņa, līkne | `mood-feedback.js`, `mood-trend.js`, `mk-rg-pulse-v2.css`, `mood-comms-m3.css` | daļēji / M3 | Perf (burbuļu risinātājs) |
| Kafijas izvēlne | `.mk-coffee-picker` (`mk-layer-fix-v1.css:6113`) | daļēji | silta `--m3` saime |
| Kartītes logs (saraksts, kalendārs, emoji, skins, nogurums) | `#worker-modal`, `mk-worker-modal-m3.css` | daļēji | `--pp` saime ar Google zilo `#a8c7fa`: ne Minka identitāte |
| Nakts sadalījums | `#nsOverlay`, `nightsplit*.css/js` | daļēji | vienīgais ar opacity pāreju atvēršanai (180/220 ms) |
| **Statistika / Daybook** | `#stats-modal` (inline stils `index.html:612`), `daybook-stats.js`, `daybook.css`, `stats-leaderboard.css`, `levels.js` | **legacy** | sk. 3. punktu |
| Pilnais saraksts | `#full-list-modal` (`bundle.css`) | legacy | `display:none → flex`, blur 40px |
| Mēneša kalendārs | `#mcal-overlay` (`monthcal.js:211`, stils JS virknē) | legacy | `display:none → flex` |
| Emoji izvēle, konteksta izvēlne | `#mk-emoji-picker`, `#mk-ctx-menu` (`emoji.js`, stils JS virknē) | legacy | |
| Minka josla, AI panelis, ziņu lente | `#minkaAiPanel`, `#minkaBarMenu`, `assistant-feed.js` | legacy | `aiPanelSlide`, `aiBubbleIn` |
| Iestatījumi (tēmas dzinējs) | `theme.js` `togglePanel` | legacy | |
| Maiņas apturēšanas popover, dienas popover | `#shift-stop-popover`, `#wmDayPop` | legacy | |
| Ikdienas kaķis un tā izvēle | `daily-cat.js/css` | **neaiztikt** (lietotāja noteikums) | |
| Pieteikšanās pārklājs | `auth-overlay.css` | legacy | |

### Telefons (`mobile.html` → `kalendars/?mobile=1`)

Tas pats kalendārs ar `mobile-v2` slāni. Noteikumi no lietotāja: nav rāmju rāmjos, mood kartīti neaiztikt, stikls tikai vadības slānī. Lapas (sheets) nāk no čaulas.

## 2. Kas jau seko M3 / M3 Expressive idejām

- **Kafijas izvēlne**: tonālas virsmas rāmju vietā, secondary-container kā izvēle, formas 28/20px, pilnas kapsulas pogas.
- **Saziņa un mood kartīte** (`mood-comms-m3.css`): tās pašas lomas, stāvokļa slāņi, expressive easing.
- **Kartītes logs** (`mk-worker-modal-m3.css`): M3 slēdzis, "pill" čipi, 32px dialogs, `--pp-spring` = expressive fast spatial.
- **Nakts panelis** (`nightsplit-brand.css:1640`, `:2265`): `--m3-spring` = expressive fast spatial `cubic-bezier(.42,1.67,.21,.9)`.
- **Radio morph**: pareiza ideja (poga pārtop logā, WAAPI, pārtraucams, `finalize` vienmēr atstāj konsekventu stāvokli).
- **"Komandas sajūta" līkne**: M3 motion tokeni, viens transform/opacity elements.

Nevienam no tiem nav kopīgu tokenu. Katrs izskatās "M3", bet katrs ar savu paleti un līknēm.

## 3. Vizuāli nekonsekventais

1. **Statistika** ir vecākais slānis: 900px logs ar inline stiliem, 14px stūri, Material Icons Round no Google CDN, zaļš `#1fe091` kā izvēle, pogām 9px stūri, flīzēm 16px, sarakstiem 16px. Katra sadaļa ir kartīte, kurā ir kartītes ("rāmis rāmī": `db-tiles` sadaļā, `db-bars`, `db-list`, `db-scroll` katrs ar savu fonu un apmali). Cilnes ir `aria-pressed` pogas, nevis `role="tab"`.
2. **Sešas primary krāsas** sešos logos (sk. tabulu augšā). Kartītes logam ir Google demo zilais.
3. **Fonti**: Inter, Google Sans (kartītes logs), Space Grotesk (Lācītis, doks), DM Sans, JetBrains Mono, Digital-7. Nav tipogrāfijas skalas.
4. **Legacy logi** (pilnais saraksts, mēneša kalendārs, emoji, konteksta izvēlne, AI panelis, Bolus) ir `bundle.css` / JS virkņu stils ar 40px blur un neonu.
5. **Doks un radio** ir cita valoda (neona zaļš `#00ff88`, stikls) nekā jaunie M3 logi.
6. Stāvokļi (hover/focus/pressed/selected/disabled) katrā failā savādāki; fokusa gredzens daudzviet nav vai ir `outline: none`.

## 4. Esošās animācijas

| Animācija | Kur | Tips |
|---|---|---|
| Radio "slab" morph (atvērt/aizvērt) | `index.html:1066` | WAAPI, transform + opacity, 300 ms |
| Kartīšu dim radio laikā | `calendar.js:7869` `__minkaCardsFade` | WAAPI; portāliem `filter: opacity()` |
| Burbuļu "pop", kafijas lidojumi | `calendar.js:3760`, `:5767` | WAAPI `scale` |
| Emoji daļiņas | `emoji-particles.js` | JS + transform |
| Nakts panelis | `mk-layer-fix-v1.css:1767` | opacity transition |
| "Vairāk" izvēlne, Lācītis mini | `index.html:2535`, `:2640` | transition opacity/transform |
| Ielādes/pulsa/mirdzuma loki | 164 `infinite` keyframes | galvenē (laikapstākļi 35), bundle, polish |
| Hover pacelšanās uz kartītēm | `bundle.css`, `improvements.css` | `transition: all` |
| Kaķis | `daily-cat.*` | sprite, neaiztikt |
| Līknes balss lidojums | `mood-trend.js` | WAAPI, transform + opacity |

Kalendārā visas keyframes ir praktiski nulle ms (low-spec kill), tāpēc lielākā daļa no tām redzama tikai čaulā vai nav redzama vispār.

## 5. Animācijas, kas balstās uz izkārtojuma maiņu

- **Radio atvēršana/aizvēršana maina kalendāra iframe augstumu** (`_doSync` → `--calendar-bottom`) animācijas vidū (`REFLOW_AT_MS = 90`). Tas ir viss kalendāra izkārtojums vienā kadrā, tagad paslēpts zem kartīšu dim. Lielākais risks uz vāja PC.
- **Radio minimizēšana** (`#radioWindow.minimized .radio-win-body { display:none }`, `css/minka.css:1685`): momentāls lēciens bez pārejas.
- **Lācītis docked ↔ full**: klases maiņa, izkārtojums lec.
- **Statistika**: katrs klikšķis (cilne, mēnesis, grupa, drill-down) pārraksta VISU `innerHTML`, arī galveni ar cilnēm. Fokuss pazūd, ritinājums lec. Datu ielādes laikā pārzīmē ik pēc 6 dienām. Joslas ir `width: %` (`daybook-stats.js:241`).
- **Modāļi `display:none → flex`** (statistika, pilnais saraksts, mēneša kalendārs, `stats-modal` aizvēršana vēl iztukšo saturu): izejas animācija nav iespējama.
- **Mood sekcijas "pull-up"** un burbuļu risinātājs: sinhroni mērījumi dienas maiņā (jau optimizēts, bet jutīgs).
- **`transition: all`** uz kartītēm: pāriet arī `width`, `box-shadow`, `filter`.

## 6. Telpiskā vs efektu kustība

**Telpiskā (spatial):**

| Pāreja | Stiprums |
|---|---|
| Radio: doka poga ↔ radio logs | hero, expressive slow |
| Radio: aizvērt / minimizēt / atjaunot | hero, apgriezta tā pati saikne |
| Statistika: palaidējs (doka "Statistika") ↔ statistikas logs | hero |
| Statistika: pārskats → diena / cilvēks, un atpakaļ | expressive default |
| Kartīte → kartītes logs | expressive default |
| Mēneša kalendārs, pilnais saraksts, nakts panelis | standard default |
| Lācītis mini ↔ pilnais | expressive default |
| Lapas (Bolus, Plānotājs, Pusdienas) no apakšas | standard default |
| "Vairāk" izvēlne, konteksta izvēlne, emoji izvēle, popover | standard fast |
| Balss → līkne | expressive fast |

**Efekti (effects):** cilnes, čipi, segmentētās pogas, slēdži, hover/focus/pressed stāvokļu slāņi, ikonu stāvokļi, teksta un skaitļu nomaiņa, ielādes stāvokļi, mēneša pārslēgšana statistikā (satura crossfade, konteiners paliek).

## 7. Kur lietot View Transitions (ar fallback)

View Transitions darbojas vienā dokumentā. Doks ir čaulā, bet statistika, kartītes un mēneša kalendārs ir iframe, tāpēc **kopīgs elements starp doku un iframe ar VT nav iespējams**. Tur vajag FLIP ar WAAPI (čaula nodod pogas taisnstūri iframe, jo tie ir vienā izcelsmē).

VT kalendāra dokumentā:
- Statistika: cilne ↔ cilne, pārskats → diena/cilvēks → atpakaļ (nosaukti tikai `db-body`, aktīvās cilnes indikators un atpakaļ-joslas virsraksts).
- Kartīte → kartītes logs (`view-transition-name` tikai uzklikšķinātajai kartītei, uz pārejas laiku).
- Mēneša kalendāra atvēršana.

Katrā gadījumā tas pats stāvokļa kods izpildās bez VT, un fallback ir viegla WAAPI pāreja.

## 8. Kas paliek vienkāršas CSS pārejas

Stāvokļu slāņi, cilnes, čipi, slēdži, segmentētās pogas, izvēlnes (standard fast, transform + opacity), tooltip, doka pogu stāvokļi, radio vadīklas skinos, ielādes stāvokļi un tukšie stāvokļi (bez animācijas, tikai crossfade, kad saturs parādās).

## 9. Veiktspējas riski

1. Iframe augstuma maiņa radio pārejas vidū (viss kalendāra izkārtojums).
2. Statistikas pilnā pārzīmēšana ar `innerHTML` katrā darbībā un ielādes laikā.
3. `backdrop-filter`: pilnekrāna fons statistikai (inline `blur(6px)`, `daybook.css` to pārraksta), "Vairāk" izvēlne `blur(22px) saturate`, pilnais saraksts `blur(40px) saturate(180%)`. Low-spec čaulā un kalendārā to nogriež, bet ne katrs PC ir low-spec.
4. 164 bezgalīgi loki (daudzi galvenē): čaulā tie griežas, ja PC nav low-spec.
5. 32 pastāvīgi `will-change`: pastāvīgi kompozīcijas slāņi.
6. `filter: opacity()` animācija portāliem (`calendar.js:7897`).
7. `transition: all` 49 vietās.
8. `setTimeout` pārejās (radio `REFLOW_AT_MS`, `guard`, `settle` ar 120 ms taimeri). Tie strādā, bet ir trausli.
9. Globālais `animation-duration: .01ms` kill: tas "labo" veiktspēju, izslēdzot kustību, nevis samazinot kadra cenu.
10. Stili JS virknēs (Bolus, mēneša kalendārs, emoji, konteksta izvēlne): tos neredz kopīgie tokeni un tos grūti pārbaudīt.

## 10. Piedāvātā kopīgā arhitektūra

### Tokeni: viens fails abiem dokumentiem

`css/mk-sys.css` (ielādē gan `index.html`, gan `kalendars/index.html` caur `../css/`). Visas pašreizējās `--m3*`, `--pp`, `--stx` saimes kļūst par aizstājvārdiem uz šīm lomām, tāpēc migrācija notiek pa failam, nevis ar sprādzienu.

- **Krāsu lomas** (tumšā tēma, Minka identitāte, bez violetā): `surface`, `surface-container-lowest..highest`, `on-surface`, `on-surface-variant`, `outline`, `outline-variant`. `primary` = Minka piparmētra (tonis no `#1fe091`). `secondary` = zils (`#3f9bff` / `#38bdf8`), `tertiary` = dzintars `#f5b73f`, `error` = `#ff5c5c`. Semantiskās lomas paliek: RG zaļš, RD zils, maiņu krāsas, mood krāsas (tās pašas, ko lieto `daybook-model.js`), kafija (silta, tikai kafijas virsmās).
- **Formas**: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 28`, `full`. Dialogi xl, izvēlnes lg, čipi sm/full, pogas full. Hierarhija: vecāka forma lielāka par bērna.
- **Tipogrāfija**: viena sans saime (Inter vai Google Sans, jāizvēlas) ar M3 skalu `display/headline/title/body/label` × `l/m/s`; `tabular-nums` skaitļiem.
- **Pacēlums**: tonāls (container līmeņi) + 2 ēnu līmeņi tikai peldošām virsmām.
- **Stāvokļu slāņi**: hover .08, focus .10, pressed .10, dragged .16, izvēlēts = secondary-container; fokusa gredzens 2px `primary` ar 2px atstarpi; disabled 38% saturs / 12% konteiners.
- **Kustības tokeni** (M3 Expressive spring aproksimācijas):
  - spatial fast 350 ms `cubic-bezier(.42,1.67,.21,.90)`
  - spatial default 500 ms `cubic-bezier(.38,1.21,.22,1.00)`
  - spatial slow 650 ms `cubic-bezier(.39,1.29,.35,.98)`
  - effects fast 150 ms, default 200 ms, slow 300 ms, visi `cubic-bezier(.31,.94,.34,1.00)`
  - standard (bez pārsviediena) versijas bieži lietotām vadīklām.

### Kustības slānis: `js/mk-motion.js` (kopīgs abiem dokumentiem, ~200 rindas)

- `MinkaMotion.level`: `full` | `lite` | `reduced`, uz `<html data-motion>`. Viena vieta, viena patiesība.
  - `reduced` tikai no `prefers-reduced-motion` (vai lietotāja iestatījuma).
  - `lite` no izpildes pierādījumiem: Long Animation Frames novērotājs pirmo N lielo pāreju laikā; ja kadri krīt atkārtoti, `lite` tiek saglabāts ierīcei. Ar histerēzi: atpakaļ uz `full` tikai pēc ilgstoši labiem mērījumiem vai ar roku. Plus manuāls slēdzis iestatījumos.
  - `mk-low-spec` paliek tikai **renderēšanas** jautājumiem (blur, ēnas), vairs ne kustībai. Globālais `animation-duration: .01ms` kill tiek aizstāts ar precīzu sarakstu: `lite` aptur dekoratīvos bezgalīgos lokus, bet ne pāreju animācijas.
- `MinkaMotion.transition(key, update, opts)`: `startViewTransition`, ja ir un ja `level !== reduced`; citādi WAAPI fallback. **Stāvoklis vienmēr tiek iestatīts sinhroni**, animācija ir tikai attēlojums. Tas pats `key` atceļ iepriekšējo pāreju (pārtraucamība), un Escape/Back to pašu dara.
- `MinkaMotion.flip(el, mutate, token)`: izmērīt → mainīt → invertēt → atskaņot, tikai transform/opacity, `will-change` tikai pārejas laikā.
- `MinkaMotion.token(name)` → `{duration, easing}` pēc līmeņa: `lite` = mazāks ceļš un mērogs, mazāk vienlaicīgu elementu, nekad blur/ēnu animācija. `reduced` = crossfade vai tūlītēja maiņa ar saglabātu telpisko norādi (piem. izcelsmes pogas īsa izcelšana).

### Radio (4. fāze), apkārt esošajai arhitektūrai

Esošo `mkRadioReveal` pārbūvēt uz `MinkaMotion`: kopīgs konteiners (slab) ar fāzēm "pogas forma → loga forma → saturs parādās" (satura opacity sākas pēc 40%), aizvēršana tā pati saikne atpakaļ. Iframe augstumu mainīt **vienu reizi** zem slab, un kalendāra saturu tikmēr turēt ar `transform`/clip, nevis relayout animācijas vidū. Minimizēt/atjaunot = FLIP uz loga augstumu, nevis `display:none`. Skini, audio un vizualizators paliek neaizskarti.

### Statistika (5. fāze)

`render()` sadalīt: galvene (cilnes, mēnesis, filtri) tiek renderēta vienreiz un atjaunināta ar atribūtiem; mainās tikai `db-body`. Cilnes kā `role="tablist"` ar slīdošu indikatoru. Drill-down: VT vai FLIP no noklikšķinātās dienas/cilvēka. Joslas: fiksēta ģeometrija + `transform: scaleX()` ar `transform-origin: left`, animētas tikai, ja vērtība mainījās. Ielādes laikā nepārzīmēt visu: atjaunot tikai grafiku. Vizuāli: bez rāmjiem rāmjos, grupēšana ar atstarpēm un tipogrāfiju, viena flīžu forma, lomas no tokeniem. Dialogs ar `role="dialog"`, fokusa slazdu un fokusa atgriešanu. Escape vispirms iziet no drill-down, tikai tad aizver.

## 11. Faili, kurus plānoju mainīt

**Jauni:** `css/mk-sys.css` (tokeni), `js/mk-motion.js` (kustība, līmeņi, VT/FLIP).

**2.–3. fāze (sistēma):** `index.html` (perf profils: atdalīt reduced/lite, ielādēt jaunos failus), `kalendars/index.html` (tas pats; noņemt cieti ierakstīto low-spec kustībai), `kalendars/css/page/auth-overlay.css` (globālais animāciju kill → precīzs saraksts), `kalendars/css/page/mood-comms-m3.css`, `mk-worker-modal-m3.css`, `nightsplit-brand.css`, `mk-layer-fix-v1.css` (kafija) → tokenu aizstājvārdi.

**4. fāze (radio):** `index.html` (`mkRadioReveal`, `_doSync`), `css/minka.css` (`.minimized`), `kalendars/js/calendar.js` (`__minkaCardsFade`, portālu `filter` → opacity), `js/radio-music.js` (Lācītis docked/full).

**5. fāze (statistika):** `kalendars/js/daybook-stats.js`, `kalendars/css/daybook.css`, `kalendars/css/page/stats-leaderboard.css`, `kalendars/js/page/shift-stats-modal.js`, `kalendars/index.html` (statistikas loga marķējums), `kalendars/js/levels.js` (noguruma grafika ievietošana), `index.html` (`openStatsFromDock`: pogas taisnstūris FLIP).

**6. fāze (pārējais):** `kalendars/js/monthcal.js`, `kalendars/js/emoji.js`, `kalendars/js/page/minka-bar.js`, `assistant-feed.js`, `kalendars/js/theme.js`, `index.html` (doks, "Vairāk", Bolus, lapas), `kalendars/css/mobile-v2.css`, `bundle.css` pārrakstījumi jaunā slānī (pašu `bundle.css` nerediģēt).

**Neaiztikt:** galvenes vizuālie faili (`mk-*header*.css`, `header-*.css/js`), radio skinu zīmēšana, audio, kaķis, datu loģika, API, SW (tikai versiju bumps).

## Lēmumi, kas vajadzīgi pirms 2. fāzes

1. **Primary krāsa** visai sistēmai: Minka piparmētra (`#1fe091` saime) vai ciāns (`#23cdcf` / `#7fd8c6`)?
2. **Viens fonts**: Inter (jau visur) vai Google Sans (kartītes logā)?
3. **Kalendāra kustība**: vai drīkst noņemt globālo `animation-duration: .01ms` kill, aizstājot ar `data-motion` līmeņiem? Tas atkal ieslēgs dažas pārejas, ko tagad neviens neredz.
4. **LITE noteikšana**: automātiski pēc mērījumiem + slēdzis iestatījumos, vai tikai slēdzis?

## Lēmumi (2026-09-24) un paveiktais

1. Krāsas praktiski nemainās: `css/mk-sys.css` lomas ņem esošās Minka vērtības (primary `#1fe091`, secondary `#64d2ff`, tertiary `#f5b73f`).
2. Paliek abi fonti: `--mk-font-plain` (Inter) un `--mk-font-brand` (Google Sans).
3. Globālā animāciju izslēgšana noņemta: `auth-overlay.css` to tagad dara tikai `data-motion="lite|reduced"`.
4. Lite nosaka automātiski `js/mk-motion.js` pēc kadriem pāreju laikā (3 no pēdējām 6 pārejām janky → lite, atkārtota pārbaude pēc 14 dienām). Ātra roku pārslēgšana: `MinkaMotion.force('lite'|'full')`.

Paveikts: 2.–3. fāze (tokeni, kustības slānis, līmeņi, VT/FLIP primitīvi) un 4. fāze (radio atvēršana/aizvēršana: pats radio izaug no doka pogas un saraujas atpakaļ, apgriežas no esošās pozas, M3 tokeni). Amp izkārtojumam noņemta tumšā pilna platuma josla (skina fona krāsa uz caurspīdīga loga). Testi: `kalendars/test/motion-system.test.mjs`.

Nākamais: 5. fāze (statistika).
