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
const scriptPath = join(scriptsDir, 'build-standalone-pages.ts')

afterEach(async () => {
  while (tempRoots.length > 0) {
    const tempRoot = tempRoots.pop()
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true })
    }
  }
})

async function createTempRoot() {
  const tempRoot = await mkdtemp(join(tmpdir(), 'standalone-pages-'))
  tempRoots.push(tempRoot)
  await mkdir(join(tempRoot, 'standalone-pages-src'), { recursive: true })
  return tempRoot
}

async function runBuilder(cwd: string, extraArgs: string[] = []) {
  return execFileAsync(
    process.execPath,
    [
      '--import',
      'tsx',
      scriptPath,
      '--src',
      join(cwd, 'standalone-pages-src'),
      '--out',
      join(cwd, 'standalone-pages-dist'),
      ...extraArgs,
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    },
  )
}

test('builder copies standalone HTML into per-slug index outputs and root index', async () => {
  const tempRoot = await createTempRoot()
  const sourcePath = join(tempRoot, 'standalone-pages-src', 'lorica.html')

  await writeFile(sourcePath, '<!DOCTYPE html><title>Lorica</title><main>lorica</main>\n', 'utf8')

  const { stdout } = await runBuilder(tempRoot)
  const pageOutput = await readFile(join(tempRoot, 'standalone-pages-dist', 'lorica', 'index.html'), 'utf8')
  const rootIndex = await readFile(join(tempRoot, 'standalone-pages-dist', 'index.html'), 'utf8')

  assert.equal(pageOutput, '<!DOCTYPE html><title>Lorica</title><main>lorica</main>\n')
  assert.match(rootIndex, /href="\.\/lorica\/"/)
  assert.match(rootIndex, />lorica</)
  assert.match(stdout, /Built 1 standalone page/)
})

test('builder preserves multiple pages and sorts them in the generated root index', async () => {
  const tempRoot = await createTempRoot()

  await writeFile(join(tempRoot, 'standalone-pages-src', 'zeta.html'), '<main>zeta</main>\n', 'utf8')
  await writeFile(join(tempRoot, 'standalone-pages-src', 'alpha.html'), '<main>alpha</main>\n', 'utf8')

  await runBuilder(tempRoot)

  const rootIndex = await readFile(join(tempRoot, 'standalone-pages-dist', 'index.html'), 'utf8')
  const alphaOutput = await readFile(join(tempRoot, 'standalone-pages-dist', 'alpha', 'index.html'), 'utf8')
  const zetaOutput = await readFile(join(tempRoot, 'standalone-pages-dist', 'zeta', 'index.html'), 'utf8')

  assert.equal(alphaOutput, '<main>alpha</main>\n')
  assert.equal(zetaOutput, '<main>zeta</main>\n')
  assert.ok(rootIndex.indexOf('./alpha/') < rootIndex.indexOf('./zeta/'))
})

test('builder fails on invalid slug filenames', async () => {
  const tempRoot = await createTempRoot()

  await writeFile(join(tempRoot, 'standalone-pages-src', 'Lorica.html'), '<main>bad slug</main>\n', 'utf8')

  await assert.rejects(
    runBuilder(tempRoot),
    (error: unknown) => {
      const stderr = typeof error === 'object' && error !== null && 'stderr' in error
        ? String((error as { stderr: string }).stderr)
        : ''
      assert.match(stderr, /Invalid standalone page slug "Lorica"/)
      return true
    },
  )
})
