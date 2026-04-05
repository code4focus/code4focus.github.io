/**
 * Resolve the pull request associated with the current branch.
 *
 * Usage:
 *   pnpm current-pr
 *   pnpm current-pr --format json
 *   pnpm current-pr --branch user/issue-2-workflow-baseline --allow-missing
 */

import { execFileSync } from 'node:child_process'
import process from 'node:process'

type OutputFormat = 'json' | 'markdown'

interface CliOptions {
  repo?: string
  branch?: string
  format: OutputFormat
  allowMissing: boolean
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
  author?: {
    login: string
  }
}

interface CurrentPrContext {
  repo: string
  branch: string
  defaultBaseRef?: string
  pullRequest: PullRequestPayload | null
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
    format: 'markdown',
    allowMissing: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    switch (arg) {
      case '--repo':
        options.repo = next
        index += 1
        break
      case '--branch':
        options.branch = next
        index += 1
        break
      case '--format':
        if (next !== 'json' && next !== 'markdown') {
          fail(`Invalid --format value: ${next}`)
        }

        options.format = next
        index += 1
        break
      case '--allow-missing':
        options.allowMissing = true
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
  console.log(`Resolve the pull request associated with the current branch.

Optional:
  --repo <owner/name>     Repository name, default: current repository
  --branch <name>         Branch to resolve, default: current branch
  --format <value>        Output format: markdown or json, default: markdown
  --allow-missing         Return an empty result instead of failing when no PR is found
`)
}

function currentBranch() {
  return run('git', ['branch', '--show-current'])
}

function resolveRepo(preferred?: string): RepoPayload {
  if (preferred) {
    return {
      nameWithOwner: preferred,
    }
  }

  const payload = run('gh', ['repo', 'view', '--json', 'nameWithOwner,defaultBranchRef'])

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
    'number,title,url,state,isDraft,baseRefName,headRefName,author',
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

function collectContext(options: CliOptions): CurrentPrContext {
  const repo = resolveRepo(options.repo)
  const branch = options.branch?.trim() || currentBranch()
  const pullRequest = resolvePullRequest(repo.nameWithOwner, branch)

  if (!pullRequest && !options.allowMissing) {
    fail(`No pull request found for branch "${branch}" in ${repo.nameWithOwner}. Re-run with --allow-missing if this is expected.`)
  }

  return {
    repo: repo.nameWithOwner,
    branch,
    defaultBaseRef: repo.defaultBranchRef?.name,
    pullRequest,
  }
}

function toMarkdown(context: CurrentPrContext): string {
  if (!context.pullRequest) {
    return `# Current PR

- Repo: \`${context.repo}\`
- Branch: \`${context.branch}\`
- Pull request: none
- Default base: \`${context.defaultBaseRef ?? 'unknown'}\`
`
  }

  const pr = context.pullRequest

  return `# Current PR

- Repo: \`${context.repo}\`
- Branch: \`${context.branch}\`
- Pull request: [#${pr.number}](${pr.url}) ${pr.title}
- State: ${pr.state}${pr.isDraft ? ' (draft)' : ''}
- Base: \`${pr.baseRefName}\`
- Head: \`${pr.headRefName}\`
- Author: \`${pr.author?.login ?? 'unknown'}\`
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
