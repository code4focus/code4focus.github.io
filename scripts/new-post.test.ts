/* eslint-disable test/no-import-node-test */

import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const tempRoots: string[] = []
const scriptsDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = dirname(scriptsDir)
const scriptPath = join(scriptsDir, 'new-post.ts')
const tsxCliPath = join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')

afterEach(async () => {
  while (tempRoots.length > 0) {
    const tempRoot = tempRoots.pop()
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true })
    }
  }
})

async function createTempRoot() {
  const tempRoot = await mkdtemp(join(tmpdir(), 'new-post-'))
  tempRoots.push(tempRoot)
  return tempRoot
}

async function runNewPost(args: string[], cwd: string) {
  return execFileAsync(
    process.execPath,
    [tsxCliPath, scriptPath, ...args],
    {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    },
  )
}

function getFieldValue(source: string, field: string) {
  const match = source.match(new RegExp(`^${field}:\\s*(.*)$`, 'm'))
  return match?.[1] ?? ''
}

test('new-post preserves the single-file scaffold path', async () => {
  const tempRoot = await createTempRoot()

  await runNewPost(['solo-post'], tempRoot)

  const createdFile = join(tempRoot, 'src', 'content', 'posts', 'site', 'solo-post.md')
  const source = await readFile(createdFile, 'utf8')

  assert.match(source, /^title: solo-post$/m)
  assert.equal(getFieldValue(source, 'lang'), '\'\'')
  assert.equal(getFieldValue(source, 'abbrlink'), '\'\'')
})

test('new-post --paired creates zh/en files with shared pair metadata', async () => {
  const tempRoot = await createTempRoot()

  await runNewPost(['--paired', 'notes/hello-world'], tempRoot)

  const zhFile = join(tempRoot, 'src', 'content', 'posts', 'site', 'notes', 'hello-world-zh.md')
  const enFile = join(tempRoot, 'src', 'content', 'posts', 'site', 'notes', 'hello-world-en.md')
  const zhSource = await readFile(zhFile, 'utf8')
  const enSource = await readFile(enFile, 'utf8')

  assert.equal(getFieldValue(zhSource, 'lang'), 'zh')
  assert.equal(getFieldValue(enSource, 'lang'), 'en')
  assert.equal(getFieldValue(zhSource, 'abbrlink'), 'hello-world')
  assert.equal(getFieldValue(enSource, 'abbrlink'), 'hello-world')
  assert.equal(getFieldValue(zhSource, 'published'), getFieldValue(enSource, 'published'))
  assert.match(zhSource, /^title: hello-world$/m)
  assert.match(enSource, /^title: hello-world$/m)
})

test('new-post --paired strips a locale suffix from the requested path before creating both files', async () => {
  const tempRoot = await createTempRoot()

  await runNewPost(['content/routing-notes-en.mdx', '--paired'], tempRoot)

  const zhFile = join(tempRoot, 'src', 'content', 'posts', 'site', 'content', 'routing-notes-zh.mdx')
  const enFile = join(tempRoot, 'src', 'content', 'posts', 'site', 'content', 'routing-notes-en.mdx')

  assert.equal(getFieldValue(await readFile(zhFile, 'utf8'), 'abbrlink'), 'routing-notes')
  assert.equal(getFieldValue(await readFile(enFile, 'utf8'), 'abbrlink'), 'routing-notes')
})

test('new-post --paired fails before creating a partial pair when one target already exists', async () => {
  const tempRoot = await createTempRoot()
  const existingEnFile = join(tempRoot, 'src', 'content', 'posts', 'site', 'hello-world-en.md')
  const missingZhFile = join(tempRoot, 'src', 'content', 'posts', 'site', 'hello-world-zh.md')

  await mkdir(dirname(existingEnFile), { recursive: true })
  await writeFile(existingEnFile, 'existing-content\n', 'utf8')

  try {
    await runNewPost(['--paired', 'hello-world'], tempRoot)
    assert.fail('Expected paired scaffold creation to fail when one target already exists.')
  }
  catch (error) {
    const stderr = typeof error === 'object' && error !== null && 'stderr' in error
      ? String((error as { stderr: string }).stderr)
      : ''
    assert.match(stderr, /File already exists/)
  }

  assert.equal(await readFile(existingEnFile, 'utf8'), 'existing-content\n')
  await assert.rejects(readFile(missingZhFile, 'utf8'))
})
