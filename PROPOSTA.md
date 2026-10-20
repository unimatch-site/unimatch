# UniMatch — o que mudou e próximos passos

## O que foi feito nesta versão

### Bugs corrigidos
1. **Link compartilhado quebrava** quando o aluno marcava áreas de interesse: a lista
   de áreas virava texto ao ser codificada e a página de resultados dava erro ao abrir.
   O link novo (`#/resultado/...`) é validado e testado.
2. **"Mínima" afinidade com matemática era tratada como "média"** (`0 || 5` em
   JavaScript dá 5). O teste de cobertura usava 0, ou seja, o teste e o site
   calculavam coisas diferentes. Agora os dois usam o mesmo arquivo (`js/scoring.js`).
3. **Ajuste de nota SISU por região removido.** Os multiplicadores não tinham fonte, e
   a nota de corte de uma universidade não muda conforme a região de quem se
   inscreve. O texto do site ainda dizia "com base no percentil regional do SISU
   2024", o que não era verdade.
4. Textos que diziam "SISU 2024 real" foram trocados: o próprio `data.js` registra
   que SISU e salários ainda não foram conferidos. O site agora diz claramente o que
   foi conferido (FUVEST) e o que não foi.

### Seguindo o rascunho
- Home com logo grande, slogan, 2 botões e rodapé (Sobre + Suporte/Contato).
- Explorar: busca sem acento, filtro por área, nota de corte (por modalidade),
  salário, ordenação, favoritos e "Cursos em alta".
- Página própria para cada curso, com endereço compartilhável (`#/curso/estatistica`).
- Quiz com barra "Pergunta X de 11" e avanço automático nas perguntas de escolha única.
- Resultados com barra de 0–100%, "Enviar para meu e-mail" e "Fale com um veterano"
  (aparece só para os 5 cursos com mais match).
- Celular primeiro: navegação fixa embaixo (fácil de alcançar com o polegar), botões
  de pelo menos 44px, sem rolagem lateral. Tema claro/escuro segue o do celular.

## O que depende da equipe (não dá para resolver só com código)

| Item do rascunho | Situação | O que falta |
|---|---|---|
| Provão Paulista por curso | Estrutura pronta (`COURSE_EXTRAS`) | Levantar os dados com fonte |
| Vagas olímpicas | Estrutura pronta | Levantar na USP/Unicamp, com fonte |
| Onde estudar (outras públicas) | Estrutura pronta | Levantar a lista |
| Pessoas notáveis | Estrutura pronta | Só com fonte verificável |
| Veteranos | Estrutura pronta (`VETERANS`) | Recrutar, com autorização por escrito (LGPD) |
| Rodas de conversa | Estrutura pronta (`MENTORIAS`) | Agendar e cadastrar os links |
| Notas SISU | Exibidas como "não conferido" | Registrar de qual federal veio cada nota e atualizar para o SISU mais recente |
| Salários | Exibidos como "não conferido" | Conferir com CAGED/RAIS ou outra fonte, registrando a fonte |
| Vetores RIASEC dos cursos | Funcionam e foram testados | Revisão por alguém de Psicologia |

## Decisões que preciso de vocês

1. **Formulário de contato e de mentores.** O rascunho pede um formulário "no próprio
   site, sem expor e-mails". Um site estático (como o GitHub Pages) não envia e-mail
   sozinho. Opções:
   - **Google Forms** (grátis, mais simples): basta colocar o link em
     `SITE_CONFIG.formularioContato` e no campo `formulario` de cada veterano.
     **É o que eu recomendo para começar.**
   - Um serviço de formulários de terceiros ou um backend próprio: mais trabalho, e
     dados pessoais passam a ficar com a equipe (exige cuidado com a LGPD).
2. **"Enviar meus resultados por e-mail"** hoje abre o app de e-mail do aluno com o
   texto pronto, sem guardar nada. Envio automático exigiria um servidor e guardar
   e-mails de menores de idade: recomendo não fazer por enquanto.
3. **Outras universidades além da USP** (Unicamp, Unesp, federais): mudaria bastante
   a base de dados. Vale decidir se entra no escopo antes de levantar os dados.
4. **E-mail oficial do projeto**: o contato hoje é um e-mail pessoal da USP. Um e-mail
   do projeto evita depender de uma pessoa só.

## Ideias minhas para depois

- **Quiz com 15 perguntas**: hoje cada letra RIASEC tem só 6 perguntas de escolha
  única. Perguntas em escala ("concordo / discordo") deixam o perfil mais estável.
  Vale validar com alguém de Psicologia antes.
- **"Comparar cursos"** lado a lado (nota, salário, duração).
- **Funcionar offline (PWA)**: muitos alunos têm pouco pacote de dados. O site já é
  leve (sem framework), mas daria para salvar no celular como um app.
- **Medir uso sem coletar dados pessoais** (ex.: Plausible ou GoatCounter) para saber
  quantos alunos terminam o quiz.
