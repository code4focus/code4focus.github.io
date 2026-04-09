import type { Language } from '@/i18n/config'
import type { Post } from '@/types'
import { themeConfig } from '@/config'
import { langMap } from '@/i18n/config'
import { getLocalizedPath, getPostPath, getTagPath } from '@/i18n/path'
import { getPostSlug } from '@/utils/content'

export type JsonLdNode = Record<string, unknown>

export interface NamedPathItem {
  name: string
  path: string
}

interface WebPageSchemaOptions {
  type: 'AboutPage' | 'CollectionPage'
  name: string
  description: string
  path: string
  lang: Language
  siteOrigin: URL
}

function getLanguageCode(lang: Language) {
  return langMap[lang][0]
}

export function getSiteOrigin(site?: URL | string) {
  return site instanceof URL
    ? site
    : new URL(site ?? themeConfig.site.url)
}

export function toAbsoluteUrl(path: string, siteOrigin: URL) {
  return new URL(path, siteOrigin).toString()
}

function getWebsiteId(lang: Language, siteOrigin: URL) {
  return `${toAbsoluteUrl(getLocalizedPath('/', lang), siteOrigin)}#website`
}

export function createWebSiteSchema(options: {
  name: string
  description: string
  lang: Language
  siteOrigin: URL
}): JsonLdNode {
  const url = toAbsoluteUrl(getLocalizedPath('/', options.lang), options.siteOrigin)

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    'name': options.name,
    'description': options.description,
    'url': url,
    'inLanguage': getLanguageCode(options.lang),
  }
}

export function createWebPageSchema(options: WebPageSchemaOptions): JsonLdNode {
  const url = toAbsoluteUrl(options.path, options.siteOrigin)

  return {
    '@context': 'https://schema.org',
    '@type': options.type,
    '@id': `${url}#webpage`,
    'name': options.name,
    'description': options.description,
    'url': url,
    'inLanguage': getLanguageCode(options.lang),
    'isPartOf': {
      '@id': getWebsiteId(options.lang, options.siteOrigin),
    },
  }
}

export function createItemListSchema(
  items: NamedPathItem[],
  siteOrigin: URL,
  name?: string,
): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(name ? { name } : {}),
    'numberOfItems': items.length,
    'itemListOrder': 'https://schema.org/ItemListUnordered',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'url': toAbsoluteUrl(item.path, siteOrigin),
    })),
  }
}

export function createBreadcrumbSchema(
  items: NamedPathItem[],
  siteOrigin: URL,
): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': toAbsoluteUrl(item.path, siteOrigin),
    })),
  }
}

export function createPostListItems(posts: Post[], lang: Language): NamedPathItem[] {
  return posts.map(post => ({
    name: post.data.title,
    path: getPostPath(getPostSlug(post), lang),
  }))
}

export function createTagListItems(tags: string[], lang: Language): NamedPathItem[] {
  return tags.map(tag => ({
    name: tag,
    path: getTagPath(tag, lang),
  }))
}
