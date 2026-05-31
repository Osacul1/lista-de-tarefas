import { useState } from "react";
import "./App.css";

function App() {
  const [tarefas, setTarefas] = useState([]);
  const [texto, setTexto] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [textoEdicao, setTextoEdicao] = useState("");

  function adicionarTarefa() {
    if (!texto.trim()) return;
    setTarefas([...tarefas, { id: Date.now(), texto, concluida: false }]);
    setTexto("");
  }

  function deletarTarefa(id) {
    setTarefas(tarefas.filter((t) => t.id !== id));
  }

  function toggleConcluida(id) {
    setTarefas(tarefas.map((t) => t.id === id ? { ...t, concluida: !t.concluida } : t));
  }

  function iniciarEdicao(tarefa) {
    setEditandoId(tarefa.id);
    setTextoEdicao(tarefa.texto);
  }

  function salvarEdicao(id) {
    setTarefas(tarefas.map((t) => t.id === id ? { ...t, texto: textoEdicao } : t));
    setEditandoId(null);
  }

  return (
    <div className="container">
      <h1>📝 Lista de Tarefas</h1>

      <div className="input-area">
        <input
          type="text"
          placeholder="Digite uma tarefa..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionarTarefa()}
        />
        <button onClick={adicionarTarefa}>Adicionar</button>
      </div>

      {tarefas.length === 0 && (
        <p className="vazia">Nenhuma tarefa ainda. Adicione uma! 🚀</p>
      )}

      <ul>
        {tarefas.map((tarefa) => (
          <li key={tarefa.id} className={tarefa.concluida ? "concluida" : ""}>
            {editandoId === tarefa.id ? (
              <>
                <input
                  className="input-edicao"
                  value={textoEdicao}
                  onChange={(e) => setTextoEdicao(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && salvarEdicao(tarefa.id)}
                />
                <button className="btn-salvar" onClick={() => salvarEdicao(tarefa.id)}>Salvar</button>
              </>
            ) : (
              <>
                <span onClick={() => toggleConcluida(tarefa.id)}>{tarefa.texto}</span>
                <div className="acoes">
                  <button className="btn-editar" onClick={() => iniciarEdicao(tarefa)}>✏️</button>
                  <button className="btn-deletar" onClick={() => deletarTarefa(tarefa.id)}>🗑️</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;