/**
 * Collect deterministic branch and diff context for PR summary drafting.
 *
 * Usage:
 *   pnpm pr-context
 *   pnpm pr-context --base origin/main --format json
 */

import { execFileSync } from 'node:child_process'
import process from 'node:process'

type OutputFormat = 'json' | 'markdown'

interface CliOptions {
  baseRef?: string
  format: OutputFormat
}

interface PrContext {
  branch: string
  baseRef: string
  mergeBase: string
  isWorktreeClean: boolean
  statusLines: string[]
  commitLines: string[]
  changedFiles: string[]
  diffStat: string
}

class HelpExit extends Error {}

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function runGit(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim()
  }
  catch (error) {
    console.error(error)
    fail(`Git command failed: git ${args.join(' ')}`)
  }
}

function tryGit(args: string[]): string | undefined {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim()
  }
  catch {
    return undefined
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    format: 'markdown',
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]

    switch (arg) {
      case '--base':
        options.baseRef = next
        i += 1
        break
      case '--format':
        if (next !== 'json' && next !== 'markdown') {
          fail(`Invalid --format value: ${next}`)
        }

        options.format = next
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

  return options
}

function printHelp() {
  console.log(`Collect deterministic branch and diff context for PR summary drafting.

Optional:
  --base <ref>            Base ref to diff against
  --format <value>        Output format: markdown or json, default: markdown
`)
}

function resolveBaseRef(preferred?: string): string {
  if (preferred) {
    if (!tryGit(['rev-parse', '--verify', preferred])) {
      fail(`Base ref not found: ${preferred}`)
    }

    return preferred
  }

  const candidates = [
    'origin/main',
    'main',
    tryGit(['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'])?.replace(/^refs\/remotes\//, ''),
  ].filter((value): value is string => Boolean(value))

  for (const candidate of candidates) {
    if (tryGit(['rev-parse', '--verify', candidate])) {
      return candidate
    }
  }

  fail(`Unable to resolve a base ref. Use --base to provide one explicitly.`)
}

function splitLines(value: string): string[] {
  if (!value) {
    return []
  }

  return value.split('\n').map(line => line.trimEnd()).filter(Boolean)
}

function collectContext(options: CliOptions): PrContext {
  const branch = runGit(['branch', '--show-current'])
  const baseRef = resolveBaseRef(options.baseRef)
  const mergeBase = runGit(['merge-base', 'HEAD', baseRef])
  const statusLines = splitLines(runGit(['status', '--short']))
  const commitLines = splitLines(runGit([
    'log',
    '--no-merges',
    '--reverse',
    '--pretty=format:%h\t%s',
    `${mergeBase}..HEAD`,
  ]))
  const changedFiles = splitLines(runGit(['diff', '--name-only', `${mergeBase}..HEAD`]))
  const diffStat = runGit(['diff', '--stat', `${mergeBase}..HEAD`])

  return {
    branch,
    baseRef,
    mergeBase,
    isWorktreeClean: statusLines.length === 0,
    statusLines,
    commitLines,
    changedFiles,
    diffStat,
  }
}

function toMarkdown(context: PrContext): string {
  const commitLines = context.commitLines.length
    ? context.commitLines.map((line) => {
        const [sha, ...rest] = line.split('\t')
        return `- \`${sha}\` ${rest.join('\t')}`
      }).join('\n')
    : '- No commits ahead of the base ref'

  const changedFiles = context.changedFiles.length
    ? context.changedFiles.map(file => `- \`${file}\``).join('\n')
    : '- No changed files'

  const worktreeStatus = context.statusLines.length
    ? context.statusLines.map(line => `- \`${line}\``).join('\n')
    : '- Clean'

  const diffStat = context.diffStat || 'No diff stat available'

  return `# PR Context

- Branch: \`${context.branch}\`
- Base ref: \`${context.baseRef}\`
- Merge base: \`${context.mergeBase}\`
- Worktree clean: ${context.isWorktreeClean ? 'yes' : 'no'}

## Commit Summary

${commitLines}

## Changed Files

${changedFiles}

## Diff Stat

\`\`\`text
${diffStat}
\`\`\`

## Worktree Status

${worktreeStatus}
`
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const context = collectContext(options)

  if (options.format === 'json') {
    console.log(JSON.stringify(context, null, 2))
    return
  }

  console.log(toMarkdown(context))
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
