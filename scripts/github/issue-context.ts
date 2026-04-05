/**
 * Collect deterministic GitHub issue context for workflow and delivery tasks.
 *
 * Usage:
 *   pnpm issue-context --issue 8
 *   pnpm issue-context --issue 8 --format json
 *   pnpm issue-context --issue 8 --comments 5
 */

import { execFileSync } from 'node:child_process'
import process from 'node:process'

type OutputFormat = 'json' | 'markdown'

interface CliOptions {
  repo: string
  issue: number
  format: OutputFormat
  comments: number
}

interface UserPayload {
  login: string
}

interface LabelPayload {
  name: string
}

interface CommentPayload {
  author?: UserPayload
  body: string
  createdAt: string
  url: string
}

interface IssuePayload {
  number: number
  title: string
  url: string
  state: string
  body: string
  createdAt: string
  closedAt?: string
  author?: UserPayload
  labels: LabelPayload[]
  assignees: UserPayload[]
  comments?: CommentPayload[]
}

interface IssueSummary {
  number: number
  title: string
  url: string
  state: string
}

interface IssueContext {
  repo: string
  issue: IssueSummary
  author?: string
  createdAt: string
  closedAt?: string
  labels: string[]
  assignees: string[]
  bodyPreview: string
  parentIssue: IssueSummary | null
  recentComments: Array<{
    author?: string
    createdAt: string
    url: string
    bodyPreview: string
  }>
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
    format: 'markdown',
    comments: 3,
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
      case '--format':
        if (next !== 'json' && next !== 'markdown') {
          fail(`Invalid --format value: ${next}`)
        }

        options.format = next
        index += 1
        break
      case '--comments':
        options.comments = Number(next)
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

  if (Number.isNaN(options.issue) || options.issue <= 0) {
    fail('Missing or invalid --issue')
  }

  if (!Number.isInteger(options.comments) || options.comments < 0) {
    fail('Invalid --comments value')
  }

  return options
}

function printHelp() {
  console.log(`Collect deterministic GitHub issue context for workflow and delivery tasks.

Required:
  --issue <number>        Issue number

Optional:
  --repo <owner/name>     Repository name, default: code4focus/code4focus.github.io
  --format <value>        Output format: markdown or json, default: markdown
  --comments <number>     Recent comment count, default: 3
`)
}

function fetchIssue(repo: string, issueNumber: number, includeComments: boolean): IssuePayload {
  const fields = [
    'number',
    'title',
    'url',
    'state',
    'body',
    'createdAt',
    'closedAt',
    'author',
    'labels',
    'assignees',
  ]

  if (includeComments) {
    fields.push('comments')
  }

  const payload = runGh([
    'issue',
    'view',
    String(issueNumber),
    '-R',
    repo,
    '--json',
    fields.join(','),
  ])

  try {
    return JSON.parse(payload) as IssuePayload
  }
  catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    fail(`Failed to parse issue payload: ${reason}`)
  }
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function previewText(value: string, maxLength = 240) {
  const collapsed = collapseWhitespace(value)
  if (!collapsed) {
    return ''
  }

  if (collapsed.length <= maxLength) {
    return collapsed
  }

  return `${collapsed.slice(0, maxLength - 1).trimEnd()}…`
}

function extractParentIssueNumber(body: string): number | null {
  const match = body.match(/(?:^|\n)Parent:\s*#(\d+)\b/i)
  if (!match) {
    return null
  }

  return Number(match[1])
}

function toSummary(issue: IssuePayload): IssueSummary {
  return {
    number: issue.number,
    title: issue.title,
    url: issue.url,
    state: issue.state,
  }
}

function collectContext(options: CliOptions): IssueContext {
  const issue = fetchIssue(options.repo, options.issue, options.comments > 0)
  const parentNumber = extractParentIssueNumber(issue.body)
  const parentIssue = parentNumber
    ? toSummary(fetchIssue(options.repo, parentNumber, false))
    : null

  const recentComments = (issue.comments ?? [])
    .slice(-options.comments)
    .map(comment => ({
      author: comment.author?.login,
      createdAt: comment.createdAt,
      url: comment.url,
      bodyPreview: previewText(comment.body, 180),
    }))

  return {
    repo: options.repo,
    issue: toSummary(issue),
    author: issue.author?.login,
    createdAt: issue.createdAt,
    closedAt: issue.closedAt,
    labels: issue.labels.map(label => label.name),
    assignees: issue.assignees.map(user => user.login),
    bodyPreview: previewText(issue.body),
    parentIssue,
    recentComments,
  }
}

function formatList(items: string[]) {
  return items.length ? items.map(item => `\`${item}\``).join(', ') : 'none'
}

function toMarkdown(context: IssueContext): string {
  const parent = context.parentIssue
    ? `[#${context.parentIssue.number}](${context.parentIssue.url}) ${context.parentIssue.title}`
    : 'none'

  const comments = context.recentComments.length
    ? context.recentComments
        .map(comment =>
          `- [comment](${comment.url}) by \`${comment.author ?? 'unknown'}\` at \`${comment.createdAt}\`: ${comment.bodyPreview || '(empty)'}`)
        .join('\n')
    : '- No recent comments'

  return `# Issue Context

- Repo: \`${context.repo}\`
- Issue: [#${context.issue.number}](${context.issue.url}) ${context.issue.title}
- State: ${context.issue.state}
- Author: \`${context.author ?? 'unknown'}\`
- Created: \`${context.createdAt}\`
- Closed: \`${context.closedAt ?? 'open'}\`
- Labels: ${formatList(context.labels)}
- Assignees: ${formatList(context.assignees)}
- Parent: ${parent}

## Summary

${context.bodyPreview || 'No issue body'}

## Recent Comments

${comments}
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
