import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "lucas-lista-tarefas-v1";

function carregarTarefas() {
  try {
    const salvas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(salvas) ? salvas.filter(
      (item) => item && typeof item.id === "string" && typeof item.texto === "string"
    ) : [];
  } catch {
    return [];
  }
}

function App() {
  const [tarefas, setTarefas] = useState(carregarTarefas);
  const [texto, setTexto] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [textoEdicao, setTextoEdicao] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
    } catch {
      // O app continua utilizável se o armazenamento estiver indisponível.
    }
  }, [tarefas]);

  function adicionarTarefa(evento) {
    evento.preventDefault();
    const valor = texto.trim();
    if (!valor) return;
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    setTarefas((atuais) => [...atuais, { id, texto: valor, concluida: false }]);
    setTexto("");
  }

  function deletarTarefa(id) {
    setTarefas((atuais) => atuais.filter((tarefa) => tarefa.id !== id));
    if (editandoId === id) setEditandoId(null);
  }

  function alternarConclusao(id) {
    setTarefas((atuais) => atuais.map((tarefa) =>
      tarefa.id === id ? { ...tarefa, concluida: !tarefa.concluida } : tarefa
    ));
  }

  function iniciarEdicao(tarefa) {
    setEditandoId(tarefa.id);
    setTextoEdicao(tarefa.texto);
  }

  function salvarEdicao(id) {
    const valor = textoEdicao.trim();
    if (!valor) return;
    setTarefas((atuais) => atuais.map((tarefa) =>
      tarefa.id === id ? { ...tarefa, texto: valor } : tarefa
    ));
    setEditandoId(null);
  }

  return (
    <main className="container">
      <h1>Lista de tarefas</h1>
      <p className="intro">Uma lista simples para organizar o dia.</p>

      <form className="input-area" onSubmit={adicionarTarefa}>
        <label className="sr-only" htmlFor="nova-tarefa">Nova tarefa</label>
        <input
          id="nova-tarefa"
          type="text"
          placeholder="O que precisa ser feito?"
          value={texto}
          maxLength={180}
          onChange={(evento) => setTexto(evento.target.value)}
        />
        <button type="submit">Adicionar</button>
      </form>

      {tarefas.length === 0 ? (
        <p className="vazia">Nenhuma tarefa por enquanto.</p>
      ) : (
        <ul>
          {tarefas.map((tarefa) => (
            <li key={tarefa.id} className={tarefa.concluida ? "concluida" : ""}>
              {editandoId === tarefa.id ? (
                <>
                  <label className="sr-only" htmlFor={`editar-${tarefa.id}`}>Editar tarefa</label>
                  <input
                    id={`editar-${tarefa.id}`}
                    className="input-edicao"
                    value={textoEdicao}
                    maxLength={180}
                    onChange={(evento) => setTextoEdicao(evento.target.value)}
                    onKeyDown={(evento) => {
                      if (evento.key === "Enter") salvarEdicao(tarefa.id);
                      if (evento.key === "Escape") setEditandoId(null);
                    }}
                  />
                  <button type="button" className="btn-salvar" onClick={() => salvarEdicao(tarefa.id)}>Salvar</button>
                </>
              ) : (
                <>
                  <label className="tarefa-texto">
                    <input
                      type="checkbox"
                      checked={Boolean(tarefa.concluida)}
                      onChange={() => alternarConclusao(tarefa.id)}
                    />
                    <span>{tarefa.texto}</span>
                  </label>
                  <div className="acoes">
                    <button type="button" className="btn-editar" aria-label={`Editar ${tarefa.texto}`} onClick={() => iniciarEdicao(tarefa)}>Editar</button>
                    <button type="button" className="btn-deletar" aria-label={`Excluir ${tarefa.texto}`} onClick={() => deletarTarefa(tarefa.id)}>Excluir</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="nota">As tarefas são salvas apenas neste navegador.</p>
    </main>
  );
}

export default App;
