/*
 * data.js — Dados do UniMatch (perguntas do quiz, cursos, fatores regionais)
 *
 * Este arquivo foi separado do index.html para facilitar a curadoria de dados
 * por pessoas que não programam. Para editar um curso, salário ou nota, basta
 * mexer aqui — não precisa tocar no index.html.
 *
 * IMPORTANTE — pendências que a equipe precisa resolver (não inventei nada disso):
 * 1) [RESOLVIDO em out/2026] O antigo REGION_FACTORS (multiplicador por
 *    região aplicado à nota SISU) foi removido: não tinha fonte, e a nota de
 *    corte de uma universidade não muda conforme a região de quem se inscreve.
 * 2) Cada curso tem `fuvest`, `notaSISU`, `sal`, `emp`, `dem` etc. Nem todos
 *    têm uma fonte/URL específica anexada -- só existe uma nota genérica no
 *    rodapé do site. Ver seção "Sobre os dados" do index.html.
 * 3) `sisuEstimated: true` já sinaliza cursos com nota SISU estimada por
 *    comparação (não é dado direto do MEC). Mantenha esse padrão ao adicionar
 *    cursos novos.
 * 4) Adicione um campo `dataAtualizada` (data em que os dados foram
 *    conferidos) quando a equipe efetivamente revisar isso -- não coloquei
 *    uma data aqui porque não sei quando os dados foram de fato levantados.
 *
 * STATUS DE VERIFICAÇÃO (09/set/2026):
 * - FUVEST 2025 (1ª fase, todas as modalidades): conferido curso a curso
 *   contra o PDF oficial (fuvest.br/wp-content/uploads/fuvest_2025_notas_de_corte.pdf).
 *   97 de 98 cursos bateram exatamente. Corrigido: "Ciências dos Alimentos"
 *   tinha ac:66, o valor oficial é ac:28.
 * - "Engenharia de Alimentos" (ac:44 atual) NÃO foi possível confirmar: o PDF
 *   oficial trunca o nome de um dos grupos de curso com "...", então não dá
 *   pra saber com certeza a qual grupo esse curso pertence. Baixem o PDF
 *   completo e confiram esse item específico.
 * - SISU 2024 e CAGED 2023/CBO (salários, empregabilidade) ainda NÃO foram
 *   conferidos contra fonte oficial -- são dados mais descentralizados
 *   (publicados por curso/campus, não numa tabela única), então essa
 *   verificação é um esforço separado e maior.
 * - SISU 2025 já existe e é mais recente que o SISU 2024 usado aqui, mas
 *   a troca não foi feita: o campo `notaSISU` de cada curso não registra de
 *   qual das 3 federais de referência (UNIFESP/UFSCar/UFABC) o número veio,
 *   então não dá pra saber com segurança o que buscar pra atualizar sem
 *   arriscar trocar pelo valor errado. Ver conversa do dia 09/set/2026.
 *
 * REVISÃO DE OUT/2026: busca na web confirmou que os cursos existem na USP,
 *   exceto 3, que foram REMOVIDOS: "Ciência Política" (é área dentro de
 *   Ciências Sociais), "Engenharia Biomédica" (só existe na pós-graduação) e
 *   "Ciências Agrárias" (licenciatura complementar da ESALQ, não é curso de
 *   ingresso). A base ficou com 95 cursos.
 *
 * METODOLOGIA DO QUIZ (mudança de 09/set/2026):
 * - Antes: cada curso tinha um vetor de 8 dimensões ad hoc (Exatas, Humanas,
 *   Saúde, Tecnologia, Negócios, Artes, Ambiental, Social), atribuído sem
 *   critério documentado.
 * - Agora: `vec` usa o modelo RIASEC (Realista, Investigativo, Artístico,
 *   Social, Empreendedor, Convencional) de John Holland -- o framework
 *   padrão da psicologia vocacional, usado por ferramentas reais como o
 *   O*NET Interest Profiler. Os 6 valores de cada curso ainda são uma
 *   atribuição feita por mim (Claude) a partir das características típicas
 *   de cada área -- não vêm de uma base de dados validada especificamente
 *   pra cursos da USP. Antes de confiar 100% nisso, valeria ter alguém da
 *   Psicologia revisando os códigos.
 * - Cobertura testada e comprovada (não é só afirmação): rodei
 *   tests/coverage-test.js simulando ~9 mil perfis de resposta diferentes.
 *   Resultado: todos os cursos conseguem aparecer em #1 para pelo menos um
 *   perfil, e nenhum fica fora do top-3 sempre. Rode esse script de novo
 *   depois de qualquer mudança nos vetores pra conferir que continua valendo.
 * - Adicionei também o campo `area` em cada curso -- é só uma categoria
 *   de assunto (Saúde/Exatas/Tecnologia/Humanas/Negócios/Artes/Ambiental)
 *   usada pelos filtros da aba Explorar. É separado do `vec` de propósito:
 *   RIASEC mede perfil de interesse/personalidade, não área acadêmica --
 *   são coisas diferentes, mesmo que relacionadas.
 *
 * ATUALIZAÇÃO (mesmo dia): a pergunta "quais áreas te interessam" virou um
 * FILTRO (não um bônus de pontos) -- se a pessoa marca uma área, só cursos
 * daquela área aparecem, e o RIASEC decide a ordem só dentro dela. Sem área
 * marcada (ou "nenhuma em especial"), mostra todos os cursos pelo perfil puro.
 * O vetor de "Ciência de Dados" também foi ajustado pra ser a média exata
 * entre "Estatística" e "Ciências da Computação" -- reflete a descrição real
 * do curso (mistura das duas áreas), não é mais um valor arbitrário.
 */

// Preencha com a data em que a equipe de fato conferiu/atualizou os dados
// abaixo (formato livre, ex: "setembro de 2026"). Deixe "" se ainda não foi
// revisado -- nesse caso o aviso não aparece no site.
const DATA_LAST_REVIEWED = "";

// Configurações gerais do site (contato, redes). Edite aqui, não no HTML.
const SITE_CONFIG = {
  contatoEmail: "gabrielcrod14@gmail.com",
  instagram: "https://www.instagram.com/integrausp/",
  // Link de um formulário (ex: Google Forms) para "Reportar problema /
  // Sugestões". Enquanto estiver vazio, o botão abre o app de e-mail.
  formularioContato: "",
  // Link de um formulário para veteranos se cadastrarem como mentores.
  // Enquanto estiver vazio, o convite abre o app de e-mail.
  formularioVeteranos: "",
  // Link de um formulário anônimo (ex: Google Forms) para o aluno dizer se o
  // resultado do quiz fez sentido. Enquanto estiver vazio, a pergunta não aparece.
  formularioFeedback: ""
};

// Escala usada nas 24 afirmações do perfil de interesses.
const LIKERT = [
  { t:"Adoro",      e:"😍", v:"5" },
  { t:"Gosto",      e:"🙂", v:"4" },
  { t:"Tanto faz",  e:"😐", v:"3" },
  { t:"Não gosto",  e:"🙁", v:"2" },
  { t:"Detesto",    e:"😣", v:"1" }
];

/*
 * PERGUNTAS DO QUIZ
 *
 * Parte 1 — 24 afirmações (4 por letra RIASEC), respondidas na escala acima.
 *   `letra` diz qual tipo a afirmação mede. A ordem é misturada de propósito
 *   para o aluno não perceber o padrão. As afirmações foram escritas pela
 *   equipe/Claude inspiradas no modelo RIASEC: NÃO são um teste validado.
 *   Revisar com alguém da área de Psicologia antes de divulgar amplamente.
 *
 * Parte 2 — perguntas de contexto (áreas, matemática, tecnologia, duração,
 *   peso do salário). Ver js/scoring.js para como cada uma entra na nota.
 */
const QUESTIONS = [
  { q:"Consertar algo quebrado em casa: uma tomada, uma bicicleta, um celular.", dim:"likert", letra:"R", opts:LIKERT },
  { q:"Explicar a matéria para um colega com dificuldade.",                      dim:"likert", letra:"S", opts:LIKERT },
  { q:"Descobrir por que algo acontece: como o corpo funciona, por que chove.",  dim:"likert", letra:"I", opts:LIKERT },
  { q:"Convencer as pessoas de uma ideia num debate.",                           dim:"likert", letra:"E", opts:LIKERT },
  { q:"Desenhar, pintar, fotografar ou editar vídeos.",                          dim:"likert", letra:"A", opts:LIKERT },
  { q:"Organizar materiais, arquivos ou listas para tudo ficar no lugar certo.", dim:"likert", letra:"C", opts:LIKERT },

  { q:"Fazer experimentos para testar se uma ideia está certa.",                 dim:"likert", letra:"I", opts:LIKERT },
  { q:"Trabalhar ao ar livre, com plantas, animais ou na natureza.",             dim:"likert", letra:"R", opts:LIKERT },
  { q:"Controlar dinheiro: anotar gastos, fazer as contas do mês.",              dim:"likert", letra:"C", opts:LIKERT },
  { q:"Ouvir um amigo com problemas e ajudar a pensar numa saída.",              dim:"likert", letra:"S", opts:LIKERT },
  { q:"Liderar um grupo ou organizar um evento (festa, campeonato, grêmio).",    dim:"likert", letra:"E", opts:LIKERT },
  { q:"Escrever histórias, poemas ou letras de música.",                         dim:"likert", letra:"A", opts:LIKERT },

  { q:"Tocar um instrumento, cantar, dançar ou atuar.",                          dim:"likert", letra:"A", opts:LIKERT },
  { q:"Conferir um trabalho com atenção para achar erros pequenos.",             dim:"likert", letra:"C", opts:LIKERT },
  { q:"Montar algo seguindo um projeto: um móvel, uma maquete, um circuito.",    dim:"likert", letra:"R", opts:LIKERT },
  { q:"Vender coisas ou ter um negócio próprio.",                                dim:"likert", letra:"E", opts:LIKERT },
  { q:"Cuidar de pessoas: crianças, idosos ou alguém doente.",                   dim:"likert", letra:"S", opts:LIKERT },
  { q:"Resolver um problema difícil de lógica ou de matemática.",                dim:"likert", letra:"I", opts:LIKERT },

  { q:"Tomar uma decisão importante, mesmo com risco de dar errado.",            dim:"likert", letra:"E", opts:LIKERT },
  { q:"Assistir a vídeos ou ler sobre ciência só por curiosidade.",              dim:"likert", letra:"I", opts:LIKERT },
  { q:"Participar de trabalho voluntário ou de projetos no seu bairro.",         dim:"likert", letra:"S", opts:LIKERT },
  { q:"Inventar um jeito novo e original de fazer alguma coisa.",                dim:"likert", letra:"A", opts:LIKERT },
  { q:"Montar planilhas e tabelas no computador.",                               dim:"likert", letra:"C", opts:LIKERT },
  { q:"Usar ferramentas, máquinas ou equipamentos.",                             dim:"likert", letra:"R", opts:LIKERT },

  {
    q: "Quais áreas te interessam? (escolha uma ou mais)",
    dim: "areas_interesse",
    multi: true,
    opts: [
      { t:"Saúde",        e:"🏥", v:"saude" },
      { t:"Exatas",       e:"🔬", v:"exatas" },
      { t:"Tecnologia",   e:"💻", v:"tecnologia" },
      { t:"Humanas",      e:"👥", v:"humanas" },
      { t:"Negócios",     e:"📊", v:"negocios" },
      { t:"Artes",        e:"🎨", v:"artes" },
      { t:"Ambiental",    e:"🌿", v:"ambiental" },
      { t:"Ainda não sei / nenhuma em especial", e:"🤷", v:"nenhuma", exclusive:true }
    ]
  },
  {
    q: "Como você se sente com matemática?",
    dim: "math",
    opts: [
      { t:"Adoro, quanto mais conta melhor",   e:"😍", v:"3" },
      { t:"Me viro bem",                        e:"🙂", v:"2" },
      { t:"Só o básico",                        e:"😐", v:"1" },
      { t:"Prefiro evitar",                     e:"😣", v:"0" }
    ]
  },
  {
    q: "Você gostaria que computador e programação fossem parte central do seu trabalho?",
    dim: "tech",
    opts: [
      { t:"Sim, quero criar tecnologia",        e:"💡", v:"3" },
      { t:"Quero usar bastante",                e:"💻", v:"2" },
      { t:"Só o normal do dia a dia",           e:"📱", v:"1" },
      { t:"Prefiro longe disso",                e:"📚", v:"0" }
    ]
  },
  {
    q: "Quanto tempo de faculdade você topa?",
    dim: "duration",
    opts: [
      { t:"Até 4 anos",                         e:"⚡", v:"4" },
      { t:"Até 5 anos",                         e:"📅", v:"5" },
      { t:"6 anos ou mais, se valer a pena",    e:"♾️", v:"6" }
    ]
  },
  {
    q: "Quanto o salário pesa na sua escolha?",
    dim: "salary",
    opts: [
      { t:"Muito, é prioridade",                e:"💎", v:"muito" },
      { t:"Bastante",                           e:"💰", v:"bastante" },
      { t:"Um pouco",                           e:"⚖️", v:"pouco" },
      { t:"Nada, quero fazer o que gosto",      e:"🌱", v:"nada" }
    ]
  }
];

/*
 * CURSOS
 * Campos usados pelo quiz (ver js/scoring.js):
 *   vec         perfil RIASEC do curso [R,I,A,S,E,C], de 0 a 10
 *   area        categoria usada nos filtros e na pergunta de áreas
 *   matematica  quanto o curso exige de matemática (0 = quase nada, 3 = muito)
 *   tecnologia  quanto o curso usa programação/computação (0 a 3)
 *   dur, salMid duração em anos e salário médio
 * ATENÇÃO: `matematica` e `tecnologia` são um RASCUNHO feito pelo Claude a
 * partir do que cada curso costuma exigir. Revisar com a equipe (de
 * preferência com quem estuda cada curso) antes de considerar definitivo.
 */
const COURSES = {
  "Administração": {
    vec:[1,2,1,3,9,6], area:"negocios", matematica:2, tecnologia:1,
    desc:"Gestão de organizações, recursos e pessoas para maximizar resultados.",
    carreiras:"Gerente, consultor, empreendedor, analista de negócios.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"670.40",
    sal:"R$ 4.500–12.000", salMid:8250, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Gestão","Liderança","Estratégia"]
  },
  "Arquitetura e Urbanismo": {
    vec:[5,3,9,2,3,3], area:"artes", matematica:2, tecnologia:2,
    desc:"Projeto de espaços habitáveis com foco em estética, funcionalidade e planejamento urbano.",
    carreiras:"Arquiteto, urbanista, paisagista, designer de interiores.",
    fuvest:{ac:61, ep:49, ppi:38}, notaSISU:"727.00",
    sal:"R$ 3.800–9.000", salMid:6400, emp:"Média", empScore:5, dem:"Estável", dur:"5",
    tags:["Design","Cidade","Projetos"]
  },
  "Artes Cênicas": {
    vec:[2,1,10,5,3,0], area:"artes", matematica:0, tecnologia:0,
    desc:"Teatro, dança e performance — teoria e prática das artes do corpo.",
    carreiras:"Ator, diretor, coreógrafo, produtor cultural, professor.",
    fuvest:{ac:53, ep:42, ppi:32}, notaSISU:"611.20",
    sal:"R$ 2.500–6.000", salMid:4250, emp:"Baixa", empScore:3, dem:"Competitiva", dur:"4",
    tags:["Teatro","Dança","Expressão"]
  },
  "Artes Visuais": {
    vec:[2,1,10,2,2,1], area:"artes", matematica:0, tecnologia:0,
    desc:"Pintura, escultura, fotografia, vídeo e arte digital.",
    carreiras:"Artista, curador, crítico de arte, professor, galerista.",
    fuvest:{ac:59, ep:50, ppi:37}, notaSISU:"603.80",
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Arte","Visual","Criatividade"]
  },
  "Astronomia": {
    vec:[2,10,2,1,0,2], area:"exatas", matematica:3, tecnologia:2,
    desc:"Estudo científico do universo, estrelas, planetas e fenômenos celestes.",
    carreiras:"Astrônomo, pesquisador, professor universitário, divulgador científico.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"721.40",
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Universo","Pesquisa","Física"]
  },
  "Audiovisual": {
    vec:[2,2,10,3,4,1], area:"artes", matematica:0, tecnologia:2,
    desc:"Linguagem e produção audiovisual: cinema, vídeo, televisão e mídias digitais.",
    carreiras:"Cineasta, diretor, roteirista, produtor, editor de vídeo.",
    fuvest:{ac:63, ep:54, ppi:41}, notaSISU:"651.80",
    sal:"R$ 3.000–8.500", salMid:5750, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Cinema","Roteiro","Produção"]
  },
  "Biblioteconomia e Ciência da Informação": {
    vec:[1,5,2,4,1,8], area:"humanas", matematica:0, tecnologia:1,
    desc:"Organização, gestão e disseminação da informação em acervos físicos e digitais.",
    carreiras:"Bibliotecário, gestor de informação, analista de documentação, arquivista.",
    fuvest:{ac:49, ep:35, ppi:33}, notaSISU:"588.20",
    sal:"R$ 3.000–6.500", salMid:4750, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Informação","Documentação","Gestão"]
  },

  "Biotecnologia": {
    vec:[4,10,0,1,2,3], area:"ambiental", matematica:2, tecnologia:1,
    desc:"Aplicação de tecnologia em sistemas biológicos para novos produtos e tratamentos.",
    carreiras:"Pesquisador, analista, desenvolvedor de bioprodutos, consultor.",
    fuvest:{ac:53, ep:34, ppi:29}, notaSISU:"748.60",
    sal:"R$ 5.500–12.000", salMid:8750, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Biotech","Inovação","Laboratório"]
  },
  "Ciências Atuariais": {
    vec:[1,6,0,1,5,9], area:"negocios", matematica:3, tecnologia:2,
    desc:"Matemática e estatística para análise de riscos em seguros e finanças.",
    carreiras:"Atuário, analista de riscos, consultor financeiro.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"709.50",
    sal:"R$ 5.000–11.000", salMid:8000, emp:"Alta", empScore:8, dem:"Estável", dur:"4",
    tags:["Matemática","Risco","Finanças"]
  },
  "Ciências Biológicas": {
    vec:[5,9,1,2,0,2], area:"ambiental", matematica:1, tecnologia:0,
    desc:"Seres vivos, processos vitais e relações ecológicas.",
    carreiras:"Biólogo, pesquisador, professor, perito ambiental.",
    fuvest:{ac:56, ep:46, ppi:29}, notaSISU:"689.40",
    sal:"R$ 3.500–8.000", salMid:5750, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Biologia","Ecologia","Pesquisa"]
  },
  "Ciências Biomédicas": {
    vec:[3,10,0,3,1,3], area:"saude", matematica:1, tecnologia:0,
    desc:"Pesquisa e análise de processos biológicos relacionados à saúde humana.",
    carreiras:"Pesquisador, analista biomédico, professor universitário.",
    fuvest:{ac:60, ep:49, ppi:40}, notaSISU:"735.80",
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Pesquisa","Saúde","Laboratório"]
  },
  "Ciências Contábeis": {
    vec:[1,2,0,1,5,10], area:"negocios", matematica:2, tecnologia:1,
    desc:"Gestão financeira, contabilidade e controle patrimonial.",
    carreiras:"Contador, auditor, controller, consultor tributário.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"641.90",
    sal:"R$ 4.000–9.000", salMid:6500, emp:"Alta", empScore:8, dem:"Estável", dur:"4",
    tags:["Finanças","Auditoria","Tributário"]
  },
  "Ciências da Computação": {
    vec:[3,9,2,1,3,5], area:"tecnologia", matematica:3, tecnologia:3,
    desc:"Algoritmos, software, inteligência artificial e sistemas computacionais.",
    carreiras:"Desenvolvedor, cientista de dados, arquiteto de software, pesquisador.",
    fuvest:{ac:63, ep:52, ppi:40}, notaSISU:"750.10",
    sal:"R$ 6.000–20.000", salMid:13000, emp:"Muito Alta", empScore:10, dem:"Crescendo", dur:"4",
    tags:["Programação","IA","Sistemas"]
  },
  "Ciência de Dados": {
    vec:[2,9,1,2,3,6], area:"tecnologia", matematica:3, tecnologia:3,
    desc:"Análise e interpretação de grandes volumes de dados para apoio à decisão.",
    carreiras:"Cientista de dados, engenheiro de ML, analista de BI.",
    fuvest:{ac:63, ep:52, ppi:40}, notaSISU:"762.30", sisuEstimated:true,
    sal:"R$ 6.000–22.000", salMid:14000, emp:"Muito Alta", empScore:10, dem:"Crescendo", dur:"4",
    tags:["Dados","Machine Learning","Análise"]
  },
  "Ciências da Natureza": {
    vec:[4,8,1,5,1,3], area:"exatas", matematica:2, tecnologia:0,
    desc:"Formação interdisciplinar em Física, Química e Biologia voltada para a docência.",
    carreiras:"Professor de Ciências, educador ambiental, pesquisador em ensino de ciências.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"612.30",
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Ensino","Ciências","Interdisciplinar"]
  },
  "Ciências dos Alimentos": {
    vec:[5,8,0,2,2,4], area:"ambiental", matematica:2, tecnologia:0,
    desc:"Propriedades, processamento, segurança e conservação de alimentos.",
    carreiras:"Pesquisador, tecnólogo de alimentos, analista de qualidade.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"678.20",
    sal:"R$ 4.200–8.500", salMid:6350, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Alimentos","Qualidade","Segurança"]
  },
  "Ciências Exatas": {
    vec:[3,10,0,1,1,4], area:"exatas", matematica:3, tecnologia:1,
    desc:"Base sólida em Matemática, Física e Química com flexibilidade para especialização.",
    carreiras:"Pesquisador, professor, analista quantitativo, engenheiro.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"698.50",
    sal:"R$ 5.000–13.000", salMid:9000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Matemática","Física","Química"]
  },
  "Ciências Físicas e Biomoleculares": {
    vec:[3,10,0,1,0,3], area:"exatas", matematica:3, tecnologia:1,
    desc:"Interface entre Física, Química e Biologia aplicada a sistemas moleculares e celulares.",
    carreiras:"Pesquisador, analista biomolecular, professor universitário.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"718.40", sisuEstimated:true,
    sal:"R$ 5.000–11.000", salMid:8000, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Biofísica","Pesquisa","Molecular"]
  },
  "Ciências Sociais": {
    vec:[1,8,3,7,3,1], area:"humanas", matematica:1, tecnologia:0,
    desc:"Análise de sociedades humanas, culturas e dinâmicas sociais.",
    carreiras:"Pesquisador, consultor social, analista de políticas, professor.",
    fuvest:{ac:43, ep:27, ppi:27}, notaSISU:"632.50",
    sal:"R$ 3.200–7.000", salMid:5100, emp:"Média", empScore:4, dem:"Estável", dur:"4",
    tags:["Sociedade","Cultura","Pesquisa"]
  },
  "Design": {
    vec:[3,2,9,2,4,3], area:"artes", matematica:1, tecnologia:2,
    desc:"Soluções visuais e funcionais para produtos, marcas e interfaces digitais.",
    carreiras:"Designer gráfico, UX/UI designer, diretor de arte.",
    fuvest:{ac:59, ep:52, ppi:43}, notaSISU:"680.90",
    sal:"R$ 3.500–10.000", salMid:6750, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["UI/UX","Visual","Branding"]
  },
  "Direito": {
    vec:[1,4,2,5,7,6], area:"humanas", matematica:0, tecnologia:0,
    desc:"Leis, justiça, advocacia e regulação da vida em sociedade.",
    carreiras:"Advogado, juiz, promotor, defensor público, consultor jurídico.",
    fuvest:{ac:63, ep:50, ppi:38}, notaSISU:"754.80",
    sal:"R$ 4.000–25.000", salMid:12000, emp:"Alta", empScore:7, dem:"Competitiva", dur:"5",
    tags:["Leis","Justiça","Advocacia"]
  },
  "Economia": {
    vec:[1,7,1,3,7,6], area:"negocios", matematica:3, tecnologia:1,
    desc:"Produção, distribuição e consumo: análise micro e macroeconômica.",
    carreiras:"Economista, analista de mercado, pesquisador, consultor.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"714.60",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Mercado","Análise","Política Econômica"]
  },
  "Editoração": {
    vec:[1,3,7,2,2,7], area:"artes", matematica:0, tecnologia:1,
    desc:"Produção editorial: livros, revistas, e-books e publicações digitais.",
    carreiras:"Editor, revisor, diagramador, produtor editorial, gestor de conteúdo.",
    fuvest:{ac:51, ep:41, ppi:28}, notaSISU:"638.70",
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Edição","Publicação","Conteúdo"]
  },
  "Educação Física e Esporte": {
    vec:[8,3,1,7,3,1], area:"saude", matematica:1, tecnologia:0,
    desc:"Promoção da saúde e desempenho por meio de atividades físicas.",
    carreiras:"Professor, personal trainer, preparador físico, gestor esportivo.",
    fuvest:{ac:41, ep:27, ppi:27}, notaSISU:"634.70",
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Alta", empScore:6, dem:"Estável", dur:"4",
    tags:["Esporte","Saúde","Movimento"]
  },
  "Educomunicação": {
    vec:[1,3,6,8,3,2], area:"humanas", matematica:0, tecnologia:0,
    desc:"Interface entre educação e comunicação para formação crítica e uso de mídias.",
    carreiras:"Educomunicador, produtor de conteúdo educativo, gestor cultural, professor.",
    fuvest:{ac:35, ep:27, ppi:27}, notaSISU:"622.40", sisuEstimated:true,
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Educação","Mídia","Comunicação"]
  },
  "Enfermagem": {
    vec:[4,5,0,10,2,4], area:"saude", matematica:1, tecnologia:0,
    desc:"Cuidado integral à saúde humana em diferentes níveis de atenção.",
    carreiras:"Enfermeiro, gestor hospitalar, educador em saúde, pesquisador.",
    fuvest:{ac:44, ep:30, ppi:27}, notaSISU:"682.30",
    sal:"R$ 3.500–9.000", salMid:6250, emp:"Muito Alta", empScore:9, dem:"Crescendo", dur:"5",
    tags:["Cuidado","Hospital","Saúde Coletiva"]
  },
  "Engenharia Aeronáutica": {
    vec:[9,8,1,1,2,5], area:"exatas", matematica:3, tecnologia:2,
    desc:"Projeto, construção e manutenção de aeronaves e sistemas aeroespaciais.",
    carreiras:"Engenheiro aeronáutico, projetista, analista de sistemas de voo.",
    fuvest:{ac:73, ep:56, ppi:40}, notaSISU:"769.50",
    sal:"R$ 6.000–16.000", salMid:11000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Aviação","Aeroespacial","Projetos"]
  },
  "Engenharia Agronômica": {
    vec:[8,6,0,1,3,4], area:"ambiental", matematica:2, tecnologia:1,
    desc:"Produção agropecuária sustentável, manejo do solo, irrigação e tecnologia agrícola.",
    carreiras:"Engenheiro agrônomo, consultor rural, pesquisador, gestor de propriedades.",
    fuvest:{ac:46, ep:27, ppi:27}, notaSISU:"689.30",
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Agro","Solo","Sustentabilidade"]
  },
  "Engenharia Ambiental": {
    vec:[7,7,1,3,2,4], area:"ambiental", matematica:3, tecnologia:1,
    desc:"Soluções tecnológicas para preservação ambiental e sustentabilidade.",
    carreiras:"Engenheiro ambiental, consultor, gestor de recursos naturais.",
    fuvest:{ac:37, ep:27, ppi:27}, notaSISU:"699.10",
    sal:"R$ 4.800–10.000", salMid:7400, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Meio Ambiente","Sustentabilidade","Tecnologia"]
  },
  "Engenharia Bioquímica": {
    vec:[6,8,0,1,2,4], area:"ambiental", matematica:3, tecnologia:1,
    desc:"Processos bioquímicos industriais para produção de fármacos, alimentos e biocombustíveis.",
    carreiras:"Engenheiro bioquímico, pesquisador, gestor de bioprodutos.",
    fuvest:{ac:46, ep:27, ppi:27}, notaSISU:"712.80", sisuEstimated:true,
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Bioprocessos","Indústria","Pesquisa"]
  },
  "Engenharia Civil": {
    vec:[8,6,2,1,4,5], area:"exatas", matematica:3, tecnologia:1,
    desc:"Projetos, construção e manutenção de edificações e infraestrutura urbana.",
    carreiras:"Engenheiro civil, projetista, fiscal de obras, gestor de projetos.",
    fuvest:{ac:55, ep:40, ppi:27}, notaSISU:"712.40",
    sal:"R$ 5.000–13.000", salMid:9000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Construção","Infraestrutura","Cálculo"]
  },
  "Engenharia de Alimentos": {
    vec:[6,7,0,1,3,5], area:"ambiental", matematica:3, tecnologia:1,
    desc:"Processos industriais de produção, conservação e desenvolvimento de alimentos.",
    carreiras:"Engenheiro de alimentos, gerente de produção, analista de qualidade.",
    fuvest:{ac:44, ep:27, ppi:27}, fuvestNaoConferido:true, notaSISU:"672.80",
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Alimentos","Indústria","Processos"]
  },
  "Engenharia de Biossistemas": {
    vec:[7,7,0,2,3,4], area:"ambiental", matematica:3, tecnologia:1,
    desc:"Engenharia aplicada a sistemas biológicos e ao agronegócio sustentável.",
    carreiras:"Engenheiro de biossistemas, consultor em agronegócio, pesquisador.",
    fuvest:{ac:46, ep:27, ppi:27}, notaSISU:"678.40", sisuEstimated:true,
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Agro","Biossistemas","Sustentabilidade"]
  },
  "Engenharia de Computação": {
    vec:[5,8,1,1,3,5], area:"tecnologia", matematica:3, tecnologia:3,
    desc:"Hardware, firmware e software integrados em sistemas computacionais completos.",
    carreiras:"Engenheiro de computação, desenvolvedor embarcado, arquiteto de sistemas.",
    fuvest:{ac:65, ep:46, ppi:27}, notaSISU:"745.20",
    sal:"R$ 5.500–18.000", salMid:11750, emp:"Muito Alta", empScore:9, dem:"Crescendo", dur:"5",
    tags:["Hardware","Software","Sistemas Embarcados"]
  },
  "Engenharia de Materiais": {
    vec:[7,8,1,0,2,4], area:"exatas", matematica:3, tecnologia:1,
    desc:"Desenvolvimento, processamento e aplicação de materiais de alta performance.",
    carreiras:"Engenheiro de materiais, pesquisador, desenvolvedor de produtos.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"689.70",
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Materiais","Inovação","Pesquisa"]
  },
  "Engenharia de Materiais e Manufatura": {
    vec:[8,7,1,0,3,5], area:"exatas", matematica:3, tecnologia:2,
    desc:"Desenvolvimento de materiais e processos de fabricação industrial de alta performance.",
    carreiras:"Engenheiro de manufatura, desenvolvedor de produtos, consultor industrial.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"692.40", sisuEstimated:true,
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Materiais","Manufatura","Indústria"]
  },
  "Engenharia de Minas": {
    vec:[9,6,0,1,3,4], area:"exatas", matematica:3, tecnologia:1,
    desc:"Extração, processamento e gerenciamento de recursos minerais.",
    carreiras:"Engenheiro de minas, consultor em mineração, gestor de lavras.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"695.20",
    sal:"R$ 6.000–14.000", salMid:10000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Mineração","Recursos","Extração"]
  },
  "Engenharia de Petróleo": {
    vec:[8,7,0,1,4,4], area:"exatas", matematica:3, tecnologia:2,
    desc:"Exploração, extração e processamento de petróleo e gás natural.",
    carreiras:"Engenheiro de petróleo, consultor, especialista em reservatórios.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"721.60",
    sal:"R$ 7.000–18.000", salMid:12500, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Petróleo","Gás","Exploração"]
  },
  "Engenharia de Produção": {
    vec:[5,5,1,3,7,7], area:"negocios", matematica:3, tecnologia:2,
    desc:"Otimização de sistemas produtivos, logística e gestão industrial.",
    carreiras:"Engenheiro de produção, consultor, gestor industrial, supply chain.",
    fuvest:{ac:44, ep:27, ppi:27}, notaSISU:"718.60",
    sal:"R$ 5.500–13.000", salMid:9250, emp:"Alta", empScore:8, dem:"Estável", dur:"5",
    tags:["Produção","Otimização","Logística"]
  },
  "Engenharia Elétrica": {
    vec:[7,8,1,1,3,5], area:"tecnologia", matematica:3, tecnologia:3,
    desc:"Projeto e desenvolvimento de sistemas elétricos, eletrônicos e de energia.",
    carreiras:"Engenheiro eletricista, projetista, gestor de energia.",
    fuvest:{ac:65, ep:46, ppi:27}, notaSISU:"730.80",
    sal:"R$ 5.500–14.000", salMid:9750, emp:"Alta", empScore:8, dem:"Estável", dur:"5",
    tags:["Eletricidade","Energia","Sistemas"]
  },
  "Engenharia Física": {
    vec:[6,10,1,0,1,4], area:"exatas", matematica:3, tecnologia:2,
    desc:"Física aplicada ao desenvolvimento tecnológico: fotônica, semicondutores e nanotecnologia.",
    carreiras:"Engenheiro físico, pesquisador em P&D, especialista em nanotecnologia.",
    fuvest:{ac:44, ep:27, ppi:27}, notaSISU:"748.60", sisuEstimated:true,
    sal:"R$ 6.000–16.000", salMid:11000, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Física","Nanotecnologia","P&D"]
  },
  "Engenharia Florestal": {
    vec:[8,6,0,2,2,3], area:"ambiental", matematica:2, tecnologia:1,
    desc:"Manejo sustentável de florestas, recursos madeireiros e conservação ambiental.",
    carreiras:"Engenheiro florestal, pesquisador, gestor ambiental, consultor.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"649.80",
    sal:"R$ 4.000–9.000", salMid:6500, emp:"Alta", empScore:6, dem:"Estável", dur:"5",
    tags:["Florestas","Manejo","Conservação"]
  },
  "Engenharia Mecânica": {
    vec:[9,7,1,0,3,5], area:"exatas", matematica:3, tecnologia:2,
    desc:"Projeto, análise e fabricação de sistemas e componentes mecânicos.",
    carreiras:"Engenheiro mecânico, projetista, gestor de manufatura.",
    fuvest:{ac:61, ep:43, ppi:27}, notaSISU:"724.90",
    sal:"R$ 5.500–13.000", salMid:9250, emp:"Alta", empScore:8, dem:"Estável", dur:"5",
    tags:["Mecânica","Projetos","Indústria"]
  },
  "Engenharia Mecatrônica": {
    vec:[8,7,1,0,3,6], area:"tecnologia", matematica:3, tecnologia:3,
    desc:"Mecânica, eletrônica e computação integradas em sistemas automatizados.",
    carreiras:"Engenheiro mecatrônico, desenvolvedor de robótica, especialista em automação.",
    fuvest:{ac:61, ep:43, ppi:27}, notaSISU:"742.10",
    sal:"R$ 5.500–15.000", salMid:10250, emp:"Alta", empScore:8, dem:"Crescendo", dur:"5",
    tags:["Robótica","Automação","IoT"]
  },
  "Engenharia Metalúrgica": {
    vec:[8,7,0,0,2,4], area:"exatas", matematica:3, tecnologia:1,
    desc:"Extração, processamento e aplicação de metais e ligas metálicas.",
    carreiras:"Engenheiro metalúrgico, pesquisador de materiais, consultor industrial.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"688.90",
    sal:"R$ 5.500–13.000", salMid:9250, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Metais","Processos","Indústria"]
  },
  "Engenharia Naval": {
    vec:[8,7,1,1,3,4], area:"exatas", matematica:3, tecnologia:2,
    desc:"Projeto e construção de embarcações, plataformas offshore e sistemas navais.",
    carreiras:"Engenheiro naval, projetista, especialista offshore, consultor marítimo.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"711.20",
    sal:"R$ 6.000–15.000", salMid:10500, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Naval","Offshore","Projetos"]
  },
  "Engenharia Química": {
    vec:[6,8,0,1,3,5], area:"exatas", matematica:3, tecnologia:2,
    desc:"Processos químicos industriais e desenvolvimento de novos produtos.",
    carreiras:"Engenheiro químico, gestor de processos, pesquisador, consultor.",
    fuvest:{ac:44, ep:27, ppi:27}, notaSISU:"726.30",
    sal:"R$ 5.500–13.000", salMid:9250, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Química","Processos","Petroquímica"]
  },
  "Estatística": {
    vec:[1,9,0,2,3,7], area:"exatas", matematica:3, tecnologia:2,
    desc:"Coleta, análise e interpretação de dados para tomada de decisão.",
    carreiras:"Estatístico, analista de dados, cientista de dados, consultor.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"698.40",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Dados","Análise","Probabilidade"]
  },
  "Farmácia": {
    vec:[4,8,0,4,2,5], area:"saude", matematica:2, tecnologia:0,
    desc:"Desenvolvimento, produção e controle de medicamentos e cosméticos.",
    carreiras:"Farmacêutico, pesquisador, gestor de farmácia hospitalar, analista.",
    fuvest:{ac:54, ep:42, ppi:27}, notaSISU:"712.60",
    sal:"R$ 4.000–10.000", salMid:7000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Medicamentos","Saúde","Laboratório"]
  },
  "Filosofia": {
    vec:[0,9,6,4,2,1], area:"humanas", matematica:0, tecnologia:0,
    desc:"Reflexão crítica sobre existência, ética, conhecimento e política.",
    carreiras:"Professor, pesquisador, consultor, escritor, redator.",
    fuvest:{ac:41, ep:28, ppi:27}, notaSISU:"591.30",
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Baixa", empScore:3, dem:"Competitiva", dur:"4",
    tags:["Pensamento","Ética","Crítica"]
  },
  "Finanças e Negócios": {
    vec:[1,5,0,2,9,7], area:"negocios", matematica:2, tecnologia:1,
    desc:"Gestão financeira, mercados de capitais e estratégia empresarial.",
    carreiras:"Analista financeiro, gestor de investimentos, consultor de negócios.",
    fuvest:{ac:51, ep:34, ppi:27}, notaSISU:"682.40",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:8, dem:"Estável", dur:"4",
    tags:["Finanças","Mercado","Investimentos"]
  },
  "Física": {
    vec:[3,10,0,0,0,3], area:"exatas", matematica:3, tecnologia:1,
    desc:"Leis fundamentais que regem matéria, energia, espaço e tempo.",
    carreiras:"Físico, pesquisador, professor, engenheiro de projetos de alta tecnologia.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"714.20",
    sal:"R$ 6.000–16.000", salMid:11000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Pesquisa","Universo","Fundamentos"]
  },
  "Física Computacional": {
    vec:[3,10,1,0,1,4], area:"tecnologia", matematica:3, tecnologia:3,
    desc:"Métodos computacionais aplicados à resolução de problemas físicos complexos.",
    carreiras:"Pesquisador, desenvolvedor de simulações, cientista computacional.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"724.80", sisuEstimated:true,
    sal:"R$ 5.500–14.000", salMid:9500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Física","Computação","Simulação"]
  },
  "Física Médica": {
    vec:[4,9,0,4,0,3], area:"saude", matematica:3, tecnologia:2,
    desc:"Princípios físicos aplicados a diagnóstico, radioterapia e equipamentos médicos.",
    carreiras:"Físico médico, pesquisador, desenvolvedor de equipamentos hospitalares.",
    fuvest:{ac:49, ep:27, ppi:27}, notaSISU:"728.40", sisuEstimated:true,
    sal:"R$ 7.000–16.000", salMid:11500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Física","Medicina","Diagnóstico"]
  },
  "Fisioterapia": {
    vec:[6,5,0,8,2,3], area:"saude", matematica:1, tecnologia:0,
    desc:"Prevenção e tratamento de disfunções do movimento e reabilitação funcional.",
    carreiras:"Fisioterapeuta, pesquisador, gestor de clínica, professor.",
    fuvest:{ac:57, ep:45, ppi:33}, notaSISU:"694.80",
    sal:"R$ 3.500–9.000", salMid:6250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Reabilitação","Movimento","Saúde"]
  },
  "Fonoaudiologia": {
    vec:[3,5,2,9,1,3], area:"saude", matematica:0, tecnologia:0,
    desc:"Avaliação e tratamento de distúrbios da comunicação e deglutição.",
    carreiras:"Fonoaudiólogo, pesquisador, professor, consultor em saúde.",
    fuvest:{ac:46, ep:38, ppi:27}, notaSISU:"688.50",
    sal:"R$ 3.500–8.500", salMid:6000, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Fala","Audição","Terapia"]
  },
  "Geociências e Educação Ambiental": {
    vec:[6,7,1,5,1,2], area:"ambiental", matematica:1, tecnologia:0,
    desc:"Formação em Geociências voltada para educação ambiental e ensino de Ciências da Terra.",
    carreiras:"Professor, educador ambiental, pesquisador, gestor de projetos ambientais.",
    fuvest:{ac:27, ep:27, ppi:27}, notaSISU:"598.60", sisuEstimated:true,
    sal:"R$ 3.000–7.000", salMid:5000, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Geociências","Educação","Ambiente"]
  },
  "Geofísica": {
    vec:[5,9,0,1,1,3], area:"exatas", matematica:3, tecnologia:2,
    desc:"Estudo da Terra por métodos físicos e matemáticos.",
    carreiras:"Geofísico, pesquisador, consultor em exploração mineral e petróleo.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"680.10",
    sal:"R$ 6.000–14.000", salMid:10000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Terra","Exploração","Física"]
  },
  "Geografia": {
    vec:[4,7,2,5,2,3], area:"humanas", matematica:1, tecnologia:0,
    desc:"Espaço geográfico, relações sociedade-natureza e planejamento territorial.",
    carreiras:"Geógrafo, professor, planejador territorial, analista ambiental.",
    fuvest:{ac:38, ep:29, ppi:27}, notaSISU:"617.60",
    sal:"R$ 3.200–7.500", salMid:5350, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Território","Espaço","Planejamento"]
  },
  "Geologia": {
    vec:[7,8,0,1,2,3], area:"exatas", matematica:2, tecnologia:0,
    desc:"Composição, estrutura e história da Terra e seus recursos.",
    carreiras:"Geólogo, consultor em mineração, pesquisador de petróleo.",
    fuvest:{ac:48, ep:27, ppi:27}, notaSISU:"674.30",
    sal:"R$ 6.000–15.000", salMid:10500, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Rochas","Recursos Naturais","Exploração"]
  },
  "Gerontologia": {
    vec:[2,5,0,9,2,3], area:"saude", matematica:0, tecnologia:0,
    desc:"Estudo do envelhecimento humano e promoção da qualidade de vida do idoso.",
    carreiras:"Gerontólogo, gestor de saúde do idoso, pesquisador, consultor em políticas.",
    fuvest:{ac:49, ep:28, ppi:27}, notaSISU:"634.20", sisuEstimated:true,
    sal:"R$ 3.000–7.500", salMid:5250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Envelhecimento","Saúde","Políticas"]
  },
  "Gestão Ambiental": {
    vec:[4,6,1,3,6,4], area:"ambiental", matematica:1, tecnologia:0,
    desc:"Planejamento e gestão de recursos naturais com foco em sustentabilidade.",
    carreiras:"Gestor ambiental, consultor, analista de sustentabilidade corporativa.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"632.80",
    sal:"R$ 3.800–8.500", salMid:6150, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Sustentabilidade","Recursos","Políticas"]
  },
  "Gestão de Políticas Públicas": {
    vec:[1,6,1,6,7,4], area:"humanas", matematica:1, tecnologia:0,
    desc:"Planejamento, implementação e avaliação de políticas públicas e programas governamentais.",
    carreiras:"Gestor público, analista de políticas, consultor em governo, pesquisador.",
    fuvest:{ac:37, ep:28, ppi:27}, notaSISU:"624.80",
    sal:"R$ 3.500–10.000", salMid:6750, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Governo","Políticas","Gestão"]
  },
  "História": {
    vec:[1,8,5,4,1,2], area:"humanas", matematica:0, tecnologia:0,
    desc:"Processos históricos, culturas e transformações das sociedades humanas.",
    carreiras:"Historiador, professor, pesquisador, curador, museólogo.",
    fuvest:{ac:48, ep:30, ppi:27}, notaSISU:"619.80",
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Passado","Cultura","Pesquisa"]
  },
  "Informática Biomédica": {
    vec:[3,8,0,3,2,6], area:"tecnologia", matematica:2, tecnologia:3,
    desc:"Computação aplicada a soluções para saúde, medicina e pesquisa clínica.",
    carreiras:"Analista de sistemas de saúde, pesquisador, desenvolvedor de software médico.",
    fuvest:{ac:41, ep:31, ppi:27}, notaSISU:"712.40", sisuEstimated:true,
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Saúde","TI","Computação"]
  },
  "Jornalismo": {
    vec:[1,5,6,6,4,2], area:"artes", matematica:0, tecnologia:1,
    desc:"Apuração, produção e disseminação de informações e narrativas jornalísticas.",
    carreiras:"Jornalista, editor, repórter, produtor de conteúdo digital.",
    fuvest:{ac:60, ep:50, ppi:42}, notaSISU:"665.40",
    sal:"R$ 2.800–8.000", salMid:5400, emp:"Média", empScore:5, dem:"Competitiva", dur:"4",
    tags:["Notícias","Mídia","Comunicação"]
  },
  "Lazer e Turismo": {
    vec:[3,2,3,7,6,3], area:"negocios", matematica:0, tecnologia:0,
    desc:"Planejamento e gestão de atividades de lazer, turismo e hospitalidade.",
    carreiras:"Gestor de turismo, planejador de eventos, consultor em hospitalidade.",
    fuvest:{ac:27, ep:27, ppi:27}, notaSISU:"591.40", sisuEstimated:true,
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Turismo","Lazer","Hospitalidade"]
  },
  "Letras": {
    vec:[0,6,7,5,1,2], area:"humanas", matematica:0, tecnologia:0,
    desc:"Línguas, literaturas e manifestações culturais do mundo.",
    carreiras:"Professor, tradutor, revisor, pesquisador linguístico, escritor.",
    fuvest:{ac:35, ep:27, ppi:27}, notaSISU:"607.20",
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Línguas","Literatura","Cultura"]
  },
  "Marketing": {
    vec:[1,3,5,3,9,4], area:"negocios", matematica:1, tecnologia:1,
    desc:"Estratégias de mercado, comunicação e relacionamento com consumidores.",
    carreiras:"Profissional de marketing digital, gestor de marcas, analista de mercado.",
    fuvest:{ac:46, ep:33, ppi:27}, notaSISU:"672.10",
    sal:"R$ 3.500–11.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Mercado","Branding","Digital"]
  },
  "Matemática": {
    vec:[1,10,1,0,0,4], area:"exatas", matematica:3, tecnologia:1,
    desc:"Estruturas abstratas, padrões e relações quantitativas fundamentais.",
    carreiras:"Matemático, professor, pesquisador, analista quantitativo, atuário.",
    fuvest:{ac:29, ep:27, ppi:27}, notaSISU:"692.80",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Números","Lógica","Abstração"]
  },
  "Matemática Aplicada": {
    vec:[2,10,0,0,1,5], area:"exatas", matematica:3, tecnologia:2,
    desc:"Matemática com foco em aplicações práticas em ciência, tecnologia e economia.",
    carreiras:"Matemático aplicado, pesquisador, analista quantitativo, cientista de dados.",
    fuvest:{ac:45, ep:31, ppi:27}, notaSISU:"718.40",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Matemática","Aplicações","Modelagem"]
  },
  "Matemática Aplicada a Negócios": {
    vec:[1,8,0,1,6,6], area:"negocios", matematica:3, tecnologia:2,
    desc:"Matemática e estatística aplicadas à tomada de decisão no mundo dos negócios.",
    carreiras:"Analista quantitativo, cientista de dados, consultor financeiro, atuário.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"698.20", sisuEstimated:true,
    sal:"R$ 5.500–15.000", salMid:10250, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Matemática","Negócios","Análise"]
  },
  "Matemática Aplicada e Computação Científica": {
    vec:[2,10,0,0,1,6], area:"tecnologia", matematica:3, tecnologia:3,
    desc:"Algoritmos e modelos computacionais aplicados a ciência e engenharia.",
    carreiras:"Pesquisador, desenvolvedor de algoritmos, cientista computacional.",
    fuvest:{ac:45, ep:31, ppi:27}, notaSISU:"728.60", sisuEstimated:true,
    sal:"R$ 5.500–15.000", salMid:10250, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Matemática","Computação","Ciência"]
  },
  "Matemática Aplicada e Computacional": {
    vec:[3,9,0,0,1,6], area:"tecnologia", matematica:3, tecnologia:3,
    desc:"Métodos matemáticos e computacionais para modelagem científica e engenharia.",
    carreiras:"Pesquisador, desenvolvedor de algoritmos, cientista computacional.",
    fuvest:{ac:45, ep:31, ppi:27}, notaSISU:"724.60", sisuEstimated:true,
    sal:"R$ 5.500–15.000", salMid:10250, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Matemática","Computação","Modelagem"]
  },
  "Medicina": {
    vec:[4,9,0,8,3,4], area:"saude", matematica:1, tecnologia:0,
    desc:"Diagnóstico, tratamento e prevenção de doenças. A graduação mais longa e competitiva.",
    carreiras:"Médico generalista, especialista, pesquisador clínico, professor.",
    fuvest:{ac:79, ep:71, ppi:60}, notaSISU:"807.90",
    sal:"R$ 10.000–30.000", salMid:20000, emp:"Muito Alta", empScore:10, dem:"Alta", dur:"6",
    tags:["Medicina","Diagnóstico","Pesquisa Clínica"]
  },
  "Medicina Veterinária": {
    vec:[6,8,0,6,2,4], area:"saude", matematica:1, tecnologia:0,
    desc:"Saúde animal, clínica, cirurgia e saúde pública veterinária.",
    carreiras:"Médico veterinário, pesquisador, inspetor sanitário, consultor.",
    fuvest:{ac:57, ep:46, ppi:36}, notaSISU:"714.80",
    sal:"R$ 4.000–10.000", salMid:7000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Animais","Clínica","Saúde Pública"]
  },
  "Meteorologia": {
    vec:[4,9,0,1,1,4], area:"exatas", matematica:3, tecnologia:2,
    desc:"Atmosfera, clima e previsão do tempo por métodos científicos.",
    carreiras:"Meteorologista, pesquisador climático, analista, consultor.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"678.90",
    sal:"R$ 5.000–11.000", salMid:8000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Clima","Atmosfera","Previsão"]
  },
  "Música": {
    vec:[1,2,10,3,2,2], area:"artes", matematica:0, tecnologia:0,
    desc:"Teoria, composição e execução musical em múltiplos gêneros.",
    carreiras:"Músico, compositor, professor, regente, produtor musical.",
    fuvest:{ac:44, ep:27, ppi:27}, notaSISU:"625.40",
    sal:"R$ 2.500–7.000", salMid:4750, emp:"Baixa", empScore:3, dem:"Competitiva", dur:"4",
    tags:["Som","Composição","Performance"]
  },
  "Nutrição": {
    vec:[2,6,0,8,2,4], area:"saude", matematica:1, tecnologia:0,
    desc:"Alimentação, nutrição clínica e promoção da saúde humana.",
    carreiras:"Nutricionista, pesquisador, consultor alimentar, gestor de UAN.",
    fuvest:{ac:54, ep:45, ppi:34}, notaSISU:"684.20",
    sal:"R$ 3.000–8.000", salMid:5500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Alimentação","Saúde","Clínica"]
  },
  "Nutrição e Metabolismo": {
    vec:[2,8,0,6,1,4], area:"saude", matematica:1, tecnologia:0,
    desc:"Nutrição clínica avançada com foco em metabolismo e doenças crônicas.",
    carreiras:"Nutricionista clínico, pesquisador em metabolismo, consultor em saúde.",
    fuvest:{ac:54, ep:45, ppi:34}, notaSISU:"698.40", sisuEstimated:true,
    sal:"R$ 3.500–9.000", salMid:6250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Nutrição","Metabolismo","Saúde"]
  },
  "Obstetrícia": {
    vec:[3,5,0,9,1,3], area:"saude", matematica:0, tecnologia:0,
    desc:"Cuidado integral à saúde da mulher durante gestação, parto e puerpério.",
    carreiras:"Obstetra, enfermeiro obstetra, pesquisador em saúde materna.",
    fuvest:{ac:41, ep:27, ppi:27}, notaSISU:"694.80", sisuEstimated:true,
    sal:"R$ 4.000–10.000", salMid:7000, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Gestação","Saúde da Mulher","Parto"]
  },
  "Oceanografia": {
    vec:[6,8,0,1,1,3], area:"exatas", matematica:2, tecnologia:1,
    desc:"Oceanos, mares, zonas costeiras e seus ecossistemas.",
    carreiras:"Oceanógrafo, pesquisador, consultor ambiental marinho.",
    fuvest:{ac:44, ep:28, ppi:27}, notaSISU:"659.80",
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Oceanos","Ecossistemas","Pesquisa"]
  },
  "Odontologia": {
    vec:[6,6,1,7,3,4], area:"saude", matematica:1, tecnologia:0,
    desc:"Prevenção, diagnóstico e tratamento de doenças bucais.",
    carreiras:"Cirurgião-dentista, especialista, pesquisador, professor.",
    fuvest:{ac:50, ep:37, ppi:27}, notaSISU:"754.30",
    sal:"R$ 5.000–18.000", salMid:11500, emp:"Alta", empScore:8, dem:"Estável", dur:"5",
    tags:["Saúde Bucal","Clínica","Cirurgia"]
  },
  "Pedagogia": {
    vec:[1,4,3,10,2,3], area:"humanas", matematica:0, tecnologia:0,
    desc:"Processos de ensino e aprendizagem em contextos formais e informais.",
    carreiras:"Pedagogo, professor, gestor educacional, orientador escolar.",
    fuvest:{ac:42, ep:27, ppi:27}, notaSISU:"604.60",
    sal:"R$ 2.500–6.000", salMid:4250, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Educação","Ensino","Aprendizagem"]
  },
  "Psicologia": {
    vec:[1,7,2,9,2,2], area:"saude", matematica:1, tecnologia:0,
    desc:"Comportamento humano, processos mentais e saúde psicológica.",
    carreiras:"Psicólogo clínico, organizacional, escolar, pesquisador.",
    fuvest:{ac:66, ep:56, ppi:48}, notaSISU:"745.60",
    sal:"R$ 3.500–10.000", salMid:6750, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Saúde Mental","Comportamento","Terapia"]
  },
  "Publicidade e Propaganda": {
    vec:[1,2,8,3,7,2], area:"artes", matematica:0, tecnologia:1,
    desc:"Criação e gestão de campanhas publicitárias e comunicação mercadológica.",
    carreiras:"Publicitário, diretor de criação, planejador, gestor de contas.",
    fuvest:{ac:59, ep:49, ppi:42}, notaSISU:"668.40",
    sal:"R$ 3.200–10.000", salMid:6600, emp:"Média", empScore:5, dem:"Competitiva", dur:"4",
    tags:["Publicidade","Criatividade","Mídia"]
  },
  "Química": {
    vec:[4,9,0,1,1,4], area:"exatas", matematica:3, tecnologia:1,
    desc:"Matéria, suas transformações, propriedades e aplicações industriais.",
    carreiras:"Químico, pesquisador, professor, analista laboratorial.",
    fuvest:{ac:48, ep:31, ppi:27}, notaSISU:"671.40",
    sal:"R$ 4.000–10.000", salMid:7000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Matéria","Laboratório","Síntese"]
  },
  "Relações Internacionais": {
    vec:[1,7,2,4,7,3], area:"humanas", matematica:1, tecnologia:0,
    desc:"Relações entre Estados, organizações e atores no cenário global.",
    carreiras:"Diplomata, analista internacional, gestor de projetos globais, consultor.",
    fuvest:{ac:66, ep:55, ppi:45}, notaSISU:"706.80",
    sal:"R$ 4.500–12.000", salMid:8250, emp:"Média", empScore:5, dem:"Competitiva", dur:"4",
    tags:["Diplomacia","Global","Política"]
  },
  "Relações Públicas": {
    vec:[1,2,4,6,7,3], area:"negocios", matematica:0, tecnologia:0,
    desc:"Gestão da comunicação entre organizações e seus públicos de interesse.",
    carreiras:"Relações públicas, assessor de comunicação, gestor de marca, consultor.",
    fuvest:{ac:50, ep:38, ppi:29}, notaSISU:"638.40",
    sal:"R$ 3.000–8.000", salMid:5500, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Comunicação","Marca","Relacionamento"]
  },
  "Saúde Pública": {
    vec:[2,6,0,9,4,4], area:"saude", matematica:1, tecnologia:0,
    desc:"Promoção, proteção e recuperação da saúde em nível coletivo e populacional.",
    carreiras:"Sanitarista, gestor em saúde, pesquisador, educador em saúde.",
    fuvest:{ac:30, ep:27, ppi:27}, notaSISU:"668.20",
    sal:"R$ 4.000–9.000", salMid:6500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Saúde Coletiva","Políticas","Prevenção"]
  },
  "Sistemas de Informação": {
    vec:[3,6,1,2,6,7], area:"tecnologia", matematica:2, tecnologia:3,
    desc:"Gestão e desenvolvimento de sistemas de informação em organizações.",
    carreiras:"Analista de sistemas, gestor de TI, desenvolvedor, consultor.",
    fuvest:{ac:57, ep:48, ppi:32}, notaSISU:"691.50",
    sal:"R$ 5.000–15.000", salMid:10000, emp:"Muito Alta", empScore:9, dem:"Crescendo", dur:"4",
    tags:["Sistemas","TI","Desenvolvimento"]
  },
  "Terapia Ocupacional": {
    vec:[4,4,2,9,1,3], area:"saude", matematica:0, tecnologia:0,
    desc:"Atividades terapêuticas para reabilitação, inclusão e promoção de autonomia.",
    carreiras:"Terapeuta ocupacional, pesquisador, gestor em saúde.",
    fuvest:{ac:48, ep:39, ppi:28}, notaSISU:"661.40",
    sal:"R$ 3.200–7.500", salMid:5350, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Reabilitação","Inclusão","Autonomia"]
  },
  "Têxtil e Moda": {
    vec:[3,2,9,2,5,3], area:"artes", matematica:1, tecnologia:0,
    desc:"Criação, produção e gestão no universo têxtil, de moda e vestuário.",
    carreiras:"Estilista, gestor de produção têxtil, consultor de moda.",
    fuvest:{ac:51, ep:42, ppi:33}, notaSISU:"621.80",
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Moda","Design","Têxtil"]
  },
  "Turismo": {
    vec:[2,2,3,6,7,3], area:"negocios", matematica:0, tecnologia:0,
    desc:"Planejamento turístico, gestão de destinos e desenvolvimento do setor de viagens.",
    carreiras:"Gestor de turismo, consultor, planejador de destinos, gestor de eventos.",
    fuvest:{ac:27, ep:27, ppi:27}, notaSISU:"598.40",
    sal:"R$ 2.800–7.500", salMid:5150, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Turismo","Destinos","Eventos"]
  },
  "Zootecnia": {
    vec:[7,6,0,3,3,3], area:"ambiental", matematica:1, tecnologia:0,
    desc:"Produção, manejo e conservação de animais domésticos e silvestres.",
    carreiras:"Zootecnista, gestor de produção animal, pesquisador.",
    fuvest:{ac:39, ep:27, ppi:27}, notaSISU:"643.70",
    sal:"R$ 3.800–8.500", salMid:6150, emp:"Alta", empScore:6, dem:"Estável", dur:"4",
    tags:["Animais","Produção","Manejo"]
  }
};


/* ═══════════════════════════════════════════════════════════════════════
 * INFORMAÇÕES EXTRAS POR CURSO (opcional)
 *
 * Tudo aqui é OPCIONAL e começa vazio de propósito: são dados que ainda
 * precisam ser levantados com fonte. Enquanto um campo não existir, a página
 * do curso mostra "ainda em levantamento" em vez de inventar um valor.
 *
 * A chave tem que ser o nome EXATO do curso em COURSES. Exemplo de formato
 * (valores fictícios só para mostrar a estrutura -- NÃO copie os números):
 *
 * "Estatística": {
 *   provaoPaulista: { texto: "X vagas em 2026", fonte: "https://..." },
 *   olimpiadas:     { texto: "Aceita medalhistas da OBMEP...", fonte: "https://..." },
 *   ondeEstudar:    [ { nome: "UNICAMP", obs: "Campinas" } ],
 *   curiosidade:    "Texto curto com uma pessoa notável formada na área (com fonte).",
 *   fontes:         [ "https://..." ]
 * }
 * ═══════════════════════════════════════════════════════════════════════ */
// PESSOAS QUE ESTUDARAM CADA CURSO (seção "Quem estudou isso" da página do curso)
// tipo: "area" = trabalha na área · "curiosidade" = ficou famosa em outra coisa.
// Cada pessoa foi conferida numa busca na web em out/2026; `fonte` é a página
// usada. Ao adicionar alguém, coloque sempre uma fonte confiável.
// `wiki` = "idioma:Título_do_artigo" na Wikipédia (ex: "pt:Lília_Cabral").
// O site busca a foto desse artigo direto da Wikipédia quando a página do
// curso abre. Sem `wiki` (ou se o artigo não tiver foto), aparecem as iniciais.
const COURSE_EXTRAS = {
  "Administração": {
    pessoas: [
      { nome: "Gilberto Gil", wiki: "en:Gilberto_Gil", tipo: "curiosidade",
        sobre: "Antes da música, formou-se em Administração de Empresas na Universidade da Bahia (atual UFBA) e chegou a trabalhar em uma multinacional.",
        fonte: "https://vestibulares.estrategia.com/portal/profissoes/graduacoes/9-famosos-que-estudaram-na-ufba/" },
      { nome: "Arnold Schwarzenegger", wiki: "en:Arnold_Schwarzenegger", tipo: "curiosidade",
        sobre: "Ator e ex-governador da Califórnia. Formou-se em Administração e marketing na Universidade de Wisconsin–Superior.",
        fonte: "https://captimes.com/news/local/education/campus_connection/campus-connection-superior-list-of-famous-alumni/article_13051f01-a8e0-5ab6-9af5-9b9ae15988be.html" }
    ]
  },
  "Arquitetura e Urbanismo": {
    pessoas: [
      { nome: "Oscar Niemeyer", wiki: "en:Oscar_Niemeyer", tipo: "area",
        sobre: "Formou-se arquiteto na Escola Nacional de Belas Artes (1934), projetou os principais prédios de Brasília e ganhou o Prêmio Pritzker (1988).",
        fonte: "https://en.wikipedia.org/wiki/Oscar_Niemeyer" },
      { nome: "Lina Bo Bardi", wiki: "en:Lina_Bo_Bardi", tipo: "area",
        sobre: "Arquiteta formada em Roma (1942), mudou-se para o Brasil e projetou o prédio do MASP, em São Paulo.",
        fonte: "https://www.infopedia.pt/artigos/$lina-bo-bardi" },
      { nome: "Chico Buarque", wiki: "en:Chico_Buarque", tipo: "curiosidade",
        sobre: "Entrou na Faculdade de Arquitetura e Urbanismo da USP em 1963, mas largou o curso para seguir na música.",
        fonte: "https://catracalivre.com.br/educacao/11-famosos-que-estudaram-na-usp-em-cursos-que-voce-nao-imagina/" }
    ]
  },
  "Artes Cênicas": {
    pessoas: [
      { nome: "Viola Davis", wiki: "en:Viola_Davis", tipo: "area",
        sobre: "Atriz vencedora do Oscar. Formou-se em Teatro no Rhode Island College e depois estudou na Juilliard.",
        fonte: "https://www.encyclopedia.com/people/literature-and-arts/film-and-television-biographies/viola-davis" },
      { nome: "Lilia Cabral", wiki: "pt:Lília_Cabral", tipo: "area",
        sobre: "Atriz de novelas como “Fina Estampa”, formou-se em 1978 na Escola de Arte Dramática (EAD) da USP.",
        fonte: "https://caras.com.br/perfil/lilia-cabral" }
    ]
  },
  "Astronomia": {
    pessoas: [
      { nome: "Carl Sagan", wiki: "en:Carl_Sagan", tipo: "area",
        sobre: "Formou-se em Física e fez doutorado em Astronomia na Universidade de Chicago. Criou a série “Cosmos”.",
        fonte: "https://www.nasonline.org/wp-content/uploads/2024/06/sagan-carl.pdf" },
      { nome: "Neil deGrasse Tyson", wiki: "en:Neil_deGrasse_Tyson", tipo: "area",
        sobre: "Formado em Física em Harvard, doutor em Astrofísica por Columbia. Dirige o Planetário Hayden e apresentou a nova versão de “Cosmos” (2014).",
        fonte: "https://www.calacademy.org/speaker/neil-degrasse-tyson" }
    ]
  },
  "Audiovisual": {
    pessoas: [
      { nome: "Steven Spielberg", wiki: "en:Steven_Spielberg", tipo: "area",
        sobre: "Diretor de “E.T.” e “Jurassic Park”. Concluiu a graduação em Cinema na Universidade Estadual da Califórnia em Long Beach em 2002, décadas depois de começar.",
        fonte: "https://www.upi.com/Archives/2002/05/14/Spielberg-wraps-college-career/5311021348800/" },
      { nome: "Fernando Meirelles", wiki: "en:Fernando_Meirelles", tipo: "curiosidade",
        sobre: "Diretor de “Cidade de Deus”. Estudou Arquitetura na USP antes de ir para o cinema.",
        fonte: "https://catracalivre.com.br/educacao/11-famosos-que-estudaram-na-usp-em-cursos-que-voce-nao-imagina/" }
    ]
  },
  "Biblioteconomia e Ciência da Informação": {
    pessoas: [
      { nome: "Inezita Barroso", wiki: "en:Inezita_Barroso", tipo: "curiosidade",
        sobre: "Ícone da música caipira e apresentadora do “Viola, Minha Viola”, fez parte da primeira turma de Biblioteconomia da USP.",
        fonte: "https://www.saopaulo.sp.leg.br/apartes/inezita-barroso-a-princesa-caipira/" }
    ]
  },
  "Relações Internacionais": {
    pessoas: [
      { nome: "Condoleezza Rice", wiki: "en:Condoleezza_Rice", tipo: "area",
        sobre: "Formou-se em Ciência Política na Universidade de Denver e chefiou a diplomacia dos EUA como secretária de Estado (2005–2009).",
        fonte: "https://en.wikipedia.org/wiki/Condoleezza_Rice" }
    ]
  },
  "Ciências Biológicas": {
    pessoas: [
      { nome: "David Attenborough", wiki: "en:David_Attenborough", tipo: "area",
        sobre: "Naturalista e apresentador de documentários sobre a natureza. Formou-se em Ciências Naturais na Universidade de Cambridge.",
        fonte: "https://www.weforum.org/people/sir-david-attenborough/" }
    ]
  },
  "Ciências Contábeis": {
    pessoas: [
      { nome: "Kenny G", wiki: "en:Kenny_G", tipo: "curiosidade",
        sobre: "O saxofonista formou-se em Contabilidade na Universidade de Washington, com honras.",
        fonte: "https://en.wikipedia.org/wiki/Kenny_G" }
    ]
  },
  "Ciências Sociais": {
    pessoas: [
      { nome: "Fernando Henrique Cardoso", wiki: "en:Fernando_Henrique_Cardoso", tipo: "area",
        sobre: "Sociólogo formado em Ciências Sociais na USP, foi presidente do Brasil (1995–2002).",
        fonte: "https://fundacaofhc.org.br/files/Conversas%20com%20sociologos%20brasileiros%20-%20Fernando%20Henrique%20Cardoso%20%5bentrevista%5d.PDF" },
      { nome: "Michelle Obama", wiki: "en:Michelle_Obama", tipo: "curiosidade",
        sobre: "Formou-se em Sociologia em Princeton (1985) e depois em Direito em Harvard.",
        fonte: "https://www.princeton.edu/main/news/archive/S23/38/47Q26/" }
    ]
  },
  "Ciências da Computação": {
    pessoas: [
      { nome: "Larry Page", wiki: "en:Larry_Page", tipo: "area",
        sobre: "Cofundador do Google, que nasceu como projeto de pesquisa em Ciência da Computação em Stanford, junto com Sergey Brin.",
        fonte: "https://engineering.stanford.edu/about/heroes/2014-heroes/larry-page" },
      { nome: "Alan Turing", wiki: "en:Alan_Turing", tipo: "area",
        sobre: "Formou-se em Matemática em Cambridge (1934) e é considerado um dos pais da computação. Ajudou a decifrar códigos nazistas na Segunda Guerra.",
        fonte: "https://www.gchq.gov.uk/information/alan-turing" }
    ]
  },
  "Design": {
    pessoas: [
      { nome: "Jony Ive", wiki: "en:Jony_Ive", tipo: "area",
        sobre: "Formado em Design Industrial na Newcastle Polytechnic, foi o principal designer da Apple e ajudou a criar o iPhone.",
        fonte: "https://www.britannica.com/biography/Jony-Ive" }
    ]
  },
  "Direito": {
    pessoas: [
      { nome: "Barack Obama", wiki: "en:Barack_Obama", tipo: "area",
        sobre: "Formou-se em Direito em Harvard (1991) e deu aulas de Direito Constitucional na Universidade de Chicago antes de ser presidente dos EUA.",
        fonte: "https://hls.harvard.edu/today/barack-obama-91-will-be-the-44th-president-of-the-united-states" },
      { nome: "Mahatma Gandhi", wiki: "en:Mahatma_Gandhi", tipo: "curiosidade",
        sobre: "Estudou Direito em Londres e tornou-se advogado em 1891, antes de liderar a luta pela independência da Índia.",
        fonte: "https://www.mkgandhi.org/faq/was-Gandhi-a-qualified-lawyer.php" }
    ]
  },
  "Economia": {
    pessoas: [
      { nome: "Esther Duflo", wiki: "en:Esther_Duflo", tipo: "area",
        sobre: "Economista que ganhou o Nobel de Economia de 2019 estudando formas de combater a pobreza.",
        fonte: "https://college-de-france.fr/en/news/esther-duflo-nobel-prize-in-economics-2019" },
      { nome: "Mick Jagger", wiki: "en:Mick_Jagger", tipo: "curiosidade",
        sobre: "Estudou na London School of Economics, mas largou o curso em 1963 para se dedicar aos Rolling Stones.",
        fonte: "https://www.thegazette.co.uk/all-notices/content/191" }
    ]
  },
  "Educação Física e Esporte": {
    pessoas: [
      { nome: "Lygia Fagundes Telles", wiki: "en:Lygia_Fagundes_Telles", tipo: "curiosidade",
        sobre: "Uma das maiores escritoras do Brasil, ingressou em 1939 na Escola de Educação Física da USP.",
        fonte: "https://vestibulares.estrategia.com/portal/profissoes/graduacoes/19-famosos-que-estudaram-na-usp/" }
    ]
  },
  "Enfermagem": {
    pessoas: [
      { nome: "Amália Corrêa de Carvalho", tipo: "area",
        sobre: "Da primeira turma da Escola de Enfermagem da USP (1946), presidiu a ABEn e participou da criação do Conselho Federal de Enfermagem.",
        fonte: "https://www.ee.usp.br/wp-content/uploads/2024/10/amalia.pdf" }
    ]
  },
  "Engenharia Aeronáutica": {
    pessoas: [
      { nome: "Neil Armstrong", wiki: "en:Neil_Armstrong", tipo: "area",
        sobre: "Formado em Engenharia Aeronáutica pela Universidade Purdue (1955), foi o primeiro ser humano a pisar na Lua (1969).",
        fonte: "https://www.nasa.gov/wp-content/uploads/2016/01/armstrong_neil.pdf" },
      { nome: "Marcos Pontes", wiki: "en:Marcos_Pontes", tipo: "area",
        sobre: "Engenheiro aeronáutico formado pelo ITA, primeiro astronauta brasileiro a ir ao espaço (2006).",
        fonte: "https://marcospontes.com.br/wp-content/uploads/2023/08/20230310_CURRICULO_MCP.pdf" }
    ]
  },
  "Engenharia Civil": {
    pessoas: [
      { nome: "Marcelo Tas", wiki: "en:Marcelo_Tas", tipo: "curiosidade",
        sobre: "O apresentador formou-se em Engenharia Civil na Escola Politécnica da USP.",
        fonte: "https://catracalivre.com.br/educacao/11-famosos-que-estudaram-na-usp-em-cursos-que-voce-nao-imagina/" }
    ]
  },
  "Engenharia Elétrica": {
    pessoas: [
      { nome: "Jeff Bezos", wiki: "en:Jeff_Bezos", tipo: "curiosidade",
        sobre: "Formou-se em Engenharia Elétrica e Ciência da Computação em Princeton (1986) antes de fundar a Amazon.",
        fonte: "https://www.britannica.com/facts/Jeff-Bezos" },
      { nome: "Rowan Atkinson", wiki: "en:Rowan_Atkinson", tipo: "curiosidade",
        sobre: "O Mr. Bean formou-se em Engenharia Elétrica e Eletrônica na Universidade de Newcastle e fez mestrado em Oxford.",
        fonte: "https://en.wikipedia.org/wiki/Rowan_Atkinson" }
    ]
  },
  "Engenharia Mecânica": {
    pessoas: [
      { nome: "Tom Scholz", wiki: "en:Tom_Scholz", tipo: "curiosidade",
        sobre: "Formou-se em Engenharia Mecânica no MIT e trabalhava na Polaroid quando gravou, no porão de casa, o primeiro disco da banda Boston.",
        fonte: "https://www.technologyreview.com/2024/08/27/1095835/not-just-another-band-from-boston/" }
    ]
  },
  "Engenharia Química": {
    pessoas: [
      { nome: "Jack Welch", wiki: "en:Jack_Welch", tipo: "area",
        sobre: "Formado em Engenharia Química, com doutorado na área, entrou na General Electric como engenheiro e chegou a presidente da empresa (1981–2001).",
        fonte: "https://en.wikipedia.org/wiki/Jack_Welch" },
      { nome: "Ivan Lins", wiki: "en:Ivan_Lins", tipo: "curiosidade",
        sobre: "O cantor e compositor formou-se em Química na UFRJ no fim dos anos 1960 (algumas fontes dizem Engenharia Química, outras Química Industrial).",
        fonte: "https://www12.senado.leg.br/radio/1/escala-brasileira/2016/05/06/ivan-lins" }
    ]
  },
  "Engenharia de Computação": {
    pessoas: [
      { nome: "Steve Wozniak", wiki: "en:Steve_Wozniak", tipo: "area",
        sobre: "Cofundador da Apple. Voltou à universidade e concluiu Engenharia Elétrica e Ciência da Computação em Berkeley em 1986.",
        fonte: "https://computerhistory.org/profile/steve-wozniak/" }
    ]
  },
  "Engenharia de Produção": {
    pessoas: [
      { nome: "Roberto Setubal", wiki: "pt:Roberto_Setubal", tipo: "area",
        sobre: "Formado em Engenharia de Produção na Escola Politécnica da USP, presidiu o Itaú Unibanco.",
        fonte: "https://weforum.org/people/roberto-egydio-setubal" },
      { nome: "Pedro Passos", tipo: "area",
        sobre: "Engenheiro formado pela Escola Politécnica da USP, foi sócio da Natura e copresidente do seu conselho de administração.",
        fonte: "https://engenharia360.com/7-engenheiros-de-producao-brasileiros-que-voce-nao-conhecia/" }
    ]
  },
  "Farmácia": {
    pessoas: [
      { nome: "John Pemberton", wiki: "en:John_Stith_Pemberton", tipo: "area",
        sobre: "Farmacêutico em Atlanta, criou em 1886 o xarope que deu origem à Coca-Cola.",
        fonte: "https://www.coca-cola.com/us/en/about-us/faq/how-was-coca-cola-invented" }
    ]
  },
  "Filosofia": {
    pessoas: [
      { nome: "Marilena Chaui", wiki: "pt:Marilena_Chaui", tipo: "area",
        sobre: "Filósofa, formou-se em Filosofia na USP (1965) e é professora de Filosofia da universidade desde 1967.",
        fonte: "https://www.infoescola.com/biografias/marilena-chaui/" },
      { nome: "Ricky Gervais", wiki: "en:Ricky_Gervais", tipo: "curiosidade",
        sobre: "Comediante e criador da série “The Office”. Formou-se em Filosofia na University College London.",
        fonte: "https://en.wikipedia.org/wiki/Ricky_Gervais" }
    ]
  },
  "Física": {
    pessoas: [
      { nome: "Albert Einstein", wiki: "en:Albert_Einstein", tipo: "area",
        sobre: "Formou-se em 1900 na Politécnica de Zurique, habilitado a ensinar Física e Matemática. Ganhou o Nobel de Física de 1921.",
        fonte: "https://einsteinpapers.press.princeton.edu/vol1-doc/111" },
      { nome: "Brian May", wiki: "en:Brian_May", tipo: "curiosidade",
        sobre: "Guitarrista do Queen. Estudou Física no Imperial College de Londres e, décadas depois, concluiu o doutorado em Astrofísica (2007).",
        fonte: "https://www.imperial.ac.uk/news/30594/annual-alumni-lecture-2007/amp/" }
    ]
  },
  "Geografia": {
    pessoas: [
      { nome: "Príncipe William", wiki: "en:William,_Prince_of_Wales", tipo: "curiosidade",
        sobre: "Herdeiro do trono britânico, formou-se em Geografia na Universidade de St Andrews (2005).",
        fonte: "https://debretts.com/royal-family/prince-william/" }
    ]
  },
  "Geologia": {
    pessoas: [
      { nome: "Herbert Hoover", wiki: "en:Herbert_Hoover", tipo: "curiosidade",
        sobre: "Formou-se em Geologia em Stanford (1895), trabalhou como engenheiro de minas e foi presidente dos EUA (1929–1933).",
        fonte: "https://www.newworldencyclopedia.org/entry/Herbert_Hoover" }
    ]
  },
  "História": {
    pessoas: [
      { nome: "Sacha Baron Cohen", wiki: "en:Sacha_Baron_Cohen", tipo: "curiosidade",
        sobre: "Ator e comediante, criador do personagem Borat. Estudou História na Universidade de Cambridge.",
        fonte: "https://alumni.christs.cam.ac.uk/sacha-baron-cohen" }
    ]
  },
  "Jornalismo": {
    pessoas: [
      { nome: "Fátima Bernardes", wiki: "pt:Fátima_Bernardes", tipo: "area",
        sobre: "Formou-se em Jornalismo na UFRJ e foi apresentadora do Jornal Nacional.",
        fonte: "https://caras.com.br/perfil/fatima-bernardes" },
      { nome: "Wagner Moura", wiki: "en:Wagner_Moura", tipo: "curiosidade",
        sobre: "O ator formou-se em Jornalismo na UFBA e chegou a trabalhar como repórter antes de se dedicar ao teatro e ao cinema.",
        fonte: "https://www.adorocinema.com/noticias/filmes/noticia-1000186390/" }
    ]
  },
  "Letras": {
    pessoas: [
      { nome: "Toni Morrison", wiki: "en:Toni_Morrison", tipo: "area",
        sobre: "Escritora vencedora do Nobel de Literatura (1993). Formou-se em Letras (Inglês) na Universidade Howard.",
        fonte: "https://aas.princeton.edu/people/toni-morrison" },
      { nome: "J. K. Rowling", wiki: "en:J._K._Rowling", tipo: "curiosidade",
        sobre: "Autora de Harry Potter, estudou Francês e Letras Clássicas na Universidade de Exeter.",
        fonte: "https://willamette.edu/undergraduate/classics/careers/rowling" }
    ]
  },
  "Matemática": {
    pessoas: [
      { nome: "Artur Avila", wiki: "en:Artur_Avila", tipo: "area",
        sobre: "Matemático brasileiro, primeiro latino-americano a ganhar a Medalha Fields (2014), o prêmio mais importante da matemática.",
        fonte: "https://agencia.fapesp.br/matematico-brasileiro-ganha-medalha-fields/19603" },
      { nome: "Danica McKellar", wiki: "en:Danica_McKellar", tipo: "curiosidade",
        sobre: "Atriz da série “Anos Incríveis”. Formou-se em Matemática na UCLA (1998) e escreveu livros para ensinar matemática a adolescentes.",
        fonte: "https://alumni.ucla.edu/?p=4151" }
    ]
  },
  "Medicina": {
    pessoas: [
      { nome: "Drauzio Varella", wiki: "en:Drauzio_Varella", tipo: "area",
        sobre: "Médico oncologista e escritor, autor de “Estação Carandiru”. Formou-se em Medicina na USP.",
        fonte: "https://revistapesquisa.fapesp.br/antonio-drauzio-varella-palavra-de-medico/" },
      { nome: "Che Guevara", wiki: "en:Che_Guevara", tipo: "curiosidade",
        sobre: "Formou-se em Medicina na Universidade de Buenos Aires (1953) antes de se tornar um dos líderes da Revolução Cubana.",
        fonte: "https://www.encyclopedia.com/history/encyclopedias-almanacs-transcripts-and-maps/ernesto-guevara" }
    ]
  },
  "Medicina Veterinária": {
    pessoas: [
      { nome: "James Herriot", wiki: "en:James_Herriot", tipo: "area",
        sobre: "Veterinário formado em Glasgow (1939), escreveu os livros que viraram a série “All Creatures Great and Small”.",
        fonte: "https://en.wikipedia.org/wiki/James_Herriot" }
    ]
  },
  "Música": {
    pessoas: [
      { nome: "Tom Zé", wiki: "en:Tom_Zé", tipo: "area",
        sobre: "Um dos criadores da Tropicália, formou-se na Escola de Música da UFBA em 1967, onde depois foi professor.",
        fonte: "https://unicamp.br/unicamp/sites/default/files/jornal/paginas/ju_626_paginacor_12_web.pdf" }
    ]
  },
  "Odontologia": {
    pessoas: [
      { nome: "Doc Holliday", wiki: "en:Doc_Holliday", tipo: "curiosidade",
        sobre: "Pistoleiro famoso do Velho Oeste, formou-se dentista no Pennsylvania College of Dental Surgery (1872).",
        fonte: "https://en.wikipedia.org/wiki/Doc_Holliday" }
    ]
  },
  "Psicologia": {
    pessoas: [
      { nome: "Daniel Kahneman", wiki: "en:Daniel_Kahneman", tipo: "area",
        sobre: "Psicólogo que ganhou o Nobel de Economia (2002) estudando como as pessoas tomam decisões.",
        fonte: "https://www.nobelprize.org/prizes/economic-sciences/2002/kahneman/facts/" },
      { nome: "Natalie Portman", wiki: "en:Natalie_Portman", tipo: "curiosidade",
        sobre: "Atriz vencedora do Oscar, formou-se em Psicologia em Harvard (2003).",
        fonte: "https://jwa.org/encyclopedia/article/portman-natalie" }
    ]
  },
  "Publicidade e Propaganda": {
    pessoas: [
      { nome: "William Bonner", wiki: "pt:William_Bonner", tipo: "curiosidade",
        sobre: "O apresentador do Jornal Nacional formou-se em Publicidade e Propaganda na ECA-USP, e não em Jornalismo.",
        fonte: "https://jornal.usp.br/?p=980452" }
    ]
  },
  "Química": {
    pessoas: [
      { nome: "Marie Curie", wiki: "en:Marie_Curie", tipo: "area",
        sobre: "Única pessoa a ganhar o Nobel em duas ciências diferentes: Física (1903) e Química (1911).",
        fonte: "https://www.nobelprize.org/stories/women-who-changed-science/marie-curie/" },
      { nome: "Margaret Thatcher", wiki: "en:Margaret_Thatcher", tipo: "curiosidade",
        sobre: "Antes da política, formou-se em Química em Oxford e trabalhou como química. Foi primeira-ministra do Reino Unido (1979–1990).",
        fonte: "https://archives.chu.cam.ac.uk/?p=2974" }
    ]
  },
  "Terapia Ocupacional": {
    pessoas: [
      { nome: "Maria Fernanda Cândido", wiki: "pt:Maria_Fernanda_Cândido", tipo: "curiosidade",
        sobre: "A atriz de “Terra Nostra” formou-se em Terapia Ocupacional na USP.",
        fonte: "https://www.purepeople.com.br/famosos/maria-fernanda-candido_p3424" }
    ]
  }
};

/* ═══════════════════════════════════════════════════════════════════════
 * VETERANOS (mentores) — "Fale com um Veterano"
 *
 * Só cadastre alguém com autorização por escrito da pessoa (LGPD).
 * NUNCA coloque e-mail ou telefone pessoal aqui: este arquivo é público.
 * Para contato, use LinkedIn ou um formulário (ex: Google Forms) que
 * encaminhe a mensagem sem expor o endereço.
 *
 * Formato:
 * {
 *   nome: "Nome Sobrenome",
 *   curso: "Estatística",            // nome EXATO de um curso em COURSES
 *   ano: "3º ano",                   // tempo de curso
 *   bio: "Mensagem curta de boas-vindas.",
 *   foto: "img/veteranos/nome.jpg",  // opcional
 *   linkedin: "https://www.linkedin.com/in/...", // opcional
 *   formulario: "https://forms.gle/..."          // opcional
 * }
 * ═══════════════════════════════════════════════════════════════════════ */
const VETERANS = [
];

/* ═══════════════════════════════════════════════════════════════════════
 * MENTORIAS EM GRUPO (rodas de conversa)
 *
 * Formato:
 * { curso: "Estatística", titulo: "Roda de conversa", data: "2026-11-10T19:00", link: "https://meet.google.com/..." }
 * Encontros com data passada somem automaticamente do site.
 * ═══════════════════════════════════════════════════════════════════════ */
const MENTORIAS = [
];
