// Motor das ilustrações no estilo "flat vetorial com gradientes" (brief Kurzgesagt):
// só gradientes lineares, sem contornos, luz vinda de cima-direita (meio-dia), 3 planos,
// sem pessoas e sem textos (decisão do Pedro: os desenhos não precisam de escala humana).

// Paleta saturada: [claro (lado iluminado), escuro (lado na sombra)]
export const PAL = {
  red: ['#ff5a5a', '#b0103a'], yellow: ['#ffe04a', '#ff8a1a'], orange: ['#ffb040', '#e0401a'],
  blue: ['#5ac8ff', '#2040c0'], green: ['#8cf06c', '#107a50'], lime: ['#c0ff50', '#3aa02a'],
  purple: ['#c080ff', '#5020b0'], pink: ['#ff8ac0', '#d02070'], brown: ['#d88a4a', '#6a2e1a'],
  dbrown: ['#9a5a30', '#3a1420'], metal: ['#eef4ff', '#6a7ab0'], white: ['#ffffff', '#a8b8f0'],
  black: ['#4a4a80', '#10102a'], glass: ['#d0f6ff', '#4aa8e8'], tire: ['#4a4a70', '#0e0e22'],
  gold: ['#fff0a0', '#ffa020'], gray: ['#c0ccf0', '#50608e'], sand: ['#ffd9a0', '#d4853a'],
  teal: ['#40e0c0', '#107080'], cream: ['#fff6dc', '#e8b070'], skin: ['#ffd0a0', '#d88050'],
  plum: ['#6a2a6a', '#2a0a3a'], indigo: ['#2a1a5a', '#0a0a2a'],
};

const DIRS = { d: [1, 0, 0, 1], v: [0, 0, 0, 1], h: [0, 0, 1, 0], l: [1, 0, 0, 0], u: [0, 1, 0, 0], r: [0, 0, 1, 1] };

// Kit de desenho de uma imagem: cada imagem tem seus próprios ids de gradiente.
export function kit(prefix = 'g') {
  let n = 0;
  const defs = [];
  const lg = (stops, dir = 'd') => {
    const id = prefix + n++;
    const [x1, y1, x2, y2] = DIRS[dir];
    const st = stops.map((s, i) => {
      const [c, o, op] = Array.isArray(s) ? s : [s, stops.length > 1 ? i / (stops.length - 1) : 0, 1];
      return `<stop offset="${o}" stop-color="${c}"${op !== undefined && op !== 1 ? ` stop-opacity="${op}"` : ''}/>`;
    }).join('');
    defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${st}</linearGradient>`);
    return `url(#${id})`;
  };
  const G = (name, dir = 'd') => lg(PAL[name], dir);
  const clip = (shape) => {
    const id = prefix + 'c' + n++;
    defs.push(`<clipPath id="${id}">${shape}</clipPath>`);
    return `clip-path="url(#${id})"`;
  };
  const op = (o) => (o !== undefined && o !== 1 ? ` opacity="${o}"` : '');
  const k = {
    defs, lg, G, clip,
    r: (x, y, w, h, f, rx = 0, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"${op(o)}/>`,
    c: (x, y, r, f, o) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${op(o)}/>`,
    e: (x, y, rx, ry, f, o) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"${op(o)}/>`,
    p: (d, f, o) => `<path d="${d}" fill="${f}"${op(o)}/>`,
    pe: (d, f) => `<path d="${d}" fill="${f}" fill-rule="evenodd"/>`,
    g: (t, body, extra = '') => `<g transform="${t}" ${extra}>${body}</g>`,
    // Barra fina (substitui traços: o estilo não usa contorno).
    bar: (x1, y1, x2, y2, w, f) => {
      const a = Math.atan2(y2 - y1, x2 - x1), dx = Math.sin(a) * w / 2, dy = -Math.cos(a) * w / 2;
      return `<path d="M${x1 + dx} ${y1 + dy} L${x2 + dx} ${y2 + dy} L${x2 - dx} ${y2 - dy} L${x1 - dx} ${y1 - dy}Z" fill="${f}"/>`;
    },
  };
  k.wheel = (x, y, r) => k.c(x, y, r, k.G('tire')) + k.c(x, y, r * 0.56, k.G('metal')) + k.c(x, y, r * 0.22, '#3a4270') + k.c(x + r * 0.2, y - r * 0.2, r * 0.1, '#fff', 0.8);
  k.eye = (x, y, r, look = 0.3) => k.c(x, y, r, k.G('white')) + k.c(x + r * look, y + r * 0.1, r * 0.55, '#141430') + k.c(x + r * look + r * 0.2, y - r * 0.15, r * 0.2, '#fff');
  k.shadow = (x, y, rx, ry = 6, o = 0.35) => k.e(x, y, rx, ry, '#0a1a3a', o);
  return k;
}

export const doc = (w, h, k, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs>${k.defs.join('')}</defs>${body}</svg>`;
export const toUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

// Hash simples para variar lados/poses de forma estável por palavra.
export const hash = (str) => { let v = 7; for (const ch of str) v = (v * 31 + ch.charCodeAt(0)) >>> 0; return v; };

// ---------- Cenários (300×300, meio-dia) ----------
function sky(k, W, H) {
  return k.r(0, 0, W, H, k.lg([['#1a3a8a', 0], ['#3f68d0', 0.42], ['#ffe8b0', 0.74], ['#ffe8b0', 1]], 'v')) +
    k.c(W * 0.8, H * 0.14, 30, '#fff4c8', 0.08) + k.c(W * 0.8, H * 0.14, 22, '#fff4c8', 0.16) + k.c(W * 0.8, H * 0.14, 14, '#fffbe8');
}
function farMesas(k, y) {
  return k.p(`M0 ${y} L26 ${y} L34 ${y - 20} L88 ${y - 20} L96 ${y} L166 ${y} L172 ${y - 12} L228 ${y - 12} L236 ${y} L300 ${y} L300 ${y + 40} L0 ${y + 40}Z`,
    k.lg(['#d89868', '#ecc488'], 'v'), 0.95);
}
// Falésia de arenito do plano médio, num dos lados; devolve também onde fica o topo.
function cliff(k, right) {
  const lit = k.lg(['#ff9a4a', '#d47a30'], 'v');
  const dark = k.lg(['#6a2a5a', '#3a1a3a'], 'v');
  if (right) {
    return {
      svg: k.p('M196 214 L204 124 Q207 114 216 114 L300 108 L300 236 L196 236Z', lit) +
        k.p('M196 214 L204 124 Q207 114 216 114 L226 114 L218 214Z', dark) +
        k.p('M216 114 L300 108 L300 114 L218 119Z', '#ffcc66') +
        k.p('M250 150 L262 150 L258 190 L246 190Z', '#b85a28', 0.5),
      top: [262, 111],
    };
  }
  return {
    svg: k.p('M0 102 L78 108 Q88 110 90 120 L100 214 L100 236 L0 236Z', dark) +
      k.p('M60 106 L78 108 Q88 110 90 120 L100 214 L82 214 L72 120Z', lit) +
      k.p('M0 102 L78 108 Q84 109 86 113 L0 108Z', '#ffcc66') +
      k.p('M30 140 L40 140 L38 180 L28 180Z', '#2a0a2a', 0.4),
    top: [38, 105],
  };
}
const mist = (k, y, h) => k.r(0, y, 300, h, k.lg([['#ffe8b0', 0, 0], ['#ffe8b0', 0.5, 0.75], ['#ffe8b0', 1, 0]], 'v'));

function land(k, v) {
  const flora = [[30, 262], [262, 250], [210, 272], [70, 246]].map(([x, y], i) =>
    k.e(x, y, 10 + (i % 2) * 5, 6, k.lg(['#2a8a6a', '#1a5a5a'], 'v')) + k.c(x + 4, y - 3, 2.6, '#ff4080'));
  return k.p(`M0 ${222 + v} Q70 ${204 - v} 150 ${218} Q220 ${230 + v} 300 ${210} L300 300 L0 300Z`, k.lg(['#5ce05c', '#1a8a5a', '#1a5a5a'], 'v')) +
    k.p(`M0 ${222 + v} Q70 ${204 - v} 150 ${218} Q220 ${230 + v} 300 ${210} L300 ${214} Q220 ${234 + v} 150 ${222} Q70 ${208 - v} 0 ${226 + v}Z`, '#a0ff40', 0.8) +
    flora.join('');
}
function water(k) {
  const sparkle = [[40, 226], [120, 248], [230, 234], [270, 262], [80, 276], [190, 284]].map(([x, y]) => k.e(x, y, 7, 1.4, '#ffffff', 0.9));
  return k.r(0, 212, 300, 88, k.lg(['#a0e8ff', '#2a8ad0', '#1a3a8a'], 'v')) + k.r(0, 212, 300, 3, '#ffffff', 0.7) + sparkle.join('');
}
// Primeiro plano: arbusto escuro num canto, com realce lima no topo (sem contorno).
function ledge(k, left) {
  const f = k.lg(['#1a7a5a', '#0a3a3a'], 'v');
  const d = left
    ? 'M0 300 L0 262 Q14 246 30 256 Q40 242 56 254 Q66 250 70 262 L76 300Z'
    : 'M300 300 L300 262 Q286 246 270 256 Q260 242 244 254 Q234 250 230 262 L224 300Z';
  const rim = left
    ? 'M0 262 Q14 246 30 256 Q40 242 56 254 Q66 250 70 262 L68 264 Q62 254 56 258 Q40 248 30 260 Q14 252 0 266Z'
    : 'M300 262 Q286 246 270 256 Q260 242 244 254 Q234 250 230 262 L232 264 Q238 254 244 258 Q260 248 270 260 Q286 252 300 266Z';
  return k.p(d, f) + k.p(rim, '#a0ff40', 0.7) + k.c(left ? 44 : 256, 262, 3, '#ff4080');
}

// Fundo subaquático (submarino).
function underwater(k) {
  const rays = [[40, 90], [120, 170], [210, 250]].map(([a, b]) => k.p(`M${a} 0 L${a + 30} 0 L${b + 40} 300 L${b - 10} 300Z`, '#ffffff', 0.06));
  return k.r(0, 0, 300, 300, k.lg(['#2a8ad0', '#1a3a8a', '#0a0a2a'], 'v')) + rays.join('') +
    k.p('M0 180 L40 150 L90 170 L130 140 L180 168 L230 136 L300 160 L300 240 L0 240Z', k.lg(['#3a2a7a', '#1a1040'], 'v'), 0.8) +
    k.p('M0 250 Q80 236 160 248 Q230 258 300 244 L300 300 L0 300Z', k.lg(['#d4853a', '#6a2a3a'], 'v')) +
    k.p('M40 250 Q34 220 44 200 Q48 222 50 250Z', '#5ce05c') + k.p('M250 246 Q246 214 258 196 Q262 222 262 246Z', '#ff4080') +
    k.p('M262 246 Q270 226 280 218 Q278 236 272 248Z', '#ff4080', 0.8);
}

// Monta a cena completa. obj = { draw(k) -> svg na caixa 200×200 (chão em y=190), env, s }
export function scene(id, obj) {
  const k = kit();
  const hv = hash(id);
  const right = hv % 2 === 0;           // lado da falésia
  const env = obj.env || 'land';
  const s = Math.min(1.12, (obj.s || 0.78) * 1.25); // objeto principal ocupa ~50% do quadro
  let out = '';
  if (env === 'under') {
    out += underwater(k);
    out += k.g(`translate(${150 - 100 * s} ${150 - 110 * s}) scale(${s})`, obj.draw(k));
  } else {
    out += sky(k, 300, 300) + farMesas(k, 178);
    const cl = cliff(k, right);
    out += cl.svg;
    out += mist(k, 184, 34);
    out += env === 'water' ? water(k) : land(k, (hv % 3) * 4);
    if (env === 'air') {
      out += k.shadow(150, 244, 46 * s, 5, 0.25);
      out += k.g(`translate(${150 - 100 * s} ${146 - 100 * s}) scale(${s})`, obj.draw(k));
    } else if (env === 'water') {
      out += k.g(`translate(${150 - 100 * s} ${236 - 180 * s}) scale(${s})`, obj.draw(k));
      out += k.r(0, 240, 300, 60, k.lg([['#2a8ad0', 0, 0.55], ['#1a3a8a', 1, 0.85]], 'v'));
      out += k.e(150, 240, 86 * s, 3, '#ffffff', 0.6);
    } else {
      out += k.shadow(150, 238, 74 * s, 7);
      out += k.g(`translate(${150 - 100 * s} ${238 - 190 * s}) scale(${s})`, obj.draw(k));
    }
    const leftLedge = hv % 4 < 2;
    out += ledge(k, leftLedge);
  }
  return doc(300, 300, k, out);
}

// Fundo da interface (sem objeto): mesmo mundo, em formato largo.
export function backdrop(night = false) {
  const k = kit();
  const W = 1600, H = 1000;
  let out = '';
  if (night) {
    out += k.r(0, 0, W, H, k.lg(['#0a0a2a', '#1a1050', '#3a1a6a'], 'v'));
    for (let i = 0; i < 70; i++) {
      const x = (i * 197) % W, y = (i * 131) % 560;
      out += k.c(x, y, 1 + (i % 3) * 0.8, '#ffffff', 0.5 + (i % 4) * 0.12);
    }
    out += k.c(1250, 170, 46, '#e8eeff') + k.c(1270, 158, 42, '#1a1050');
  } else {
    out += k.r(0, 0, W, H, k.lg([['#1a3a8a', 0], ['#3f68d0', 0.4], ['#ffe8b0', 0.72], ['#ffe8b0', 1]], 'v'));
    out += k.c(1300, 130, 90, '#fff4c8', 0.08) + k.c(1300, 130, 60, '#fff4c8', 0.16) + k.c(1300, 130, 38, '#fffbe8');
  }
  const far = night ? k.lg(['#2a1a5a', '#1a1040'], 'v') : k.lg(['#d89868', '#ecc488'], 'v');
  out += k.p('M0 640 L120 640 L150 560 L420 560 L450 640 L860 640 L884 600 L1120 600 L1150 640 L1600 640 L1600 780 L0 780Z', far, 0.95);
  const lit = night ? k.lg(['#4a3a8a', '#2a1a5a'], 'v') : k.lg(['#ff9a4a', '#d47a30'], 'v');
  const dark = night ? k.lg(['#1a1040', '#0a0a2a'], 'v') : k.lg(['#6a2a5a', '#3a1a3a'], 'v');
  out += k.p('M1180 760 L1210 470 Q1220 440 1250 440 L1600 420 L1600 820 L1180 820Z', lit) +
    k.p('M1180 760 L1210 470 Q1220 440 1250 440 L1290 440 L1260 760Z', dark) +
    k.p('M1250 440 L1600 420 L1600 434 L1260 452Z', night ? '#8aa0ff' : '#ffcc66');
  out += k.r(0, 660, W, 110, k.lg([['#ffe8b0', 0, 0], ['#ffe8b0', 0.5, night ? 0.15 : 0.7], ['#ffe8b0', 1, 0]], 'v'));
  const hill = night ? k.lg(['#1a5a5a', '#0a2a3a'], 'v') : k.lg(['#5ce05c', '#1a8a5a', '#1a5a5a'], 'v');
  out += k.p('M0 790 Q400 730 800 780 Q1200 830 1600 760 L1600 1000 L0 1000Z', hill);
  out += k.p('M0 790 Q400 730 800 780 Q1200 830 1600 760 L1600 772 Q1200 842 800 792 Q400 742 0 802Z', night ? '#2a8a8a' : '#a0ff40', 0.8);
  return doc(W, H, k, out).replace('<svg ', '<svg preserveAspectRatio="xMidYMax slice" ');
}
