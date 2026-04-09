/**
 * Create one post file or a paired zh/en site post scaffold.
 *
 * Usage:
 *   pnpm new-post <path>
 *   pnpm new-post --paired <path>
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import process from 'node:process'
import { themeConfig } from '../src/config'

interface CliOptions {
  paired: boolean
  rawPath: string
}

interface PostTarget {
  abbrlink: string
  filePath: string
  lang: string
  title: string
}

class HelpExit extends Error {}

const markdownExtensions = new Set(['.md', '.mdx'])
const contentRoot = join('src', 'content', 'posts', 'site')
const localeSuffixPattern = /-(en|zh)$/i

function printHelp() {
  console.log(`Create one post file or a paired zh/en site post scaffold.

Usage:
  pnpm new-post <path>
  pnpm new-post --paired <path>

Options:
  --paired        Create one \`-zh\` file and one \`-en\` file together
  --help, -h      Show this help text
`)
}

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    paired: false,
    rawPath: 'new-post',
  }

  let positionalCount = 0

  for (const arg of argv) {
    switch (arg) {
      case '--paired':
        options.paired = true
        break
      case '--help':
      case '-h':
        printHelp()
        throw new HelpExit()
      default:
        if (arg.startsWith('-')) {
          fail(`Unknown argument: ${arg}`)
        }

        positionalCount += 1
        if (positionalCount > 1) {
          fail('Only one path argument is supported.')
        }
        options.rawPath = arg
    }
  }

  return options
}

function resolveExtension(rawPath: string) {
  const requestedExtension = extname(rawPath)
  return markdownExtensions.has(requestedExtension) ? requestedExtension : '.md'
}

function stripLocaleSuffix(baseName: string) {
  return baseName.replace(localeSuffixPattern, '')
}

function normalizeAbbrlink(baseName: string) {
  return baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatFrontmatterValue(value: string) {
  return value || '\'\''
}

function createPostContent(options: {
  abbrlink: string
  lang: string
  published: string
  title: string
}) {
  return `---
title: ${formatFrontmatterValue(options.title)}
published: ${options.published}
description: ''
updated: ''
tags:
  - Tag
draft: false
pin: 0
toc: ${themeConfig.global.toc}
lang: ${formatFrontmatterValue(options.lang)}
abbrlink: ${formatFrontmatterValue(options.abbrlink)}
---
`
}

function buildSingleTarget(rawPath: string): PostTarget {
  const extension = resolveExtension(rawPath)
  const targetFile = markdownExtensions.has(extname(rawPath))
    ? rawPath
    : `${rawPath}${extension}`
  const baseName = basename(targetFile, extension)

  return {
    abbrlink: '',
    filePath: join(contentRoot, targetFile),
    lang: '',
    title: baseName,
  }
}

function buildPairedTargets(rawPath: string): PostTarget[] {
  const extension = resolveExtension(rawPath)
  const rawTarget = markdownExtensions.has(extname(rawPath))
    ? rawPath
    : `${rawPath}${extension}`
  const relativeDir = dirname(rawTarget) === '.' ? '' : dirname(rawTarget)
  const rawBaseName = basename(rawTarget, extension)
  const pairBaseName = stripLocaleSuffix(rawBaseName)

  if (!pairBaseName) {
    fail(`Invalid paired post path: ${rawPath}`)
  }

  const abbrlink = normalizeAbbrlink(pairBaseName)

  return ['zh', 'en'].map(lang => ({
    abbrlink,
    filePath: join(contentRoot, relativeDir, `${pairBaseName}-${lang}${extension}`),
    lang,
    title: pairBaseName,
  }))
}

function assertTargetsDoNotExist(targets: PostTarget[]) {
  const existingTargets = targets.filter(target => existsSync(target.filePath))
  if (existingTargets.length === 0) {
    return
  }

  fail(`File already exists: ${existingTargets.map(target => target.filePath).join(', ')}`)
}

function writeTargets(targets: PostTarget[]) {
  const published = new Date().toISOString()

  targets.forEach((target) => {
    mkdirSync(dirname(target.filePath), { recursive: true })
    writeFileSync(target.filePath, createPostContent({
      abbrlink: target.abbrlink,
      lang: target.lang,
      published,
      title: target.title,
    }))
  })
}

function printSuccess(targets: PostTarget[], paired: boolean) {
  if (!paired) {
    console.log(`✅ Post created: ${targets[0]!.filePath}`)
    return
  }

  console.log(`✅ Paired posts created:`)
  targets.forEach(target => console.log(target.filePath))
}

try {
  const options = parseArgs(process.argv.slice(2))
  const targets = options.paired
    ? buildPairedTargets(options.rawPath)
    : [buildSingleTarget(options.rawPath)]

  assertTargetsDoNotExist(targets)
  writeTargets(targets)
  printSuccess(targets, options.paired)
}
catch (error) {
  if (error instanceof HelpExit) {
    process.exit(0)
  }

  console.error('❌ Failed to create post:', error)
  process.exit(1)
}
