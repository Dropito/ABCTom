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
export function canRecord() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}
export async function record(maxMs = 4000, onStop) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const finished = new Promise((res) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      res(new Blob(chunks, { type: rec.mimeType || type || 'audio/mp4' }));
    };
  });
  rec.start();
  const timer = setTimeout(() => rec.state === 'recording' && rec.stop(), maxMs);
  return {
    stop: () => { clearTimeout(timer); if (rec.state === 'recording') rec.stop(); },
    finished: finished.then((b) => { onStop && onStop(); return b; }),
  };
}
