import type MarkdownIt from 'markdown-it'

const citationDefinitionPattern = /^\s*(::|:::)cite-def\[([^\]\n]+)\](?:\{([^\n]*)\})?\s*$/
const citationIdPattern = /^\w[\w-]*$/
const citationRefPattern = /:cite-ref\[([^\]]+)\](?:\{[^}]*\})?/g

interface CitationDefinition {
  id: string
  body: string
  short: string
}

interface CitationLink {
  url: string
}

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

function parseCitationAttributes(rawAttributes = '') {
  const shortMatch = rawAttributes.match(/\bshort="([^"]*)"/)
  return {
    short: shortMatch?.[1]?.trim() ?? '',
  }
}

function stripMarkdownToPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_~>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function createCitationLongDescription(definition: CitationDefinition) {
  const bodyText = stripMarkdownToPlainText(definition.body)
  return bodyText || definition.short || definition.id
}

function escapeMarkdownLinkTitle(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
}

function extractPrimaryCitationLink(definition: CitationDefinition): CitationLink | null {
  const linkMatch = definition.body.match(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/)
  const rawUrl = linkMatch?.[2]?.trim() ?? definition.body.match(/https?:\/\/\S+/)?.[0]?.trim() ?? ''
  const url = rawUrl.replace(/[),.;:]+$/g, '')

  if (!url) {
    return null
  }

  return {
    url,
  }
}

function collectCitationDefinitions(markdown: string) {
  const lines = markdown.split('\n')
  const contentLines: string[] = []
  const definitions = new Map<string, CitationDefinition>()
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
      const [, closingFence, rawId, rawAttributes = ''] = definitionMatch
      const sourceId = normalizeCitationId(rawId)
      const { short } = parseCitationAttributes(rawAttributes)

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

      definitions.set(sourceId, {
        id: sourceId,
        body: bodyLines.join('\n').trim(),
        short,
      })
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

function createCitationLinkMarkup(definition: CitationDefinition, index: number) {
  const citationLink = extractPrimaryCitationLink(definition)
  if (!citationLink) {
    return `[${index}]`
  }

  return `[${index}]`
}

function createReferenceStyleCitationDefinition(definition: CitationDefinition, index: number) {
  const citationLink = extractPrimaryCitationLink(definition)
  if (!citationLink) {
    return null
  }

  const title = createCitationLongDescription(definition)
  const titleSuffix = title ? ` "${escapeMarkdownLinkTitle(title)}"` : ''
  return `[${index}]: ${citationLink.url}${titleSuffix}`
}

export function normalizeCitationMarkdown(
  markdown: string,
): string {
  const { content, definitions } = collectCitationDefinitions(markdown)
  const lines = content.split('\n')
  const normalizedLines: string[] = []
  const orderedSourceIds: string[] = []
  const indexes = new Map<string, number>()
  let codeFence: { char: string, length: number } | null = null

  for (const line of lines) {
    if (codeFence) {
      normalizedLines.push(line)

      if (isClosingCodeFence(line, codeFence)) {
        codeFence = null
      }

      continue
    }

    const nextFence = getCodeFence(line)
    if (nextFence) {
      codeFence = nextFence
      normalizedLines.push(line)
      continue
    }

    normalizedLines.push(
      line.replace(citationRefPattern, (_, rawId: string) => {
        const sourceId = normalizeCitationId(rawId)
        if (!definitions.has(sourceId)) {
          throw new Error(`Citation reference "${sourceId}" does not match any citation definition.`)
        }

        if (!indexes.has(sourceId)) {
          indexes.set(sourceId, orderedSourceIds.length + 1)
          orderedSourceIds.push(sourceId)
        }

        return createCitationLinkMarkup(
          definitions.get(sourceId)!,
          indexes.get(sourceId)!,
        )
      }),
    )
  }

  const normalizedContent = normalizedLines.join('\n').trim()
  if (orderedSourceIds.length === 0) {
    return normalizedContent
  }

  const referenceDefinitions = orderedSourceIds
    .map((sourceId, index) => createReferenceStyleCitationDefinition(definitions.get(sourceId)!, index + 1))
    .filter((definition): definition is string => Boolean(definition))
    .join('\n')

  if (!referenceDefinitions) {
    return normalizedContent
  }

  return `${normalizedContent}\n\n${referenceDefinitions}`
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
    const definitionMarkdown = definitions.get(sourceId)?.body ?? sourceId
    const definitionHtml = markdownParser.render(definitionMarkdown).trim() || `<p>${escapeHtml(sourceId)}</p>`

    return `<li><a name="cite-${escapeHtml(sourceId)}"></a>${definitionHtml}</li>`
  }).join('')

  return `${renderedHtml}\n<hr>\n<ol>\n${referenceItems}\n</ol>\n`
}
