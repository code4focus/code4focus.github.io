/**
 * Create a GitHub sub-issue and attach it to a parent issue.
 *
 * Usage:
 *   pnpm create-sub-issue --parent 2 --title "Task title" --type Implementation
 *   pnpm create-sub-issue --parent 2 --title "Task title" --body-file /tmp/body.md
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

interface CliOptions {
  repo: string
  parent: number
  title: string
  bodyFile?: string
  taskType: string
  objective?: string
  scopeIn?: string
  scopeOut?: string
  dependencies?: string
  acceptance?: string[]
  validation?: string[]
  additionalContext?: string
}

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
  const options: Partial<CliOptions> = {
    repo: 'code4focus/code4focus.github.io',
    taskType: 'Implementation',
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
      case '--title':
        options.title = next
        i += 1
        break
      case '--body-file':
        options.bodyFile = next
        i += 1
        break
      case '--type':
        options.taskType = next
        i += 1
        break
      case '--objective':
        options.objective = next
        i += 1
        break
      case '--scope-in':
        options.scopeIn = next
        i += 1
        break
      case '--scope-out':
        options.scopeOut = next
        i += 1
        break
      case '--dependencies':
        options.dependencies = next
        i += 1
        break
      case '--acceptance':
        options.acceptance = (options.acceptance ?? []).concat(next)
        i += 1
        break
      case '--validation':
        options.validation = (options.validation ?? []).concat(next)
        i += 1
        break
      case '--context':
        options.additionalContext = next
        i += 1
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
        break
      default:
        fail(`Unknown argument: ${arg}`)
    }
  }

  if (!options.parent || Number.isNaN(options.parent)) {
    fail(`Missing or invalid --parent`)
  }

  if (!options.title) {
    fail(`Missing --title`)
  }

  return options as CliOptions
}

function printHelp() {
  console.log(`Create a GitHub sub-issue and attach it to a parent issue.

Required:
  --parent <number>        Parent issue number
  --title <text>           Sub-issue title

Optional:
  --repo <owner/name>      Repository name, default: code4focus/code4focus.github.io
  --body-file <path>       Use an existing issue body file
  --type <value>           Task type, default: Implementation
  --objective <text>       Objective text
  --scope-in <text>        In-scope note
  --scope-out <text>       Out-of-scope note
  --dependencies <text>    Dependency note
  --acceptance <text>      Repeatable acceptance criterion
  --validation <text>      Repeatable validation item
  --context <text>         Additional context
`)
}

function buildBody(options: CliOptions): string {
  if (options.bodyFile) {
    return readFileSync(options.bodyFile, 'utf8')
  }

  const acceptance = options.acceptance?.length
    ? options.acceptance.map(item => `- ${item}`).join('\n')
    : '- '
  const validation = options.validation?.length
    ? options.validation.map(item => `- ${item}`).join('\n')
    : '- '

  return `Parent: #${options.parent}

## Task Type｜任务类型
- ${options.taskType}

## Objective｜任务目标
${options.objective ?? ''}

## Scope｜范围
- In scope: ${options.scopeIn ?? ''}
- Out of scope: ${options.scopeOut ?? ''}

## Dependencies｜依赖关系
${options.dependencies ?? ''}

## Acceptance Criteria｜验收标准
${acceptance}

## Validation｜验证方式
${validation}

## Additional Context｜补充信息
${options.additionalContext ?? ''}
`
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const tempDir = mkdtempSync(join(tmpdir(), 'sub-issue-'))
  const bodyPath = join(tempDir, 'body.md')

  try {
    const body = buildBody(options)
    writeFileSync(bodyPath, body)

    const issueUrl = runGh([
      'issue',
      'create',
      '-R',
      options.repo,
      '--title',
      options.title,
      '--body-file',
      bodyPath,
    ])

    const issueNumber = issueUrl.split('/').pop()
    if (!issueNumber) {
      fail(`Failed to parse created issue number from URL: ${issueUrl}`)
    }

    const issueId = runGh([
      'api',
      `repos/${options.repo}/issues/${issueNumber}`,
      '--jq',
      '.id',
    ])

    runGh([
      'api',
      '-X',
      'POST',
      '-H',
      'Accept: application/vnd.github+json',
      '-H',
      'X-GitHub-Api-Version: 2026-03-10',
      `repos/${options.repo}/issues/${options.parent}/sub_issues`,
      '-F',
      `sub_issue_id=${issueId}`,
    ])

    console.log(`✅ Created sub-issue #${issueNumber}`)
    console.log(issueUrl)
  }
  finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

main()
