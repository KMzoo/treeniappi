// IndexedDB-kerros. Pieni promise-kääre, ei kirjastoja.
import { DEFAULT_SETTINGS } from './seed.js';

const DB_NAME = 'treeniappi';
const DB_VERSION = 1;

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
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeNames, mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeNames, mode);
    let result;
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
    const stores = Object.fromEntries([].concat(storeNames).map(n => [n, t.objectStore(n)]));
    const r = fn(stores);
    if (r && typeof r.then === 'function') r.then(v => { result = v; }).catch(reject);
    else result = r;
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

/** Koko tietokanta yhtenä JSON-oliona. */
export async function exportAll() {
  const out = { app: 'treeniappi', version: DB_VERSION, exportedAt: new Date().toISOString() };
  for (const name of Object.keys(STORES)) out[name] = await getAll(name);
  return out;
}

/** Tuo JSON. replace=true tyhjentää ensin; muuten yhdistää (samat avaimet korvataan). */
export async function importAll(data, { replace = false } = {}) {
  if (!data || data.app !== 'treeniappi') throw new Error('Ei Treeniappi-varmuuskopio');
  const names = Object.keys(STORES);
  let count = 0;
  await tx(names, 'readwrite', stores => {
    for (const name of names) {
      if (replace) stores[name].clear();
      for (const row of data[name] || []) { stores[name].put(row); count++; }
    }
  });
  return count;
}

export async function clearAll() {
  const names = Object.keys(STORES);
  await tx(names, 'readwrite', stores => { for (const n of names) stores[n].clear(); });
}
