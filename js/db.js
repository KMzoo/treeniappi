// IndexedDB-kerros. Pieni promise-kääre, ei kirjastoja.
import { DEFAULT_SETTINGS } from './seed.js';

const DB_NAME = 'treeniappi';
const DB_VERSION = 1;
export const BACKUP_FORMAT = 1;

// store → { keyPath, indexes: [[name, keyPath]] }
const STORES = {
  sessions: { keyPath: 'id', indexes: [['date', 'date']] },
  routineDays: { keyPath: 'date', indexes: [] },
  meals: { keyPath: 'id', indexes: [['date', 'date']] },
  metrics: { keyPath: 'key', indexes: [['type', 'type']] }, // key = `${type}|${date}`
  settings: { keyPath: 'key', indexes: [] },
  recent: { keyPath: 'name', indexes: [] } // viimeisimmät vapaat ruokakirjaukset
};

let dbPromise = null;

export function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, def] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: def.keyPath });
          for (const [idx, kp] of def.indexes) store.createIndex(idx, kp);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbPromise = null; reject(req.error); };
    req.onblocked = () => { dbPromise = null; reject(new Error('Tietokanta on auki toisessa välilehdessä')); };
  });
  return dbPromise;
}

/**
 * Suorita fn transaktiossa. Jos fn heittää, transaktio perutaan (abort) — muuten jo jonossa
 * olevat kirjoitukset (esim. clear()) committoituisivat vaikka loput epäonnistuivat.
 * fn:n paluuarvo (tai promise) on lopputulos; se ratkeaa ennen oncomplete-tapahtumaa.
 */
function tx(storeNames, mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeNames, mode);
    let result, failed = null;
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(failed || t.error);
    t.onabort = () => reject(failed || t.error || new Error('Transaktio peruttiin'));
    const stores = Object.fromEntries([].concat(storeNames).map(n => [n, t.objectStore(n)]));
    try {
      const r = fn(stores);
      if (r && typeof r.then === 'function') r.then(v => { result = v; }).catch(e => { failed = e; try { t.abort(); } catch {} });
      else result = r;
    } catch (e) {
      failed = e;
      try { t.abort(); } catch {}
    }
  }));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const get = (store, key) => tx(store, 'readonly', s => reqToPromise(s[store].get(key)));
export const put = (store, obj) => tx(store, 'readwrite', s => reqToPromise(s[store].put(obj)));
export const del = (store, key) => tx(store, 'readwrite', s => reqToPromise(s[store].delete(key)));
export const getAll = store => tx(store, 'readonly', s => reqToPromise(s[store].getAll()));
export const getAllBy = (store, index, value) => tx(store, 'readonly', s => reqToPromise(s[store].index(index).getAll(value)));

export async function getSettings() {
  const rows = await getAll('settings');
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.key] = r.value;
  return s;
}

export async function setSetting(key, value) {
  await put('settings', { key, value });
}

export const metricKey = (type, date) => `${type}|${date}`;

export async function putMetric(type, date, value) {
  await put('metrics', { key: metricKey(type, date), type, date, value });
}

/** Koko tietokanta yhtenä JSON-oliona (yksi readonly-transaktio → yhtenäinen tilannekuva). */
export async function exportAll() {
  const names = Object.keys(STORES);
  const rows = await tx(names, 'readonly', async stores => {
    const out = {};
    for (const n of names) out[n] = await reqToPromise(stores[n].getAll());
    return out;
  });
  return { app: 'treeniappi', format: BACKUP_FORMAT, dbVersion: DB_VERSION, exportedAt: new Date().toISOString(), ...rows };
}

/**
 * Tarkista varmuuskopio ENNEN kirjoittamista. Palauttaa rivimäärän tai heittää selkokielisen virheen.
 * Puhdas funktio — ei IndexedDB:tä — jotta se on testattavissa Nodessa.
 */
export function validateBackup(data) {
  if (!data || typeof data !== 'object' || data.app !== 'treeniappi') throw new Error('Ei Treeniappi-varmuuskopio');
  let count = 0;
  for (const [name, def] of Object.entries(STORES)) {
    const rows = data[name];
    if (rows == null) continue;
    if (!Array.isArray(rows)) throw new Error(`Virheellinen varmuuskopio: ${name} ei ole lista`);
    rows.forEach((row, i) => {
      if (!row || typeof row !== 'object' || row[def.keyPath] == null) {
        throw new Error(`Virheellinen varmuuskopio: ${name}[${i}] puuttuu avain "${def.keyPath}"`);
      }
    });
    count += rows.length;
  }
  return count;
}

/** Tuo JSON. replace=true tyhjentää ensin; muuten yhdistää (samat avaimet korvataan). Kaikki tai ei mitään. */
export async function importAll(data, { replace = false } = {}) {
  const count = validateBackup(data);
  const names = Object.keys(STORES);
  await tx(names, 'readwrite', stores => {
    for (const name of names) {
      if (replace) stores[name].clear();
      for (const row of data[name] || []) stores[name].put(row);
    }
  });
  return count;
}

export async function clearAll() {
  const names = Object.keys(STORES);
  await tx(names, 'readwrite', stores => { for (const n of names) stores[n].clear(); });
}

/** Pyydä selainta olemaan tyhjentämättä tätä kantaa tilanpuutteessa. Best effort. */
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch {}
  return false;
}
