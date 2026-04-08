/**
 * Format post bodies with the same safe prose rules used by the post linter.
 * Usage: pnpm format-posts
 */

import process from 'node:process'
import { runPostLint } from './lib/post-lint'

async function main() {
  const result = await runPostLint({
    fix: true,
    includeBody: true,
    includeMetadata: false,
  })

  if (result.changedFiles.length === 0) {
    console.log('✅ Check complete, no files needed formatting changes')
    return
  }

  console.log(`✨ Formatted ${result.changedFiles.length} files successfully`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`❌ Execution failed: ${message}`)
  process.exit(1)
})
