/*
 * scoring-test.js — testes da lógica do quiz.
 * Como rodar:  node --test tests/
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../js/scoring.js");
const { QUESTIONS, COURSES } = require("./load-data.js")();

// Monta um conjunto completo de respostas a partir de alguns valores.
function answersWith(over = {}) {
  const base = {
    activity: "I", talent: "I", environment: "I", motivation: "I", team_role: "C", challenge: "I",
    areas_interesse: ["nenhuma"], math: "alto", tech: "alto", duration: "5", salary: "alto"
  };
  const merged = { ...base, ...over };
  return QUESTIONS.map(q => merged[q.dim]);
}

test("todas as perguntas do quiz têm uma resposta no helper de teste", () => {
  assert.ok(S.isValidAnswers(QUESTIONS, answersWith()));
});

test("pontuação fica entre 0 e 100 e o ranking está em ordem", () => {
  const ranked = S.computeScores(QUESTIONS, COURSES, answersWith());
  assert.equal(ranked.length, Object.keys(COURSES).length);
  ranked.forEach(r => assert.ok(r.score >= 0 && r.score <= 100, r.name));
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].score >= ranked[i].score);
});

test("marcar uma área filtra o ranking só para cursos daquela área", () => {
  const ranked = S.computeScores(QUESTIONS, COURSES, answersWith({ areas_interesse: ["saude", "artes"] }));
  assert.ok(ranked.length > 0);
  ranked.forEach(r => assert.ok(["saude", "artes"].includes(COURSES[r.name].area), r.name));
});

test("'Nenhuma em especial' mostra todos os cursos", () => {
  const ranked = S.computeScores(QUESTIONS, COURSES, answersWith({ areas_interesse: ["nenhuma"] }));
  assert.equal(ranked.length, Object.keys(COURSES).length);
});

test("afinidade 'mínima' com matemática vale 0 (bug antigo: era tratada como 5)", () => {
  // Para um curso com demanda matemática 0, "mínima" deve dar o máximo no fator matemática.
  const fake = { X: { vec: [5, 0, 5, 5, 5, 0], area: "artes", dur: "4", salMid: 3000 } };
  const [r] = S.computeScores(QUESTIONS, fake, answersWith({ math: "minimo" }));
  assert.equal(r.breakdown.matematica, 100);
});

test("link compartilhável: codificar e decodificar devolve as mesmas respostas", () => {
  const answers = answersWith({ areas_interesse: ["saude", "exatas", "artes"], math: "minimo" });
  const code = S.encodeAnswers(QUESTIONS, answers);
  assert.match(code, /^[0-9.\-]+$/);
  assert.equal(JSON.stringify(S.decodeAnswers(QUESTIONS, code)), JSON.stringify(answers));
});

test("link compartilhável inválido ou adulterado é rejeitado sem quebrar", () => {
  assert.equal(S.decodeAnswers(QUESTIONS, ""), null);
  assert.equal(S.decodeAnswers(QUESTIONS, "<script>"), null);
  assert.equal(S.decodeAnswers(QUESTIONS, "1-2-3"), null);
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
