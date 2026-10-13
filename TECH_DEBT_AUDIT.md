# RG tehniskā parāda audits

Sākts 2026-10-13, zars `perf/weak-pc-8gb`, bāze `ef746038`. Viss ir lokāli: nekas netika pušots vai izvietots.
Mērījumi ir sintētiskajā serverī (`scripts/local-audit-server.mjs`, viltoti dati, SW izslēgts) ar Chromium headless un CPU 4× lēnāku. Skaitļi ir mediāna no 3 aukstiem startiem. Tie der salīdzināšanai, nevis kā reāla slimnīcas datora laiks.

## Bāzes līnija (ef746038)

| | vērtība |
|---|---|
| Pieprasījumi startā (čaula + kalendāra iframe) | 265 (251 lokāli) |
| Skripti / CSS faili | 90 / 83 |
| JS / CSS (neskaitot kompresiju) | 3 623 KB / 2 486 KB |
| JS + CSS + HTML ar gzip | 1 675 KB |
| Kartītes redzamas | ~1,4 s |
| Galvenā pavediena darbs pirmajās ~7 s | 3,5 s (skripti 0,69 s, **stili 1,10 s**, izkārtojums 0,54 s) |
| Garie uzdevumi / bloķēšana | 72 / 2,6 s |
| Kaudze / DOM mezgli / klausītāji pēc starta | 14 MB / 9,4 k / 775 |
| Dīkstāve (bez CPU palēnināšanas) | ~11 ms CPU sekundē (~1 %), ~20 stilu pārrēķini/s, 19 dzīvi `setInterval`, 1–2 rAF/s |

Galvenais starta izdevums ir **stilu pārrēķins un izkārtojums**, nevis JS. Tas nav saistīts ar CSS apjomu (sk. #16), bet ar to, cik bieži un cik plaši pārrēķins tiek izraisīts (#14, #17). CPU profilā JS pašlaiks ir ~1,9 s, "(program)" (stili, izkārtojums, parsēšana) ~1,85 s. Lielākie JS punkti startā: `fatigue.js` 275 ms, `calendar.js` 254 ms, `mood-trend.js` 167 ms, `nightsplit.js` 164 ms, `mk-header-x.js` 150 ms (4× palēninājumā).

**Ilgā sesija** (`tests/e2e/soak.mjs`): 30 ciklu tests (dienas, nakts panelis, mēneša kalendārs, darbinieka logs, meklēšana, radio atvērt/aizvērt) pēc iesildīšanās noplūdi nerāda. Kaudze 16,2→16,4 MB, mezgli un taimeri stabili, klausītāji +1 ciklā (871→880). 300 ciklu rezultāti: skatīt žurnālu zemāk.

## Prioritizētais saraksts

Statuss: ✅ izdarīts, ⏳ nākamais, 📝 tikai dokumentēts (vajag lēmumu vai lielāku darbu).

| # | Problēma | Pierādījums | Ieguvums / pārliecība | Risks | Statuss |
|---|---|---|---|---|---|
| 1 | CI bija sarkans: 45/463 vienību testi krita (radio, media-profile) | `node --test` uz ef746038. Sabojājās pakāpeniski kopš ~85889ae9~1 (tur jau 23) | Drošības tīkls atkal strādā / augsta | nav (mainīti tikai testi) | ✅ |
| 2 | Nav pārbaudes, vai saites uz failiem eksistē; `?v=` ar roku 141 vietā | SW audits; 326 `?v=` atsauces | Būvēšana apstājas uz trūkstošu failu / augsta | nav | ✅ build-pages + CI |
| 3 | Lācīša atskaņotājs prasa 5 neesošus failus no saknes | build pārbaude: `/logo.svg`, `/registerSW.js`… | −5 × 404 katrā atvēršanā / augsta | nav | ✅ |
| 4 | SW kešs aug bez robežām: katrs vecais `?v=` attēla variants pārnests mūžīgi | `sw.js` activate | Ierobežots kešs / augsta | vecs variants, ja kāds to vēl prasa, tiek ielādēts no jauna | ✅ + tests |
| 5 | `bolus.js` (145 KB) bloķē čaulas HTML parsēšanu | `index.html:3550` bez `defer`; pats gaida DOMContentLoaded+500 ms | Ātrāks parsēšanas ceļš / vidēja | izpildes secība; e2e iziet | ✅ |
| 6 | `color-thief` (22 KB) ielādējas kalendārā startā, kaut ir slinkais ielādētājs | `kalendars/index.html:1552`, `image-palette.js:16` | −1 skripts startā / augsta | nav | ✅ |
| 7 | 109 nekur neizmantoti faili (4,4 MB) | ārējais audits + atkārtota `git grep` pārbaude + koda loģika (Pioneer, gultas) | Mazāks repo/izvietojums, mazāk apjukuma / augsta | vecs klients prasa dzēstu failu, ja vēl nav atjaunots | ✅ |
| 8 | Neizmantotas tikai startā redzamas daļas ielādējas uzreiz: skinu redaktors ~252 KB (t.sk. `skin-organize.css` 122 KB), statistika ~141 KB, darbinieka loga CSS 52 KB, radio CSS ~241 KB čaulā (bloķē renderēšanu) | resursu audits | Mazāk CSS stilu saskaņošanai startā / vidēja | slinki pievienots CSS nonāk kaskādes beigās, var mainīt izskatu, jāsalīdzina computed-style | ⏳ |
| 9 | Radio skatu CSS (Dither/Amp/Pioneer, 57 KB) pievienots divreiz: startā un vēlreiz `build()` | `index.html:747-749` + `radio-*-layout.js` | Mazāk dublētu noteikumu / vidēja | otrā kopija nosaka kaskādes secību, nevar vienkārši dzēst | 📝 |
| 10 | Ja failu maina bez `?v=` maiņas, Cloudflare to kešo gadu (`immutable`) | `cloudflare/site/src/index.js:14,114` | — | — | 📝 automātiski satura heši (sk. zemāk) |
| 11 | Atsevišķi atvērts `/kalendars/` uzreiz aktivizē jauno SW visām cilnēm | `kalendars/index.html:1228-1237` | — | radio netiek pārtraukts (`playing()`), bet cita cilne var pārlādēties zem rokas | 📝 |
| 12 | `controllerchange` aizsargs balstās uz vecu konstanti `2026.09.14-winamp-lcd` | `index.html:4471,4526` | — | dubulta `reload()` iespējama, bet nekaitīga | 📝 |
| 14 | Nakts paneļa atvēršana/aizvēršana pārrēķina stilus **visam** kalendāram: klase uz `<html>` + selektori ar `*` labajā pusē | CSS audita invalidācijas izsekošana; tiešs mērījums 60–70 ms → 11–13 ms par pārslēgšanu | Ātrāka nakts atvēršana / augsta | pauzes noteikumu specifiskums ↑; LED kartītes pikseļos identiskas, jauns e2e LED tests | ✅ |
| 15 | Nakts plānu krātuve (`minkaNightSplitByDateV1`) tiek parsēta katrā live tikšķī (2–5 s) un netiek apgriezta, aug par nakti dienā | dzīves cikla audits: 1 gads = 124 KB, 6 pilnas parsēšanas / 30 s | Mazāk CPU ar mēnešiem / augsta | rakstītājs saņem atsevišķu kopiju; tests | ✅ |
| 16 | Režīma CSS (skinu organizators, kartīšu fasādes, vārdu stili, galvenes izskats… 575 KB) ielādējas startā | CSS pārklājums: 90–100 % neizmantots | **Izmērīts: stilu laiks nemainās** (1650 → 1643 ms), Chrome nesaskaņotos noteikumus atmet lēti | slinka ielāde mainītu kaskādi | ❌ netiks darīts |
| 17 | Startā lielākie stilu pārrēķini nāk no inline stila rakstīšanas uz `<html>`, `#grafiks-app`, `#radioWindow` un klases maiņām uz `<html>` (`mk-schedule-booting`) — katrs 40–70 ms | izsekošana (`UpdateLayoutTree` + invalidācijas iemesli) | Nākamais lielākais stilu ieguvums / vidēja | katrs gadījums jāpārbauda atsevišķi | ⏳ |
| 18 | `emoji-hover-animation.js` MutationObserver uz visu `body` + `elementFromPoint` ~1×/s | dzīves cikla audits | ~1 ms/s | failam ir divu nokāršanās vēsture | 📝 neaiztikt bez iemesla |
| 19 | `radio.js` ik sekundi raksta laiku arī paslēptā radio | dzīves cikla audits | niecīgs | atverot uz mirkli redzams vecs laiks | 📝 |
| 20 | Mazi neierobežoti keši (`mxGlyphCache`, `lyricsCache`, `_led.grids`, `_bedImages`) un dubults `visibilitychange` klausītājs `mood-feedback.js:1274` | dzīves cikla audits, nav izraisīts testos | mazs | — | 📝 |
| 13 | Nelietoti, bet liela apjoma izejas faili tiek izvietoti (`photo-prompts.json`, `noto-ids.json`, `card-addons/*.json`) | resursu audits | ~130 KB mazāk dist | skripti tos lasa no repo, tāpēc izslēgt būvēšanā, nevis dzēst | 📝 |

## Atliktie lēmumi

- **Satura heši `?v=` vietā.** Vienkāršākais drošais solis: `build-pages.mjs` dist kopijā pārraksta literālās HTML/CSS atsauces uz `?v=VECAIS.<sha1-8>`. Izpildlaikā būvētie ceļi (~20 vietas: `BED_V`, emoji3d `V`, `music-webamp.js VERSION`…) paliek ar roku. Pirmajā izvietošanā mainās visi URL (viena pilna ielāde). Vēl neieviests.
- **Minifikācija.** Repo nav pārnēsājama minifikatora (oxc/lightningcss ir tikai Mac binārie failiem Webamp avotā). Ieguvums pēc gzip būtu neliels, salīdzinot ar stilu pārrēķina izmaksām. Atlikts.
- **Skriptu apvienošana.** 90 skripti un 83 CSS ir daudz, bet ar SW un HTTP/2 pieprasījumu skaits nav pierādīts kā galvenais izdevums. Vispirms jāizmēra ar ieslēgtu SW.

## Žurnāls

| Commits | Kas | Pārbaude |
|---|---|---|
| 8b371b04 | 45 radio/profila testi atkal zaļi (tikai testu sagataves; 3 sagaidāmās vērtības mainītas pēc apzinātiem commitiem 36002ee5, c76ba3ba) | 464/464 |
| 7202e983 | build-pages pārbauda atsauces; CI būvē; Lācītis bez 404 | negatīvais tests: izdomāts CSS fails aptur būvēšanu |
| b8461fb9 | SW pārnes tikai jaunāko `?v=` | jauns vienību tests |
| 2610c16b | `bolus.js` defer; kalendārā bez eager color-thief | 464/464, e2e functional 17/17 |
| 0d1ca86e | −109 faili (4,4 MB) | build pārbaude, 464/464 |
| fcd5f025 | `perf-startup.mjs`, `soak.mjs` | — |
| 50e2a269 | e2e LED tests nakts panelim; computed-style-compare atjaunots Galvenei X | pret ef746038~1 krīt (`LED grid missing`), pret HEAD iziet |
| 1ba46586 | nakts pauzes noteikumi uz `#nsOverlay` | 60–70 → 11–13 ms par pārslēgšanu; LED pikseļi identiski; radio-ambience testi 8/8 |
| 0a816f9f | nakts plānu krātuves parsēšanas kešs | jauns tests, 465/465 |

Computed-style salīdzinājums bāze (ef746038) pret jauno: vienīgās strukturālās atšķirības ir izņemtais `color-thief` `<script>` (−1 elements). Pārējais ir zināmās sacensības (noskaņas apļa transformācijas, sub-pikseļu platumi, asinhronā radio albuma krāsa), kas parādās arī salīdzinājumā bāze pret bāzi (547 vērtības).
