import type { Language } from '../../src/i18n/config'
import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { format as autocorrectFormat } from 'autocorrect-node'
import fg from 'fast-glob'
import { parseDocument, stringify } from 'yaml'
import { langMap } from '../../src/i18n/config'
import { extractExcerptFromMarkdown, extractPlainTextFromMarkdown } from '../../src/utils/post-excerpt'

type FocusLang = Language
type Severity = 'error' | 'warning'
type ContentProfile = 'post' | 'about'
type ContentScope = 'posts' | 'about' | 'all'
type ProseProfile = 'han' | 'western'

export interface PostLintOptions {
  fix?: boolean
  includeMetadata?: boolean
  includeBody?: boolean
  filePatterns?: string[]
  scope?: ContentScope
}

export interface PostLintFinding {
  filePath: string
  line: number
  column: number
  severity: Severity
  code: string
  message: string
}

export interface PostLintRunResult {
  totalFiles: number
  changedFiles: string[]
  findings: PostLintFinding[]
  errors: number
  warnings: number
  fixesApplied: number
}

interface SplitMarkdownContent {
  frontmatter: string
  body: string
  hasFrontmatter: boolean
}

interface FrontmatterAnalysis {
  frontmatter: string
  findings: PostLintFinding[]
  effectiveLang?: FocusLang
  fixesApplied: number
}

interface LintTargetFile {
  filePath: string
  profile: ContentProfile
}

const defaultPatternsByScope: Record<ContentScope, string[]> = {
  posts: ['src/content/posts/site/**/*.{md,mdx}'],
  about: ['src/content/about/site/**/*.{md,mdx}'],
  all: [
    'src/content/posts/site/**/*.{md,mdx}',
    'src/content/about/site/**/*.{md,mdx}',
  ],
}
const frontmatterPattern = /^---\r?\n([\s\S]+?)\r?\n---\r?\n?([\s\S]*)$/
const frontmatterOrder = [
  'title',
  'published',
  'description',
  'updated',
  'tags',
  'series',
  'draft',
  'pin',
  'toc',
  'lang',
  'abbrlink',
] as const
const supportedLanguages = Object.keys(langMap) as Language[]
const filenameLangPattern = new RegExp(`-(${supportedLanguages
  .slice()
  .sort((left, right) => right.length - left.length)
  .map(lang => lang.replace('-', '\\-'))
  .join('|')})\\.(?:md|mdx)$`)
const localeToProfile: Record<Language, ProseProfile> = {
  en: 'western',
  zh: 'han',
}

const hanStopWords = new Set([
  '的',
  '了',
  '和',
  '是',
  '在',
  '与',
  '及',
  '并',
  '把',
  '被',
  '让',
  '从',
  '对',
  '就',
  '都',
  '也',
  '很',
  '更',
  '最',
  '能',
  '会',
  '这',
  '那',
  '一个',
  '一种',
  '这个',
  '那个',
  '我们',
  '你们',
  '他们',
  '是否',
  '什么',
  '为什么',
  '如何',
  '已经',
  '正在',
  '还有',
  '因为',
  '所以',
  '如果',
  '但是',
  '以及',
  '提供',
  '更多',
  '相关',
  '内部',
  '普通',
  '平均',
  '似乎',
  '與',
  '這',
  '這個',
  '這種',
  '那個',
  '為什麼',
  '還有',
  '讓',
  '營生',
])

const stopWordsByLanguage: Record<Language, Set<string>> = {
  en: new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'blog',
    'build',
    'by',
    'for',
    'from',
    'how',
    'in',
    'into',
    'is',
    'it',
    'its',
    'new',
    'of',
    'on',
    'or',
    'post',
    'site',
    'that',
    'the',
    'their',
    'this',
    'to',
    'used',
    'using',
    'validate',
    'with',
    'writing',
  ]),
  zh: hanStopWords,
}

const fallbackTagByLanguage: Record<Language, string> = {
  en: 'Writing',
  zh: '写作',
}

const fullwidthToAsciiMap = new Map<string, string>([
  ['，', ','],
  ['。', '.'],
  ['！', '!'],
  ['？', '?'],
  ['：', ':'],
  ['；', ';'],
  ['（', '('],
  ['）', ')'],
  ['【', '['],
  ['】', ']'],
  ['、', ','],
])

function splitMarkdownContent(content: string): SplitMarkdownContent {
  const match = content.match(frontmatterPattern)
  if (!match) {
    return {
      frontmatter: '',
      body: content,
      hasFrontmatter: false,
    }
  }

  return {
    frontmatter: match[1],
    body: match[2],
    hasFrontmatter: true,
  }
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, '\n')
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

function firstDiffIndex(before: string, after: string) {
  const limit = Math.min(before.length, after.length)
  for (let index = 0; index < limit; index += 1) {
    if (before[index] !== after[index]) {
      return index
    }
  }

  return before.length === after.length ? -1 : limit
}

function createFinding(
  filePath: string,
  line: number,
  column: number,
  severity: Severity,
  code: string,
  message: string,
): PostLintFinding {
  return {
    filePath,
    line,
    column,
    severity,
    code,
    message,
  }
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function normalizeOptionalString(value: unknown) {
  return normalizeString(value).trim()
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') {
      return true
    }
    if (normalized === 'false') {
      return false
    }
  }

  return fallback
}

function normalizeInteger(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  const normalized = Number.parseInt(normalizeString(value), 10)
  return Number.isFinite(normalized) ? normalized : fallback
}

function normalizeTags(value: unknown) {
  const rawTags = Array.isArray(value)
    ? value
    : value == null
      ? []
      : [value]

  const normalized: string[] = []
  const seen = new Set<string>()

  rawTags
    .map(item => normalizeString(item).trim())
    .filter(Boolean)
    .forEach((tag) => {
      const dedupeKey = tag.toLowerCase()
      if (seen.has(dedupeKey)) {
        return
      }

      seen.add(dedupeKey)
      normalized.push(tag)
    })

  return normalized
}

function normalizeLang(value: unknown) {
  const normalized = normalizeOptionalString(value).toLowerCase()
  return normalized
}

function isSupportedLanguage(value: string): value is Language {
  return supportedLanguages.includes(value as Language)
}

function getProseProfile(lang: Language) {
  return localeToProfile[lang]
}

function getFilenameLang(filePath: string): FocusLang | undefined {
  const match = basename(filePath).match(filenameLangPattern)
  return match?.[1] as FocusLang | undefined
}

function inferContentProfile(filePath: string): ContentProfile {
  if (
    filePath.includes('/src/content/posts/')
    || filePath.startsWith('src/content/posts/')
  ) {
    return 'post'
  }

  if (
    filePath.includes('/src/content/about/')
    || filePath.startsWith('src/content/about/')
  ) {
    return 'about'
  }

  throw new Error(`Cannot infer content profile for "${filePath}".`)
}

function inferContentLang(text: string): FocusLang | undefined {
  const hanCount = (text.match(/\p{Script=Han}/gu) ?? []).length
  const latinCount = (text.match(/[a-z]/gi) ?? []).length

  if (hanCount >= 12 && hanCount >= Math.max(8, latinCount / 2)) {
    return 'zh'
  }

  if (latinCount >= 40 && hanCount <= 6) {
    return undefined
  }

  return undefined
}

function trimTrailingWhitespace(value: string) {
  return value
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
}

function splitMarkdownLinePrefix(line: string) {
  let cursor = 0
  while (cursor < line.length && /\s/.test(line[cursor])) {
    cursor += 1
  }

  let prefix = line.slice(0, cursor)
  let content = line.slice(cursor)
  const blockquoteMatch = content.match(/^(>+\s*)/)
  if (blockquoteMatch) {
    prefix += blockquoteMatch[1]
    content = content.slice(blockquoteMatch[1].length)
  }

  const headingMatch = content.match(/^(#{1,6}\s+)/)
  if (headingMatch) {
    return {
      prefix: `${prefix}${headingMatch[1]}`,
      content: content.slice(headingMatch[1].length),
    }
  }

  const listMatch = content.match(/^(?:[-*+]|\d+\.)\s+/)
  if (listMatch) {
    return {
      prefix: `${prefix}${listMatch[0]}`,
      content: content.slice(listMatch[0].length),
    }
  }

  return {
    prefix,
    content,
  }
}

function createMaskToken(index: number) {
  return `\uE000${index.toString(36)}\uE001`
}

function maskPattern(text: string, pattern: RegExp, tokens: string[]) {
  return text.replace(pattern, (match) => {
    const token = createMaskToken(tokens.length)
    tokens.push(match)
    return token
  })
}

function maskInlineSegments(text: string) {
  const tokens: string[] = []
  let masked = text

  const patterns = [
    /!\[[^\]\n]*\]\([^)\n]+\)/g,
    /\[[^\]\n]+\]\([^)\n]+\)/g,
    /<https?:\/\/[^>\n]+>/g,
    /https?:\/\/[^\s>)\]]+/g,
    /`[^`\n]+`/g,
    /:[a-z-]+\[[^\]\n]+\](?:\{[^\n}]*\})?/gi,
    /<[^>\n]+>/g,
  ]

  for (const pattern of patterns) {
    masked = maskPattern(masked, pattern, tokens)
  }

  return { masked, tokens }
}

function unmaskInlineSegments(text: string, tokens: string[]) {
  return tokens.reduce(
    (accumulator, token, index) => accumulator.replaceAll(createMaskToken(index), token),
    text,
  )
}

function normalizeHanText(text: string) {
  return autocorrectFormat(text)
    .replace(/\s+([，。！？：；、）】」』”’])/gu, '$1')
    .replace(/([（【「『“‘])\s+/gu, '$1')
    .replace(/(?<=\p{Script=Han})\(([^()\n]+)\)(?=[\p{Script=Han}，。！？：；、\s]|$)/gu, '（$1）')
}

function normalizeWesternText(text: string) {
  let normalized = text

  fullwidthToAsciiMap.forEach((ascii, fullwidth) => {
    normalized = normalized.replaceAll(fullwidth, ascii)
  })

  normalized = normalized
    .replace(/\s+([,.;:!?)}\]])/g, '$1')
    .replace(/([([{])\s+/g, '$1')
    .replace(/([,;:!?])(?=["'(\p{Letter}])/gu, '$1 ')
    .replace(/(\p{Ll})\.(\p{Lu})/gu, '$1. $2')
    .replace(/(\p{Ll})\.(["'(]\p{Lu})/gu, '$1. $2')
    .replace(/ {2,}/g, ' ')

  return normalized
}

function normalizeProseByLang(text: string, lang?: FocusLang) {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }

  if (!lang) {
    return trimmed
  }

  switch (getProseProfile(lang)) {
    case 'han':
      return normalizeHanText(trimmed)
    case 'western':
      return normalizeWesternText(trimmed)
  }
}

function getLineNumberForKey(frontmatter: string, key: string) {
  const lines = frontmatter.split('\n')
  const index = lines.findIndex(line => line.match(new RegExp(`^${key}:\\s*`)))
  return index >= 0 ? index + 2 : 2
}

function buildOrderedFrontmatter(rawData: Record<string, unknown>) {
  const ordered: Record<string, unknown> = {}

  frontmatterOrder.forEach((key) => {
    if (key in rawData) {
      ordered[key] = rawData[key]
    }
  })

  Object.keys(rawData).forEach((key) => {
    if (!(key in ordered)) {
      ordered[key] = rawData[key]
    }
  })

  return trimTrailingWhitespace(stringify(ordered, { lineWidth: 0 }))
    .replace(/: ""$/gm, ': \'\'')
    .replace(/- ""$/gm, '- \'\'')
    .trim()
}

function formatEnglishTag(tag: string) {
  if (/^[a-z][a-z0-9.+-]*$/.test(tag)) {
    return `${tag[0].toUpperCase()}${tag.slice(1)}`
  }

  return tag
}

function normalizeTagCandidate(rawToken: string, lang: FocusLang) {
  const token = rawToken
    .trim()
    .replace(/^[\s"'“”‘’()[\]{}（）【】「」『』,.;:!?]+|[\s"'“”‘’()[\]{}（）【】「」『』,.;:!?]+$/g, '')

  if (!token || /^\d+$/.test(token)) {
    return ''
  }

  if (getProseProfile(lang) === 'han') {
    if (/^[a-z][a-z0-9.+-]*$/i.test(token)) {
      return token.length >= 3 ? formatEnglishTag(token) : ''
    }

    if (/\p{Script=Han}/u.test(token) && token.length >= 2 && !hanStopWords.has(token)) {
      return token
    }

    return ''
  }

  const normalized = token.toLowerCase()
  const stopWords = stopWordsByLanguage[lang]
  if (/^\p{Letter}[\p{Letter}\p{Number}.+-]*$/u.test(token)) {
    if (normalized.length < 2 || stopWords.has(normalized)) {
      return ''
    }

    return /^[a-z][a-z0-9.+-]*$/i.test(token)
      ? formatEnglishTag(token)
      : token
  }

  return ''
}

function collectWeightedTokens(text: string, lang: FocusLang, weight: number, scores: Map<string, { score: number, display: string }>) {
  const segmenter = new Intl.Segmenter(lang, { granularity: 'word' })
  for (const segment of segmenter.segment(text)) {
    if (!segment.isWordLike) {
      continue
    }

    const candidate = normalizeTagCandidate(segment.segment, lang)
    if (!candidate) {
      continue
    }

    const normalizedKey = /^[\p{Letter}\p{Number}.+-]+$/u.test(candidate)
      ? candidate.toLocaleLowerCase(lang)
      : candidate
    const current = scores.get(normalizedKey)
    scores.set(normalizedKey, {
      score: (current?.score ?? 0) + weight,
      display: current?.display ?? candidate,
    })
  }
}

function generateTags(title: string, body: string, bodyPlainText: string, lang: FocusLang) {
  const scores = new Map<string, { score: number, display: string }>()
  const headingText = body
    .split('\n')
    .filter(line => /^\s*#{1,6}\s+/.test(line))
    .map(line => line.replace(/^\s*#{1,6}\s+/, '').trim())
    .join(' ')

  collectWeightedTokens(title, lang, 4, scores)
  collectWeightedTokens(headingText, lang, 2, scores)
  collectWeightedTokens(bodyPlainText, lang, 1, scores)

  const generated = [...scores.values()]
    .sort((left, right) => right.score - left.score || left.display.localeCompare(right.display))
    .map(entry => entry.display)
    .slice(0, 3)

  if (generated.length > 0) {
    return generated
  }

  return [fallbackTagByLanguage[lang]]
}

function analyzeBody(
  filePath: string,
  body: string,
  lang: FocusLang | undefined,
  bodyStartLine: number,
): { body: string, findings: PostLintFinding[], fixesApplied: number } {
  if (!lang) {
    return {
      body,
      findings: [],
      fixesApplied: 0,
    }
  }

  const lines = body.split('\n')
  const nextLines: string[] = []
  const findings: PostLintFinding[] = []
  let fixesApplied = 0
  let openFence: { char: string, length: number } | null = null
  let inHtmlComment = false

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const lineNumber = bodyStartLine + index

    if (openFence) {
      nextLines.push(line)

      if (isClosingCodeFence(line, openFence)) {
        openFence = null
      }

      continue
    }

    const nextFence = getCodeFence(line)
    if (nextFence) {
      openFence = nextFence
      nextLines.push(line)
      continue
    }

    if (inHtmlComment) {
      nextLines.push(line)
      if (line.includes('-->')) {
        inHtmlComment = false
      }
      continue
    }

    if (line.includes('<!--')) {
      nextLines.push(line)
      if (!line.includes('-->')) {
        inHtmlComment = true
      }
      continue
    }

    const trimmed = line.trim()
    if (
      !trimmed
      || trimmed.startsWith('::')
      || trimmed === '::'
      || trimmed === ':::'
      || /^\[[^\]\n]+\]:\s+\S/.test(trimmed)
      || /^\|/.test(trimmed)
    ) {
      nextLines.push(line)
      continue
    }

    const { prefix, content } = splitMarkdownLinePrefix(line)
    const { masked, tokens } = maskInlineSegments(content)
    const profile = getProseProfile(lang)
    const normalizedMasked = normalizeProseByLang(masked, lang)
    const restored = unmaskInlineSegments(normalizedMasked, tokens)

    if (restored !== content) {
      const diffIndex = Math.max(0, firstDiffIndex(content, restored))
      findings.push(createFinding(
        filePath,
        lineNumber,
        prefix.length + diffIndex + 1,
        'error',
        `${lang}-body-punctuation`,
        profile === 'han'
          ? 'Normalize Han-script punctuation and spacing for prose content.'
          : 'Normalize punctuation width and spacing for prose content.',
      ))
      fixesApplied += 1
    }

    if (profile === 'han' && /["'](?=[^"\n]*\p{Script=Han})/u.test(masked)) {
      findings.push(createFinding(
        filePath,
        lineNumber,
        prefix.length + masked.search(/["']/u) + 1,
        'warning',
        `${lang}-ascii-quotes`,
        'Han-script prose still contains ASCII quotes; review whether CJK quotation marks are more appropriate.',
      ))
    }

    if (profile === 'han' && /([，。！？：；、])\1+/u.test(masked)) {
      findings.push(createFinding(
        filePath,
        lineNumber,
        prefix.length + masked.search(/([，。！？：；、])\1+/u) + 1,
        'warning',
        `${lang}-duplicate-punctuation`,
        'Han-script prose contains repeated punctuation marks; review whether the emphasis is intentional.',
      ))
    }

    if (profile === 'western' && /[「」『』【】]/u.test(masked)) {
      findings.push(createFinding(
        filePath,
        lineNumber,
        prefix.length + masked.search(/[「」『』【】]/u) + 1,
        'warning',
        `${lang}-nonstandard-quotes`,
        'This prose still contains CJK quotation or bracket marks that were not auto-converted.',
      ))
    }

    nextLines.push(`${prefix}${restored}`)
  }

  return {
    body: nextLines.join('\n'),
    findings,
    fixesApplied,
  }
}

function analyzePostFrontmatter(
  filePath: string,
  frontmatter: string,
  body: string,
  bodyPlainText: string,
): FrontmatterAnalysis {
  const findings: PostLintFinding[] = []
  let fixesApplied = 0

  const document = parseDocument(frontmatter, { schema: 'failsafe' })
  if (document.errors.length > 0) {
    return {
      frontmatter,
      effectiveLang: undefined,
      fixesApplied,
      findings: document.errors.map(error => createFinding(
        filePath,
        2,
        1,
        'error',
        'frontmatter-parse',
        `Failed to parse front matter: ${error.message}`,
      )),
    }
  }

  const rawData = document.toJS() as Record<string, unknown> | null
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return {
      frontmatter,
      effectiveLang: undefined,
      fixesApplied,
      findings: [
        createFinding(
          filePath,
          2,
          1,
          'error',
          'frontmatter-shape',
          'Front matter must be a YAML object.',
        ),
      ],
    }
  }

  const nextData: Record<string, unknown> = { ...rawData }
  const currentLang = normalizeLang(rawData.lang)
  const filenameLang = getFilenameLang(filePath)
  const contentLang = inferContentLang(`${normalizeString(rawData.title)}\n${bodyPlainText}`)
  const expectedLang = filenameLang ?? contentLang
  const lintLang = isSupportedLanguage(currentLang)
    ? currentLang
    : expectedLang

  const title = normalizeOptionalString(rawData.title)
  if (!title) {
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'title'),
      1,
      'error',
      'frontmatter-title',
      'Post front matter requires a non-empty `title`.',
    ))
  }
  else {
    const normalizedTitle = normalizeProseByLang(title, lintLang)
    if (normalizedTitle !== title) {
      nextData.title = normalizedTitle
      findings.push(createFinding(
        filePath,
        getLineNumberForKey(frontmatter, 'title'),
        1,
        'error',
        'frontmatter-title-format',
        'Normalize title punctuation and surrounding whitespace.',
      ))
      fixesApplied += 1
    }
    else {
      nextData.title = title
    }
  }

  const description = normalizeOptionalString(rawData.description)
  if (!description) {
    const generatedDescription = normalizeProseByLang(
      extractExcerptFromMarkdown(body, lintLang ?? expectedLang ?? 'en', 'meta'),
      lintLang ?? expectedLang,
    )

    nextData.description = generatedDescription
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'description'),
      1,
      'error',
      'frontmatter-description',
      'Post front matter requires a non-empty `description`; a description can be generated from the post body.',
    ))
    fixesApplied += 1
  }
  else {
    const normalizedDescription = normalizeProseByLang(description, lintLang)
    if (normalizedDescription !== description) {
      nextData.description = normalizedDescription
      findings.push(createFinding(
        filePath,
        getLineNumberForKey(frontmatter, 'description'),
        1,
        'error',
        'frontmatter-description-format',
        'Normalize description punctuation and surrounding whitespace.',
      ))
      fixesApplied += 1
    }
    else {
      nextData.description = description
    }
  }

  const tags = normalizeTags(rawData.tags)
  if (tags.length === 0) {
    const generatedTags = generateTags(title, body, bodyPlainText, lintLang ?? expectedLang ?? 'en')
    nextData.tags = generatedTags
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'tags'),
      1,
      'error',
      'frontmatter-tags',
      'Post front matter requires at least one tag; tags can be generated from title and body keywords.',
    ))
    fixesApplied += 1
  }
  else {
    nextData.tags = tags
    if (JSON.stringify(rawData.tags) !== JSON.stringify(tags)) {
      findings.push(createFinding(
        filePath,
        getLineNumberForKey(frontmatter, 'tags'),
        1,
        'error',
        'frontmatter-tags-normalize',
        'Normalize tags by trimming whitespace and removing duplicates.',
      ))
      fixesApplied += 1
    }
  }

  if (!currentLang && expectedLang) {
    nextData.lang = expectedLang
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'error',
      'frontmatter-lang-missing',
      `Infer missing \`lang\` as \`${expectedLang}\` from the filename or post content.`,
    ))
    fixesApplied += 1
  }
  else if (!currentLang) {
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'error',
      'frontmatter-lang-required',
      'Post front matter requires an explicit `lang` unless the locale can be inferred safely from the filename or body.',
    ))
  }
  else if (currentLang && !isSupportedLanguage(currentLang)) {
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'error',
      'frontmatter-lang-unsupported',
      `Front matter \`lang\` value \`${currentLang}\` is not in the repository's supported locale list.`,
    ))
    nextData.lang = currentLang
  }
  else if (currentLang && filenameLang && currentLang !== filenameLang) {
    nextData.lang = filenameLang
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'error',
      'frontmatter-lang-filename',
      `Front matter \`lang\` should match the filename suffix \`${filenameLang}\`.`,
    ))
    fixesApplied += 1
  }
  else if (currentLang && contentLang && currentLang !== contentLang) {
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'warning',
      'frontmatter-lang-content',
      `Front matter \`lang\` is \`${currentLang}\`, but the content looks closer to \`${contentLang}\`; review whether the post language is intentional.`,
    ))
    nextData.lang = currentLang
  }
  else if (currentLang) {
    nextData.lang = currentLang
  }

  if ('published' in rawData) {
    nextData.published = normalizeString(rawData.published).trim()
  }

  if ('updated' in rawData) {
    nextData.updated = normalizeString(rawData.updated).trim()
  }

  if ('draft' in rawData) {
    nextData.draft = normalizeBoolean(rawData.draft)
  }

  if ('pin' in rawData) {
    nextData.pin = normalizeInteger(rawData.pin)
  }

  if ('toc' in rawData) {
    nextData.toc = normalizeBoolean(rawData.toc)
  }

  if ('abbrlink' in rawData) {
    nextData.abbrlink = normalizeOptionalString(rawData.abbrlink)
  }

  const nextFrontmatter = buildOrderedFrontmatter(nextData)
  return {
    frontmatter: nextFrontmatter,
    effectiveLang: isSupportedLanguage(normalizeLang(nextData.lang)) ? normalizeLang(nextData.lang) as Language : lintLang,
    findings,
    fixesApplied,
  }
}

function analyzeAboutFrontmatter(
  filePath: string,
  frontmatter: string,
  bodyPlainText: string,
): FrontmatterAnalysis {
  const findings: PostLintFinding[] = []
  let fixesApplied = 0

  const document = parseDocument(frontmatter, { schema: 'failsafe' })
  if (document.errors.length > 0) {
    return {
      frontmatter,
      effectiveLang: undefined,
      fixesApplied,
      findings: document.errors.map(error => createFinding(
        filePath,
        2,
        1,
        'error',
        'frontmatter-parse',
        `Failed to parse front matter: ${error.message}`,
      )),
    }
  }

  const rawData = document.toJS() as Record<string, unknown> | null
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return {
      frontmatter,
      effectiveLang: undefined,
      fixesApplied,
      findings: [
        createFinding(
          filePath,
          2,
          1,
          'error',
          'frontmatter-shape',
          'Front matter must be a YAML object.',
        ),
      ],
    }
  }

  const nextData: Record<string, unknown> = { ...rawData }
  const currentLang = normalizeLang(rawData.lang)
  const filenameLang = getFilenameLang(filePath)
  const contentLang = inferContentLang(bodyPlainText)
  const expectedLang = filenameLang ?? contentLang

  if (!currentLang && expectedLang) {
    nextData.lang = expectedLang
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'error',
      'about-lang-missing',
      `Infer missing \`lang\` as \`${expectedLang}\` from the filename or about content.`,
    ))
    fixesApplied += 1
  }
  else if (!currentLang) {
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'error',
      'about-lang-required',
      'About front matter requires an explicit `lang` unless the locale can be inferred safely from the filename or body.',
    ))
  }
  else if (currentLang && !isSupportedLanguage(currentLang)) {
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'error',
      'about-lang-unsupported',
      `About front matter \`lang\` value \`${currentLang}\` is not in the repository's supported locale list.`,
    ))
    nextData.lang = currentLang
  }
  else if (currentLang && filenameLang && currentLang !== filenameLang) {
    nextData.lang = filenameLang
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'error',
      'about-lang-filename',
      `About front matter \`lang\` should match the filename suffix \`${filenameLang}\`.`,
    ))
    fixesApplied += 1
  }
  else if (currentLang && contentLang && currentLang !== contentLang) {
    findings.push(createFinding(
      filePath,
      getLineNumberForKey(frontmatter, 'lang'),
      1,
      'warning',
      'about-lang-content',
      `About front matter \`lang\` is \`${currentLang}\`, but the content looks closer to \`${contentLang}\`; review whether the language is intentional.`,
    ))
    nextData.lang = currentLang
  }
  else if (currentLang) {
    nextData.lang = currentLang
  }

  return {
    frontmatter: buildOrderedFrontmatter(nextData),
    effectiveLang: isSupportedLanguage(normalizeLang(nextData.lang)) ? normalizeLang(nextData.lang) as Language : expectedLang,
    findings,
    fixesApplied,
  }
}

async function collectTargetFiles(filePatterns: string[], scope: ContentScope) {
  const files = await fg(filePatterns.length > 0 ? filePatterns : defaultPatternsByScope[scope], {
    onlyFiles: true,
    unique: true,
  })

  return files
    .sort()
    .map(filePath => ({
      filePath,
      profile: inferContentProfile(filePath),
    }))
}

async function lintFile(target: LintTargetFile, options: Required<PostLintOptions>) {
  const { filePath, profile } = target
  const originalSource = normalizeLineEndings(await readFile(filePath, 'utf8'))
  const { frontmatter, body, hasFrontmatter } = splitMarkdownContent(originalSource)
  const initialFindings: PostLintFinding[] = []
  let nextFrontmatter = frontmatter
  let nextBody = body
  let effectiveLang: FocusLang | undefined
  let fixesApplied = 0
  const bodyStartLine = hasFrontmatter ? frontmatter.split('\n').length + 3 : 1

  if (!hasFrontmatter) {
    initialFindings.push(createFinding(
      filePath,
      1,
      1,
      'error',
      'frontmatter-missing',
      'Markdown posts must start with YAML front matter.',
    ))
  }
  else {
    const bodyPlainText = extractPlainTextFromMarkdown(body)

    if (options.includeMetadata) {
      const metadataResult = profile === 'post'
        ? analyzePostFrontmatter(filePath, frontmatter, body, bodyPlainText)
        : analyzeAboutFrontmatter(filePath, frontmatter, bodyPlainText)
      nextFrontmatter = metadataResult.frontmatter
      effectiveLang = metadataResult.effectiveLang
      initialFindings.push(...metadataResult.findings)
      fixesApplied += metadataResult.fixesApplied
    }
    else {
      const currentLang = normalizeLang(parseDocument(frontmatter, { schema: 'failsafe' }).get('lang'))
      effectiveLang = isSupportedLanguage(currentLang) ? currentLang : undefined
    }

    if (options.includeBody) {
      const bodyResult = analyzeBody(filePath, body, effectiveLang, bodyStartLine)
      nextBody = bodyResult.body
      initialFindings.push(...bodyResult.findings)
      fixesApplied += bodyResult.fixesApplied
    }
  }

  const nextSource = hasFrontmatter
    ? `---\n${nextFrontmatter}\n---\n${nextBody}`
    : originalSource
  const finalSource = trimTrailingWhitespace(nextSource)
  const changed = options.fix && finalSource !== trimTrailingWhitespace(originalSource)

  if (changed) {
    await writeFile(filePath, `${finalSource}\n`, 'utf8')
  }

  if (!options.fix) {
    return {
      changed: false,
      findings: initialFindings,
      fixesApplied: 0,
    }
  }

  if (!changed) {
    return {
      changed: false,
      findings: initialFindings,
      fixesApplied,
    }
  }

  const reparsedSource = normalizeLineEndings(await readFile(filePath, 'utf8'))
  const { frontmatter: reparsedFrontmatter, body: reparsedBody, hasFrontmatter: reparsedHasFrontmatter } = splitMarkdownContent(reparsedSource)
  const finalFindings: PostLintFinding[] = []

  if (!reparsedHasFrontmatter) {
    finalFindings.push(createFinding(
      filePath,
      1,
      1,
      'error',
      'frontmatter-missing',
      'Markdown posts must start with YAML front matter.',
    ))
  }
  else {
    const bodyPlainText = extractPlainTextFromMarkdown(reparsedBody)
    const metadataResult = options.includeMetadata
      ? (
          profile === 'post'
            ? analyzePostFrontmatter(filePath, reparsedFrontmatter, reparsedBody, bodyPlainText)
            : analyzeAboutFrontmatter(filePath, reparsedFrontmatter, bodyPlainText)
        )
      : {
          effectiveLang: (() => {
            const currentLang = normalizeLang(parseDocument(reparsedFrontmatter, { schema: 'failsafe' }).get('lang'))
            return isSupportedLanguage(currentLang) ? currentLang : undefined
          })(),
          findings: [] as PostLintFinding[],
        }
    const finalLang = metadataResult.effectiveLang

    finalFindings.push(...metadataResult.findings)

    if (options.includeBody) {
      finalFindings.push(...analyzeBody(filePath, reparsedBody, finalLang, reparsedFrontmatter.split('\n').length + 3).findings)
    }
  }

  return {
    changed: true,
    findings: finalFindings,
    fixesApplied,
  }
}

export async function runPostLint(options: PostLintOptions = {}): Promise<PostLintRunResult> {
  const resolvedOptions: Required<PostLintOptions> = {
    fix: options.fix ?? false,
    includeMetadata: options.includeMetadata ?? true,
    includeBody: options.includeBody ?? true,
    filePatterns: options.filePatterns ?? [],
    scope: options.scope ?? 'all',
  }
  const files = await collectTargetFiles(resolvedOptions.filePatterns, resolvedOptions.scope)
  const findings: PostLintFinding[] = []
  const changedFiles: string[] = []
  let fixesApplied = 0

  for (const file of files) {
    const result = await lintFile(file, resolvedOptions)
    findings.push(...result.findings)
    fixesApplied += result.fixesApplied

    if (result.changed) {
      changedFiles.push(file.filePath)
    }
  }

  const errors = findings.filter(finding => finding.severity === 'error').length
  const warnings = findings.filter(finding => finding.severity === 'warning').length

  return {
    totalFiles: files.length,
    changedFiles,
    findings,
    errors,
    warnings,
    fixesApplied,
  }
}

export function formatFinding(finding: PostLintFinding) {
  return `${finding.severity.toUpperCase()} ${finding.filePath}:${finding.line}:${finding.column} [${finding.code}] ${finding.message}`
}
