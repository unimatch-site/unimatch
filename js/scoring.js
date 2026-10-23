/*
 * scoring.js — lógica pura do UniMatch (sem DOM).
 *
 * Usado tanto pelo site (index.html carrega este arquivo) quanto pelos testes
 * em Node (tests/*.js fazem require dele). Assim os testes testam a fórmula
 * de verdade, e não uma cópia que pode ficar desatualizada.
 *
 * COMO A NOTA DE CADA CURSO É CALCULADA (0 a 100)
 *
 *   Perfil RIASEC ..... 55 pts  compara as 24 afirmações com o `vec` do curso
 *   Matemática ........ 12 pts  compara a resposta com `matematica` do curso
 *   Tecnologia ........ 12 pts  compara a resposta com `tecnologia` do curso
 *   Duração ...........  8 pts  perde pontos se o curso é mais longo que o aceito
 *   Salário ........... até 13  só conta se o aluno disse que o salário pesa
 *   Área marcada ...... 15 pts  bônus para cursos das áreas que o aluno marcou
 *
 * A nota final é a soma dividida pelo máximo possível PARA AQUELE ALUNO
 * (quem diz que salário não pesa não perde nada por isso).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.UniMatchScoring = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const RIASEC = ["R", "I", "A", "S", "E", "C"];

  const WEIGHTS = { perfil: 55, matematica: 12, tecnologia: 12, duracao: 8, salario: 13, area: 15 };
  const SALARY_WEIGHT = { muito: 1, bastante: 0.66, pouco: 0.33, nada: 0 };

  // Faixas mostradas ao aluno no lugar de "81% contra 80%".
  const BANDS = [
    { min: 85, key: "alta",  label: "Muito compatível" },
    { min: 70, key: "media", label: "Compatível" },
    { min: 0,  key: "baixa", label: "Pode explorar" }
  ];

  function getAnswer(questions, answers, dim) {
    const i = questions.findIndex(q => q.dim === dim);
    return i >= 0 ? answers[i] : undefined;
  }

  // Média (1 a 5) das afirmações de cada letra RIASEC.
  function buildUserVector(questions, answers) {
    const sum = [0, 0, 0, 0, 0, 0], count = [0, 0, 0, 0, 0, 0];
    questions.forEach((q, i) => {
      if (q.dim !== "likert") return;
      const k = RIASEC.indexOf(q.letra), v = Number(answers[i]);
      if (k >= 0 && v >= 1 && v <= 5) { sum[k] += v; count[k]++; }
    });
    return sum.map((s, k) => (count[k] ? s / count[k] : 3));
  }

  // Subtrai a média: o que importa é a FORMA do perfil (o que a pessoa gosta
  // mais e menos), não se ela marcou tudo alto ou tudo baixo.
  function center(v) {
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return v.map(x => x - m);
  }

  function cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i]; }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  function getAreaFilter(questions, answers) {
    const areas = getAnswer(questions, answers, "areas_interesse");
    const list = Array.isArray(areas) ? areas : [];
    return list.length > 0 && !list.includes("nenhuma") ? list : null;
  }

  // Encaixe entre o que o aluno quer (0–3) e o que o curso exige (0–3).
  // Curso exigindo MAIS do que o aluno topa pesa mais que o contrário.
  function levelFit(user, course, overPenalty, underPenalty) {
    const over = Math.max(0, course - user), under = Math.max(0, user - course);
    return Math.max(0, 1 - (over * overPenalty + under * underPenalty) / 3);
  }

  function bandFor(score) {
    return BANDS.find(b => score >= b.min);
  }

  // Retorna todos os cursos ordenados por nota (0–100), com o detalhamento.
  function computeScores(questions, courses, answers) {
    const user = center(buildUserVector(questions, answers));
    const mathUser = Number(getAnswer(questions, answers, "math") ?? 1.5);
    const techUser = Number(getAnswer(questions, answers, "tech") ?? 1.5);
    const durPref = parseInt(getAnswer(questions, answers, "duration"), 10) || 6;
    const salW = SALARY_WEIGHT[getAnswer(questions, answers, "salary")] ?? 0.33;
    const areas = getAreaFilter(questions, answers);

    const names = Object.keys(courses);
    const sals = names.map(n => courses[n].salMid);
    const salMin = Math.min(...sals), salMax = Math.max(...sals);
    const max = WEIGHTS.perfil + WEIGHTS.matematica + WEIGHTS.tecnologia + WEIGHTS.duracao +
      WEIGHTS.salario * salW + (areas ? WEIGHTS.area : 0);

    return names.map(name => {
      const c = courses[name];
      const perfil = (cosineSimilarity(user, center(c.vec)) + 1) / 2;   // 0 a 1
      const matematica = levelFit(mathUser, c.matematica, 1, 0.3);
      const tecnologia = levelFit(techUser, c.tecnologia, 1, 0.6);
      const dur = parseInt(c.dur, 10);
      const duracao = dur <= durPref ? 1 : Math.max(0, 1 - 0.5 * (dur - durPref));
      const salario = salMax > salMin ? (c.salMid - salMin) / (salMax - salMin) : 0.5;
      const area = areas && areas.includes(c.area) ? 1 : 0;

      const pts = perfil * WEIGHTS.perfil + matematica * WEIGHTS.matematica +
        tecnologia * WEIGHTS.tecnologia + duracao * WEIGHTS.duracao +
        salario * WEIGHTS.salario * salW + area * (areas ? WEIGHTS.area : 0);
      const score = Math.round((pts / max) * 100);
      return {
        name,
        score,
        exact: pts / max,
        band: bandFor(score),
        breakdown: {
          perfil: Math.round(perfil * 100),
          matematica: Math.round(matematica * 100),
          tecnologia: Math.round(tecnologia * 100),
          duracao: Math.round(duracao * 100),
          salario: salW > 0 ? Math.round(salario * 100) : null,
          area: areas ? area * 100 : null
        }
      };
    }).sort((a, b) => b.exact - a.exact || a.name.localeCompare(b.name, "pt-BR"));
  }

  // Confere se um conjunto de respostas é válido para as perguntas atuais.
  // Usado para não quebrar o site com links compartilhados antigos/alterados.
  function isValidAnswers(questions, answers) {
    if (!Array.isArray(answers) || answers.length !== questions.length) return false;
    return questions.every((q, i) => {
      const a = answers[i];
      const valid = q.opts.map(o => o.v);
      if (q.multi) return Array.isArray(a) && a.length > 0 && a.every(v => valid.includes(v));
      return typeof a === "string" && valid.includes(a);
    });
  }

  // Codifica as respostas num texto curto para o link compartilhável:
  // cada resposta vira o índice da opção (multi: índices separados por ".").
  function encodeAnswers(questions, answers) {
    return answers.map((a, i) => {
      const vals = questions[i].opts.map(o => o.v);
      return Array.isArray(a) ? a.map(v => vals.indexOf(v)).join(".") : String(vals.indexOf(a));
    }).join("-");
  }

  function decodeAnswers(questions, code) {
    if (typeof code !== "string" || !/^[0-9.\-]+$/.test(code)) return null;
    const parts = code.split("-");
    if (parts.length !== questions.length) return null;
    const answers = parts.map((p, i) => {
      const q = questions[i];
      const pick = n => (q.opts[Number(n)] || {}).v;
      return q.multi ? p.split(".").map(pick) : pick(p);
    });
    return isValidAnswers(questions, answers) ? answers : null;
  }

  // "Ciências da Computação" -> "ciencias-da-computacao"
  function slugify(text) {
    return normalize(text).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // Minúsculas e sem acentos, para busca ("computacao" acha "Computação").
  function normalize(text) {
    return String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  return {
    RIASEC, WEIGHTS, BANDS,
    getAnswer, buildUserVector, cosineSimilarity, getAreaFilter, computeScores, bandFor,
    isValidAnswers, encodeAnswers, decodeAnswers, slugify, normalize
  };
});
