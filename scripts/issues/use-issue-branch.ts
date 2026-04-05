/**
 * Resolve an issue onto its parent-issue branch line and switch to it.
 *
 * Usage:
 *   pnpm issue-branch --issue 9
 *   pnpm issue-branch --issue 2 --slug workflow-baseline --base user/code4focus
 *   pnpm issue-branch --issue 4 --dry-run
 */

import { execFileSync } from 'node:child_process'
import process from 'node:process'

interface CliOptions {
  repo: string
  issue: number
  prefix: string
  slug?: string
  base?: string
  branch?: string
  dryRun: boolean
}

interface IssuePayload {
  number: number
  body: string
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
    repo: 'code4focus/code4focus.github.io',
    issue: Number.NaN,
    prefix: 'user',
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
      case '--prefix':
        options.prefix = next
        index += 1
        break
      case '--slug':
        options.slug = next
        index += 1
        break
      case '--base':
        options.base = next
        index += 1
        break
      case '--branch':
        options.branch = next
        index += 1
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

  return options
}

function printHelp() {
  console.log(`Resolve an issue onto its parent-issue branch line and switch to it.

Required:
  --issue <number>        Issue or sub-issue number

Optional:
  --repo <owner/name>     Repository name, default: code4focus/code4focus.github.io
  --prefix <text>         Branch prefix, default: user
  --slug <text>           Semantic slug for creating the first branch line under a parent issue
  --base <ref>            Base ref for creating a new branch, default: current HEAD
  --branch <name>         Explicit branch to use when multiple parent-issue branches exist
  --dry-run               Print the resolved branch without switching
`)
}

function fetchIssue(options: CliOptions): IssuePayload {
  const payload = run('gh', [
    'issue',
    'view',
    String(options.issue),
    '-R',
    options.repo,
    '--json',
    'number,body',
  ])

  try {
    return JSON.parse(payload) as IssuePayload
  }
  catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    fail(`Failed to parse issue payload: ${reason}`)
  }
}

function parseParentIssueNumber(body: string): number | null {
  const match = body.match(/(?:^|\n)Parent:\s*#(\d+)\b/i)
  return match ? Number(match[1]) : null
}

function listBranches(args: string[]): string[] {
  const output = run('git', args)
  return output
    ? output.split('\n').map(item => item.trim()).filter(Boolean)
    : []
}

function currentBranch() {
  return run('git', ['branch', '--show-current'])
}

function normalizeRemoteBranch(remoteBranch: string) {
  return remoteBranch.replace(/^origin\//, '')
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slug) {
    fail(`Invalid --slug "${value}". Use ASCII letters or numbers.`)
  }

  return slug
}

function switchToBranch(branchName: string, localBranches: string[], remoteBranches: string[]) {
  if (localBranches.includes(branchName)) {
    run('git', ['switch', branchName])
    return
  }

  if (remoteBranches.includes(`origin/${branchName}`)) {
    run('git', ['switch', '--track', '-c', branchName, `origin/${branchName}`])
    return
  }

  fail(`Resolved branch "${branchName}" no longer exists locally or on origin.`)
}

function createBranch(branchName: string, baseRef?: string) {
  const args = baseRef
    ? ['switch', '-c', branchName, baseRef]
    : ['switch', '-c', branchName]

  run('git', args)
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const issue = fetchIssue(options)
  const parentIssue = parseParentIssueNumber(issue.body)
  const branchIssue = parentIssue ?? issue.number
  const branchPattern = `${options.prefix}/issue-${branchIssue}-*`
  const localBranches = listBranches(['branch', '--format', '%(refname:short)', '--list', branchPattern])
  const remoteBranches = listBranches(['branch', '-r', '--format', '%(refname:short)', '--list', `origin/${branchPattern}`])
  const candidateBranches = new Set([
    ...localBranches,
    ...remoteBranches.map(normalizeRemoteBranch),
  ])

  let branchName = options.branch?.trim() ?? ''
  if (!branchName) {
    if (candidateBranches.size === 1) {
      branchName = [...candidateBranches][0]
    }
    else if (candidateBranches.size > 1) {
      fail(`Multiple branch lines match parent issue #${branchIssue}: ${[...candidateBranches].join(', ')}. Re-run with --branch.`)
    }
    else {
      if (!options.slug) {
        fail(`No existing branch line found for parent issue #${branchIssue}. Re-run with --slug to create the first semantic branch line.`)
      }

      branchName = `${options.prefix}/issue-${branchIssue}-${slugify(options.slug)}`
    }
  }

  const action = candidateBranches.size === 0 ? 'create' : 'switch'
  const current = currentBranch()

  if (options.dryRun) {
    console.log(JSON.stringify({
      issue: issue.number,
      parentIssue: parentIssue ?? issue.number,
      currentBranch: current,
      branch: branchName,
      action,
      base: options.base ?? null,
    }, null, 2))
    return
  }

  if (current === branchName) {
    console.log(`ℹ️ Already on ${branchName}`)
    return
  }

  if (action === 'create') {
    createBranch(branchName, options.base)
    console.log(`✅ Created and switched to ${branchName}`)
    return
  }

  switchToBranch(branchName, localBranches, remoteBranches)
  console.log(`✅ Switched to ${branchName}`)
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
