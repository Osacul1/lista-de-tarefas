import { useEffect, useMemo, useState } from 'react'
import { createTask, readTasks, STORAGE_KEY, updateTask, visibleTasks } from './tasks'
import './App.css'

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function App() {
  const [tasks, setTasks] = useState(() => readTasks(window.localStorage))
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('todas')
  const [editing, setEditing] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) } catch { /* modo privado ou armazenamento cheio */ }
  }, [tasks])

  const done = tasks.filter(task => task.concluida).length
  const pending = tasks.length - done
  const filtered = useMemo(() => visibleTasks(tasks, filter, query), [tasks, filter, query])

  function add(event) {
    event.preventDefault()
    const task = createTask(draft, newId())
    if (!task) return
    setTasks(current => [...current, task])
    setDraft('')
  }

  function toggle(id) {
    setTasks(current => current.map(task => task.id === id ? { ...task, concluida: !task.concluida } : task))
  }

  function remove(id) {
    setTasks(current => current.filter(task => task.id !== id))
    if (editing === id) setEditing(null)
  }

  function beginEdit(task) {
    setEditing(task.id)
    setEditDraft(task.texto)
  }

  function saveEdit(event) {
    event.preventDefault()
    if (!editDraft.trim()) return
    setTasks(current => updateTask(current, editing, editDraft))
    setEditing(null)
  }

  return (
    <main className="workspace">
      <header className="heading">
        <div>
          <p className="eyebrow">ORGANIZAÇÃO PESSOAL</p>
          <h1>Minhas tarefas<span className="period">.</span></h1>
          <p className="subtitle">O que precisa sair do papel hoje?</p>
        </div>
        <span className="local-badge" title="Sem conta ou sincronização">Salvo neste dispositivo</span>
      </header>

      <section className="overview" aria-label="Resumo das tarefas">
        <div className="metric"><span>Total</span><strong>{tasks.length}</strong></div>
        <div className="metric"><span>Pendentes</span><strong>{pending}</strong></div>
        <div className="metric"><span>Concluídas</span><strong>{done}</strong></div>
      </section>

      <section className="task-panel" aria-label="Gerenciar tarefas">
        <form className="add-form" onSubmit={add}>
          <label htmlFor="task-input">Nova tarefa</label>
          <div className="input-row">
            <input id="task-input" placeholder="Ex.: estudar redes por 15 minutos" value={draft} maxLength={180} onChange={event => setDraft(event.target.value)} />
            <button className="primary-button" type="submit" disabled={!draft.trim()}>Adicionar</button>
          </div>
        </form>

        <div className="tools">
          <div className="filters" role="group" aria-label="Filtrar tarefas">
            {[
              ['todas', 'Todas'],
              ['pendentes', 'Pendentes'],
              ['concluidas', 'Concluídas'],
            ].map(([value, label]) => (
              <button type="button" key={value} className={filter === value ? 'filter active' : 'filter'} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
          <label className="search-label">
            <span className="sr-only">Pesquisar tarefas</span>
            <input type="search" placeholder="Buscar tarefa" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <h2>{tasks.length === 0 ? 'Sua lista começa aqui.' : 'Nenhuma tarefa encontrada.'}</h2>
            <p>{tasks.length === 0 ? 'Adicione a primeira tarefa acima. Pode ser algo pequeno.' : 'Experimente mudar a busca ou o filtro.'}</p>
          </div>
        ) : (
          <ul className="task-list">
            {filtered.map(task => (
              <li key={task.id} className={task.concluida ? 'task completed' : 'task'}>
                {editing === task.id ? (
                  <form className="edit-form" onSubmit={saveEdit}>
                    <label className="sr-only" htmlFor={`edit-${task.id}`}>Editar tarefa</label>
                    <input id={`edit-${task.id}`} autoFocus value={editDraft} maxLength={180} onChange={event => setEditDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setEditing(null) }} />
                    <button className="small-button save" type="submit" disabled={!editDraft.trim()}>Salvar</button>
                    <button className="small-button" type="button" onClick={() => setEditing(null)}>Cancelar</button>
                  </form>
                ) : (
                  <>
                    <label className="task-label">
                      <input type="checkbox" checked={task.concluida} onChange={() => toggle(task.id)} />
                      <span>{task.texto}</span>
                    </label>
                    <div className="actions">
                      <button type="button" className="small-button" aria-label={`Editar ${task.texto}`} onClick={() => beginEdit(task)}>Editar</button>
                      <button type="button" className="small-button delete" aria-label={`Excluir ${task.texto}`} onClick={() => remove(task.id)}>Excluir</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <footer className="panel-footer">
          <span>{pending} {pending === 1 ? 'tarefa pendente' : 'tarefas pendentes'}</span>
          {done > 0 && <button type="button" className="clear-button" onClick={() => setTasks(current => current.filter(task => !task.concluida))}>Limpar concluídas</button>}
        </footer>
      </section>
      <p className="footnote">Um projeto de estudo com React. Seus dados ficam apenas neste navegador.</p>
    </main>
  )
}

export default App
