import type { CollectionEntry } from 'astro:content'
import type { ExcerptScene } from './post-excerpt'
import type { Language } from '@/i18n/config'
import { defaultLocale } from '@/config'
import { extractExcerptFromMarkdown, getExcerpt } from './post-excerpt'

// Generates post description from existing description or content
export function getPostDescription(
  post: CollectionEntry<'posts'>,
  scene: ExcerptScene,
): string {
  const lang = (post.data.lang || defaultLocale) as Language

  if (post.data.description) {
    // Only truncate for og scene, return full description for other scenes
    return scene === 'og'
      ? getExcerpt(post.data.description, lang, scene)
      : post.data.description
  }

  return extractExcerptFromMarkdown(post.body || '', lang, scene)
}
