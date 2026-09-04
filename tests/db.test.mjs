import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBackup, BACKUP_FORMAT } from '../js/db.js';

const good = () => ({ app: 'treeniappi', format: BACKUP_FORMAT,
  sessions: [{ id: 'a', date: '2026-09-05' }], routineDays: [{ date: '2026-09-05' }], meals: [{ id: 'm1' }],
  metrics: [{ key: 'weight|2026-09-05', type: 'weight', date: '2026-09-05', value: 80 }], settings: [{ key: 'kcalTarget', value: 2500 }], recent: [] });

test('validateBackup accepts a well-formed backup and counts rows', () => {
  assert.equal(validateBackup(good()), 5);
});

test('validateBackup rejects foreign or malformed payloads BEFORE any write', () => {
  assert.throws(() => validateBackup(null), /Ei Treeniappi/);
  assert.throws(() => validateBackup({ foo: 1 }), /Ei Treeniappi/);
  assert.throws(() => validateBackup({ ...good(), meals: {} }), /meals ei ole lista/);
  assert.throws(() => validateBackup({ ...good(), sessions: [{ date: 'x' }] }), /sessions\[0\] puuttuu avain "id"/);
  assert.throws(() => validateBackup({ ...good(), metrics: [null] }), /metrics\[0\]/);
});

test('validateBackup tolerates missing stores (older backups)', () => {
  const b = good(); delete b.recent; delete b.settings;
  assert.equal(validateBackup(b), 4);
});
