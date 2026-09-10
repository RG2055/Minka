# Radio kataloga lokālās izmaiņas, 2026-09-10

## Pārlūkošana

“Atklāj” seko lietotāja rrradio ekrānattēlu principam: žanru pogas ar katalogā esošo staciju skaitu, valstis ar karodziņiem un skaitu, staciju logo rinda, izceltās stacijas. Pogas atver esošo staciju sarakstu. “Pasaule” apvieno valsti, žanru, nosaukuma meklēšanu un minimālo bitreitu. Karodziņi ir attēli, lai tie būtu redzami arī Windows.

Kopskaits nāk no Radio Browser `/json/stats`, pārbaudes laikā 58 141 stacija un 241 valsts/teritorija. Tas ir visa avota kataloga apjoms, nevis garantēti šeit atskaņojamu staciju skaits. Žanru un valstu skaits ir avota metadati; HTTPS atlase var samazināt redzamo rezultātu daudzumu.

## Ielāde un favorīti

Sākotnējā radio ielāde nepieprasa pasaules katalogu. “Atklāj” pēc pieprasījuma ielādē mazu vietējo izlasi, valstu sarakstu, līdz 100 populāru tagu metadatus, statistiku un vienu staciju lapu. “Pasaule” pieprasa ne vairāk kā 60 ierakstus lapā. Piecu minūšu kešatmiņā saglabā ne vairāk kā astoņas API atbildes; vienādi paralēli pieprasījumi tiek apvienoti. Tiek izmantoti trīs API spoguļi ar laika ierobežojumu. Viss 17 MB rrradio katalogs netiek pievienots lietotnei.

Esošo staciju favorītu atslēgas saglabātas. Jaunajām pasaules stacijām izmanto stabilu Radio Browser UUID, izlasei stabilu `featured:` atslēgu; citā ierīcē staciju datus atjauno pēc šīm atslēgām. Noklusējuma atskaņošana sākas ar Remix; saraksts atver favorītus vai “Atklāj”. Kataloga atbilžu secība nedrīkst nomainīt pašlaik skanošo staciju.

## Straumju pārbaude

Izolētā Chrome pārlūkā pārbaudītas 97 straumes: 73 agrākās “Latvija” cilnes stacijas, 19 papildinājumi un 5 izceltās. Pārbaudīts ne tikai HTTP statuss, bet audio laika pieaugums un nenulles Web Audio analizatora dati. Tā bija pārbaude šajā Mac datorā, nevis darba Windows tīklā.

96 straumes vismaz vienā mēģinājumā deva audio. AVTORADIO, LOUNGE FM un RELAX FM reizēm radīja dekodēšanas kļūdu savienojuma sākumā, atkārtotā mēģinājumā atskaņojās. RMF FM šajā tīklā vairākkārt neizdevās saņemt laikā; darbību nevar apstiprināt un esošā adrese netika aizstāta ar nepārbaudītu.

Labotas adreses: Latvijas Radio 3, NRJ, Chilltrax, Pasaules mūzikas radio, Vikerraadio, jaunās EHR tematiskās straumes, ByteFM un SomaFM. Vikerraadio HLS lieto esošo HLS.js parseri, jo Chrome deklarē native HLS atbalstu, bet šīs straumes dekodēšana tajā neizdevās. Pārējā vizualizatora zīmēšana nav mainīta.

LRADIO BALTIJA netika pievienota, jo serveris atgriež nederīgus dubultus CORS galveņu laukus un Chrome to bloķē. EHR Remixes un Rise & Shine izlaisti, jo vecās adreses tagad pāradresē uz jau esošām stacijām.

Pasaules meklēšana izslēdz avotā atzīmētās bojātās un HTTP straumes. Tas negarantē visu pakalpojumu darbību: iespējami CORS ierobežojumi, ģeogrāfiski ierobežojumi un īslaicīgi pārrāvumi. Atskaņotājā kļūmes gadījumā parādās saprotams paziņojums.

## 19 papildinājumi “Latvija” cilnei

- LRMAROCKRADIO
- EHR+
- Radio 7
- Your City Radio
- gradio.lv ONE
- Tīrkultūra
- EHR Party Service
- EHR Gold
- EHR Festivālu Hiti
- EHR Ice Ice Party
- EHR Darbam
- EHR iDeal Music
- ALISE PLUS
- EHR TOP 40
- NewDanceRadio
- Nordic Chillout Indie
- Radio Liepāja
- Radio Viens
- Retro FM 70s 80s 90s

## Pārbaudes

Sākotnējā kataloga pārbaudē 255 automatizētie testi izpildīti veiksmīgi. Papildus izolētā pārlūkā pārbaudīts dzīvais katalogs, žanra/valsts/kvalitātes filtri, favorīta pievienošana, nemainīga pašreizējā stacija, staciju logo un tematizēts fokuss bez violetā gredzena. Reālas lietotāja profila izmaiņas testā netika veiktas.

## Avoti

- [rrradio GitHub](https://github.com/MarkusSteinbrecher/rrradio/), pārbaudītais commit `6dcc94d673da88e863a8ab78adb5e00b1f143793`.
- [Radio Browser API](https://docs.radio-browser.info/), staciju dati un skaits.
- [Radio Browser valstis](https://www.radio-browser.info/countries) un [Radio Garden Browse](https://radio.garden/browse), pārlūkošanas piemēri.
- [rrradio Groove Salad](https://rrradio.org/station/soma-groove-salad/), sākotnējā izceltā izlase.
- [SomaFM oficiālās straumes](https://somafm.com/groovesalad/directstreamlinks.html).
- [FlagCDN](https://flagcdn.com/), valstu karodziņi.

Staciju logo sākotnējie URL saglabāti `data/radio-featured.json` laukā `coverSource`. Audio, logo un zīmoli pieder attiecīgajiem īpašniekiem. Projekta MIT licence nepārlicencē trešo pušu straumes vai logo. rrradio licences teksts saglabāts blakus: `rrradio-LICENSE.txt`.

Izlaidums sagatavots GitHub `main` ar service worker versiju `minka-4.6.591`. Cloudflare serveru izvietošana šajā izlaidumā nav nepieciešama.

## Logo un dziesmu dati, papildinājums

Atskaņotājs tagad izmanto to pašu stacijas logo kā saraksts, ja nav pašreizējās dziesmas vāciņa. Neielādējama vāciņa vietā vispirms rāda stacijas logo. Radio Record metadatu avots un atjaunošanas biežums saglabāts.

Pievienoti ZET oficiālie Eurozet JSONP dati (izolētā sandbox iframe), SWH un citu Icecast serveru statusa dati, FIP, SomaFM un KEXP publiskie API. Vispārīgais ICY lasītājs lieto ne vairāk kā 128 KiB parauga un uzreiz aizver savienojumu. Metadati neievada vai nepārslēdz audio atskaņošanu. Jaunajiem avotiem pārbaude reizi 30 sekundēs tikai redzamam, skanošam radio; kļūmju gadījumā līdz piecu minūšu pauze. Stacijas maiņa, pauze vai paslēpta cilne pārtrauc aktīvo pieprasījumu. Starp ierakstiem var būt raidījuma nosaukums bez izpildītāja; novecojušas ZET dziesmas netiek uzdotas par pašreizējo.

Dzīvie dati pārbaudīti Chrome pārlūkā visiem pieciem konkrētajiem avotiem. Atskaņotāja laukos pārbaudīts ZET logo un ziņu nosaukums, SWH izpildītājs/dziesma ar stacijas logo, un bojāta vāciņa aizstāšana. Pilnajā testa kopā 260 veiksmīgi testi. Visām 58 tūkstošiem staciju dziesmu informācija netiek garantēta: daļa avotu metadatus nepublicē vai bloķē piekļuvi no citas vietnes.

Papildu avoti: [ZET oficiālā dziesmu vēsture](https://player.radiozet.pl/Sprawdz-co-gralismy), [SomaFM](https://somafm.com/songs/groovesalad.json), [KEXP](https://api.kexp.org/v2/plays/?limit=1), [FIP](https://api.radiofrance.fr/livemeta/live/7/fip_extended), [SWH Icecast](https://live.radioswh.lv:8443/status-json.xsl). Šie labojumi iekļauti tajā pašā izlaidumā.

## Pēdējie precizējumi

“Atklāj” atrodas aiz “Favorīti”. Samazinātas atstarpes sākumlapā. Saglabāts kompaktais staciju kartīšu izmērs un kolonnu skaits; pilns nosaukums un apraksts pieejams kartītes `title` tekstā, uzvedot peli. Rindas var ritināt, velkot ar peli, nejauši neaktivizējot staciju vai favorītu.

Remix sākotnējā lokālā HLS adrese lieto `record-rmx`, bet API identifikators ir `rmx`. Abi sasaistīti ar vienu staciju, tāpēc dziesma un albums ielādējas arī bez pārslēgšanas prom un atpakaļ. Pārbaudīts ar dzīvo API.

Service worker nekešo ZET JSONP pieprasījumus, lai periodiski dziesmu dati neveidotu arvien jaunus pastāvīgā keša ierakstus.
