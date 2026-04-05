import type { APIRoute } from 'astro'
import { base, moreLocales } from '@/config'

export const GET: APIRoute = ({ site }) => {
  const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '')
  const withBase = (path: string) => `${normalizedBase}/${path}`.replace(/\/{2,}/g, '/')
  const sitemapURL = new URL('sitemap-index.xml', site)
  const exportDisallowRules = [
    `Disallow: ${withBase('exports/')}`,
    ...moreLocales.map(lang => `Disallow: ${withBase(`${lang}/exports/`)}`),
  ]

  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    `Disallow: ${withBase('~partytown/')}`,
    ...exportDisallowRules,
    '',
    `Sitemap: ${sitemapURL.href}`,
  ].join('\n')

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
