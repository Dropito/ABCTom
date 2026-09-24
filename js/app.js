import { LETTERS, BY_LETTER, ORDER, PHRASES, LEVELS, letterClips } from './data.js';
import { ART, pic } from './art.js';
import * as A from './audio.js';
import * as S from './store.js';

const app = document.getElementById('app');
let screen = 0; // muda a cada tela; awaits antigos checam e desistem
const alive = (id) => id === screen;
const $ = (sel, root = app) => root.querySelector(sel);

function show(html, cls) {
  screen++;
  A.stopVoice();
  app.className = `screen ${cls}`;
  app.innerHTML = html;
  return screen;
}
function tap(el, fn) {
  if (!el) return;
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    A.unlockAudio();
    fn(e);
  });
}
const praise = () => ['p_bem1', 'p_bem2', 'p_bem3', 'p_bem4'][Math.floor(Math.random() * 4)];
const letterStyle = (x) => `style="--c:${BY_LETTER[x].cor}"`;
const ROUND_COLORS = ['#1E88E5', '#E53935', '#43A047', '#8E24AA', '#FB8C00', '#00897B'];
const homeBtn = '<button class="corner-btn home-btn" aria-label="Início">🏠</button>';

function confetti(x = 50, y = 50) {
  const colors = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA'];
  const box = document.createElement('div');
  box.className = 'confetti';
  box.style.left = x + '%';
  box.style.top = y + '%';
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('i');
    const ang = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 220;
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(ang) * dist - 80 + 'px');
    p.style.setProperty('--r', Math.random() * 720 + 'deg');
    p.style.background = colors[i % colors.length];
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1400);
}

// ---------------- Início ----------------
function home() {
  const n = S.inGarage();
  const id = show(`
    <div class="mascot bob">${ART.escavadeira()}</div>
    <h1 class="logo">ABC <span>do Tom</span></h1>
    <div class="menu">
      <button class="btn play" aria-label="Jogar"><span class="tri"></span></button>
      <div class="menu-row">
        <button class="btn abc" aria-label="Letras"><b style="color:#E53935">A</b><b style="color:#1E88E5">B</b><b style="color:#43A047">C</b></button>
        <button class="btn garage-btn" aria-label="Garagem">🏠<small>${n}</small></button>
        <button class="btn dad" aria-label="Com o papai">🗣️</button>
      </div>
    </div>
    <button class="corner-btn gear" aria-label="Área do papai (segure)"><svg viewBox="0 0 36 36"><circle class="ring" cx="18" cy="18" r="16"/></svg>⚙︎</button>
  `, 'home');
  tap($('.play'), () => session('kid'));
  tap($('.abc'), () => explore());
  tap($('.garage-btn'), () => garage());
  tap($('.dad'), () => session('dad'));
  tap($('.mascot'), () => { A.sfx.vroom(); A.say('p_oi'); });
  holdGate($('.gear'), parent);
  return id;
}

// Portão dos pais: segurar 2 segundos.
function holdGate(el, fn) {
  let t;
  const start = (e) => { e.preventDefault(); el.classList.add('holding'); t = setTimeout(() => { el.classList.remove('holding'); fn(); }, 2000); };
  const cancel = () => { clearTimeout(t); el.classList.remove('holding'); };
  el.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, cancel));
}

// ---------------- Sessão de jogo ----------------
async function session(mode) {
  const sess = S.startSession();
  if (sess.intro) {
    const ok = await intro(sess.intro);
    if (!ok) return;
  }
  while (sess.round < sess.total) {
    const ok = mode === 'dad' ? await dadRound(sess) : await round(sess);
    if (!ok) return;
  }
  for (const x of sess.leveled) {
    const ok = await arrival(x);
    if (!ok) return;
  }
  goodbye();
}

function road(sess) {
  const pct = Math.min(100, (sess.round / sess.total) * 100);
  return `<div class="road"><div class="road-line"></div>
    <div class="mini-esc" style="left:calc(${pct}% * .88)">${ART.escavadeira()}</div><span class="flag">🏁</span></div>`;
}

function intro(x) {
  return new Promise((resolve) => {
    const d = BY_LETTER[x];
    const id = show(`${homeBtn}
      <div class="intro-tag">⭐</div>
      <button class="bigletter pop-in" ${letterStyle(x)}>${x}</button>
      <div class="pics">${d.words.map((w, i) => `<button class="picbtn" data-i="${i}">${pic(w)}</button>`).join('')}</div>
      <button class="btn go hidden" aria-label="Continuar"><span class="tri"></span></button>
    `, 'intro');
    tap($('.home-btn'), () => { resolve(false); home(); });
    tap($('.bigletter'), () => { A.sfx.pop(); A.say(`n_${x}`, `d_${x}`); });
    app.querySelectorAll('.picbtn').forEach((b) => tap(b, () => {
      b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
      A.say(`w_${d.words[b.dataset.i].id}`);
    }));
    tap($('.go'), () => resolve(true));
    A.sfx.fanfare();
    A.wait(700).then(() => alive(id) && A.say('p_nova', 'p_esse', `n_${x}`, `d_${x}`))
      .then(() => alive(id) && $('.go').classList.remove('hidden'));
  });
}

function round(sess) {
  const r = S.nextRound(sess, 'kid');
  const x = r.target;
  // Todas as opções com a mesma cor: ele precisa distinguir pela forma, não pela cor.
  const roundColor = ROUND_COLORS[sess.round % ROUND_COLORS.length];
  const ask = r.type === 'pic' ? [`w_${r.word.id}`, 'p_comeca'] : ['p_cade', `n_${x}`];
  return new Promise((resolve) => {
    const prompt = r.type === 'pic'
      ? `<button class="prompt picprompt">${pic(r.word, 'big')}</button>`
      : `<button class="prompt speaker" aria-label="Ouvir de novo">🔊</button>`;
    const id = show(`${homeBtn}${road({ ...sess, round: sess.round - 1 })}
      ${prompt}
      <div class="opts n${r.opts.length}" data-t="${x}">
        ${r.opts.map((o) => `<button class="tile" data-l="${o}" style="--c:${roundColor}">${o}</button>`).join('')}
      </div>`, 'game');
    let wrong = 0, done = false;
    tap($('.home-btn'), () => { resolve(false); home(); });
    tap($('.prompt'), () => A.say(...ask));
    app.querySelectorAll('.tile').forEach((t) => tap(t, async () => {
      if (done || t.classList.contains('wrong')) return;
      if (t.dataset.l === x) {
        done = true;
        S.record(sess, x, wrong === 0);
        t.classList.add('right');
        app.querySelectorAll('.tile:not(.right)').forEach((o) => o.classList.add('fade'));
        const rect = t.getBoundingClientRect();
        confetti(((rect.left + rect.width / 2) / innerWidth) * 100, ((rect.top + rect.height / 2) / innerHeight) * 100);
        A.sfx.yay();
        const esc = $('.mini-esc');
        if (esc) esc.style.left = `calc(${(sess.round / sess.total) * 100}% * .88)`;
        await A.wait(350);
        await A.say(praise(), `d_${x}`);
        if (!alive(id)) return;
        await A.wait(250);
        resolve(true);
      } else {
        wrong++;
        t.classList.add('wrong');
        A.sfx.boop();
        if (wrong >= 2) app.querySelector(`.tile[data-l="${x}"]`).classList.add('hint');
        A.say('p_denovo', ...ask);
      }
    }));
    A.wait(250).then(() => alive(id) && A.say(...ask));
  });
}

// Jogo com o papai: Tom fala a letra, papai marca se acertou.
function dadRound(sess) {
  const r = S.nextRound(sess, 'dad');
  const x = r.target;
  return new Promise((resolve) => {
    const id = show(`${homeBtn}${road({ ...sess, round: sess.round - 1 })}
      <button class="bigletter" ${letterStyle(x)}>${x}</button>
      <div class="dadbar">
        <button class="dadbtn no" aria-label="Não sabia">✗</button>
        <span>O Tom disse certo?</span>
        <button class="dadbtn yes" aria-label="Acertou">✓</button>
      </div>`, 'game dadgame');
    let done = false;
    tap($('.home-btn'), () => { resolve(false); home(); });
    tap($('.bigletter'), () => A.say('p_qual'));
    const finish = async (ok) => {
      if (done) return;
      done = true;
      S.record(sess, x, ok);
      if (ok) {
        confetti(50, 40);
        A.sfx.yay();
        await A.say(praise(), `d_${x}`);
      } else {
        $('.bigletter').classList.add('wiggle');
        await A.say(`n_${x}`, `d_${x}`);
      }
      if (!alive(id)) return;
      await A.wait(300);
      resolve(true);
    };
    tap($('.yes'), () => finish(true));
    tap($('.no'), () => finish(false));
    A.wait(250).then(() => alive(id) && A.say('p_qual'));
  });
}

// Um veículo novo chega na garagem.
function arrival(x) {
  return new Promise((resolve) => {
    const w = BY_LETTER[x].words[0];
    const id = show(`${homeBtn}
      <div class="arrival-stage">
        <div class="drive-in">${pic(w, 'big')}</div>
        <div class="plate" ${letterStyle(x)}>${x}</div>
      </div>
      <button class="btn go hidden" aria-label="Continuar"><span class="tri"></span></button>`, 'arrival');
    tap($('.home-btn'), () => { resolve(false); home(); });
    tap($('.go'), () => resolve(true));
    tap($('.drive-in'), () => { A.sfx.vroom(); A.say(`d_${x}`); });
    A.sfx.vroom();
    A.wait(1300).then(() => {
      if (!alive(id)) return;
      A.sfx.fanfare();
      confetti(50, 45);
      return A.say('p_garagem', `d_${x}`);
    }).then(() => alive(id) && $('.go').classList.remove('hidden'));
  });
}

function goodbye() {
  const id = show(`
    <div class="mascot sleep">${ART.escavadeira(false)}<span class="zzz">z<b>z</b><i>z</i></span></div>
    <div class="menu-row">
      <button class="btn home2" aria-label="Início">🏠</button>
      <button class="btn garage-btn" aria-label="Garagem">🚗</button>
    </div>`, 'bye');
  tap($('.home2'), home);
  tap($('.garage-btn'), garage);
  A.sfx.yay();
  A.wait(400).then(() => alive(id) && A.say('p_tchau'));
}

// ---------------- Garagem ----------------
function garage() {
  show(`${homeBtn}
    <h2 class="garage-title">🏠 ${S.inGarage()} / ${LETTERS.length}</h2>
    <div class="garage">
      ${LETTERS.map(({ L: x }) => {
        const on = S.L(x).garage;
        return `<button class="spot ${on ? 'on' : ''}" data-l="${x}">
          ${on ? pic(BY_LETTER[x].words[0]) : '<span class="empty"></span>'}
          <span class="plate" ${letterStyle(x)}>${x}</span></button>`;
      }).join('')}
    </div>`, 'garage-screen');
  tap($('.home-btn'), home);
  app.querySelectorAll('.spot').forEach((b) => tap(b, () => {
    const x = b.dataset.l;
    b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
    if (S.L(x).garage) { A.sfx.vroom(); A.say(`d_${x}`); } else { A.sfx.pop(); A.say(`n_${x}`); }
  }));
}

// ---------------- Explorar ----------------
function explore() {
  show(`${homeBtn}
    <div class="alphabet">
      ${LETTERS.map(({ L }) => `<button class="tile small" data-l="${L}" ${letterStyle(L)}>${L}</button>`).join('')}
    </div>`, 'explore');
  tap($('.home-btn'), home);
  app.querySelectorAll('.tile').forEach((t) => tap(t, () => card(t.dataset.l)));
}

function card(x) {
  const i = LETTERS.findIndex((d) => d.L === x);
  const d = LETTERS[i];
  const id = show(`${homeBtn}
    <button class="corner-btn back-btn" aria-label="Letras">🔤</button>
    <button class="arrow prev" aria-label="Anterior">◀</button>
    <button class="arrow next" aria-label="Próxima">▶</button>
    <button class="bigletter pop-in" ${letterStyle(x)}>${x}</button>
    <div class="pics">${d.words.map((w, j) => `<button class="picbtn" data-j="${j}">${pic(w)}</button>`).join('')}</div>`, 'card');
  tap($('.home-btn'), home);
  tap($('.back-btn'), explore);
  tap($('.prev'), () => card(LETTERS[(i + LETTERS.length - 1) % LETTERS.length].L));
  tap($('.next'), () => card(LETTERS[(i + 1) % LETTERS.length].L));
  tap($('.bigletter'), () => { A.sfx.pop(); A.say(`n_${x}`, `d_${x}`); });
  app.querySelectorAll('.picbtn').forEach((b) => tap(b, () => {
    b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
    A.say(`w_${d.words[b.dataset.j].id}`);
  }));
  A.wait(200).then(() => alive(id) && A.say(`n_${x}`, `d_${x}`));
}

// ---------------- Área do papai ----------------
function parent(tab = 'prog') {
  show(`
    <header class="p-head">
      <button class="p-close">✕ Sair</button>
      <nav>
        <button data-t="prog" class="${tab === 'prog' ? 'on' : ''}">Progresso</button>
        <button data-t="rec" class="${tab === 'rec' ? 'on' : ''}">Gravar voz</button>
        <button data-t="cfg" class="${tab === 'cfg' ? 'on' : ''}">Ajustes</button>
      </nav>
    </header>
    <main class="p-body">${tab === 'prog' ? progTab() : tab === 'rec' ? recTab() : cfgTab()}</main>`, 'parent');
  $('.p-close').onclick = home;
  app.querySelectorAll('nav button').forEach((b) => { b.onclick = () => parent(b.dataset.t); });
  if (tab === 'prog') bindProg();
  if (tab === 'rec') bindRec();
  if (tab === 'cfg') bindCfg();
}

function progTab() {
  const s = S.state;
  return `
    <p class="p-note">Toque numa letra para mudar o nível. Letras <b>conhecidas</b> entram na garagem.
      O app introduz no máximo ${s.settings.newPerDay} letra(s) nova(s) por dia, e só quando há menos de 3 letras “aprendendo”.</p>
    <div class="p-grid">
      ${ORDER.map((x) => {
        const l = S.L(x);
        return `<button class="p-letter lv${l.level}" data-l="${x}">
          <b>${x}</b><span>${LEVELS[l.level]}</span><small>${l.hits}/${l.seen} acertos</small></button>`;
      }).join('')}
    </div>
    <p class="p-note">Sessões jogadas: ${s.sessions} · Na garagem: ${S.inGarage()} / ${LETTERS.length}</p>`;
}
function bindProg() {
  app.querySelectorAll('.p-letter').forEach((b) => {
    b.onclick = () => { const x = b.dataset.l; S.setLevel(x, (S.L(x).level + 1) % 5); parent('prog'); };
  });
}

function recRow(c) {
  const has = A.hasRecording(c.id);
  return `<div class="r-row" data-id="${c.id}">
    <span class="r-dot ${has ? 'on' : ''}" title="${has ? 'gravado' : 'voz do iPad'}"></span>
    <span class="r-label">${c.label}</span>
    <button class="r-play">▶</button>
    <button class="r-rec">● Gravar</button>
    ${has ? '<button class="r-del">🗑</button>' : ''}
  </div>`;
}
function recTab() {
  const secure = window.isSecureContext && A.canRecord();
  return `
    <p class="p-note">Grave com calma, perto do microfone, e fale o nome das letras como você quer que o Tom aprenda
      (ex.: “bê”, “éle”). Cada gravação para sozinha em 4 s, ou toque em ■. Sem gravação, o app usa a voz do iPad.
      Gravadas: <b>${A.recordingCount()}</b>.</p>
    ${secure ? '' : '<p class="p-warn">A gravação só funciona com o app aberto por https (endereço publicado) ou localhost.</p>'}
    <h3>Frases</h3>${PHRASES.map(recRow).join('')}
    ${ORDER.map((x) => `<h3 ${letterStyle(x)}><span class="h-letter">${x}</span></h3>${letterClips(BY_LETTER[x]).map(recRow).join('')}`).join('')}`;
}
function bindRec() {
  let active = null;
  app.querySelectorAll('.r-row').forEach((row) => {
    const id = row.dataset.id;
    row.querySelector('.r-play').onclick = () => { A.unlockAudio(); A.say(id); };
    const del = row.querySelector('.r-del');
    if (del) del.onclick = async () => { await A.deleteRecording(id); row.outerHTML = recRow({ ...clipOf(id) }); bindRec(); };
    const btn = row.querySelector('.r-rec');
    btn.onclick = async () => {
      A.unlockAudio();
      if (active) { active.stop(); return; }
      try {
        A.stopVoice();
        btn.textContent = '■ Parar';
        row.classList.add('recording');
        active = await A.record(4000);
        const blob = await active.finished;
        active = null;
        await A.saveRecording(id, blob);
        await A.say(id);
        const y = $('.p-body').scrollTop;
        parent('rec');
        const main = $('.p-body');
        if (main) main.scrollTop = y;
      } catch (e) {
        active = null;
        btn.textContent = '● Gravar';
        row.classList.remove('recording');
        alert('Não consegui acessar o microfone: ' + e.message);
      }
    };
  });
}
function clipOf(id) {
  return [...PHRASES, ...LETTERS.flatMap(letterClips)].find((c) => c.id === id);
}

function cfgTab() {
  const s = S.state.settings;
  const opt = (name, vals, cur) => vals.map((v) => `<button class="chip ${v === cur ? 'on' : ''}" data-k="${name}" data-v="${v}">${v}</button>`).join('');
  return `
    <h3>Rodadas por sessão</h3><div class="chips">${opt('rounds', [6, 8, 10, 12, 15], s.rounds)}</div>
    <p class="p-note">Aos 3 anos, 5–10 minutos por sessão é o ideal. Melhor parar com ele querendo mais.</p>
    <h3>Letras novas por dia (máximo)</h3><div class="chips">${opt('newPerDay', [1, 2, 3], s.newPerDay)}</div>
    <h3>Dicas</h3>
    <ul class="p-list">
      <li><b>Instalar:</b> no Safari, Compartilhar → “Adicionar à Tela de Início”. Abre em tela cheia e funciona offline.</li>
      <li><b>Travar no app:</b> Ajustes → Acessibilidade → Acesso Guiado. No app, clique 3× no botão superior para ativar.</li>
      <li><b>Jogo com o papai</b> (🗣️ na tela inicial): o Tom fala a letra e você marca ✓ ou ✗. Treina o “nomear”, que é o passo depois do “reconhecer”.</li>
      <li><b>Fora da tela:</b> depois de jogar, caça ao tesouro em casa — “vamos achar algo que começa com B?”.</li>
    </ul>
    <h3>Recomeçar</h3>
    <button class="danger reset">Zerar o progresso</button>
    <p class="p-note">As gravações de voz são mantidas.</p>`;
}
function bindCfg() {
  app.querySelectorAll('.chip').forEach((c) => {
    c.onclick = () => { S.state.settings[c.dataset.k] = Number(c.dataset.v); S.save(); parent('cfg'); };
  });
  $('.reset').onclick = () => { if (confirm('Zerar todo o progresso do Tom?')) { S.reset(); parent('prog'); } };
}

// ---------------- Boot ----------------
A.loadRecordings().then(home);
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
document.addEventListener('gesturestart', (e) => e.preventDefault());
