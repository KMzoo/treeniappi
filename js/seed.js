// Seed-data: ohjelma, liikkeet, selkärutiini, ateriapresetit.
// HUOM: treenisuunnitelma-2-0.md ja calisthenics-liikepankki.md eivät olleet saatavilla
// rakennusvaiheessa. Treenit A/B/C ja progressioportaat on johdettu liikekortit.md:stä.
// Ohjelma vaihdetaan muokkaamalla tätä tiedostoa (spec: ei ohjelmaeditoria v1:ssä).

export const PROGRAM_VERSION = '2.0';

export const EXERCISES = [
  // ---------- Veto ----------
  {
    id: 'leuanveto', name: 'Leuanveto', nameEn: 'pull-up', category: 'pull', unit: 'reps', weight: true,
    variations: ['Negatiivinen leuanveto (4 s lasku)', 'Leuanveto kuminauhalla', 'Leuanveto', 'Leuanveto lisäpainolla (reppu)', 'L-sit-leuanveto'],
    defaultVariation: 'Leuanveto',
    formCard: {
      setup: 'Myötäote hartioita leveämmällä, riipu suorilla käsillä.',
      cues: ['Ennen vetoa lapaluut alas — hartiat pois korvista.', 'Vedä kyynärpäät kohti kylkiä, leuka tangon yli.', 'Laskeudu hallitusti täysin suoriksi käsiksi.'],
      commonMistake: 'Heilunta ja puolittaiset toistot. Yksi puhdas voittaa kolme rumaa. Negatiivinen: hyppää ylös, laske 4 s. Kun täysiä tulee 5, negatiiviset pois.'
    }
  },
  {
    id: 'soutu', name: 'Soutu pöydän alta', nameEn: 'inverted row', category: 'pull', unit: 'reps', weight: false,
    variations: ['Soutu pystymmässä kulmassa', 'Soutu pöydän alta polvet koukussa', 'Soutu pöydän alta', 'Soutu jalat koholla', 'Soutu yhdellä kädellä'],
    defaultVariation: 'Soutu pöydän alta',
    formCard: {
      setup: 'Tartu tukevan pöydän reunaan, keho suorana, kantapäät maassa (koholla = raskaampi).',
      cues: ['Vedä rinta kohti reunaa lapaluita puristaen, kyynärpäät ~45° vartalosta.', 'Suora linja koko ajan — pakarat kireänä.', 'Laske hallitusti täysin suoriksi.'],
      commonMistake: 'Lantio notkolla, pää työntyy eteen. Jos linja pettää, laita kantapäät alemmas.'
    }
  },
  {
    id: 'ytw', name: 'Prone Y-T-W', nameEn: 'prone Y-T-W raise', category: 'pull', unit: 'reps', weight: false,
    variations: ['Prone Y-T-W', 'Prone Y-T-W pito 3 s'],
    defaultVariation: 'Prone Y-T-W',
    formCard: {
      setup: 'Mahallaan, otsa lattiassa, kädet ojennettuina.',
      cues: ['Nosta kädet Y-asentoon peukalot ylös, pidä 2 s, laske. Sitten T (sivuille), sitten W (kyynärpäät koukussa, lapaluut yhteen).', 'Liike tulee lapaluista, ei niskasta.', 'Pieni liike on oikein — kädet nousevat vain muutaman sentin.'],
      commonMistake: 'Nostaa päätä ja jännittää niskaa. Otsa pysyy lattiassa.'
    }
  },
  {
    id: 'reppusoutu', name: 'Reppusoutu', nameEn: 'backpack row', category: 'pull', unit: 'reps', weight: true,
    variations: ['Reppusoutu'],
    defaultVariation: 'Reppusoutu',
    formCard: {
      setup: 'Kumarru lantiosta selkä suorana, reppu kädessä, toinen käsi tukena.',
      cues: ['Vedä kyynärpää kohti kattoa ja lantiota, lapaluu puristuu.', 'Selkä ei pyöristy eikä kierry.', 'Laske täysin suoriksi.'],
      commonMistake: 'Selkä pyöristyy tai kiertyy vedon mukana.'
    }
  },
  // ---------- Työntö ----------
  {
    id: 'punnerrus', name: 'Punnerrus, jalat koholla', nameEn: 'decline push-up', category: 'push', unit: 'reps', weight: true,
    variations: ['Punnerrus polvilta', 'Punnerrus', 'Punnerrus, jalat koholla', 'Punnerrus, jalat koholla + reppu', 'Pseudo planche -punnerrus'],
    defaultVariation: 'Punnerrus, jalat koholla',
    formCard: {
      setup: 'Jalat tuolilla, kädet hartioita hieman leveämmällä.',
      cues: ['Pakarat kireänä, kylkiluut alas — sama kuin lankussa.', 'Kyynärpäät ~45° vartalosta, ei leveälle.', 'Rinta lähelle lattiaa, työnnä lattiaa itsestäsi pois.'],
      commonMistake: 'Lantio roikkuu, kyynärpäät sivuille. Lopeta kun linja pettää.'
    }
  },
  {
    id: 'pike', name: 'Pike-punnerrus', nameEn: 'pike push-up', category: 'push', unit: 'reps', weight: false,
    variations: ['Pike-punnerrus', 'Pike-punnerrus jalat koholla', 'Seinäkäsilläseisontapunnerrus'],
    defaultVariation: 'Pike-punnerrus',
    formCard: {
      setup: 'Peppu ylös kuin ylösalainen V, kädet ja jalat lattiassa.',
      cues: ['Laske päälaki kohti lattiaa, käsien eteen.', 'Paino käsillä, ei jaloilla.', 'Työnnä takaisin suoriksi.'],
      commonMistake: 'Paino siirtyy jaloille ja liikkeestä tulee punnerrus. Peppu pysyy ylhäällä.'
    }
  },
  {
    id: 'dippi', name: 'Dippi tuolien välissä', nameEn: 'bench dip', category: 'push', unit: 'reps', weight: true,
    variations: ['Dippi polvet koukussa', 'Dippi tuolien välissä', 'Dippi jalat koholla', 'Dippi + reppu'],
    defaultVariation: 'Dippi tuolien välissä',
    formCard: {
      setup: 'Kädet tuolin reunoilla, jalat edessä.',
      cues: ['Laske kunnes olkavarret vaakatasossa — ei syvemmälle.', 'Hartiat alhaalla, pois korvista.', 'Kyynärpäät taakse, ei sivuille.'],
      commonMistake: 'Liian syvälle → olkapää. Lopeta jos olkapää nipistää.'
    }
  },
  // ---------- Jalat ja takaketju ----------
  {
    id: 'splitsquat', name: 'Split squat, reppu edessä', nameEn: 'split squat, front-loaded', category: 'legs', unit: 'reps', weight: true,
    variations: ['Split squat', 'Split squat, reppu edessä', 'Bulgarialainen split squat', 'Bulgarialainen split squat + reppu'],
    defaultVariation: 'Split squat, reppu edessä',
    formCard: {
      setup: 'Pitkä askel eteen, reppu halattuna rintaa vasten.',
      cues: ['Takapolvi suoraan alas kohti lattiaa, ei eteen.', 'Etupolvi jalkaterän suunnassa, ei sisään.', 'Ylävartalo pystyssä — reppu edessä pakottaa siihen.'],
      commonMistake: 'Etupolvi kääntyy sisään, ylävartalo kaatuu eteen.'
    }
  },
  {
    id: 'nordic', name: 'Nordic-lasku', nameEn: 'Nordic hamstring curl', category: 'legs', unit: 'reps', weight: false,
    variations: ['Nordic-lasku avustettu (kädet)', 'Nordic-lasku', 'Nordic-lasku + nousu'],
    defaultVariation: 'Nordic-lasku',
    formCard: {
      setup: 'Polvillaan, nilkat ankkuroituna (sohvan alle / kaveri).',
      cues: ['Laske ylävartaloa eteen suorana linjana polvesta hartiaan — lantio ei taitu.', 'Jarruta takareisillä niin pitkään kuin pystyt.', 'Ota kädet vastaan lattiasta, työnnä takaisin.'],
      commonMistake: 'Taittuu lantiosta (peppu taakse) — silloin takareisi ei tee työtä. Lantio suoraksi.'
    }
  },
  {
    id: 'hipthrust', name: 'Yhden jalan lantionnosto', nameEn: 'single-leg hip thrust', category: 'legs', unit: 'reps', weight: true,
    variations: ['Lantionnosto kahdella jalalla', 'Yhden jalan lantionnosto', 'Yhden jalan lantionnosto, jalka penkillä', 'Yhden jalan lantionnosto + reppu'],
    defaultVariation: 'Yhden jalan lantionnosto, jalka penkillä',
    formCard: {
      setup: 'Selinmakuu, toinen jalka penkillä/tuolilla, toinen ilmassa.',
      cues: ['Nosta lantio puristamalla pakaraa.', 'Ei notkoa ylhäällä.', 'Laske hallitusti.'],
      commonMistake: 'Tuntuu selässä = liian korkealle. Nosta vähemmän.'
    }
  },
  {
    id: 'pohje', name: 'Yhden jalan pohjenousu', nameEn: 'single-leg calf raise', category: 'legs', unit: 'reps', weight: true,
    variations: ['Pohjenousu kahdella jalalla', 'Yhden jalan pohjenousu', 'Yhden jalan pohjenousu + reppu'],
    defaultVariation: 'Yhden jalan pohjenousu',
    formCard: {
      setup: 'Päkiä portaan reunalla, kantapää vapaana.',
      cues: ['Laske kantapää alas venytykseen asti.', 'Nouse varpaille ylös asti.', 'Hidas, 2 s ylös, 2 s alas.'],
      commonMistake: 'Lyhyt nopea pomppu.'
    }
  },
  // ---------- Keskivartalo ----------
  {
    id: 'hollow', name: 'Hollow hold', nameEn: 'hollow body hold', category: 'core', unit: 'seconds', weight: false,
    variations: ['Tuck hollow (polvet rinnassa)', 'Hollow polvet koukussa', 'Hollow hold', 'Hollow rock'],
    defaultVariation: 'Hollow hold',
    formCard: {
      setup: 'Selinmakuu, kädet korvien vierellä.',
      cues: ['Alaselkä painettuna lattiaan — ensin se, sitten vasta nosto.', 'Nosta hartiat ja jalat irti, keho loivaan banaaniin.', 'Jos alaselkä irtoaa → nosta jalkoja korkeammalle tai koukista polvet.'],
      commonMistake: 'Alaselkä kaarella. Lopeta heti kun se irtoaa.'
    }
  },
  {
    id: 'birddog', name: 'Bird dog', nameEn: 'bird dog', category: 'core', unit: 'reps', weight: false,
    variations: ['Bird dog', 'Bird dog pito 5 s', 'Bird dog kyynärpää–polvi'],
    defaultVariation: 'Bird dog',
    formCard: {
      setup: 'Nelinkontin, selkä neutraalina.',
      cues: ['Ojenna vastakkainen käsi ja jalka vaakatasoon, ei ylemmäs.', 'Pidä 2 s, selkä ja lantio eivät liiku.', 'Palaa hallitusti.'],
      commonMistake: 'Lantio kiertyy, notko. Ojenna vähemmän.'
    }
  }
];

export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

// Treenit A/B/C (pe/la/su). sets = oletussettimäärä.
export const TEMPLATES = {
  A: {
    name: 'Treeni A', day: 'Perjantai',
    items: [
      { exerciseId: 'leuanveto', sets: 4 },
      { exerciseId: 'punnerrus', sets: 4 },
      { exerciseId: 'splitsquat', sets: 3 },
      { exerciseId: 'hollow', sets: 3 },
      { exerciseId: 'ytw', sets: 2 }
    ]
  },
  B: {
    name: 'Treeni B', day: 'Lauantai',
    items: [
      { exerciseId: 'soutu', sets: 4 },
      { exerciseId: 'pike', sets: 3 },
      { exerciseId: 'nordic', sets: 3 },
      { exerciseId: 'hipthrust', sets: 3 },
      { exerciseId: 'birddog', sets: 3 }
    ]
  },
  C: {
    name: 'Treeni C', day: 'Sunnuntai',
    items: [
      { exerciseId: 'leuanveto', sets: 3 },
      { exerciseId: 'dippi', sets: 3 },
      { exerciseId: 'splitsquat', sets: 3 },
      { exerciseId: 'pohje', sets: 3 },
      { exerciseId: 'hollow', sets: 3 }
    ]
  }
};

// Grease-the-groove -tehtävät ma–to (työmaa).
export const GTG = [
  { id: 'gtg-punnerrus', name: 'Punnerrukset', target: 5, hint: 'Napauta = +1 setti. Tavoite 5 settiä päivän aikana, ei uupumukseen.' },
  { id: 'gtg-reppusoutu', name: 'Reppusoutu', target: 3, hint: 'Reppu kädessä, setti per puoli. Tavoite 3.', exerciseId: 'reppusoutu' }
];

// Selkärutiini — 6 liikettä, joka päivä.
export const ROUTINE = [
  { id: 'lonkka', name: 'Lonkankoukistajan venytys', nameEn: 'kneeling hip flexor stretch', dose: '2 × 30 s / puoli',
    formCard: { setup: 'Toinen polvi maassa, toinen jalka edessä 90°.',
      cues: ['Jännitä takimmaisen jalan pakara ennen kuin siirrät painoa eteen.', 'Käännä lantiota kevyesti taakse (häntäluu alas) — silloin venytys osuu lonkkaan.', 'Siirrä painoa eteen vain kunnes tuntuu lonkan etuosassa.'],
      commonMistake: 'Selkä notkolle ja "venytys" tulee selästä. Jos tuntuu selässä, lantio on väärässä asennossa.' } },
  { id: 'deadbug', name: 'Dead bug', nameEn: 'dead bug', dose: '2 × 8 / puoli',
    formCard: { setup: 'Selinmakuu, kädet kohti kattoa, polvet 90°, sääret vaakatasossa.',
      cues: ['Alaselkä painettuna lattiaan koko ajan — se on koko liikkeen pointti.', 'Ojenna vastakkainen käsi ja jalka hitaasti, uloshengitys ojennuksessa.', 'Palaa hallitusti, älä pudota.'],
      commonMistake: 'Alaselkä irtoaa lattiasta → liike on liian pitkä, lyhennä ojennusta.' } },
  { id: 'lankku', name: 'Lankku', nameEn: 'plank', dose: '2 × 30–45 s',
    formCard: { setup: 'Kyynärnoja, jalat yhdessä, kyynärpäät olkapäiden alla.',
      cues: ['Pakarat kireänä.', 'Kylkiluut alas — napa kohti selkärankaa, häntäluu alas. Ei notkoa.', 'Suora linja kantapää–lantio–hartia.'],
      commonMistake: 'Lantio roikkuu tai peppu ylös. Lopeta kun notko alkaa antaa periksi, älä roiku.' } },
  { id: 'kylkilankku', name: 'Kylkilankku', nameEn: 'side plank', dose: '2 × 20–30 s / puoli',
    formCard: { setup: 'Kyynärpää olkapään alla, jalat päällekkäin.',
      cues: ['Lantio ylös suoraan linjaan.', 'Ylin käsi lantiolla tai kohti kattoa.', 'Katse eteen, ei alas.'],
      commonMistake: 'Lantio vajoaa. Lopeta kun se alkaa laskea.' } },
  { id: 'lantionnosto', name: 'Lantionnosto', nameEn: 'glute bridge', dose: '2 × 12',
    formCard: { setup: 'Selinmakuu, polvet koukussa, kantapäät lähellä peppua.',
      cues: ['Nosta lantio puristamalla pakarat, ei työntämällä selkää.', 'Ylhäällä suora linja polvi–lantio–hartia, ei yli.', 'Pidä ylhäällä 1 s, laske hallitusti.'],
      commonMistake: 'Yliojennus notkolla — silloin tuntuu selässä eikä pakarassa. Nosta vähemmän.' } },
  { id: 'kissalehma', name: 'Kissa-lehmä + rintarangan kierto', nameEn: 'cat-cow, thoracic rotation', dose: '10× + 8 / puoli',
    formCard: { setup: 'Nelinkontin.',
      cues: ['Pyöristä ja notkista koko selkä rauhassa hengityksen tahdissa, 10×.', 'Kierto: käsi niskaan, kyynärpää kohti kattoa, katse seuraa, 8/puoli.', 'Liike keskiselästä, ei niskasta.'],
      commonMistake: 'Liike tulee niskasta eikä keskiselästä.' } }
];

// Ateriapresetit.
export const DINNER = { proteinKcalPerG: 1.1, proteinPPerG: 0.23, carbKcalPerG: 3.55, baseKcal: 370, defaultProteinG: 200, defaultCarbG: 100 };

export const PRESETS = [
  { id: 'aamupala-a', name: 'Aamupala A', desc: 'kaura 90 g + skyr 250 g + marjat + banaani', defaultKcal: 650, defaultProteinG: 34 },
  { id: 'aamupala-b', name: 'Aamupala B', desc: '3 munaa + leipä + juusto + kinkku + maito', defaultKcal: 745, defaultProteinG: 42 },
  { id: 'paivallinen', name: 'Päivällinen', desc: 'proteiini g + hiilari (kuiva) g + vakio-osa 370 kcal', dinner: true },
  { id: 'iltapala', name: 'Iltapala', desc: 'raejuusto/skyr 250 g + leipä 3 + kinkku 60 g + hedelmä', defaultKcal: 800, defaultProteinG: 58 }
];

export const DEFAULT_SETTINGS = { kcalTarget: 2500, proteinTarget: 170, programVersion: PROGRAM_VERSION, lastPhotoDate: null, photoIntervalDays: 28 };
