# Lista de tarefas

Meu projeto de estudo com React. Comecei com adicionar, editar, concluir e excluir tarefas; depois fui acrescentando recursos para usar a lista no dia a dia e entender melhor como uma interface funciona.

O foco é praticar estado, formulários, organização do código e tratamento de erros. Ainda estou no começo com React e Node.js: uso Node e npm para rodar o ambiente e os testes, sem backend neste projeto.

## Experimentar

[Abrir a lista no navegador](https://osacul1.github.io/lista-de-tarefas/)

Funciona em celular e computador, sem cadastro. As tarefas ficam no armazenamento local do navegador. Não há sincronização entre aparelhos ou abas abertas; cada aba mantém sua própria sessão, e a última alteração salva pode substituir a de outra aba.

## O que dá para fazer

- Criar, editar, concluir e excluir tarefas.
- Buscar por texto, inclusive sem digitar acentos, e filtrar por estado.
- Acompanhar quantas tarefas foram concluídas.
- Limpar as concluídas e desfazer a última exclusão ou limpeza durante a sessão.
- Exportar a lista em JSON e conferir um backup antes de importar.

A importação **acrescenta** tarefas. Ela mantém as existentes, ignora cópias idênticas e preserva versões diferentes quando um identificador coincide. Arquivos inválidos são rejeitados por inteiro. O limite é de 2.000 tarefas, com até 180 caracteres cada, e arquivos de até 1 MB.

Se o navegador bloquear o armazenamento ou ficar sem espaço, o app avisa. Nesse caso, a lista continua na aba, mas é preciso exportar um backup antes de sair. Abrir a página não sobrescreve dados que não puderam ser lidos.

**Antes de limpar os dados do navegador ou trocar de celular, exporte um backup.** O botão de desfazer mantém apenas a última exclusão e não sobrevive ao fechamento ou à atualização da página.

## Rodar localmente

Use Node.js 24 ou superior e npm.

```bash
git clone https://github.com/Osacul1/lista-de-tarefas.git
cd lista-de-tarefas
npm ci
npm run dev
```

Abra o endereço que o Vite mostrar no terminal. O projeto usa a base `/lista-de-tarefas/` para funcionar no GitHub Pages.

## Verificações

```bash
npm run lint
npm test
npm run build
```

Para os testes da interface:

```bash
npx playwright install chromium
npm run test:e2e
```

| Verificação | O que cobre |
| --- | --- |
| 11 testes com `node:test` | Criação e edição, filtros, dados inválidos, falhas de armazenamento, backup, conflitos de IDs e recuperação de exclusões. |
| 8 cenários Playwright, em duas configurações | Criar/editar/concluir, persistência, importação/exportação, cancelamento, armazenamento bloqueado, dados danificados, teclado e texto longo. |
| ESLint e build do Vite | Problemas estáticos de código e geração da aplicação. |

O Playwright usa Chromium em um tamanho de desktop e outro com emulação de Pixel 7. Emulação não substitui testar em um Samsung real. Firefox, Safari e sincronização entre abas ainda não têm cobertura.

O GitHub Actions executa lint, testes e build. A demonstração é publicada após uma verificação bem-sucedida da branch principal.

## Como organizei

- `src/App.jsx`: interface, formulários e ações da lista.
- `src/tasks.js`: validação, busca, backup e regras das tarefas.
- `src/tasks.test.js`: testes dessas regras, sem dependências extras de teste.
- `tests/tasks.spec.js`: cenários da interface com Playwright.
- `src/App.css` e `src/index.css`: layout responsivo, contraste e foco de teclado.
- `.github/workflows/`: verificação e publicação no GitHub Pages.

Escolhi `localStorage` para manter o projeto pequeno e sem servidor. Separei as regras da interface para conseguir testá-las sem abrir o navegador. A importação soma os dados em vez de substituir a lista para reduzir o risco de perder uma tarefa já editada.

## Próximos passos de estudo

- Melhorar a organização dos componentes conforme a interface crescer.
- Estudar tratamento de conflitos entre abas.
- Validar acessibilidade com leitor de tela e testar em Android real.

**Tecnologias em prática:** React, JavaScript, CSS e Vite. Node.js/npm como ferramentas de desenvolvimento; Playwright e GitHub Actions para verificação.

[Lucas Resende](https://github.com/Osacul1) · Estudante de Engenharia de Software, Criciúma/SC · [LinkedIn](https://www.linkedin.com/in/lucas-resende-404ba2320)
