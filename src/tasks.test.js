import test from 'node:test'
import assert from 'node:assert/strict'
import { createTask, normalizeTasks, readTasks, updateTask, visibleTasks, STORAGE_KEY, loadTasks, saveTasks, parseBackup, exportBackup, mergeTasks, restoreTasks, MAX_TASKS } from './tasks.js'

test('não cria tarefas vazias e remove espaços', () => {
  assert.equal(createTask('  ', '1'), null)
  assert.deepEqual(createTask('  Estudar redes  ', '1'), { id: '1', texto: 'Estudar redes', concluida: false })
})

test('recupera dados válidos e ignora armazenamento inválido', () => {
  assert.deepEqual(readTasks({ getItem: () => '{quebrado' }), [])
  assert.deepEqual(readTasks({ getItem: key => key === STORAGE_KEY ? '[{"id":"1","texto":"Teste","concluida":true}]' : null }), [{ id: '1', texto: 'Teste', concluida: true }])
  assert.deepEqual(normalizeTasks([{ id: 9, texto: 'Inválida' }, { id: '2', texto: 'Ok' }]), [{ id: '2', texto: 'Ok', concluida: false }])
})

test('edição preserva as outras tarefas', () => {
  const tasks = [{ id: '1', texto: 'Original', concluida: false }, { id: '2', texto: 'Outra', concluida: true }]
  const result = updateTask(tasks, '1', '  Revisada ')
  assert.equal(result[0].texto, 'Revisada')
  assert.deepEqual(result[1], tasks[1])
  assert.equal(updateTask(tasks, '1', '   '), tasks)
})

test('filtros combinam estado e pesquisa sem alterar origem', () => {
  const tasks = [{ id: '1', texto: 'Estudar redes', concluida: false }, { id: '2', texto: 'Revisar React', concluida: true }]
  assert.deepEqual(visibleTasks(tasks, 'pendentes', 'REDES').map(t => t.id), ['1'])
  assert.deepEqual(visibleTasks(tasks, 'concluidas', '').map(t => t.id), ['2'])
  assert.deepEqual(visibleTasks(tasks, 'todas', 'xyz'), [])
  assert.equal(tasks.length, 2)
})

test('normalização rejeita tipos inesperados, vazios e IDs repetidos', () => {
  assert.deepEqual(normalizeTasks([
    { id: '', texto: 'Sem ID' }, { id: '1', texto: ' ' },
    { id: '2', texto: 'Primeira', concluida: 'false' },
    { id: '3', texto: ' Válida ', concluida: false },
    { id: '3', texto: 'Repetida', concluida: true },
  ]), [{ id: '3', texto: 'Válida', concluida: false }])
})

test('pesquisa encontra palavras com ou sem acentos', () => {
  const tasks = [{ id: '1', texto: 'Revisar configuração de rede', concluida: false }]
  assert.equal(visibleTasks(tasks, 'todas', 'CONFIGURACAO').length, 1)
})

test('falhas de armazenamento são informadas, inclusive ao acessar localStorage', () => {
  const denied = () => { throw new Error('SecurityError') }
  assert.ok(loadTasks(denied).error)
  assert.ok(saveTasks(denied, []))
  assert.ok(loadTasks(() => ({ getItem: () => '{quebrado' })).error)
  assert.equal(saveTasks(() => ({ setItem: () => {} }), []), null)
  assert.deepEqual(loadTasks(() => ({ getItem: () => null })), { tasks: [], error: null })
})

test('backup preserva tarefas e rejeita arquivo incorreto integralmente', () => {
  const tasks = [{ id: '1', texto: '<script>texto</script>', concluida: true }]
  assert.deepEqual(parseBackup(exportBackup(tasks)), tasks)
  for (const value of ['{}', '{', '{"app":"outro","version":1,"tasks":[]}', '{"app":"lista-de-tarefas","version":9,"tasks":[]}', '{"app":"lista-de-tarefas","version":1,"tasks":[{"id":"1","texto":" "}]}']) {
    assert.throws(() => parseBackup(value))
  }
  assert.throws(() => parseBackup(exportBackup([tasks[0], tasks[0]])))
})

test('importar preserva edições, resolve IDs e não repete o mesmo backup', () => {
  const current = [{ id: '1', texto: 'Texto revisado', concluida: true }]
  const incoming = [{ id: '1', texto: 'Texto original', concluida: false }, { id: '2', texto: 'Outra', concluida: false }]
  const merged = mergeTasks(current, incoming)
  assert.equal(merged.length, 3)
  assert.deepEqual(merged[0], current[0])
  assert.equal(new Set(merged.map(item => item.id)).size, 3)
  assert.deepEqual(mergeTasks(merged, incoming), merged)
  assert.equal(current.length, 1)
})

test('desfazer exclusão restaura posições sem apagar tarefas criadas depois', () => {
  const one = { id: '1', texto: 'Primeira', concluida: true }
  const two = { id: '2', texto: 'Segunda', concluida: false }
  const three = { id: '3', texto: 'Terceira', concluida: true }
  const four = { id: '4', texto: 'Nova', concluida: false }
  const removed = [{ task: one, index: 0 }, { task: three, index: 2 }]
  assert.deepEqual(restoreTasks([two, four], removed), [one, two, three, four])
  assert.deepEqual(restoreTasks([one, two, three, four], removed), [one, two, three, four])
})

test('limites impedem importação parcial e textos longos demais', () => {
  const full = Array.from({ length: MAX_TASKS }, (_, index) => ({ id: String(index), texto: 'Tarefa', concluida: false }))
  assert.throws(() => mergeTasks(full, [{ id: 'extra', texto: 'Nova', concluida: false }]))
  assert.throws(() => restoreTasks(full, [{ task: { id: 'extra', texto: 'Nova', concluida: false }, index: 0 }]))
  assert.throws(() => parseBackup(exportBackup([...full, full[0]])))
  assert.equal(createTask('a'.repeat(181), '1'), null)
})
