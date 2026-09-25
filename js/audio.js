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

// Vozes tocam pela Web Audio (buffer decodificado): no iPad isso evita as falhas do <audio>
// com respostas do modo offline (Range) e toca na hora. O <audio> fica de reserva.
const buffers = new Map(); // id -> Promise<AudioBuffer|null>
let current = null;        // fonte tocando agora

function clipSource(id) {
  if (urls.has(id)) return urls.get(id);
  if (bundled.has(id)) return `audio/${id}.m4a?v=${bundled.get(id)}`;
  return null;
}
function loadBuffer(id) {
  const src = clipSource(id);
  if (!src || !ensureCtx()) return Promise.resolve(null);
  const key = id + '|' + src;
  if (!buffers.has(key)) {
    buffers.set(key, fetch(src).then((r) => r.arrayBuffer())
      .then((ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
      .catch(() => { buffers.delete(key); return null; }));
  }
  return buffers.get(key);
}
// Pré-carrega clipes (ex.: os da próxima rodada) para tocarem sem atraso.
export function preload(...ids) { ids.flat().forEach(loadBuffer); }

function playBuffer(buf) {
  return new Promise((res) => {
    let done = false;
    const end = () => { if (!done) { done = true; res(); } };
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = end;
    current = src;
    src.start();
    setTimeout(end, buf.duration * 1000 + 400);
  });
}

async function playOne(id) {
  const src = clipSource(id);
  if (src) {
    if (ctx && ctx.state !== 'running') await Promise.race([ctx.resume().catch(() => {}), wait(300)]);
    const buf = await loadBuffer(id);
    if (buf && ctx && ctx.state === 'running') return playBuffer(buf);
    return playUrl(src);
  }
  const c = CLIP[id];
  return speak(c ? c.t : id);
}

// Toca uma sequência de clipes; uma nova chamada interrompe a anterior.
export async function say(...ids) {
  const my = ++token;
  stopVoice(false);
  const list = ids.flat();
  // No iPad o som só libera quando o dedo sai da tela: espera um pouco pelo desbloqueio.
  for (let t = 0; t < 15 && !audioReady(); t++) await wait(100);
  if (my !== token) return false;
  preload(list);
  for (const id of list) {
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
  if (current) { try { current.stop(); } catch (e) { /* noop */ } current = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Efeitos (Web Audio, sem arquivos) ----------
let ctx;
export const audioCtx = () => ctx;
function ensureCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!ctx && AC) ctx = new AC();
  return ctx;
}
// iOS: o som só é liberado num gesto "completo" (touchend/click), não no toque inicial.
// Chamado em todo toque; é barato depois da primeira vez.
let unlocked = false;
export function unlockAudio() {
  // iOS 16.4+: trata o app como reprodução de mídia (toca mesmo com o iPad no silencioso).
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { /* noop */ }
  if (!ensureCtx()) return;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  if (!unlocked) {
    // Um buffer de silêncio tocado dentro do gesto destrava a Web Audio no Safari do iOS.
    try {
      const b = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = b; src.connect(ctx.destination); src.start(0);
    } catch (e) { /* noop */ }
    // E o <audio> de reserva também.
    player.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    player.play().then(() => { unlocked = ctx.state === 'running'; }).catch(() => {});
    if (ctx.state === 'running') unlocked = true;
  }
}
export const audioReady = () => !!ctx && ctx.state === 'running';
['touchend', 'click', 'keydown'].forEach((ev) => document.addEventListener(ev, unlockAudio, true));

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
// Estratégia (revista depois de falhas no Safari do Mac):
//  • microfone sem processamento de voz (o cancelamento de eco do Safari "come" sílabas);
//  • captura pelo MediaRecorder nativo (não perde pedaços quando a página está ocupada);
//  • um AudioContext próprio, criado DEPOIS do microfone, só para o medidor de volume e para decodificar;
//  • corte de silêncio conservador sobre a gravação inteira, com folga generosa nas pontas.
export function micSupport() {
  const why = [];
  if (!window.isSecureContext) why.push('página sem HTTPS');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) why.push('navegador sem acesso ao microfone (getUserMedia)');
  if (!(window.AudioContext || window.webkitAudioContext)) why.push('sem Web Audio');
  return why;
}
export const canRecord = () => micSupport().length === 0;

export function openMic() {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
  });
}
export function closeMic(stream) {
  if (stream) stream.getTracks().forEach((t) => t.stop());
}

const isMac = /Macintosh/.test(navigator.userAgent) && !('ontouchend' in document);
export function micError(e) {
  const n = (e && e.name) || '';
  if (n === 'NotAllowedError') return isMac
    ? 'O navegador não tem permissão de microfone. No Safari: Ajustes → Sites → Microfone → localhost: Permitir. No Mac: Ajustes do Sistema → Privacidade e Segurança → Microfone → Safari ligado.'
    : 'O iPad negou o microfone. Veja em Ajustes → Safari → Microfone (deixe “Perguntar” ou “Permitir”) e em Ajustes → Tempo de Uso → Conteúdo e Privacidade → Microfone.';
  if (n === 'NotFoundError') return 'Nenhum microfone encontrado.';
  if (n === 'NotReadableError') return 'O microfone está ocupado por outro app. Feche outros apps e tente de novo.';
  if (n === 'Silencio') return e.message;
  return `${n || 'Erro'}: ${(e && e.message) || e}`;
}

const MR_TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];

// Abre o microfone e devolve um gravador reutilizável (uma permissão para a sessão inteira).
export async function createMic() {
  const stream = await openMic();
  const AC = window.AudioContext || window.webkitAudioContext;
  const mctx = new AC();
  try { await mctx.resume(); } catch (e) { /* noop */ }
  const src = mctx.createMediaStreamSource(stream);
  const an = mctx.createAnalyser();
  an.fftSize = 1024;
  src.connect(an);
  const bytes = new Uint8Array(an.fftSize);
  const level = () => {
    an.getByteTimeDomainData(bytes);
    let sum = 0;
    for (let i = 0; i < bytes.length; i++) { const v = (bytes[i] - 128) / 128; sum += v * v; }
    return Math.sqrt(sum / bytes.length);
  };

  const type = window.MediaRecorder ? MR_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) : null;
  let rec = null, chunks = [], timer = 0, stopping = null, pcm = null, proc = null, resolveResult = null;

  async function start(maxMs = 8000) {
    if (mctx.state !== 'running') { try { await mctx.resume(); } catch (e) { /* noop */ } }
    chunks = [];
    stopping = null;
    const result = new Promise((r) => { resolveResult = r; });
    if (window.MediaRecorder) {
      rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const started = new Promise((r) => { rec.onstart = r; setTimeout(r, 400); });
      rec.start();
      await started;
    } else {
      // Sem MediaRecorder: captura PCM direto (navegadores antigos).
      pcm = [];
      proc = mctx.createScriptProcessor(4096, 1, 1);
      proc.onaudioprocess = (e) => pcm.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      const mute = mctx.createGain(); mute.gain.value = 0;
      src.connect(proc); proc.connect(mute).connect(mctx.destination);
    }
    timer = setTimeout(() => stop(), maxMs);
    return { result }; // resolve quando a gravação terminar (stop() ou limite de tempo)
  }

  function stop() {
    if (stopping) return stopping;
    clearTimeout(timer);
    stopping = (async () => {
      await wait(350); // folga no fim: a última sílaba não é cortada
      let x, rate, raw = null;
      if (rec) {
        const done = new Promise((r) => { rec.onstop = r; });
        rec.stop();
        await done;
        raw = new Blob(chunks, { type: rec.mimeType || type || 'audio/mp4' });
        rec = null;
        try {
          const ab = await raw.arrayBuffer();
          const audio = await new Promise((res, rej) => mctx.decodeAudioData(ab, res, rej));
          x = audio.getChannelData(0); rate = audio.sampleRate;
        } catch (e) {
          const err = new Error('Não consegui ler a gravação (' + (e && e.message) + ').');
          return { error: err, raw };
        }
      } else {
        proc.onaudioprocess = null; proc.disconnect();
        let n = 0; for (const b of pcm) n += b.length;
        x = new Float32Array(n); let o = 0; for (const b of pcm) { x.set(b, o); o += b.length; }
        rate = mctx.sampleRate;
      }
      const out = processPcm(x, rate);
      out.raw = raw;
      proc = null;
      return out;
    })();
    stopping.then((out) => resolveResult && resolveResult(out));
    return stopping;
  }

  const close = () => { try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) { /* noop */ } closeMic(stream); try { mctx.close(); } catch (e) { /* noop */ } };
  return { level, start, stop, close, recording: () => !!(rec || proc) && !stopping };
}

// Reduz para ~24 kHz, corta só o silêncio das pontas (com folga), suaviza bordas e normaliza o volume.
function processPcm(x, rate) {
  const f = Math.max(1, Math.floor(rate / 24000));
  if (f > 1) {
    const y = new Float32Array(Math.floor(x.length / f));
    for (let i = 0; i < y.length; i++) { let s = 0; for (let k = 0; k < f; k++) s += x[i * f + k]; y[i] = s / f; }
    x = y; rate = Math.round(rate / f);
  }
  const win = Math.max(1, Math.round(rate * 0.01));
  const nw = Math.floor(x.length / win);
  const rms = new Float32Array(nw);
  let maxRms = 0;
  for (let w = 0; w < nw; w++) {
    let s = 0; for (let i = w * win; i < (w + 1) * win; i++) s += x[i] * x[i];
    rms[w] = Math.sqrt(s / win); if (rms[w] > maxRms) maxRms = rms[w];
  }
  // Onda para o desenho (antes do corte).
  const bins = 120, wave = new Float32Array(bins);
  for (let b = 0; b < bins; b++) {
    const a0 = Math.floor((b / bins) * x.length), a1 = Math.floor(((b + 1) / bins) * x.length);
    let m = 0; for (let i = a0; i < a1; i++) m = Math.max(m, Math.abs(x[i])); wave[b] = m;
  }
  if (maxRms < 0.002) {
    const e = new Error(isMac
      ? 'Não chegou som do microfone. Confira em Ajustes do Sistema → Som → Entrada qual microfone está escolhido e se o volume de entrada não está no mínimo.'
      : 'Não chegou som do microfone. Ele pode estar bloqueado ou com defeito.');
    e.name = 'Silencio';
    return { error: e, wave };
  }
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const noise = sorted[Math.floor(sorted.length * 0.2)] || 0;
  const thr = Math.max(noise * 4, maxRms * 0.05, 0.002);
  let first = 0, last = nw - 1;
  while (first < nw && rms[first] < thr) first++;
  while (last > first && rms[last] < thr) last--;
  const a = Math.max(0, first * win - Math.round(rate * 0.25));
  const b = Math.min(x.length, (last + 1) * win + Math.round(rate * 0.4));
  const y = x.slice(a, b);
  let peak = 0;
  for (let i = 0; i < y.length; i++) peak = Math.max(peak, Math.abs(y[i]));
  const gain = Math.min(6, 0.89 / (peak || 1));
  const fade = Math.round(rate * 0.015);
  for (let i = 0; i < y.length; i++) {
    let g = gain;
    if (i < fade) g *= i / fade; else if (i > y.length - fade) g *= (y.length - i) / fade;
    y[i] = Math.max(-1, Math.min(1, y[i] * g));
  }
  const dv = new DataView(new ArrayBuffer(44 + y.length * 2));
  const str = (off, t) => { for (let i = 0; i < t.length; i++) dv.setUint8(off + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + y.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, y.length * 2, true);
  for (let i = 0; i < y.length; i++) dv.setInt16(44 + i * 2, y[i] * 0x7fff, true);
  return { blob: new Blob([dv], { type: 'audio/wav' }), wave, kept: [a / x.length, b / x.length], seconds: y.length / rate };
}

// Toca um blob recém-gravado (antes de salvar).
export function playBlob(blob) {
  const url = URL.createObjectURL(blob);
  return playUrl(url).then(() => URL.revokeObjectURL(url));
}
