// Progresso do Tom (localStorage) e motor de repetição espaçada.
import { LETTERS, ORDER, SEED, CONFUSABLE, BY_LETTER } from './data.js';

const KEY = 'abc-do-tom:v1';
const today = () => new Date().toISOString().slice(0, 10);

function fresh() {
  const letters = {};
  for (const { L } of LETTERS) {
    const level = SEED[L] || 0;
    letters[L] = { level, xp: 0, miss: 0, seen: 0, hits: 0, last: 0, upDay: '', garage: level >= 3 };
  }
  return { letters, settings: { rounds: 10, newPerDay: 2 }, sessions: 0, day: today(), newToday: 0, tick: 0 };
}

export let state = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.letters) return s;
  } catch (e) { /* noop */ }
  return fresh();
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* noop */ }
}
export function reset() { state = fresh(); save(); }

export const L = (x) => state.letters[x];
export const inGarage = () => LETTERS.filter((x) => state.letters[x.L].garage).length;

// Pai ajusta o nível manualmente (tela de progresso).
export function setLevel(letter, level) {
  const s = L(letter);
  s.level = level; s.xp = 0; s.miss = 0;
  if (level >= 3) s.garage = true;
  save();
}

// ---------- Sessão ----------
// Começa uma sessão: decide se entra letra nova hoje.
export function startSession() {
  if (state.day !== today()) { state.day = today(); state.newToday = 0; }
  state.sessions++;
  let intro = null;
  const learning = ORDER.filter((x) => L(x).level === 1).length;
  if (learning < 3 && state.newToday < state.settings.newPerDay) {
    intro = ORDER.find((x) => L(x).level === 0) || null;
    if (intro) { L(intro).level = 1; state.newToday++; }
  }
  save();
  // Foco da sessão: a letra nova, ou a letra em aprendizado menos praticada.
  const focus = intro || ORDER.filter((x) => L(x).level === 1).sort((a, b) => L(a).hits - L(b).hits)[0] || null;
  return { intro, round: 0, total: state.settings.rounds, focus, lastTarget: null, leveled: [] };
}

const WEIGHT = [0, 6, 3.5, 1.4, 0.5];

function pickTarget(sess) {
  const active = ORDER.filter((x) => L(x).level >= 1);
  // A letra nova aparece em ~1 de cada 3 rodadas.
  if (sess.focus && sess.lastTarget !== sess.focus && sess.round % 3 === 0) return sess.focus;
  let best = null, bestScore = -1;
  for (const x of active) {
    if (x === sess.lastTarget) continue;
    const s = L(x);
    const stale = Math.min(state.tick - s.last, 30);
    const score = WEIGHT[s.level] * (1 + stale / 6) * (0.6 + Math.random() * 0.8);
    if (score > bestScore) { bestScore = score; best = x; }
  }
  return best || active[0];
}

const confusable = (a, b) => CONFUSABLE.some((p) => p === a + b || p === b + a);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Monta a próxima rodada: alvo, opções e tipo de pergunta.
export function nextRound(sess, mode = 'kid') {
  const target = pickTarget(sess);
  const s = L(target);
  sess.lastTarget = target;
  sess.round++;
  if (mode === 'dad') return { type: 'say', target };

  const n = s.level <= 1 ? 2 : s.level === 2 ? 3 : 4;
  // Distratores: de preferência letras já vistas; evita pares parecidos com letra frágil.
  let pool = ORDER.filter((x) => x !== target && !(s.level <= 2 && confusable(x, target)));
  const known = shuffle(pool.filter((x) => L(x).level >= 1));
  const rest = shuffle(pool.filter((x) => L(x).level === 0));
  const opts = shuffle([target, ...known.concat(rest).slice(0, n - 1)]);

  const canPic = s.level >= 2 && Math.random() < 0.45;
  const word = canPic ? shuffle([...BY_LETTER[target].words])[0] : null;
  return { type: canPic ? 'pic' : 'find', target, opts, word };
}

const THRESH = [0, 2, 3, 3, 99];

// Registra o resultado: acertou de primeira sobe XP; erros repetidos descem um nível.
export function record(sess, target, firstTry) {
  const s = L(target);
  state.tick++;
  s.seen++; s.last = state.tick;
  let event = null;
  if (firstTry) {
    s.hits++; s.miss = 0; s.xp++;
    const needsNewDay = s.level === 3 && s.upDay === today();
    if (s.level < 4 && s.xp >= THRESH[s.level] && !needsNewDay) {
      s.level++; s.xp = 0; s.upDay = today();
      event = 'up';
      if (s.level >= 3 && !s.garage) { s.garage = true; event = 'garage'; sess.leveled.push(target); }
    }
  } else {
    s.xp = 0; s.miss++;
    if (s.miss >= 2 && s.level >= 2) { s.level--; s.miss = 0; }
  }
  save();
  return event;
}

// ---------- Caça às letras ----------
// Letras especiais ficam fora: o som inicial engana (Hipopótamo soa I, Kart soa C...).
export const HUNT_SKIP = 'HKQWY';
export function pickHuntLetter() {
  const pool = ORDER.filter((x) => L(x).level >= 1 && !HUNT_SKIP.includes(x));
  if (!pool.length) return 'T';
  // Preferência pelas que estão sendo aprendidas; evita repetir a última caçada.
  const w = pool.map((x) => (x === state.lastHunt ? 0.2 : [0, 5, 4, 2, 1][L(x).level]));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  const pick = pool.find((x, i) => (r -= w[i]) <= 0) || pool[0];
  state.lastHunt = pick;
  state.hunts = (state.hunts || 0) + 1;
  save();
  return pick;
}
