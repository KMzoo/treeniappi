# Treeniappi

Henkilökohtainen treeni- ja ruokapäiväkirja yhdelle ihmiselle ja yhdelle ohjelmalle.
Local-first PWA: ei tiliä, ei palvelinta, data pysyy puhelimessa (IndexedDB), toimii offline.

**Sovellus:** https://kmzoo.github.io/treeniappi/

Spesifikaatio: [treeniappi-spec.md](treeniappi-spec.md). Liikekortit: [liikekortit.md](liikekortit.md).

## Asennus puhelimeen (Android / Chrome)

1. Avaa https://kmzoo.github.io/treeniappi/ Chromessa.
2. Valikko (⋮) → **Lisää aloitusnäyttöön** / **Asenna sovellus**.
3. Avaa kotinäytön kuvakkeesta. Toimii tämän jälkeen ilman verkkoa.

Päivitys: kun `main`-haaraan pushataan, sovellus hakee uuden version taustalla ja se on käytössä
seuraavalla avauksella. Ei tarvitse asentaa uudelleen.

## Näkymät

| Näkymä | Sisältö |
|---|---|
| **Tänään** | Pe/la/su: päivän treeni (A/B/C). Ma–to: GtG-laskurit. Selkärutiini-checklist (6 liikettä) + putki. Ruoan kcal/proteiini vs. tavoite. |
| **Treeni** | Päivän liikkeet, "viimeksi"-luvut ja tavoite +1, setti kerrallaan (oletuksena viime kerran luku), reppupaino kg, variaatiovalinta, liikekortti nimestä. "Valmis" leimaa ajan. |
| **Ruoka** | Vakioateriat yhdellä napautuksella (Aamupala A/B, Päivällinen g+g -laskurilla, Iltapala), vapaa kirjaus, viimeisimmät muistissa, päivän summa vs. 2500 kcal / 170 g. |
| **Mittarit** | Aamupaino, vyötärö, leuanvedot (max), selän tuntemus 1–5. Kaaviot: paino viikkokeskiarvona, vyötärö, leuanvedot. Kuvapäivä 4 vk välein. JSON-vienti/-tuonti, CSV-vienti. |

## Ohjelman muokkaus

Ohjelma on seed-dataa tiedostossa [`js/seed.js`](js/seed.js): treenit A/B/C (`TEMPLATES`),
liikkeet ja progressioportaat (`EXERCISES`), selkärutiini (`ROUTINE`), GtG-tehtävät (`GTG`) ja
ateriapresetit (`PRESETS`, `DINNER`). Muokkaa, committaa, pushaa — ei editoria sovelluksessa (spec).

> Huom: `treenisuunnitelma-2-0.md` ja `calisthenics-liikepankki.md` eivät olleet saatavilla
> rakennusvaiheessa. A/B/C-jako ja progressioportaat on johdettu liikekortit.md:stä — tarkista ja
> säädä `seed.js` omaa ohjelmaa vastaavaksi.

## Kehitys

Ei build-vaihetta. Vanilla JS (ES-moduulit), ei riippuvuuksia.

```
npm test          # logiikkatestit (node:test)
npm run serve     # paikallinen palvelin http://localhost:8080
npm run icons     # generoi icons/*.png uudelleen
```

Tiedostot:

```
index.html              runko + tabit
css/style.css           tyylit (tumma, mobiili-ensin)
js/app.js               reititys (#tanaan #treeni #ruoka #mittarit), SW-rekisteröinti
js/db.js                IndexedDB-kerros, export/import
js/logic.js             puhdas logiikka (testattu)
js/seed.js              ohjelma, liikkeet, liikekortit, presetit
js/chart.js             SVG-viivakaavio
js/views/*.js           näkymät
sw.js                   service worker (offline, stale-while-revalidate)
manifest.webmanifest    PWA-manifesti
tests/                  node --test
```

## Datamalli

Katso `treeniappi-spec.md` → Datamalli. IndexedDB-storet: `sessions`, `routineDays`, `meals`,
`metrics` (avain `type|date`), `settings`, `recent`. Varmuuskopio = koko kanta yhtenä JSONina
(Mittarit → Vie JSON).
