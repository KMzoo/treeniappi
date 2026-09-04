// DOM-apurit. Ei frameworkia.

const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'readOnly', 'textContent']);

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (PROPS.has(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

let toastTimer;
export function toast(msg, ms = 1800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

export function modal(title, body, { onClose } = {}) {
  const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
  const overlay = h('div', { class: 'overlay' }, box);
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  box.append(h('h2', {}, title, h('button', { class: 'icon ghost', 'aria-label': 'Sulje', onclick: close }, '✕')));
  append(box, [body]);
  document.body.append(overlay);
  return { close, box };
}

/** Oma vahvistus (ei window.confirm). */
export function confirmModal(message, { ok = 'Kyllä', cancel = 'Peruuta', danger = false } = {}) {
  return new Promise(resolve => {
    let decided = false;
    const m = modal('Varmista', h('div', {},
      h('p', {}, message),
      h('div', { class: 'grid2 mt' },
        h('button', { onclick: () => { decided = true; m.close(); resolve(false); } }, cancel),
        h('button', { class: danger ? 'danger' : 'primary', onclick: () => { decided = true; m.close(); resolve(true); } }, ok)
      )
    ), { onClose: () => { if (!decided) resolve(false); } });
  });
}

/** Liikekortti: asento, 3 vihjettä, yleisin virhe. */
export function formCardModal(item) {
  const fc = item.formCard || {};
  modal(item.name, h('div', { class: 'formcard' },
    item.nameEn ? h('p', { class: 'muted' }, 'Hakusana videolle: ', h('i', {}, item.nameEn)) : null,
    item.dose ? h('p', { class: 'muted' }, 'Annos: ', item.dose) : null,
    h('div', { class: 'lbl' }, 'Asento'),
    h('p', {}, fc.setup || '–'),
    h('div', { class: 'lbl' }, 'Vihjeet'),
    h('ol', {}, (fc.cues || []).map(c => h('li', {}, c))),
    h('div', { class: 'lbl' }, 'Yleisin virhe'),
    h('p', {}, fc.commonMistake || '–')
  ));
}

/** Palkki: arvo vs. tavoite. */
export function bar(value, target) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const cls = value > target * 1.05 ? 'over' : pct >= 95 ? 'full' : '';
  return h('div', { class: `bar ${cls}` }, h('i', { style: { width: pct + '%' } }));
}

export function numInput(attrs = {}) {
  return h('input', { type: 'number', inputmode: 'decimal', ...attrs });
}

export function debounce(fn, ms = 300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/** Lataa tiedosto selaimesta. */
export function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
