import MarkdownIt from 'markdown-it'
import { stripCitationSyntax } from './citation'

export type ExcerptScene = 'list' | 'meta' | 'og' | 'feed'

const markdownParser = new MarkdownIt()
const excerptLengths: Record<ExcerptScene, { cjk: number, other: number }> = {
  list: {
    cjk: 120,
    other: 240,
  },
  meta: {
    cjk: 120,
    other: 240,
  },
  og: {
    cjk: 70,
    other: 140,
  },
  feed: {
    cjk: 70,
    other: 140,
  },
}

const htmlEntityMap: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': '\'',
  '&nbsp;': ' ',
}

function isCJKLanguage(lang: string) {
  return ['zh', 'ja', 'ko'].includes(lang)
}

function normalizeRenderedText(text: string) {
  let cleanText = text.replace(/<[^>]*>/g, '')

  Object.entries(htmlEntityMap).forEach(([entity, char]) => {
    cleanText = cleanText.replace(new RegExp(entity, 'g'), char)
  })

  cleanText = cleanText.replace(/\s+/g, ' ')
  cleanText = cleanText.replace(/([。？！："」』])\s+/g, '$1')

  return cleanText.trim()
}

function cleanMarkdownForExcerpt(markdown: string) {
  return stripCitationSyntax(markdown)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*#{1,6}\s+\S.*$/gm, '')
    .replace(/^\s*::.*$/gm, '')
    .replace(/^\s*>\s*\[!.*\]$/gm, '')
    .replace(/\n{2,}/g, '\n\n')
}

export function getExcerpt(text: string, lang: string, scene: ExcerptScene): string {
  const length = isCJKLanguage(lang)
    ? excerptLengths[scene].cjk
    : excerptLengths[scene].other
  const excerpt = normalizeRenderedText(text).slice(0, length).trim()

  if (normalizeRenderedText(text).length > length) {
    return `${excerpt.replace(/\p{P}+$/u, '')}...`
  }

  return excerpt
}

export function extractPlainTextFromMarkdown(markdown: string) {
  const renderedContent = markdownParser.render(cleanMarkdownForExcerpt(markdown))
  return normalizeRenderedText(renderedContent)
}

export function extractExcerptFromMarkdown(markdown: string, lang: string, scene: ExcerptScene) {
  return getExcerpt(extractPlainTextFromMarkdown(markdown), lang, scene)
}
