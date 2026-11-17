import { useMemo, useRef, useState } from 'react'
import { createTask, exportBackup, loadTasks, MAX_BACKUP_BYTES, MAX_TASKS, MAX_TEXT_LENGTH, mergeTasks, parseBackup, restoreTasks, saveTasks, updateTask, visibleTasks } from './tasks'
import './App.css'

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function App() {
  const [data, setData] = useState(() => loadTasks(() => window.localStorage))
  const { tasks, error: storageError } = data
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('todas')
  const [editing, setEditing] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [undo, setUndo] = useState(null)
  const [notice, setNotice] = useState('')
  const [fileError, setFileError] = useState('')
  const [incoming, setIncoming] = useState(null)
  const [reading, setReading] = useState(false)
  const inputRef = useRef(null)
  const fileRef = useRef(null)
  const importRef = useRef(null)

  const done = tasks.filter(task => task.concluida).length
  const pending = tasks.length - done
  const filtered = useMemo(() => visibleTasks(tasks, filter, query), [tasks, filter, query])

  // Salva apenas após uma ação do usuário: abrir a página não sobrescreve dados danificados.
  function changeTasks(next) {
    const error = saveTasks(() => window.localStorage, next)
    setData({ tasks: next, error })
  }

  function add(event) {
    event.preventDefault()
    if (tasks.length >= MAX_TASKS) return
    const task = createTask(draft, newId())
    if (!task) return
    changeTasks([...tasks, task])
    setDraft('')
    setNotice('Tarefa adicionada.')
    inputRef.current?.focus()
  }

  function toggle(id) {
    changeTasks(tasks.map(task => task.id === id ? { ...task, concluida: !task.concluida } : task))
  }

  function removeTasks(predicate) {
    const removed = tasks.flatMap((task, index) => predicate(task) ? [{ task, index }] : [])
    changeTasks(tasks.filter(task => !predicate(task)))
    setUndo(removed)
    setNotice(removed.length === 1 ? 'Tarefa excluída.' : `${removed.length} tarefas excluídas.`)
    if (removed.some(item => item.task.id === editing)) setEditing(null)
    inputRef.current?.focus()
  }

  function restore() {
    try {
      changeTasks(restoreTasks(tasks, undo))
      setUndo(null)
      setNotice('Exclusão desfeita.')
      inputRef.current?.focus()
    } catch (error) {
      setNotice(error.message)
    }
  }

  function beginEdit(task) {
    setEditing(task.id)
    setEditDraft(task.texto)
  }

  function finishEdit() {
    setEditing(null)
    inputRef.current?.focus()
  }

  function saveEdit(event) {
    event.preventDefault()
    if (!editDraft.trim()) return
    changeTasks(updateTask(tasks, editing, editDraft))
    setNotice('Tarefa atualizada.')
    finishEdit()
  }

  function download() {
    const url = URL.createObjectURL(new Blob([exportBackup(tasks)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `minhas-tarefas-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Backup exportado. Guarde o arquivo para recuperar suas tarefas.')
  }

  async function readFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setFileError('')
    setIncoming(null)
    setReading(true)
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('O arquivo deve ter no máximo 1 MB.')
      const imported = parseBackup(await file.text())
      setIncoming(imported)
    } catch (error) {
      setFileError(error.message)
    } finally {
      setReading(false)
    }
  }

  function confirmImport() {
    try {
      const merged = mergeTasks(tasks, incoming)
      changeTasks(merged)
      setNotice(`${merged.length - tasks.length} tarefas acrescentadas. Suas tarefas anteriores foram mantidas.`)
      setIncoming(null)
      importRef.current?.focus()
    } catch (error) {
      setFileError(error.message)
    }
  }

  return (
    <main className="workspace">
      <header className="heading">
        <div>
          <p className="eyebrow">UM PASSO DE CADA VEZ</p>
          <h1>Minhas tarefas<span className="period">.</span></h1>
          <p className="subtitle">Uma lista para abrir espaço na cabeça.</p>
        </div>
        <span className={storageError ? 'local-badge warning-badge' : 'local-badge'}>{storageError ? 'Armazenamento com problema' : 'Salvo neste navegador'}</span>
      </header>

      {storageError && <p className="warning" role="alert">{storageError}</p>}

      <section className="overview" aria-label="Resumo das tarefas">
        <div className="progress-heading">
          <p><strong>{pending.toString().padStart(2, '0')}</strong> {pending === 1 ? 'pendente' : 'pendentes'}</p>
          <span>{done} de {tasks.length} {tasks.length === 1 ? 'concluída' : 'concluídas'}</span>
        </div>
        <progress value={done} max={tasks.length || 1} aria-label={`${done} de ${tasks.length} tarefas concluídas`} />
      </section>

      <section className="task-panel" aria-label="Gerenciar tarefas">
        <form className="add-form" onSubmit={add}>
          <label htmlFor="task-input">O que você precisa fazer?</label>
          <div className="input-row">
            <input type="text" id="task-input" ref={inputRef} placeholder="Ex.: estudar redes por 15 minutos" value={draft} maxLength={MAX_TEXT_LENGTH} onChange={event => setDraft(event.target.value)} />
            <button className="primary-button" type="submit" disabled={!draft.trim() || tasks.length >= MAX_TASKS}>Adicionar <span aria-hidden="true">+</span></button>
          </div>
          {tasks.length >= MAX_TASKS && <p className="warning">Limite de {MAX_TASKS} tarefas atingido. Exporte um backup antes de limpar a lista.</p>}
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
            <input type="search" placeholder="Buscar na lista" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-mark" aria-hidden="true">{tasks.length === 0 ? '+' : '—'}</span>
            <h2>{tasks.length === 0 ? 'Comece pelo que está na sua cabeça.' : 'Nada por aqui com esse filtro.'}</h2>
            <p>{tasks.length === 0 ? 'Escreva uma tarefa acima. Não precisa organizar tudo agora.' : 'Tente outra palavra ou volte para a lista completa.'}</p>
            {tasks.length > 0 && <button className="clear-button" type="button" onClick={() => { setQuery(''); setFilter('todas') }}>Mostrar todas</button>}
          </div>
        ) : (
          <ul className="task-list">
            {filtered.map(task => (
              <li key={task.id} className={task.concluida ? 'task completed' : 'task'}>
                {editing === task.id ? (
                  <form className="edit-form" onSubmit={saveEdit}>
                    <label className="sr-only" htmlFor={`edit-${task.id}`}>Editar tarefa</label>
                    <input id={`edit-${task.id}`} autoFocus value={editDraft} maxLength={MAX_TEXT_LENGTH} onChange={event => setEditDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') finishEdit() }} />
                    <button className="small-button save" type="submit" disabled={!editDraft.trim()}>Salvar</button>
                    <button className="small-button" type="button" onClick={finishEdit}>Cancelar</button>
                  </form>
                ) : (
                  <>
                    <label className="task-label">
                      <input type="checkbox" checked={task.concluida} onChange={() => toggle(task.id)} />
                      <span>{task.texto}</span>
                    </label>
                    <div className="actions">
                      <button type="button" className="small-button" aria-label={`Editar ${task.texto}`} onClick={() => beginEdit(task)}>Editar</button>
                      <button type="button" className="small-button delete" aria-label={`Excluir ${task.texto}`} onClick={() => removeTasks(item => item.id === task.id)}>Excluir</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <footer className="panel-footer">
          <span aria-live="polite">{filtered.length} {filtered.length === 1 ? 'tarefa na lista' : 'tarefas na lista'}</span>
          {done > 0 && <button type="button" className="clear-button" onClick={() => removeTasks(task => task.concluida)}>Limpar concluídas</button>}
        </footer>
      </section>

      <div className="feedback">
        <p role="status">{notice}</p>
        {undo && <button className="small-button" type="button" onClick={restore}>Desfazer exclusão</button>}
      </div>

      <section className="backup" aria-labelledby="backup-title">
        <div><h2 id="backup-title">Leve sua lista com você.</h2><p>Exporte um backup antes de trocar de navegador ou limpar os dados.</p></div>
        <div className="backup-actions">
          <button type="button" className="small-button" onClick={download}>Exportar backup</button>
          <button type="button" className="small-button" ref={importRef} disabled={reading} onClick={() => fileRef.current?.click()}>{reading ? 'Lendo arquivo…' : 'Importar backup'}</button>
          <input type="file" ref={fileRef} accept=".json,application/json" hidden aria-label="Arquivo de backup" onChange={readFile} />
        </div>
        {fileError && <p className="warning" role="alert">{fileError}</p>}
        {incoming && <div className="import-preview" role="region" aria-label="Conferir importação">
          <p>Backup com <strong>{incoming.length} tarefas</strong>. A importação acrescenta tarefas e mantém as que já estão aqui. Cópias idênticas são ignoradas.</p>
          <div className="backup-actions">
            <button className="primary-button" type="button" onClick={confirmImport}>Confirmar importação</button>
            <button className="small-button" type="button" onClick={() => { setIncoming(null); setFileError(''); importRef.current?.focus() }}>Cancelar importação</button>
          </div>
        </div>}
      </section>
      <p className="footnote">Feito por <a href="https://github.com/Osacul1/lista-de-tarefas">Lucas Resende</a> enquanto aprendo React.<br />Sem conta. Seus dados ficam neste navegador.</p>
    </main>
  )
}

export default App
