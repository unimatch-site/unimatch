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

test("curso de interesse sobe no ranking, mas não vira o 1º à força", () => {
  // Perfil bem artístico que diz já gostar de Direito.
  const perfil = { letras: { A: 5, S: 3, I: 2 }, math: "1", tech: "1" };
  const sem = rank(perfil);
  const com = rank({ ...perfil, cursos_interesse: ["Direito"] });
  assert.ok(pos(com, "Direito") < pos(sem, "Direito"), `antes ${pos(sem, "Direito")}, depois ${pos(com, "Direito")}`);
  assert.ok(pos(com, "Direito") <= 10, `Direito deveria estar no top-10, está em ${pos(com, "Direito")}`);
  const d = com.find(r => r.name === "Direito");
  assert.equal(d.breakdown.interesse, 100);
  assert.equal(d.interesseRef, "Direito");
});

test("cursos parecidos com o escolhido também ganham pontos (menos que o escolhido)", () => {
  const com = rank({ letras: { I: 4, S: 4 }, cursos_interesse: ["Medicina"] });
  const med = com.find(r => r.name === "Medicina"), odonto = com.find(r => r.name === "Odontologia");
  const longe = com.find(r => r.name === "Engenharia de Minas");
  assert.equal(med.breakdown.interesse, 100);
  assert.ok(odonto.breakdown.interesse > 0 && odonto.breakdown.interesse < 100, String(odonto.breakdown.interesse));
  assert.equal(odonto.interesseRef, "Medicina");
  assert.equal(longe.breakdown.interesse, 0);
});

test("sem curso de interesse, o fator nem aparece", () => {
  rank({ letras: { I: 5 } }).forEach(r => assert.equal(r.breakdown.interesse, null));
});

test("no máximo 5 cursos de interesse e sem repetição", () => {
  const nomes = Object.keys(COURSES);
  assert.ok(S.isValidAnswers(QUESTIONS, answersWith({ cursos_interesse: nomes.slice(0, 5) })));
  assert.ok(!S.isValidAnswers(QUESTIONS, answersWith({ cursos_interesse: nomes.slice(0, 6) })));
  assert.ok(!S.isValidAnswers(QUESTIONS, answersWith({ cursos_interesse: ["Direito", "Direito"] })));
});

test("'Já decidi' dá mais peso ao curso escolhido que 'só curiosidade'", () => {
  const perfil = { letras: { A: 5, S: 3, I: 2 }, math: "1", tech: "1", cursos_interesse: ["Direito"] };
  const leve = rank({ ...perfil, certeza: "1" }), forte = rank({ ...perfil, certeza: "3" });
  assert.ok(pos(forte, "Direito") < pos(leve, "Direito"), `leve ${pos(leve, "Direito")}, forte ${pos(forte, "Direito")}`);
  assert.ok(pos(forte, "Direito") <= 3, `com 'já decidi' deveria estar no top-3, está em ${pos(forte, "Direito")}`);
  assert.equal(S.getCertainty(QUESTIONS, COURSES, answersWith(perfil)), "2");
});

test("pergunta de decisão só existe quando há curso escolhido", () => {
  const i = QUESTIONS.findIndex(q => q.dim === "certeza");
  const sem = answersWith({}), com = answersWith({ cursos_interesse: ["Medicina"], certeza: "3" });
  assert.equal(S.isQuestionActive(QUESTIONS, sem, i), false);
  assert.equal(S.isQuestionActive(QUESTIONS, com, i), true);
  assert.ok(S.isValidAnswers(QUESTIONS, sem) && S.isValidAnswers(QUESTIONS, com));
  // pulada mas com resposta, ou ativa mas "pulada": inválido
  const errado1 = [...sem]; errado1[i] = "3";
  const errado2 = [...com]; errado2[i] = "na";
  assert.ok(!S.isValidAnswers(QUESTIONS, errado1));
  assert.ok(!S.isValidAnswers(QUESTIONS, errado2));
  // e o link compartilhável continua funcionando nos dois casos
  [sem, com].forEach(a => assert.equal(JSON.stringify(S.decodeAnswers(QUESTIONS, S.encodeAnswers(QUESTIONS, a))), JSON.stringify(a)));
});

test("código Holland traz as 3 letras mais fortes, em ordem", () => {
  assert.equal(S.hollandCode([2, 4, 1, 5, 3, 1]), "SIE");
  assert.equal(S.isFlatProfile([3, 3, 3, 3, 3, 3]), true);
  assert.equal(S.isFlatProfile([2, 4, 1, 5, 3, 1]), false);
});

test("motivos em frases: coerentes com o perfil e com o curso", () => {
  const a = answersWith({ letras: { S: 5, I: 4 }, math: "0", tech: "0", duration: "4" });
  const ranked = S.computeScores(QUESTIONS, COURSES, a);
  const psico = ranked.find(r => r.name === "Psicologia");
  const w = S.explain(psico, COURSES.Psicologia, QUESTIONS, a);
  assert.ok(w.pros.some(t => /Social/.test(t)), JSON.stringify(w));
  const eng = ranked.find(r => r.name === "Engenharia Civil");
  const w2 = S.explain(eng, COURSES["Engenharia Civil"], QUESTIONS, a);
  assert.ok(w2.cons.some(t => /matemática/.test(t)), JSON.stringify(w2));
  assert.ok(w.cons.some(t => /Dura 5 anos/.test(t)), JSON.stringify(w));
  ranked.forEach(r => { const x = S.explain(r, COURSES[r.name], QUESTIONS, a); assert.ok(x.pros.length <= 3 && x.cons.length <= 2); });
});

test("'fora da caixa' é de uma área que não está no top 5", () => {
  const ranked = rank({ letras: { I: 5, C: 4 }, math: "3", tech: "3" });
  const w = S.outOfBox(ranked, COURSES);
  assert.ok(w, "deveria achar um curso fora da caixa");
  const topAreas = ranked.slice(0, 5).map(r => COURSES[r.name].area);
  assert.ok(!topAreas.includes(COURSES[w.name].area));
});

test("cursos parecidos não incluem o próprio curso e fazem sentido", () => {
  const sim = S.similarCourses("Ciências da Computação", COURSES, 4);
  assert.equal(sim.length, 4);
  assert.ok(!sim.includes("Ciências da Computação"));
  assert.ok(sim.every(n => ["tecnologia", "exatas"].includes(COURSES[n].area)), sim.join(", "));
});

test("faixas: Muito compatível ≥ 85, Compatível ≥ 70, Pode explorar abaixo", () => {
  assert.equal(S.bandFor(86).key, "alta");
  assert.equal(S.bandFor(84).key, "media");
  assert.equal(S.bandFor(70).key, "media");
  assert.equal(S.bandFor(69).key, "baixa");
  assert.equal(S.bandFor(40).key, "baixa");
});

test("link compartilhável: codificar e decodificar devolve as mesmas respostas", () => {
  const answers = answersWith({ letras: { A: 5, S: 1 }, areas_interesse: ["saude", "exatas", "artes"], cursos_interesse: ["Música", "Design"], math: "0" });
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
