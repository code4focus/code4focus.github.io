import type { CollectionEntry } from 'astro:content'
import type { Language } from '@/i18n/config'
import { base, themeConfig } from '@/config'
import { normalizeCitationMarkdown } from '@/utils/citation'
import { getPostPath, getPostSlug } from '@/utils/content'
import { getAbsolutePostImageUrl } from '@/utils/post-assets'

const admonitionTitles: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
}

const supportedContainerDirectives = new Set([
  ...Object.keys(admonitionTitles),
  'fold',
  'gallery',
])

const markdownImagePattern = /!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g

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

function parseDirectiveAttributes(rawAttributes = '') {
  const attributes: Record<string, string> = {}

  for (const match of rawAttributes.matchAll(/(\w+)="([^"]*)"/g)) {
    const [, key, value] = match
    attributes[key] = value
  }

  return attributes
}

function createBlockquoteLines(title: string, body: string, indent = '') {
  if (!body) {
    return [`${indent}> **${title}**`]
  }

  return [
    `${indent}> **${title}**`,
    ...body.split('\n').map(line => line ? `${indent}> ${line}` : `${indent}>`),
  ]
}

function createPlainSectionLines(title: string, body: string, indent = '') {
  if (!body) {
    return [`${indent}**${title}**`]
  }

  return [
    `${indent}**${title}**`,
    '',
    ...body.split('\n').map(line => line ? `${indent}${line}` : ''),
  ]
}

function transformLeafDirective(name: string, attributes: Record<string, string>) {
  switch (name) {
    case 'github': {
      const repo = attributes.repo?.trim()
      return repo ? `[GitHub repository: ${repo}](https://github.com/${repo})` : null
    }
    case 'youtube': {
      const id = attributes.id?.trim()
      return id ? `[YouTube video](https://www.youtube.com/watch?v=${id})` : null
    }
    case 'bilibili': {
      const id = attributes.id?.trim()
      return id ? `[Bilibili video](https://www.bilibili.com/video/${id})` : null
    }
    case 'spotify':
      return attributes.url?.trim() ? `[Spotify embed](${attributes.url.trim()})` : null
    case 'tweet':
      return attributes.url?.trim() ? `[Tweet embed](${attributes.url.trim()})` : null
    case 'codepen':
      return attributes.url?.trim() ? `[CodePen demo](${attributes.url.trim()})` : null
    default:
      return null
  }
}

function collectContainerBody(lines: string[], startIndex: number) {
  const bodyLines: string[] = []
  let codeFence: { char: string, length: number } | null = null
  let depth = 1

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]

    if (codeFence) {
      bodyLines.push(line)

      if (isClosingCodeFence(line, codeFence)) {
        codeFence = null
      }

      continue
    }

    const nextFence = getCodeFence(line)
    if (nextFence) {
      codeFence = nextFence
      bodyLines.push(line)
      continue
    }

    const openMatch = line.match(/^\s*:::(\w+)(?:\[[^\]\n]*\])?(?:\{[^\n]*\})?\s*$/)
    if (openMatch && supportedContainerDirectives.has(openMatch[1])) {
      depth += 1
      bodyLines.push(line)
      continue
    }

    if (line.trim() === ':::') {
      depth -= 1

      if (depth === 0) {
        return {
          bodyLines,
          endIndex: index,
          foundClosingFence: true,
        }
      }

      bodyLines.push(line)
      continue
    }

    bodyLines.push(line)
  }

  return {
    bodyLines,
    endIndex: startIndex,
    foundClosingFence: false,
  }
}

function normalizeDirectiveLines(lines: string[]): string[] {
  const normalizedLines: string[] = []
  let codeFence: { char: string, length: number } | null = null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

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

    const containerMatch = line.match(/^(\s*):::(\w+)(?:\[([^\]\n]+)\])?(?:\{[^\n]*\})?\s*$/)
    if (containerMatch && supportedContainerDirectives.has(containerMatch[2])) {
      const [, indent, name, rawTitle = ''] = containerMatch
      const { bodyLines, endIndex, foundClosingFence } = collectContainerBody(lines, index)

      if (!foundClosingFence) {
        normalizedLines.push(line)
        continue
      }

      const normalizedBody = normalizeDirectiveLines(bodyLines).join('\n').trim()

      if (name in admonitionTitles) {
        normalizedLines.push(...createBlockquoteLines(rawTitle.trim() || admonitionTitles[name], normalizedBody, indent))
      }
      else if (name === 'fold') {
        normalizedLines.push(...createPlainSectionLines(rawTitle.trim() || 'Details', normalizedBody, indent))
      }
      else {
        normalizedLines.push(...(normalizedBody ? normalizedBody.split('\n').map(bodyLine => bodyLine ? `${indent}${bodyLine}` : '') : []))
      }

      index = endIndex
      continue
    }

    const leafMatch = line.match(/^(\s*)::(\w+)(?:\{([^}]*)\})?\s*$/)
    if (leafMatch) {
      const [, indent, name, rawAttributes = ''] = leafMatch
      const replacement = transformLeafDirective(name, parseDirectiveAttributes(rawAttributes))

      if (replacement) {
        normalizedLines.push(`${indent}${replacement}`)
        continue
      }
    }

    normalizedLines.push(line)
  }

  return normalizedLines
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toYamlScalar(value: string) {
  return JSON.stringify(value)
}

function buildMarkdownFrontmatter(
  post: CollectionEntry<'posts'>,
  routeLang: Language,
  originalUrl: string,
  exportUrl: string,
) {
  const { author } = themeConfig.site
  const publishedYear = post.data.published.getFullYear()
  const frontmatterLines = [
    '---',
    `title: ${toYamlScalar(post.data.title)}`,
    `author: ${toYamlScalar(author)}`,
    `published: ${toYamlScalar(formatDate(post.data.published))}`,
    `lang: ${toYamlScalar(routeLang)}`,
    `original_url: ${toYamlScalar(originalUrl)}`,
    `export_url: ${toYamlScalar(exportUrl)}`,
    `copyright: ${toYamlScalar(`Copyright © ${publishedYear} ${author}`)}`,
    `license: ${toYamlScalar('Not specified')}`,
  ]

  if (post.data.description) {
    frontmatterLines.push(`description: ${toYamlScalar(post.data.description)}`)
  }

  if (post.data.updated) {
    frontmatterLines.push(`updated: ${toYamlScalar(formatDate(post.data.updated))}`)
  }

  if (post.data.tags && post.data.tags.length > 0) {
    frontmatterLines.push('tags:')
    post.data.tags.forEach(tag => frontmatterLines.push(`  - ${toYamlScalar(tag)}`))
  }

  if (post.data.series?.id) {
    frontmatterLines.push('series:')
    frontmatterLines.push(`  id: ${toYamlScalar(post.data.series.id)}`)

    if (post.data.series.title) {
      frontmatterLines.push(`  title: ${toYamlScalar(post.data.series.title)}`)
    }

    if (post.data.series.kind) {
      frontmatterLines.push(`  kind: ${toYamlScalar(post.data.series.kind)}`)
    }

    if (typeof post.data.series.order === 'number') {
      frontmatterLines.push(`  order: ${post.data.series.order}`)
    }
  }

  frontmatterLines.push('---')
  return frontmatterLines.join('\n')
}

function normalizeBodyMarkdown(markdown: string) {
  return normalizeDirectiveLines(
    normalizeCitationMarkdown(
      markdown.replace(/<!--[\s\S]*?-->/g, '').trim(),
    ).split('\n'),
  ).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

async function rewriteRelativeMarkdownImageUrls(markdown: string, baseUrl: string) {
  const lines = markdown.split('\n')
  const rewrittenLines: string[] = []
  let codeFence: { char: string, length: number } | null = null

  for (const line of lines) {
    if (codeFence) {
      rewrittenLines.push(line)

      if (isClosingCodeFence(line, codeFence)) {
        codeFence = null
      }

      continue
    }

    const nextFence = getCodeFence(line)
    if (nextFence) {
      codeFence = nextFence
      rewrittenLines.push(line)
      continue
    }

    const matches = [...line.matchAll(markdownImagePattern)]
    if (matches.length === 0) {
      rewrittenLines.push(line)
      continue
    }

    let rewrittenLine = line

    for (const match of matches) {
      const [fullMatch, alt, rawSrc, rawTitle = ''] = match
      if (!rawSrc.startsWith('./') && !rawSrc.startsWith('../') && !rawSrc.startsWith('_images/')) {
        continue
      }

      const absoluteImageUrl = await getAbsolutePostImageUrl(rawSrc, baseUrl)
      if (!absoluteImageUrl) {
        continue
      }

      const replacement = `![${alt}](${absoluteImageUrl}${rawTitle})`
      rewrittenLine = rewrittenLine.replace(fullMatch, replacement)
    }

    rewrittenLines.push(rewrittenLine)
  }

  return rewrittenLines.join('\n')
}

export function getPostAbsoluteUrl(
  slug: string,
  routeLang: Language,
  format: 'html' | 'markdown' = 'html',
) {
  const path = getPostPath(slug, routeLang, format)
  return new URL(path, themeConfig.site.url).toString()
}

export async function renderPostMarkdownExport(
  post: CollectionEntry<'posts'>,
  routeLang: Language,
) {
  const slug = getPostSlug(post)
  const siteBaseUrl = new URL(base, themeConfig.site.url).toString()
  const originalUrl = getPostAbsoluteUrl(slug, routeLang, 'html')
  const exportUrl = getPostAbsoluteUrl(slug, routeLang, 'markdown')
  const normalizedBody = normalizeBodyMarkdown(post.body ?? '')
  const body = await rewriteRelativeMarkdownImageUrls(normalizedBody, siteBaseUrl)
  const frontmatter = buildMarkdownFrontmatter(post, routeLang, originalUrl, exportUrl)

  return `${frontmatter}\n\n${body}\n`
}
