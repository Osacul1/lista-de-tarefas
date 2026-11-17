import { test, expect } from '@playwright/test'

const key = 'lucas-lista-tarefas-v1'
const backup = tasks => ({
  name: 'backup.json', mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify({ app: 'lista-de-tarefas', version: 1, tasks })),
})

async function add(page, text) {
  await page.getByLabel('O que você precisa fazer?').fill(text)
  await page.getByRole('button', { name: 'Adicionar' }).click()
}

test.beforeEach(async ({ page }) => { await page.goto('./') })

test('cria, edita, filtra e mantém tarefas após recarregar', async ({ page }) => {
  await add(page, 'Revisar configuração')
  await add(page, 'Estudar redes')
  await page.getByRole('button', { name: 'Editar Estudar redes', exact: true }).click()
  await page.getByLabel('Editar tarefa', { exact: true }).fill('Estudar TCP/IP')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Estudar TCP/IP', exact: true }).check()
  await page.getByRole('button', { name: 'Pendentes', exact: true }).click()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await page.getByLabel('Pesquisar tarefas').fill('configuracao')
  await expect(page.getByRole('listitem')).toHaveText([/Revisar configuração/])
  await page.reload()
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('checkbox', { name: 'Estudar TCP/IP' })).toBeChecked()
})

test('desfaz limpeza sem perder tarefa adicionada depois', async ({ page }) => {
  await add(page, 'Primeira')
  await add(page, 'Segunda')
  await page.getByRole('checkbox', { name: 'Primeira' }).check()
  await page.getByRole('button', { name: 'Limpar concluídas' }).click()
  await add(page, 'Terceira')
  await page.getByRole('button', { name: 'Desfazer exclusão' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(3)
  await expect(page.getByRole('checkbox', { name: 'Primeira' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Terceira' })).toBeVisible()
})

test('importa com prévia, mantém a lista e evita duplicatas', async ({ page }) => {
  await add(page, 'Minha tarefa')
  const imported = [{ id: 'backup-1', texto: 'Do backup', concluida: false }]
  await page.getByLabel('Arquivo de backup').setInputFiles(backup(imported))
  await expect(page.getByRole('region', { name: 'Conferir importação' })).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await page.getByRole('button', { name: 'Confirmar importação' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await page.getByLabel('Arquivo de backup').setInputFiles(backup(imported))
  await page.getByRole('button', { name: 'Confirmar importação' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(2)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar backup' }).click()
  expect((await download).suggestedFilename()).toMatch(/^minhas-tarefas-.*\.json$/)
})

test('rejeita backup inválido e permite cancelar importação', async ({ page }) => {
  await add(page, 'Manter')
  await page.getByLabel('Arquivo de backup').setInputFiles({ name: 'erro.json', mimeType: 'application/json', buffer: Buffer.from('{') })
  await expect(page.getByRole('alert')).toContainText('JSON válido')
  await page.getByLabel('Arquivo de backup').setInputFiles(backup([{ id: '2', texto: 'Cancelar', concluida: false }]))
  await page.getByRole('button', { name: 'Cancelar importação' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(page.getByRole('region', { name: 'Conferir importação' })).toHaveCount(0)
})

test('armazenamento bloqueado informa falha e mantém a tarefa na sessão', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage bloqueado') } })
  })
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Não foi possível ler')
  await add(page, 'Exportar antes de sair')
  await expect(page.getByRole('alert')).toContainText('não conseguiu salvá-las')
  await expect(page.getByRole('checkbox', { name: 'Exportar antes de sair' })).toBeVisible()
  await expect(page.getByText('Salvo neste navegador', { exact: true })).toHaveCount(0)
})

test('dados danificados não são sobrescritos só de abrir a página', async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, '{danificado'), key)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Não foi possível ler')
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('{danificado')
})

test('teclado permite adicionar e cancelar edição com Escape', async ({ page }) => {
  const input = page.getByLabel('O que você precisa fazer?')
  await input.fill('Estudar React')
  await input.press('Enter')
  await expect(input).toBeFocused()
  await page.getByRole('button', { name: 'Editar Estudar React', exact: true }).click()
  await page.getByLabel('Editar tarefa', { exact: true }).fill('Não salvar')
  await page.getByLabel('Editar tarefa', { exact: true }).press('Escape')
  await expect(input).toBeFocused()
  await expect(page.getByRole('checkbox', { name: 'Estudar React', exact: true })).toBeVisible()
})

test('texto longo não provoca rolagem horizontal', async ({ page }) => {
  await add(page, 'Tarefa '.repeat(25))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: /^Editar / }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
