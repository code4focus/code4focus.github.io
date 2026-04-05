/**
 * Create a GitHub parent issue from a feature/RFC or bug template.
 *
 * Usage:
 *   pnpm create-parent-issue --kind feature --title "process: improve workflow" --body-file /tmp/body.md
 *   pnpm create-parent-issue --kind bug --title "fix(build): restore deploy step" --summary "..." --problem "..." --reproduction "..." --expected "..." --actual "..."
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

type IssueKind = 'feature' | 'bug'

interface CliOptions {
  repo: string
  kind: IssueKind
  title: string
  bodyFile?: string
  labels: string[]
  summary?: string
  problem?: string
  goals?: string[]
  nonGoals?: string[]
  constraints?: string[]
  direction?: string
  reproduction?: string[]
  expected?: string
  actual?: string
  impact?: string[]
  severity?: string
  suspectedAreas?: string[]
  acceptance?: string[]
  plannedSubIssues?: string[]
  additionalContext?: string
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

function normalizeKind(rawKind: string | undefined): IssueKind {
  const normalizedKind = rawKind?.trim().toLowerCase() ?? 'feature'

  if (normalizedKind === 'feature' || normalizedKind === 'rfc') {
    return 'feature'
  }

  if (normalizedKind === 'bug') {
    return 'bug'
  }

  fail(`Invalid --kind "${rawKind}". Expected one of: feature, rfc, bug.`)
}

function parseArgs(argv: string[]): CliOptions {
  const options: Partial<CliOptions> = {
    repo: 'code4focus/code4focus.github.io',
    kind: 'feature',
    labels: [],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    switch (arg) {
      case '--repo':
        options.repo = next
        index += 1
        break
      case '--kind':
        options.kind = normalizeKind(next)
        index += 1
        break
      case '--title':
        options.title = next
        index += 1
        break
      case '--body-file':
        options.bodyFile = next
        index += 1
        break
      case '--label':
        options.labels = (options.labels ?? []).concat(next)
        index += 1
        break
      case '--summary':
        options.summary = next
        index += 1
        break
      case '--problem':
        options.problem = next
        index += 1
        break
      case '--goal':
        options.goals = (options.goals ?? []).concat(next)
        index += 1
        break
      case '--non-goal':
        options.nonGoals = (options.nonGoals ?? []).concat(next)
        index += 1
        break
      case '--constraint':
        options.constraints = (options.constraints ?? []).concat(next)
        index += 1
        break
      case '--direction':
        options.direction = next
        index += 1
        break
      case '--reproduction':
        options.reproduction = (options.reproduction ?? []).concat(next)
        index += 1
        break
      case '--expected':
        options.expected = next
        index += 1
        break
      case '--actual':
        options.actual = next
        index += 1
        break
      case '--impact':
        options.impact = (options.impact ?? []).concat(next)
        index += 1
        break
      case '--severity':
        options.severity = next
        index += 1
        break
      case '--suspected-area':
        options.suspectedAreas = (options.suspectedAreas ?? []).concat(next)
        index += 1
        break
      case '--acceptance':
        options.acceptance = (options.acceptance ?? []).concat(next)
        index += 1
        break
      case '--sub-issue':
        options.plannedSubIssues = (options.plannedSubIssues ?? []).concat(next)
        index += 1
        break
      case '--context':
        options.additionalContext = next
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

  if (!options.title) {
    fail('Missing --title')
  }

  options.kind = normalizeKind(options.kind)

  return options as CliOptions
}

function printHelp() {
  console.log(`Create a GitHub parent issue from the repository feature/RFC or bug template.

Required:
  --title <text>           Parent issue title

Optional:
  --repo <owner/name>      Repository name, default: code4focus/code4focus.github.io
  --kind <value>           feature|rfc|bug, default: feature
  --body-file <path>       Use an existing issue body file
  --label <text>           Repeatable extra label
  --summary <text>         Summary section
  --problem <text>         Problem Statement section
  --goal <text>            Repeatable goal (feature/RFC)
  --non-goal <text>        Repeatable non-goal (feature/RFC)
  --constraint <text>      Repeatable constraint (feature/RFC)
  --direction <text>       Proposed Direction section (feature/RFC)
  --reproduction <text>    Repeatable reproduction step (bug)
  --expected <text>        Expected Behavior section (bug)
  --actual <text>          Actual Behavior section (bug)
  --impact <text>          Repeatable impact item (bug)
  --severity <text>        Severity value (bug)
  --suspected-area <text>  Repeatable suspected area item (bug)
  --acceptance <text>      Repeatable acceptance criterion
  --sub-issue <text>       Repeatable planned sub-issue checklist item
  --context <text>         Additional Context section

Notes:
  - When the issue body has already been drafted from a workflow skill, prefer --body-file.
  - Default labels: enhancement for feature/RFC, bug for bug.
`)
}

function buildBulletList(items: string[] | undefined, fallback = '- '): string {
  return items?.length
    ? items.map(item => `- ${item}`).join('\n')
    : fallback
}

function buildNumberedList(items: string[] | undefined): string {
  return items?.length
    ? items.map((item, index) => `${index + 1}. ${item}`).join('\n')
    : [
        '1. Go to \'...\'',
        '2. Click on \'....\'',
        '3. Scroll down to \'....\'',
        '4. See error',
      ].join('\n')
}

function buildChecklist(items: string[] | undefined, fallback: string[]): string {
  const values = items?.length ? items : fallback
  return values.map(item => `- [ ] ${item}`).join('\n')
}

function validateStructuredOptions(options: CliOptions) {
  if (options.bodyFile) {
    return
  }

  if (!options.summary?.trim()) {
    fail('Missing --summary or --body-file')
  }

  if (!options.problem?.trim()) {
    fail('Missing --problem or --body-file')
  }

  if (options.kind === 'feature' && !options.direction?.trim()) {
    fail('Feature/RFC issues require --direction when --body-file is not provided')
  }

  if (options.kind === 'bug') {
    if (!options.expected?.trim()) {
      fail('Bug issues require --expected when --body-file is not provided')
    }
    if (!options.actual?.trim()) {
      fail('Bug issues require --actual when --body-file is not provided')
    }
  }
}

function buildFeatureBody(options: CliOptions): string {
  return `## Summary｜摘要
${options.summary ?? ''}

## Problem Statement｜问题定义
${options.problem ?? ''}

## Goals｜目标
${buildBulletList(options.goals)}

## Non-Goals｜非目标
${buildBulletList(options.nonGoals)}

## Constraints｜约束条件
${buildBulletList(options.constraints)}

## Proposed Direction｜方案方向
${options.direction ?? ''}

## Acceptance Criteria｜验收标准
${buildBulletList(options.acceptance)}

## Planned Sub-issues｜计划拆分的子任务
${buildChecklist(options.plannedSubIssues, ['Analysis', 'Implementation', 'Verification'])}

## Additional Context｜补充信息
${options.additionalContext ?? ''}
`
}

function buildBugBody(options: CliOptions): string {
  const impactItems = [
    ...(options.impact?.length ? options.impact : ['Affected pages, modules, or environments:']),
    ...(options.severity?.trim() ? [`Severity: ${options.severity.trim()}`] : ['Severity:']),
  ]

  return `## Summary｜摘要
${options.summary ?? ''}

## Problem Statement｜问题定义
${options.problem ?? ''}

## Reproduction｜复现步骤
${buildNumberedList(options.reproduction)}

## Expected Behavior｜预期行为
${options.expected ?? ''}

## Actual Behavior｜实际行为
${options.actual ?? ''}

## Impact and Scope｜影响范围
${buildBulletList(impactItems)}

## Suspected Area｜疑似范围
${buildBulletList(options.suspectedAreas)}

## Acceptance Criteria｜验收标准
${buildBulletList(options.acceptance)}

## Planned Sub-issues｜计划拆分的子任务
${buildChecklist(options.plannedSubIssues, ['Root cause analysis', 'Fix implementation', 'Regression verification'])}

## Additional Context｜补充信息
${options.additionalContext ?? ''}
`
}

function buildBody(options: CliOptions): string {
  if (options.bodyFile) {
    return readFileSync(options.bodyFile, 'utf8')
  }

  return options.kind === 'bug'
    ? buildBugBody(options)
    : buildFeatureBody(options)
}

function getLabels(options: CliOptions): string[] {
  if (options.labels.length > 0) {
    return options.labels
  }

  return [options.kind === 'bug' ? 'bug' : 'enhancement']
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  validateStructuredOptions(options)
  const tempDir = mkdtempSync(join(tmpdir(), 'parent-issue-'))
  const bodyPath = join(tempDir, 'body.md')

  try {
    const body = buildBody(options)
    writeFileSync(bodyPath, body)

    const args = [
      'issue',
      'create',
      '-R',
      options.repo,
      '--title',
      options.title,
      '--body-file',
      bodyPath,
    ]

    for (const label of getLabels(options)) {
      args.push('--label', label)
    }

    const issueUrl = runGh(args)
    const issueNumber = issueUrl.split('/').pop()

    if (!issueNumber) {
      fail(`Failed to parse created issue number from URL: ${issueUrl}`)
    }

    console.log(`✅ Created parent issue #${issueNumber}`)
    console.log(issueUrl)
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
