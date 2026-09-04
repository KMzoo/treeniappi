# Treeniappi — spesifikaatio Claude Codelle

## Tavoite

Henkilökohtainen treeni- ja ruokapäiväkirja, joka toteuttaa **yhden ihmisen yhden ohjelman** — ei geneerinen fitness-app. Korvaa paperilapun ja päässälaskun. Jos se on isompi kuin tarvitsee, sitä ei käytetä.

**Käyttäjä:** yksi. Ohjelma: *treenisuunnitelma-2-0.md*. Ruokailu: kiinteät vakioateriat.

## Reunaehdot

- **Puhelin ensisijainen laite** (Android). Ma–to työmaalla ilman läppäriä.
- **Toimittava offline.** Työmaalla verkko voi olla huono.
- **Ei tiliä, ei palvelinta, ei maksuja.** Data pysyy laitteella.
- **Minuutti per kirjaus.** Jos treenin kirjaaminen kestää kauemmin, se jää tekemättä.
- **Suomenkielinen UI.**

## Tekninen valinta (ehdotus)

**PWA (Progressive Web App), local-first.**
- Yksi sivu / kevyt SPA, asennettavissa Androidin kotinäytölle.
- Data selaimen **IndexedDB**:ssä (localStorage liian pieni pitkälle historialle).
- **JSON-export/import** varmuuskopioon ja omaan analyysiin (CSV-export mittareista).
- Ei backendia v1:ssä. Sync laitteiden välillä on v2-asia, jos koskaan.
- Stack: vanilla JS tai kevyt framework (esim. Svelte/Preact). Ei raskasta buildia. Charteille kevyt kirjasto (esim. uPlot/Chart.js).
- **Hostaus: GitHub Pages.** Staattiset tiedostot, HTTPS valmiina, ilmainen. Push → sovellus päivittyy puhelimeen seuraavalla avauksella. Ei palvelinta, ei prosessointia, ei tallennustilaa palvelinpuolella — kaikki pyörii ja tallentuu puhelimessa.

Perustelu: puhelin-vain-käyttö, offline, nolla ylläpito. Natiivi-Android on turhaa vaivaa yhdelle käyttäjälle.

---

## Näkymät (4 kpl, ei enempää)

### 1. Tänään (etusivu)
Avautuu suoraan tähän. Näyttää viikonpäivän perusteella:
- **Pe/La/Su:** päivän treeni (A/B/C) + selkärutiini
- **Ma–To:** selkärutiini + GtG-tehtävät
- Selkärutiini **checklistina** (6 liikettä, rasti ruutuun) + putki (streak) päivinä
- Päivän ruoka: kcal / proteiini kertynyt vs. tavoite, yhdellä rivillä

### 2. Treeni
- Päivän liikkeet listana. Jokaisen kohdalla **edellisen kerran luvut näkyvissä** ("viimeksi 4×10, 4×10, 4×9, 4×8") → tavoite +1.
- Kirjaus: setti kerrallaan, toistot numerokentässä, oletusarvona viime kerran luku. Reppupaino kg-kenttä niissä liikkeissä joissa relevantti.
- Liikkeellä **variaatio**-valinta (progressioportaat liikepankista). Kun vaihdetaan variaatiota, historia säilyy liikkeen alla.
- **Liikekortti** avattavissa liikkeen nimestä: asento, 3 vihjettä, yleisin virhe (sisältö *liikekortit.md*:stä). Tarkoitus: tekniikka löytyy sovelluksesta, ei Googlesta kesken treenin.
- Treenin lopuksi "valmis" → tallennus, aika leimautuu.
- GtG-päivinä: punnerrukset sarjalaskuri (napauta = +1 setti), tavoite 5.

### 3. Ruoka
- **Vakioateriat presetteinä:** Aamupala A, Aamupala B, Päivällinen (proteiini + hiilari, molemmat gramma-kentät), Iltapala. Yksi napautus lisää aterian oletusannoksilla; annoksia voi säätää.
- **Vapaa kirjaus:** nimi, kcal, proteiini g. Ei tietokantaa elintarvikkeista — pakkauksen luvut syötetään käsin (kuten nyt).
- Päivän summa: kcal ja proteiini vs. tavoite (2500 / 170). Pelkkä numero ja väripalkki, ei muuta.
- Viimeisimmät vapaat kirjaukset muistissa nopeaan uudelleenkäyttöön ("Grandiosa", "kanajerky 50 g").

### 4. Mittarit
- Syöttö: **aamupaino**, **vyötärö** (cm), **leuanvedot** (max), **selän tuntemus** (1–5).
- Kaaviot: paino **viikkokeskiarvona** (ei päiväpisteinä isosti), vyötärö, leuanvedot. Aikajana kuukausia.
- Kuvat: **ei sovelluksessa.** Muistutus vain: "kuvapäivä 4 vk välein" laskettuna edellisestä.

---

## Datamalli (JSON)

```
Exercise      { id, name, nameEn, category: push|pull|legs|core, variations: [string], unit: reps|seconds, formCard: { setup, cues: [3], commonMistake } }
Session       { id, date, template: A|B|C|GtG, entries: [Entry], done: bool }
Entry         { exerciseId, variation, sets: [{ reps, weightKg? }] }
RoutineDay    { date, items: [bool×6], allDone: bool }
Meal          { id, date, presetId?, name, kcal, proteinG }
Preset        { id, name, defaultKcal, defaultProteinG, adjustable: [{ field, perUnitKcal, perUnitProtein }] }
Metric        { date, type: weight|waist|pullups|back, value }
Settings      { kcalTarget: 2500, proteinTarget: 170, programVersion: "2.0" }
```

## Seed-data (kovakoodataan v1:een)

- Treenit A/B/C ja selkärutiini suoraan *treenisuunnitelma-2-0.md*:stä
- Progressioportaat *calisthenics-liikepankki.md*:stä
- Ateriapresetit:
  - Aamupala A: kaura 90 g + skyr 250 g + marjat + banaani → ~650 kcal / 34 g P
  - Aamupala B: 3 munaa + leipä + juusto + kinkku + maito → ~745 kcal / 42 g P
  - Päivällinen: proteiini g × (kana 1,1 kcal/g, 0,23 P/g) + hiilari kuiva g × (riisi/pasta 3,55 kcal/g) + vakio-osa 370 kcal (kastike, öljy, juusto)
  - Iltapala: raejuusto/skyr 250 g + leipä 3 + kinkku 60 g + hedelmä → ~800 kcal / 58 g P

## Ei v1:ssä (tietoisesti)

- Ei elintarviketietokantaa, ei viivakoodiskannausta
- Ei sync-palvelinta, ei kirjautumista
- Ei push-notifikaatioita (v2: selkärutiinin muistutus)
- Ei kuvien tallennusta
- Ei kalenteri-integraatiota
- Ei "yleistä" ohjelmaeditoria — ohjelma vaihdetaan koodissa seed-datana. Editori vasta jos ohjelma vaihtuu usein.

## Toteutusjärjestys

1. Datamalli + IndexedDB-kerros + export/import
2. Tänään-näkymä + selkärutiinin checklist
3. Treeni-näkymä (kirjaus + "viimeksi"-luvut)
4. Ruoka-näkymä (presetit + vapaa)
5. Mittarit + kaaviot
6. PWA-manifest + service worker (offline) + kotinäytölle asennus

Kohta 3 on se joka ratkaisee käytetäänkö appia. Tee se ennen ruokaa ja mittareita.

## Testi: onko tämä valmis?

Perjantai-illan Treeni A kirjattu alle 90 sekunnissa, seuraavana perjantaina näkyy mitä pitää ylittää. Jos se toimii, loput on bonusta.
