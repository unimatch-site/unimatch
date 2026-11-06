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
 *   Curso de interesse  15/30/45 bônus para o curso que o aluno já disse que
 *                               quer, conforme o quanto ele está decidido
 *                               ("só curiosidade" / "bastante interesse" /
 *                               "já decidi"). Cursos muito parecidos com ele
 *                               ganham até metade disso.
 *
 * A nota final é a soma dividida pelo máximo possível PARA AQUELE ALUNO
 * (quem diz que salário não pesa não perde nada por isso).
 *
 * Por que o bônus de interesse pode chegar a 45: há estudantes já decididos
 * por um curso cujo perfil de interesses é pouco comum naquela área. O quiz
 * não deve "brigar" com essa decisão; por isso, para quem diz "já decidi", o
 * site também mostra o curso escolhido primeiro, com o que combina e o que
 * vale checar (ver js/app.js, modo "decidido").
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.UniMatchScoring = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const RIASEC = ["R", "I", "A", "S", "E", "C"];
  const RIASEC_NAMES = { R: "Realista", I: "Investigativo", A: "Artístico", S: "Social", E: "Empreendedor", C: "Convencional" };

  const WEIGHTS = { perfil: 55, matematica: 12, tecnologia: 12, duracao: 8, salario: 13, area: 15 };
  // Bônus do curso de interesse conforme a resposta "Quanto você já está decidido(a)?".
  const CERTAINTY_WEIGHT = { "1": 15, "2": 30, "3": 45 };
  const DEFAULT_INTEREST_WEIGHT = 30;
  // Cursos "parecidos" (semelhança ≥ 0,85) ganham até metade do bônus de interesse.
  const SIMILAR_MIN = 0.85, SIMILAR_MAX_SHARE = 0.5;
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

  /* ── Perguntas condicionais ──
     Uma pergunta com `showIf: { dim, notOnly }` só aparece se a resposta da
     pergunta `dim` tiver algo além dos valores em `notOnly`. Quando ela não
     aparece, a resposta guardada é o valor da opção marcada com `skip: true`. */
  function isQuestionActive(questions, answers, i) {
    const q = questions[i];
    if (!q.showIf) return true;
    const ref = getAnswer(questions, answers, q.showIf.dim);
    const list = Array.isArray(ref) ? ref : ref ? [ref] : [];
    return list.some(v => !q.showIf.notOnly.includes(v));
  }
  function skipValue(q) {
    const o = q.opts.find(x => x.skip);
    return o ? o.v : undefined;
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

  // Código Holland: as 3 letras mais fortes, da maior para a menor (ex: "SIA").
  function hollandCode(vec, size = 3) {
    return RIASEC.map((l, i) => ({ l, v: vec[i], i }))
      .sort((a, b) => b.v - a.v || a.i - b.i).slice(0, size).map(x => x.l).join("");
  }
  function isFlatProfile(vec) {
    return Math.max(...vec) - Math.min(...vec) < 0.5;
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

  // Semelhança entre dois cursos (0 a 1): 60% perfil RIASEC, 25% mesma área,
  // 15% exigência parecida de matemática e tecnologia.
  function courseSimilarity(a, b) {
    const riasec = (cosineSimilarity(center(a.vec), center(b.vec)) + 1) / 2;
    const levels = 1 - (Math.abs(a.matematica - b.matematica) + Math.abs(a.tecnologia - b.tecnologia)) / 6;
    return 0.6 * riasec + 0.25 * (a.area === b.area ? 1 : 0) + 0.15 * levels;
  }

  // Os `n` cursos mais parecidos com `name`.
  function similarCourses(name, courses, n = 3) {
    return Object.keys(courses).filter(x => x !== name)
      .map(x => ({ name: x, sim: courseSimilarity(courses[name], courses[x]) }))
      .sort((a, b) => b.sim - a.sim || a.name.localeCompare(b.name, "pt-BR"))
      .slice(0, n).map(x => x.name);
  }

  function getChosenCourses(questions, courses, answers) {
    const list = getAnswer(questions, answers, "cursos_interesse");
    return Array.isArray(list) ? list.filter(n => courses[n]) : [];
  }

  // "1" só curiosidade · "2" bastante interesse · "3" já decidi · null sem curso escolhido
  function getCertainty(questions, courses, answers) {
    if (!getChosenCourses(questions, courses, answers).length) return null;
    const v = getAnswer(questions, answers, "certeza");
    return CERTAINTY_WEIGHT[v] ? v : null;
  }

  // Quanto do bônus de interesse um curso recebe (0 a 1) e por causa de qual escolha.
  function interestBoost(name, chosen, courses) {
    let best = { share: 0, ref: null };
    chosen.forEach(ref => {
      const share = ref === name ? 1
        : Math.max(0, (courseSimilarity(courses[name], courses[ref]) - SIMILAR_MIN) / (1 - SIMILAR_MIN)) * SIMILAR_MAX_SHARE;
      if (share > best.share) best = { share, ref };
    });
    return best;
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
    const chosen = getChosenCourses(questions, courses, answers);
    const certainty = getCertainty(questions, courses, answers);
    const interestW = chosen.length ? (CERTAINTY_WEIGHT[certainty] || DEFAULT_INTEREST_WEIGHT) : 0;

    const names = Object.keys(courses);
    const sals = names.map(n => courses[n].salMid);
    const salMin = Math.min(...sals), salMax = Math.max(...sals);
    const max = WEIGHTS.perfil + WEIGHTS.matematica + WEIGHTS.tecnologia + WEIGHTS.duracao +
      WEIGHTS.salario * salW + (areas ? WEIGHTS.area : 0) + interestW;

    return names.map(name => {
      const c = courses[name];
      const perfil = (cosineSimilarity(user, center(c.vec)) + 1) / 2;   // 0 a 1
      const matematica = levelFit(mathUser, c.matematica, 1, 0.3);
      const tecnologia = levelFit(techUser, c.tecnologia, 1, 0.6);
      const dur = parseInt(c.dur, 10);
      const duracao = dur <= durPref ? 1 : Math.max(0, 1 - 0.5 * (dur - durPref));
      const salario = salMax > salMin ? (c.salMid - salMin) / (salMax - salMin) : 0.5;
      const area = areas && areas.includes(c.area) ? 1 : 0;
      const boost = chosen.length ? interestBoost(name, chosen, courses) : { share: 0, ref: null };

      const pts = perfil * WEIGHTS.perfil + matematica * WEIGHTS.matematica +
        tecnologia * WEIGHTS.tecnologia + duracao * WEIGHTS.duracao +
        salario * WEIGHTS.salario * salW + area * (areas ? WEIGHTS.area : 0) +
        boost.share * interestW;
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
          area: areas ? area * 100 : null,
          interesse: chosen.length ? Math.round(boost.share * 100) : null
        },
        // Curso escolhido pelo aluno que deu o bônus (o próprio curso ou um parecido).
        interesseRef: boost.share > 0 ? boost.ref : null
      };
    }).sort((a, b) => b.exact - a.exact || a.name.localeCompare(b.name, "pt-BR"));
  }

  /* ── Motivos em frases ──
     Explicar POR QUE um curso apareceu aumenta a confiança nas recomendações
     (ver ANALISE.md). Cada curso ganha até 3 pontos a favor e 2 de atenção. */
  function explain(result, course, questions, answers) {
    const vec = buildUserVector(questions, answers);
    const userTop = hollandCode(vec, 2).split("");
    const courseTop = RIASEC.map((l, i) => ({ l, v: course.vec[i], i }))
      .sort((a, b) => b.v - a.v || a.i - b.i).slice(0, 2).map(x => x.l);
    const mathUser = Number(getAnswer(questions, answers, "math"));
    const techUser = Number(getAnswer(questions, answers, "tech"));
    const durPref = parseInt(getAnswer(questions, answers, "duration"), 10) || 6;
    const dur = parseInt(course.dur, 10);
    const pros = [], cons = [];
    const b = result.breakdown;

    if (result.interesseRef === result.name) pros.push("Você disse que tem interesse neste curso");
    else if (result.interesseRef) pros.push(`É parecido com ${result.interesseRef}, que você escolheu`);

    const shared = courseTop.filter(l => userTop.includes(l));
    if (!isFlatProfile(vec) && b.perfil >= 75 && shared.length) {
      pros.push(`Combina com seu lado ${shared.map(l => RIASEC_NAMES[l]).join(" e ")}`);
    } else if (!isFlatProfile(vec) && b.perfil < 55) {
      const missing = courseTop.find(l => !userTop.includes(l));
      if (missing) cons.push(`O dia a dia do curso puxa para o lado ${RIASEC_NAMES[missing]}, que apareceu pouco nas suas respostas`);
    }
    if (b.area === 100) pros.push("É de uma área que você marcou");

    if (course.matematica > mathUser) cons.push(course.matematica === 3 ? "Tem bastante matemática, mais do que você disse que curte" : "Tem mais matemática do que você disse que curte");
    else if (course.matematica >= 2 && mathUser >= 2) pros.push("Usa matemática, que você curte");
    else if (course.matematica === 0 && mathUser <= 1) pros.push("Quase não tem matemática");

    if (course.tecnologia > techUser + 1) cons.push("Usa mais computação e programação do que você prefere");
    else if (course.tecnologia >= 2 && techUser >= 2) pros.push("Tem tecnologia no centro, como você quer");

    if (dur > durPref) cons.push(`Dura ${dur} anos, mais do que você topa`);
    if (b.salario !== null && b.salario >= 55) pros.push("Salário médio acima da maioria dos cursos");

    return { pros: pros.slice(0, 3), cons: cons.slice(0, 2) };
  }

  // Um curso bem colocado de uma área que NÃO aparece entre os 5 primeiros:
  // ajuda a ampliar o repertório em vez de só confirmar o que já se espera.
  function outOfBox(ranked, courses) {
    const topAreas = new Set(ranked.slice(0, 5).map(r => courses[r.name].area));
    return ranked.slice(5).find(r => !topAreas.has(courses[r.name].area) && r.score >= 50) || null;
  }

  // Confere se um conjunto de respostas é válido para as perguntas atuais.
  // Usado para não quebrar o site com links compartilhados antigos/alterados.
  function isValidAnswers(questions, answers) {
    if (!Array.isArray(answers) || answers.length !== questions.length) return false;
    return questions.every((q, i) => {
      const a = answers[i];
      if (q.showIf) {
        const skip = skipValue(q);
        if (!isQuestionActive(questions, answers, i)) return a === skip;
        if (a === skip) return false;
      }
      const valid = q.opts.filter(o => !o.skip).map(o => o.v);
      if (q.multi) return Array.isArray(a) && a.length > 0 && (!q.max || a.length <= q.max) &&
        new Set(a).size === a.length && a.every(v => valid.includes(v));
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
    RIASEC, RIASEC_NAMES, WEIGHTS, CERTAINTY_WEIGHT, BANDS,
    getAnswer, buildUserVector, hollandCode, isFlatProfile, cosineSimilarity, getAreaFilter,
    computeScores, bandFor, explain, outOfBox,
    courseSimilarity, similarCourses, getChosenCourses, getCertainty,
    isQuestionActive, skipValue,
    isValidAnswers, encodeAnswers, decodeAnswers, slugify, normalize
  };
});
