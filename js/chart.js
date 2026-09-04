// Pieni SVG-viivakaavio ilman kirjastoja.
import { parseDate, todayStr } from './logic.js';

const NS = 'http://www.w3.org/2000/svg';
const MONTHS = ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'];

function s(tag, attrs = {}, text) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text != null) el.textContent = text;
  return el;
}

/**
 * points: [{date, value}] (viiva), raw: [{date, value}] (himmeät pisteet, valinnainen).
 * Palauttaa <svg>.
 */
export function lineChart(points, { raw = [], unit = '', width = 600, height = 220 } = {}) {
  const pad = { l: 40, r: 12, t: 12, b: 26 };
  const svg = s('svg', { class: 'chart', viewBox: `0 0 ${width} ${height}`, role: 'img' });
  const all = [...points, ...raw];
  if (!all.length) return svg;

  const ts = d => parseDate(d).getTime();
  let tMin = Math.min(...all.map(p => ts(p.date)));
  let tMax = Math.max(...all.map(p => ts(p.date)), ts(todayStr()));
  const minSpan = 8 * 7 * 86400000; // vähintään 8 viikkoa
  if (tMax - tMin < minSpan) tMin = tMax - minSpan;

  const vals = all.map(p => p.value);
  let vMin = Math.min(...vals), vMax = Math.max(...vals);
  if (vMax - vMin < 1) { vMin -= 1; vMax += 1; }
  const vPad = (vMax - vMin) * 0.15;
  vMin -= vPad; vMax += vPad;

  const x = t => pad.l + ((t - tMin) / (tMax - tMin)) * (width - pad.l - pad.r);
  const y = v => pad.t + (1 - (v - vMin) / (vMax - vMin)) * (height - pad.t - pad.b);

  // Y-ruudukko
  const step = niceStep((vMax - vMin) / 4);
  for (let v = Math.ceil(vMin / step) * step; v <= vMax; v += step) {
    svg.append(s('line', { class: 'grid', x1: pad.l, x2: width - pad.r, y1: y(v), y2: y(v) }));
    svg.append(s('text', { x: pad.l - 6, y: y(v) + 4, 'text-anchor': 'end' }, fmt(v)));
  }

  // X-akseli: kuukausien alut
  const d0 = new Date(tMin); d0.setDate(1); d0.setMonth(d0.getMonth() + 1); d0.setHours(0, 0, 0, 0);
  for (let d = d0; d.getTime() <= tMax; d.setMonth(d.getMonth() + 1)) {
    const xx = x(d.getTime());
    svg.append(s('line', { class: 'grid', x1: xx, x2: xx, y1: pad.t, y2: height - pad.b }));
    svg.append(s('text', { x: xx, y: height - 8, 'text-anchor': 'middle' }, MONTHS[d.getMonth()]));
  }

  for (const p of raw) svg.append(s('circle', { class: 'raw', cx: x(ts(p.date)), cy: y(p.value), r: 2.5 }));

  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (sorted.length) {
    const dAttr = sorted.map((p, i) => `${i ? 'L' : 'M'}${x(ts(p.date)).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
    svg.append(s('path', { class: 'line', d: dAttr }));
    for (const p of sorted) svg.append(s('circle', { class: 'dot', cx: x(ts(p.date)), cy: y(p.value), r: 3.5 }));
    const lastP = sorted[sorted.length - 1];
    svg.append(s('text', { x: Math.min(x(ts(lastP.date)) + 6, width - pad.r - 30), y: y(lastP.value) - 8, 'text-anchor': 'middle', style: 'fill: var(--text); font-weight: 600' }, `${fmt(lastP.value)}${unit}`));
  }
  return svg;
}

function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}

function fmt(v) {
  return String(Math.round(v * 10) / 10).replace('.', ',');
}
