// Ilustrações próprias para o que não existe como emoji (máquinas favoritas do Tom).
// Estilo: chapado, contorno escuro arredondado, cores vivas.

const K = 'stroke="#263238" stroke-width="3" stroke-linejoin="round"';

const wheel = (cx, cy, r) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#263238"/>` +
  `<circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="#B0BEC5" ${K}/>`;

export const ART = {
  // Mascote: escavadeira com olhinhos no para-brisa.
  escavadeira: (eyes = true) => `
<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" class="art">
  <g class="esc-arm">
    <path d="M118 92 L158 40" stroke="#263238" stroke-width="20" stroke-linecap="round"/>
    <path d="M118 92 L158 40" stroke="#FFB300" stroke-width="14" stroke-linecap="round"/>
    <path d="M158 40 L190 92" stroke="#263238" stroke-width="16" stroke-linecap="round"/>
    <path d="M158 40 L190 92" stroke="#FFB300" stroke-width="10" stroke-linecap="round"/>
    <circle cx="158" cy="40" r="6" fill="#546E7A" ${K}/>
    <path d="M180 86 L206 90 L200 116 Q188 124 176 110 Z" fill="#78909C" ${K}/>
    <path d="M178 112 l-4 8 M188 118 l-2 8 M198 116 l1 8" stroke="#263238" stroke-width="3" stroke-linecap="round"/>
  </g>
  <rect x="18" y="116" width="124" height="32" rx="16" fill="#37474F" ${K}/>
  ${[36, 62, 88, 114].map((x) => `<circle cx="${x}" cy="132" r="9" fill="#90A4AE" ${K}/>`).join('')}
  <rect x="26" y="86" width="104" height="30" rx="8" fill="#FFC107" ${K}/>
  <path d="M40 88 L40 44 Q40 38 46 38 L84 38 Q92 38 94 46 L102 88 Z" fill="#FFC107" ${K}/>
  <path d="M50 48 L82 48 Q86 48 87 52 L92 80 L50 80 Z" fill="#B3E5FC" ${K}/>
  ${eyes ? `
  <g class="eyes">
    <ellipse cx="62" cy="63" rx="7" ry="9" fill="#fff" ${K}/>
    <ellipse cx="80" cy="63" rx="7" ry="9" fill="#fff" ${K}/>
    <circle cx="64" cy="65" r="3.6" fill="#263238"/>
    <circle cx="82" cy="65" r="3.6" fill="#263238"/>
  </g>
  <path d="M63 74 Q71 79 79 74" stroke="#263238" stroke-width="3" fill="none" stroke-linecap="round"/>` : `
  <path d="M56 64 Q62 69 68 64 M74 64 Q80 69 86 64" stroke="#263238" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="71" cy="74" r="3" fill="#263238"/>`}
  <rect x="26" y="98" width="104" height="6" fill="#263238" opacity=".25"/>
</svg>`,

  betoneira: () => `
<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" class="art">
  <rect x="14" y="112" width="186" height="14" rx="4" fill="#455A64" ${K}/>
  <path d="M150 112 L150 58 Q150 50 158 50 L182 50 L204 84 L204 112 Z" fill="#E53935" ${K}/>
  <path d="M160 60 L180 60 L194 84 L160 84 Z" fill="#B3E5FC" ${K}/>
  <rect x="44" y="96" width="14" height="18" fill="#78909C" ${K}/>
  <rect x="108" y="96" width="14" height="18" fill="#78909C" ${K}/>
  <g class="drum">
    <ellipse cx="84" cy="74" rx="66" ry="34" transform="rotate(-10 84 74)" fill="#ECEFF1" ${K}/>
    <path d="M34 60 Q60 100 92 70 Q120 44 140 86" stroke="#FF9800" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M30 82 Q52 62 70 92" stroke="#FF9800" stroke-width="8" fill="none" stroke-linecap="round"/>
  </g>
  <path d="M18 70 L6 92 L18 94 L28 76 Z" fill="#90A4AE" ${K}/>
  ${wheel(44, 128, 15)}${wheel(84, 128, 15)}${wheel(176, 128, 15)}
</svg>`,

  pulverizador: () => `
<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" class="art">
  <rect x="6" y="46" width="208" height="8" rx="4" fill="#546E7A" ${K}/>
  ${[20, 48, 76, 144, 172, 200].map((x) => `
    <path d="M${x} 56 l0 8" stroke="#263238" stroke-width="4"/>
    <path class="drop" d="M${x} 70 q-5 9 0 12 q5 -3 0 -12z" fill="#29B6F6"/>
    <path class="drop d2" d="M${x - 8} 84 q-4 7 0 9 q4 -2 0 -9z" fill="#4FC3F7"/>
    <path class="drop d3" d="M${x + 8} 88 q-4 7 0 9 q4 -2 0 -9z" fill="#4FC3F7"/>`).join('')}
  <rect x="70" y="58" width="80" height="44" rx="20" fill="#F5F5F5" ${K}/>
  <rect x="100" y="52" width="20" height="8" rx="3" fill="#90A4AE" ${K}/>
  <path d="M60 116 L60 80 L96 80 L96 60 Q96 54 102 54 L136 54 Q142 54 142 60 L142 94 L166 96 Q172 97 172 104 L172 116 Z" fill="#43A047" ${K} transform="translate(0 0)"/>
  <path d="M104 62 L134 62 L134 88 L104 88 Z" fill="#B3E5FC" ${K}/>
  ${wheel(84, 118, 26)}${wheel(160, 126, 16)}
</svg>`,

  retro: () => `
<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" class="art">
  <path d="M4 104 L28 104 L34 128 L10 132 Q2 124 4 104 Z" fill="#78909C" ${K}/>
  <path d="M30 108 L62 96" stroke="#263238" stroke-width="12" stroke-linecap="round"/>
  <path d="M30 108 L62 96" stroke="#FFB300" stroke-width="7" stroke-linecap="round"/>
  <path d="M150 98 L182 50" stroke="#263238" stroke-width="16" stroke-linecap="round"/>
  <path d="M150 98 L182 50" stroke="#FFB300" stroke-width="10" stroke-linecap="round"/>
  <path d="M182 50 L206 98" stroke="#263238" stroke-width="12" stroke-linecap="round"/>
  <path d="M182 50 L206 98" stroke="#FFB300" stroke-width="7" stroke-linecap="round"/>
  <path d="M198 94 L216 98 L210 118 Q200 122 194 110 Z" fill="#78909C" ${K}/>
  <path d="M52 118 L52 92 L90 92 L90 50 Q90 44 96 44 L130 44 Q136 44 136 50 L136 92 L158 92 L158 118 Z" fill="#FFC107" ${K}/>
  <path d="M98 52 L128 52 L128 86 L98 86 Z" fill="#B3E5FC" ${K}/>
  ${wheel(76, 122, 18)}${wheel(136, 118, 26)}
</svg>`,

  submarino: () => `
<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" class="art">
  <circle class="bub" cx="30" cy="50" r="6" fill="none" stroke="#4FC3F7" stroke-width="3"/>
  <circle class="bub d2" cx="18" cy="72" r="4" fill="none" stroke="#4FC3F7" stroke-width="3"/>
  <circle class="bub d3" cx="36" cy="30" r="3" fill="none" stroke="#4FC3F7" stroke-width="3"/>
  <path d="M126 42 L126 18 L150 18" stroke="#263238" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M126 42 L126 18 L150 18" stroke="#FDD835" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M104 62 L108 40 L150 40 L154 62 Z" fill="#FDD835" ${K}/>
  <rect x="34" y="58" width="176" height="64" rx="32" fill="#FDD835" ${K}/>
  <path d="M30 76 L10 62 L10 118 L30 104 Z" fill="#FB8C00" ${K}/>
  ${[80, 120, 160].map((x) => `<circle cx="${x}" cy="90" r="12" fill="#B3E5FC" ${K}/>`).join('')}
</svg>`,

  zero: () => `
<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" class="art">
  <ellipse cx="110" cy="80" rx="44" ry="62" fill="none" stroke="#263238" stroke-width="30"/>
  <ellipse cx="110" cy="80" rx="44" ry="62" fill="none" stroke="#5C6BC0" stroke-width="22"/>
</svg>`,
};

// Figura de uma palavra: emoji nativo ou ilustração própria.
export function pic(word, cls = '') {
  if (word.svg) return `<span class="pic svgpic ${cls}">${ART[word.svg]()}</span>`;
  return `<span class="pic emoji ${cls}">${word.e}</span>`;
}
