// Ícones da interface no mesmo estilo (sem contorno, gradientes lineares). Caixa 100×100.
import { kit, doc, toUrl } from './engine.js';

const DRAW = {
  '🏠': (k) => k.p('M14 50 L50 16 L86 50 L78 50 L78 86 L22 86 L22 50Z', k.G('orange')) +
    k.p('M8 52 L50 12 L92 52 L84 58 L50 26 L16 58Z', k.G('red')) +
    k.r(42, 58, 16, 28, k.G('dbrown'), 3) + k.r(62, 56, 12, 12, k.G('glass'), 2) + k.r(66, 18, 10, 20, k.G('red', 'h')),
  '🔊': (k) => k.p('M14 38 L32 38 L54 18 L54 82 L32 62 L14 62Z', k.G('blue')) +
    k.p('M64 34 Q74 50 64 66 L70 70 Q84 50 70 30Z', k.G('orange')) + k.p('M74 22 Q94 50 74 78 L80 82 Q104 50 80 18Z', k.G('yellow')),
  '🗣️': (k) => k.p('M20 86 L20 64 Q10 60 12 44 Q14 16 44 14 Q72 14 74 40 L82 54 L74 58 L74 70 Q74 76 66 76 L56 76 L56 86Z', k.G('purple')) +
    k.c(58, 40, 5, '#1a1040') + k.bar(84, 40, 96, 34, 4, '#ffcc40') + k.bar(86, 52, 98, 52, 4, '#ffcc40') + k.bar(84, 64, 96, 70, 4, '#ffcc40'),
  '⚙️': (k) => Array.from({ length: 8 }, (_, i) => k.g(`rotate(${i * 45} 50 50)`, k.r(42, 6, 16, 20, k.G('gray'), 3))).join('') +
    k.c(50, 50, 32, k.G('gray')) + k.c(50, 50, 13, '#e8eeff'),
  '🏁': (k) => k.r(14, 8, 7, 88, k.G('gray', 'h'), 3) +
    Array.from({ length: 12 }, (_, i) => k.r(21 + (i % 4) * 17, 10 + Math.floor(i / 4) * 14, 17, 14, (i + Math.floor(i / 4)) % 2 ? '#1a1040' : '#ffffff')).join(''),
  '⭐': (k) => k.p('M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36Z', k.G('gold')) +
    k.p('M50 6 L62 36 L94 38 L69 58 L50 48Z', '#ffffff', 0.35),
  '🔤': (k) => k.r(8, 8, 38, 38, k.G('red'), 8) + k.r(54, 8, 38, 38, k.G('blue'), 8) + k.r(8, 54, 38, 38, k.G('green'), 8) + k.r(54, 54, 38, 38, k.G('yellow'), 8),
  '🚗': (k) => k.p('M6 70 L6 56 Q6 48 16 46 L26 44 L36 28 Q40 24 46 24 L68 24 Q74 24 78 30 L86 44 Q96 46 96 56 L96 70Z', k.G('red')) +
    k.p('M42 32 L56 32 L56 44 L32 44Z', k.G('glass')) + k.p('M62 32 L72 32 L80 44 L62 44Z', k.G('glass')) +
    k.wheel(28, 72, 12) + k.wheel(76, 72, 12),
};

const cache = new Map();
export function iconUrl(ch) {
  if (!DRAW[ch]) return null;
  if (!cache.has(ch)) { const k = kit(); cache.set(ch, toUrl(doc(100, 100, k, DRAW[ch](k)).replace('<svg ', '<svg width="100" height="100" '))); }
  return cache.get(ch);
}
