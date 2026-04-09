import type { Language } from '@/i18n/config'
import { base } from '@/config'
import { getLangRouteParam } from '@/i18n/lang'

export type FeedFormat = 'rss' | 'atom'

export function getFeedPath(lang: Language, format: FeedFormat) {
  const langParam = getLangRouteParam(lang)
  const path = `${base}/${langParam ? `${langParam}/` : ''}${format}.xml`
  return path.replace(/\/{2,}/g, '/')
}

export function getFeedAbsoluteUrl(lang: Language, format: FeedFormat, siteOrigin: URL) {
  return new URL(getFeedPath(lang, format), siteOrigin).toString()
}
