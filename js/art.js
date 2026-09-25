// Figuras do app: cada objeto sozinho, sobre fundo liso, enquadrado automaticamente
// (mede o desenho real e ajusta para ocupar ~80% do quadro). Estilo vetorial de js/kz.
import { kit, doc, toUrl } from './kz/engine.js';
import { OBJ1 } from './kz/objects1.js';
import { OBJ2, mascot } from './kz/objects2.js';
import { OBJ3 } from './kz/objects3.js';
import { OBJ4 } from './kz/objects4.js';

const OBJ = { ...OBJ1, ...OBJ2, ...OBJ3, ...OBJ4 };
const SIZE = 300;
const FILL = 0.8;              // fração do quadro ocupada pelo lado maior do objeto
const BG = '#DCEEFF';          // fundo liso padrão (azul-céu claro)
const BG_WARM = '#FFEFD2';     // para objetos predominantemente azuis ou brancos-azulados
const WARM = new Set(['caminhao', 'quebracabeca', 'ziper', 'olho', 'elevador', 'navio', 'veleiro', 'iate', 'lancha', 'windsurf', 'nuvem', 'foca', 'hipopotamo', 'pato', 'submarino', 'yoga', 'bone', 'mochila', 'diamante', 'iglu', 'fantasma', 'envelope', 'ovelha', 'igreja', 'lua', 'ema', 'nave', 'zepelim', 'copo', 'jarra']);

// Faixa de água do tamanho do objeto (linha d'água em y=180 na caixa do objeto).
function waves(k, x0, x1) {
  const n = Math.max(2, Math.round((x1 - x0) / 40)), w = (x1 - x0) / n;
  let top = `M${x0} 180`, rim = '';
  for (let i = 0; i < n; i++) top += ` Q${x0 + w * i + w / 2} 172 ${x0 + w * (i + 1)} 180`;
  for (let i = n - 1; i >= 0; i--) rim += ` Q${x0 + w * i + w / 2} 176 ${x0 + w * i} 184`;
  return k.p(`${top} L${x1} 200 Q${(x0 + x1) / 2} 206 ${x0} 200Z`, k.lg(['#7fd8ff', '#2a7ad0'], 'v')) +
    k.p(`${top} L${x1} 184${rim}Z`, '#ffffff', 0.8);
}

// Mede a caixa do desenho num SVG oculto da própria página.
let probe;
function measure(inner) {
  if (!probe) {
    probe = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    probe.setAttribute('width', '0'); probe.setAttribute('height', '0');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden';
    document.body.appendChild(probe);
  }
  probe.innerHTML = inner;
  const b = probe.lastChild.getBBox();
  probe.innerHTML = '';
  return b;
}

export function objectSvg(id, withBg = true) {
  const o = OBJ[id];
  const k = kit();
  let body = o.draw(k);
  if (o.env === 'water') {
    const ob = measure(`<defs>${k.defs.join('')}</defs><g>${body}</g>`);
    body += waves(k, ob.x - 8, ob.x + ob.width + 8);
  }
  const b = measure(`<defs>${k.defs.join('')}</defs><g>${body}</g>`);
  const scale = (SIZE * FILL) / Math.max(b.width, b.height);
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  let shadow = '';
  if (!o.env || o.env === 'land') {
    // Sombra suave no chão, sob a base do objeto (em coordenadas do quadro).
    const base = SIZE / 2 + (b.height / 2) * scale;
    shadow = k.e(SIZE / 2, Math.min(SIZE - 10, base), b.width * scale * 0.42, 7, '#1a2a6a', 0.14);
  }
  const bg = withBg ? k.r(0, 0, SIZE, SIZE, WARM.has(id) ? BG_WARM : BG) : '';
  if (!withBg) shadow = '';
  const obj = k.g(`translate(${SIZE / 2} ${SIZE / 2 - (shadow ? 4 : 0)}) scale(${scale}) translate(${-cx} ${-cy})`, body);
  return doc(SIZE, SIZE, k, bg + shadow + obj);
}

const bare = new Map();
export function bareUrl(id) {
  if (!bare.has(id)) bare.set(id, toUrl(objectSvg(id, false)));
  return bare.get(id);
}

const cache = new Map();
export function sceneUrl(word) {
  if (!cache.has(word.id)) cache.set(word.id, toUrl(objectSvg(word.id)));
  return cache.get(word.id);
}

export function pic(word, cls = '') {
  return `<span class="pic ${cls}"><img src="${sceneUrl(word)}" alt="${word.w}" draggable="false"></span>`;
}

// Mascote como SVG vivo (para animar braço e olhos). Cada chamada usa ids próprios.
let seq = 0;
export const ART = {
  escavadeira: (eyes = true) => {
    const k = kit(`m${seq++}_`);
    return doc(220, 160, k, mascot(k, eyes)).replace('<svg ', '<svg class="art mascot-art" ');
  },
};
