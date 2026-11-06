// Monta respostas completas do quiz a partir de um resumo, para os testes.
//   letras: nota de 1 a 5 para cada letra RIASEC, ex: { I: 5, C: 4 } (o resto vira 2)
//   outros campos: math, tech, duration, salary, areas_interesse, cursos_interesse, certeza
// Sem curso escolhido, "certeza" vira "na" (pergunta pulada); com curso, o padrão é "2".
module.exports = function buildAnswers(QUESTIONS, { letras = {}, ...ctx } = {}) {
  const cursos = ctx.cursos_interesse || ["nenhum"];
  const base = {
    areas_interesse: ["nenhuma"], math: "2", tech: "1", duration: "5", salary: "pouco",
    ...ctx, cursos_interesse: cursos,
    certeza: cursos.includes("nenhum") ? "na" : (ctx.certeza || "2")
  };
  return QUESTIONS.map(q => (q.dim === "likert" ? String(letras[q.letra] ?? 2) : base[q.dim]));
};
