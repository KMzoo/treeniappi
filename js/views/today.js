// Tänään — etusivu.
import { TEMPLATES, EXERCISE_BY_ID, ROUTINE } from '../seed.js';
import { get, put, getAll, getAllBy, getSettings } from '../db.js';
import { todayStr, templateForDate, sessionId, routineStreak, daySums, weekdayName, formatDateFi, lastEntryFor, formatSets, targetFromLast } from '../logic.js';
import { h, clear, formCardModal, bar, toast } from '../ui.js';
import { gtgPanel } from './gtg.js';

export async function render(root) {
  const today = todayStr();
  const template = templateForDate(today);
  const [settings, sessions, routineDays, meals] = await Promise.all([
    getSettings(), getAll('sessions'), getAll('routineDays'), getAllBy('meals', 'date', today)
  ]);

  root.append(h('h1', {}, `${weekdayName(today)} ${formatDateFi(today)}`));

  // --- Treeni / GtG ---
  if (template === 'GtG') {
    root.append(h('div', { class: 'card' },
      h('h2', {}, 'GtG — työmaapäivä'),
      await gtgPanel(today)
    ));
  } else {
    const tpl = TEMPLATES[template];
    const session = sessions.find(s => s.id === sessionId(today, template));
    const done = session && session.done;
    root.append(h('div', { class: `card ${done ? 'done' : ''}` },
      h('div', { class: 'row between' },
        h('h2', {}, tpl.name),
        done ? h('span', { class: 'ok small' }, `✓ Kirjattu ${timeOf(session.completedAt)}`) : null
      ),
      h('div', {}, tpl.items.map(it => {
        const ex = EXERCISE_BY_ID[it.exerciseId];
        const last = lastEntryFor(sessions, ex.id, today);
        const todayEntry = done && (session.entries || []).find(e => e.exerciseId === ex.id);
        const todaySets = todayEntry ? todayEntry.sets.filter(s => s.reps != null) : [];
        return h('div', { class: 'row between', style: { padding: '5px 0' } },
          h('button', { class: 'link', onclick: () => formCardModal(ex) }, ex.name),
          h('span', { class: `small ${todaySets.length ? 'ok' : 'muted'}` },
            todaySets.length ? formatSets(todaySets, ex.unit)
              : last ? `${formatSets(last.sets, ex.unit)} → ${targetFromLast(last)}` : `${it.sets} settiä`)
        );
      })),
      h('a', { class: `btn block mt ${done ? '' : 'primary'}`, href: '#treeni' }, done ? 'Katso / muokkaa' : 'Kirjaa treeni →')
    ));
  }

  // --- Selkärutiini ---
  let day = routineDays.find(r => r.date === today) || { date: today, items: [], allDone: false };
  day.items = ROUTINE.map((_, i) => !!(day.items && day.items[i]));
  day.allDone = day.items.every(Boolean);
  const streakEl = h('span', { class: 'accent' });
  const list = h('div');
  const updateStreak = () => {
    const others = routineDays.filter(r => r.date !== today);
    const n = routineStreak([...others, day], today);
    streakEl.textContent = n > 0 ? `🔥 ${n} pv` : '';
  };
  const drawList = () => {
    clear(list);
    ROUTINE.forEach((r, i) => {
      const cb = h('input', { type: 'checkbox', checked: !!day.items[i], 'aria-label': r.name, onchange: async e => {
        day.items[i] = e.target.checked;
        const wasDone = day.allDone;
        day.allDone = day.items.every(Boolean);
        day.updatedAt = new Date().toISOString();
        await put('routineDays', day);
        drawList(); updateStreak();
        if (day.allDone && !wasDone) toast('Selkärutiini tehty ✓');
      } });
      list.append(h('label', { class: `check ${day.items[i] ? 'done' : ''}` },
        cb,
        h('span', { class: 'name' }, r.name, h('span', { class: 'muted small' }, ' · ', r.dose)),
        h('button', { class: 'icon ghost small', type: 'button', 'aria-label': 'Liikekortti', onclick: e => { e.preventDefault(); formCardModal(r); } }, 'ⓘ')
      ));
    });
  };
  drawList(); updateStreak();
  root.append(h('div', { class: 'card' },
    h('div', { class: 'row between' }, h('h2', {}, 'Selkärutiini'), streakEl),
    list
  ));

  // --- Ruoka ---
  const sums = daySums(meals);
  root.append(h('div', { class: 'card' },
    h('div', { class: 'row between' }, h('h2', {}, 'Ruoka'), h('a', { href: '#ruoka', class: 'accent small' }, 'Kirjaa →')),
    h('div', { class: 'stat' }, h('span', {}, h('b', {}, sums.kcal), h('span', { class: 'muted' }, ` / ${settings.kcalTarget} kcal`)),
      h('span', {}, h('b', {}, sums.proteinG), h('span', { class: 'muted' }, ` / ${settings.proteinTarget} g P`))),
    h('div', { class: 'grid2' }, bar(sums.kcal, settings.kcalTarget), bar(sums.proteinG, settings.proteinTarget))
  ));
}

function timeOf(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
