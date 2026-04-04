/**
 * Create multiple GitHub sub-issues from a JSON file.
 *
 * Usage:
 *   pnpm create-sub-issues --parent 2 --input scripts/issues/examples/sub-issues.json
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'

interface BatchItem {
  title: string
  type?: string
  objective?: string
  scopeIn?: string
  scopeOut?: string
  dependencies?: string
  acceptance?: string[]
  validation?: string[]
  additionalContext?: string
}

interface CliOptions {
  repo: string
  parent: number
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
      case '--parent':
        options.parent = Number(next)
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

  if (!options.parent || Number.isNaN(options.parent)) {
    fail(`Missing or invalid --parent`)
  }

  if (!options.input) {
    fail(`Missing --input`)
  }

  return options as CliOptions
}

function printHelp() {
  console.log(`Create multiple GitHub sub-issues from a JSON file.

Required:
  --parent <number>        Parent issue number
  --input <path>           Path to a JSON array of sub-issue definitions

Optional:
  --repo <owner/name>      Repository name, default: code4focus/code4focus.github.io
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
    if (!item.title) {
      fail(`Each item requires a title`)
    }

    const args = [
      '--import',
      'tsx',
      'scripts/issues/create-sub-issue.ts',
      '--repo',
      options.repo,
      '--parent',
      String(options.parent),
      '--title',
      item.title,
      '--type',
      item.type ?? 'Implementation',
    ]

    if (item.objective) {
      args.push('--objective', item.objective)
    }
    if (item.scopeIn) {
      args.push('--scope-in', item.scopeIn)
    }
    if (item.scopeOut) {
      args.push('--scope-out', item.scopeOut)
    }
    if (item.dependencies) {
      args.push('--dependencies', item.dependencies)
    }
    for (const criterion of item.acceptance ?? []) {
      args.push('--acceptance', criterion)
    }
    for (const check of item.validation ?? []) {
      args.push('--validation', check)
    }
    if (item.additionalContext) {
      args.push('--context', item.additionalContext)
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
