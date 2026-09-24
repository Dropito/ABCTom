// Centralização exata de letras e emojis: mede o desenho real do caractere (não a caixa da fonte)
// no próprio aparelho e posiciona pelo centro visual. Resolve os desvios de métrica do Safari/iOS.

const LETTER_FONT = '"Arial Rounded MT Bold", "Nunito", "Varela Round", ui-rounded, system-ui, sans-serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const cv = document.createElement('canvas');
const cx = cv.getContext('2d');

function box(text, font, size, weight = '') {
  cx.font = `${weight} ${size}px ${font}`;
  const m = cx.measureText(text);
  const ok = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent > 0;
  return ok
    ? { l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent }
    : { l: 0, r: m.width, a: size * 0.72, d: 0 }; // fallback: altura de maiúscula típica
}

// Letra centrada num quadrado 100×100 (cor via CSS `fill`).
const glyphCache = new Map();
export function glyph(ch, size = 72) {
  const key = ch + size;
  if (!glyphCache.has(key)) {
    const b = box(ch, LETTER_FONT, size, '900');
    const x = 50 - (b.r - b.l) / 2;
    const y = 50 + (b.a - b.d) / 2;
    glyphCache.set(key, `<svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${size}">${ch}</text></svg>`);
  }
  return glyphCache.get(key);
}

// Emoji desenhado numa imagem quadrada, com o desenho no centro exato.
const emojiCache = new Map();
export function emojiSrc(ch) {
  if (emojiCache.has(ch)) return emojiCache.get(ch);
  const S = 320;
  let size = 240;
  let b = box(ch, EMOJI_FONT, size);
  const span = Math.max(b.l + b.r, b.a + b.d);
  if (span > S * 0.92) { size = Math.floor(size * (S * 0.92) / span); b = box(ch, EMOJI_FONT, size); }
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.font = `${size}px ${EMOJI_FONT}`;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillText(ch, S / 2 - (b.r - b.l) / 2, S / 2 + (b.a - b.d) / 2);
  const url = c.toDataURL('image/png');
  emojiCache.set(ch, url);
  return url;
}
export const icon = (ch, cls = 'ico') => `<img class="${cls}" src="${emojiSrc(ch)}" alt="" draggable="false">`;

// Ícones vetoriais centrados pelo centro visual.
export const SHAPES = {
  play: '<svg class="shape" viewBox="0 0 100 100"><path d="M38 24 Q34 22 34 27 L34 73 Q34 78 38 76 L78 53 Q82 50 78 47 Z" fill="#fff"/></svg>',
  prev: '<svg class="shape" viewBox="0 0 100 100"><path d="M60 26 L36 50 L60 74" stroke="currentColor" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg class="shape" viewBox="0 0 100 100"><path d="M40 26 L64 50 L40 74" stroke="currentColor" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  yes: '<svg class="shape" viewBox="0 0 100 100"><path d="M27 52 L43 68 L74 34" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  no: '<svg class="shape" viewBox="0 0 100 100"><path d="M32 32 L68 68 M68 32 L32 68" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round"/></svg>',
};
