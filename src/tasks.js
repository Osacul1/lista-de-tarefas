export const STORAGE_KEY = 'lucas-lista-tarefas-v1'

export function normalizeTasks(value) {
  if (!Array.isArray(value)) return []
  return value.filter(item => item && typeof item.id === 'string' && typeof item.texto === 'string')
    .map(item => ({ id: item.id, texto: item.texto, concluida: Boolean(item.concluida) }))
}

export function readTasks(storage) {
  try {
    return normalizeTasks(JSON.parse(storage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return []
  }
}

export function createTask(text, id) {
  const texto = text.trim()
  if (!texto) return null
  return { id, texto, concluida: false }
}

export function updateTask(tasks, id, text) {
  const texto = text.trim()
  if (!texto) return tasks
  return tasks.map(task => task.id === id ? { ...task, texto } : task)
}

export function visibleTasks(tasks, filter, query) {
  const search = query.trim().toLocaleLowerCase('pt-BR')
  return tasks.filter(task => {
    if (filter === 'pendentes' && task.concluida) return false
    if (filter === 'concluidas' && !task.concluida) return false
    return task.texto.toLocaleLowerCase('pt-BR').includes(search)
  })
}
