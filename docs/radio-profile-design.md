# Radio profils un personīgais izskats

Servera daļa publicēta Cloudflare 2026-09-08; jaunā saskarne pagaidām darbojas lokāli. Loader un `sw.js` nav mainīti.

## Vienots konts

Radio un iebūvētais mūzikas atskaņotājs izmanto vienu servera pārbaudītu sesiju un esošo Lācīša PIN. Parasta ieiešana esošos PIN un dziesmu bibliotēkas nepārraksta. Pēc īpaša lietotāja pieprasījuma 2026-09-08 visi Cloudflare profili, PIN un dziesmu saraksti tika atiestatīti; turpmāk profilu izveido no jauna. Jaunam kontam izveido 6 ciparu PIN ar atkārtojumu. Vārdu izvēlē ir tikai kalendārā izvēlētās dienas radiogrāferi. Tā ir lietotāja izvēles filtrēšana; serverim pašlaik nav neatkarīga darba grafika avota.

Bez konta poga ir **Ielogoties**, zīmols **RG RADIO**. Pēc ieiešanas rāda personīgo emoji (vai iniciāļus), vārdu un zīmolu **RADIO VĀRDS**. Blakus atsevišķa maza **Iziet** poga. Mainot dienu, cita cilvēka kontu automātiski neizvēlas; ja cilvēks jaunajā dienā nav pieejams, sesiju aizver.

Sesijas marķieris atrodas sessionStorage, PIN pārlūkā netiek saglabāts. Favorītu izmaiņu rinda piesaistīta konta ID; novēlotas atbildes pēc iziešanas netiek piemērotas citam cilvēkam. Saglabāšanu pēc savienojuma atjaunošanās atkārto tikai attiecīgajam kontam. PIN atkopšanas kodu parāda vienreiz; nomaiņa saglabā datus, anulē vecās sesijas un izveido jaunu atkopšanas kodu.

## Kompakta izvēlne un pamācība

Izvēlni novieto pie profila pogas ar lokāli glabātu Floating UI (core un DOM 1.8.0). Pārlūka dialog nodrošina modālo fokusu un Escape. Pozīcijas novērošana darbojas tikai atvērtai izvēlnei; aizverot to atvieno. Bibliotēku lejupielādē no lokālā servera tikai pirmajā atvēršanas reizē.

Profilā: identitāte, **Radio izskats**, **Pamācība**, favorīti, **Mainīt profilu**, **Iziet**. Pārkārtošanas/noņemšanas pogas rāda tikai rediģēšanas režīmā. Favorītu laukums ir ritināms, līdz 212 px augsts, šaurā/zemā logā saraujas; gari nosaukumi saīsinās vienā rindā. Pārkārtojot saglabā ritināšanas pozīciju un fokusu. Noņemšanu var atsaukt, atjaunojot arī vietu sarakstā. Servera datiem ir 250 favorītu robeža.

Driver.js 1.8.0 rāda četrus īsus paskaidrojumus pie faktiskajām radio pogām: izskats, stacijas, profils, iziešana. To ielādē tikai vajadzības brīdī. Beidzot, aizverot/slēpjot radio, pārslēdzot uz mūziku vai izlogojoties pamācību iznīcina. Samazinātas kustības režīmā un datoros ar līdz 4 loģiskajiem kodoliem pārejas ir bez animācijas. Netiek pievienots pastāvīgs kadru cikls.

Bibliotēku MIT licences, versijas, izcelsme un npm integritātes vērtības atrodas `vendor/driver/1.8.0` un `vendor/floating-ui`. Saspiesti ar gzip: Driver JS 7242 B, CSS 970 B; Floating core 4745 B, DOM 4065 B. Tie ir failu izmēri, ne veca datora darbības ātruma garantija.

## Radio izskats

12 gatavi foni, no kuriem seši ir viegli CSS gradienti. **Kā mana kartīte** pārņem ielogotā darbinieka saglabāto attēlu/gradientu un krāsas bez kartītes animācijām. Izvēlētais fons saglabājas, bet pogu un gaismas krāsa albuma režīmā turpina sekot albumam. Kartītes un sava krāsa ir atsevišķi režīmi.

Papildus: tumšums, krāsas pārklājums, fake glass stiprums, gaismas stiprums, attēla novietojums, teksta krāsa un vizualizācija. **Lietot** saglabā profilā, **Atcelt** atgriež iepriekšējo izskatu. Atiestatot izskatu favorīti un PIN paliek. Ieiešana nepalaiž pēdējo staciju automātiski, skaļums paliek ierīcei.

## Pārbaudes un robežas

Node testi pārbauda sesijas un kontu izolāciju, veco PIN atrašanu, PIN atkopšanu, nepareizu mēģinājumu ierobežošanu, administratora atkopšanas piekļuvi, favorītu darbības, novēlotas/offline atbildes, datuma maiņu un iziešanas pogu. Sākotnējās pārlūka pārbaudes izmantoja sintētiskus datus uz 127.0.0.1:8012. Dzīvajai pārbaudei atļauts tikai Riharda profils uz 127.0.0.1:8000.

Atsevišķs BETA TEST konts satur 250 garus staciju nosaukumus izkārtojuma pārbaudei. ALPHA TEST dati šīs pārbaudes laikā netika aizstāti. Lokālā servera `/__profile-viewport?width=360&height=480` pārbauda īstu 360×480 iframe izkārtojumu.

Servera integrācijas un migrācijas norādes: `integrations/lacitis/README.md`. Servera daļa ir ieviesta produkcijā. Darbības mērījumi fiziskā vecā datorā nav veikti.

Pēdējā pārbaude: 203 automātiskie testi izturēti, JS/HTML sintakses pārbaudes bez kļūdām, loader bloki un service worker nemainīti. Pārlūkā ar 250 favorītiem 360×480 logā profila izmērs bija 326×448 px, saraksta redzamais augstums 156 px; scrollWidth bija vienāds ar clientWidth (298 px), un konta pogu apakša bija pie 447 px. Plašākā logā saraksta augstums 210 px. Pārvietojot 250. staciju augstāk, saglabājās scrollTop 11039 px un mainījās pareizā secība. Pārbaudīta noņemšana/atjaunošana, profila ieiešana un kopīga iziešana radio un mūzikas skatā. Testa ekrānu cilnes aizvērtas; galvenajā lokālajā lapā radio atstāts atvērts bez konta.

Papildinājums: radio izskata izvēlnes `select` laukiem noņemts kopējā lapas stila violetais box-shadow. Visas radio/profila formas vadīklas saglabā skaidru, gaišu 2 px tastatūras fokusu. Pārlūkā uz vizualizācijas lauka pārbaudīts `:focus-visible`: outline rgb(185,221,207), box-shadow none.

Personīgās kartītes izvēle ir piesprausta pie izvēlnes augšas ārpus ritināmā fona saraksta. Tā rāda pašreizējā profila vārdu, emoji/iniciāļus un tieši viņa kartītes fona priekšskatījumu. Izvēloties redzama atzīme, radio pārņem to pašu fonu un paliek albuma krāsu režīmā. Pārbaudīts sintētiskajā ALPHA kontā ar gradientu; saglabāts tikai lokālā testa profila radio izskats. Papildu tests pārbauda atšķirīgus divu cilvēku fonus un krāsas, attēlu URL atrisināšanu un nepazīstamu personu. 15 attiecīgie profila/staciju/kartītes testi izturēti.

Dzīvā pārbaude pēc Cloudflare atiestatīšanas: Rihards pats izveidoja PIN un saglabāja atkopšanas kodu. Pārbaudīta atkārtota ieiešana, radio favorītu pievienošana/saglabāšana/noņemšana, mūzikas favorīta saglabāšana un noņemšana, personīgās kartītes fons, albuma krāsu režīms un kopīga iziešana. Riharda jaunās izvēles Remix un CAPITAL FM saglabātas; testa favorīti noņemti. Mūzikas favorītu un vēstures skaits serverī ir 0. Saskarne atstāta bez aktīva profila.

Atkopšanas norāde: “Šis kods tiek parādīts tikai vienu reizi.” Pārlādes laikā kalendārs atgriežas šodienā; ja profils šai dienai neatbilst, tas tiek aizslēgts. Mūzikas paneļa saglabāšanas norāde tagad seko faktiskajai atbildei, arī kļūdai.

## Automātiska iziešana maiņas sākumā

Nākamās dežūras dienas sākumā, 08:00 pēc Latvijas laika, kopīgais radio un mūzikas profils izlogojas. Izvēlētais kalendāra datums šo termiņu nepagarina. Ja dators guļ vai cilne ir apturēta, termiņu pārbauda arī pēc atgriešanās un pirms darbībām. Serveris neatkarīgi noraida beigušos sesiju. PIN, favorīti un izskats saglabājas. Nav nepārtrauktas pārbaudes cilpas: tiek izmantots viens taimeris un atgriešanās notikumi.

## Personīgā izskata noņemšana pēc iziešanas

Pārbaudē atrasta pārlādes kļūda: personīgais izskats bija ierakstīts kopīgajos radio iestatījumos, bet pirms ieiešanas esošais fons glabājās tikai atmiņā. Pēc pārlādes par viesu fonu kļūdaini kļuva personīgais skins. Tagad viesu izskatu saglabā atsevišķi pirms personīgā profila piemērošanas un atjauno gan iziešanas, gan radio inicializācijas laikā. Veca versija bez šādas rezerves ar izvēli “Mana kartīte” atgriežas noklusētajā okeāna fonā. Profila dati serverī paliek neskarti.

Pārbaudes: 206 testi izturēti; papildus pārbaudīta fona un teksta krāsas atjaunošana pēc pārlādes, atkārtotas profila ielādes un 08:00/pamodināšanas iziešanas. Reālajā lokālajā PWA viesim pirms labojuma vēl bija Riharda kiborga fons; pēc labojuma radio atvērās ar okeāna fonu, noklusēto teksta krāsu un pogu “Ielogoties”. Šajā pārbaudē netika prasīts PIN vai mainīti serverī saglabātie profila iestatījumi. Izmaiņas ir lokālas; loader un service worker nav mainīti.

## Vienotā josla un mobilais skats

Mūzikas joslā noņemta atkārtotā profila poga labajā pusē. Kopīgais konts paliek pie radio/mūzikas izvēles; mūzikas favorītu poga atver bibliotēku un bez konta izmanto kopīgo ielogošanās logu. Joslai ir tumšāks statisks fons, gaiši neatkarīgi teksti, vienotas pogas un SVG favorītu ikona. Personīgo skina krāsu dēļ teksts vairs nekļūst tumšs. Radio ārējais rāmis izmanto vienu vāju kontūru un nelielu ārējo ēnu bez dubultās iekšējās līnijas.

Pēc lietotāja precizējuma radio/mūzika nav pieejama mobilajā skatā (līdz 760 CSS px, vai skārienierīcēs līdz 950 CSS px). Tiek paslēptas arī atvēršanas pogas; pārejot uz šo skatu, radio tiek pauzēts, mūzikas iframe izņemts un kalendāram atdota vieta. Atgriežoties datora skatā, atskaņošana nesākas pati. 208 automātiskie testi izturēti; loader un service worker nemainīti. Lokālajā pārlūkā pārbaudīta kopīgā ieiešana no favorītiem, datora josla un mobilais ierobežojums.

Papildu malas precizējums: apakšējā apmale ir pilnīgi noņemta, attēla pēdējie 24 px saņem statisku tumšu pāreju. Pāreja ietekmē tikai fonu, nevis pogas vai tekstu; netiek izmantots blur vai animācijas cikls.

## Kalendāra plūstošās virsmas

Pēc precizējuma kalendāra robežu mīkstināšana darbojas neatkarīgi no radio stāvokļa. Atsevišķs `css/calendar-surfaces.css` noņem hosta ārējo rāmi un atspīduma slāni, kolonnu fonus, atdalītājus un hover ēnas. Galvenes attēlam un ritināmajiem sarakstiem ir statiska 22px malas pāreja; kartīšu izskats, galvenes vadīklas un nākamās maiņas nosaukumi netiek izpludināti. Nav pievienoti JavaScript, taimeri vai animācijas. Faktisks veca datora GPU/CPU salīdzinājums nav veikts; mazāks resursu patēriņš nav garantēts. Pārbaudīts pārlūkā ar aizvērtu radio; loader un radio faili šai izmaiņai nav mainīti.
