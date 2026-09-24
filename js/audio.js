// Voz (gravações do papai com fallback para voz sintética) e efeitos sonoros sintetizados.
import { CLIP } from './data.js';

// ---------- IndexedDB: gravações ----------
const DB_NAME = 'abc-do-tom';
let dbP;
function db() {
  if (!dbP) {
    dbP = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('clips');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbP;
}
function tx(mode, fn) {
  return db().then((d) => new Promise((res, rej) => {
    const t = d.transaction('clips', mode);
    const req = fn(t.objectStore('clips'));
    t.oncomplete = () => res(req && req.result);
    t.onerror = () => rej(t.error);
  }));
}

const urls = new Map(); // id -> objectURL das gravações existentes

export async function loadRecordings() {
  try {
    const keys = await tx('readonly', (s) => s.getAllKeys());
    for (const k of keys) {
      const blob = await tx('readonly', (s) => s.get(k));
      if (blob) urls.set(k, URL.createObjectURL(blob));
    }
  } catch (e) { console.warn('gravações indisponíveis', e); }
}
export const hasRecording = (id) => urls.has(id);
export const recordingCount = () => urls.size;

// Vozes gravadas no Estúdio (Mac) e publicadas junto com o app: audio/<id>.m4a.
const bundled = new Map(); // id -> versão
export async function loadBundled() {
  try {
    const r = await fetch('audio/index.json', { cache: 'no-cache' });
    if (r.ok) for (const [id, v] of Object.entries(await r.json())) bundled.set(id, v);
  } catch (e) { /* sem vozes publicadas ainda */ }
}
export const hasBundled = (id) => bundled.has(id);
export const bundledCount = () => bundled.size;
export const setBundled = (id, v) => (v ? bundled.set(id, v) : bundled.delete(id));
export const hasVoice = (id) => urls.has(id) || bundled.has(id);

export async function saveRecording(id, blob) {
  await tx('readwrite', (s) => s.put(blob, id));
  if (urls.has(id)) URL.revokeObjectURL(urls.get(id));
  urls.set(id, URL.createObjectURL(blob));
}
export async function deleteRecording(id) {
  await tx('readwrite', (s) => s.delete(id));
  if (urls.has(id)) URL.revokeObjectURL(urls.get(id));
  urls.delete(id);
}

// ---------- Reprodução ----------
const player = new Audio();
player.preload = 'auto';
let token = 0; // cancela sequências antigas quando uma nova começa

let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices().filter((v) => /^pt[-_]BR/i.test(v.lang));
  voice = vs.find((v) => /luciana|felipe|premium|enhanced/i.test(v.name)) || vs[0] || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

function speak(text) {
  return new Promise((res) => {
    if (!('speechSynthesis' in window)) return res();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    if (voice) u.voice = voice;
    u.rate = 0.85;
    u.pitch = 1.15;
    let done = false;
    const end = () => { if (!done) { done = true; res(); } };
    u.onend = end;
    u.onerror = end;
    setTimeout(end, 1500 + text.length * 140); // Safari às vezes não dispara onend
    speechSynthesis.speak(u);
  });
}

function playUrl(url) {
  return new Promise((res) => {
    let done = false;
    const end = () => { if (!done) { done = true; player.onended = player.onerror = null; res(); } };
    player.onended = end;
    player.onerror = end;
    player.src = url;
    player.currentTime = 0;
    player.play().catch(end);
    setTimeout(end, 8000);
  });
}

function playOne(id) {
  if (urls.has(id)) return playUrl(urls.get(id));
  if (bundled.has(id)) return playUrl(`audio/${id}.m4a?v=${bundled.get(id)}`);
  const c = CLIP[id];
  return speak(c ? c.t : id);
}

// Toca uma sequência de clipes; uma nova chamada interrompe a anterior.
export async function say(...ids) {
  const my = ++token;
  stopVoice(false);
  for (const id of ids.flat()) {
    if (my !== token) return false;
    await playOne(id);
    if (my !== token) return false;
    await wait(120);
  }
  return true;
}
export function stopVoice(bump = true) {
  if (bump) token++;
  try { player.pause(); } catch (e) { /* noop */ }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Efeitos (Web Audio, sem arquivos) ----------
let ctx;
export const audioCtx = () => ctx;
export function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!ctx && AC) ctx = new AC();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  // iOS: toca um silêncio no elemento de áudio dentro do gesto para liberá-lo.
  if (!player.src) {
    player.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    player.play().catch(() => {});
  }
}

function tone(freq, t0, dur, type = 'sine', vol = 0.18, slideTo) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime + t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + t0);
  o.stop(ctx.currentTime + t0 + dur + 0.05);
}

export const sfx = {
  pop: () => tone(520, 0, 0.12, 'triangle', 0.2, 880),
  yay: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.16)),
  boop: () => tone(300, 0, 0.22, 'sine', 0.12, 220),
  vroom: () => {
    if (!ctx) return;
    tone(70, 0, 0.9, 'sawtooth', 0.08, 160);
    tone(72, 0.02, 0.9, 'square', 0.04, 150);
  },
  fanfare: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.15)),
};

// ---------- Gravação ----------
// Captura PCM pela Web Audio e gera WAV: funciona no Safari do iOS 16 sem depender do MediaRecorder.
export function micSupport() {
  const why = [];
  if (!window.isSecureContext) why.push('página sem HTTPS');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) why.push('navegador sem acesso ao microfone (getUserMedia)');
  if (!(window.AudioContext || window.webkitAudioContext)) why.push('sem Web Audio');
  return why;
}
export const canRecord = () => micSupport().length === 0;

// Microfone aberto uma vez só (a gravação em sequência não pede permissão a cada frase).
export function openMic() {
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } });
}
export function closeMic(stream) {
  if (stream) stream.getTracks().forEach((t) => t.stop());
}

export function micError(e) {
  const n = (e && e.name) || '';
  if (n === 'NotAllowedError') return 'O iPad negou o microfone. Veja em Ajustes → Safari → Microfone (deixe “Perguntar” ou “Permitir”) e em Ajustes → Tempo de Uso → Conteúdo e Privacidade → Microfone.';
  if (n === 'NotFoundError') return 'Nenhum microfone encontrado.';
  if (n === 'NotReadableError') return 'O microfone está ocupado por outro app. Feche outros apps e tente de novo.';
  return `${n || 'Erro'}: ${(e && e.message) || e}`;
}

// Grava do `stream`; `unlockAudio()` precisa ter sido chamado no toque.
export function record(stream, maxMs = 6000) {
  unlockAudio();
  const src = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  const bufs = [];
  proc.onaudioprocess = (e) => bufs.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  src.connect(proc);
  proc.connect(mute).connect(ctx.destination);
  let resolve, stopped = false;
  const finished = new Promise((r) => { resolve = r; });
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    proc.onaudioprocess = null;
    src.disconnect(); proc.disconnect(); mute.disconnect();
    resolve(toWav(bufs, ctx.sampleRate));
  };
  const timer = setTimeout(stop, maxMs);
  return { stop, finished };
}

// Junta, reduz para ~24 kHz, corta silêncio das pontas e normaliza o volume.
function toWav(bufs, rate) {
  let n = 0;
  for (const b of bufs) n += b.length;
  let x = new Float32Array(n);
  let o = 0;
  for (const b of bufs) { x.set(b, o); o += b.length; }
  const f = Math.max(1, Math.floor(rate / 24000));
  if (f > 1) {
    const y = new Float32Array(Math.floor(x.length / f));
    for (let i = 0; i < y.length; i++) { let s = 0; for (let k = 0; k < f; k++) s += x[i * f + k]; y[i] = s / f; }
    x = y; rate = rate / f;
  }
  let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  if (peak < 0.01) {
    const err = new Error('Não captei som nenhum. O microfone pode estar bloqueado ou com defeito.');
    err.name = 'Silencio';
    return { error: err };
  }
  const th = Math.max(0.02, peak * 0.08);
  let a = 0, b = x.length - 1;
  while (a < x.length && Math.abs(x[a]) < th) a++;
  while (b > a && Math.abs(x[b]) < th) b--;
  a = Math.max(0, a - Math.floor(rate * 0.08));
  b = Math.min(x.length, b + Math.floor(rate * 0.18));
  x = x.subarray(a, b);
  const gain = Math.min(8, 0.9 / peak);
  const pcm = new DataView(new ArrayBuffer(44 + x.length * 2));
  const str = (off, s) => { for (let i = 0; i < s.length; i++) pcm.setUint8(off + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); pcm.setUint32(4, 36 + x.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); pcm.setUint32(16, 16, true); pcm.setUint16(20, 1, true); pcm.setUint16(22, 1, true);
  pcm.setUint32(24, rate, true); pcm.setUint32(28, rate * 2, true); pcm.setUint16(32, 2, true); pcm.setUint16(34, 16, true);
  str(36, 'data'); pcm.setUint32(40, x.length * 2, true);
  for (let i = 0; i < x.length; i++) pcm.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i] * gain)) * 0x7fff, true);
  return { blob: new Blob([pcm], { type: 'audio/wav' }) };
}

// Toca um blob recém-gravado (antes de salvar).
export function playBlob(blob) {
  const url = URL.createObjectURL(blob);
  return playUrl(url).then(() => URL.revokeObjectURL(url));
}
