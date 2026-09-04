// Käynnistys + hash-reititys.
import { clear, h } from './ui.js';
import { todayStr } from './logic.js';
import * as today from './views/today.js';
import * as workout from './views/workout.js';
import * as food from './views/food.js';
import * as metrics from './views/metrics.js';

const VIEWS = { tanaan: today, treeni: workout, ruoka: food, mittarit: metrics };
const root = document.getElementById('view');
let renderedDate = todayStr();
let rendering = null;

export function navigate(name) { location.hash = '#' + name; }

async function route() {
  const name = (location.hash || '#tanaan').slice(1).split('?')[0];
  const view = VIEWS[name] || today;
  for (const a of document.querySelectorAll('#tabs a')) a.classList.toggle('active', a.dataset.view === (VIEWS[name] ? name : 'tanaan'));
  clear(root);
  renderedDate = todayStr();
  const run = view.render(root, { navigate }).catch(err => {
    console.error(err);
    clear(root).append(h('div', { class: 'card' }, h('h2', { class: 'bad' }, 'Virhe'), h('p', {}, String(err && err.message || err))));
  });
  rendering = run;
  await run;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
// Jos appi on ollut auki yön yli, päivitä näkymä kun päivä on vaihtunut.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayStr() !== renderedDate) route();
});
route();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW register failed', err));
  });
}
