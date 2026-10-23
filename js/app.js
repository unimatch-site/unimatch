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
  const RIASEC_INFO = {
    R: { nome: "Realista",      desc: "prático e mão na massa" },
    I: { nome: "Investigativo", desc: "analítico e investigativo" },
    A: { nome: "Artístico",     desc: "criativo e expressivo" },
    S: { nome: "Social",        desc: "empático e social" },
    E: { nome: "Empreendedor",  desc: "persuasivo e articulado" },
    C: { nome: "Convencional",  desc: "organizado e detalhista" }
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
      // Aproveita favoritos salvos pela versão antiga do site.
      if (!s.favorites) {
        const old = JSON.parse(localStorage.getItem("um5_state") || "{}");
        if (Array.isArray(old.favorites)) state.favorites = old.favorites;
      }
    } catch (e) { /* armazenamento indisponível: segue sem salvar */ }
    state.favorites = state.favorites.filter(n => COURSES[n]);
    if (state.q < 0 || state.q >= QUESTIONS.length) state.q = 0;
    if (state.lastCode && !S.decodeAnswers(QUESTIONS, state.lastCode)) state.lastCode = "";
  }
  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        quizVersion: QUIZ_VERSION, answers: state.answers, q: state.q, lastCode: state.lastCode, favorites: state.favorites
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
    app.innerHTML = `
      <section class="hero">
        <div class="hero-logo" aria-hidden="true">Uni<span>Match</span></div>
        <h1 class="hero-title">O seu futuro na <em>universidade pública</em> começa aqui</h1>
        <p class="hero-desc">Descubra quais cursos da USP combinam com você, veja as notas de corte
          da FUVEST por modalidade (incluindo cota de escola pública) e entenda o mercado de cada carreira.
          Gratuito e feito para quem estuda em escola pública.</p>
        <div class="pill-row">
          <span class="pill"><strong>${total}</strong> cursos</span>
          <span class="pill"><strong>${QUESTIONS.length}</strong> perguntas</span>
          <span class="pill">⏱ cerca de <strong>5 min</strong></span>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary btn-block" href="#/quiz">✦ Fazer o quiz e encontrar meu curso</a>
          <a class="btn btn-secondary btn-block" href="#/explorar">🔍 Explorar cursos</a>
        </div>
      </section>

      <section class="section card">
        <h2 class="section-title">Como funciona</h2>
        <div class="steps">
          <div class="step"><span class="step-num">1</span><p>Diga o quanto você gosta de algumas atividades do dia a dia e responda umas perguntas rápidas.</p></div>
          <div class="step"><span class="step-num">2</span><p>Veja os cursos que mais combinam com você, separados por nível de compatibilidade.</p></div>
          <div class="step"><span class="step-num">3</span><p>Abra cada curso para ver carreiras, salários e como ingressar.</p></div>
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
        <p class="page-sub">São ${QUESTIONS.length} perguntas rápidas, cerca de 5 minutos. Não existe resposta certa: escolha o que mais
          tem a ver com você hoje. No fim, você vê um ranking dos ${COURSE_NAMES.length} cursos por afinidade.</p>
        <div class="btn-row">
          ${inProgress
            ? `<button class="btn btn-primary btn-block" type="button" id="continue-btn">Continuar (pergunta ${state.q + 1} de ${QUESTIONS.length})</button>
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

  function renderQuestion() {
    const qi = state.q;
    const q = QUESTIONS[qi];
    const total = QUESTIONS.length;
    const pct = Math.round((state.q / total) * 100);
    const current = state.answers[state.q];
    let selected = q.multi ? (Array.isArray(current) ? [...current] : []) : (current || null);

    app.innerHTML = `
      <section class="card">
        <div class="progress" aria-hidden="true">
          <div class="progress-meta"><span>Pergunta ${state.q + 1} de ${total}</span><span>${pct}%</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="eyebrow">${q.dim === "likert" ? "Parte 1 de 2 · Seus interesses" : "Parte 2 de 2 · Suas preferências"}</div>
        ${q.dim === "likert" ? `<p class="question-hint" style="margin-bottom:6px">Quanto você gostaria de fazer isso?</p>` : ""}
        <h1 class="question-text" id="q-title"><span class="visually-hidden">Pergunta ${state.q + 1} de ${total}: </span>${esc(q.q)}</h1>
        ${q.dim === "likert" ? "" : `<p class="question-hint">${q.multi ? "Pode marcar mais de uma." : "Escolha uma opção."}</p>`}
        <div class="options" role="${q.multi ? "group" : "radiogroup"}" aria-labelledby="q-title">
          ${q.opts.map((o, i) => `
            <button type="button" class="option${q.multi ? " multi" : ""}" role="${q.multi ? "checkbox" : "radio"}"
              data-i="${i}" aria-checked="false">
              <span class="option-emoji" aria-hidden="true">${esc(o.e)}</span>
              <span class="option-text">${esc(o.t)}</span>
              <span class="option-check" aria-hidden="true">✓</span>
            </button>`).join("")}
        </div>
        <div class="quiz-nav">
          ${state.q > 0 ? `<button class="btn btn-ghost" type="button" id="back-btn">← Voltar</button>` : ""}
          <button class="btn btn-primary" type="button" id="next-btn">${state.q === total - 1 ? "Ver resultado ✦" : "Próxima →"}</button>
        </div>
      </section>`;

    const buttons = [...app.querySelectorAll(".option")];
    const next = document.getElementById("next-btn");
    function paint() {
      buttons.forEach((b, i) => {
        const v = q.opts[i].v;
        b.setAttribute("aria-checked", String(q.multi ? selected.includes(v) : selected === v));
      });
      next.disabled = q.multi ? selected.length === 0 : !selected;
    }
    paint();

    buttons.forEach((b, i) => b.addEventListener("click", () => {
      const opt = q.opts[i];
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
      state.answers[qi] = selected;
      if (state.q < total - 1) {
        state.q++;
        saveState();
        renderQuestion();
        focusMain();
      } else {
        finishQuiz();
      }
    }
    next.addEventListener("click", goNext);
    const back = document.getElementById("back-btn");
    if (back) back.addEventListener("click", () => { state.q--; saveState(); renderQuestion(); focusMain(); });
  }

  function finishQuiz() {
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
    const shown = resultsShowAll ? ranked : ranked.slice(0, 10);
    const top = ranked.slice(0, 5).map(r => r.name);

    app.innerHTML = `
      <section>
        <div class="eyebrow">✦ Seus resultados</div>
        <h1 class="page-title">Cursos que combinam com você</h1>
        <div class="profile-box">${profileSummary(answers, userVec)}</div>
        <p class="disclaimer">Este resultado é uma estimativa a partir das suas respostas, não uma avaliação
          vocacional profissional. Use como ponto de partida para pesquisar, não como decisão final.</p>
      </section>

      <section class="section">
        <h2 class="section-title">Cursos mais compatíveis</h2>
        <p class="tiny" style="margin-bottom:10px">Cursos com compatibilidade parecida ficam na mesma faixa: a ordem dentro dela é só um desempate.</p>
        <ol class="rank-list">
          ${shown.map((r, i) => {
            const c = COURSES[r.name];
            return `<li><a class="rank-item${i < 3 ? " top" : ""}" href="${courseUrl(r.name)}">
              <span class="rank-pos">${i + 1}º</span>
              <span>
                <span class="rank-name">${esc(r.name)}</span>
                <span class="band band-${r.band.key}">${r.band.label}</span>
                <span class="rank-meta">${esc(AREAS[c.area].label)} · ${esc(c.dur)} anos · FUVEST EP ${c.fuvest ? c.fuvest.ep + "/90" : "—"}</span>
              </span>
            </a></li>`;
          }).join("")}
        </ol>
        ${ranked.length > 10 ? `<button class="btn btn-ghost btn-block" type="button" id="toggle-all" style="margin-top:12px">
          ${resultsShowAll ? "Mostrar só os 10 primeiros" : `Ver todos os ${ranked.length} cursos`}</button>` : ""}
      </section>

      <section class="section card">
        <h2 class="section-title">Guardar e compartilhar</h2>
        <div class="btn-row">
          <a class="btn btn-primary" href="${emailResultsHref(code, ranked)}">✉️ Enviar meus resultados para o meu e-mail</a>
          <button class="btn btn-secondary" type="button" id="share-btn">🔗 Compartilhar link</button>
        </div>
        <p class="note">O botão de e-mail abre o seu aplicativo de e-mail com o resultado já escrito:
          é só colocar o seu endereço e enviar. Nada é guardado nos nossos servidores.</p>
      </section>

      ${renderVeteransSection(top)}

      ${SITE_CONFIG.formularioFeedback ? `<section class="section card">
        <h2 class="section-title">Esse resultado fez sentido pra você?</h2>
        <p class="muted small">Sua resposta é anônima e ajuda a melhorar o quiz.</p>
        <div class="btn-row" style="margin-top:12px">
          <a class="btn btn-secondary" href="${safeUrl(SITE_CONFIG.formularioFeedback)}" target="_blank" rel="noopener">👍 👎 Responder em 1 minuto</a>
        </div></section>` : ""}

      <div class="btn-row section">
        <a class="btn btn-ghost" href="#/quiz" id="redo-btn">↩ Refazer o quiz</a>
        <a class="btn btn-ghost" href="#/explorar">🔍 Explorar todos os cursos</a>
      </div>`;

    const toggle = document.getElementById("toggle-all");
    if (toggle) toggle.onclick = () => { resultsShowAll = !resultsShowAll; renderResults(code); };
    document.getElementById("share-btn").onclick = () =>
      shareOrCopy("Meus resultados no UniMatch", siteBase() + "#/resultado/" + code);
    document.getElementById("redo-btn").onclick = () => { state.answers = []; state.q = 0; saveState(); };
  }

  function profileSummary(answers, vec) {
    const sorted = S.RIASEC.map((l, i) => ({ l, val: vec[i] })).sort((a, b) => b.val - a.val);
    const [a, b] = sorted;
    const mathLabels = { 3: "adora", 2: "se vira bem com", 1: "prefere só o básico de", 0: "prefere evitar" };
    const techLabels = { 3: "quer criar tecnologia", 2: "quer usar bastante tecnologia", 1: "usa tecnologia só no dia a dia", 0: "prefere ficar longe de programação" };
    const dur = S.getAnswer(QUESTIONS, answers, "duration");
    const durLabel = dur === "4" ? "de até 4 anos" : dur === "5" ? "de até 5 anos" : "de até 6 anos ou mais";
    const areas = S.getAreaFilter(QUESTIONS, answers);
    const areaNote = areas
      ? `Os cursos de <strong>${areas.map(x => esc(AREAS[x].label)).join(", ")}</strong>, que você marcou, ganham um bônus. Cursos de outras áreas ainda aparecem se combinarem muito com você.`
      : `Você não marcou uma área específica, então todas as áreas entram em pé de igualdade.`;
    const flat = a.val - sorted.at(-1).val < 0.5;
    return `${flat
        ? `Você marcou quase tudo com a mesma intensidade, então seu perfil ainda não tem um tipo dominante. Explorar os cursos pode ajudar a descobrir do que você gosta mais.`
        : `Seu perfil é principalmente <strong>${RIASEC_INFO[a.l].nome}</strong> (${RIASEC_INFO[a.l].desc})${b.val > sorted.at(-1).val
          ? `, com traços <strong>${RIASEC_INFO[b.l].nome}</strong> também fortes` : ""}.`}
      Você ${mathLabels[S.getAnswer(QUESTIONS, answers, "math")]} matemática,
      ${techLabels[S.getAnswer(QUESTIONS, answers, "tech")]}
      e topa uma graduação <strong>${durLabel}</strong>.<br><br>${areaNote}
      <div class="dims">${S.RIASEC.map((l, i) => {
        const pct = Math.round(((vec[i] - 1) / 4) * 100);
        return `<div class="dim"><span class="dim-label">${RIASEC_INFO[l].nome}</span>
          <span class="bar"><span style="width:${pct}%"></span></span><span class="dim-val">${pct}%</span></div>`;
      }).join("")}</div>
      <p class="tiny" style="margin-top:10px">Quanto você gostou das atividades de cada tipo, no modelo RIASEC de John Holland, muito usado em orientação vocacional.</p>`;
  }

  function emailResultsHref(code, ranked) {
    const lines = ranked.slice(0, 10).map((r, i) => `${i + 1}. ${r.name} — ${r.band.label}`);
    const body = "Meus resultados no UniMatch:\n\n" + lines.join("\n") +
      "\n\nVer o resultado completo: " + siteBase() + "#/resultado/" + code;
    return "mailto:?subject=" + encodeURIComponent("Meus resultados no UniMatch") + "&body=" + encodeURIComponent(body);
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
          <div class="factors">${[
            ["🎯 Perfil de interesses", match.breakdown.perfil],
            ["🧮 Matemática", match.breakdown.matematica],
            ["💻 Tecnologia", match.breakdown.tecnologia],
            ["📅 Duração", match.breakdown.duracao],
            ["💰 Salário", match.breakdown.salario],
            ["🧭 Área que você marcou", match.breakdown.area]
          ].filter(([, v]) => v !== null).map(([l, v]) => `<div class="factor"><span>${l}</span><span class="bar"><span style="width:${v}%"></span></span><span>${v}%</span></div>`).join("")}</div>
        </div>` : ""}

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
          <ul class="people">${extra.pessoas.map(pp => `<li>
            <div class="person-head"><strong>${esc(pp.nome)}</strong>
              <span class="badge ${pp.tipo === "curiosidade" ? "warn" : "accent"}">${pp.tipo === "curiosidade" ? "Curiosidade" : "Na área"}</span></div>
            <p class="muted small">${esc(pp.sobre)}${safeUrl(pp.fonte) ? ` <a href="${safeUrl(pp.fonte)}" target="_blank" rel="noopener">Fonte</a>` : ""}</p>
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
          Artístico, Social, Empreendedor, Convencional), criado pelo psicólogo John Holland. Cada curso também
          tem um perfil RIASEC, e a compatibilidade mede o quanto os dois se parecem. As outras perguntas comparam
          o que você topa de matemática, tecnologia, duração e salário com o que cada curso exige, e as áreas
          marcadas dão um bônus aos cursos delas.</p>
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
    const titles = { "": "Início", quiz: "Quiz", explorar: "Explorar cursos", sobre: "Sobre", resultado: "Seus resultados", curso: "" };
    const prev = currentRoute;
    currentRoute = page === "resultado" ? "quiz" : page === "curso" ? "explorar" : (page || "home");
    if (page !== "resultado") resultsShowAll = false;

    if (page === "") renderHome();
    else if (page === "quiz") renderQuizStart();
    else if (page === "resultado") renderResults(decodeURIComponent(param));
    else if (page === "explorar") renderExplorar();
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

  /* ── TEMA ── */
  document.getElementById("theme-btn").addEventListener("click", () => {
    const root = document.documentElement;
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("um_theme", root.dataset.theme); } catch (e) {}
  });

  loadState();
  window.addEventListener("hashchange", route);
  route();
})();
