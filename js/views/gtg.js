// GtG-sarjalaskurit (ma–to). Jaettu Tänään- ja Treeni-näkymien kesken.
import { GTG, EXERCISE_BY_ID } from '../seed.js';
import { get, put } from '../db.js';
import { sessionId } from '../logic.js';
import { h, clear, formCardModal } from '../ui.js';

export async function gtgPanel(date, { onChange } = {}) {
  const id = sessionId(date, 'GtG');
  const session = (await get('sessions', id)) || { id, date, template: 'GtG', entries: [], done: false };

  const entryOf = gid => session.entries.find(e => e.exerciseId === gid);
  const countOf = gid => (entryOf(gid) ? entryOf(gid).sets.length : 0);

  async function setCount(gid, n) {
    n = Math.max(0, n);
    let e = entryOf(gid);
    if (!e) { e = { exerciseId: gid, variation: null, sets: [] }; session.entries.push(e); }
    e.sets = Array.from({ length: n }, () => ({ reps: null }));
    session.done = GTG.every(g => countOf(g.id) >= g.target);
    session.updatedAt = new Date().toISOString();
    if (session.done && !session.completedAt) session.completedAt = session.updatedAt;
    await put('sessions', session);
    draw();
    onChange && onChange(session);
  }

  const el = h('div');
  function draw() {
    clear(el);
    for (const g of GTG) {
      const n = countOf(g.id);
      const ex = g.exerciseId ? EXERCISE_BY_ID[g.exerciseId] : null;
      el.append(h('div', { class: 'counter' },
        h('div', { class: 'grow' },
          ex ? h('button', { class: 'title link', onclick: () => formCardModal(ex) }, g.name, ' ⓘ') : h('b', {}, g.name),
          h('div', { class: 'muted small' }, g.hint)
        ),
        h('button', { class: 'icon ghost', 'aria-label': 'Vähennä', onclick: () => setCount(g.id, n - 1), disabled: n === 0 }, '−'),
        h('div', { class: `n ${n >= g.target ? 'ok' : ''}` }, `${n}/${g.target}`),
        h('button', { class: `tap ${n >= g.target ? 'ok' : 'primary'}`, onclick: () => setCount(g.id, n + 1) }, '+1')
      ));
    }
  }
  draw();
  return el;
}
