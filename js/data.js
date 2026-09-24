// Conteúdo didático: letras, nomes falados e figuras (a primeira é a âncora).
// `e` = emoji nativo do iPad; `svg` = ilustração própria em art.js.

export const LETTERS = [
  { L: 'A', nome: 'á',       cor: '#E53935', words: [
    { id: 'aviao', w: 'avião', e: '✈️' }, { id: 'abelha', w: 'abelha', e: '🐝' }, { id: 'abacaxi', w: 'abacaxi', e: '🍍' } ] },
  { L: 'B', nome: 'bê',      cor: '#FB8C00', words: [
    { id: 'betoneira', w: 'betoneira', svg: 'betoneira' }, { id: 'bola', w: 'bola', e: '⚽' }, { id: 'banana', w: 'banana', e: '🍌' } ] },
  { L: 'C', nome: 'cê',      cor: '#1E88E5', words: [
    { id: 'caminhao', w: 'caminhão', e: '🚚' }, { id: 'cavalo', w: 'cavalo', e: '🐴' }, { id: 'carro', w: 'carro', e: '🚗' } ] },
  { L: 'D', nome: 'dê',      cor: '#43A047', words: [
    { id: 'dinossauro', w: 'dinossauro', e: '🦕' }, { id: 'dado', w: 'dado', e: '🎲' }, { id: 'dente', w: 'dente', e: '🦷' } ] },
  { L: 'E', nome: 'é',       cor: '#8E24AA', words: [
    { id: 'elefante', w: 'elefante', e: '🐘' }, { id: 'elevador', w: 'elevador', e: '🛗' }, { id: 'ervilha', w: 'ervilha', e: '🫛' } ] },
  { L: 'F', nome: 'éfe',     cor: '#F4511E', words: [
    { id: 'foguete', w: 'foguete', e: '🚀' }, { id: 'foca', w: 'foca', e: '🦭' }, { id: 'formiga', w: 'formiga', e: '🐜' } ] },
  { L: 'G', nome: 'gê',      cor: '#00897B', words: [
    { id: 'guindaste', w: 'guindaste', e: '🏗️' }, { id: 'gato', w: 'gato', e: '🐱' }, { id: 'galinha', w: 'galinha', e: '🐔' } ] },
  { L: 'H', nome: 'agá',     cor: '#6D4C41', words: [
    { id: 'helicoptero', w: 'helicóptero', e: '🚁' }, { id: 'hipopotamo', w: 'hipopótamo', e: '🦛' }, { id: 'hamburguer', w: 'hambúrguer', e: '🍔' } ] },
  { L: 'I', nome: 'i',       cor: '#3949AB', words: [
    { id: 'iate', w: 'iate', e: '🛥️' }, { id: 'ioio', w: 'ioiô', e: '🪀' }, { id: 'ima', w: 'ímã', e: '🧲' } ] },
  { L: 'J', nome: 'jota',    cor: '#C0CA33', words: [
    { id: 'jipe', w: 'jipe', e: '🚙' }, { id: 'jacare', w: 'jacaré', e: '🐊' }, { id: 'janela', w: 'janela', e: '🪟' } ] },
  { L: 'K', nome: 'cá',      cor: '#D81B60', words: [
    { id: 'kart', w: 'kart', e: '🏎️' }, { id: 'kiwi', w: 'kiwi', e: '🥝' }, { id: 'karate', w: 'karatê', e: '🥋' } ] },
  { L: 'L', nome: 'éle',     cor: '#039BE5', words: [
    { id: 'lancha', w: 'lancha', e: '🚤' }, { id: 'leao', w: 'leão', e: '🦁' }, { id: 'lapis', w: 'lápis', e: '✏️' } ] },
  { L: 'M', nome: 'ême',     cor: '#E53935', words: [
    { id: 'moto', w: 'moto', e: '🏍️' }, { id: 'macaco', w: 'macaco', e: '🐒' }, { id: 'martelo', w: 'martelo', e: '🔨' } ] },
  { L: 'N', nome: 'êne',     cor: '#5E35B1', words: [
    { id: 'navio', w: 'navio', e: '🚢' }, { id: 'nuvem', w: 'nuvem', e: '☁️' }, { id: 'ninho', w: 'ninho', e: '🪺' } ] },
  { L: 'O', nome: 'ó',       cor: '#FB8C00', words: [
    { id: 'onibus', w: 'ônibus', e: '🚌' }, { id: 'ovo', w: 'ovo', e: '🥚' }, { id: 'olho', w: 'olho', e: '👁️' } ] },
  { L: 'P', nome: 'pê',      cor: '#2E7D32', words: [
    { id: 'pulverizador', w: 'pulverizador', svg: 'pulverizador' }, { id: 'pato', w: 'pato', e: '🦆' }, { id: 'pao', w: 'pão', e: '🍞' } ] },
  { L: 'Q', nome: 'quê',     cor: '#F9A825', words: [
    { id: 'queijo', w: 'queijo', e: '🧀' }, { id: 'quebracabeca', w: 'quebra-cabeça', e: '🧩' }, { id: 'quadro', w: 'quadro', e: '🖼️' } ] },
  { L: 'R', nome: 'érre',    cor: '#1E88E5', words: [
    { id: 'retroescavadeira', w: 'retroescavadeira', svg: 'retro' }, { id: 'rato', w: 'rato', e: '🐭' }, { id: 'roda', w: 'roda', e: '🛞' } ] },
  { L: 'S', nome: 'ésse',    cor: '#00ACC1', words: [
    { id: 'submarino', w: 'submarino', svg: 'submarino' }, { id: 'sapo', w: 'sapo', e: '🐸' }, { id: 'serrote', w: 'serrote', e: '🪚' } ] },
  { L: 'T', nome: 'tê',      cor: '#43A047', words: [
    { id: 'trator', w: 'trator', e: '🚜' }, { id: 'tartaruga', w: 'tartaruga', e: '🐢' }, { id: 'tesoura', w: 'tesoura', e: '✂️' } ] },
  { L: 'U', nome: 'u',       cor: '#6D4C41', words: [
    { id: 'urso', w: 'urso', e: '🐻' }, { id: 'uva', w: 'uva', e: '🍇' }, { id: 'unicornio', w: 'unicórnio', e: '🦄' } ] },
  { L: 'V', nome: 'vê',      cor: '#8E24AA', words: [
    { id: 'veleiro', w: 'veleiro', e: '⛵' }, { id: 'vaca', w: 'vaca', e: '🐮' }, { id: 'vassoura', w: 'vassoura', e: '🧹' } ] },
  { L: 'W', nome: 'dáblio',  cor: '#546E7A', words: [
    { id: 'waffle', w: 'waffle', e: '🧇' }, { id: 'windsurf', w: 'windsurf', e: '🏄' } ] },
  { L: 'X', nome: 'xis',     cor: '#F4511E', words: [
    { id: 'xicara', w: 'xícara', e: '☕' }, { id: 'xerife', w: 'xerife', e: '🤠' }, { id: 'xadrez', w: 'xadrez', e: '♟️' } ] },
  { L: 'Y', nome: 'ípsilon', cor: '#00897B', words: [
    { id: 'yakisoba', w: 'yakisoba', e: '🍜' }, { id: 'yoga', w: 'yoga', e: '🧘' } ] },
  { L: 'Z', nome: 'zê',      cor: '#3949AB', words: [
    { id: 'zebra', w: 'zebra', e: '🦓' }, { id: 'zero', w: 'zero', svg: 'zero' }, { id: 'zabumba', w: 'zabumba', e: '🥁' } ] },
];

export const BY_LETTER = Object.fromEntries(LETTERS.map((x) => [x.L, x]));

// Ordem de introdução de letras novas (as primeiras já vêm com o Tom).
export const ORDER = ['T', 'O', 'M', 'A', 'E', 'I', 'U', 'N', 'L', 'B', 'R', 'Z', 'H',
  'S', 'F', 'V', 'P', 'C', 'D', 'G', 'J', 'Q', 'X', 'K', 'W', 'Y'];

// Ponto de partida: letras do nome (conhecidas) e dos amigos da creche (aprendendo).
export const SEED = {
  T: 3, O: 3, M: 3,                    // TOM
  N: 1, A: 1, H: 1, R: 1, I: 1, L: 1,  // NOAH, MARIA, LUIZA, ARTHUR, BENTO
  U: 1, Z: 1, B: 1, E: 1,
};

// Pares que confundem: não aparecem juntos enquanto a letra-alvo é nova.
export const CONFUSABLE = [
  'MN', 'MW', 'NZ', 'EF', 'PR', 'PB', 'RB', 'OQ', 'OC', 'CG', 'UV', 'VW', 'IJ', 'KX', 'OD', 'GQ',
];

export const LEVELS = ['nova', 'aprendendo', 'praticando', 'conhecida', 'dominada'];

// Frases faladas. `t` é o texto da voz sintética enquanto não houver gravação.
export const PHRASES = [
  { id: 'p_cade', t: 'Cadê o', label: '“Cadê o…” (antes do nome da letra)' },
  { id: 'p_comeca', t: 'Com que letra começa?', label: '“Com que letra começa?”' },
  { id: 'p_esse', t: 'Esse é o', label: '“Esse é o…” (apresenta letra nova)' },
  { id: 'p_nova', t: 'Letra nova!', label: '“Letra nova!”' },
  { id: 'p_bem1', t: 'Muito bem!', label: 'Elogio 1 — “Muito bem!”' },
  { id: 'p_bem2', t: 'Isso aí!', label: 'Elogio 2 — “Isso aí!”' },
  { id: 'p_bem3', t: 'Uhuu! Acertou!', label: 'Elogio 3 — “Uhuu! Acertou!”' },
  { id: 'p_bem4', t: 'Parabéns, Tom!', label: 'Elogio 4 — “Parabéns, Tom!”' },
  { id: 'p_denovo', t: 'Hmm… olha de novo!', label: '“Hmm… olha de novo!”' },
  { id: 'p_qual', t: 'Que letra é essa?', label: '“Que letra é essa?” (jogo com o papai)' },
  { id: 'p_garagem', t: 'Chegou um novo na garagem!', label: '“Chegou um novo na garagem!”' },
  { id: 'p_tchau', t: 'A escavadeira cansou. Tchau, Tom! Até amanhã!', label: 'Fim — “A escavadeira cansou, tchau!”' },
  { id: 'p_oi', t: 'Oi, Tom! Vamos brincar com as letras?', label: 'Abertura — “Oi, Tom! Vamos brincar?”' },
];

// Clipes por letra: nome ("bê"), "B de betoneira" e cada figura.
export function letterClips(x) {
  const a = x.words[0];
  return [
    { id: `n_${x.L}`, t: x.nome, label: `Nome da letra — “${x.nome}”` },
    { id: `d_${x.L}`, t: `${x.nome}, de ${a.w}`, label: `“${x.nome}… de ${a.w}”` },
    ...x.words.map((w) => ({ id: `w_${w.id}`, t: w.w, label: `Figura — “${w.w}”` })),
  ];
}

export const ALL_CLIPS = [...PHRASES, ...LETTERS.flatMap(letterClips)];
export const CLIP = Object.fromEntries(ALL_CLIPS.map((c) => [c.id, c]));
