// Ruoka — presetit + vapaa kirjaus, päivän summa vs. tavoite.
import { PRESETS, DINNER } from '../seed.js';
import { put, del, getAll, getAllBy, getSettings, setSetting } from '../db.js';
import { todayStr, addDays, formatDateShort, dinnerCalc, daySums, uid } from '../logic.js';
import { h, clear, toast, bar, numInput, modal } from '../ui.js';

export async function render(root) {
  const q = new URLSearchParams((location.hash.split('?')[1]) || '');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get('d') || '') ? q.get('d') : todayStr();
  const settings = await getSettings();
  const isToday = date === todayStr();

  root.append(h('div', { class: 'datenav' },
    h('button', { class: 'icon', 'aria-label': 'Edellinen päivä', onclick: () => { location.hash = `#ruoka?d=${addDays(date, -1)}`; } }, '‹'),
    h('h1', {}, isToday ? 'Tänään' : formatDateShort(date)),
    h('button', { class: 'icon', 'aria-label': 'Seuraava päivä', disabled: isToday, onclick: () => { location.hash = `#ruoka?d=${addDays(date, 1)}`; } }, '›')
  ));

  const sumsCard = h('div', { class: 'card' });
  const listCard = h('div', { class: 'card' });

  async function addMeal(m) {
    const meal = { id: uid('m'), date, createdAt: new Date().toISOString(), ...m };
    await put('meals', meal);
    toast(`Lisätty: ${meal.name}`);
    await refresh();
  }

  async function refresh() {
    const meals = (await getAllBy('meals', 'date', date)).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    const sums = daySums(meals);
    clear(sumsCard).append(
      h('div', { class: 'stat' },
        h('span', {}, h('b', {}, sums.kcal), h('span', { class: 'muted' }, ` / ${settings.kcalTarget} kcal`)),
        h('span', { class: 'muted small' }, `${settings.kcalTarget - sums.kcal >= 0 ? 'jäljellä' : 'yli'} ${Math.abs(settings.kcalTarget - sums.kcal)}`)),
      bar(sums.kcal, settings.kcalTarget),
      h('div', { class: 'stat', style: { marginTop: '10px' } },
        h('span', {}, h('b', {}, sums.proteinG), h('span', { class: 'muted' }, ` / ${settings.proteinTarget} g proteiinia`)),
        h('span', { class: 'muted small' }, `${settings.proteinTarget - sums.proteinG >= 0 ? 'jäljellä' : 'yli'} ${Math.abs(settings.proteinTarget - sums.proteinG)} g`)),
      bar(sums.proteinG, settings.proteinTarget)
    );

    clear(listCard).append(h('h2', {}, 'Päivän ateriat'));
    if (!meals.length) listCard.append(h('p', { class: 'muted' }, 'Ei kirjauksia.'));
    for (const m of meals) {
      listCard.append(h('div', { class: 'meal' },
        h('button', { class: 'info link', onclick: () => editMeal(m) },
          h('div', { class: 'name' }, m.name),
          h('div', { class: 'nums' }, `${m.kcal} kcal · ${m.proteinG} g P`, m.params ? ` · ${m.params.proteinG} g / ${m.params.carbG} g` : '')),
        h('button', { class: 'icon ghost', 'aria-label': 'Poista', onclick: async () => { await del('meals', m.id); toast('Poistettu'); refresh(); } }, '✕')
      ));
    }
  }

  function editMeal(m) {
    let body;
    if (m.presetId === 'paivallinen') {
      body = dinnerForm(m.params || { proteinG: DINNER.defaultProteinG, carbG: DINNER.defaultCarbG }, async params => {
        const c = dinnerCalc(params.proteinG, params.carbG);
        await put('meals', { ...m, params, kcal: c.kcal, proteinG: c.proteinG });
        toast('Päivitetty'); refresh();
      }, 'Tallenna', false);
    } else {
      const name = h('input', { type: 'text', value: m.name });
      const kcal = numInput({ value: m.kcal, min: 0 });
      const prot = numInput({ value: m.proteinG, min: 0 });
      body = h('div', {},
        h('label', { class: 'field' }, h('span', {}, 'Nimi'), name),
        h('div', { class: 'grid2' },
          h('label', { class: 'field' }, h('span', {}, 'kcal'), kcal),
          h('label', { class: 'field' }, h('span', {}, 'Proteiini g'), prot)),
        h('button', { class: 'primary block', onclick: async () => {
          await put('meals', { ...m, name: name.value.trim() || m.name, kcal: Number(kcal.value) || 0, proteinG: Number(prot.value) || 0 });
          toast('Päivitetty'); refresh();
          if (body._modal) body._modal.close();
        } }, 'Tallenna')
      );
    }
    const mm = modal('Muokkaa', body);
    body._modal = mm;
    body.addEventListener('meal-done', () => mm.close());
  }

  /** Päivällisen lomake: proteiini g + hiilari g → live-laskenta. */
  function dinnerForm(init, onSubmit, label = 'Lisää', rememberDefaults = true) {
    const p = numInput({ value: init.proteinG, min: 0, step: 10 });
    const c = numInput({ value: init.carbG, min: 0, step: 10 });
    const out = h('p', { class: 'accent' });
    const upd = () => { const r = dinnerCalc(p.value, c.value); out.textContent = `≈ ${r.kcal} kcal · ${r.proteinG} g proteiinia`; };
    p.addEventListener('input', upd); c.addEventListener('input', upd); upd();
    const el = h('div', {},
      h('div', { class: 'grid2' },
        h('label', { class: 'field' }, h('span', {}, 'Proteiini (kana) g'), p),
        h('label', { class: 'field' }, h('span', {}, 'Hiilari kuiva g'), c)),
      out,
      h('p', { class: 'muted small' }, `Kana ${DINNER.proteinKcalPerG} kcal/g, ${DINNER.proteinPPerG} P/g · riisi/pasta ${DINNER.carbKcalPerG} kcal/g · vakio-osa ${DINNER.baseKcal} kcal`),
      h('button', { class: 'primary block', onclick: async () => {
        if (p.validity.badInput || c.validity.badInput) { toast('Virheellinen luku', 2500); return; }
        const params = { proteinG: Number(p.value) || 0, carbG: Number(c.value) || 0 };
        if (rememberDefaults) {
          await setSetting('dinnerProteinG', params.proteinG);
          await setSetting('dinnerCarbG', params.carbG);
          settings.dinnerProteinG = params.proteinG; settings.dinnerCarbG = params.carbG;
        }
        await onSubmit(params);
        el.dispatchEvent(new Event('meal-done', { bubbles: true }));
      } }, label)
    );
    return el;
  }

  // --- Presetit ---
  const presetBtns = PRESETS.map(pr => h('button', { onclick: async () => {
    if (pr.dinner) {
      const body = dinnerForm({ proteinG: settings.dinnerProteinG ?? DINNER.defaultProteinG, carbG: settings.dinnerCarbG ?? DINNER.defaultCarbG }, async params => {
        const r = dinnerCalc(params.proteinG, params.carbG);
        await addMeal({ presetId: pr.id, name: pr.name, kcal: r.kcal, proteinG: r.proteinG, params });
      });
      const mm = modal(pr.name, body);
      body.addEventListener('meal-done', () => mm.close());
    } else {
      await addMeal({ presetId: pr.id, name: pr.name, kcal: pr.defaultKcal, proteinG: pr.defaultProteinG });
    }
  } }, h('div', {}, h('div', {}, pr.name), h('div', { class: 'muted small' }, pr.dinner ? 'g + g' : `${pr.defaultKcal} kcal · ${pr.defaultProteinG} g P`))));

  root.append(sumsCard);
  root.append(h('div', { class: 'card' }, h('h2', {}, 'Vakioateriat'), h('div', { class: 'grid2' }, presetBtns)));

  // --- Vapaa kirjaus ---
  const fName = h('input', { type: 'text', placeholder: 'esim. Grandiosa', autocomplete: 'off' });
  const fKcal = numInput({ placeholder: 'kcal', min: 0 });
  const fProt = numInput({ placeholder: 'g', min: 0 });
  const recentEl = h('div', { class: 'chips' });

  async function drawRecent() {
    const recent = (await getAll('recent')).sort((a, b) => (b.usedAt || '').localeCompare(a.usedAt || '')).slice(0, 8);
    clear(recentEl);
    for (const r of recent) {
      recentEl.append(h('button', { class: 'chip', onclick: async () => {
        await put('recent', { ...r, usedAt: new Date().toISOString() });
        await addMeal({ name: r.name, kcal: r.kcal, proteinG: r.proteinG });
        drawRecent();
      } }, `${r.name} · ${r.kcal}`));
    }
  }
  drawRecent();

  const addFree = async () => {
    const name = fName.value.trim();
    if (!name) { fName.focus(); return; }
    if (fKcal.validity.badInput || fProt.validity.badInput) { toast('Virheellinen luku', 2500); return; }
    const m = { name, kcal: Number(fKcal.value) || 0, proteinG: Number(fProt.value) || 0 };
    await put('recent', { ...m, usedAt: new Date().toISOString() });
    await addMeal(m);
    fName.value = ''; fKcal.value = ''; fProt.value = '';
    drawRecent();
  };
  for (const inp of [fName, fKcal, fProt]) inp.addEventListener('keydown', e => { if (e.key === 'Enter') addFree(); });

  root.append(h('div', { class: 'card' },
    h('h2', {}, 'Vapaa kirjaus'),
    h('label', { class: 'field' }, h('span', {}, 'Nimi'), fName),
    h('div', { class: 'grid2' },
      h('label', { class: 'field' }, h('span', {}, 'kcal'), fKcal),
      h('label', { class: 'field' }, h('span', {}, 'Proteiini g'), fProt)),
    h('button', { class: 'primary block', onclick: addFree }, 'Lisää'),
    h('div', { class: 'mt' }, recentEl)
  ));

  root.append(listCard);
  await refresh();
}
