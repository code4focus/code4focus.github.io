#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import process from 'node:process'

const issueRefPattern = /\b(?:Refs?|Closes?|Fix(?:es)?|Resolves?)\s+#\d+(?:\s*,\s*#\d+)*/i

function fail(message) {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function parseArgs(argv) {
  const options = {
    file: '',
    message: '',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    switch (arg) {
      case '--file':
        options.file = next ?? ''
        index += 1
        break
      case '--message':
        options.message = next ?? ''
        index += 1
        break
      default:
        fail(`Unknown argument: ${arg}`)
    }
  }

  if (!options.file && !options.message) {
    fail('Provide --file <path> or --message <text>.')
  }

  if (options.file && options.message) {
    fail('Use either --file or --message, not both.')
  }

  return options
}

function getCommitMessage(options) {
  if (options.message) {
    return options.message
  }

  try {
    return readFileSync(options.file, 'utf8')
  }
  catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    fail(`Failed to read commit message file "${options.file}": ${reason}`)
  }
}

function stripComments(message) {
  return message
    .split('\n')
    .filter(line => !line.startsWith('#'))
    .join('\n')
    .trim()
}

function isExemptSubject(subject) {
  return /^Merge\b/.test(subject) || /^Revert\b/.test(subject)
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const message = stripComments(getCommitMessage(options))
  const subject = message.split('\n')[0]?.trim() ?? ''

  if (!subject) {
    fail('Commit message subject is empty.')
  }

  if (isExemptSubject(subject)) {
    return
  }

  if (!issueRefPattern.test(message)) {
    fail('Commit message must include an issue reference such as "Refs #16", "Closes #16", or "Fixes #16".')
  }
}

main()
