# UniMatch

Plataforma gratuita de orientação vocacional para estudantes de escolas públicas.
Projeto do grupo Integra.

## O que é

Um site (pensado primeiro para o celular) com:

- **Quiz** de 29 perguntas (24 afirmações sobre interesses + 5 de contexto) que
  separa os cursos da USP em faixas de compatibilidade, usando o modelo RIASEC de
  John Holland. A fórmula está explicada no topo de `js/scoring.js`.
- **Explorar cursos**: busca (ignora acentos), filtro por área, por nota de corte da
  FUVEST (Ampla, Escola Pública ou PPI), por salário médio e ordenação.
- **Página de cada curso**: o que é, carreiras, mercado e salário, como ingressar
  (FUVEST por modalidade, SISU, Provão Paulista, vagas olímpicas), onde estudar,
  pessoas famosas que estudaram aquilo e veteranos/mentorias.
- **Resultados**: link compartilhável, envio por e-mail e seção "Fale com um veterano".
- Favoritos, tema claro/escuro e navegação acessível por teclado e leitor de tela.

## Motivação

Estudantes de escolas públicas frequentemente chegam ao ENEM sem informação
suficiente sobre qual curso escolher. O UniMatch busca preencher essa lacuna
de forma gratuita, acessível e baseada em dados.

## Estrutura dos arquivos

| Arquivo | O que tem | Quem mexe |
|---|---|---|
| `data.js` | Perguntas, cursos, veteranos, mentorias, contato | Equipe de dados (não precisa programar) |
| `index.html` | Esqueleto da página | Dev |
| `css/styles.css` | Visual (cores, layout) | Design / dev |
| `js/scoring.js` | Fórmula do quiz (sem interface) | Modelagem / dev |
| `js/app.js` | Telas e navegação | Dev |
| `validate-data.js` | Confere se `data.js` está consistente | — |
| `tests/` | Testes automáticos | — |

## Como rodar no computador

Não precisa instalar nada além de um navegador. Como o site carrega arquivos
separados, abra por um servidor local (dentro da pasta do projeto):

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

## Como testar (precisa de Node 18+)

```bash
node validate-data.js                 # confere a estrutura do data.js
node --test tests/scoring-test.js     # testes da lógica do quiz
node tests/coverage-test.js           # todo curso consegue ser o 1º para algum perfil?
```

Esses três rodam sozinhos no GitHub a cada push (`.github/workflows/testes.yml`).

## Como publicar de graça

O site é só HTML/CSS/JS, então dá para hospedar no **GitHub Pages**:
Settings → Pages → "Deploy from a branch" → `main` / pasta raiz.

## Como contribuir

O projeto está aberto a colaboradores de qualquer curso.
Não é necessário saber programar para contribuir: a maior parte do trabalho
pendente é levantar dados com fonte (veja `PROPOSTA.md`).

Áreas de necessidade:
- Desenvolvimento do site
- Modelagem estatística e vocacional
- Levantamento e curadoria de dados dos cursos
- Design e experiência do usuário
- Comunicação e parcerias
- Aspectos jurídicos e LGPD

Contato: gabrielcrod14@gmail.com

## Licença

MIT License — veja o arquivo LICENSE para detalhes.
