# Lista de tarefas

Projeto pessoal com React que uso para praticar o básico de uma interface: entrada de dados, estado, renderização de listas e persistência local.

A primeira versão tinha apenas quatro ações. Depois, acrescentei filtros, pesquisa, um resumo do que ainda está pendente e testes das regras de tarefas. O objetivo continua sendo manter o código legível, inclusive para eu conseguir explicar cada decisão.

## O que faz

- Adiciona, edita, conclui e exclui tarefas.
- Filtra entre todas, pendentes e concluídas.
- Pesquisa tarefas pelo texto.
- Mostra totais e permite limpar as concluídas.
- Salva os dados no navegador para continuar depois de atualizar a página.

Não há cadastro, servidor ou sincronização. Os dados ficam no `localStorage` daquele navegador. Se os dados do site forem apagados, a lista também será perdida.

## Rodar no computador

Requer Node.js compatível com a versão do Vite informada em `package.json` e npm.

```bash
git clone https://github.com/Osacul1/lista-de-tarefas.git
cd lista-de-tarefas
npm ci
npm run dev
```

O Vite imprime no terminal o endereço local da aplicação.

## Verificar

```bash
npm run lint
npm test
npm run build
```

O comando `npm test` executa testes das funções de criação, edição, recuperação e filtragem em `src/tasks.js`. O fluxo completo da interface ainda precisa de testes de ponta a ponta e validação manual em diferentes navegadores.

O repositório também inclui uma rotina do GitHub Actions que roda lint, testes e build quando há mudanças na branch principal.

## Estrutura

- `src/App.jsx` — interface e interação com o usuário.
- `src/App.css` e `src/index.css` — layout e estilos.
- `src/tasks.js` — regras de tratamento dos dados e filtros.
- `src/tasks.test.js` — testes dessas regras.

## O que quero melhorar

- Testes da interface e do uso com teclado.
- Exportação e importação das tarefas, sem exigir servidor.
- Validação da experiência em telas pequenas.

**Tecnologias:** React, JavaScript, CSS e Vite.

---

Lucas Rodrigues de Resende · Estudante de Engenharia de Software em Criciúma/SC  
[Meu perfil](https://github.com/Osacul1) · [LinkedIn](https://www.linkedin.com/in/lucas-resende-404ba2320)
