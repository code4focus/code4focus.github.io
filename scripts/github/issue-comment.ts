/**
 * Comment on, reopen, or close a GitHub issue through the GitHub CLI.
 *
 * Usage:
 *   pnpm issue-comment --issue 8 --body "Queued next workflow step"
 *   pnpm issue-comment --issue 8 --body-file /tmp/comment.md --close
 *   pnpm issue-comment --issue 8 --reopen --dry-run
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

interface CliOptions {
  repo: string
  issue: number
  body?: string
  bodyFile?: string
  reopen: boolean
  close: boolean
  dryRun: boolean
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
    reopen: false,
    close: false,
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    switch (arg) {
      case '--repo':
        options.repo = next
        index += 1
        break
      case '--issue':
        options.issue = Number(next)
        index += 1
        break
      case '--body':
        options.body = next
        index += 1
        break
      case '--body-file':
        options.bodyFile = next
        index += 1
        break
      case '--reopen':
        options.reopen = true
        break
      case '--close':
        options.close = true
        break
      case '--dry-run':
        options.dryRun = true
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
    fail('Missing or invalid --issue')
  }

  if (options.body && options.bodyFile) {
    fail('Use either --body or --body-file, not both.')
  }

  if (!options.body && !options.bodyFile && !options.reopen && !options.close) {
    fail('Provide at least one action: --body, --body-file, --reopen, or --close.')
  }

  if (options.reopen && options.close) {
    fail('Choose either --reopen or --close, not both.')
  }

  return options
}

function printHelp() {
  console.log(`Comment on, reopen, or close a GitHub issue through the GitHub CLI.

Required:
  --issue <number>        Issue number

Optional:
  --repo <owner/name>     Repository name, default: code4focus/code4focus.github.io
  --body <text>           Comment body text
  --body-file <path>      Existing markdown file for the comment body
  --reopen                Reopen the issue before commenting
  --close                 Close the issue after commenting
  --dry-run               Print planned actions without mutating GitHub state
`)
}

function resolveBody(options: CliOptions): string | undefined {
  if (options.bodyFile) {
    return readFileSync(options.bodyFile, 'utf8')
  }

  return options.body
}

function actionSummary(options: CliOptions, body?: string) {
  return JSON.stringify({
    repo: options.repo,
    issue: options.issue,
    reopen: options.reopen,
    close: options.close,
    comment: Boolean(body),
    bodyPreview: body ? body.slice(0, 120) : '',
  }, null, 2)
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const body = resolveBody(options)

  if (options.dryRun) {
    console.log(actionSummary(options, body))
    return
  }

  const tempDir = mkdtempSync(join(tmpdir(), 'issue-comment-'))
  const bodyPath = join(tempDir, 'comment.md')

  try {
    if (options.reopen) {
      runGh([
        'issue',
        'reopen',
        String(options.issue),
        '-R',
        options.repo,
      ])

      console.log(`✅ Reopened issue #${options.issue}`)
    }

    if (body) {
      writeFileSync(bodyPath, body)
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
    }

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
