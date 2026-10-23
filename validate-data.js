/*
 * validate-data.js — confere se data.js está íntegro antes de publicar.
 *
 * Como rodar (precisa de Node instalado):
 *   node validate-data.js
 *
 * Isso NÃO verifica se os números estão corretos (nota de corte real,
 * salário real etc.) — só confere se a estrutura do arquivo está consistente
 * (campos faltando, tipos errados, valores fora de faixa plausível).
 * Verificar se o valor em si bate com a fonte oficial continua sendo
 * trabalho manual da equipe.
 */

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const dataPath = path.join(__dirname, "data.js");
const code = fs.readFileSync(dataPath, "utf8");

const sandbox = {};
vm.createContext(sandbox);
const exportLine = "\nglobalThis.__EXPORTS__ = { QUESTIONS, COURSES, SITE_CONFIG, COURSE_EXTRAS, VETERANS, MENTORIAS };";
try {
  vm.runInContext(code + exportLine, sandbox);
} catch (err) {
  console.error("❌ data.js tem um erro de sintaxe JavaScript:", err.message);
  process.exit(1);
}

const { COURSES, QUESTIONS, SITE_CONFIG, COURSE_EXTRAS, VETERANS, MENTORIAS } = sandbox.__EXPORTS__;
let errors = 0;
let warnings = 0;

function fail(msg) {
  errors++;
  console.error("❌ " + msg);
}
function warn(msg) {
  warnings++;
  console.warn("⚠️  " + msg);
}

// ── Checagens de QUESTIONS ──
if (!Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
  fail("QUESTIONS está vazio ou não é um array.");
} else {
  QUESTIONS.forEach((q, i) => {
    if (!q.q || !q.dim || !Array.isArray(q.opts) || q.opts.length < 2) {
      fail(`Pergunta #${i + 1} está incompleta (texto, dimensão ou opções faltando).`);
    }
  });
}

// As 24 afirmações precisam ter 4 por letra RIASEC (senão uma letra pesa mais que outra).
const porLetra = {};
QUESTIONS.filter((q) => q.dim === "likert").forEach((q) => { porLetra[q.letra] = (porLetra[q.letra] || 0) + 1; });
["R", "I", "A", "S", "E", "C"].forEach((l) => {
  if (!porLetra[l]) fail(`Nenhuma afirmação do quiz mede a letra ${l}.`);
  else if (porLetra[l] !== porLetra.R) warn(`A letra ${l} tem ${porLetra[l]} afirmações e a R tem ${porLetra.R}: o ideal é o mesmo número para todas.`);
});
["areas_interesse", "math", "tech", "duration", "salary"].forEach((d) => {
  if (!QUESTIONS.some((q) => q.dim === d)) fail(`Falta a pergunta de contexto "${d}" no quiz.`);
});

// ── Checagens de SITE_CONFIG ──
if (!SITE_CONFIG || !SITE_CONFIG.contatoEmail) {
  fail("SITE_CONFIG.contatoEmail está faltando (é o e-mail de contato do rodapé).");
}

// ── Checagens de COURSES ──
const requiredFields = ["vec", "area", "matematica", "tecnologia", "desc", "carreiras", "fuvest", "notaSISU", "sal", "salMid", "emp", "empScore", "dem", "dur", "tags"];
const names = Object.keys(COURSES || {});

if (names.length === 0) {
  fail("COURSES está vazio.");
}

console.log(`Conferindo ${names.length} cursos...\n`);

names.forEach((name) => {
  const c = COURSES[name];

  requiredFields.forEach((field) => {
    if (c[field] === undefined || c[field] === null || c[field] === "") {
      fail(`"${name}": campo "${field}" está faltando ou vazio.`);
    }
  });

  if (Array.isArray(c.vec)) {
    if (c.vec.length !== 6) {
      fail(`"${name}": vec deveria ter 6 posições (RIASEC: R,I,A,S,E,C), tem ${c.vec.length}.`);
    }
    if (c.vec.some((n) => typeof n !== "number" || Number.isNaN(n))) {
      fail(`"${name}": vec tem valor não-numérico.`);
    }
  }

  if (c.fuvest) {
    ["ac", "ep", "ppi"].forEach((k) => {
      const v = c.fuvest[k];
      if (typeof v !== "number" || Number.isNaN(v)) {
        fail(`"${name}": fuvest.${k} não é número.`);
      } else if (v < 0 || v > 90) {
        fail(`"${name}": fuvest.${k} = ${v} está fora da escala válida (0–90).`);
      }
    });
    // Ampla concorrência deveria normalmente exigir nota >= Escola Pública >= EP+PPI
    if (typeof c.fuvest.ac === "number" && typeof c.fuvest.ep === "number" && c.fuvest.ep > c.fuvest.ac) {
      warn(`"${name}": nota de Escola Pública (${c.fuvest.ep}) é maior que Ampla Concorrência (${c.fuvest.ac}) — confira, isso é incomum.`);
    }
  }

  if (typeof c.notaSISU === "string") {
    const n = parseFloat(c.notaSISU);
    if (Number.isNaN(n)) fail(`"${name}": notaSISU "${c.notaSISU}" não é um número válido.`);
  }

  if (typeof c.salMid === "number") {
    if (c.salMid <= 0 || c.salMid > 100000) {
      warn(`"${name}": salMid = ${c.salMid} parece fora da faixa plausível — confira.`);
    }
  }

  if (!["Baixa", "Média", "Alta", "Muito Alta"].includes(c.emp)) {
    warn(`"${name}": emp = "${c.emp}" usa um rótulo fora do padrão esperado (Baixa/Média/Alta/Muito Alta).`);
  }

  if (typeof c.empScore === "number" && (c.empScore < 0 || c.empScore > 10)) {
    warn(`"${name}": empScore = ${c.empScore} fora da faixa esperada (0–10).`);
  }

  ["matematica", "tecnologia"].forEach((k) => {
    if (![0, 1, 2, 3].includes(c[k])) fail(`"${name}": ${k} = ${c[k]} deveria ser 0, 1, 2 ou 3.`);
  });

  if (!Array.isArray(c.tags) || c.tags.length === 0) {
    fail(`"${name}": tags está vazio.`);
  }

  const validAreas = ["saude","exatas","tecnologia","humanas","negocios","artes","ambiental"];
  if (!validAreas.includes(c.area)) {
    fail(`"${name}": area "${c.area}" não é uma das 7 categorias válidas.`);
  }

  const dur = parseInt(c.dur, 10);
  if (![4, 5, 6].includes(dur)) {
    warn(`"${name}": dur = "${c.dur}" é incomum (esperado 4, 5 ou 6).`);
  }
});

// ── Checagens de COURSE_EXTRAS ──
const isUrl = (u) => typeof u === "string" && /^https?:\/\//.test(u);
Object.keys(COURSE_EXTRAS || {}).forEach((name) => {
  const x = COURSE_EXTRAS[name];
  if (!COURSES[name]) fail(`COURSE_EXTRAS: "${name}" não existe em COURSES (confira o nome exato).`);
  ["provaoPaulista", "olimpiadas"].forEach((k) => {
    if (x[k] === undefined) return;
    if (!x[k].texto) fail(`COURSE_EXTRAS "${name}": ${k}.texto está vazio.`);
    if (!isUrl(x[k].fonte)) warn(`COURSE_EXTRAS "${name}": ${k} está sem link de fonte (fonte: "https://...").`);
  });
  (x.pessoas || []).forEach((pp, k) => {
    if (!pp.nome || !pp.sobre) fail(`COURSE_EXTRAS "${name}": pessoa #${k + 1} sem nome ou sem texto.`);
    if (!["area", "curiosidade"].includes(pp.tipo)) fail(`COURSE_EXTRAS "${name}": tipo de "${pp.nome}" deve ser "area" ou "curiosidade".`);
    if (pp.fonte && !isUrl(pp.fonte)) fail(`COURSE_EXTRAS "${name}": fonte de "${pp.nome}" precisa começar com https://`);
  });
  if (x.ondeEstudar !== undefined && (!Array.isArray(x.ondeEstudar) || x.ondeEstudar.some((u) => !u.nome))) {
    fail(`COURSE_EXTRAS "${name}": ondeEstudar deve ser uma lista de { nome, obs }.`);
  }
});

// ── Checagens de VETERANS (LGPD: nada de contato pessoal no arquivo público) ──
const emailLike = /[\w.+-]+@[\w-]+\.[\w.]+/;
(VETERANS || []).forEach((v, i) => {
  const who = `VETERANS #${i + 1} (${v.nome || "sem nome"})`;
  if (!v.nome) fail(`${who}: nome está faltando.`);
  if (!COURSES[v.curso]) fail(`${who}: curso "${v.curso}" não existe em COURSES.`);
  if (!v.linkedin && !v.formulario) warn(`${who}: sem LinkedIn nem formulário, o card não terá botão de contato.`);
  if (v.linkedin && !isUrl(v.linkedin)) fail(`${who}: linkedin precisa começar com https://`);
  if (v.formulario && !isUrl(v.formulario)) fail(`${who}: formulario precisa começar com https://`);
  if (v.email || v.telefone || emailLike.test(JSON.stringify(v))) {
    fail(`${who}: parece ter e-mail ou telefone pessoal. Não coloque contato pessoal aqui (o arquivo é público).`);
  }
});

// ── Checagens de MENTORIAS ──
(MENTORIAS || []).forEach((m, i) => {
  const who = `MENTORIAS #${i + 1}`;
  if (!COURSES[m.curso]) fail(`${who}: curso "${m.curso}" não existe em COURSES.`);
  if (m.data && Number.isNaN(new Date(m.data).getTime())) fail(`${who}: data "${m.data}" inválida (use "2026-11-10T19:00").`);
  if (m.link && !isUrl(m.link)) fail(`${who}: link precisa começar com https://`);
});

console.log(`\n${errors === 0 ? "✅" : "❌"} ${errors} erro(s), ${warnings} aviso(s).`);
if (errors > 0) process.exit(1);
