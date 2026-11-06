/*
 * app.js — interface do UniMatch.
 *
 * O site é uma "página única": cada tela tem um endereço próprio depois do #
 * (ex: #/curso/estatistica), então dá pra compartilhar links e usar o botão
 * "voltar" do celular normalmente. Os dados vêm de data.js e a pontuação do
 * quiz vem de js/scoring.js.
 */
(function () {
  "use strict";

  const S = window.UniMatchScoring;
  const app = document.getElementById("app");
  const COURSE_NAMES = Object.keys(COURSES).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const SLUG_TO_NAME = {};
  COURSE_NAMES.forEach(n => { SLUG_TO_NAME[S.slugify(n)] = n; });

  const AREAS = {
    saude:      { label: "Saúde",      emoji: "🏥" },
    exatas:     { label: "Exatas",     emoji: "🔬" },
    tecnologia: { label: "Tecnologia", emoji: "💻" },
    humanas:    { label: "Humanas",    emoji: "👥" },
    negocios:   { label: "Negócios",   emoji: "📊" },
    artes:      { label: "Artes",      emoji: "🎨" },
    ambiental:  { label: "Ambiental",  emoji: "🌿" }
  };
  const MODALIDADES = {
    ac:  { sigla: "AC",  label: "Ampla Concorrência" },
    ep:  { sigla: "EP",  label: "Escola Pública" },
    ppi: { sigla: "PPI", label: "Escola Pública + PPI (pretos, pardos e indígenas)" }
  };
  // frase: abre a descrição do perfil (1ª letra) · frase2: completa com a 2ª letra
  const RIASEC_INFO = {
    R: { nome: "Realista",      desc: "prático e mão na massa", frase: "Você curte fazer coisas acontecerem na prática, com as mãos, ferramentas ou na natureza.", frase2: "E também tem um lado prático, de pôr a mão na massa." },
    I: { nome: "Investigativo", desc: "analítico e investigativo", frase: "Você gosta de entender como as coisas funcionam e de resolver problemas difíceis.", frase2: "E também tem um lado curioso, de investigar e entender o porquê." },
    A: { nome: "Artístico",     desc: "criativo e expressivo", frase: "Você gosta de criar, imaginar e se expressar do seu jeito.", frase2: "E também tem um lado criativo, de inventar e se expressar." },
    S: { nome: "Social",        desc: "empático e social", frase: "Você gosta de ajudar, ensinar e cuidar de pessoas.", frase2: "E também tem um lado de cuidar e ajudar as pessoas." },
    E: { nome: "Empreendedor",  desc: "persuasivo e articulado", frase: "Você gosta de liderar, convencer e fazer projetos saírem do papel.", frase2: "E também tem um lado líder, de convencer e tomar a frente." },
    C: { nome: "Convencional",  desc: "organizado e detalhista", frase: "Você gosta de organização, de dados e de fazer as coisas com precisão.", frase2: "E também tem um lado organizado, atento aos detalhes." }
  };

  /* ── ESTADO (salvo no navegador do aluno) ── */
  const STORE_KEY = "um_state_v2";
  // Muda sozinho quando as perguntas mudam; respostas de um quiz antigo são descartadas.
  const QUIZ_VERSION = QUESTIONS.map(q => q.dim + (q.letra || "") + q.opts.length).join("|");
  const state = {
    answers: [],      // respostas do quiz em andamento
    q: 0,             // pergunta atual
    lastCode: "",     // código do último resultado concluído
    favorites: [],
    matchNo: [],      // cursos que o aluno passou no Modo Match
    explorar: { search: "", area: "all", modalidade: "ep", maxNota: 90, minSal: 0, sort: "az" }
  };

  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      if (s.quizVersion === QUIZ_VERSION) {
        if (Array.isArray(s.answers)) state.answers = s.answers;
        if (Number.isInteger(s.q)) state.q = s.q;
      }
      if (typeof s.lastCode === "string") state.lastCode = s.lastCode;
      if (Array.isArray(s.favorites)) state.favorites = s.favorites;
      if (Array.isArray(s.matchNo)) state.matchNo = s.matchNo;
      // Aproveita favoritos salvos pela versão antiga do site.
      if (!s.favorites) {
        const old = JSON.parse(localStorage.getItem("um5_state") || "{}");
        if (Array.isArray(old.favorites)) state.favorites = old.favorites;
      }
    } catch (e) { /* armazenamento indisponível: segue sem salvar */ }
    state.favorites = state.favorites.filter(n => COURSES[n]);
    state.matchNo = state.matchNo.filter(n => COURSES[n]);
    if (state.q < 0 || state.q >= QUESTIONS.length) state.q = 0;
    if (state.lastCode && !S.decodeAnswers(QUESTIONS, state.lastCode)) state.lastCode = "";
  }
  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        quizVersion: QUIZ_VERSION, answers: state.answers, q: state.q, lastCode: state.lastCode, favorites: state.favorites, matchNo: state.matchNo
      }));
    } catch (e) {}
  }

  /* ── UTILITÁRIOS ── */
  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function safeUrl(u) {
    return /^(https?:|mailto:)/i.test(String(u || "")) ? esc(u) : "";
  }
  // Fotos salvas no próprio projeto (img/pessoas/), com créditos em js/fotos.js.
  // Esse arquivo é gerado por ferramentas/baixar-fotos.html.
  function foto(nome) {
    const f = typeof FOTOS !== "undefined" ? FOTOS[nome] : null;
    return f && /^img\/pessoas\/[a-z0-9-]+\.(jpg|png|webp|gif)$/.test(f.arquivo) ? f : null;
  }
  function initials(nome) {
    return String(nome).split(/\s+/).filter(w => /^[A-ZÀ-Ý]/.test(w)).map(w => w[0]).slice(0, 2).join("");
  }
  function money(n) { return "R$ " + Number(n).toLocaleString("pt-BR"); }
  function courseUrl(name) { return "#/curso/" + S.slugify(name); }
  function siteBase() { return location.href.split("#")[0]; }
  function isFav(name) { return state.favorites.includes(name); }

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function copyText(text, okMsg) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => toast(okMsg), () => window.prompt("Copie o link:", text));
    } else {
      window.prompt("Copie o link:", text);
    }
  }

  function shareOrCopy(title, url) {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      copyText(url, "🔗 Link copiado!");
    }
  }

  function toggleFavorite(name) {
    const i = state.favorites.indexOf(name);
    if (i === -1) { state.favorites.push(name); toast("❤️ Adicionado aos favoritos"); }
    else { state.favorites.splice(i, 1); toast("Removido dos favoritos"); }
    saveState();
  }

  function favButton(name) {
    const on = isFav(name);
    return `<button class="fav-btn" type="button" data-fav="${esc(name)}" aria-pressed="${on}"
      aria-label="${on ? "Remover dos favoritos" : "Adicionar aos favoritos"}: ${esc(name)}">${on ? "❤️" : "🤍"}</button>`;
  }

  // Delegação: qualquer botão de favorito em qualquer tela.
  app.addEventListener("click", e => {
    const btn = e.target.closest("[data-fav]");
    if (!btn) return;
    e.preventDefault();
    const name = btn.dataset.fav;
    toggleFavorite(name);
    const on = isFav(name);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", `${on ? "Remover dos favoritos" : "Adicionar aos favoritos"}: ${name}`);
    btn.textContent = on ? "❤️" : "🤍";
    if (currentRoute === "explorar" && state.explorar.area === "favoritos") renderExplorarList();
  });

  function contactHref(subject, body) {
    if (SITE_CONFIG.formularioContato) return safeUrl(SITE_CONFIG.formularioContato);
    return "mailto:" + esc(SITE_CONFIG.contatoEmail) + "?subject=" + encodeURIComponent(subject) +
      (body ? "&body=" + encodeURIComponent(body) : "");
  }
  function externalAttrs(href) {
    return href.startsWith("mailto:") ? "" : ' target="_blank" rel="noopener"';
  }

  function resultsFromCode(code) {
    const answers = S.decodeAnswers(QUESTIONS, code);
    if (!answers) return null;
    return { answers, ranked: S.computeScores(QUESTIONS, COURSES, answers), userVec: S.buildUserVector(QUESTIONS, answers) };
  }

  /* ══════════ TELAS ══════════ */

  function renderHome() {
    const total = COURSE_NAMES.length;
    const last = state.lastCode ? resultsFromCode(state.lastCode) : null;
    app.innerHTML = `
      <section class="hero">
        <div class="hero-logo" aria-hidden="true">Uni<span>Match</span></div>
        <h1 class="hero-title">O seu futuro na <em>universidade pública</em> começa aqui</h1>
        <p class="hero-desc">Descubra quais dos ${total} cursos da USP combinam com você, veja as notas de corte
          (incluindo a cota de escola pública) e conheça cada carreira. Grátis e feito para quem estuda em escola pública.</p>
        <div class="btn-row">
          <a class="btn btn-primary btn-block btn-lg" href="#/quiz">✦ Fazer o quiz · 5 min</a>
        </div>
        ${last ? `<p class="small" style="margin-top:12px"><a href="#/resultado/${esc(state.lastCode)}">Ver meu último resultado${S.isFlatProfile(last.userVec) ? "" : ` (${S.hollandCode(last.userVec)})`} →</a></p>` : ""}
      </section>

      <section class="section entry-grid">
        <a class="entry-card" href="#/quiz">
          <span class="entry-emoji" aria-hidden="true">✦</span>
          <strong>Quiz vocacional</strong>
          <span class="tiny">30 perguntas rápidas e um ranking dos cursos que combinam com você</span>
        </a>
        <a class="entry-card" href="#/match">
          <span class="entry-emoji" aria-hidden="true">💘</span>
          <strong>Modo Match</strong>
          <span class="tiny">Deslize pelos cursos e guarde os que chamarem sua atenção</span>
        </a>
        <a class="entry-card" href="#/explorar">
          <span class="entry-emoji" aria-hidden="true">🔍</span>
          <strong>Explorar cursos</strong>
          <span class="tiny">Busque por nome, área, nota de corte ou salário</span>
        </a>
      </section>

      <section class="section card">
        <h2 class="section-title">Como funciona</h2>
        <div class="steps">
          <div class="step"><span class="step-num">1</span><p>Diga o quanto você gosta de atividades do dia a dia. Se já tem um curso em mente, conta pra gente.</p></div>
          <div class="step"><span class="step-num">2</span><p>Descubra seu código vocacional (como "SIA") e os cursos que mais combinam, com o porquê de cada um.</p></div>
          <div class="step"><span class="step-num">3</span><p>Abra cada curso para ver carreiras, salários, notas de corte e quem estudou aquilo.</p></div>
        </div>
      </section>
      ${renderFooter()}`;
  }

  function renderFooter() {
    const href = contactHref("UniMatch — problema ou sugestão");
    return `
      <footer class="site-footer">
        <div class="card">
          <h2>Sobre o projeto</h2>
          <p>O UniMatch é um projeto do grupo Integra, voltado para
            estudantes de escolas públicas. O objetivo é diminuir a desigualdade de informação na hora
            de escolher um curso. <a href="#/sobre">Saiba mais e veja as fontes dos dados</a>.</p>
        </div>
        <div class="card">
          <h2>Suporte e contato</h2>
          <p>Achou um erro nos dados ou tem uma sugestão? Fale com a equipe.</p>
          <div class="footer-links">
            <a class="btn btn-secondary btn-sm" href="${href}"${externalAttrs(href)}>✉️ Reportar problema / Sugestões</a>
            ${SITE_CONFIG.instagram ? `<a class="btn btn-ghost btn-sm" href="${safeUrl(SITE_CONFIG.instagram)}" target="_blank" rel="noopener">📸 Instagram</a>` : ""}
          </div>
        </div>
      </footer>`;
  }

  /* ── QUIZ ── */
  function renderQuizStart() {
    const inProgress = state.answers.some(a => a !== undefined && a !== null) && state.q > 0;
    app.innerHTML = `
      <section class="card">
        <div class="eyebrow">Quiz vocacional</div>
        <h1 class="page-title">Encontre seu curso</h1>
        <p class="page-sub">São cerca de 30 perguntas rápidas, uns 5 minutos. Não existe resposta certa: escolha o que mais
          tem a ver com você hoje. No fim, você vê um ranking dos ${COURSE_NAMES.length} cursos por afinidade.</p>
        <div class="btn-row">
          ${inProgress
            ? `<button class="btn btn-primary btn-block" type="button" id="continue-btn">Continuar de onde parei (pergunta ${progressInfo(state.q).n})</button>
               <button class="btn btn-ghost btn-block" type="button" id="restart-btn">Começar de novo</button>`
            : `<button class="btn btn-primary btn-block" type="button" id="start-btn">Começar agora →</button>`}
        </div>
        ${state.lastCode ? `<p class="small" style="margin-top:16px"><a href="#/resultado/${esc(state.lastCode)}">Ver meu último resultado</a></p>` : ""}
      </section>`;
    const start = () => { state.answers = []; state.q = 0; saveState(); renderQuestion(); };
    const el = id => document.getElementById(id);
    if (el("start-btn")) el("start-btn").onclick = start;
    if (el("restart-btn")) el("restart-btn").onclick = start;
    if (el("continue-btn")) el("continue-btn").onclick = renderQuestion;
  }

  // Perguntas condicionais (ex: "Quanto você já está decidido?") só contam
  // quando estão ativas; a numeração "Pergunta X de Y" acompanha isso.
  const isActive = i => S.isQuestionActive(QUESTIONS, state.answers, i);
  function progressInfo(qi) {
    let n = 0, total = 0;
    QUESTIONS.forEach((q, i) => { if (i === qi || isActive(i)) { total++; if (i <= qi) n++; } });
    return { n, total, pct: Math.round(((n - 1) / total) * 100) };
  }
  function progressHTML(qi) {
    const p = progressInfo(qi);
    return `<div class="progress" aria-hidden="true">
      <div class="progress-meta"><span>Pergunta ${p.n} de ${p.total}</span><span>${p.pct}%</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${p.pct}%"></div></div>
    </div>`;
  }
  function advance(qi, value) {
    state.answers[qi] = value;
    let j = qi + 1;
    while (j < QUESTIONS.length && !isActive(j)) { state.answers[j] = S.skipValue(QUESTIONS[j]); j++; }
    if (j >= QUESTIONS.length) { finishQuiz(); return; }
    state.q = j;
    saveState();
    renderQuestion();
    focusMain();
  }
  function goBack(qi) {
    let j = qi - 1;
    while (j > 0 && !isActive(j)) j--;
    state.q = Math.max(0, j);
    saveState();
    renderQuestion();
    focusMain();
  }
  const isLast = qi => !QUESTIONS.some((q, j) => j > qi && (isActive(j) || !q.showIf));

  function renderQuestion() {
    const qi = state.q;
    const q = QUESTIONS[qi];
    const total = QUESTIONS.length;
    const current = state.answers[state.q];
    let selected = q.multi ? (Array.isArray(current) ? [...current] : []) : (current && current !== S.skipValue(q) ? current : null);
    if (q.picker) { renderCoursePicker(qi, q, selected); return; }
    const pn = progressInfo(qi);

    app.innerHTML = `
      <section class="card">
        ${progressHTML(qi)}
        <div class="eyebrow">${q.dim === "likert" ? "Parte 1 de 2 · Seus interesses" : "Parte 2 de 2 · Suas preferências"}</div>
        ${q.dim === "likert" ? `<p class="question-hint" style="margin-bottom:6px">Quanto você gostaria de fazer isso?</p>` : ""}
        <h1 class="question-text" id="q-title"><span class="visually-hidden">Pergunta ${pn.n} de ${pn.total}: </span>${esc(q.q)}</h1>
        ${q.dim === "certeza" ? `<p class="question-hint">Sobre ${esc(S.getChosenCourses(QUESTIONS, COURSES, state.answers).join(", "))}. Quanto mais decidido(a), mais peso ${S.getChosenCourses(QUESTIONS, COURSES, state.answers).length > 1 ? "esses cursos ganham" : "esse curso ganha"} no resultado.</p>`
          : q.dim === "likert" ? "" : `<p class="question-hint">${q.multi ? "Pode marcar mais de uma." : "Escolha uma opção."}</p>`}
        <div class="options" role="${q.multi ? "group" : "radiogroup"}" aria-labelledby="q-title">
          ${q.opts.map((o, i) => o.skip ? "" : `
            <button type="button" class="option${q.multi ? " multi" : ""}" role="${q.multi ? "checkbox" : "radio"}"
              data-i="${i}" aria-checked="false">
              <span class="option-emoji" aria-hidden="true">${esc(o.e)}</span>
              <span class="option-text">${esc(o.t)}</span>
              <span class="option-check" aria-hidden="true">✓</span>
            </button>`).join("")}
        </div>
        <div class="quiz-nav">
          ${state.q > 0 ? `<button class="btn btn-ghost" type="button" id="back-btn">← Voltar</button>` : ""}
          <button class="btn btn-primary" type="button" id="next-btn">${isLast(qi) ? "Ver resultado ✦" : "Próxima →"}</button>
        </div>
      </section>`;

    const buttons = [...app.querySelectorAll(".option")];
    const optOf = b => q.opts[Number(b.dataset.i)];
    const next = document.getElementById("next-btn");
    function paint() {
      buttons.forEach(b => {
        const v = optOf(b).v;
        b.setAttribute("aria-checked", String(q.multi ? selected.includes(v) : selected === v));
      });
      next.disabled = q.multi ? selected.length === 0 : !selected;
    }
    paint();

    buttons.forEach(b => b.addEventListener("click", () => {
      const opt = optOf(b);
      if (!q.multi) {
        selected = opt.v;
        paint();
        // Avança sozinho nas perguntas de escolha única (dá pra voltar se errar).
        setTimeout(() => { if (state.answers[qi] !== selected) goNext(); }, 220);
        return;
      }
      if (opt.exclusive) selected = selected.includes(opt.v) ? [] : [opt.v];
      else {
        const exclusive = q.opts.filter(o => o.exclusive).map(o => o.v);
        selected = selected.includes(opt.v)
          ? selected.filter(v => v !== opt.v)
          : [...selected.filter(v => !exclusive.includes(v)), opt.v];
      }
      paint();
    }));

    function goNext() {
      // Ignora cliques/temporizadores que chegam depois de a pergunta já ter mudado.
      if (state.q !== qi || !app.contains(next)) return;
      if (q.multi ? selected.length === 0 : !selected) return;
      advance(qi, selected);
    }
    next.addEventListener("click", goNext);
    const back = document.getElementById("back-btn");
    if (back) back.addEventListener("click", () => goBack(qi));
  }

  // Pergunta "Já tem algum curso que te interessa?": busca + etiquetas,
  // porque 95 botões não caberiam na tela do celular.
  function renderCoursePicker(qi, q, selected) {
    const pn = progressInfo(qi);
    const none = q.opts.find(o => o.exclusive).v;
    const courseOpts = q.opts.filter(o => !o.exclusive);
    app.innerHTML = `
      <section class="card">
        ${progressHTML(qi)}
        <div class="eyebrow">Parte 2 de 2 · Suas preferências</div>
        <h1 class="question-text" id="q-title"><span class="visually-hidden">Pergunta ${pn.n} de ${pn.total}: </span>${esc(q.q)}</h1>
        <p class="question-hint">Se você já pensa em algum curso, escolha até ${q.max}. Ele e os cursos parecidos ganham pontos no resultado. Na próxima pergunta você diz o quanto já está decidido(a).</p>
        <div class="picked" id="picked" aria-live="polite"></div>
        ${state.favorites.length ? `<p class="tiny" style="margin:4px 0 6px">Dos seus favoritos:</p>
          <div class="chips" id="pick-favs">${state.favorites.map(n => `<button type="button" class="chip" data-quick="${esc(n)}">＋ ${esc(n)}</button>`).join("")}</div>` : ""}
        <label class="visually-hidden" for="pick-search">Buscar curso</label>
        <input class="search" id="pick-search" type="search" placeholder="Digite o nome do curso…" autocomplete="off">
        <ul class="pick-list" id="pick-list" role="group" aria-labelledby="q-title"></ul>
        <button type="button" class="option multi" id="pick-none" role="checkbox" aria-checked="false" style="margin:12px 0 20px">
          <span class="option-emoji" aria-hidden="true">🤷</span>
          <span class="option-text">Ainda não tenho nenhum em mente</span>
          <span class="option-check" aria-hidden="true">✓</span>
        </button>
        <div class="quiz-nav">
          <button class="btn btn-ghost" type="button" id="back-btn">← Voltar</button>
          <button class="btn btn-primary" type="button" id="next-btn">Próxima →</button>
        </div>
      </section>`;
    const $ = id => document.getElementById(id);
    const search = $("pick-search"), list = $("pick-list"), picked = $("picked"), noneBtn = $("pick-none"), next = $("next-btn");

    function paint() {
      const chosen = selected.filter(v => v !== none);
      picked.innerHTML = chosen.map(v => `<button type="button" class="pick-chip" data-remove="${esc(v)}" aria-label="Remover ${esc(v)}">${esc(v)} ✕</button>`).join("");
      noneBtn.setAttribute("aria-checked", String(selected.includes(none)));
      const term = S.normalize(search.value.trim());
      const full = chosen.length >= q.max;
      const matches = term ? courseOpts.filter(o => S.normalize(o.t).includes(term)).slice(0, 8) : [];
      list.innerHTML = term && !matches.length ? `<li class="tiny" style="padding:8px 4px">Nenhum curso com esse nome na nossa lista.</li>`
        : matches.map(o => {
          const on = chosen.includes(o.v);
          return `<li><button type="button" class="option multi" role="checkbox" aria-checked="${on}" data-pick="${esc(o.v)}" ${full && !on ? "disabled" : ""}>
            <span class="option-text">${esc(o.t)}</span><span class="option-check" aria-hidden="true">✓</span></button></li>`;
        }).join("");
      next.disabled = selected.length === 0;
    }

    search.addEventListener("input", paint);
    list.addEventListener("click", e => {
      const b = e.target.closest("[data-pick]");
      if (!b || b.disabled) return;
      const v = b.dataset.pick;
      selected = selected.includes(v) ? selected.filter(x => x !== v) : [...selected.filter(x => x !== none), v];
      search.value = "";
      paint();
      search.focus();
    });
    const favs = $("pick-favs");
    if (favs) favs.addEventListener("click", e => {
      const b = e.target.closest("[data-quick]");
      if (!b) return;
      const v = b.dataset.quick;
      if (!selected.includes(v) && selected.filter(x => x !== none).length < q.max) {
        selected = [...selected.filter(x => x !== none), v];
        paint();
      }
    });
    picked.addEventListener("click", e => {
      const b = e.target.closest("[data-remove]");
      if (b) { selected = selected.filter(x => x !== b.dataset.remove); paint(); }
    });
    noneBtn.addEventListener("click", () => { selected = selected.includes(none) ? [] : [none]; paint(); });
    next.addEventListener("click", () => {
      if (state.q !== qi || !selected.length) return;
      advance(qi, selected);
    });
    $("back-btn").addEventListener("click", () => goBack(qi));
    paint();
  }

  function finishQuiz() {
    QUESTIONS.forEach((q, i) => { if (!isActive(i)) state.answers[i] = S.skipValue(q); });
    const answers = state.answers.slice(0, QUESTIONS.length);
    if (!S.isValidAnswers(QUESTIONS, answers)) {
      // Alguma resposta ficou faltando (ex: quiz mudou desde a última visita).
      const missing = QUESTIONS.findIndex((q, i) => !S.isValidAnswers([q], [answers[i]]));
      state.q = Math.max(0, missing);
      saveState();
      renderQuestion();
      toast("Falta responder esta pergunta.");
      return;
    }
    const code = S.encodeAnswers(QUESTIONS, answers);
    state.lastCode = code;
    state.answers = [];
    state.q = 0;
    saveState();
    app.innerHTML = `<section class="card" style="text-align:center"><div class="spinner" aria-hidden="true"></div>
      <h1 class="section-title" role="status">Calculando seus resultados…</h1></section>`;
    setTimeout(() => { location.hash = "#/resultado/" + code; }, 500);
  }

  /* ── RESULTADOS ── */
  let resultsShowAll = false;

  function renderResults(code) {
    const res = resultsFromCode(code);
    if (!res) {
      app.innerHTML = `<section class="card"><h1 class="page-title">Link de resultado inválido</h1>
        <p class="page-sub">Esse link pode ser de uma versão antiga do quiz. Que tal refazer? Leva uns 5 minutos.</p>
        <a class="btn btn-primary btn-block" href="#/quiz">Fazer o quiz</a></section>`;
      return;
    }
    if (code !== state.lastCode) { state.lastCode = code; saveState(); }
    const { answers, ranked, userVec } = res;
    const certainty = S.getCertainty(QUESTIONS, COURSES, answers);
    const chosen = S.getChosenCourses(QUESTIONS, COURSES, answers);
    const decided = certainty === "3";
    // Quem já decidiu vê o próprio curso no topo; a lista abaixo mostra os outros.
    const list = decided ? ranked.filter(r => !chosen.includes(r.name)) : ranked;
    const shown = resultsShowAll ? list : list.slice(0, 10);
    const top = ranked.slice(0, 5).map(r => r.name);
    const wild = S.outOfBox(ranked, COURSES);

    app.innerHTML = `
      <section>
        <div class="eyebrow">✦ Seus resultados</div>
        <h1 class="page-title">${decided ? "Seu curso e o seu perfil" : "Cursos que combinam com você"}</h1>
        ${hollandBlock(userVec)}
        <details class="profile-box">
          <summary>Ver seu perfil completo</summary>
          ${profileSummary(answers, userVec)}
        </details>
      </section>

      ${decided ? decidedBlock(chosen, ranked, answers) : chosenBox(answers, ranked)}

      <section class="section">
        <h2 class="section-title">${decided ? "Outros cursos que combinam com seu perfil" : "Cursos mais compatíveis"}</h2>
        <p class="tiny" style="margin-bottom:10px">Cursos com compatibilidade parecida ficam na mesma faixa: a ordem dentro dela é só um desempate.</p>
        <ol class="rank-list">${shown.map((r, i) => rankItem(r, i, answers, i < 3)).join("")}</ol>
        ${list.length > 10 ? `<button class="btn btn-ghost btn-block" type="button" id="toggle-all" style="margin-top:12px">
          ${resultsShowAll ? "Mostrar só os 10 primeiros" : `Ver todos os ${list.length} cursos`}</button>` : ""}
      </section>

      ${wild ? `<section class="section card wild-card">
        <div class="eyebrow">🎲 Fora da caixa</div>
        <h2 class="section-title">Já pensou em ${esc(wild.name)}?</h2>
        <p class="muted small">É de uma área diferente das suas primeiras recomendações, mas também combina com você.
          Vale conhecer antes de descartar: muita gente descobre o curso certo assim.</p>
        <a class="btn btn-secondary btn-sm" href="${courseUrl(wild.name)}" style="margin-top:10px">Conhecer o curso</a>
      </section>` : ""}

      <section class="section card">
        <h2 class="section-title">📲 Compartilhar e guardar</h2>
        <div class="btn-row">
          <button class="btn btn-primary" type="button" id="card-btn">🖼️ Gerar imagem para Stories</button>
          <a class="btn btn-secondary" href="${whatsappHref(code, ranked, userVec)}" target="_blank" rel="noopener">💬 Mandar no WhatsApp</a>
        </div>
        <div class="btn-row" style="margin-top:10px">
          <a class="btn btn-ghost" href="${emailResultsHref(code, ranked)}">✉️ Enviar para o meu e-mail</a>
          <button class="btn btn-ghost" type="button" id="share-btn">🔗 Copiar link</button>
        </div>
        <p class="note">Nada é guardado nos nossos servidores: o link e a imagem carregam o resultado.</p>
      </section>

      ${nextSteps(decided ? chosen : ranked.slice(0, 3).map(r => r.name))}

      ${renderVeteransSection(decided ? chosen.concat(top) : top)}

      ${SITE_CONFIG.formularioFeedback ? `<section class="section card">
        <h2 class="section-title">Esse resultado fez sentido pra você?</h2>
        <p class="muted small">Sua resposta é anônima e ajuda a melhorar o quiz.</p>
        <div class="btn-row" style="margin-top:12px">
          <a class="btn btn-secondary" href="${safeUrl(SITE_CONFIG.formularioFeedback)}" target="_blank" rel="noopener">👍 👎 Responder em 1 minuto</a>
        </div></section>` : ""}

      <p class="disclaimer section">Este resultado é uma estimativa a partir das suas respostas, não uma avaliação
        vocacional profissional. Use como ponto de partida para pesquisar e conversar, não como decisão final.</p>

      <div class="btn-row section">
        <a class="btn btn-ghost" href="#/quiz" id="redo-btn">↩ Refazer o quiz</a>
        <a class="btn btn-ghost" href="#/match">💘 Modo Match</a>
      </div>`;

    const toggle = document.getElementById("toggle-all");
    if (toggle) toggle.onclick = () => { resultsShowAll = !resultsShowAll; renderResults(code); };
    document.getElementById("share-btn").onclick = () =>
      copyText(resultUrl(code), "🔗 Link copiado!");
    document.getElementById("card-btn").onclick = () => shareResultCard(code, ranked, userVec, decided ? chosen : null);
    document.getElementById("redo-btn").onclick = () => { state.answers = []; state.q = 0; saveState(); };
  }

  function resultUrl(code) { return publicBase() + "#/resultado/" + code; }
  // Endereço público do site (para links compartilhados). Em testes locais, usa o endereço atual.
  function publicBase() {
    const local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === "file:";
    return (!local && SITE_CONFIG.siteUrl ? SITE_CONFIG.siteUrl.replace(/\/$/, "") + "/" : siteBase());
  }

  function rankItem(r, i, answers, top) {
    const c = COURSES[r.name];
    const why = S.explain(r, c, QUESTIONS, answers);
    return `<li><a class="rank-item${top ? " top" : ""}" href="${courseUrl(r.name)}">
      <span class="rank-pos">${i + 1}º</span>
      <span>
        <span class="rank-name">${esc(r.name)}</span>
        <span class="band band-${r.band.key}">${r.band.label}</span>
        ${why.pros.length ? `<span class="rank-why">✓ ${esc(why.pros[0])}</span>` : ""}
        <span class="rank-meta">${AREAS[c.area].emoji} ${esc(AREAS[c.area].label)} · ${esc(c.dur)} anos · FUVEST EP ${c.fuvest ? c.fuvest.ep + "/90" : "—"}</span>
      </span>
    </a></li>`;
  }

  function hollandBlock(vec) {
    if (S.isFlatProfile(vec)) {
      return `<div class="holland flat"><div class="holland-letters" aria-hidden="true">?</div>
        <p class="small">Você marcou quase tudo com a mesma intensidade, então ainda não aparece um tipo dominante.
          Tudo bem: o Modo Match e a página de cada curso ajudam a descobrir do que você gosta mais.</p></div>`;
    }
    const code = S.hollandCode(vec);
    return `<div class="holland">
      <div class="holland-letters" aria-label="Seu código Holland: ${code.split("").map(l => RIASEC_INFO[l].nome).join(", ")}">
        ${code.split("").map(l => `<span title="${RIASEC_INFO[l].nome}">${l}</span>`).join("")}
      </div>
      <div>
        <div class="holland-title">Seu código: ${code.split("").map(l => RIASEC_INFO[l].nome).join(" · ")}</div>
        <p class="small muted">${RIASEC_INFO[code[0]].frase} ${RIASEC_INFO[code[1]].frase2}</p>
      </div>
    </div>`;
  }

  // Para quem respondeu "Já decidi": o curso escolhido vem primeiro, com o que
  // combina, o que vale checar e cursos parecidos. A ideia é ajudar a confirmar
  // a escolha (sem brigar com ela) e evitar decidir sem conhecer o curso de perto.
  function decidedBlock(chosen, ranked, answers) {
    return chosen.map((n, k) => {
      const r = ranked.find(x => x.name === n), pos = ranked.indexOf(r) + 1;
      const c = COURSES[n];
      const why = S.explain(r, c, QUESTIONS, answers);
      const similar = S.similarCourses(n, COURSES, 3);
      return `<section class="section card decided-card">
        <div class="eyebrow">🎯 ${k === 0 ? "O curso que você escolheu" : "Também escolhido por você"}</div>
        <h2 class="detail-title" style="font-size:1.4rem">${esc(n)}</h2>
        <div class="badges"><span class="band band-${r.band.key}">${r.band.label} com seu perfil</span>
          <span class="badge">${pos}º no ranking geral</span></div>
        ${why.pros.length ? `<h3 class="small" style="margin-top:12px">O que combina com você</h3>
          <ul class="why-list good">${why.pros.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        ${why.cons.length ? `<h3 class="small" style="margin-top:10px">O que vale checar antes</h3>
          <ul class="why-list warn">${why.cons.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        ${r.band.key === "baixa" ? `<p class="note">Seu perfil de interesses aponta também para outros caminhos, e isso é mais comum do que parece.
          Não quer dizer que você não deva fazer ${esc(n)}: muita gente se dá bem num curso por motivos que um quiz não mede.
          Só vale conhecer bem o dia a dia do curso antes de bater o martelo.</p>` : ""}
        <h3 class="small" style="margin-top:12px">Antes de bater o martelo</h3>
        <ul class="list-plain small">
          <li><a href="${courseUrl(n)}">Veja o que estuda, as carreiras e a nota de corte de ${esc(n)}</a></li>
          <li>Converse com alguém que faz o curso: pergunte como é a rotina e o que surpreende no começo</li>
          <li>Conheça também os mais parecidos: ${similar.map(x => `<a href="${courseUrl(x)}">${esc(x)}</a>`).join(", ")}</li>
        </ul>
      </section>`;
    }).join("");
  }

  function profileSummary(answers, vec) {
    const mathLabels = { 3: "adora", 2: "se vira bem com", 1: "prefere só o básico de", 0: "prefere evitar" };
    const techLabels = { 3: "quer criar tecnologia", 2: "quer usar bastante tecnologia", 1: "usa tecnologia só no dia a dia", 0: "prefere ficar longe de programação" };
    const dur = S.getAnswer(QUESTIONS, answers, "duration");
    const durLabel = dur === "4" ? "de até 4 anos" : dur === "5" ? "de até 5 anos" : "de até 6 anos ou mais";
    const areas = S.getAreaFilter(QUESTIONS, answers);
    const areaNote = areas
      ? `Os cursos de <strong>${areas.map(x => esc(AREAS[x].label)).join(", ")}</strong>, que você marcou, ganham um bônus. Cursos de outras áreas ainda aparecem se combinarem muito com você.`
      : `Você não marcou uma área específica, então todas as áreas entram em pé de igualdade.`;
    return `<p class="small" style="margin-top:10px">Você ${mathLabels[S.getAnswer(QUESTIONS, answers, "math")]} matemática,
      ${techLabels[S.getAnswer(QUESTIONS, answers, "tech")]}
      e topa uma graduação <strong>${durLabel}</strong>. ${areaNote} ${chosenNote(answers)}</p>
      <div class="dims">${S.RIASEC.map((l, i) => {
        const pct = Math.round(((vec[i] - 1) / 4) * 100);
        return `<div class="dim"><span class="dim-label">${RIASEC_INFO[l].nome}</span>
          <span class="bar"><span style="width:${pct}%"></span></span><span class="dim-val">${pct}%</span></div>`;
      }).join("")}</div>
      <p class="tiny" style="margin-top:10px">Quanto você gostou das atividades de cada tipo, no modelo RIASEC de John Holland, muito usado em orientação vocacional.</p>`;
  }

  // Mostra onde ficaram os cursos que o aluno escolheu (sem "já decidi").
  function chosenBox(answers, ranked) {
    const chosen = S.getChosenCourses(QUESTIONS, COURSES, answers);
    if (!chosen.length) return "";
    return `<section class="section card">
      <h2 class="section-title">⭐ Os cursos que você escolheu</h2>
      <ul class="rank-list">${chosen.map(n => {
        const r = ranked.find(x => x.name === n);
        return rankItem(r, ranked.indexOf(r), answers, false);
      }).join("")}</ul>
      <p class="note">Esses cursos ganharam pontos extras por você ter escolhido. Se algum ficou em "Pode explorar",
        abra a página dele e veja o que pesou: não quer dizer que você não deva fazer, só que suas respostas apontaram também para outros caminhos.</p>
    </section>`;
  }

  function chosenNote(answers) {
    const chosen = S.getChosenCourses(QUESTIONS, COURSES, answers);
    if (!chosen.length) return "";
    const lvl = { "1": "um bônus leve", "2": "um bônus", "3": "um bônus forte" }[S.getCertainty(QUESTIONS, COURSES, answers)] || "um bônus";
    return `Você indicou <strong>${chosen.map(esc).join(", ")}</strong>: ${chosen.length > 1 ? "eles ganharam" : "ele ganhou"} ${lvl}, e cursos parecidos também.`;
  }

  function nextSteps(names) {
    return `<section class="section card">
      <h2 class="section-title">🧭 Próximos passos</h2>
      <ol class="steps-list">
        <li><strong>Conheça de perto:</strong> abra a página de ${names.slice(0, 3).map(n => `<a href="${courseUrl(n)}">${esc(n)}</a>`).join(", ")} e veja o que estuda, as carreiras e a nota de corte.</li>
        <li><strong>Brinque no Modo Match:</strong> deslize pelos cursos e guarde os que chamarem sua atenção. <a href="#/match">Abrir o Match</a></li>
        <li><strong>Converse com quem faz:</strong> veteranos, professores e a feira "USP e as Profissões" ajudam a ver a rotina real do curso.</li>
        <li><strong>Veja seus direitos:</strong> quem estudou em escola pública pode concorrer pelas cotas e pedir isenção ou redução da taxa do vestibular. Confira as regras do ano no <a href="https://www.fuvest.br" target="_blank" rel="noopener">site da FUVEST</a>.</li>
      </ol>
    </section>`;
  }

  function emailResultsHref(code, ranked) {
    const lines = ranked.slice(0, 10).map((r, i) => `${i + 1}. ${r.name} — ${r.band.label}`);
    const body = "Meus resultados no UniMatch:\n\n" + lines.join("\n") +
      "\n\nVer o resultado completo: " + resultUrl(code);
    return "mailto:?subject=" + encodeURIComponent("Meus resultados no UniMatch") + "&body=" + encodeURIComponent(body);
  }

  function whatsappHref(code, ranked, vec) {
    const codeTxt = S.isFlatProfile(vec) ? "" : ` (meu código é ${S.hollandCode(vec)})`;
    const text = `Fiz o quiz do UniMatch${codeTxt} e os cursos que mais combinam comigo são: ` +
      ranked.slice(0, 3).map(r => r.name).join(", ") + `. Faz o seu também: ${publicBase()}`;
    return "https://wa.me/?text=" + encodeURIComponent(text) ;
  }

  /* ── CARD DO RESULTADO (imagem para Stories) ──
     Desenhado num <canvas> no próprio celular: nada é enviado para servidor. */
  async function shareResultCard(code, ranked, vec, decidedCourses) {
    const btn = document.getElementById("card-btn");
    if (btn) btn.disabled = true;
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const blob = await drawResultCard(ranked, vec, decidedCourses);
      const file = new File([blob], "meu-unimatch.jpg", { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: "Meu resultado no UniMatch: " + publicBase() }).catch(() => {});
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "meu-unimatch.jpg";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        toast("🖼️ Imagem salva! É só postar nos Stories.");
      }
    } catch (e) {
      toast("Não consegui gerar a imagem neste aparelho.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function drawResultCard(ranked, vec, decidedCourses) {
    const W = 1080, H = 1920;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#3b2bd1"); grad.addColorStop(1, "#8b3fd9");
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // bolhas decorativas
    g.fillStyle = "rgba(255,255,255,0.07)";
    [[900, 260, 260], [140, 1500, 320], [980, 1700, 180]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });

    const display = '"Syne", system-ui, sans-serif', body = '"DM Sans", system-ui, sans-serif';
    g.fillStyle = "#fff"; g.textAlign = "center";
    g.font = `800 92px ${display}`; g.fillText("UniMatch", W / 2, 210);
    g.font = `500 40px ${body}`; g.fillStyle = "rgba(255,255,255,0.85)";
    g.fillText("meu perfil vocacional", W / 2, 280);

    const flat = S.isFlatProfile(vec);
    const code = flat ? "???" : S.hollandCode(vec);
    g.fillStyle = "#fff"; g.font = `800 230px ${display}`;
    g.fillText(code.split("").join(" "), W / 2, 590);
    g.font = `600 44px ${body}`;
    g.fillText(flat ? "ainda descobrindo meu tipo" : code.split("").map(l => RIASEC_INFO[l].nome).join(" · "), W / 2, 680);

    g.textAlign = "left";
    const names = decidedCourses && decidedCourses.length ? decidedCourses.slice(0, 3) : ranked.slice(0, 3).map(r => r.name);
    g.font = `700 50px ${body}`; g.fillStyle = "#fff";
    g.fillText(decidedCourses && decidedCourses.length ? "🎯 meu curso" : "✦ cursos que combinam comigo", 110, 860);
    names.forEach((n, i) => {
      const y = 940 + i * 190;
      g.fillStyle = "rgba(255,255,255,0.16)";
      roundRect(g, 90, y, W - 180, 150, 36); g.fill();
      g.fillStyle = "#fff"; g.font = `800 64px ${display}`;
      g.fillText(String(i + 1), 135, y + 98);
      g.font = `700 ${fitFont(g, n, W - 360, 56, body)}px ${body}`;
      g.fillText(n, 225, y + 96);
    });

    g.textAlign = "center";
    g.fillStyle = "#fff"; g.font = `700 46px ${body}`;
    g.fillText("descubra o seu, é grátis:", W / 2, 1640);
    const site = publicBase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    let fs = 56;
    do { g.font = `800 ${fs}px ${display}`; fs -= 2; } while (g.measureText(site).width > W - 140 && fs > 24);
    g.fillText(site, W / 2, 1720);
    return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("toBlob"))), "image/jpeg", 0.9));
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function fitFont(g, text, maxW, size, family) {
    let s = size;
    while (s > 30) { g.font = `700 ${s}px ${family}`; if (g.measureText(text).width <= maxW) break; s -= 2; }
    return s;
  }

  /* ── VETERANOS E MENTORIAS ── */
  function upcomingMentorias(courseNames) {
    const now = Date.now();
    return MENTORIAS
      .filter(m => courseNames.includes(m.curso) && (!m.data || new Date(m.data).getTime() > now))
      .sort((a, b) => String(a.data).localeCompare(String(b.data)));
  }

  function vetCard(v) {
    const initials = String(v.nome || "?").split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
    const photo = v.foto
      ? `<img class="vet-photo" src="${esc(v.foto)}" alt="" loading="lazy">`
      : `<span class="vet-photo" aria-hidden="true">${esc(initials)}</span>`;
    const actions = [];
    if (safeUrl(v.linkedin)) actions.push(`<a class="btn btn-secondary btn-sm" href="${safeUrl(v.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`);
    if (safeUrl(v.formulario)) actions.push(`<a class="btn btn-primary btn-sm" href="${safeUrl(v.formulario)}" target="_blank" rel="noopener">✉️ Mandar mensagem</a>`);
    return `<article class="card vet-card">${photo}<div>
      <div class="vet-name">${esc(v.nome)}</div>
      <div class="vet-meta">${esc(v.curso)}${v.ano ? " · " + esc(v.ano) : ""}</div>
      ${v.bio ? `<p class="vet-bio">${esc(v.bio)}</p>` : ""}
      <div class="vet-actions">${actions.join("")}</div></div></article>`;
  }

  function mentoriaItem(m) {
    const when = m.data ? new Date(m.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
    return `<li><strong>${esc(m.titulo || "Roda de conversa")}</strong> — ${esc(m.curso)}${when ? " · " + esc(when) : ""}
      ${safeUrl(m.link) ? ` · <a href="${safeUrl(m.link)}" target="_blank" rel="noopener">entrar</a>` : ""}</li>`;
  }

  function veteranInvite() {
    const href = SITE_CONFIG.formularioVeteranos
      ? safeUrl(SITE_CONFIG.formularioVeteranos)
      : "mailto:" + esc(SITE_CONFIG.contatoEmail) + "?subject=" + encodeURIComponent("Quero ser veterano(a) mentor(a) no UniMatch");
    return `<a href="${href}"${externalAttrs(href)}>É universitário(a) e quer ser mentor(a)? Cadastre-se.</a>`;
  }

  function renderVeteransSection(courseNames) {
    const vets = VETERANS.filter(v => courseNames.includes(v.curso));
    const ments = upcomingMentorias(courseNames);
    if (!vets.length && !ments.length) {
      return `<section class="section card"><h2 class="section-title">🎓 Fale com um veterano</h2>
        <p class="muted small">Em breve, você vai poder conversar com estudantes dos cursos que deram match com você.</p>
        <p class="small" style="margin-top:8px">${veteranInvite()}</p></section>`;
    }
    return `<section class="section">
      <h2 class="section-title">🎓 Fale com um veterano</h2>
      <p class="muted small" style="margin-bottom:12px">Estudantes dos cursos que deram match com você. Os contatos passam por LinkedIn ou formulário: ninguém tem o e-mail pessoal exposto.</p>
      ${vets.length ? `<div class="vet-grid">${vets.map(vetCard).join("")}</div>` : ""}
      ${ments.length ? `<div class="card" style="margin-top:12px"><h3 class="section-title">Rodas de conversa em grupo</h3>
        <ul class="list-plain">${ments.map(mentoriaItem).join("")}</ul></div>` : ""}
      <p class="small" style="margin-top:10px">${veteranInvite()}</p>
    </section>`;
  }

  /* ── MODO MATCH ──
     Cartas de curso para deslizar: direita = curtir (vai para os favoritos),
     esquerda = passar. As curtidas aparecem como atalho na pergunta
     "Já tem algum curso que te interessa?" do quiz. */
  function matchDeck() {
    const seen = new Set([...state.favorites, ...state.matchNo]);
    let names = COURSE_NAMES.filter(n => !seen.has(n));
    const last = state.lastCode ? resultsFromCode(state.lastCode) : null;
    if (last) {
      // Com quiz feito: começa pelos que mais combinam, misturando um pouco.
      const pos = {}; last.ranked.forEach((r, i) => { pos[r.name] = i; });
      names.sort((a, b) => (pos[a] + seededJitter(a)) - (pos[b] + seededJitter(b)));
    } else {
      names.sort((a, b) => seededJitter(a) - seededJitter(b));
    }
    return names;
  }
  // Embaralha de um jeito estável durante a visita (sem pular cartas ao voltar para a tela).
  const jitterSeed = Math.random();
  function seededJitter(name) {
    let h = Math.floor(jitterSeed * 1e9);
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return (h % 1000) / 1000 * 12;
  }

  function renderMatch() {
    const deck = matchDeck();
    const liked = state.favorites;
    if (!deck.length) {
      app.innerHTML = `<section class="card" style="text-align:center">
        <div style="font-size:3rem">🎉</div>
        <h1 class="page-title">Você viu todos os cursos!</h1>
        <p class="page-sub">${liked.length ? `Você curtiu ${liked.length} curso${liked.length > 1 ? "s" : ""}.` : "Você não curtiu nenhum ainda."}</p>
        ${matchList(liked)}
        <div class="btn-row" style="margin-top:16px">
          <a class="btn btn-primary" href="#/quiz">✦ Fazer o quiz</a>
          <button class="btn btn-ghost" type="button" id="match-reset">↺ Recomeçar o Match</button>
        </div></section>`;
      document.getElementById("match-reset").onclick = () => { state.matchNo = []; saveState(); renderMatch(); };
      return;
    }
    const name = deck[0], c = COURSES[name];
    const total = COURSE_NAMES.length, done = total - deck.length;
    app.innerHTML = `
      <div class="match-head">
        <div><h1 class="page-title" style="margin:0">Modo Match</h1>
          <p class="tiny">Deslize ➡️ se curtiu, ⬅️ se não é pra você · ${done} de ${total}</p></div>
        <a class="pill" href="#/explorar" data-match-likes>❤️ ${liked.length}</a>
      </div>
      <div class="match-stage">
        <article class="match-card" id="match-card" tabindex="0" aria-label="${esc(name)}. Use as setas para curtir ou passar.">
          <div class="match-stamp like" aria-hidden="true">CURTI</div>
          <div class="match-stamp nope" aria-hidden="true">PASSO</div>
          <div class="match-area">${AREAS[c.area].emoji} ${esc(AREAS[c.area].label)}</div>
          <h2 class="match-name">${esc(name)}</h2>
          <p class="match-desc">${esc(c.desc)}</p>
          <div class="tags">${c.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          <div class="stat-grid" style="margin-top:14px">
            <div class="stat"><div class="stat-label">Duração</div><div class="stat-value">${esc(c.dur)} anos</div></div>
            <div class="stat"><div class="stat-label">Salário médio</div><div class="stat-value">${money(c.salMid)}</div></div>
            <div class="stat full"><div class="stat-label">Carreiras</div><div class="stat-value small" style="font-weight:500">${esc(c.carreiras)}</div></div>
          </div>
          <a class="match-more" href="${courseUrl(name)}">Ver tudo sobre o curso →</a>
        </article>
      </div>
      <div class="match-actions">
        <button class="match-btn nope" type="button" id="match-no" aria-label="Não é pra mim">✕</button>
        <button class="match-btn like" type="button" id="match-yes" aria-label="Curti">❤</button>
      </div>
      ${liked.length ? `<section class="section"><h2 class="section-title">❤️ Seus matches</h2>${matchList(liked)}
        <p class="tiny" style="margin-top:8px">Seus matches aparecem como atalho no quiz, na pergunta "Já tem algum curso que te interessa?".</p></section>` : ""}`;

    const card = document.getElementById("match-card");
    const decide = like => {
      if (card.dataset.done) return;
      card.dataset.done = "1";
      card.classList.add(like ? "fly-right" : "fly-left");
      if (like) { if (!isFav(name)) state.favorites.push(name); toast("❤️ " + name + " foi para os seus matches"); }
      else state.matchNo.push(name);
      saveState();
      setTimeout(renderMatch, reducedMotion() ? 0 : 260);
    };
    document.getElementById("match-yes").onclick = () => decide(true);
    document.getElementById("match-no").onclick = () => decide(false);
    card.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); decide(true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); decide(false); }
    });
    // Arrastar com o dedo (ou mouse).
    let x0 = null, dx = 0;
    card.addEventListener("pointerdown", e => {
      if (e.target.closest("a")) return;
      x0 = e.clientX; dx = 0; card.setPointerCapture(e.pointerId); card.classList.add("dragging");
    });
    card.addEventListener("pointermove", e => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      card.classList.toggle("show-like", dx > 40);
      card.classList.toggle("show-nope", dx < -40);
    });
    const end = () => {
      if (x0 === null) return;
      x0 = null; card.classList.remove("dragging");
      if (Math.abs(dx) > 90) decide(dx > 0);
      else { card.style.transform = ""; card.classList.remove("show-like", "show-nope"); }
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }

  function matchList(names) {
    if (!names.length) return "";
    return `<ul class="course-list">${names.map(n => `<li class="course-item"><a href="${courseUrl(n)}">
      <div class="course-item-name">${esc(n)}</div>
      <div class="course-item-meta"><span>${AREAS[COURSES[n].area].emoji} ${esc(AREAS[COURSES[n].area].label)}</span><span>${esc(COURSES[n].dur)} anos</span></div>
      </a>${favButton(n)}</li>`).join("")}</ul>`;
  }
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── EXPLORAR ── */
  function renderExplorar() {
    const f = state.explorar;
    const trending = COURSE_NAMES.filter(n => COURSES[n].dem === "Crescendo")
      .sort((a, b) => COURSES[b].empScore - COURSES[a].empScore).slice(0, 8);
    const chips = [["all", "Todos"], ...Object.entries(AREAS).map(([k, a]) => [k, `${a.emoji} ${a.label}`]), ["favoritos", "❤️ Favoritos"]];

    app.innerHTML = `
      <h1 class="page-title">Explorar cursos</h1>
      <p class="page-sub">Os ${COURSE_NAMES.length} cursos de graduação da USP na nossa base, com notas de corte e dados de mercado.</p>

      <label class="visually-hidden" for="ex-search">Buscar curso</label>
      <input class="search" id="ex-search" type="search" placeholder="Buscar por curso, área ou carreira…" value="${esc(f.search)}" autocomplete="off">

      <div class="chips" role="group" aria-label="Filtrar por área">
        ${chips.map(([k, l]) => `<button class="chip" type="button" data-area="${k}" aria-pressed="${f.area === k}">${esc(l)}</button>`).join("")}
      </div>

      <details class="filters card" ${f.maxNota < 90 || f.minSal > 0 ? "open" : ""}>
        <summary>⚙️ Mais filtros e ordenação</summary>
        <div class="filter-grid">
          <div class="field">
            <label for="ex-mod">Nota de corte considerada</label>
            <select id="ex-mod">${Object.entries(MODALIDADES).map(([k, m]) =>
              `<option value="${k}" ${f.modalidade === k ? "selected" : ""}>FUVEST — ${esc(m.label)}</option>`).join("")}</select>
          </div>
          <div class="field">
            <label for="ex-nota">Nota de corte até <span class="range-out" id="ex-nota-out">${f.maxNota}</span> de 90</label>
            <input id="ex-nota" type="range" min="27" max="90" step="1" value="${f.maxNota}">
          </div>
          <div class="field">
            <label for="ex-sal">Salário médio a partir de</label>
            <select id="ex-sal">${[0, 4000, 6000, 8000, 10000, 12000].map(v =>
              `<option value="${v}" ${f.minSal === v ? "selected" : ""}>${v ? money(v) : "Qualquer valor"}</option>`).join("")}</select>
          </div>
          <div class="field">
            <label for="ex-sort">Ordenar por</label>
            <select id="ex-sort">
              ${[["az", "Nome (A–Z)"], ["nota", "Menor nota de corte"], ["sal", "Maior salário médio"], ["emp", "Maior empregabilidade"]]
                .map(([k, l]) => `<option value="${k}" ${f.sort === k ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" type="button" id="ex-clear">Limpar filtros</button>
      </details>

      <section class="section" id="trending" aria-labelledby="trend-title">
        <h2 class="section-title" id="trend-title">📈 Cursos em alta</h2>
        <p class="tiny" style="margin-bottom:10px">Cursos marcados com demanda "crescendo" na nossa base de mercado (dado ainda em verificação).</p>
        <div class="trend-row">${trending.map(n => `<a class="trend-card" href="${courseUrl(n)}">
          <strong>${esc(n)}</strong><span class="tiny">${esc(AREAS[COURSES[n].area].label)} · ${money(COURSES[n].salMid)}</span></a>`).join("")}</div>
      </section>

      <p class="result-count" id="ex-count" aria-live="polite"></p>
      <ul class="course-list" id="ex-list"></ul>`;

    const $ = id => document.getElementById(id);
    let t;
    $("ex-search").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { f.search = e.target.value; renderExplorarList(); }, 120); });
    app.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => {
      f.area = c.dataset.area;
      app.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", String(x === c)));
      renderExplorarList();
    }));
    $("ex-mod").addEventListener("change", e => { f.modalidade = e.target.value; renderExplorarList(); });
    $("ex-nota").addEventListener("input", e => { f.maxNota = Number(e.target.value); $("ex-nota-out").textContent = f.maxNota; renderExplorarList(); });
    $("ex-sal").addEventListener("change", e => { f.minSal = Number(e.target.value); renderExplorarList(); });
    $("ex-sort").addEventListener("change", e => { f.sort = e.target.value; renderExplorarList(); });
    $("ex-clear").addEventListener("click", () => {
      state.explorar = { search: "", area: "all", modalidade: "ep", maxNota: 90, minSal: 0, sort: "az" };
      renderExplorar();
    });
    renderExplorarList();
  }

  function filterCourses() {
    const f = state.explorar;
    const q = S.normalize(f.search.trim());
    let list = COURSE_NAMES.filter(name => {
      const c = COURSES[name];
      if (f.area === "favoritos" && !isFav(name)) return false;
      if (f.area !== "all" && f.area !== "favoritos" && c.area !== f.area) return false;
      if (f.maxNota < 90 && (!c.fuvest || c.fuvest[f.modalidade] > f.maxNota)) return false;
      if (f.minSal && c.salMid < f.minSal) return false;
      if (q) {
        const hay = S.normalize([name, c.desc, c.carreiras, AREAS[c.area].label, ...c.tags].join(" "));
        if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
      }
      return true;
    });
    const nota = n => (COURSES[n].fuvest ? COURSES[n].fuvest[f.modalidade] : 999);
    if (f.sort === "nota") list.sort((a, b) => nota(a) - nota(b));
    if (f.sort === "sal") list.sort((a, b) => COURSES[b].salMid - COURSES[a].salMid);
    if (f.sort === "emp") list.sort((a, b) => COURSES[b].empScore - COURSES[a].empScore);
    return list;
  }

  function renderExplorarList() {
    const f = state.explorar;
    const list = filterCourses();
    const filtering = f.search || f.area !== "all" || f.maxNota < 90 || f.minSal > 0;
    const trending = document.getElementById("trending");
    if (trending) trending.classList.toggle("hidden", Boolean(filtering));
    document.getElementById("ex-count").innerHTML = `<strong>${list.length}</strong> curso${list.length === 1 ? "" : "s"}`;
    const m = MODALIDADES[f.modalidade].sigla;
    document.getElementById("ex-list").innerHTML = list.length ? list.map(name => {
      const c = COURSES[name];
      return `<li class="course-item">
        <a href="${courseUrl(name)}">
          <div class="course-item-name">${esc(name)}</div>
          <div class="course-item-meta">
            <span>${AREAS[c.area].emoji} ${esc(AREAS[c.area].label)}</span>
            <span>${esc(c.dur)} anos</span>
            <span>FUVEST ${m}: ${c.fuvest ? c.fuvest[f.modalidade] + "/90" : "—"}</span>
            <span>💰 ${money(c.salMid)}</span>
          </div>
        </a>${favButton(name)}</li>`;
    }).join("") : `<li class="empty">${f.area === "favoritos" && !state.favorites.length
      ? "Você ainda não favoritou nenhum curso. Toque no 🤍 de um curso para guardar."
      : "Nenhum curso encontrado com esses filtros."}</li>`;
  }

  /* ── DETALHE DO CURSO ── */
  function renderCourse(slug) {
    const name = SLUG_TO_NAME[slug];
    if (!name) {
      app.innerHTML = `<section class="card"><h1 class="page-title">Curso não encontrado</h1>
        <a class="btn btn-primary btn-block" href="#/explorar">Ver todos os cursos</a></section>`;
      return;
    }
    const c = COURSES[name];
    const extra = COURSE_EXTRAS[name] || {};
    const last = state.lastCode ? resultsFromCode(state.lastCode) : null;
    const match = last ? last.ranked.find(r => r.name === name) : null;
    const matchPos = match ? last.ranked.indexOf(match) + 1 : 0;
    const empClass = { "Muito Alta": "good", "Alta": "good", "Média": "warn", "Baixa": "bad" }[c.emp] || "";
    const pending = what => `<p class="pending">🔎 ${what} ainda está em levantamento pela equipe.
      <a href="${contactHref("UniMatch — informação sobre " + name)}"${externalAttrs(contactHref(""))}>Tem essa informação com fonte? Envie para nós.</a></p>`;
    const sourced = (obj) => `<p class="muted">${esc(obj.texto)}</p>${safeUrl(obj.fonte) ? `<p class="note">Fonte: <a href="${safeUrl(obj.fonte)}" target="_blank" rel="noopener">${esc(obj.fonte)}</a></p>` : ""}`;
    const vets = VETERANS.filter(v => v.curso === name);
    const ments = upcomingMentorias([name]);
    const reportHref = contactHref("UniMatch — erro nos dados de " + name, "Curso: " + name + "\nO que está errado:\n");

    app.innerHTML = `
      <a class="back-link" href="${last && match ? "#/resultado/" + esc(state.lastCode) : "#/explorar"}">← ${last && match ? "Voltar aos resultados" : "Explorar cursos"}</a>
      <article>
        <div class="detail-head">
          <h1 class="detail-title">${esc(name)}</h1>
          ${favButton(name)}
        </div>
        <div class="badges">
          <span class="badge accent">${AREAS[c.area].emoji} ${esc(AREAS[c.area].label)}</span>
          <span class="badge">${esc(c.dur)} anos</span>
          <span class="badge ${empClass}">Empregabilidade ${esc(c.emp.toLowerCase())}</span>
        </div>

        ${match ? `<div class="match-box">
          <div class="small muted">Sua compatibilidade (${matchPos}º no seu ranking)</div>
          <div class="match-big">${match.band.label}</div>
          ${(() => { const w = S.explain(match, c, QUESTIONS, last.answers); return `
            ${w.pros.length ? `<ul class="why-list good">${w.pros.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
            ${w.cons.length ? `<ul class="why-list warn">${w.cons.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}`; })()}
          <details style="margin-top:8px"><summary class="small">Ver todos os fatores</summary>
          <div class="factors">${[
            ["🎯 Perfil de interesses", match.breakdown.perfil],
            ["🧮 Matemática", match.breakdown.matematica],
            ["💻 Tecnologia", match.breakdown.tecnologia],
            ["📅 Duração", match.breakdown.duracao],
            ["💰 Salário", match.breakdown.salario],
            ["🧭 Área que você marcou", match.breakdown.area],
            [match.interesseRef && match.interesseRef !== name ? `⭐ Parecido com ${esc(match.interesseRef)}` : "⭐ Curso que você indicou", match.breakdown.interesse]
          ].filter(([, v]) => v !== null).map(([l, v]) => `<div class="factor"><span>${l}</span><span class="bar"><span style="width:${v}%"></span></span><span>${v}%</span></div>`).join("")}</div>
          </details>
        </div>` : ""}

        <section class="section card">
          <h2 class="section-title">Cursos parecidos</h2>
          <div class="chips" style="flex-wrap:wrap">${S.similarCourses(name, COURSES, 4).map(n => `<a class="chip" href="${courseUrl(n)}">${esc(n)}</a>`).join("")}</div>
        </section>

        <section class="section card">
          <h2 class="section-title">O que é o curso</h2>
          <p class="muted">${esc(c.desc)}</p>
          <div class="tags">${c.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </section>

        <section class="section card">
          <h2 class="section-title">Carreiras possíveis</h2>
          <p class="muted">${esc(c.carreiras)}</p>
        </section>

        <section class="section card">
          <h2 class="section-title">Mercado e salário</h2>
          <div class="stat-grid">
            <div class="stat"><div class="stat-label">Faixa salarial</div><div class="stat-value">${esc(c.sal)}</div></div>
            <div class="stat"><div class="stat-label">Salário médio</div><div class="stat-value">${money(c.salMid)}</div></div>
            <div class="stat"><div class="stat-label">Demanda</div><div class="stat-value">${esc(c.dem)}</div></div>
          </div>
          <p class="note">⚠️ Referência: CAGED 2023 e CBO/MTE (médias nacionais). Esses valores ainda não foram
            conferidos um a um com a fonte oficial e variam por estado, setor e experiência.</p>
        </section>

        <section class="section card">
          <h2 class="section-title">Como ingressar</h2>
          <h3 class="small" style="margin-bottom:6px">FUVEST 2025 — nota mínima da 1ª fase (de 90)</h3>
          ${c.fuvest ? `<table class="cut-table">
            <thead><tr><th scope="col">Modalidade</th><th scope="col">Nota</th></tr></thead>
            <tbody>${Object.entries(MODALIDADES).map(([k, m]) => `<tr${k === "ep" ? ' class="highlight"' : ""}>
              <td>${esc(m.label)}</td><td class="num">${c.fuvest[k]}</td></tr>`).join("")}</tbody>
          </table>
          <p class="note">${c.fuvestNaoConferido
            ? "⚠️ Esta nota ainda não foi confirmada no PDF oficial da FUVEST."
            : "✅ Conferido com o PDF oficial de notas de corte da FUVEST 2025."}
            É a nota mínima para ser chamado para a 2ª fase, não para ser aprovado.</p>` : `<p class="muted">Não ofertado pela FUVEST.</p>`}

          <h3 class="small" style="margin:18px 0 6px">SISU 2024 — referência para federais</h3>
          <p><strong>${esc(c.notaSISU)}</strong> pontos${c.sisuEstimated ? ' <span class="badge warn">estimada</span>' : ""}</p>
          <p class="note">Nota de corte da 1ª chamada, ampla concorrência, em uma federal de referência (UNIFESP, UFSCar ou UFABC).
            ${c.sisuEstimated ? "Este valor foi estimado por comparação, não é dado direto do MEC. " : ""}Ainda não conferido com a fonte oficial.</p>

          <h3 class="small" style="margin:18px 0 6px">Provão Paulista</h3>
          ${extra.provaoPaulista ? sourced(extra.provaoPaulista) : pending("A informação do Provão Paulista para este curso")}

          <h3 class="small" style="margin:18px 0 6px">Vagas olímpicas (medalhistas)</h3>
          ${extra.olimpiadas ? sourced(extra.olimpiadas) : pending("A informação sobre vagas olímpicas para este curso")}
        </section>

        <section class="section card">
          <h2 class="section-title">Onde estudar</h2>
          <ul class="list-plain">
            ${c.fuvest ? `<li><strong>USP</strong> (via FUVEST, ENEM-USP e Provão Paulista)</li>` : ""}
            ${(extra.ondeEstudar || []).map(u => `<li><strong>${esc(u.nome)}</strong>${u.obs ? " — " + esc(u.obs) : ""}</li>`).join("")}
          </ul>
          ${extra.ondeEstudar ? "" : `<p class="note">A lista de outras universidades públicas que oferecem este curso ainda está em levantamento.</p>`}
        </section>

        ${extra.pessoas && extra.pessoas.length ? `<section class="section card">
          <h2 class="section-title">⭐ Quem estudou isso</h2>
          <ul class="people">${extra.pessoas.map(pp => `<li class="person">
            <span class="person-photo" aria-hidden="true">${foto(pp.nome)
              ? `<img src="${esc(foto(pp.nome).arquivo)}" alt="" loading="lazy">`
              : esc(initials(pp.nome))}</span>
            <div>
              <div class="person-head"><strong>${esc(pp.nome)}</strong>
                <span class="badge ${pp.tipo === "curiosidade" ? "warn" : "accent"}">${pp.tipo === "curiosidade" ? "Curiosidade" : "Na área"}</span></div>
              <p class="muted small">${esc(pp.sobre)}${safeUrl(pp.fonte) ? ` <a href="${safeUrl(pp.fonte)}" target="_blank" rel="noopener">Fonte</a>` : ""}</p>
              ${foto(pp.nome) ? `<p class="tiny person-credit">Foto: ${esc(foto(pp.nome).autor)} ·
                ${safeUrl(foto(pp.nome).origem) ? `<a href="${safeUrl(foto(pp.nome).origem)}" target="_blank" rel="noopener">${esc(foto(pp.nome).licenca)}</a>` : esc(foto(pp.nome).licenca)}</p>` : ""}
            </div>
          </li>`).join("")}</ul>
        </section>` : ""}

        ${extra.curiosidade ? `<section class="section card"><h2 class="section-title">💡 Curiosidade</h2><p class="muted">${esc(extra.curiosidade)}</p></section>` : ""}

        ${vets.length || ments.length ? `<section class="section">
          <h2 class="section-title">🎓 Fale com um veterano</h2>
          <div class="vet-grid">${vets.map(vetCard).join("")}</div>
          ${ments.length ? `<div class="card" style="margin-top:12px"><h3 class="section-title">Rodas de conversa</h3><ul class="list-plain">${ments.map(mentoriaItem).join("")}</ul></div>` : ""}
        </section>` : ""}

        <div class="btn-row section">
          <button class="btn btn-secondary" type="button" id="share-course">🔗 Compartilhar este curso</button>
          <a class="btn btn-ghost" href="${reportHref}"${externalAttrs(reportHref)}>⚠️ Reportar erro nos dados</a>
        </div>
      </article>`;

    document.getElementById("share-course").onclick = () =>
      shareOrCopy(name + " — UniMatch", siteBase() + courseUrl(name));
  }

  /* ── SOBRE ── */
  function renderSobre() {
    const href = contactHref("UniMatch — problema ou sugestão");
    app.innerHTML = `
      <h1 class="page-title">Sobre o UniMatch</h1>
      <section class="card">
        <h2 class="section-title">🎓 O projeto</h2>
        <p class="muted">O UniMatch é uma plataforma gratuita de orientação vocacional para estudantes de escolas
          públicas que estão se preparando para o ENEM e os vestibulares. O projeto
          faz parte do <strong>Integra</strong>, grupo dedicado a projetos de democratização e inclusão do acesso
          ao conhecimento.</p>
        <p class="muted" style="margin-top:10px">Muitos estudantes chegam à inscrição sem conhecer bem os cursos,
          o mercado de trabalho e as notas de corte. O UniMatch reúne dados públicos para ajudar nessa escolha.</p>
      </section>

      <section class="card">
        <h2 class="section-title">🧭 Como o quiz funciona</h2>
        <p class="muted">As 24 primeiras perguntas montam o seu perfil no modelo RIASEC (Realista, Investigativo,
          Artístico, Social, Empreendedor, Convencional), criado pelo psicólogo John Holland. As três letras mais
          fortes formam o seu código (por exemplo, "SIA"). Cada curso também tem um perfil RIASEC, e a compatibilidade
          mede o quanto os dois se parecem.</p>
        <p class="muted" style="margin-top:10px">As outras perguntas comparam o que você topa de matemática, tecnologia,
          duração e salário com o que cada curso exige. As áreas marcadas dão um bônus aos cursos delas. Se você já
          tem um curso em mente, ele e os cursos parecidos ganham pontos extras, mais ou menos conforme o quanto
          você está decidido(a). Quem diz que já decidiu vê o próprio curso primeiro, com o que combina e o que vale checar.</p>
        <p class="note">Os perfis RIASEC dos cursos foram atribuídos pela equipe com base nas características de cada
          área e ainda não passaram por validação de especialistas em psicologia. As afirmações do quiz também
          estão em fase de teste.</p>
      </section>

      <section class="card">
        <h2 class="section-title">📊 Sobre os dados</h2>
        <ul class="list-plain small">
          <li><strong>FUVEST 2025 (1ª fase):</strong> nota mínima para convocação à 2ª fase, por modalidade. Conferido com o PDF oficial da FUVEST.</li>
          <li><strong>SISU 2024:</strong> nota de corte da 1ª chamada, ampla concorrência, em uma federal de referência. Ainda não conferido; notas marcadas como "estimada" foram calculadas por comparação.</li>
          <li><strong>Salários e empregabilidade:</strong> referência CAGED 2023 e CBO/MTE. Ainda não conferidos um a um.</li>
          <li>Provão Paulista, vagas olímpicas e outras universidades: em levantamento.</li>
        </ul>
        ${typeof DATA_LAST_REVIEWED !== "undefined" && DATA_LAST_REVIEWED ? `<p class="note"><strong>Última revisão dos dados:</strong> ${esc(DATA_LAST_REVIEWED)}.</p>` : ""}
      </section>

      <section class="card">
        <h2 class="section-title">✉️ Contato e sugestões</h2>
        <p class="muted">Achou um erro? Tem uma sugestão? Quer contribuir com o projeto? Não precisa saber programar.</p>
        <div class="footer-links">
          <a class="btn btn-primary btn-sm" href="${href}"${externalAttrs(href)}>✉️ Reportar problema / Sugestões</a>
          ${SITE_CONFIG.instagram ? `<a class="btn btn-secondary btn-sm" href="${safeUrl(SITE_CONFIG.instagram)}" target="_blank" rel="noopener">📸 Instagram do Integra</a>` : ""}
        </div>
      </section>`;
  }

  /* ══════════ ROTEADOR ══════════ */
  let currentRoute = "";

  function focusMain() {
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  function route() {
    // Links compartilhados pela versão antiga (#r=...) não guardavam bem as
    // áreas marcadas, então mandamos para o quiz em vez de mostrar algo errado.
    if (location.hash.startsWith("#r=")) {
      history.replaceState(null, "", location.pathname + location.search + "#/quiz");
      setTimeout(() => toast("Esse link é de uma versão antiga. Refaça o quiz para ver o resultado."), 300);
    }
    const [, page = "", param = ""] = (location.hash || "#/").split("/");
    const titles = { "": "Início", quiz: "Quiz", match: "Modo Match", explorar: "Explorar cursos", sobre: "Sobre", resultado: "Seus resultados", curso: "" };
    const prev = currentRoute;
    currentRoute = page === "resultado" ? "quiz" : page === "curso" ? "explorar" : (page || "home");
    if (page !== "resultado") resultsShowAll = false;

    if (page === "") renderHome();
    else if (page === "quiz") renderQuizStart();
    else if (page === "resultado") renderResults(decodeURIComponent(param));
    else if (page === "explorar") renderExplorar();
    else if (page === "match") renderMatch();
    else if (page === "curso") renderCourse(decodeURIComponent(param));
    else if (page === "sobre") renderSobre();
    else { location.replace("#/"); return; }

    const courseName = page === "curso" ? SLUG_TO_NAME[decodeURIComponent(param)] : "";
    document.title = (courseName || titles[page] || "UniMatch") + " — UniMatch";
    document.querySelectorAll(".nav-link").forEach(a => {
      if (a.dataset.route === currentRoute) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (prev) focusMain();
  }

  /* ── E-MAIL ──
     Links mailto: só funcionam se o aparelho tiver um app de e-mail configurado.
     No computador isso costuma faltar (Chrome e Edge não fazem nada) e, no
     iPhone, o app Mail pode não ter conta. Por isso o clique abre uma janela
     com as opções: no computador, Gmail primeiro; no celular, o app de e-mail
     primeiro e "copiar" como plano B. */
  function parseMailto(href) {
    const [addr, query = ""] = href.slice("mailto:".length).split("?");
    const params = new URLSearchParams(query);
    return { to: decodeURIComponent(addr), subject: params.get("subject") || "", body: params.get("body") || "" };
  }

  // Celular ou tablet: toque como entrada principal ou aparelho móvel.
  function isPhone() {
    return window.matchMedia("(pointer: coarse)").matches ||
      (navigator.userAgentData && navigator.userAgentData.mobile) ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  function openMailDialog(href, mobile) {
    const m = parseMailto(href);
    const gmail = "https://mail.google.com/mail/?view=cm&fs=1" + (m.to ? "&to=" + encodeURIComponent(m.to) : "") +
      "&su=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.body);
    const copyLabel = m.to ? "📋 Copiar o endereço" : "📋 Copiar o texto";
    const dlg = document.createElement("dialog");
    dlg.className = "mail-dialog";
    dlg.setAttribute("aria-labelledby", "mail-title");
    dlg.innerHTML = `
      <h2 class="section-title" id="mail-title">Como você quer enviar?</h2>
      ${m.to ? `<p class="muted small">Para: <strong>${esc(m.to)}</strong></p>` : `<p class="muted small">O texto já vai preenchido: é só colocar o seu e-mail como destinatário.</p>`}
      <div class="btn-row" style="flex-direction:column;margin-top:14px">
        ${mobile
          ? `<a class="btn btn-primary" href="${esc(href)}" data-native-mail>Abrir no app de e-mail</a>`
          : `<a class="btn btn-primary" href="${esc(gmail)}" target="_blank" rel="noopener">Abrir no Gmail</a>
             <a class="btn btn-secondary" href="${esc(href)}" data-native-mail>Abrir no app de e-mail</a>`}
        <button class="btn btn-secondary" type="button" data-copy>${copyLabel}</button>
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
      </div>`;
    document.body.appendChild(dlg);
    const close = () => { dlg.close(); dlg.remove(); };
    dlg.addEventListener("click", e => {
      if (e.target === dlg || e.target.closest("[data-close]")) close();
      else if (e.target.closest("[data-copy]")) {
        const text = m.to || m.body;
        const done = () => { toast(m.to ? "📋 Endereço copiado!" : "📋 Texto copiado!"); close(); };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => window.prompt("Copie:", text));
        else { window.prompt("Copie:", text); close(); }
      } else if (e.target.closest("a")) setTimeout(close, 0);
    });
    dlg.addEventListener("close", () => dlg.remove());
    dlg.showModal();
  }

  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="mailto:"]');
    if (!a || a.hasAttribute("data-native-mail")) return;
    e.preventDefault();
    openMailDialog(a.getAttribute("href"), isPhone());
  });

  /* ── TEMA ── */
  document.getElementById("theme-btn").addEventListener("click", () => {
    const root = document.documentElement;
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("um_theme", root.dataset.theme); } catch (e) {}
  });

  /* ── FUNCIONAR SEM INTERNET ──
     O service worker (sw.js) guarda uma cópia do site para abrir com pouco ou
     nenhum sinal. Ele sempre tenta a versão nova primeiro quando há internet. */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  loadState();
  window.addEventListener("hashchange", route);
  route();
})();
