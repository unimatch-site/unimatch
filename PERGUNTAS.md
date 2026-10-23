# Proposta: novo quiz do UniMatch

## A ideia em uma frase

Trocar as 6 perguntas de escolha única por **24 afirmações curtas** que o aluno avalia
numa escala de 5 emojis, e reescrever as perguntas de contexto (matemática, tecnologia,
salário) para que meçam o que dizem medir. São cerca de 30 telas, que levam 4 a 5 minutos no celular.

## Por que mudar

| Hoje | Problema | Proposta |
|---|---|---|
| 6 perguntas, uma letra RIASEC por resposta | O aluno não consegue dizer "gosto das duas coisas"; uma resposta muda o ranking inteiro | 4 afirmações por letra, cada uma com nota de 1 a 5 |
| "Tecnologia" usa o traço Investigativo | Ciências da Computação fica em 12º para quem quer "criar tecnologia" | Comparar com um dado do curso: quanto ele usa programação |
| "Matemática" usa Investigativo + Convencional | É só uma aproximação | Comparar com um dado do curso: quanto ele exige de matemática |
| Salário em faixas que não batem com o código | "Não é prioridade" puxa cursos que pagam pouco | Perguntar **quanto o salário pesa**: se o aluno disser "nada", o salário não muda o ranking |

## Parte 1: perfil de interesses (24 afirmações)

**Pergunta fixa:** "Quanto você gostaria de fazer isso?"
**Escala:** 😣 Detesto · 🙁 Não gosto · 😐 Tanto faz · 🙂 Gosto · 😍 Adoro

As afirmações descrevem **atividades do dia a dia**, e não profissões. Assim o aluno não
precisa saber o que um engenheiro ou um sanitarista faz para responder. Na tela, elas
aparecem **misturadas** (não em blocos por letra), para o aluno não perceber o padrão.

### R — Realista (prático, mão na massa)
1. Consertar algo quebrado em casa: uma tomada, uma bicicleta, um celular.
2. Trabalhar ao ar livre, com plantas, animais ou na natureza.
3. Montar algo seguindo um projeto: um móvel, uma maquete, um circuito.
4. Usar ferramentas, máquinas ou equipamentos.

### I — Investigativo (curioso, analítico)
5. Descobrir por que algo acontece: como o corpo funciona, por que chove.
6. Fazer experimentos para testar se uma ideia está certa.
7. Resolver um problema difícil de lógica ou de matemática.
8. Assistir a vídeos ou ler sobre ciência só por curiosidade.

### A — Artístico (criativo, expressivo)
9. Desenhar, pintar, fotografar ou editar vídeos.
10. Escrever histórias, poemas ou letras de música.
11. Tocar um instrumento, cantar, dançar ou atuar.
12. Inventar um jeito novo e original de fazer alguma coisa.

### S — Social (empático, gosta de ajudar)
13. Explicar a matéria para um colega com dificuldade.
14. Ouvir um amigo com problemas e ajudar a pensar numa saída.
15. Cuidar de pessoas: crianças, idosos ou alguém doente.
16. Participar de trabalho voluntário ou de projetos no seu bairro.

### E — Empreendedor (persuasivo, líder)
17. Convencer as pessoas de uma ideia num debate.
18. Liderar um grupo ou organizar um evento (festa, campeonato, grêmio).
19. Vender coisas ou ter um negócio próprio.
20. Tomar uma decisão importante, mesmo com risco de dar errado.

### C — Convencional (organizado, detalhista)
21. Organizar materiais, arquivos ou listas para tudo ficar no lugar certo.
22. Controlar dinheiro: anotar gastos, fazer as contas do mês.
23. Conferir um trabalho com atenção para achar erros pequenos.
24. Montar planilhas e tabelas no computador.

**Como vira o perfil:** a nota de cada letra é a média das suas 4 afirmações. O vetor
do aluno é comparado com o vetor de cada curso pela mesma similaridade de cosseno de hoje.
Antes da comparação, subtrai-se a média do próprio aluno, para que quem marcou "Gosto" em tudo
também tenha um perfil com forma definida.

## Parte 2: contexto (6 perguntas)

**25. Quais áreas te interessam?** (pode marcar várias)
Mantém as 7 áreas e o "Ainda não sei". Proposta de mudança: em vez de **esconder** os cursos de outras
áreas, dar um bônus forte às áreas marcadas. Assim, um curso muito compatível de outra área ainda
pode aparecer, mais abaixo. *(Vale discutir: hoje é filtro rígido.)*

**26. Como você se sente com matemática?**
😍 Adoro · 🙂 Me viro bem · 😐 Só o básico · 😣 Prefiro evitar
→ comparada com um campo novo do curso, `matematica` (0 a 3).

**27. Você gostaria que computador e programação fossem parte central do seu trabalho?**
Sim, quero criar tecnologia · Quero usar bastante · Só o normal · Prefiro longe disso
→ comparada com um campo novo do curso, `tecnologia` (0 a 3).

**28. Quanto tempo de faculdade você topa?**
Até 4 anos · Até 5 anos · 6 anos ou mais, se valer a pena (igual a hoje)

**29. Quanto o salário pesa na sua escolha?**
Muito, é prioridade · Bastante · Um pouco · Nada, quero fazer o que gosto
→ vira o **peso** do salário médio do curso na nota. "Nada" = salário não interfere.

**30. Você vai precisar trabalhar enquanto estuda?** *(depende de dado novo)*
Sim · Talvez · Não
→ se "Sim", destaca cursos com **turno noturno**. Precisa de um campo novo, `noturno: true/false`,
levantado pela equipe. Até lá, a pergunta não entra.

## Parte 3: como mostrar o resultado

- Trocar "81%" por **faixas**: 🟢 Muito compatível · 🟡 Compatível · ⚪ Pode explorar.
  Cursos com nota quase igual ficam na mesma faixa, o que é mais honesto do que 81% contra 80%.
- Mostrar o **perfil do aluno** com as 6 barras e uma frase sobre cada uma das 2 letras mais fortes.
- No fim: botão anônimo **"Esse resultado fez sentido pra você? 👍 👎"**, para medir se o quiz acerta.

## Dados novos que o quiz vai precisar

| Campo | O que é | Quem preenche |
|---|---|---|
| `matematica` (0–3) | Quanto o curso exige de matemática | Equipe; eu posso sugerir um rascunho, marcado como "a revisar" |
| `tecnologia` (0–3) | Quanto o curso usa programação/computação | Idem |
| `noturno` (sim/não) | Se a USP oferece turno noturno | Equipe, com fonte (Júpiter/FUVEST) |

## Avisos importantes

- As 24 afirmações foram **escritas por mim**, inspiradas no modelo RIASEC. Não são um teste
  validado. Antes de divulgar amplamente, vale pedir para alguém da área de Psicologia revisar.
- O tempo de 4 a 5 minutos é uma estimativa minha. Dá para medir de verdade com o próprio site.
- Se 30 telas parecer muito, há uma versão curta possível com 3 afirmações por letra (18 + 5 = 23 telas).
