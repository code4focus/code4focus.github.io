/* eslint-disable test/no-import-node-test */

import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { runPostLint } from './post-lint'

const tempRoots: string[] = []
const execFileAsync = promisify(execFile)
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

afterEach(async () => {
  while (tempRoots.length > 0) {
    const tempRoot = tempRoots.pop()
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true })
    }
  }
})

async function createTempSiteDir() {
  const tempRoot = await mkdtemp(join(tmpdir(), 'post-lint-'))
  tempRoots.push(tempRoot)

  const contentDir = join(tempRoot, 'src', 'content', 'posts', 'site')
  await mkdir(contentDir, { recursive: true })

  return { tempRoot, contentDir }
}

async function writeMarkdown(filePath: string, source: string) {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, source, 'utf8')
}

function createPostSource(options: {
  title: string
  description: string
  lang: 'en' | 'zh'
  abbrlink: string
}) {
  return `---
title: ${options.title}
published: 2026-04-09
description: ${options.description}
updated: ''
tags:
  - Writing
draft: false
pin: 0
toc: true
lang: ${options.lang}
abbrlink: ${options.abbrlink}
---

${options.description}
`
}

test('runPostLint reports a missing sibling locale for paired site content', async () => {
  const { contentDir } = await createTempSiteDir()
  const enFile = join(contentDir, 'hello-world-en.md')

  await writeMarkdown(enFile, createPostSource({
    title: 'Hello world',
    description: 'A short English summary for the lint test.',
    lang: 'en',
    abbrlink: 'hello-world',
  }))

  const result = await runPostLint({
    scope: 'posts',
    includeBody: false,
    includeMetadata: true,
    filePatterns: [enFile],
  })

  assert.equal(result.errors, 1)
  assert.deepEqual(
    result.findings.map(finding => finding.code),
    ['bilingual-pair-missing-locale'],
  )
  assert.equal(result.findings[0]?.filePath, enFile)
})

test('runPostLint compares targeted files against their sibling locale metadata', async () => {
  const { contentDir } = await createTempSiteDir()
  const enFile = join(contentDir, 'hello-world-en.md')
  const zhFile = join(contentDir, 'hello-world-zh.md')

  await writeMarkdown(enFile, createPostSource({
    title: 'Hello world',
    description: 'A short English summary for the lint test.',
    lang: 'en',
    abbrlink: 'hello-world',
  }))
  await writeMarkdown(zhFile, createPostSource({
    title: '你好，世界',
    description: '用于 lint 测试的一段简短中文说明。',
    lang: 'zh',
    abbrlink: 'ni-hao-shi-jie',
  }))

  const result = await runPostLint({
    scope: 'posts',
    includeBody: false,
    includeMetadata: true,
    filePatterns: [enFile],
  })

  assert.equal(result.errors, 1)
  assert.deepEqual(
    result.findings.map(finding => finding.code),
    ['bilingual-pair-abbrlink'],
  )
  assert.equal(result.findings[0]?.filePath, enFile)
})

test('post-lint import does not depend on PUBLIC_SITE_URL validation', async () => {
  await execFileAsync(
    process.execPath,
    [
      '--input-type=module',
      '--import',
      'tsx',
      '--eval',
      'await import("./scripts/lib/post-lint.ts")',
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        PUBLIC_SITE_URL: 'not-a-valid-absolute-url',
      },
    },
  )
})

test('runPostLint does not report a missing locale when the sibling file exists but has invalid frontmatter', async () => {
  const { contentDir } = await createTempSiteDir()
  const enFile = join(contentDir, 'hello-world-en.md')
  const zhFile = join(contentDir, 'hello-world-zh.md')

  await writeMarkdown(enFile, createPostSource({
    title: 'Hello world',
    description: 'A short English summary for the lint test.',
    lang: 'en',
    abbrlink: 'hello-world',
  }))
  await writeMarkdown(zhFile, `---
title: [broken
lang: zh
---

坏掉的 frontmatter
`)

  const result = await runPostLint({
    scope: 'posts',
    includeBody: false,
    includeMetadata: true,
    filePatterns: [enFile],
  })

  assert.deepEqual(result.findings.map(finding => finding.code), [])
})
