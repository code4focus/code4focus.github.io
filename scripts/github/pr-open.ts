/**
 * Open a pull request through the GitHub CLI with deterministic defaults.
 *
 * Usage:
 *   pnpm pr-open --title "..." --body-file /tmp/pr.md
 *   pnpm pr-open --base user/code4focus --title "..." --body "..." --draft
 *   pnpm pr-open --allow-existing --dry-run --title "..." --body "..."
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

interface CliOptions {
  repo?: string
  base?: string
  head?: string
  title: string
  body?: string
  bodyFile?: string
  draft: boolean
  allowExisting: boolean
  dryRun: boolean
}

interface RepoPayload {
  nameWithOwner: string
  defaultBranchRef?: {
    name: string
  }
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

function tryRun(command: string, args: string[]): string | undefined {
  try {
    return execFileSync(command, args, { encoding: 'utf8' }).trim()
  }
  catch {
    return undefined
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    title: '',
    draft: false,
    allowExisting: false,
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
      case '--base':
        options.base = next
        index += 1
        break
      case '--head':
        options.head = next
        index += 1
        break
      case '--title':
        options.title = next ?? ''
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
      case '--draft':
        options.draft = true
        break
      case '--allow-existing':
        options.allowExisting = true
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

  if (!options.title.trim()) {
    fail('Missing --title')
  }

  if (options.body && options.bodyFile) {
    fail('Use either --body or --body-file, not both.')
  }

  if (!options.body && !options.bodyFile) {
    fail('Provide --body or --body-file.')
  }

  return options
}

function printHelp() {
  console.log(`Open a pull request through the GitHub CLI with deterministic defaults.

Required:
  --title <text>          Pull request title
  --body <text>           Pull request body text
  --body-file <path>      Existing markdown file for the pull request body

Optional:
  --repo <owner/name>     Repository name, default: current repository
  --base <branch>         Base branch, default: repository default branch
  --head <branch>         Head branch, default: current branch
  --draft                 Create the pull request as a draft
  --allow-existing        Return the existing PR for this branch instead of failing
  --dry-run               Print resolved action without mutating GitHub state
`)
}

function currentBranch() {
  return run('git', ['branch', '--show-current'])
}

function resolveRepo(preferred?: string): RepoPayload {
  const args = ['repo', 'view']
  if (preferred) {
    args.push(preferred)
  }

  args.push('--json', 'nameWithOwner,defaultBranchRef')
  const payload = run('gh', args)

  try {
    return JSON.parse(payload) as RepoPayload
  }
  catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    fail(`Failed to parse repository payload: ${reason}`)
  }
}

function resolvePullRequest(repo: string, branch: string): PullRequestPayload | null {
  const payload = tryRun('gh', [
    'pr',
    'view',
    branch,
    '-R',
    repo,
    '--json',
    'number,title,url,state,isDraft,baseRefName,headRefName',
  ])

  if (!payload) {
    return null
  }

  try {
    return JSON.parse(payload) as PullRequestPayload
  }
  catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    fail(`Failed to parse pull request payload: ${reason}`)
  }
}

function readBody(options: CliOptions) {
  if (options.bodyFile) {
    return readFileSync(options.bodyFile, 'utf8')
  }

  return options.body ?? ''
}

function bodyPathForWrite(body: string) {
  const tempDir = mkdtempSync(join(tmpdir(), 'pr-open-'))
  const path = join(tempDir, 'body.md')
  writeFileSync(path, body)
  return { tempDir, path }
}

function collectResolvedState(options: CliOptions) {
  const repo = resolveRepo(options.repo)
  const head = options.head?.trim() || currentBranch()
  const base = options.base?.trim() || repo.defaultBranchRef?.name

  if (!base) {
    fail(`Unable to resolve a base branch for ${repo.nameWithOwner}.`)
  }

  const existingPr = resolvePullRequest(repo.nameWithOwner, head)
  return {
    repo: repo.nameWithOwner,
    base,
    head,
    existingPr,
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const resolved = collectResolvedState(options)

  if (resolved.existingPr && !options.allowExisting) {
    fail(`A pull request already exists for branch "${resolved.head}": ${resolved.existingPr.url}. Re-run with --allow-existing if you want idempotent behavior.`)
  }

  const action = resolved.existingPr ? 'existing' : 'create'
  if (options.dryRun) {
    console.log(JSON.stringify({
      repo: resolved.repo,
      base: resolved.base,
      head: resolved.head,
      title: options.title,
      draft: options.draft,
      action,
      existingPr: resolved.existingPr,
    }, null, 2))
    return
  }

  if (resolved.existingPr) {
    console.log(JSON.stringify({
      repo: resolved.repo,
      base: resolved.base,
      head: resolved.head,
      action,
      pullRequest: resolved.existingPr,
    }, null, 2))
    return
  }

  const body = readBody(options)
  const bodyPath = bodyPathForWrite(body)

  try {
    const args = [
      'pr',
      'create',
      '-R',
      resolved.repo,
      '--base',
      resolved.base,
      '--head',
      resolved.head,
      '--title',
      options.title,
      '--body-file',
      bodyPath.path,
    ]

    if (options.draft) {
      args.push('--draft')
    }

    const url = run('gh', args)
    const pullRequest = resolvePullRequest(resolved.repo, resolved.head)

    console.log(JSON.stringify({
      repo: resolved.repo,
      base: resolved.base,
      head: resolved.head,
      action,
      url,
      pullRequest,
    }, null, 2))
  }
  finally {
    rmSync(bodyPath.tempDir, { recursive: true, force: true })
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
