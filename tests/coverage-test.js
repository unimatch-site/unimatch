/*
 * coverage-test.js — confere que todo curso consegue ficar em 1º lugar para
 * algum perfil de respostas (ou empatado com o 1º, quando dois cursos têm
 * exatamente os mesmos dados).
 *
 * Usa a MESMA função de pontuação do site (js/scoring.js).
 * Como rodar:  node tests/coverage-test.js
 * (sai com código 1 se algum curso nunca chegar ao topo — útil no GitHub Actions)
 */
const S = require("../js/scoring.js");
const { QUESTIONS, COURSES } = require("./load-data.js")();
const buildAnswers = require("./helpers.js");

const names = Object.keys(COURSES);
const LETTERS = S.RIASEC;
const DUR = ["4", "5", "6"], SAL = ["muito", "bastante", "pouco", "nada"];

// Gerador pseudoaleatório com semente fixa: o resultado é sempre o mesmo.
let seed = 42;
function rand() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = arr => arr[Math.floor(rand() * arr.length)];

const top1 = new Set(), top3 = new Set();
let profiles = 0;
function record(answers) {
  const ranked = S.computeScores(QUESTIONS, COURSES, answers);
  profiles++;
  ranked.filter(r => r.exact >= ranked[0].exact - 1e-9).forEach(r => top1.add(r.name)); // empates contam
  ranked.slice(0, 3).forEach(r => top3.add(r.name));
}

// 1) Para cada curso, o aluno "parecido com ele": interesses na forma do vec,
//    matemática/tecnologia iguais às do curso, área marcada, variando duração e salário.
names.forEach(name => {
  const c = COURSES[name];
  const lo = Math.min(...c.vec), hi = Math.max(...c.vec);
  const letras = {};
  LETTERS.forEach((l, i) => { letras[l] = hi > lo ? Math.round(1 + 4 * (c.vec[i] - lo) / (hi - lo)) : 3; });
  DUR.forEach(duration => SAL.forEach(salary => [["nenhuma"], [c.area]].forEach(areas_interesse =>
    record(buildAnswers(QUESTIONS, { letras, math: String(c.matematica), tech: String(c.tecnologia), duration, salary, areas_interesse })))));
});

// 2) Perfis aleatórios, para cobrir combinações mistas.
const samples = Number(process.env.SAMPLES || 20000);
const AREAS = [...new Set(names.map(n => COURSES[n].area))];
for (let i = 0; i < samples; i++) {
  const letras = {};
  LETTERS.forEach(l => { letras[l] = 1 + Math.floor(rand() * 5); });
  record(buildAnswers(QUESTIONS, {
    letras, math: pick(["0", "1", "2", "3"]), tech: pick(["0", "1", "2", "3"]),
    duration: pick(DUR), salary: pick(SAL), areas_interesse: rand() < 0.5 ? ["nenhuma"] : [pick(AREAS)]
  }));
}

const neverTop = names.filter(n => !top1.has(n));
const neverTop3 = names.filter(n => !top3.has(n));
console.log(`Perfis simulados: ${profiles.toLocaleString("pt-BR")}`);
console.log(`Cursos que chegam ao 1º lugar (ou empatam nele) para algum perfil: ${top1.size} / ${names.length}`);
if (neverTop.length) console.log("Nunca no topo:\n" + neverTop.map(c => " - " + c).join("\n"));
console.log(`Cursos que nunca aparecem no top-3: ${neverTop3.length}`);
if (neverTop3.length) console.log(neverTop3.map(c => " - " + c).join("\n"));
if (neverTop.length) process.exit(1);
