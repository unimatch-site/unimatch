/*
 * scoring.js — lógica pura do UniMatch (sem DOM).
 *
 * Usado tanto pelo site (index.html carrega este arquivo) quanto pelos testes
 * em Node (tests/*.js fazem require dele). Assim o teste de cobertura testa a
 * fórmula de verdade, e não uma cópia que pode ficar desatualizada.
 *
 * As fórmulas de computeScores são as mesmas do protótipo original.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.UniMatchScoring = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const RIASEC = ["R", "I", "A", "S", "E", "C"];
  const RIASEC_IDX = { R: 0, I: 1, A: 2, S: 3, E: 4, C: 5 };

  // Peso de cada pergunta central no vetor RIASEC do aluno.
  const CORE_QUESTIONS = [
    { dim: "activity",    weight: 3.0 },
    { dim: "talent",      weight: 2.5 },
    { dim: "environment", weight: 2.0 },
    { dim: "motivation",  weight: 2.5 },
    { dim: "team_role",   weight: 1.5 },
    { dim: "challenge",   weight: 2.0 }
  ];

  const MATH_SCORE = { alto: 10, medio: 6, baixo: 3, minimo: 0 };
  const SAL_SCORE  = { "muito-alto": 4, alto: 3, medio: 2, baixo: 1 };
  const TECH_SCORE = { "muito-alto": 10, alto: 7, moderado: 4, baixo: 1 };

  function getAnswer(questions, answers, dim) {
    const i = questions.findIndex(q => q.dim === dim);
    return i >= 0 ? answers[i] : undefined;
  }

  function buildUserVector(questions, answers) {
    const v = [0, 0, 0, 0, 0, 0];
    CORE_QUESTIONS.forEach(({ dim, weight }) => {
      const letter = getAnswer(questions, answers, dim);
      if (letter && RIASEC_IDX[letter] !== undefined) v[RIASEC_IDX[letter]] += weight;
    });
    return v;
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

  // Retorna os cursos ordenados por afinidade (0–100), com o detalhamento
  // de cada fator. Se o aluno marcou áreas específicas, só entram cursos
  // dessas áreas (a área funciona como filtro, não como bônus).
  function computeScores(questions, courses, answers) {
    const userVec = buildUserVector(questions, answers);
    const durPref = parseInt(getAnswer(questions, answers, "duration"), 10) || 6;
    const mathScore = MATH_SCORE[getAnswer(questions, answers, "math")] ?? 5;
    const salScore  = SAL_SCORE[getAnswer(questions, answers, "salary")] ?? 2;
    const techScore = TECH_SCORE[getAnswer(questions, answers, "tech")] ?? 4;
    const areaFilter = getAreaFilter(questions, answers);

    const names = Object.keys(courses).filter(n => !areaFilter || areaFilter.includes(courses[n].area));
    return names.map(name => {
      const c = courses[name];
      const sim = cosineSimilarity(userVec, c.vec);
      let score = sim * 70;

      const courseDur = parseInt(c.dur, 10);
      if (courseDur <= durPref) score += 8; else score -= (courseDur - durPref) * 4;

      const mathDemand = (c.vec[1] + c.vec[5]) / 2; // aproximação: Investigativo + Convencional
      const mathPts = Math.max(0, 8 - Math.abs(mathScore - mathDemand));
      score += mathPts;

      const courseSal = c.salMid >= 12000 ? 4 : c.salMid >= 8000 ? 3 : c.salMid >= 5000 ? 2 : 1;
      const salDiff = Math.abs(salScore - courseSal);
      if (salDiff === 0) score += 7; else if (salDiff === 1) score += 4;

      const techPts = Math.max(0, 7 - Math.abs(techScore - c.vec[1])); // aproximação: Investigativo
      score += techPts;

      return {
        name,
        score: Math.min(100, Math.max(0, Math.round(score))),
        breakdown: {
          perfil: Math.round(sim * 100),
          matematica: Math.round((mathPts / 8) * 100),
          tecnologia: Math.round((techPts / 7) * 100),
          duracao: courseDur <= durPref ? 100 : Math.max(0, 100 - (courseDur - durPref) * 40),
          salario: salDiff === 0 ? 100 : salDiff === 1 ? 57 : 20
        }
      };
    }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "pt-BR"));
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
    RIASEC, CORE_QUESTIONS,
    getAnswer, buildUserVector, cosineSimilarity, getAreaFilter, computeScores,
    isValidAnswers, encodeAnswers, decodeAnswers, slugify, normalize
  };
});
