/**
 * Post a templated completion comment to a GitHub issue and optionally close it.
 *
 * Usage:
 *   pnpm complete-issue --issue 13 --scope "Added scripts" --validation "pnpm lint"
 *   pnpm complete-issue --issue 13 --body-file /tmp/comment.md --close
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

interface CliOptions {
  repo: string
  issue: number
  bodyFile?: string
  summary: string
  scope: string[]
  commits: string[]
  validation: string[]
  notes: string[]
  close: boolean
}

class HelpExit extends Error {}

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function runGh(args: string[]): string {
  try {
    return execFileSync('gh', args, { encoding: 'utf8' }).trim()
  }
  catch (error) {
    console.error(error)
    fail(`GitHub CLI command failed: gh ${args.join(' ')}`)
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    repo: 'code4focus/code4focus.github.io',
    issue: Number.NaN,
    summary: '已完成。',
    scope: [],
    commits: [],
    validation: [],
    notes: [],
    close: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]

    switch (arg) {
      case '--repo':
        options.repo = next
        i += 1
        break
      case '--issue':
        options.issue = Number(next)
        i += 1
        break
      case '--body-file':
        options.bodyFile = next
        i += 1
        break
      case '--summary':
        options.summary = next
        i += 1
        break
      case '--scope':
        options.scope.push(next)
        i += 1
        break
      case '--commit':
        options.commits.push(next)
        i += 1
        break
      case '--validation':
        options.validation.push(next)
        i += 1
        break
      case '--note':
        options.notes.push(next)
        i += 1
        break
      case '--close':
        options.close = true
        break
      case '--help':
      case '-h':
        printHelp()
        throw new HelpExit()
      default:
        fail(`Unknown argument: ${arg}`)
    }
  }

  if (Number.isNaN(options.issue) || options.issue <= 0) {
    fail(`Missing or invalid --issue`)
  }

  if (!options.bodyFile && !hasStructuredContent(options)) {
    fail(`Provide --body-file or at least one of --scope, --commit, --validation, or --note`)
  }

  return options
}

function hasStructuredContent(options: CliOptions): boolean {
  return options.scope.length > 0
    || options.commits.length > 0
    || options.validation.length > 0
    || options.notes.length > 0
}

function printHelp() {
  console.log(`Post a templated completion comment to a GitHub issue and optionally close it.

Required:
  --issue <number>        Issue number

Optional:
  --repo <owner/name>     Repository name, default: code4focus/code4focus.github.io
  --body-file <path>      Use an existing comment body file
  --summary <text>        Summary line, default: 已完成。
  --scope <text>          Repeatable implementation scope item
  --commit <text>         Repeatable related commit item
  --validation <text>     Repeatable validation item
  --note <text>           Repeatable note item
  --close                 Close the issue after posting the comment
`)
}

function renderSection(title: string, items: string[]): string {
  if (items.length === 0) {
    return ''
  }

  const lines = items.map(item => `- ${item}`).join('\n')
  return `${title}\n${lines}`
}

function buildBody(options: CliOptions): string {
  if (options.bodyFile) {
    return readFileSync(options.bodyFile, 'utf8')
  }

  const sections = [
    options.summary,
    renderSection('实现范围：', options.scope),
    renderSection('关联提交：', options.commits),
    renderSection('验证：', options.validation),
    renderSection('说明：', options.notes),
  ].filter(Boolean)

  return `${sections.join('\n\n')}\n`
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const tempDir = mkdtempSync(join(tmpdir(), 'issue-complete-'))
  const bodyPath = join(tempDir, 'comment.md')

  try {
    writeFileSync(bodyPath, buildBody(options))

    runGh([
      'issue',
      'comment',
      String(options.issue),
      '-R',
      options.repo,
      '--body-file',
      bodyPath,
    ])

    console.log(`✅ Commented on issue #${options.issue}`)

    if (options.close) {
      runGh([
        'issue',
        'close',
        String(options.issue),
        '-R',
        options.repo,
      ])

      console.log(`✅ Closed issue #${options.issue}`)
    }
  }
  finally {
    rmSync(tempDir, { recursive: true, force: true })
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
