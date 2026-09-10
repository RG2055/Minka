# Pioneer animācijas (lokālā integrācija)

No Carozerra kolekcijas pieejami tikai 50 kustīgie klipi un iepriekšējais delfīns (51 izvēle); 33 statiskie attēli izvēlnē nerādās. Tie pieejami no atskaņotāja viļņa pogas. Animācijas izmanto iepriekšējo delfīna slāni. Milkdrop logi, vadība un abas Butterchurn bibliotēkas izņemtas.

Avots: https://github.com/youxufkhan/carozerra commit `87a38b2171e80daa270ae1fd5927c34301c8db7e`. Koda MIT licence: `licenses/carozerra-MIT.txt`. Pioneer klipu izcelsme ir avota `assets/clips`; Carozerra koda licence nav apgalvojums par Pioneer mākslas darbu īpašumtiesībām.

`python3 scripts/import-pioneer.py /path/to/carozerra` reproducē WebP failus. Tā ir bezzaudējumu konvertēšana oriģinālajā izšķirtspējā, ar avota 60 ms kadra intervālu. Statiskie klipi paliek statiski. Krāsainie saglabā oriģinālās krāsas, pārējie seko esošajam delfīna radio tonim. Kvadrātveida indikatori saglabā proporcijas. Indikatoru augošie līmeņu kadri sapāroti statiskā atlasā. Viens līdz 25 Hz cikls no tā paša laika paraugu bufera aprēķina basa un augšējo frekvenču RMS līmeņus. Lēna pīķa atskaite saglabā kustību arī saspiestā radio materiālā; kāpums ir ātrs, kritums lēzenāks. Divi indikatori rāda šīs joslas, nevis stereo L/R. Atlasā katrs avota kadrs satur vertikāli dubultotu zīmējumu; atskaņotājs izgriež tikai augšējo kopiju un rāda 4:1 attēlu bez dublējuma un platajām tukšajām malām. Esošie spektra režīmi paliek pieejami.

## Ielāde un resursi

- Radio startā nav Pioneer kataloga, moduļa vai animāciju pieprasījumu, ja atlasīts parastais spektrs.
- Modulis ielādējas tikai pēc pogas nospiešanas vai saglabāta delfīna režīma atjaunošanas.
- Izvēlne pieprasa mazu JSON un tikai sava ritināšanas laukuma tuvumā esošus statiskus WebP priekšskatījumus (`IntersectionObserver`, 60 px rezerve). Uzvedot peli, animācijas netiek ielādētas.
- Pilnais fails pieprasīts tikai izvēlētajam efektam. Visi 83 efekti kopā aizņem aptuveni 10.2 MB diskā, bet tas nav sākotnējās ielādes apjoms. Lielākais izvēlētais fails ir zem 500 KB; visi priekšskatījumi kopā aptuveni 194 KB.
- Viena pārlūka pārvaldīta animācija oriģinālajā izšķirtspējā. Nav WebGL, LKD dekodētāja vai papildu AudioContext. Parastajām animācijām nav JavaScript kadru cikla; tikai audio indikatoram ir līdz 25 Hz cikls ar atkārtoti izmantotu paraugu buferi un pārzīmēšanu tikai mainītam līmenim.
- Pauze, paslēpts dokuments, paslēpts radio un cita režīma izvēle aizstāj animācijas `src` ar statisku kadru. Iepriekšējā animācija vairs netiek attēlota vai turēta atsevišķā attēlu sarakstā.
- Izvēli glabā `mkRadioPioneer` blakus esošajai `mkRadioViz` vizualizatora preferencei. Tā nepārslēdz radio staciju un neskar profila favorītus.

Indikatoram ielādē tikai izvēlētā skata statisko atlasu, nevis tā animēto WebP. Pauze, paslēpts radio vai cits vizualizators aptur līmeņa taimeri.


## Pioneer izkārtojums

Trešais izkārtojums pieejams Pielāgot radio → Izkārtojums → Pioneer. Hromētā paneļa un koncentriskās skaļuma pogas apdare pielāgota no https://github.com/adainstarks/PioneerVFD commit `cf8725e390bd4ba36eb63cda87b8a865333ffcc0` (MIT: `licenses/pioneer-vfd-MIT.txt`). Spotify integrācija, tās uztveršanas process, fonti un lielie video netiek ielādēti.

Displeja tint seko albuma krāsai; metāla virsmas seko izvēlētajam korpusa tonim. Esošais analizators, 51 kustīga Pioneer izvēle un parastie spektri darbojas tajā pašā displejā. Izkārtojums pārvieto esošos EQ un skaļuma elementus, saglabājot to apstrādātājus un atjaunojot sākotnējās vietas, kad pārslēdz skatu. CSS ielādē tikai pirmajā Pioneer izvēlē. Panelim nav sava kadru cikla.

Atjaunināts izkārtojums: noapaļots metāla ārējais rāmis, tonēta metāla priekšpuse un kopīgs centrālais displejs, koncentriska skaļuma poga pa kreisi un atskaņošanas/staciju pārslēgšanas poga pa labi. Radio panelis aizņem visu ekrāna platumu; maksimālā platuma ierobežojums pēc lietotāja norādes noņemts. Skaļumu maina relatīva vilkšana augšup/lejup vai pa labi/kreisi (200 px pilnam diapazonam), rullītis/trackpad ; klikšķis vien pats skaļumu nemaina. Saglabāta oriģinālā range tastatūras vadība un esošais audio apstrādātājs.

Pārbaudīts izolētā Chrome: klikšķis bez lēciena, vertikāla vilkšana, rullītis, ± pogas, 51 kustīga izvēle, staciju un animāciju izvēlnes, albuma tint, veco izkārtojumu atjaunošana, 800/1024/1440 px platums. Ar 4× CPU palēninājumu pārbaudīta 25 Hz robeža un nulles nolasījumi pauzē. Tā nav fiziskā darba datora ātrdarbības garantija.

## Korpusa toņi un SLOW labojums

11 metāla krāsu izvēles un atsevišķi krāsas, gaišuma un spīduma regulatori. Krāsas maina tikai korpusa/pogu metāla CSS mainīgos; albuma tint netiek filtrēts vai pārrakstīts. RGB vērtības ir šī dizaina vizuālas interpretācijas, nevis Apple specifikācijas. Nosaukumu avoti: [iPhone 15 Pro](https://www.apple.com/newsroom/2023/09/apple-unveils-iphone-15-pro-and-iphone-15-pro-max/), [iPhone 16 Pro](https://www.apple.com/sg/newsroom/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/), [iPhone 17 Pro](https://www.apple.com/shop/buy-iphone/iphone-17-pro), [iPhone 18 Pro](https://www.apple.com/newsroom/2026/09/apple-debuts-iphone-18-pro-and-iphone-18-pro-max/). Iestatījumi lieto esošo Apply/Cancel plūsmu; lokālā profila priekšskatījuma papildu laukos saglabā metalColor, metalLight un metalShine.

SLOW pirms pielāgotā ātruma/boost piemērošanas tagad nosaka jauno EQ režīmu. Agrāk pielāgojumi vēl lasīja iepriekšējo režīmu un pirmajā klikšķī atcēla palēninājumu. Izņemts otrs tās pašas pogas click apstrādātājs un atliktie popup piespiedu atvēršanas izsaukumi. Popup pārvietots uz body, lai fiksētās ekrāna koordinātas neietekmētu pārveidotais, apgrieztais radio panelis. Poga vienreiz atver un ieslēdz SLOW; atkārtoti aizver vadīklas, saglabājot efektu.

Labais OEL uzraksts noņemts. Apaļās vadības hover nemaina pogas taisnstūrveida fonu. EQ pogu teksts centrēts, EQ+ izmanto saskaņotu apdari. Pārbaudīti 276 Node testi un pārlūkā pirmais SLOW klikšķis, ātruma atjaunošana, popup koordinātas/aizvēršana, hover, visu EQ uzrakstu centri, toņu saglabāšana, atcelšana un atjaunošana pēc lapas pārlādes.

Pogu apdare: vienādas, taisnas metāla pogas ar maigi noapaļotiem stūriem, smalku faktūru, centrētiem Arial uzrakstiem un gravējuma ēnojumu. Aktīvo EQ apzīmē neliela izgaismota josla. Iepriekšējās slīpās formas un savienojošā hroma josla noņemtas. Skaļuma poga un tās vadība paliek iepriekšējā izskatā.

Korpusa tonis iekrāso arī iekšējo priekšpuses virsmu, ne tikai ārējo rāmi un pogas. Displeja tumšā pamatne saņem tā paša toņa ļoti tumšu nokrāsu, bet ekrāna teksts un vizualizācija saglabā albuma tint. Pogas izmanto tos pašus metāla toņa mainīgos; jauni tekstūru skini nav pievienoti.

Zem skaļuma regulatora vairs nav ± pogu un procentu. Pogas vidū paliek VOLUME; grozot, ritinot vai izmantojot tastatūru, centrālajā displejā parādās VOLUME, procenti un segmentu josla. Esošais 1,2 sekunžu OSD taimeris atjauno vizualizāciju pēc regulēšanas.

Izskata iestatījumu sadaļā Vizualizācija pievienota Pioneer cilne blakus Jaunais skats un Classic. Tā izmanto kopīgo 51 kustīgās izvēles katalogu, meklētāju un statiskos priekšskatījumus ar IntersectionObserver. Cilnes atvēršana nemaina pašreizējo vizualizāciju; tikai izvēle aktivizē klipu. Atcelt atjauno iepriekšējo Pioneer klipu un vizualizāciju. Pārbaudīta slinkā ielāde, izvēle, atcelšana, Lietot/atkārtota atvēršana un pārslēgšanās atpakaļ uz Classic.

Pioneer izkārtojuma priekšskatījums tagad ir samazināts faktiskā DOM/CSS momentuzņēmums izolētā Shadow DOM. Tas pārņem arī pseidoelementu apdari un canvas kadru, bez notikumu apstrādātājiem, atskaņotāja vai sava animācijas cikla. Kustīgie WebP izmanto statisko plakātu. Izmaiņas apvienotas ar 150 ms intervālu tikai atvērtā panelī; aizverot atjaunošana nenotiek. Pārlūkā pārbaudītas identiskas proporcijas, regulatoru izmēru attiecība, pogu skaits un metāla krāsas.

Spektra pārvietošana izskata priekšskatījumā ieslēdzama ar atsevišķu pogu. Pēc katras paneļa atvēršanas tā ir izslēgta. Ieslēgtā režīmā vilkšana un bulttaustiņi pārvieto tikai monitoru; citādi saglabājas esošā fona vilkšana. Home un Atiestatīt pozīciju atjauno nulles nobīdi. Relatīvās nobīdes glabājas vizPositions katram izkārtojumam atsevišķi, tiek ierobežotas paneļa robežās (Pioneer — displejā), un lieto esošo Lietot/Atcelt plūsmu un lokālā profila papildu iestatījumus. Pārbaudīta fona/spektra neatkarība, atiestatīšana, atcelšana, tastatūra un pārlāde. Izmaiņas nav publicētas.

Pioneer izkārtojumā fona katalogs/filtri, Mana kartīte, fona paskaidrojums, attēla nobīde/izmērs, Bez fona attēla un fona tumšuma/pārklājuma regulatori ir paslēpti. Fona attēls šajā režīmā netiek sagatavots vilkšanai. Classic un Jauns izkārtojums atjauno vadīklas; saglabātais fons un tā koordinātas paliek neskarti. Pārlūkā pārbaudīta atkārtota izkārtojumu maiņa un Lietot/atvēršana.

SLOW stabilitāte: EQ vairs neraksta ātrumu secībā 1 → 0,88 → pielāgotais; vienā darbībā iestata tikai gala ātrumu un vienādu vērtību nepārraksta. SLOW paneļa atvēršana jau aktīvam efektam nepārkonfigurē audio. Mitrā signāla un atgriezeniskās saites pārejas atceļ iepriekšējo automatizāciju un 80 ms laikā piemēro galīgo lietotāja vērtību. Skaļuma slīdnis zem 100% tagad samazina efekta gain. SLOW ātruma slīdņa noklusējums ir redzami 88%, nevis slēpts reizinātājs pie 100%. Saglabājot oriģinālo toni, toņa korekcija ir atspējota un netiek ieskaitīta ātrumā. Atlikta AudioContext.suspend pabeigšana pēc play pārbauda aktuālo atskaņošanas stāvokli un atsāk kontekstu; SLOW žests atkopj apturētu kontekstu tikai tad, ja pats audio nav lietotāja pauzē.

Skaņas efektu panelis pārtaisīts neitrālā radio stilā bez MINKA FX, violetām krāsām un daudzkrāsainajām kapsulām. Latviski uzraksti, lielāks slīdņu satveršanas laukums, atsevišķa aizvēršana. Izolētā Chrome ar īstu PCM skaņu caur esošo WebAudio ķēdi pārbaudīti 8 atkārtoti SLOW cikli ar 4× CPU palēninājumu; mērīts signāls un atskaņošanas laika pieaugums, reverb=0 pēc rampas, gain=0,5, keepPitch, konteksta atkopšanās un strauja pause/play secība. Tās ir lokālas pārbaudes, nevis konkrētās darba datora tiešraides tīkla pārbaude.

Skaņas efektu vadīklām pievienotas vienotas lokālas SVG ikonas, īsi darbības skaidrojumi un slīdņu virzienu uzraksti. Reverberācija lietotnē nosaukta Telpas efekts. Bloķētā toņa vadīkla paskaidro, kuru slēdzi izslēgt, lai to mainītu. Nav jaunu attēlu pieprasījumu vai animāciju. Vizuāli pārbaudīts panelis un atkārtoti iziets testa audio scenārijs.

### Live SLOW failure, 2026-09-10

Reproduced in the user's Chrome tab on Remix: switching to 0.88 raised media error 4, `PipelineStatus::DEMUXER_ERROR_COULD_NOT_PARSE`, with native HLS. Chromium HLS now selects the existing lazy hls.js/MSE path before playback. Safari keeps native HLS and direct streams do not load the parser. Clearing a stream removes `src` instead of assigning an empty URL, avoiding a false error during lazy initialization. A failed stream can be retried with Play; pause/error button labels now match the icon. No periodic watchdog or extra audio graph was added.

Validated with 107 radio tests, plus actual Remix HLS through the Web Audio graph: eight FLAT/SLOW cycles under 4x CPU throttling, advancing media time and nonzero audio RMS, unchanged stream connection when reopening controls, volume/reverb/pitch settings, context resume, and pause/play races. Pioneer utility glyphs are centered within their 18px icon boxes; live measured horizontal and vertical center offsets are zero.

### Pioneer profile persistence, 2026-09-10

The production `cleanRadio` allowlist still accepted only classic/clean and discarded Pioneer metal/position fields. It now accepts Pioneer, validates a six-digit metal color, bounds brightness/gloss to 0–100 and spectrum coordinates to −1…1 for the three supported layouts. API tests cover save/load, a second session, unrelated favorite changes, account isolation, reset and malformed fields (38 integration/profile tests passed).

Published only this sanitizer into the current `lacitis-api` bundle using the content-only API. All code outside that function and the Worker bindings, allowed origins, compatibility settings and observability are unchanged; no database migration or profile reset. Active version: `d8d23772-4b8b-4192-b60b-949d116b2031`. Existing frontend already sends these fields, so no service-worker bump is required.
