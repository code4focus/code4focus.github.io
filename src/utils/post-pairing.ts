import type { Language } from '../i18n/config'
import { langMap } from '../i18n/config'

export interface PostSlugSource {
  id: string
  data: {
    abbrlink?: string | null
  }
}

const pairedPostLanguages = Object.keys(langMap) as Language[]
const localePatternSource = pairedPostLanguages
  .slice()
  .sort((left, right) => right.length - left.length)
  .map(lang => lang.replace('-', '\\-'))
  .join('|')
const markdownExtensionPattern = /\.(?:md|mdx)$/i
const localeSuffixPattern = new RegExp(`-(${localePatternSource})$`)

export function normalizeContentPath(value: string) {
  return value.replace(/\\/g, '/')
}

export function getPairedPostKey(idOrPath: string) {
  return normalizeContentPath(idOrPath)
    .replace(markdownExtensionPattern, '')
    .replace(localeSuffixPattern, '')
}

export function getPairedPostSiblingCandidatePaths(idOrPath: string) {
  const pairKey = getPairedPostKey(idOrPath)
  return [
    `${pairKey}.md`,
    `${pairKey}.mdx`,
    ...pairedPostLanguages.flatMap(lang => [
      `${pairKey}-${lang}.md`,
      `${pairKey}-${lang}.mdx`,
    ]),
  ]
}

export function getPairedPostSlug(post: PostSlugSource) {
  const abbrlink = typeof post.data.abbrlink === 'string'
    ? post.data.abbrlink.trim()
    : ''

  return abbrlink || getPairedPostKey(post.id)
}
