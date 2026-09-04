// Mittarit — aamupaino, vyötärö, leuanvedot, selän tuntemus + kaaviot + varmuuskopio.
import { getAll, putMetric, del, metricKey, getSettings, setSetting, exportAll, importAll, clearAll } from '../db.js';
import { todayStr, weeklyAverages, photoStatus, formatDateShort, formatDateFi, fmtNum, metricsToCsv } from '../logic.js';
import { h, clear, toast, numInput, download, confirmModal } from '../ui.js';
import { lineChart } from '../chart.js';

const TYPES = [
  { type: 'weight', label: 'Aamupaino', unit: 'kg', step: 0.1 },
  { type: 'waist', label: 'Vyötärö', unit: 'cm', step: 0.5 },
  { type: 'pullups', label: 'Leuanvedot (max)', unit: '', step: 1 }
];

export async function render(root) {
  const today = todayStr();
  const settings = await getSettings();
  let metrics = await getAll('metrics');

  const byType = t => metrics.filter(m => m.type === t).sort((a, b) => (a.date < b.date ? -1 : 1));
  const todayVal = t => { const m = metrics.find(x => x.key === metricKey(t, today)); return m ? m.value : null; };
  const latest = t => { const arr = byType(t); return arr.length ? arr[arr.length - 1] : null; };

  const charts = h('div');
  async function reload() { metrics = await getAll('metrics'); drawCharts(); }

  /** raw: kentän arvo; badInput: selain hylkäsi syötteen (arvo '' vaikka kentässä on tekstiä). */
  async function saveMetric(type, raw, badInput = false) {
    if (badInput) { toast('Virheellinen luku — ei tallennettu', 2500); return false; }
    const had = todayVal(type) != null;
    if (raw === '' || raw == null) {
      if (!had) return false;
      await del('metrics', metricKey(type, today));
      toast('Tämän päivän arvo poistettu');
    } else {
      const v = Number(String(raw).replace(',', '.'));
      if (isNaN(v)) { toast('Virheellinen luku — ei tallennettu', 2500); return false; }
      await putMetric(type, today, v);
      toast('Tallennettu');
    }
    await reload();
    return true;
  }

  // --- Tänään ---
  const inputs = TYPES.map(t => {
    const last = latest(t.type);
    const inp = numInput({ value: todayVal(t.type) ?? '', step: t.step, min: 0, placeholder: last ? fmtNum(last.value) : '', 'aria-label': t.label,
      onchange: async e => {
        const ok = await saveMetric(t.type, e.target.value, e.target.validity.badInput);
        if (!ok) { const cur = todayVal(t.type); e.target.value = cur == null ? '' : cur; }
      } });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
    return h('label', { class: 'field' },
      h('span', {}, `${t.label}${t.unit ? ` (${t.unit})` : ''}`, last ? h('span', { class: 'muted' }, ` · viim. ${fmtNum(last.value)} ${formatDateShort(last.date)}`) : null),
      inp);
  });

  const backSegs = h('div', { class: 'segs' });
  const drawBack = () => {
    clear(backSegs);
    const cur = todayVal('back');
    for (let v = 1; v <= 5; v++) backSegs.append(h('button', { class: cur === v ? 'on' : '', onclick: async () => { await saveMetric('back', cur === v ? '' : v); drawBack(); } }, String(v)));
  };
  drawBack();
  const lastBack = latest('back');

  root.append(h('h1', {}, 'Mittarit'));
  root.append(h('div', { class: 'card' },
    h('h2', {}, `Tänään ${formatDateFi(today)}`),
    h('div', { class: 'grid2' }, inputs[0], inputs[1]),
    inputs[2],
    h('label', { class: 'field' }, h('span', {}, 'Selän tuntemus (1 = huono, 5 = hyvä)', lastBack ? h('span', { class: 'muted' }, ` · viim. ${lastBack.value} ${formatDateShort(lastBack.date)}`) : null)),
    backSegs
  ));

  // --- Kaaviot ---
  function drawCharts() {
    clear(charts);
    const w = byType('weight');
    const wk = weeklyAverages(w);
    charts.append(h('div', { class: 'card' },
      h('div', { class: 'row between' }, h('h2', {}, 'Paino, viikkokeskiarvo'), wk.length ? h('span', { class: 'muted small' }, `${fmtNum(wk[wk.length - 1].value)} kg (${wk[wk.length - 1].n} pv)`) : null),
      w.length ? lineChart(wk, { raw: w, unit: '' }) : h('p', { class: 'muted' }, 'Ei vielä dataa.')
    ));
    const wa = byType('waist');
    charts.append(h('div', { class: 'card' }, h('h2', {}, 'Vyötärö (cm)'), wa.length ? lineChart(wa) : h('p', { class: 'muted' }, 'Ei vielä dataa.')));
    const pu = byType('pullups');
    charts.append(h('div', { class: 'card' }, h('h2', {}, 'Leuanvedot (max)'), pu.length ? lineChart(pu) : h('p', { class: 'muted' }, 'Ei vielä dataa.')));

    const backs = byType('back').slice(-14);
    charts.append(h('div', { class: 'card' }, h('h2', {}, 'Selkä, viim. 14 kirjausta'),
      backs.length ? h('div', { class: 'chips' }, backs.map(b => h('span', { class: `chip ${b.value >= 4 ? 'ok' : b.value <= 2 ? 'bad' : ''}`, title: b.date }, `${formatDateShort(b.date)} ${b.value}`))) : h('p', { class: 'muted' }, 'Ei vielä dataa.')));
  }
  drawCharts();
  root.append(charts);

  // --- Kuvapäivä ---
  const photoEl = h('div');
  const drawPhoto = () => {
    const st = photoStatus(settings.lastPhotoDate, today, settings.photoIntervalDays);
    clear(photoEl);
    if (!st) photoEl.append(h('p', { class: 'muted' }, 'Ei vielä kuvattu. Kuvapäivä 4 viikon välein.'));
    else if (st.daysLeft <= 0) photoEl.append(h('p', { class: 'warn' }, `📸 Kuvapäivä ${st.daysLeft === 0 ? 'tänään' : `oli ${formatDateShort(st.next)} (${-st.daysLeft} pv sitten)`}.`));
    else photoEl.append(h('p', {}, `Seuraava kuvapäivä ${formatDateShort(st.next)} `, h('span', { class: 'muted' }, `(${st.daysLeft} pv) · edellinen ${formatDateShort(settings.lastPhotoDate)}`)));
    photoEl.append(h('button', { class: 'small', onclick: async () => { settings.lastPhotoDate = today; await setSetting('lastPhotoDate', today); toast('Kuvapäivä merkitty'); drawPhoto(); } }, 'Kuva otettu tänään'));
  };
  drawPhoto();
  root.append(h('div', { class: 'card' }, h('h2', {}, 'Kuvapäivä'), photoEl));

  // --- Asetukset & varmuuskopio ---
  const kcalT = numInput({ value: settings.kcalTarget, min: 0, step: 50, onchange: async e => { const v = Number(e.target.value); if (v > 0) { await setSetting('kcalTarget', v); toast('Tallennettu'); } } });
  const protT = numInput({ value: settings.proteinTarget, min: 0, step: 5, onchange: async e => { const v = Number(e.target.value); if (v > 0) { await setSetting('proteinTarget', v); toast('Tallennettu'); } } });
  const fileInp = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' }, onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const replace = await confirmModal('Korvataanko nykyinen data kokonaan varmuuskopiolla? "Yhdistä" lisää varmuuskopion rivit nykyiseen dataan.', { ok: 'Korvaa', cancel: 'Yhdistä', danger: true });
      if (replace === null) { toast('Tuonti peruttu'); e.target.value = ''; return; }
      const n = await importAll(data, { replace });
      toast(`Tuotu ${n} riviä`);
      location.reload();
    } catch (err) { toast('Tuonti epäonnistui: ' + err.message, 4000); }
    e.target.value = '';
  } });

  root.append(h('div', { class: 'card' },
    h('h2', {}, 'Tavoitteet'),
    h('div', { class: 'grid2' },
      h('label', { class: 'field' }, h('span', {}, 'kcal / pv'), kcalT),
      h('label', { class: 'field' }, h('span', {}, 'Proteiini g / pv'), protT))
  ));
  root.append(h('div', { class: 'card' },
    h('h2', {}, 'Varmuuskopio'),
    h('p', { class: 'muted small' }, 'Data on vain tässä laitteessa. Vie JSON säännöllisesti.'),
    h('div', { class: 'grid2' },
      h('button', { onclick: async () => { const d = await exportAll(); download(`treeniappi-${today}.json`, JSON.stringify(d, null, 1)); } }, 'Vie JSON'),
      h('button', { onclick: () => fileInp.click() }, 'Tuo JSON'),
      h('button', { onclick: () => download(`treeniappi-mittarit-${today}.csv`, metricsToCsv(metrics), 'text/csv') }, 'Vie mittarit CSV'),
      h('button', { class: 'danger', onclick: async () => {
        if (await confirmModal('Poistetaanko KAIKKI data tästä laitteesta? Vie JSON ensin.', { ok: 'Poista kaikki', danger: true })) { await clearAll(); location.reload(); }
      } }, 'Tyhjennä kaikki')),
    fileInp,
    h('p', { class: 'muted small mt' }, `Ohjelma v${settings.programVersion} · ${today}`)
  ));
}
