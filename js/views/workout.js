// Treeni — kirjaus setti kerrallaan, "viimeksi"-luvut näkyvissä.
import { TEMPLATES, EXERCISE_BY_ID } from '../seed.js';
import { put, getAll } from '../db.js';
import { todayStr, templateForDate, sessionId, lastEntryFor, formatSets, targetFromLast, formatDateShort, totalReps } from '../logic.js';
import { h, append, clear, toast, formCardModal, numInput, confirmModal } from '../ui.js';
import { gtgPanel } from './gtg.js';

export async function render(root, { navigate, signal }) {
  const date = todayStr();
  const q = new URLSearchParams((location.hash.split('?')[1]) || '');
  const todays = templateForDate(date);
  const template = (q.get('t') && (TEMPLATES[q.get('t')] || q.get('t') === 'GtG')) ? q.get('t') : todays;

  const picker = h('select', { 'aria-label': 'Treeni', onchange: e => { location.hash = `#treeni?t=${e.target.value}`; } },
    ['A', 'B', 'C', 'GtG'].map(t => h('option', { value: t, selected: t === template }, t === 'GtG' ? 'GtG' : TEMPLATES[t].name, t === todays ? ' (tänään)' : ''))
  );
  root.append(h('div', { class: 'datenav' }, h('h1', {}, formatDateShort(date)), h('div', { style: { width: '180px' } }, picker)));

  if (template === 'GtG') {
    root.append(h('div', { class: 'card' }, h('h2', {}, 'GtG — sarjalaskurit'), await gtgPanel(date)));
    return;
  }

  const tpl = TEMPLATES[template];
  const sessions = await getAll('sessions');
  const id = sessionId(date, template);
  const session = sessions.find(s => s.id === id) || { id, date, template, entries: [], done: false };

  // Tallennus 250 ms viiveellä; flush kun appi menee taustalle, ettei viimeinen näppäily katoa.
  let saveTimer = null;
  const persist = async () => {
    saveTimer = null;
    session.updatedAt = new Date().toISOString();
    if (!session.startedAt) session.startedAt = session.updatedAt;
    await put('sessions', session);
  };
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); };
  const flush = () => { if (saveTimer) { clearTimeout(saveTimer); return persist().catch(err => console.error('save failed', err)); } return Promise.resolve(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); }, { signal });
  window.addEventListener('pagehide', flush, { signal });

  const card = h('div', { class: `card ${session.done ? 'done' : ''}` });
  if (session.done) card.append(h('p', { class: 'ok small' }, `✓ Kirjattu ${new Date(session.completedAt).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })} — voit vielä muokata.`));

  for (const item of tpl.items) {
    const ex = EXERCISE_BY_ID[item.exerciseId];
    const last = lastEntryFor(sessions, ex.id, date);
    let entry = session.entries.find(e => e.exerciseId === ex.id);
    if (!entry) {
      // Oletusarvot: viime kerran luvut (spec), muuten tyhjä.
      // prefilled=true kunnes käyttäjä koskee liikkeeseen; koskemattomat jätetään pois "Valmis"-vaiheessa (kysytään).
      entry = { exerciseId: ex.id, variation: (last && last.variation) || ex.defaultVariation, sets: [], prefilled: !!last };
      const n = Math.max(item.sets, last ? last.sets.length : 0);
      for (let i = 0; i < n; i++) {
        const ls = last && last.sets[i];
        entry.sets.push({ reps: ls ? ls.reps : null, weightKg: ls && ls.weightKg != null ? ls.weightKg : null });
      }
      session.entries.push(entry);
    }
    card.append(exerciseBlock(ex, entry, last, save));
  }

  const finish = h('button', { class: 'ok block mt', onclick: async () => {
    await flush();
    const untouched = session.entries.filter(e => e.prefilled);
    if (untouched.length) {
      const names = untouched.map(e => EXERCISE_BY_ID[e.exerciseId].name).join(', ');
      const keep = await confirmModal(`Et muokannut: ${names}. Tallennetaanko ne viime kerran luvuilla? "Jätä pois" kirjaa ne tekemättömiksi.`, { ok: 'Tallenna kaikki', cancel: 'Jätä pois' });
      if (keep === null) return; // suljettiin ilman valintaa → ei merkitä valmiiksi
      if (!keep) for (const e of untouched) e.sets = e.sets.map(s => ({ ...s, reps: null }));
      for (const e of untouched) delete e.prefilled;
    }
    session.done = true;
    session.completedAt = new Date().toISOString();
    session.updatedAt = session.completedAt;
    if (!session.startedAt) session.startedAt = session.completedAt;
    await put('sessions', session);
    toast('Treeni tallennettu ✓');
    navigate('tanaan');
  } }, session.done ? 'Tallenna muutokset' : 'Valmis ✓');
  card.append(finish);
  root.append(card);
}

function exerciseBlock(ex, entry, last, save) {
  const unitLbl = ex.unit === 'seconds' ? 'sekuntia' : 'toistot';
  const setsEl = h('div', { class: `sets ${ex.weight ? '' : 'nowt'}` });
  const block = h('div', { class: `ex ${entry.prefilled ? 'prefilled' : ''}` });
  const touch = () => { if (entry.prefilled) { delete entry.prefilled; block.classList.remove('prefilled'); } };

  const renderSets = () => {
    clear(setsEl);
    append(setsEl, [h('div'), h('div', { class: 'hdr' }, unitLbl), ex.weight ? h('div', { class: 'hdr' }, 'reppu kg') : null]);
    entry.sets.forEach((s, i) => {
      const ls = last && last.sets[i];
      setsEl.append(h('div', { class: 'lbl' }, `Setti ${i + 1}`));
      setsEl.append(numInput({ value: s.reps == null ? '' : s.reps, min: 0, step: 1,
        'aria-label': `${ex.name} setti ${i + 1} ${unitLbl}`,
        oninput: e => { if (e.target.validity.badInput) return; s.reps = e.target.value === '' ? null : Number(e.target.value); touch(); save(); },
        onchange: e => { if (e.target.validity.badInput) { e.target.value = s.reps == null ? '' : s.reps; toast('Virheellinen luku', 2000); } } }));
      if (ex.weight) setsEl.append(numInput({ value: s.weightKg == null ? '' : s.weightKg, placeholder: 'kg', min: 0, step: 0.5,
        'aria-label': `${ex.name} setti ${i + 1} paino kg`,
        oninput: e => { if (e.target.validity.badInput) return; s.weightKg = e.target.value === '' ? null : Number(e.target.value); touch(); save(); },
        onchange: e => { if (e.target.validity.badInput) { e.target.value = s.weightKg == null ? '' : s.weightKg; toast('Virheellinen luku', 2000); } } }));
    });
  };
  renderSets();

  const lastLine = last
    ? h('p', { class: 'last small' },
        h('span', { class: 'muted' }, `Viimeksi ${formatDateShort(last.date)}${last.variation !== entry.variation ? ` (${last.variation})` : ''}: `),
        formatSets(last.sets, ex.unit),
        h('span', { class: 'muted' }, ` · yht. ${totalReps(last.sets)}`),
        h('span', { class: 'accent' }, ` → tavoite ${targetFromLast(last)}`))
    : h('p', { class: 'last small muted' }, 'Ei aiempaa kirjausta.');

  return append(block, [
    h('button', { class: 'title', type: 'button', onclick: () => formCardModal(ex) }, ex.name),
    h('select', { 'aria-label': 'Variaatio', style: { marginTop: '6px' }, onchange: e => { entry.variation = e.target.value; touch(); save(); } },
      ex.variations.map(v => h('option', { value: v, selected: v === entry.variation }, v))),
    lastLine,
    setsEl,
    h('div', { class: 'row mt' },
      h('button', { class: 'small', type: 'button', onclick: () => {
        const prev = entry.sets[entry.sets.length - 1];
        entry.sets.push({ reps: null, weightKg: prev && prev.weightKg != null ? prev.weightKg : null });
        renderSets(); touch(); save();
      } }, '+ setti'),
      h('button', { class: 'small ghost', type: 'button', onclick: () => {
        if (entry.sets.length > 1) { entry.sets.pop(); renderSets(); touch(); save(); }
      } }, '− setti')
    )
  ]);
}
