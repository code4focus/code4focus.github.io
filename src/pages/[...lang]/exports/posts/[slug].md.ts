import type { APIContext } from 'astro'
import type { PostStaticPathProps } from '@/utils/content'
import { getPostStaticPaths } from '@/utils/content'
import { getPostAbsoluteUrl, renderPostMarkdownExport } from '@/utils/markdown-export'

export async function getStaticPaths() {
  return getPostStaticPaths()
}

export async function GET({ props }: APIContext<PostStaticPathProps>) {
  const { post, routeLang, slug } = props
  const body = await renderPostMarkdownExport(post, routeLang)
  const canonicalUrl = getPostAbsoluteUrl(slug, routeLang, 'html')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${slug}.md"`,
      'Link': `<${canonicalUrl}>; rel="canonical"`,
      'X-Robots-Tag': 'noindex',
    },
  })
}
