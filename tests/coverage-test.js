/*
 * coverage-test.js — testa se cada curso consegue ser a recomendação #1
 * para pelo menos uma combinação de respostas do quiz, e se nenhum curso
 * fica sempre fora do top-3.
 *
 * Usa a MESMA função de pontuação do site (js/scoring.js), então o teste
 * nunca fica desatualizado em relação ao que o aluno vê.
 *
 * Como rodar:  node tests/coverage-test.js
 * (sai com código 1 se algum curso nunca aparecer em #1 — útil no GitHub Actions)
 */
const S = require("../js/scoring.js");
const { QUESTIONS, COURSES } = require("./load-data.js")();

const dims = QUESTIONS.map(q => q.dim);
const optsOf = dim => QUESTIONS.find(q => q.dim === dim).opts.map(o => o.v);
const CORE = S.CORE_QUESTIONS.map(c => c.dim);
const AREAS = optsOf("areas_interesse").filter(v => v !== "nenhuma");
const MATH = optsOf("math"), TECH = optsOf("tech"), DUR = optsOf("duration"), SAL = optsOf("salary");

// Gerador pseudoaleatório com semente fixa: o resultado é sempre o mesmo.
let seed = 42;
function rand() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const rank1 = new Set(), top3 = new Set();
let profiles = 0;

function testCombo(letters) {
  MATH.forEach(m => TECH.forEach(t => DUR.forEach(d => SAL.forEach(s => {
    [["nenhuma"], ...AREAS.map(a => [a])].forEach(areas => {
      const byDim = { math: m, tech: t, duration: d, salary: s, areas_interesse: areas };
      CORE.forEach((dim, i) => { byDim[dim] = letters[i]; });
      const ranked = S.computeScores(QUESTIONS, COURSES, dims.map(dim => byDim[dim]));
      profiles++;
      if (!ranked.length) return;
      rank1.add(ranked[0].name);
      ranked.slice(0, 3).forEach(r => top3.add(r.name));
    });
  }))));
}

const L = S.RIASEC;
L.forEach(l => testCombo(Array(6).fill(l)));                       // perfis "puros"
L.forEach(a => L.forEach(b => { if (a !== b) testCombo([a, a, a, b, b, b]); })); // metade/metade
// 5 respostas numa letra e 1 em outra, em cada posição (ex: tudo "I" menos o talento "R")
L.forEach(a => L.forEach(b => { if (a !== b) CORE.forEach((_, pos) => {
  const letters = Array(6).fill(a); letters[pos] = b; testCombo(letters);
}); }));
const samples = Number(process.env.SAMPLES || 600);
for (let i = 0; i < samples; i++) testCombo(CORE.map(() => L[Math.floor(rand() * 6)])); // mistos

const all = Object.keys(COURSES);
const neverRank1 = all.filter(c => !rank1.has(c));
const neverTop3 = all.filter(c => !top3.has(c));

console.log(`Perfis simulados: ${profiles.toLocaleString("pt-BR")}`);
console.log(`Cursos que aparecem em #1 para pelo menos 1 perfil: ${rank1.size} / ${all.length}`);
if (neverRank1.length) console.log("Nunca em #1:\n" + neverRank1.map(c => " - " + c).join("\n"));
console.log(`Cursos que nunca aparecem no top-3: ${neverTop3.length}`);
if (neverTop3.length) console.log(neverTop3.map(c => " - " + c).join("\n"));
if (neverRank1.length) process.exit(1);
