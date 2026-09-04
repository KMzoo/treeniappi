// Puhdasta logiikkaa — ei DOM:ia, ei IndexedDB:tä. Testattavissa Nodessa.
import { DINNER } from './seed.js';

const pad = n => String(n).padStart(2, '0');

/** Paikallinen päivämäärä muodossa YYYY-MM-DD. */
export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** YYYY-MM-DD → Date (paikallinen keskiyö). */
export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

const WEEKDAYS = ['Sunnuntai', 'Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai', 'Lauantai'];
const WEEKDAYS_SHORT = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'];

export function weekdayName(s) { return WEEKDAYS[parseDate(s).getDay()]; }
export function weekdayShort(s) { return WEEKDAYS_SHORT[parseDate(s).getDay()]; }

/** "5.9.2026" */
export function formatDateFi(s) {
  const d = parseDate(s);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

/** "pe 5.9." */
export function formatDateShort(s) {
  const d = parseDate(s);
  return `${weekdayShort(s)} ${d.getDate()}.${d.getMonth() + 1}.`;
}

/** Pe → A, La → B, Su → C, muuten GtG. */
export function templateForDate(s) {
  const dow = parseDate(s).getDay();
  return { 5: 'A', 6: 'B', 0: 'C' }[dow] || 'GtG';
}

export function sessionId(date, template) { return `${date}-${template}`; }

/**
 * Viimeisin valmis kirjaus liikkeelle ennen annettua päivää (variaatiosta riippumatta).
 * Palauttaa { date, variation, sets } tai null.
 */
export function lastEntryFor(sessions, exerciseId, beforeDate) {
  const candidates = sessions
    .filter(s => s.done && s.date < beforeDate)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : ((b.completedAt || '') > (a.completedAt || '') ? 1 : (b.completedAt || '') < (a.completedAt || '') ? -1 : 0)));
  for (const s of candidates) {
    const e = (s.entries || []).find(x => x.exerciseId === exerciseId && (x.sets || []).some(st => st.reps != null));
    if (e) return { date: s.date, variation: e.variation, sets: e.sets.filter(st => st.reps != null) };
  }
  return null;
}

/** "4×10, 4×10, 9, 8" — paino×toistot jos paino kirjattu, muuten toistot. */
export function formatSets(sets, unit = 'reps') {
  if (!sets || !sets.length) return '–';
  const suffix = unit === 'seconds' ? ' s' : '';
  return sets.map(s => {
    const r = s.reps == null ? '?' : s.reps;
    return s.weightKg ? `${fmtNum(s.weightKg)}×${r}${suffix}` : `${r}${suffix}`;
  }).join(', ');
}

export function totalReps(sets) {
  return (sets || []).reduce((a, s) => a + (Number(s.reps) || 0), 0);
}

/** Tavoite: ylitä edellinen kokonaismäärä yhdellä. */
export function targetFromLast(last) {
  if (!last) return null;
  return totalReps(last.sets) + 1;
}

export function fmtNum(n) {
  if (n == null || isNaN(n)) return '';
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace('.', ',');
}

/** Putki: peräkkäiset allDone-päivät tähän päivään (tai eiliseen, jos tämä päivä on vielä kesken). */
export function routineStreak(routineDays, today) {
  const done = new Set(routineDays.filter(r => r.allDone).map(r => r.date));
  let day = done.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (done.has(day)) { n++; day = addDays(day, -1); }
  return n;
}

/** Päivällinen: proteiini g + hiilari (kuiva) g → kcal / proteiini. */
export function dinnerCalc(proteinG, carbG, D = DINNER) {
  const p = Number(proteinG) || 0, c = Number(carbG) || 0;
  return {
    kcal: Math.round(p * D.proteinKcalPerG + c * D.carbKcalPerG + D.baseKcal),
    proteinG: Math.round(p * D.proteinPPerG)
  };
}

export function daySums(meals) {
  return meals.reduce((acc, m) => ({ kcal: acc.kcal + (Number(m.kcal) || 0), proteinG: acc.proteinG + (Number(m.proteinG) || 0) }), { kcal: 0, proteinG: 0 });
}

/** Viikon alku (maanantai) YYYY-MM-DD. */
export function weekStart(s) {
  const d = parseDate(s);
  const dow = (d.getDay() + 6) % 7; // ma=0
  d.setDate(d.getDate() - dow);
  return todayStr(d);
}

/** [{date,value}] → [{week, value}] viikkokeskiarvoina, aikajärjestyksessä. */
export function weeklyAverages(points) {
  const groups = new Map();
  for (const p of points) {
    const w = weekStart(p.date);
    if (!groups.has(w)) groups.set(w, []);
    groups.get(w).push(Number(p.value));
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, vals]) => ({ date: week, value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10, n: vals.length }));
}

/** Kuvapäivä: { next, daysLeft } tai null jos ei koskaan kuvattu. */
export function photoStatus(lastPhotoDate, today, intervalDays = 28) {
  if (!lastPhotoDate) return null;
  const next = addDays(lastPhotoDate, intervalDays);
  return { next, daysLeft: daysBetween(today, next) };
}

/** Mittarit CSV-muotoon (date,type,value). */
export function metricsToCsv(metrics) {
  const rows = [...metrics].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.type < b.type ? -1 : 1));
  return ['date,type,value', ...rows.map(m => `${m.date},${m.type},${m.value}`)].join('\n');
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
