import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  todayStr, parseDate, addDays, daysBetween, templateForDate, lastEntryFor, formatSets,
  targetFromLast, routineStreak, dinnerCalc, daySums, weekStart, weeklyAverages, photoStatus,
  metricsToCsv, formatDateFi, weekdayName
} from '../js/logic.js';
import { EXERCISES, TEMPLATES, ROUTINE, PRESETS, EXERCISE_BY_ID, GTG } from '../js/seed.js';

test('todayStr / parseDate roundtrip in local time', () => {
  const d = new Date(2026, 8, 5); // 5.9.2026
  assert.equal(todayStr(d), '2026-09-05');
  assert.equal(parseDate('2026-09-05').getDate(), 5);
  assert.equal(addDays('2026-09-05', -5), '2026-08-31');
  assert.equal(daysBetween('2026-09-05', '2026-10-03'), 28);
  assert.equal(formatDateFi('2026-09-05'), '5.9.2026');
});

test('templateForDate: pe=A, la=B, su=C, ma-to=GtG', () => {
  assert.equal(weekdayName('2026-09-04'), 'Perjantai');
  assert.equal(templateForDate('2026-09-04'), 'A');
  assert.equal(templateForDate('2026-09-05'), 'B');
  assert.equal(templateForDate('2026-09-06'), 'C');
  for (const d of ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10']) assert.equal(templateForDate(d), 'GtG');
});

test('lastEntryFor picks the most recent DONE session before the date, any variation', () => {
  const sessions = [
    { id: '1', date: '2026-08-21', template: 'A', done: true, entries: [{ exerciseId: 'leuanveto', variation: 'Leuanveto', sets: [{ reps: 8 }, { reps: 7 }] }] },
    { id: '2', date: '2026-08-28', template: 'A', done: true, entries: [{ exerciseId: 'leuanveto', variation: 'Leuanveto lisäpainolla (reppu)', sets: [{ reps: 10, weightKg: 4 }, { reps: 9, weightKg: 4 }] }] },
    { id: '3', date: '2026-09-04', template: 'A', done: false, entries: [{ exerciseId: 'leuanveto', variation: 'Leuanveto', sets: [{ reps: 12 }] }] },
    { id: '4', date: '2026-09-11', template: 'A', done: true, entries: [{ exerciseId: 'leuanveto', variation: 'Leuanveto', sets: [{ reps: 99 }] }] }
  ];
  const last = lastEntryFor(sessions, 'leuanveto', '2026-09-04');
  assert.equal(last.date, '2026-08-28');
  assert.equal(last.variation, 'Leuanveto lisäpainolla (reppu)');
  assert.equal(formatSets(last.sets), '4×10, 4×9');
  assert.equal(targetFromLast(last), 20);
  assert.equal(lastEntryFor(sessions, 'dippi', '2026-09-04'), null);
  assert.equal(targetFromLast(null), null);
});

test('formatSets handles seconds and empty sets', () => {
  assert.equal(formatSets([{ reps: 30 }, { reps: 25 }], 'seconds'), '30 s, 25 s');
  assert.equal(formatSets([]), '–');
  assert.equal(formatSets([{ reps: 10, weightKg: 7.5 }]), '7,5×10');
});

test('routineStreak counts consecutive allDone days ending today or yesterday', () => {
  const days = [
    { date: '2026-09-01', allDone: true }, { date: '2026-09-02', allDone: true },
    { date: '2026-09-03', allDone: true }, { date: '2026-09-04', allDone: true }
  ];
  assert.equal(routineStreak(days, '2026-09-05'), 4); // tänään kesken → eiliseen asti
  assert.equal(routineStreak([...days, { date: '2026-09-05', allDone: true }], '2026-09-05'), 5);
  assert.equal(routineStreak(days, '2026-09-07'), 0);
  assert.equal(routineStreak([...days.slice(0, 2), { date: '2026-09-04', allDone: true }], '2026-09-05'), 1);
  assert.equal(routineStreak([{ date: '2026-09-04', allDone: false }], '2026-09-05'), 0);
});

test('dinnerCalc: chicken 1.1 kcal/g, 0.23 P/g; rice 3.55 kcal/g; +370 base', () => {
  assert.deepEqual(dinnerCalc(200, 100), { kcal: 945, proteinG: 46 });
  assert.deepEqual(dinnerCalc(0, 0), { kcal: 370, proteinG: 0 });
  assert.deepEqual(dinnerCalc('150', ''), { kcal: 535, proteinG: 35 });
});

test('daySums', () => {
  assert.deepEqual(daySums([{ kcal: 650, proteinG: 34 }, { kcal: 800, proteinG: 58 }, { kcal: '100', proteinG: null }]), { kcal: 1550, proteinG: 92 });
  assert.deepEqual(daySums([]), { kcal: 0, proteinG: 0 });
});

test('weekStart is Monday; weeklyAverages groups and orders', () => {
  assert.equal(weekStart('2026-09-05'), '2026-08-31'); // la → ma
  assert.equal(weekStart('2026-09-06'), '2026-08-31'); // su → ma
  assert.equal(weekStart('2026-09-07'), '2026-09-07'); // ma → ma
  const pts = [
    { date: '2026-09-07', value: 80 }, { date: '2026-09-01', value: 81 },
    { date: '2026-09-03', value: 82 }, { date: '2026-09-09', value: 79 }
  ];
  assert.deepEqual(weeklyAverages(pts), [
    { date: '2026-08-31', value: 81.5, n: 2 },
    { date: '2026-09-07', value: 79.5, n: 2 }
  ]);
});

test('photoStatus', () => {
  assert.equal(photoStatus(null, '2026-09-05'), null);
  assert.deepEqual(photoStatus('2026-08-10', '2026-09-05'), { next: '2026-09-07', daysLeft: 2 });
  assert.equal(photoStatus('2026-08-01', '2026-09-05').daysLeft, -7);
});

test('metricsToCsv sorted by date then type', () => {
  const csv = metricsToCsv([
    { date: '2026-09-05', type: 'weight', value: 80.4 },
    { date: '2026-09-04', type: 'waist', value: 90 },
    { date: '2026-09-04', type: 'back', value: 4 }
  ]);
  assert.equal(csv, 'date,type,value\n2026-09-04,back,4\n2026-09-04,waist,90\n2026-09-05,weight,80.4');
});

test('seed data integrity', () => {
  const ids = new Set(EXERCISES.map(e => e.id));
  assert.equal(ids.size, EXERCISES.length, 'unique exercise ids');
  for (const e of EXERCISES) {
    assert.ok(e.formCard.setup && e.formCard.cues.length === 3 && e.formCard.commonMistake, `form card complete: ${e.id}`);
    assert.ok(e.variations.includes(e.defaultVariation), `default variation listed: ${e.id}`);
    assert.ok(['reps', 'seconds'].includes(e.unit));
  }
  for (const [k, t] of Object.entries(TEMPLATES)) {
    for (const it of t.items) assert.ok(EXERCISE_BY_ID[it.exerciseId], `template ${k} references ${it.exerciseId}`);
  }
  for (const g of GTG) if (g.exerciseId) assert.ok(EXERCISE_BY_ID[g.exerciseId]);
  assert.equal(ROUTINE.length, 6);
  assert.equal(PRESETS.length, 4);
});

test('lastEntryFor: same-date sessions tie-break by completedAt (latest wins)', () => {
  const sessions = [
    { id: '2026-09-04-A', date: '2026-09-04', template: 'A', done: true, completedAt: '2026-09-04T10:00:00Z', entries: [{ exerciseId: 'leuanveto', variation: 'Leuanveto', sets: [{ reps: 5 }] }] },
    { id: '2026-09-04-C', date: '2026-09-04', template: 'C', done: true, completedAt: '2026-09-04T18:00:00Z', entries: [{ exerciseId: 'leuanveto', variation: 'Leuanveto', sets: [{ reps: 7 }] }] }
  ];
  assert.equal(lastEntryFor(sessions, 'leuanveto', '2026-09-11').sets[0].reps, 7);
});
