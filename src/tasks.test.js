import test from 'node:test'
import assert from 'node:assert/strict'
import { createTask, normalizeTasks, readTasks, updateTask, visibleTasks, STORAGE_KEY } from './tasks.js'

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
