// Figuras do app: cenas vetoriais (js/kz) geradas uma vez e usadas como imagem.
import { scene, kit, doc, toUrl } from './kz/engine.js';
import { OBJ1 } from './kz/objects1.js';
import { OBJ2, mascot } from './kz/objects2.js';

const OBJ = { ...OBJ1, ...OBJ2 };
const cache = new Map();

export function sceneUrl(word) {
  if (!cache.has(word.id)) cache.set(word.id, toUrl(scene(word.id, OBJ[word.id])));
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
