/*
 * scoring-test.js — testes da lógica do quiz.
 * Como rodar:  node --test tests/scoring-test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../js/scoring.js");
const { QUESTIONS, COURSES } = require("./load-data.js")();
const answersWith = (o) => require("./helpers.js")(QUESTIONS, o);
const rank = (o) => S.computeScores(QUESTIONS, COURSES, answersWith(o));
const pos = (ranked, name) => ranked.findIndex(r => r.name === name) + 1;

test("o helper de teste gera respostas válidas", () => {
  assert.ok(S.isValidAnswers(QUESTIONS, answersWith()));
});

test("nota entre 0 e 100, ranking em ordem e todos os cursos presentes", () => {
  const ranked = rank({ letras: { I: 5, C: 4 } });
  assert.equal(ranked.length, Object.keys(COURSES).length);
  ranked.forEach(r => assert.ok(r.score >= 0 && r.score <= 100, r.name));
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].exact >= ranked[i].exact);
});

test("quem quer criar tecnologia vê Ciências da Computação no topo (bug antigo: ficava em 12º)", () => {
  const ranked = rank({ letras: { I: 5, R: 3, C: 4 }, math: "3", tech: "3", duration: "4", salary: "bastante" });
  assert.ok(pos(ranked, "Ciências da Computação") <= 5, `posição ${pos(ranked, "Ciências da Computação")}`);
});

test("'salário não pesa' é neutro: não favorece cursos que pagam pouco (bug antigo)", () => {
  const ranked = rank({ letras: { S: 5, A: 3 }, salary: "nada" });
  ranked.forEach(r => assert.equal(r.breakdown.salario, null));
  // Mesmo perfil com "um pouco": a ordem só pode mudar a favor de quem paga mais.
  const nada = rank({ letras: { S: 5, A: 3 }, salary: "nada" }).map(r => r.name);
  const muito = rank({ letras: { S: 5, A: 3 }, salary: "muito" });
  const pedagogia = muito.findIndex(r => r.name === "Pedagogia");
  assert.ok(pedagogia >= nada.indexOf("Pedagogia"), "Pedagogia (salário baixo) não pode subir quando o salário pesa mais");
});

test("áreas marcadas dão bônus, mas não escondem os outros cursos", () => {
  const ranked = rank({ letras: { S: 5 }, areas_interesse: ["saude"] });
  assert.equal(ranked.length, Object.keys(COURSES).length);
  assert.equal(COURSES[ranked[0].name].area, "saude");
});

test("perfil Social forte coloca cursos de cuidado no topo", () => {
  const top5 = rank({ letras: { S: 5, I: 3 }, math: "1", tech: "0" }).slice(0, 5).map(r => r.name);
  assert.ok(top5.some(n => ["Enfermagem", "Pedagogia", "Psicologia", "Terapia Ocupacional", "Fonoaudiologia", "Obstetrícia", "Gerontologia"].includes(n)), top5.join(", "));
});

test("marcar tudo igual não quebra: perfil plano gera um ranking válido", () => {
  const ranked = rank({ letras: { R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 } });
  assert.equal(ranked.length, Object.keys(COURSES).length);
  assert.ok(ranked.every(r => r.breakdown.perfil === 50));
});

test("faixas: Muito compatível ≥ 85, Compatível ≥ 70, Pode explorar abaixo", () => {
  assert.equal(S.bandFor(86).key, "alta");
  assert.equal(S.bandFor(84).key, "media");
  assert.equal(S.bandFor(70).key, "media");
  assert.equal(S.bandFor(69).key, "baixa");
  assert.equal(S.bandFor(40).key, "baixa");
});

test("link compartilhável: codificar e decodificar devolve as mesmas respostas", () => {
  const answers = answersWith({ letras: { A: 5, S: 1 }, areas_interesse: ["saude", "exatas", "artes"], math: "0" });
  const code = S.encodeAnswers(QUESTIONS, answers);
  assert.match(code, /^[0-9.\-]+$/);
  assert.equal(JSON.stringify(S.decodeAnswers(QUESTIONS, code)), JSON.stringify(answers));
});

test("link compartilhável inválido, adulterado ou do quiz antigo é rejeitado", () => {
  assert.equal(S.decodeAnswers(QUESTIONS, ""), null);
  assert.equal(S.decodeAnswers(QUESTIONS, "<script>"), null);
  assert.equal(S.decodeAnswers(QUESTIONS, "1-1-1-1-1-1-0.1-1-1-1-1"), null); // formato do quiz de 11 perguntas
  assert.equal(S.decodeAnswers(QUESTIONS, QUESTIONS.map(() => "99").join("-")), null);
});

test("slugs dos cursos são únicos e sem acento", () => {
  const slugs = Object.keys(COURSES).map(S.slugify);
  assert.equal(new Set(slugs).size, slugs.length);
  slugs.forEach(s => assert.match(s, /^[a-z0-9-]+$/));
  assert.equal(S.slugify("Ciências da Computação"), "ciencias-da-computacao");
});

test("busca ignora acentos", () => {
  assert.ok(S.normalize("Computação").includes(S.normalize("computacao")));
});
