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
 *   Resultado: os 98 cursos conseguem aparecer em #1 para pelo menos um
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
 * marcada (ou "nenhuma em especial"), mostra os 98 cursos pelo perfil puro.
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
  formularioVeteranos: ""
};

const QUESTIONS = [
  {
    q: "Qual atividade do dia a dia mais te atrai?",
    dim: "activity",
    opts: [
      { t:"Montar, consertar ou construir coisas com as mãos",        e:"🔧", v:"R", riasec:"R" },
      { t:"Investigar um problema até entender como ele funciona",    e:"🔬", v:"I", riasec:"I" },
      { t:"Criar algo original — visual, escrito ou sonoro",          e:"🎨", v:"A", riasec:"A" },
      { t:"Ajudar, ensinar ou cuidar de outras pessoas",              e:"❤️", v:"S", riasec:"S" },
      { t:"Convencer, negociar ou liderar um grupo",                  e:"🚀", v:"E", riasec:"E" },
      { t:"Organizar dados, informações ou processos com precisão",  e:"📊", v:"C", riasec:"C" }
    ]
  },
  {
    q: "Qual desses te descreve melhor?",
    dim: "talent",
    opts: [
      { t:"Prático — gosto de resolver problemas com as mãos",       e:"🛠️", v:"R", riasec:"R" },
      { t:"Analítico — gosto de investigar e testar hipóteses",      e:"🧪", v:"I", riasec:"I" },
      { t:"Criativo — tenho facilidade pra imaginar coisas novas",   e:"✨", v:"A", riasec:"A" },
      { t:"Empático — entendo bem os sentimentos das pessoas",       e:"💞", v:"S", riasec:"S" },
      { t:"Persuasivo — consigo influenciar e liderar pessoas",      e:"📣", v:"E", riasec:"E" },
      { t:"Detalhista — gosto de manter tudo organizado",            e:"🗂️", v:"C", riasec:"C" }
    ]
  },
  {
    q: "Que ambiente de trabalho te atrai mais?",
    dim: "environment",
    opts: [
      { t:"Oficina, obra, fazenda ou fábrica",           e:"🏗️", v:"R", riasec:"R" },
      { t:"Laboratório de pesquisa ou universidade",     e:"🔬", v:"I", riasec:"I" },
      { t:"Estúdio, ateliê ou espaço criativo",          e:"🎬", v:"A", riasec:"A" },
      { t:"Escola, hospital ou ONG",                     e:"🏥", v:"S", riasec:"S" },
      { t:"Escritório de negócios ou startup",           e:"🏢", v:"E", riasec:"E" },
      { t:"Escritório administrativo, banco ou cartório",e:"📑", v:"C", riasec:"C" }
    ]
  },
  {
    q: "O que mais te motiva na carreira?",
    dim: "motivation",
    opts: [
      { t:"Ver o resultado concreto e físico do meu trabalho",  e:"🔩", v:"R", riasec:"R" },
      { t:"Entender profundamente como as coisas funcionam",    e:"🔍", v:"I", riasec:"I" },
      { t:"Me expressar e criar algo único",                    e:"🎭", v:"A", riasec:"A" },
      { t:"Impactar positivamente a vida das pessoas",          e:"💗", v:"S", riasec:"S" },
      { t:"Ter influência, liderar e crescer profissionalmente",e:"🚀", v:"E", riasec:"E" },
      { t:"Ter estabilidade e processos bem definidos",         e:"📐", v:"C", riasec:"C" }
    ]
  },
  {
    q: "Num trabalho em grupo, qual papel você assume naturalmente?",
    dim: "team_role",
    opts: [
      { t:"Executo a parte prática/técnica do projeto",       e:"🔧", v:"R", riasec:"R" },
      { t:"Pesquiso e resolvo os problemas mais difíceis",    e:"🧠", v:"I", riasec:"I" },
      { t:"Cuido da parte criativa e visual",                 e:"🎨", v:"A", riasec:"A" },
      { t:"Cuido da comunicação e do bem-estar do grupo",     e:"🤝", v:"S", riasec:"S" },
      { t:"Coordeno o projeto e tomo as decisões",            e:"🏆", v:"E", riasec:"E" },
      { t:"Organizo cronograma, dados e documentação",        e:"📋", v:"C", riasec:"C" }
    ]
  },
  {
    q: "Que tipo de desafio te dá mais satisfação em resolver?",
    dim: "challenge",
    opts: [
      { t:"Um problema físico ou mecânico",             e:"⚙️", v:"R", riasec:"R" },
      { t:"Um mistério ou pergunta científica",         e:"🔬", v:"I", riasec:"I" },
      { t:"Uma página em branco pra criar do zero",     e:"🖌️", v:"A", riasec:"A" },
      { t:"Uma pessoa ou grupo precisando de ajuda",    e:"🤲", v:"S", riasec:"S" },
      { t:"Uma negociação ou decisão de alto risco",    e:"💼", v:"E", riasec:"E" },
      { t:"Uma bagunça de dados ou processos",          e:"🧮", v:"C", riasec:"C" }
    ]
  },
  {
    q: "Quais áreas mais te interessam? (escolha uma ou mais)",
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
    q: "Qual seu nível de afinidade com matemática?",
    dim: "math",
    opts: [
      { t:"Alta — adoro cálculo, álgebra, estatística",   e:"🧮", v:"alto" },
      { t:"Média — me saio bem, mas não é minha paixão",  e:"✅", v:"medio" },
      { t:"Baixa — prefiro evitar cálculos complexos",    e:"📝", v:"baixo" },
      { t:"Mínima — definitivamente não é minha área",    e:"🚫", v:"minimo" }
    ]
  },
  {
    q: "Qual seu interesse em tecnologia e programação?",
    dim: "tech",
    opts: [
      { t:"Muito alto — quero criar tecnologia",        e:"💡", v:"muito-alto" },
      { t:"Alto — tecnologia como ferramenta central",  e:"📱", v:"alto" },
      { t:"Moderado — uso tecnologia mas não é o foco", e:"💻", v:"moderado" },
      { t:"Baixo — prefiro áreas menos técnicas",       e:"📚", v:"baixo" }
    ]
  },
  {
    q: "Quanto tempo de graduação você aceita?",
    dim: "duration",
    opts: [
      { t:"4 anos — quero terminar logo",           e:"⚡", v:"4" },
      { t:"5 anos — tempo razoável",                e:"📅", v:"5" },
      { t:"6 anos — não tenho pressa, vale a pena", e:"♾️", v:"6" }
    ]
  },
  {
    q: "Qual faixa salarial inicial é importante pra você?",
    dim: "salary",
    opts: [
      { t:"Acima de R$ 7.000 — prioridade máxima", e:"💎", v:"muito-alto" },
      { t:"R$ 4.000–7.000 — equilíbrio ideal",     e:"⚖️", v:"alto" },
      { t:"R$ 2.500–4.000 — satisfatório",         e:"🌟", v:"medio" },
      { t:"Não é prioridade — prefiro realização",  e:"🌱", v:"baixo" }
    ]
  }
];

const COURSES = {
  "Administração": {
    vec:[1,2,1,3,9,6], area:"negocios",
    desc:"Gestão de organizações, recursos e pessoas para maximizar resultados.",
    carreiras:"Gerente, consultor, empreendedor, analista de negócios.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"670.40",
    sal:"R$ 4.500–12.000", salMid:8250, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Gestão","Liderança","Estratégia"]
  },
  "Arquitetura e Urbanismo": {
    vec:[5,3,9,2,3,3], area:"artes",
    desc:"Projeto de espaços habitáveis com foco em estética, funcionalidade e planejamento urbano.",
    carreiras:"Arquiteto, urbanista, paisagista, designer de interiores.",
    fuvest:{ac:61, ep:49, ppi:38}, notaSISU:"727.00",
    sal:"R$ 3.800–9.000", salMid:6400, emp:"Média", empScore:5, dem:"Estável", dur:"5",
    tags:["Design","Cidade","Projetos"]
  },
  "Artes Cênicas": {
    vec:[2,1,10,5,3,0], area:"artes",
    desc:"Teatro, dança e performance — teoria e prática das artes do corpo.",
    carreiras:"Ator, diretor, coreógrafo, produtor cultural, professor.",
    fuvest:{ac:53, ep:42, ppi:32}, notaSISU:"611.20",
    sal:"R$ 2.500–6.000", salMid:4250, emp:"Baixa", empScore:3, dem:"Competitiva", dur:"4",
    tags:["Teatro","Dança","Expressão"]
  },
  "Artes Visuais": {
    vec:[2,1,10,2,2,1], area:"artes",
    desc:"Pintura, escultura, fotografia, vídeo e arte digital.",
    carreiras:"Artista, curador, crítico de arte, professor, galerista.",
    fuvest:{ac:59, ep:50, ppi:37}, notaSISU:"603.80",
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Arte","Visual","Criatividade"]
  },
  "Astronomia": {
    vec:[2,10,2,1,0,2], area:"exatas",
    desc:"Estudo científico do universo, estrelas, planetas e fenômenos celestes.",
    carreiras:"Astrônomo, pesquisador, professor universitário, divulgador científico.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"721.40",
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Universo","Pesquisa","Física"]
  },
  "Audiovisual": {
    vec:[2,2,10,3,4,1], area:"artes",
    desc:"Linguagem e produção audiovisual: cinema, vídeo, televisão e mídias digitais.",
    carreiras:"Cineasta, diretor, roteirista, produtor, editor de vídeo.",
    fuvest:{ac:63, ep:54, ppi:41}, notaSISU:"651.80",
    sal:"R$ 3.000–8.500", salMid:5750, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Cinema","Roteiro","Produção"]
  },
  "Biblioteconomia e Ciência da Informação": {
    vec:[1,5,2,4,1,8], area:"humanas",
    desc:"Organização, gestão e disseminação da informação em acervos físicos e digitais.",
    carreiras:"Bibliotecário, gestor de informação, analista de documentação, arquivista.",
    fuvest:{ac:49, ep:35, ppi:33}, notaSISU:"588.20",
    sal:"R$ 3.000–6.500", salMid:4750, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Informação","Documentação","Gestão"]
  },

  "Biotecnologia": {
    vec:[4,10,0,1,2,3], area:"ambiental",
    desc:"Aplicação de tecnologia em sistemas biológicos para novos produtos e tratamentos.",
    carreiras:"Pesquisador, analista, desenvolvedor de bioprodutos, consultor.",
    fuvest:{ac:53, ep:34, ppi:29}, notaSISU:"748.60",
    sal:"R$ 5.500–12.000", salMid:8750, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Biotech","Inovação","Laboratório"]
  },
  "Ciências Agrárias": {
    vec:[8,6,0,2,3,3], area:"ambiental",
    desc:"Produção agropecuária sustentável: solo, plantas e animais.",
    carreiras:"Engenheiro agrônomo, pesquisador, consultor agrícola.",
    fuvest:{ac:46, ep:27, ppi:27}, notaSISU:"641.30",
    sal:"R$ 4.000–9.000", salMid:6500, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Agro","Sustentabilidade","Campo"]
  },
  "Ciências Atuariais": {
    vec:[1,6,0,1,5,9], area:"negocios",
    desc:"Matemática e estatística para análise de riscos em seguros e finanças.",
    carreiras:"Atuário, analista de riscos, consultor financeiro.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"709.50",
    sal:"R$ 5.000–11.000", salMid:8000, emp:"Alta", empScore:8, dem:"Estável", dur:"4",
    tags:["Matemática","Risco","Finanças"]
  },
  "Ciências Biológicas": {
    vec:[5,9,1,2,0,2], area:"ambiental",
    desc:"Seres vivos, processos vitais e relações ecológicas.",
    carreiras:"Biólogo, pesquisador, professor, perito ambiental.",
    fuvest:{ac:56, ep:46, ppi:29}, notaSISU:"689.40",
    sal:"R$ 3.500–8.000", salMid:5750, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Biologia","Ecologia","Pesquisa"]
  },
  "Ciências Biomédicas": {
    vec:[3,10,0,3,1,3], area:"saude",
    desc:"Pesquisa e análise de processos biológicos relacionados à saúde humana.",
    carreiras:"Pesquisador, analista biomédico, professor universitário.",
    fuvest:{ac:60, ep:49, ppi:40}, notaSISU:"735.80",
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Pesquisa","Saúde","Laboratório"]
  },
  "Ciências Contábeis": {
    vec:[1,2,0,1,5,10], area:"negocios",
    desc:"Gestão financeira, contabilidade e controle patrimonial.",
    carreiras:"Contador, auditor, controller, consultor tributário.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"641.90",
    sal:"R$ 4.000–9.000", salMid:6500, emp:"Alta", empScore:8, dem:"Estável", dur:"4",
    tags:["Finanças","Auditoria","Tributário"]
  },
  "Ciências da Computação": {
    vec:[3,9,2,1,3,5], area:"tecnologia",
    desc:"Algoritmos, software, inteligência artificial e sistemas computacionais.",
    carreiras:"Desenvolvedor, cientista de dados, arquiteto de software, pesquisador.",
    fuvest:{ac:63, ep:52, ppi:40}, notaSISU:"750.10",
    sal:"R$ 6.000–20.000", salMid:13000, emp:"Muito Alta", empScore:10, dem:"Crescendo", dur:"4",
    tags:["Programação","IA","Sistemas"]
  },
  "Ciência de Dados": {
    vec:[2,9,1,2,3,6], area:"tecnologia",
    desc:"Análise e interpretação de grandes volumes de dados para apoio à decisão.",
    carreiras:"Cientista de dados, engenheiro de ML, analista de BI.",
    fuvest:{ac:63, ep:52, ppi:40}, notaSISU:"762.30", sisuEstimated:true,
    sal:"R$ 6.000–22.000", salMid:14000, emp:"Muito Alta", empScore:10, dem:"Crescendo", dur:"4",
    tags:["Dados","Machine Learning","Análise"]
  },
  "Ciências da Natureza": {
    vec:[4,8,1,5,1,3], area:"exatas",
    desc:"Formação interdisciplinar em Física, Química e Biologia voltada para a docência.",
    carreiras:"Professor de Ciências, educador ambiental, pesquisador em ensino de ciências.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"612.30",
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Ensino","Ciências","Interdisciplinar"]
  },
  "Ciências dos Alimentos": {
    vec:[5,8,0,2,2,4], area:"ambiental",
    desc:"Propriedades, processamento, segurança e conservação de alimentos.",
    carreiras:"Pesquisador, tecnólogo de alimentos, analista de qualidade.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"678.20",
    sal:"R$ 4.200–8.500", salMid:6350, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Alimentos","Qualidade","Segurança"]
  },
  "Ciências Exatas": {
    vec:[3,10,0,1,1,4], area:"exatas",
    desc:"Base sólida em Matemática, Física e Química com flexibilidade para especialização.",
    carreiras:"Pesquisador, professor, analista quantitativo, engenheiro.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"698.50",
    sal:"R$ 5.000–13.000", salMid:9000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Matemática","Física","Química"]
  },
  "Ciências Físicas e Biomoleculares": {
    vec:[3,10,0,1,0,3], area:"exatas",
    desc:"Interface entre Física, Química e Biologia aplicada a sistemas moleculares e celulares.",
    carreiras:"Pesquisador, analista biomolecular, professor universitário.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"718.40", sisuEstimated:true,
    sal:"R$ 5.000–11.000", salMid:8000, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Biofísica","Pesquisa","Molecular"]
  },
  "Ciência Política": {
    vec:[1,8,2,5,5,2], area:"humanas",
    desc:"Análise de sistemas políticos, poder, Estado e relações internacionais.",
    carreiras:"Cientista político, consultor, analista de políticas públicas, pesquisador.",
    fuvest:{ac:43, ep:27, ppi:27}, fuvestNota:"Ingresso via Ciências Sociais na FUVEST", notaSISU:"668.70",
    sal:"R$ 3.800–9.000", salMid:6400, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Política","Estado","Análise"]
  },
  "Ciências Sociais": {
    vec:[1,8,3,7,3,1], area:"humanas",
    desc:"Análise de sociedades humanas, culturas e dinâmicas sociais.",
    carreiras:"Pesquisador, consultor social, analista de políticas, professor.",
    fuvest:{ac:43, ep:27, ppi:27}, notaSISU:"632.50",
    sal:"R$ 3.200–7.000", salMid:5100, emp:"Média", empScore:4, dem:"Estável", dur:"4",
    tags:["Sociedade","Cultura","Pesquisa"]
  },
  "Design": {
    vec:[3,2,9,2,4,3], area:"artes",
    desc:"Soluções visuais e funcionais para produtos, marcas e interfaces digitais.",
    carreiras:"Designer gráfico, UX/UI designer, diretor de arte.",
    fuvest:{ac:59, ep:52, ppi:43}, notaSISU:"680.90",
    sal:"R$ 3.500–10.000", salMid:6750, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["UI/UX","Visual","Branding"]
  },
  "Direito": {
    vec:[1,4,2,5,7,6], area:"humanas",
    desc:"Leis, justiça, advocacia e regulação da vida em sociedade.",
    carreiras:"Advogado, juiz, promotor, defensor público, consultor jurídico.",
    fuvest:{ac:63, ep:50, ppi:38}, notaSISU:"754.80",
    sal:"R$ 4.000–25.000", salMid:12000, emp:"Alta", empScore:7, dem:"Competitiva", dur:"5",
    tags:["Leis","Justiça","Advocacia"]
  },
  "Economia": {
    vec:[1,7,1,3,7,6], area:"negocios",
    desc:"Produção, distribuição e consumo: análise micro e macroeconômica.",
    carreiras:"Economista, analista de mercado, pesquisador, consultor.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"714.60",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Mercado","Análise","Política Econômica"]
  },
  "Editoração": {
    vec:[1,3,7,2,2,7], area:"artes",
    desc:"Produção editorial: livros, revistas, e-books e publicações digitais.",
    carreiras:"Editor, revisor, diagramador, produtor editorial, gestor de conteúdo.",
    fuvest:{ac:51, ep:41, ppi:28}, notaSISU:"638.70",
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Edição","Publicação","Conteúdo"]
  },
  "Educação Física e Esporte": {
    vec:[8,3,1,7,3,1], area:"saude",
    desc:"Promoção da saúde e desempenho por meio de atividades físicas.",
    carreiras:"Professor, personal trainer, preparador físico, gestor esportivo.",
    fuvest:{ac:41, ep:27, ppi:27}, notaSISU:"634.70",
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Alta", empScore:6, dem:"Estável", dur:"4",
    tags:["Esporte","Saúde","Movimento"]
  },
  "Educomunicação": {
    vec:[1,3,6,8,3,2], area:"humanas",
    desc:"Interface entre educação e comunicação para formação crítica e uso de mídias.",
    carreiras:"Educomunicador, produtor de conteúdo educativo, gestor cultural, professor.",
    fuvest:{ac:35, ep:27, ppi:27}, notaSISU:"622.40", sisuEstimated:true,
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Educação","Mídia","Comunicação"]
  },
  "Enfermagem": {
    vec:[4,5,0,10,2,4], area:"saude",
    desc:"Cuidado integral à saúde humana em diferentes níveis de atenção.",
    carreiras:"Enfermeiro, gestor hospitalar, educador em saúde, pesquisador.",
    fuvest:{ac:44, ep:30, ppi:27}, notaSISU:"682.30",
    sal:"R$ 3.500–9.000", salMid:6250, emp:"Muito Alta", empScore:9, dem:"Crescendo", dur:"5",
    tags:["Cuidado","Hospital","Saúde Coletiva"]
  },
  "Engenharia Aeronáutica": {
    vec:[9,8,1,1,2,5], area:"exatas",
    desc:"Projeto, construção e manutenção de aeronaves e sistemas aeroespaciais.",
    carreiras:"Engenheiro aeronáutico, projetista, analista de sistemas de voo.",
    fuvest:{ac:73, ep:56, ppi:40}, notaSISU:"769.50",
    sal:"R$ 6.000–16.000", salMid:11000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Aviação","Aeroespacial","Projetos"]
  },
  "Engenharia Agronômica": {
    vec:[8,6,0,1,3,4], area:"ambiental",
    desc:"Produção agropecuária sustentável, manejo do solo, irrigação e tecnologia agrícola.",
    carreiras:"Engenheiro agrônomo, consultor rural, pesquisador, gestor de propriedades.",
    fuvest:{ac:46, ep:27, ppi:27}, notaSISU:"689.30",
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Agro","Solo","Sustentabilidade"]
  },
  "Engenharia Ambiental": {
    vec:[7,7,1,3,2,4], area:"ambiental",
    desc:"Soluções tecnológicas para preservação ambiental e sustentabilidade.",
    carreiras:"Engenheiro ambiental, consultor, gestor de recursos naturais.",
    fuvest:{ac:37, ep:27, ppi:27}, notaSISU:"699.10",
    sal:"R$ 4.800–10.000", salMid:7400, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Meio Ambiente","Sustentabilidade","Tecnologia"]
  },
  "Engenharia Bioquímica": {
    vec:[6,8,0,1,2,4], area:"ambiental",
    desc:"Processos bioquímicos industriais para produção de fármacos, alimentos e biocombustíveis.",
    carreiras:"Engenheiro bioquímico, pesquisador, gestor de bioprodutos.",
    fuvest:{ac:46, ep:27, ppi:27}, notaSISU:"712.80", sisuEstimated:true,
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Bioprocessos","Indústria","Pesquisa"]
  },
  "Engenharia Biomédica": {
    vec:[6,8,0,3,2,4], area:"saude",
    desc:"Desenvolvimento de equipamentos, dispositivos e sistemas aplicados à medicina.",
    carreiras:"Engenheiro biomédico, desenvolvedor de dispositivos médicos, pesquisador.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"736.20",
    sal:"R$ 5.500–14.000", salMid:9750, emp:"Alta", empScore:8, dem:"Crescendo", dur:"5",
    tags:["Bioengenharia","Equipamentos","Saúde"]
  },
  "Engenharia Civil": {
    vec:[8,6,2,1,4,5], area:"exatas",
    desc:"Projetos, construção e manutenção de edificações e infraestrutura urbana.",
    carreiras:"Engenheiro civil, projetista, fiscal de obras, gestor de projetos.",
    fuvest:{ac:55, ep:40, ppi:27}, notaSISU:"712.40",
    sal:"R$ 5.000–13.000", salMid:9000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Construção","Infraestrutura","Cálculo"]
  },
  "Engenharia de Alimentos": {
    vec:[6,7,0,1,3,5], area:"ambiental",
    desc:"Processos industriais de produção, conservação e desenvolvimento de alimentos.",
    carreiras:"Engenheiro de alimentos, gerente de produção, analista de qualidade.",
    fuvest:{ac:44, ep:27, ppi:27}, fuvestNaoConferido:true, notaSISU:"672.80",
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Alimentos","Indústria","Processos"]
  },
  "Engenharia de Biossistemas": {
    vec:[7,7,0,2,3,4], area:"ambiental",
    desc:"Engenharia aplicada a sistemas biológicos e ao agronegócio sustentável.",
    carreiras:"Engenheiro de biossistemas, consultor em agronegócio, pesquisador.",
    fuvest:{ac:46, ep:27, ppi:27}, notaSISU:"678.40", sisuEstimated:true,
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Agro","Biossistemas","Sustentabilidade"]
  },
  "Engenharia de Computação": {
    vec:[5,8,1,1,3,5], area:"tecnologia",
    desc:"Hardware, firmware e software integrados em sistemas computacionais completos.",
    carreiras:"Engenheiro de computação, desenvolvedor embarcado, arquiteto de sistemas.",
    fuvest:{ac:65, ep:46, ppi:27}, notaSISU:"745.20",
    sal:"R$ 5.500–18.000", salMid:11750, emp:"Muito Alta", empScore:9, dem:"Crescendo", dur:"5",
    tags:["Hardware","Software","Sistemas Embarcados"]
  },
  "Engenharia de Materiais": {
    vec:[7,8,1,0,2,4], area:"exatas",
    desc:"Desenvolvimento, processamento e aplicação de materiais de alta performance.",
    carreiras:"Engenheiro de materiais, pesquisador, desenvolvedor de produtos.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"689.70",
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Materiais","Inovação","Pesquisa"]
  },
  "Engenharia de Materiais e Manufatura": {
    vec:[8,7,1,0,3,5], area:"exatas",
    desc:"Desenvolvimento de materiais e processos de fabricação industrial de alta performance.",
    carreiras:"Engenheiro de manufatura, desenvolvedor de produtos, consultor industrial.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"692.40", sisuEstimated:true,
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Materiais","Manufatura","Indústria"]
  },
  "Engenharia de Minas": {
    vec:[9,6,0,1,3,4], area:"exatas",
    desc:"Extração, processamento e gerenciamento de recursos minerais.",
    carreiras:"Engenheiro de minas, consultor em mineração, gestor de lavras.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"695.20",
    sal:"R$ 6.000–14.000", salMid:10000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Mineração","Recursos","Extração"]
  },
  "Engenharia de Petróleo": {
    vec:[8,7,0,1,4,4], area:"exatas",
    desc:"Exploração, extração e processamento de petróleo e gás natural.",
    carreiras:"Engenheiro de petróleo, consultor, especialista em reservatórios.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"721.60",
    sal:"R$ 7.000–18.000", salMid:12500, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Petróleo","Gás","Exploração"]
  },
  "Engenharia de Produção": {
    vec:[5,5,1,3,7,7], area:"negocios",
    desc:"Otimização de sistemas produtivos, logística e gestão industrial.",
    carreiras:"Engenheiro de produção, consultor, gestor industrial, supply chain.",
    fuvest:{ac:44, ep:27, ppi:27}, notaSISU:"718.60",
    sal:"R$ 5.500–13.000", salMid:9250, emp:"Alta", empScore:8, dem:"Estável", dur:"5",
    tags:["Produção","Otimização","Logística"]
  },
  "Engenharia Elétrica": {
    vec:[7,8,1,1,3,5], area:"tecnologia",
    desc:"Projeto e desenvolvimento de sistemas elétricos, eletrônicos e de energia.",
    carreiras:"Engenheiro eletricista, projetista, gestor de energia.",
    fuvest:{ac:65, ep:46, ppi:27}, notaSISU:"730.80",
    sal:"R$ 5.500–14.000", salMid:9750, emp:"Alta", empScore:8, dem:"Estável", dur:"5",
    tags:["Eletricidade","Energia","Sistemas"]
  },
  "Engenharia Física": {
    vec:[6,10,1,0,1,4], area:"exatas",
    desc:"Física aplicada ao desenvolvimento tecnológico: fotônica, semicondutores e nanotecnologia.",
    carreiras:"Engenheiro físico, pesquisador em P&D, especialista em nanotecnologia.",
    fuvest:{ac:44, ep:27, ppi:27}, notaSISU:"748.60", sisuEstimated:true,
    sal:"R$ 6.000–16.000", salMid:11000, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Física","Nanotecnologia","P&D"]
  },
  "Engenharia Florestal": {
    vec:[8,6,0,2,2,3], area:"ambiental",
    desc:"Manejo sustentável de florestas, recursos madeireiros e conservação ambiental.",
    carreiras:"Engenheiro florestal, pesquisador, gestor ambiental, consultor.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"649.80",
    sal:"R$ 4.000–9.000", salMid:6500, emp:"Alta", empScore:6, dem:"Estável", dur:"5",
    tags:["Florestas","Manejo","Conservação"]
  },
  "Engenharia Mecânica": {
    vec:[9,7,1,0,3,5], area:"exatas",
    desc:"Projeto, análise e fabricação de sistemas e componentes mecânicos.",
    carreiras:"Engenheiro mecânico, projetista, gestor de manufatura.",
    fuvest:{ac:61, ep:43, ppi:27}, notaSISU:"724.90",
    sal:"R$ 5.500–13.000", salMid:9250, emp:"Alta", empScore:8, dem:"Estável", dur:"5",
    tags:["Mecânica","Projetos","Indústria"]
  },
  "Engenharia Mecatrônica": {
    vec:[8,7,1,0,3,6], area:"tecnologia",
    desc:"Mecânica, eletrônica e computação integradas em sistemas automatizados.",
    carreiras:"Engenheiro mecatrônico, desenvolvedor de robótica, especialista em automação.",
    fuvest:{ac:61, ep:43, ppi:27}, notaSISU:"742.10",
    sal:"R$ 5.500–15.000", salMid:10250, emp:"Alta", empScore:8, dem:"Crescendo", dur:"5",
    tags:["Robótica","Automação","IoT"]
  },
  "Engenharia Metalúrgica": {
    vec:[8,7,0,0,2,4], area:"exatas",
    desc:"Extração, processamento e aplicação de metais e ligas metálicas.",
    carreiras:"Engenheiro metalúrgico, pesquisador de materiais, consultor industrial.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"688.90",
    sal:"R$ 5.500–13.000", salMid:9250, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Metais","Processos","Indústria"]
  },
  "Engenharia Naval": {
    vec:[8,7,1,1,3,4], area:"exatas",
    desc:"Projeto e construção de embarcações, plataformas offshore e sistemas navais.",
    carreiras:"Engenheiro naval, projetista, especialista offshore, consultor marítimo.",
    fuvest:{ac:64, ep:41, ppi:27}, notaSISU:"711.20",
    sal:"R$ 6.000–15.000", salMid:10500, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Naval","Offshore","Projetos"]
  },
  "Engenharia Química": {
    vec:[6,8,0,1,3,5], area:"exatas",
    desc:"Processos químicos industriais e desenvolvimento de novos produtos.",
    carreiras:"Engenheiro químico, gestor de processos, pesquisador, consultor.",
    fuvest:{ac:44, ep:27, ppi:27}, notaSISU:"726.30",
    sal:"R$ 5.500–13.000", salMid:9250, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Química","Processos","Petroquímica"]
  },
  "Estatística": {
    vec:[1,9,0,2,3,7], area:"exatas",
    desc:"Coleta, análise e interpretação de dados para tomada de decisão.",
    carreiras:"Estatístico, analista de dados, cientista de dados, consultor.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"698.40",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Dados","Análise","Probabilidade"]
  },
  "Farmácia": {
    vec:[4,8,0,4,2,5], area:"saude",
    desc:"Desenvolvimento, produção e controle de medicamentos e cosméticos.",
    carreiras:"Farmacêutico, pesquisador, gestor de farmácia hospitalar, analista.",
    fuvest:{ac:54, ep:42, ppi:27}, notaSISU:"712.60",
    sal:"R$ 4.000–10.000", salMid:7000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Medicamentos","Saúde","Laboratório"]
  },
  "Filosofia": {
    vec:[0,9,6,4,2,1], area:"humanas",
    desc:"Reflexão crítica sobre existência, ética, conhecimento e política.",
    carreiras:"Professor, pesquisador, consultor, escritor, redator.",
    fuvest:{ac:41, ep:28, ppi:27}, notaSISU:"591.30",
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Baixa", empScore:3, dem:"Competitiva", dur:"4",
    tags:["Pensamento","Ética","Crítica"]
  },
  "Finanças e Negócios": {
    vec:[1,5,0,2,9,7], area:"negocios",
    desc:"Gestão financeira, mercados de capitais e estratégia empresarial.",
    carreiras:"Analista financeiro, gestor de investimentos, consultor de negócios.",
    fuvest:{ac:51, ep:34, ppi:27}, notaSISU:"682.40",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:8, dem:"Estável", dur:"4",
    tags:["Finanças","Mercado","Investimentos"]
  },
  "Física": {
    vec:[3,10,0,0,0,3], area:"exatas",
    desc:"Leis fundamentais que regem matéria, energia, espaço e tempo.",
    carreiras:"Físico, pesquisador, professor, engenheiro de projetos de alta tecnologia.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"714.20",
    sal:"R$ 6.000–16.000", salMid:11000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Pesquisa","Universo","Fundamentos"]
  },
  "Física Computacional": {
    vec:[3,10,1,0,1,4], area:"tecnologia",
    desc:"Métodos computacionais aplicados à resolução de problemas físicos complexos.",
    carreiras:"Pesquisador, desenvolvedor de simulações, cientista computacional.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"724.80", sisuEstimated:true,
    sal:"R$ 5.500–14.000", salMid:9500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Física","Computação","Simulação"]
  },
  "Física Médica": {
    vec:[4,9,0,4,0,3], area:"saude",
    desc:"Princípios físicos aplicados a diagnóstico, radioterapia e equipamentos médicos.",
    carreiras:"Físico médico, pesquisador, desenvolvedor de equipamentos hospitalares.",
    fuvest:{ac:49, ep:27, ppi:27}, notaSISU:"728.40", sisuEstimated:true,
    sal:"R$ 7.000–16.000", salMid:11500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Física","Medicina","Diagnóstico"]
  },
  "Fisioterapia": {
    vec:[6,5,0,8,2,3], area:"saude",
    desc:"Prevenção e tratamento de disfunções do movimento e reabilitação funcional.",
    carreiras:"Fisioterapeuta, pesquisador, gestor de clínica, professor.",
    fuvest:{ac:57, ep:45, ppi:33}, notaSISU:"694.80",
    sal:"R$ 3.500–9.000", salMid:6250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Reabilitação","Movimento","Saúde"]
  },
  "Fonoaudiologia": {
    vec:[3,5,2,9,1,3], area:"saude",
    desc:"Avaliação e tratamento de distúrbios da comunicação e deglutição.",
    carreiras:"Fonoaudiólogo, pesquisador, professor, consultor em saúde.",
    fuvest:{ac:46, ep:38, ppi:27}, notaSISU:"688.50",
    sal:"R$ 3.500–8.500", salMid:6000, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Fala","Audição","Terapia"]
  },
  "Geociências e Educação Ambiental": {
    vec:[6,7,1,5,1,2], area:"ambiental",
    desc:"Formação em Geociências voltada para educação ambiental e ensino de Ciências da Terra.",
    carreiras:"Professor, educador ambiental, pesquisador, gestor de projetos ambientais.",
    fuvest:{ac:27, ep:27, ppi:27}, notaSISU:"598.60", sisuEstimated:true,
    sal:"R$ 3.000–7.000", salMid:5000, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Geociências","Educação","Ambiente"]
  },
  "Geofísica": {
    vec:[5,9,0,1,1,3], area:"exatas",
    desc:"Estudo da Terra por métodos físicos e matemáticos.",
    carreiras:"Geofísico, pesquisador, consultor em exploração mineral e petróleo.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"680.10",
    sal:"R$ 6.000–14.000", salMid:10000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Terra","Exploração","Física"]
  },
  "Geografia": {
    vec:[4,7,2,5,2,3], area:"humanas",
    desc:"Espaço geográfico, relações sociedade-natureza e planejamento territorial.",
    carreiras:"Geógrafo, professor, planejador territorial, analista ambiental.",
    fuvest:{ac:38, ep:29, ppi:27}, notaSISU:"617.60",
    sal:"R$ 3.200–7.500", salMid:5350, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Território","Espaço","Planejamento"]
  },
  "Geologia": {
    vec:[7,8,0,1,2,3], area:"exatas",
    desc:"Composição, estrutura e história da Terra e seus recursos.",
    carreiras:"Geólogo, consultor em mineração, pesquisador de petróleo.",
    fuvest:{ac:48, ep:27, ppi:27}, notaSISU:"674.30",
    sal:"R$ 6.000–15.000", salMid:10500, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Rochas","Recursos Naturais","Exploração"]
  },
  "Gerontologia": {
    vec:[2,5,0,9,2,3], area:"saude",
    desc:"Estudo do envelhecimento humano e promoção da qualidade de vida do idoso.",
    carreiras:"Gerontólogo, gestor de saúde do idoso, pesquisador, consultor em políticas.",
    fuvest:{ac:49, ep:28, ppi:27}, notaSISU:"634.20", sisuEstimated:true,
    sal:"R$ 3.000–7.500", salMid:5250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Envelhecimento","Saúde","Políticas"]
  },
  "Gestão Ambiental": {
    vec:[4,6,1,3,6,4], area:"ambiental",
    desc:"Planejamento e gestão de recursos naturais com foco em sustentabilidade.",
    carreiras:"Gestor ambiental, consultor, analista de sustentabilidade corporativa.",
    fuvest:{ac:28, ep:27, ppi:27}, notaSISU:"632.80",
    sal:"R$ 3.800–8.500", salMid:6150, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Sustentabilidade","Recursos","Políticas"]
  },
  "Gestão de Políticas Públicas": {
    vec:[1,6,1,6,7,4], area:"humanas",
    desc:"Planejamento, implementação e avaliação de políticas públicas e programas governamentais.",
    carreiras:"Gestor público, analista de políticas, consultor em governo, pesquisador.",
    fuvest:{ac:37, ep:28, ppi:27}, notaSISU:"624.80",
    sal:"R$ 3.500–10.000", salMid:6750, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Governo","Políticas","Gestão"]
  },
  "História": {
    vec:[1,8,5,4,1,2], area:"humanas",
    desc:"Processos históricos, culturas e transformações das sociedades humanas.",
    carreiras:"Historiador, professor, pesquisador, curador, museólogo.",
    fuvest:{ac:48, ep:30, ppi:27}, notaSISU:"619.80",
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Passado","Cultura","Pesquisa"]
  },
  "Informática Biomédica": {
    vec:[3,8,0,3,2,6], area:"tecnologia",
    desc:"Computação aplicada a soluções para saúde, medicina e pesquisa clínica.",
    carreiras:"Analista de sistemas de saúde, pesquisador, desenvolvedor de software médico.",
    fuvest:{ac:41, ep:31, ppi:27}, notaSISU:"712.40", sisuEstimated:true,
    sal:"R$ 5.000–12.000", salMid:8500, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Saúde","TI","Computação"]
  },
  "Jornalismo": {
    vec:[1,5,6,6,4,2], area:"artes",
    desc:"Apuração, produção e disseminação de informações e narrativas jornalísticas.",
    carreiras:"Jornalista, editor, repórter, produtor de conteúdo digital.",
    fuvest:{ac:60, ep:50, ppi:42}, notaSISU:"665.40",
    sal:"R$ 2.800–8.000", salMid:5400, emp:"Média", empScore:5, dem:"Competitiva", dur:"4",
    tags:["Notícias","Mídia","Comunicação"]
  },
  "Lazer e Turismo": {
    vec:[3,2,3,7,6,3], area:"negocios",
    desc:"Planejamento e gestão de atividades de lazer, turismo e hospitalidade.",
    carreiras:"Gestor de turismo, planejador de eventos, consultor em hospitalidade.",
    fuvest:{ac:27, ep:27, ppi:27}, notaSISU:"591.40", sisuEstimated:true,
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Turismo","Lazer","Hospitalidade"]
  },
  "Letras": {
    vec:[0,6,7,5,1,2], area:"humanas",
    desc:"Línguas, literaturas e manifestações culturais do mundo.",
    carreiras:"Professor, tradutor, revisor, pesquisador linguístico, escritor.",
    fuvest:{ac:35, ep:27, ppi:27}, notaSISU:"607.20",
    sal:"R$ 2.800–6.500", salMid:4650, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Línguas","Literatura","Cultura"]
  },
  "Marketing": {
    vec:[1,3,5,3,9,4], area:"negocios",
    desc:"Estratégias de mercado, comunicação e relacionamento com consumidores.",
    carreiras:"Profissional de marketing digital, gestor de marcas, analista de mercado.",
    fuvest:{ac:46, ep:33, ppi:27}, notaSISU:"672.10",
    sal:"R$ 3.500–11.000", salMid:7250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Mercado","Branding","Digital"]
  },
  "Matemática": {
    vec:[1,10,1,0,0,4], area:"exatas",
    desc:"Estruturas abstratas, padrões e relações quantitativas fundamentais.",
    carreiras:"Matemático, professor, pesquisador, analista quantitativo, atuário.",
    fuvest:{ac:29, ep:27, ppi:27}, notaSISU:"692.80",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Números","Lógica","Abstração"]
  },
  "Matemática Aplicada": {
    vec:[2,10,0,0,1,5], area:"exatas",
    desc:"Matemática com foco em aplicações práticas em ciência, tecnologia e economia.",
    carreiras:"Matemático aplicado, pesquisador, analista quantitativo, cientista de dados.",
    fuvest:{ac:45, ep:31, ppi:27}, notaSISU:"718.40",
    sal:"R$ 5.000–14.000", salMid:9500, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Matemática","Aplicações","Modelagem"]
  },
  "Matemática Aplicada a Negócios": {
    vec:[1,8,0,1,6,6], area:"negocios",
    desc:"Matemática e estatística aplicadas à tomada de decisão no mundo dos negócios.",
    carreiras:"Analista quantitativo, cientista de dados, consultor financeiro, atuário.",
    fuvest:{ac:58, ep:43, ppi:27}, notaSISU:"698.20", sisuEstimated:true,
    sal:"R$ 5.500–15.000", salMid:10250, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Matemática","Negócios","Análise"]
  },
  "Matemática Aplicada e Computação Científica": {
    vec:[2,10,0,0,1,6], area:"tecnologia",
    desc:"Algoritmos e modelos computacionais aplicados a ciência e engenharia.",
    carreiras:"Pesquisador, desenvolvedor de algoritmos, cientista computacional.",
    fuvest:{ac:45, ep:31, ppi:27}, notaSISU:"728.60", sisuEstimated:true,
    sal:"R$ 5.500–15.000", salMid:10250, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Matemática","Computação","Ciência"]
  },
  "Matemática Aplicada e Computacional": {
    vec:[3,9,0,0,1,6], area:"tecnologia",
    desc:"Métodos matemáticos e computacionais para modelagem científica e engenharia.",
    carreiras:"Pesquisador, desenvolvedor de algoritmos, cientista computacional.",
    fuvest:{ac:45, ep:31, ppi:27}, notaSISU:"724.60", sisuEstimated:true,
    sal:"R$ 5.500–15.000", salMid:10250, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Matemática","Computação","Modelagem"]
  },
  "Medicina": {
    vec:[4,9,0,8,3,4], area:"saude",
    desc:"Diagnóstico, tratamento e prevenção de doenças. A graduação mais longa e competitiva.",
    carreiras:"Médico generalista, especialista, pesquisador clínico, professor.",
    fuvest:{ac:79, ep:71, ppi:60}, notaSISU:"807.90",
    sal:"R$ 10.000–30.000", salMid:20000, emp:"Muito Alta", empScore:10, dem:"Alta", dur:"6",
    tags:["Medicina","Diagnóstico","Pesquisa Clínica"]
  },
  "Medicina Veterinária": {
    vec:[6,8,0,6,2,4], area:"saude",
    desc:"Saúde animal, clínica, cirurgia e saúde pública veterinária.",
    carreiras:"Médico veterinário, pesquisador, inspetor sanitário, consultor.",
    fuvest:{ac:57, ep:46, ppi:36}, notaSISU:"714.80",
    sal:"R$ 4.000–10.000", salMid:7000, emp:"Alta", empScore:7, dem:"Estável", dur:"5",
    tags:["Animais","Clínica","Saúde Pública"]
  },
  "Meteorologia": {
    vec:[4,9,0,1,1,4], area:"exatas",
    desc:"Atmosfera, clima e previsão do tempo por métodos científicos.",
    carreiras:"Meteorologista, pesquisador climático, analista, consultor.",
    fuvest:{ac:50, ep:27, ppi:27}, notaSISU:"678.90",
    sal:"R$ 5.000–11.000", salMid:8000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Clima","Atmosfera","Previsão"]
  },
  "Música": {
    vec:[1,2,10,3,2,2], area:"artes",
    desc:"Teoria, composição e execução musical em múltiplos gêneros.",
    carreiras:"Músico, compositor, professor, regente, produtor musical.",
    fuvest:{ac:44, ep:27, ppi:27}, notaSISU:"625.40",
    sal:"R$ 2.500–7.000", salMid:4750, emp:"Baixa", empScore:3, dem:"Competitiva", dur:"4",
    tags:["Som","Composição","Performance"]
  },
  "Nutrição": {
    vec:[2,6,0,8,2,4], area:"saude",
    desc:"Alimentação, nutrição clínica e promoção da saúde humana.",
    carreiras:"Nutricionista, pesquisador, consultor alimentar, gestor de UAN.",
    fuvest:{ac:54, ep:45, ppi:34}, notaSISU:"684.20",
    sal:"R$ 3.000–8.000", salMid:5500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Alimentação","Saúde","Clínica"]
  },
  "Nutrição e Metabolismo": {
    vec:[2,8,0,6,1,4], area:"saude",
    desc:"Nutrição clínica avançada com foco em metabolismo e doenças crônicas.",
    carreiras:"Nutricionista clínico, pesquisador em metabolismo, consultor em saúde.",
    fuvest:{ac:54, ep:45, ppi:34}, notaSISU:"698.40", sisuEstimated:true,
    sal:"R$ 3.500–9.000", salMid:6250, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Nutrição","Metabolismo","Saúde"]
  },
  "Obstetrícia": {
    vec:[3,5,0,9,1,3], area:"saude",
    desc:"Cuidado integral à saúde da mulher durante gestação, parto e puerpério.",
    carreiras:"Obstetra, enfermeiro obstetra, pesquisador em saúde materna.",
    fuvest:{ac:41, ep:27, ppi:27}, notaSISU:"694.80", sisuEstimated:true,
    sal:"R$ 4.000–10.000", salMid:7000, emp:"Alta", empScore:8, dem:"Crescendo", dur:"4",
    tags:["Gestação","Saúde da Mulher","Parto"]
  },
  "Oceanografia": {
    vec:[6,8,0,1,1,3], area:"exatas",
    desc:"Oceanos, mares, zonas costeiras e seus ecossistemas.",
    carreiras:"Oceanógrafo, pesquisador, consultor ambiental marinho.",
    fuvest:{ac:44, ep:28, ppi:27}, notaSISU:"659.80",
    sal:"R$ 4.500–10.000", salMid:7250, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Oceanos","Ecossistemas","Pesquisa"]
  },
  "Odontologia": {
    vec:[6,6,1,7,3,4], area:"saude",
    desc:"Prevenção, diagnóstico e tratamento de doenças bucais.",
    carreiras:"Cirurgião-dentista, especialista, pesquisador, professor.",
    fuvest:{ac:50, ep:37, ppi:27}, notaSISU:"754.30",
    sal:"R$ 5.000–18.000", salMid:11500, emp:"Alta", empScore:8, dem:"Estável", dur:"5",
    tags:["Saúde Bucal","Clínica","Cirurgia"]
  },
  "Pedagogia": {
    vec:[1,4,3,10,2,3], area:"humanas",
    desc:"Processos de ensino e aprendizagem em contextos formais e informais.",
    carreiras:"Pedagogo, professor, gestor educacional, orientador escolar.",
    fuvest:{ac:42, ep:27, ppi:27}, notaSISU:"604.60",
    sal:"R$ 2.500–6.000", salMid:4250, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Educação","Ensino","Aprendizagem"]
  },
  "Psicologia": {
    vec:[1,7,2,9,2,2], area:"saude",
    desc:"Comportamento humano, processos mentais e saúde psicológica.",
    carreiras:"Psicólogo clínico, organizacional, escolar, pesquisador.",
    fuvest:{ac:66, ep:56, ppi:48}, notaSISU:"745.60",
    sal:"R$ 3.500–10.000", salMid:6750, emp:"Alta", empScore:7, dem:"Crescendo", dur:"5",
    tags:["Saúde Mental","Comportamento","Terapia"]
  },
  "Publicidade e Propaganda": {
    vec:[1,2,8,3,7,2], area:"artes",
    desc:"Criação e gestão de campanhas publicitárias e comunicação mercadológica.",
    carreiras:"Publicitário, diretor de criação, planejador, gestor de contas.",
    fuvest:{ac:59, ep:49, ppi:42}, notaSISU:"668.40",
    sal:"R$ 3.200–10.000", salMid:6600, emp:"Média", empScore:5, dem:"Competitiva", dur:"4",
    tags:["Publicidade","Criatividade","Mídia"]
  },
  "Química": {
    vec:[4,9,0,1,1,4], area:"exatas",
    desc:"Matéria, suas transformações, propriedades e aplicações industriais.",
    carreiras:"Químico, pesquisador, professor, analista laboratorial.",
    fuvest:{ac:48, ep:31, ppi:27}, notaSISU:"671.40",
    sal:"R$ 4.000–10.000", salMid:7000, emp:"Alta", empScore:7, dem:"Estável", dur:"4",
    tags:["Matéria","Laboratório","Síntese"]
  },
  "Relações Internacionais": {
    vec:[1,7,2,4,7,3], area:"humanas",
    desc:"Relações entre Estados, organizações e atores no cenário global.",
    carreiras:"Diplomata, analista internacional, gestor de projetos globais, consultor.",
    fuvest:{ac:66, ep:55, ppi:45}, notaSISU:"706.80",
    sal:"R$ 4.500–12.000", salMid:8250, emp:"Média", empScore:5, dem:"Competitiva", dur:"4",
    tags:["Diplomacia","Global","Política"]
  },
  "Relações Públicas": {
    vec:[1,2,4,6,7,3], area:"negocios",
    desc:"Gestão da comunicação entre organizações e seus públicos de interesse.",
    carreiras:"Relações públicas, assessor de comunicação, gestor de marca, consultor.",
    fuvest:{ac:50, ep:38, ppi:29}, notaSISU:"638.40",
    sal:"R$ 3.000–8.000", salMid:5500, emp:"Média", empScore:5, dem:"Estável", dur:"4",
    tags:["Comunicação","Marca","Relacionamento"]
  },
  "Saúde Pública": {
    vec:[2,6,0,9,4,4], area:"saude",
    desc:"Promoção, proteção e recuperação da saúde em nível coletivo e populacional.",
    carreiras:"Sanitarista, gestor em saúde, pesquisador, educador em saúde.",
    fuvest:{ac:30, ep:27, ppi:27}, notaSISU:"668.20",
    sal:"R$ 4.000–9.000", salMid:6500, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Saúde Coletiva","Políticas","Prevenção"]
  },
  "Sistemas de Informação": {
    vec:[3,6,1,2,6,7], area:"tecnologia",
    desc:"Gestão e desenvolvimento de sistemas de informação em organizações.",
    carreiras:"Analista de sistemas, gestor de TI, desenvolvedor, consultor.",
    fuvest:{ac:57, ep:48, ppi:32}, notaSISU:"691.50",
    sal:"R$ 5.000–15.000", salMid:10000, emp:"Muito Alta", empScore:9, dem:"Crescendo", dur:"4",
    tags:["Sistemas","TI","Desenvolvimento"]
  },
  "Terapia Ocupacional": {
    vec:[4,4,2,9,1,3], area:"saude",
    desc:"Atividades terapêuticas para reabilitação, inclusão e promoção de autonomia.",
    carreiras:"Terapeuta ocupacional, pesquisador, gestor em saúde.",
    fuvest:{ac:48, ep:39, ppi:28}, notaSISU:"661.40",
    sal:"R$ 3.200–7.500", salMid:5350, emp:"Alta", empScore:7, dem:"Crescendo", dur:"4",
    tags:["Reabilitação","Inclusão","Autonomia"]
  },
  "Têxtil e Moda": {
    vec:[3,2,9,2,5,3], area:"artes",
    desc:"Criação, produção e gestão no universo têxtil, de moda e vestuário.",
    carreiras:"Estilista, gestor de produção têxtil, consultor de moda.",
    fuvest:{ac:51, ep:42, ppi:33}, notaSISU:"621.80",
    sal:"R$ 2.800–7.000", salMid:4900, emp:"Média", empScore:4, dem:"Competitiva", dur:"4",
    tags:["Moda","Design","Têxtil"]
  },
  "Turismo": {
    vec:[2,2,3,6,7,3], area:"negocios",
    desc:"Planejamento turístico, gestão de destinos e desenvolvimento do setor de viagens.",
    carreiras:"Gestor de turismo, consultor, planejador de destinos, gestor de eventos.",
    fuvest:{ac:27, ep:27, ppi:27}, notaSISU:"598.40",
    sal:"R$ 2.800–7.500", salMid:5150, emp:"Média", empScore:5, dem:"Crescendo", dur:"4",
    tags:["Turismo","Destinos","Eventos"]
  },
  "Zootecnia": {
    vec:[7,6,0,3,3,3], area:"ambiental",
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
const COURSE_EXTRAS = {
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
