/**
 * Update an existing pull request through the GitHub CLI.
 *
 * Usage:
 *   pnpm pr-update --pr 19 --title "..." --body-file /tmp/pr.md
 *   pnpm pr-update --branch user/issue-2-workflow-baseline --base user/code4focus
 *   pnpm pr-update --pr 19 --body "..." --dry-run
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

interface CliOptions {
  repo?: string
  pr?: string
  branch?: string
  title?: string
  body?: string
  bodyFile?: string
  base?: string
  ready: boolean
  draft: boolean
  dryRun: boolean
}

interface PullRequestPayload {
  number: number
  title: string
  url: string
  state: string
  isDraft: boolean
  baseRefName: string
  headRefName: string
}

class HelpExit extends Error {}

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function run(command: string, args: string[]): string {
  try {
    return execFileSync(command, args, { encoding: 'utf8' }).trim()
  }
  catch (error) {
    console.error(error)
    fail(`Command failed: ${command} ${args.join(' ')}`)
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    ready: false,
    draft: false,
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
      case '--pr':
        options.pr = next
        index += 1
        break
      case '--branch':
        options.branch = next
        index += 1
        break
      case '--title':
        options.title = next
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
      case '--base':
        options.base = next
        index += 1
        break
      case '--ready':
        options.ready = true
        break
      case '--draft':
        options.draft = true
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

  if (options.body && options.bodyFile) {
    fail('Use either --body or --body-file, not both.')
  }

  if (options.ready && options.draft) {
    fail('Choose either --ready or --draft, not both.')
  }

  if (!options.pr && !options.branch) {
    options.branch = run('git', ['branch', '--show-current'])
  }

  if (!options.title && !options.body && !options.bodyFile && !options.base && !options.ready && !options.draft) {
    fail('Provide at least one update: --title, --body, --body-file, --base, --ready, or --draft.')
  }

  return options
}

function printHelp() {
  console.log(`Update an existing pull request through the GitHub CLI.

Optional:
  --repo <owner/name>     Repository name, default: current repository
  --pr <number|url>       Pull request number or URL
  --branch <name>         Branch whose PR should be updated, default: current branch
  --title <text>          Updated pull request title
  --body <text>           Updated pull request body text
  --body-file <path>      Existing markdown file for the pull request body
  --base <branch>         Updated base branch
  --ready                 Mark the pull request ready for review
  --draft                 Convert the pull request back to draft
  --dry-run               Print resolved action without mutating GitHub state
`)
}

function resolveRepo(preferred?: string) {
  const args = ['repo', 'view']
  if (preferred) {
    args.push(preferred)
  }

  args.push('--json', 'nameWithOwner')
  const payload = run('gh', args)

  try {
    const parsed = JSON.parse(payload) as { nameWithOwner: string }
    return parsed.nameWithOwner
  }
  catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    fail(`Failed to parse repository payload: ${reason}`)
  }
}

function resolveIdentifier(options: CliOptions) {
  return options.pr?.trim() || options.branch?.trim() || fail('Unable to resolve a pull request identifier.')
}

function readBody(options: CliOptions) {
  if (options.bodyFile) {
    return readFileSync(options.bodyFile, 'utf8')
  }

  return options.body
}

function fetchPullRequest(repo: string, identifier: string): PullRequestPayload {
  const payload = run('gh', [
    'pr',
    'view',
    identifier,
    '-R',
    repo,
    '--json',
    'number,title,url,state,isDraft,baseRefName,headRefName',
  ])

  try {
    return JSON.parse(payload) as PullRequestPayload
  }
  catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    fail(`Failed to parse pull request payload: ${reason}`)
  }
}

function bodyPathForWrite(body: string) {
  const tempDir = mkdtempSync(join(tmpdir(), 'pr-update-'))
  const path = join(tempDir, 'body.md')
  writeFileSync(path, body)
  return { tempDir, path }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const repo = resolveRepo(options.repo)
  const identifier = resolveIdentifier(options)
  const before = fetchPullRequest(repo, identifier)

  if (options.dryRun) {
    console.log(JSON.stringify({
      repo,
      identifier,
      before,
      changes: {
        title: options.title ?? null,
        body: Boolean(options.body || options.bodyFile),
        base: options.base ?? null,
        ready: options.ready,
        draft: options.draft,
      },
    }, null, 2))
    return
  }

  let tempDir: string | undefined
  try {
    const editArgs = [
      'pr',
      'edit',
      identifier,
      '-R',
      repo,
    ]

    if (options.title) {
      editArgs.push('--title', options.title)
    }

    if (options.base) {
      editArgs.push('--base', options.base)
    }

    const body = readBody(options)
    if (body) {
      const bodyPath = bodyPathForWrite(body)
      tempDir = bodyPath.tempDir
      editArgs.push('--body-file', bodyPath.path)
    }

    if (editArgs.length > 5) {
      run('gh', editArgs)
    }

    if (options.ready) {
      run('gh', ['pr', 'ready', identifier, '-R', repo])
    }

    if (options.draft) {
      run('gh', ['pr', 'ready', identifier, '-R', repo, '--undo'])
    }

    const after = fetchPullRequest(repo, identifier)
    console.log(JSON.stringify({
      repo,
      identifier,
      before,
      after,
    }, null, 2))
  }
  finally {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true })
    }
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
