# Lista de tarefas

Um projeto de prática com React. Fiz esta aplicação para exercitar componentes, estado, eventos e manipulação de listas — coisas que estou aprendendo no curso de Engenharia de Software.

A proposta é simples: abrir a página e organizar algumas tarefas, sem conta ou configuração complicada.

## Funcionalidades

- Criar, editar e excluir tarefas.
- Marcar uma tarefa como concluída.
- Guardar a lista no navegador, mesmo depois de atualizar a página.
- Layout que se adapta a telas menores.

As tarefas ficam no `localStorage` **deste navegador**. Não há sincronização entre dispositivos nem banco de dados.

## Rodar localmente

Requer Node.js e npm.

```bash
git clone https://github.com/Osacul1/lista-de-tarefas.git
cd lista-de-tarefas
npm install
npm run dev
```

O Vite mostra no terminal o endereço de acesso (geralmente `http://localhost:5173`).

Para conferir o código:

```bash
npm run lint
npm run build
```

## Tecnologias

React, JavaScript, CSS e Vite.

## Próximos ajustes

- Filtros para separar tarefas pendentes e concluídas.
- Melhorias de acessibilidade e navegação pelo teclado.
- Testes automatizados para as principais ações.

É um projeto pequeno de aprendizado, não um gerenciador de tarefas completo. Prefiro evoluir cada parte e entender como ela funciona.

---

Lucas Rodrigues de Resende · Criciúma/SC  
[LinkedIn](https://www.linkedin.com/in/lucas-resende-404ba2320)
