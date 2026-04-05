import type MarkdownIt from 'markdown-it'

const citationDefinitionPattern = /^\s*(::|:::)cite-def\[([^\]\n]+)\](?:\{[^\n]*\})?\s*$/
const citationIdPattern = /^\w[\w-]*$/
const citationRefPattern = /:cite-ref\[([^\]]+)\](?:\{[^}]*\})?/g

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

function getCodeFence(line: string) {
  const match = line.match(/^\s*([`~]{3,})/)
  if (!match) {
    return null
  }

  return {
    char: match[1][0],
    length: match[1].length,
  }
}

function isClosingCodeFence(line: string, openFence: { char: string, length: number }) {
  const currentFence = getCodeFence(line)
  return currentFence
    && currentFence.char === openFence.char
    && currentFence.length >= openFence.length
}

function normalizeCitationId(rawId: string) {
  const sourceId = rawId.trim()
  if (!sourceId || !citationIdPattern.test(sourceId)) {
    throw new Error(`Invalid citation id "${rawId}".`)
  }

  return sourceId
}

function collectCitationDefinitions(markdown: string) {
  const lines = markdown.split('\n')
  const contentLines: string[] = []
  const definitions = new Map<string, string>()
  let codeFence: { char: string, length: number } | null = null

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]

    if (codeFence) {
      contentLines.push(line)

      if (isClosingCodeFence(line, codeFence)) {
        codeFence = null
      }

      continue
    }

    const definitionMatch = line.match(citationDefinitionPattern)
    if (definitionMatch) {
      const [, closingFence, rawId] = definitionMatch
      const sourceId = normalizeCitationId(rawId)

      if (definitions.has(sourceId)) {
        throw new Error(`Duplicate citation definition "${sourceId}".`)
      }

      const bodyLines: string[] = []
      let definitionFence: { char: string, length: number } | null = null
      let foundClosingFence = false

      while (++index < lines.length) {
        const currentLine = lines[index]

        if (definitionFence) {
          bodyLines.push(currentLine)

          if (isClosingCodeFence(currentLine, definitionFence)) {
            definitionFence = null
          }

          continue
        }

        const nextFence = getCodeFence(currentLine)
        if (nextFence) {
          definitionFence = nextFence
          bodyLines.push(currentLine)
          continue
        }

        if (currentLine.trim() === closingFence) {
          foundClosingFence = true
          break
        }

        bodyLines.push(currentLine)
      }

      if (!foundClosingFence) {
        throw new Error(`Unclosed citation definition "${sourceId}".`)
      }

      definitions.set(sourceId, bodyLines.join('\n').trim())
      continue
    }

    const nextFence = getCodeFence(line)
    if (nextFence) {
      codeFence = nextFence
    }

    contentLines.push(line)
  }

  return {
    content: contentLines.join('\n'),
    definitions,
  }
}

export function stripCitationSyntax(markdown: string): string {
  const { content } = collectCitationDefinitions(markdown)
  const lines = content.split('\n')
  const strippedLines: string[] = []
  let codeFence: { char: string, length: number } | null = null

  for (const line of lines) {
    if (codeFence) {
      strippedLines.push(line)

      if (isClosingCodeFence(line, codeFence)) {
        codeFence = null
      }

      continue
    }

    const nextFence = getCodeFence(line)
    if (nextFence) {
      codeFence = nextFence
      strippedLines.push(line)
      continue
    }

    strippedLines.push(line.replace(citationRefPattern, ''))
  }

  return strippedLines.join('\n')
}

export function renderStaticCitationHtml(markdown: string, markdownParser: MarkdownIt): string {
  const { content, definitions } = collectCitationDefinitions(markdown)
  const lines = content.split('\n')
  const renderedLines: string[] = []
  const orderedSourceIds: string[] = []
  const indexes = new Map<string, number>()
  const replacements = new Map<string, string>()
  let replacementIndex = 0
  let codeFence: { char: string, length: number } | null = null

  for (const line of lines) {
    if (codeFence) {
      renderedLines.push(line)

      if (isClosingCodeFence(line, codeFence)) {
        codeFence = null
      }

      continue
    }

    const nextFence = getCodeFence(line)
    if (nextFence) {
      codeFence = nextFence
      renderedLines.push(line)
      continue
    }

    renderedLines.push(
      line.replace(citationRefPattern, (_, rawId: string) => {
        const sourceId = normalizeCitationId(rawId)
        if (!definitions.has(sourceId)) {
          throw new Error(`Citation reference "${sourceId}" does not match any citation definition.`)
        }

        if (!indexes.has(sourceId)) {
          indexes.set(sourceId, orderedSourceIds.length + 1)
          orderedSourceIds.push(sourceId)
        }

        const token = `CITATIONREFPLACEHOLDER${replacementIndex++}TOKEN`
        replacements.set(
          token,
          `<sup><a href="#cite-${escapeHtml(sourceId)}">[${indexes.get(sourceId)}]</a></sup>`,
        )
        return token
      }),
    )
  }

  let renderedHtml = markdownParser.render(renderedLines.join('\n'))
  for (const [token, html] of replacements) {
    renderedHtml = renderedHtml.replaceAll(token, html)
  }

  if (orderedSourceIds.length === 0) {
    return renderedHtml
  }

  const referenceItems = orderedSourceIds.map((sourceId) => {
    const definitionMarkdown = definitions.get(sourceId) ?? sourceId
    const definitionHtml = markdownParser.render(definitionMarkdown).trim() || `<p>${escapeHtml(sourceId)}</p>`

    return `<li><a name="cite-${escapeHtml(sourceId)}"></a>${definitionHtml}</li>`
  }).join('')

  return `${renderedHtml}\n<hr>\n<ol>\n${referenceItems}\n</ol>\n`
}
