/**
 * Complete multiple GitHub issues from a JSON file.
 *
 * Usage:
 *   pnpm complete-issues --input scripts/issues/examples/issue-completions.example.json
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'

interface BatchItem {
  issue: number
  bodyFile?: string
  summary?: string
  scope?: string[]
  commits?: string[]
  validation?: string[]
  notes?: string[]
  close?: boolean
}

interface CliOptions {
  repo: string
  input: string
}

class HelpExit extends Error {}

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function parseArgs(argv: string[]): CliOptions {
  const options: Partial<CliOptions> = {
    repo: 'code4focus/code4focus.github.io',
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]

    switch (arg) {
      case '--repo':
        options.repo = next
        i += 1
        break
      case '--input':
        options.input = next
        i += 1
        break
      case '--help':
      case '-h':
        printHelp()
        throw new HelpExit()
      default:
        fail(`Unknown argument: ${arg}`)
    }
  }

  if (!options.input) {
    fail(`Missing --input`)
  }

  return options as CliOptions
}

function printHelp() {
  console.log(`Complete multiple GitHub issues from a JSON file.

Required:
  --input <path>          Path to a JSON array of issue completion definitions

Optional:
  --repo <owner/name>     Repository name, default: code4focus/code4focus.github.io
`)
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const content = readFileSync(options.input, 'utf8')
  const items = JSON.parse(content) as BatchItem[]

  if (!Array.isArray(items) || items.length === 0) {
    fail(`Input must be a non-empty JSON array`)
  }

  for (const item of items) {
    if (!item.issue || Number.isNaN(item.issue)) {
      fail(`Each item requires a valid issue number`)
    }

    const args = [
      '--import',
      'tsx',
      'scripts/issues/complete-issue.ts',
      '--repo',
      options.repo,
      '--issue',
      String(item.issue),
    ]

    if (item.bodyFile) {
      args.push('--body-file', item.bodyFile)
    }
    if (item.summary) {
      args.push('--summary', item.summary)
    }
    for (const scopeItem of item.scope ?? []) {
      args.push('--scope', scopeItem)
    }
    for (const commit of item.commits ?? []) {
      args.push('--commit', commit)
    }
    for (const check of item.validation ?? []) {
      args.push('--validation', check)
    }
    for (const note of item.notes ?? []) {
      args.push('--note', note)
    }
    if (item.close) {
      args.push('--close')
    }

    execFileSync('node', args, { stdio: 'inherit' })
  }
}

try {
  main()
}
catch (error) {
  if (error instanceof HelpExit) {
    process.exit(0)
  }

  throw error
}
