/**
 * Collect deterministic merge-readiness checks for the current branch and PR.
 *
 * Usage:
 *   pnpm merge-readiness
 *   pnpm merge-readiness --format json
 *   pnpm merge-readiness --pr 19
 */

import { execFileSync } from 'node:child_process'
import process from 'node:process'

type OutputFormat = 'json' | 'markdown'

interface CliOptions {
  repo?: string
  branch?: string
  pr?: string
  baseRef?: string
  format: OutputFormat
}

interface PullRequestPayload {
  number: number
  title: string
  url: string
  state: string
  body: string
  isDraft: boolean
  baseRefName: string
  headRefName: string
  reviewDecision?: string
  mergeStateStatus?: string
}

interface IssuePayload {
  number: number
  title: string
  url: string
  state: string
  body: string
}

interface CommitReport {
  sha: string
  subject: string
  hasIssueRef: boolean
  issueNumbers: number[]
}

interface ReferencedIssue {
  number: number
  sources: string[]
  resolvedParentIssue: number | null
  state?: string
  title?: string
  url?: string
}

interface CheckResult {
  key: string
  pass: boolean
  detail: string
}

interface MergeReadinessContext {
  repo: string
  branch: string
  baseRef: string
  mergeBase: string
  worktreeStatus: string[]
  worktreeClean: boolean
  pullRequest: PullRequestPayload | null
  branchLineIssue: number | null
  commitReports: CommitReport[]
  referencedIssues: ReferencedIssue[]
  checks: CheckResult[]
  ready: boolean
}

class HelpExit extends Error {}

const commitIssueRefPattern = /\b(?:Refs?|Closes?|Fix(?:es)?|Resolves?)\s+#\d+(?:\s*,\s*#\d+)*/i
const genericIssueNumberPattern = /#(\d+)\b/g
const validationRecordPattern = /(?:^|\n)(?:#+\s*(?:Validation|验证)\b|(?:Validation|验证)\s*[:：])/i

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
      case '--pr':
        options.pr = next
        index += 1
        break
      case '--base':
        options.baseRef = next
        index += 1
        break
      case '--format':
        if (next !== 'json' && next !== 'markdown') {
          fail(`Invalid --format value: ${next}`)
        }

        options.format = next
        index += 1
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
  console.log(`Collect deterministic merge-readiness checks for the current branch and PR.

Optional:
  --repo <owner/name>     Repository name, default: current repository
  --branch <name>         Branch to compare against the current checkout, default: current branch
  --pr <number|url>       Pull request number or URL, default: current branch PR
  --base <ref>            Base ref override for commit range checks
  --format <value>        Output format: markdown or json, default: markdown
`)
}

function currentBranch() {
  return run('git', ['branch', '--show-current'])
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

function resolvePullRequest(repo: string, identifier: string): PullRequestPayload | null {
  const payload = tryRun('gh', [
    'pr',
    'view',
    identifier,
    '-R',
    repo,
    '--json',
    'number,title,url,state,body,isDraft,baseRefName,headRefName,reviewDecision,mergeStateStatus',
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

function resolveBaseRef(preferred: string | undefined, pr: PullRequestPayload | null) {
  const requested = preferred || pr?.baseRefName
  const candidates = requested
    ? [`origin/${requested}`, requested]
    : [
        tryRun('git', ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD'])?.replace(/^refs\/remotes\//, ''),
        'origin/master',
        'master',
        'origin/main',
        'main',
      ]

  for (const candidate of candidates) {
    if (candidate && tryRun('git', ['rev-parse', '--verify', candidate])) {
      return candidate
    }
  }

  fail('Unable to resolve a base ref. Re-run with --base <ref>.')
}

function splitLines(value: string) {
  if (!value) {
    return []
  }

  return value
    .split('\n')
    .map(line => line.trimEnd())
    .filter(Boolean)
}

function parseCommitReports(range: string): CommitReport[] {
  const payload = run('git', [
    'log',
    '--no-merges',
    '--reverse',
    '--format=%H%x1F%s%x1F%B%x1E',
    range,
  ])

  if (!payload) {
    return []
  }

  return payload
    .split('\x1E')
    .map(record => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [sha = '', subject = '', body = ''] = record.split('\x1F')
      const message = `${subject}\n${body}`.trim()
      return {
        sha: sha.slice(0, 7),
        subject,
        hasIssueRef: commitIssueRefPattern.test(message),
        issueNumbers: extractIssueNumbers(message),
      }
    })
}

function extractIssueNumbers(value: string) {
  const matches = new Set<number>()
  for (const match of value.matchAll(genericIssueNumberPattern)) {
    matches.add(Number(match[1]))
  }

  return [...matches]
}

function parseBranchLineIssue(branch: string) {
  const match = branch.match(/(?:^|\/)issue-(\d+)-/i)
  if (!match) {
    return null
  }

  return Number(match[1])
}

function resolveIssue(repo: string, issueNumber: number): ReferencedIssue {
  const payload = tryRun('gh', [
    'issue',
    'view',
    String(issueNumber),
    '-R',
    repo,
    '--json',
    'number,title,url,state,body',
  ])

  if (!payload) {
    return {
      number: issueNumber,
      sources: [],
      resolvedParentIssue: null,
    }
  }

  try {
    const issue = JSON.parse(payload) as IssuePayload
    return {
      number: issue.number,
      sources: [],
      resolvedParentIssue: extractParentIssue(issue.body) ?? issue.number,
      state: issue.state,
      title: issue.title,
      url: issue.url,
    }
  }
  catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    fail(`Failed to parse issue payload for #${issueNumber}: ${reason}`)
  }
}

function extractParentIssue(body: string) {
  const match = body.match(/(?:^|\n)Parent:\s*#(\d+)\b/i)
  if (!match) {
    return null
  }

  return Number(match[1])
}

function issueSources(pr: PullRequestPayload | null, commits: CommitReport[]) {
  const sources = new Map<number, Set<string>>()

  for (const issueNumber of extractIssueNumbers(pr?.body ?? '')) {
    if (!sources.has(issueNumber)) {
      sources.set(issueNumber, new Set())
    }

    sources.get(issueNumber)?.add('pr-body')
  }

  for (const commit of commits) {
    for (const issueNumber of commit.issueNumbers) {
      if (!sources.has(issueNumber)) {
        sources.set(issueNumber, new Set())
      }

      sources.get(issueNumber)?.add(`commit:${commit.sha}`)
    }
  }

  return sources
}

function collectChecks(context: Omit<MergeReadinessContext, 'checks' | 'ready'>): CheckResult[] {
  const commitIssueRefsPresent = context.commitReports.length > 0
    && context.commitReports.every(commit => commit.hasIssueRef)
  const prIssueRefsPresent = extractIssueNumbers(context.pullRequest?.body ?? '').length > 0
  const prValidationRecorded = validationRecordPattern.test(context.pullRequest?.body ?? '')
  const prHeadMatchesBranch = context.pullRequest?.headRefName === context.branch
  const branchLineMatchesReferencedIssues = context.branchLineIssue !== null
    && context.referencedIssues.length > 0
    && context.referencedIssues.every(issue => issue.resolvedParentIssue === context.branchLineIssue)
  const mergeStateAcceptable = context.pullRequest?.mergeStateStatus
    ? ['CLEAN', 'HAS_HOOKS'].includes(context.pullRequest.mergeStateStatus)
    : false

  return [
    {
      key: 'worktree-clean',
      pass: context.worktreeClean,
      detail: context.worktreeClean ? 'working tree is clean' : `uncommitted changes: ${context.worktreeStatus.join(', ')}`,
    },
    {
      key: 'pull-request-open',
      pass: context.pullRequest?.state === 'OPEN',
      detail: context.pullRequest
        ? `PR #${context.pullRequest.number} is ${context.pullRequest.state}`
        : 'no pull request found for the current branch',
    },
    {
      key: 'pull-request-not-draft',
      pass: context.pullRequest ? !context.pullRequest.isDraft : false,
      detail: context.pullRequest
        ? (context.pullRequest.isDraft ? 'PR is still draft' : 'PR is ready for review')
        : 'no pull request found for the current branch',
    },
    {
      key: 'pull-request-head-matches-branch',
      pass: Boolean(context.pullRequest) && prHeadMatchesBranch,
      detail: context.pullRequest
        ? `PR head is ${context.pullRequest.headRefName}`
        : 'no pull request found for the current branch',
    },
    {
      key: 'commit-issue-refs-present',
      pass: commitIssueRefsPresent,
      detail: context.commitReports.length
        ? (commitIssueRefsPresent ? 'all commits contain issue refs' : 'one or more commits are missing issue refs')
        : 'no commits ahead of the base ref',
    },
    {
      key: 'pr-issue-refs-present',
      pass: prIssueRefsPresent,
      detail: prIssueRefsPresent ? 'PR body contains issue refs' : 'PR body does not contain issue refs',
    },
    {
      key: 'pr-validation-recorded',
      pass: prValidationRecorded,
      detail: prValidationRecorded ? 'PR body contains a validation section' : 'PR body does not contain a validation section',
    },
    {
      key: 'branch-line-detected',
      pass: context.branchLineIssue !== null,
      detail: context.branchLineIssue !== null
        ? `branch line issue is #${context.branchLineIssue}`
        : 'branch name does not encode an issue line',
    },
    {
      key: 'branch-line-matches-referenced-issues',
      pass: branchLineMatchesReferencedIssues,
      detail: branchLineMatchesReferencedIssues
        ? 'all referenced issues resolve to the current branch line'
        : 'referenced issues do not all resolve to the current branch line',
    },
    {
      key: 'pull-request-merge-state',
      pass: mergeStateAcceptable,
      detail: context.pullRequest?.mergeStateStatus
        ? `GitHub reports merge state ${context.pullRequest.mergeStateStatus}`
        : 'GitHub did not report a merge state',
    },
  ]
}

function collectContext(options: CliOptions): MergeReadinessContext {
  const repo = resolveRepo(options.repo)
  const branch = options.branch?.trim() || currentBranch()
  const pullRequest = resolvePullRequest(repo, options.pr?.trim() || branch)
  const baseRef = resolveBaseRef(options.baseRef, pullRequest)
  const mergeBase = run('git', ['merge-base', 'HEAD', baseRef])
  const worktreeStatus = splitLines(run('git', ['status', '--short']))
  const commitReports = parseCommitReports(`${mergeBase}..HEAD`)
  const sourceMap = issueSources(pullRequest, commitReports)
  const referencedIssues = [...sourceMap.entries()]
    .sort(([left], [right]) => left - right)
    .map(([issueNumber, sources]) => {
      const issue = resolveIssue(repo, issueNumber)
      return {
        ...issue,
        sources: [...sources].sort(),
      }
    })
  const branchLineIssue = parseBranchLineIssue(branch)
  const baseContext = {
    repo,
    branch,
    baseRef,
    mergeBase,
    worktreeStatus,
    worktreeClean: worktreeStatus.length === 0,
    pullRequest,
    branchLineIssue,
    commitReports,
    referencedIssues,
  }
  const checks = collectChecks(baseContext)

  return {
    ...baseContext,
    checks,
    ready: checks.every(check => check.pass),
  }
}

function toMarkdown(context: MergeReadinessContext): string {
  const checks = context.checks
    .map(check => `- ${check.pass ? 'PASS' : 'FAIL'} \`${check.key}\`: ${check.detail}`)
    .join('\n')

  const commits = context.commitReports.length
    ? context.commitReports.map((commit) => {
        const issues = commit.issueNumbers.length ? commit.issueNumbers.map(issue => `#${issue}`).join(', ') : 'none'
        return `- \`${commit.sha}\` ${commit.subject} | issue refs: ${commit.hasIssueRef ? 'yes' : 'no'} | issues: ${issues}`
      }).join('\n')
    : '- No commits ahead of the base ref'

  const issues = context.referencedIssues.length
    ? context.referencedIssues.map((issue) => {
        const parent = issue.resolvedParentIssue !== null ? `#${issue.resolvedParentIssue}` : 'unresolved'
        const title = issue.title ?? '(unresolved issue)'
        const url = issue.url ?? ''
        const label = url ? `[#${issue.number}](${url}) ${title}` : `#${issue.number} ${title}`
        return `- ${label} | parent line: ${parent} | sources: ${issue.sources.join(', ')}`
      }).join('\n')
    : '- No referenced issues found'

  return `# Merge Readiness

- Repo: \`${context.repo}\`
- Branch: \`${context.branch}\`
- Base ref: \`${context.baseRef}\`
- Merge base: \`${context.mergeBase}\`
- PR: ${context.pullRequest ? `[#${context.pullRequest.number}](${context.pullRequest.url}) ${context.pullRequest.title}` : 'none'}
- PR state: ${context.pullRequest ? `${context.pullRequest.state}${context.pullRequest.isDraft ? ' (draft)' : ''}` : 'none'}
- Review decision: \`${context.pullRequest?.reviewDecision || 'none'}\`
- Merge state: \`${context.pullRequest?.mergeStateStatus || 'none'}\`
- Branch line issue: ${context.branchLineIssue !== null ? `#${context.branchLineIssue}` : 'none'}
- Ready: ${context.ready ? 'yes' : 'no'}

## Checks

${checks}

## Commits

${commits}

## Referenced Issues

${issues}
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
