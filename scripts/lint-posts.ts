import process from 'node:process'
import { formatFinding, runPostLint } from './lib/post-lint'

interface CliOptions {
  fix: boolean
  includeBody: boolean
  includeMetadata: boolean
  filePatterns: string[]
  scope: 'posts' | 'about' | 'all'
}

class HelpExit extends Error {}

function printHelp() {
  console.log(`Lint Markdown content for bilingual prose and front matter quality.

Usage:
  pnpm lint:content
  pnpm lint:content --fix
  pnpm lint:posts
  pnpm lint:about
  pnpm lint:content --scope about --body-only src/content/about/site/about-zh.md

Options:
  --fix            Apply safe autofixes
  --body-only      Check prose rules only
  --metadata-only  Check front matter rules only
  --scope <name>   One of: posts, about, all
  --help, -h       Show this help text
`)
}

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    fix: false,
    includeBody: true,
    includeMetadata: true,
    filePatterns: [],
    scope: 'all',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    switch (arg) {
      case '--fix':
        options.fix = true
        break
      case '--body-only':
        options.includeMetadata = false
        break
      case '--metadata-only':
        options.includeBody = false
        break
      case '--scope': {
        const next = argv[index + 1]
        if (next !== 'posts' && next !== 'about' && next !== 'all') {
          fail(`Invalid --scope "${next}". Expected posts, about, or all.`)
        }
        options.scope = next
        index += 1
        break
      }
      case '--help':
      case '-h':
        printHelp()
        throw new HelpExit()
      default:
        if (arg.startsWith('-')) {
          fail(`Unknown argument: ${arg}`)
        }
        options.filePatterns.push(arg)
    }
  }

  if (!options.includeBody && !options.includeMetadata) {
    fail('At least one of body or metadata checks must be enabled.')
  }

  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const result = await runPostLint(options)

  result.findings.forEach((finding) => {
    console.log(formatFinding(finding))
  })

  if (options.fix) {
    if (result.changedFiles.length > 0) {
      console.log(`✅ Fixed ${result.changedFiles.length} Markdown file(s)`)
    }
    else {
      console.log('✅ No autofix changes were needed')
    }
  }

  console.log(`Scanned ${result.totalFiles} Markdown file(s)`)
  console.log(`Errors: ${result.errors}`)
  console.log(`Warnings: ${result.warnings}`)

  if (result.errors > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  if (error instanceof HelpExit) {
    process.exit(0)
  }

  const message = error instanceof Error ? error.message : String(error)
  console.error(`❌ ${message}`)
  process.exit(1)
})
