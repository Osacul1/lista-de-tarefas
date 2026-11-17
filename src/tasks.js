export const STORAGE_KEY = 'lucas-lista-tarefas-v1'
export const MAX_TEXT_LENGTH = 180
export const MAX_TASKS = 2000
export const MAX_BACKUP_BYTES = 1024 * 1024

function validTask(item) {
  return item && typeof item.id === 'string' && item.id.trim().length > 0 &&
    item.id.length <= 200 && typeof item.texto === 'string' &&
    item.texto.trim().length > 0 && item.texto.length <= MAX_TEXT_LENGTH &&
    (item.concluida === undefined || typeof item.concluida === 'boolean')
}

export function normalizeTasks(value) {
  if (!Array.isArray(value)) return []
  const ids = new Set()
  return value.filter(item => {
    if (!validTask(item) || ids.has(item.id)) return false
    ids.add(item.id)
    return true
  }).slice(0, MAX_TASKS).map(item => ({
    id: item.id, texto: item.texto.trim(), concluida: item.concluida === true,
  }))
}

// Recebe uma função porque até acessar window.localStorage pode lançar um erro.
export function loadTasks(getStorage) {
  try {
    const raw = getStorage().getItem(STORAGE_KEY)
    if (raw === null) return { tasks: [], error: null }
    const parsed = JSON.parse(raw)
    const tasks = normalizeTasks(parsed)
    if (!Array.isArray(parsed) || tasks.length !== parsed.length) {
      return { tasks, error: 'Parte dos dados salvos não pôde ser lida. Exporte o que foi recuperado antes de continuar.' }
    }
    return { tasks, error: null }
  } catch {
    return { tasks: [], error: 'Não foi possível ler as tarefas salvas. O armazenamento pode estar bloqueado ou os dados podem estar danificados.' }
  }
}

export function readTasks(storage) {
  return loadTasks(() => storage).tasks
}

export function saveTasks(getStorage, tasks) {
  try {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(tasks))
    return null
  } catch {
    return 'As alterações estão só nesta aba. O navegador não conseguiu salvá-las. Exporte um backup antes de sair.'
  }
}

export function createTask(text, id) {
  const texto = text.trim()
  if (!texto || texto.length > MAX_TEXT_LENGTH) return null
  return { id, texto, concluida: false }
}

export function updateTask(tasks, id, text) {
  const texto = text.trim()
  if (!texto || texto.length > MAX_TEXT_LENGTH) return tasks
  return tasks.map(task => task.id === id ? { ...task, texto } : task)
}

function searchable(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

export function visibleTasks(tasks, filter, query) {
  const search = searchable(query.trim())
  return tasks.filter(task => {
    if (filter === 'pendentes' && task.concluida) return false
    if (filter === 'concluidas' && !task.concluida) return false
    return searchable(task.texto).includes(search)
  })
}

export function exportBackup(tasks) {
  return JSON.stringify({ app: 'lista-de-tarefas', version: 1, tasks }, null, 2)
}

export function parseBackup(text) {
  let value
  try { value = JSON.parse(text) } catch { throw new Error('Esse arquivo não contém um JSON válido.') }
  if (value?.app !== 'lista-de-tarefas' || value.version !== 1 || !Array.isArray(value.tasks)) {
    throw new Error('Escolha um backup exportado por esta lista de tarefas (versão 1).')
  }
  if (value.tasks.length > MAX_TASKS) throw new Error(`O backup excede o limite de ${MAX_TASKS} tarefas.`)
  const tasks = normalizeTasks(value.tasks)
  if (tasks.length !== value.tasks.length) throw new Error('O backup tem tarefas inválidas ou identificadores repetidos. Nada foi importado.')
  return tasks
}

// A importação acrescenta tarefas. Nunca substitui uma tarefa que já foi editada.
export function mergeTasks(current, incoming) {
  const result = [...current]
  const byId = new Map(current.map(task => [task.id, task]))
  for (const task of incoming) {
    const existing = byId.get(task.id)
    if (existing?.texto === task.texto && existing.concluida === task.concluida) continue
    let id = task.id
    let suffix = 1
    let duplicate = false
    while (byId.has(id)) {
      const candidate = byId.get(id)
      if (candidate.texto === task.texto && candidate.concluida === task.concluida) { duplicate = true; break }
      id = `${task.id.slice(0, 160)}-import-${suffix++}`
    }
    if (duplicate) continue
    const added = { ...task, id }
    result.push(added)
    byId.set(id, added)
  }
  if (result.length > MAX_TASKS) throw new Error(`Sua lista pode ter até ${MAX_TASKS} tarefas. Nada foi importado.`)
  return result
}

export function restoreTasks(current, removed) {
  const missing = removed.filter(({ task }) => !current.some(item => item.id === task.id))
  if (current.length + missing.length > MAX_TASKS) throw new Error(`Libere espaço na lista antes de desfazer. Limite: ${MAX_TASKS} tarefas.`)
  const result = [...current]
  for (const { task, index } of removed) {
    if (!result.some(item => item.id === task.id)) result.splice(Math.min(index, result.length), 0, task)
  }
  return result
}
