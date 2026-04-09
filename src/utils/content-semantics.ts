import type { Language } from '@/i18n/config'

export const postSeriesKinds = ['series', 'timeline', 'evergreen'] as const

export type PostSeriesKind = (typeof postSeriesKinds)[number]

export interface PostSeriesData {
  id: string
  title?: string
  kind?: PostSeriesKind
  order?: number
}

export interface SemanticPostLike {
  id: string
  data: {
    lang?: Language | ''
    published: Date
    series?: PostSeriesData
    tags?: string[]
    title: string
  }
}

export interface PostSemanticGroup<T extends SemanticPostLike = SemanticPostLike> {
  id: string
  kind: PostSeriesKind
  languages: Language[]
  posts: T[]
  title: string
}

function formatSeriesTitle(seriesId: string) {
  const segments = seriesId
    .split('-')
    .map(segment => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return seriesId
  }

  return segments
    .map(segment => `${segment[0]!.toUpperCase()}${segment.slice(1)}`)
    .join(' ')
}

function getSeriesId(post: SemanticPostLike) {
  return post.data.series?.id?.trim() ?? ''
}

function countSharedTags(left: SemanticPostLike, right: SemanticPostLike) {
  const rightTags = new Set(right.data.tags ?? [])
  return (left.data.tags ?? []).filter(tag => rightTags.has(tag)).length
}

export function compareSemanticPosts<T extends SemanticPostLike>(left: T, right: T) {
  const leftOrder = left.data.series?.order
  const rightOrder = right.data.series?.order

  if (typeof leftOrder === 'number' && typeof rightOrder === 'number' && leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  if (typeof leftOrder === 'number' && typeof rightOrder !== 'number') {
    return -1
  }

  if (typeof leftOrder !== 'number' && typeof rightOrder === 'number') {
    return 1
  }

  const publishedDiff = left.data.published.valueOf() - right.data.published.valueOf()
  if (publishedDiff !== 0) {
    return publishedDiff
  }

  return left.data.title.localeCompare(right.data.title)
}

export function buildSemanticGroups<T extends SemanticPostLike>(posts: T[]): PostSemanticGroup<T>[] {
  const groups = new Map<string, T[]>()

  posts.forEach((post) => {
    const seriesId = getSeriesId(post)
    if (!seriesId) {
      return
    }

    const current = groups.get(seriesId)
    if (current) {
      current.push(post)
    }
    else {
      groups.set(seriesId, [post])
    }
  })

  return Array.from(groups.entries(), ([id, groupedPosts]) => {
    const posts = [...groupedPosts].sort(compareSemanticPosts)
    const title = posts.find(post => post.data.series?.title?.trim())?.data.series?.title?.trim() ?? formatSeriesTitle(id)
    const kind = posts.find(post => post.data.series?.kind)?.data.series?.kind ?? 'series'
    const languages = [...new Set(
      posts
        .map(post => post.data.lang)
        .filter((lang): lang is Language => Boolean(lang)),
    )]

    return {
      id,
      kind,
      languages,
      posts,
      title,
    }
  })
    .sort((left, right) => {
      const leftLatest = left.posts.at(-1)?.data.published.valueOf() ?? 0
      const rightLatest = right.posts.at(-1)?.data.published.valueOf() ?? 0
      return rightLatest - leftLatest || left.title.localeCompare(right.title)
    })
}

export function buildRelatedPosts<T extends SemanticPostLike>(
  currentPost: T,
  posts: T[],
  limit = 3,
) {
  const currentSeriesId = getSeriesId(currentPost)
  const relatedPosts: T[] = []
  const seenIds = new Set([currentPost.id])

  if (currentSeriesId) {
    posts
      .filter(post => getSeriesId(post) === currentSeriesId && !seenIds.has(post.id))
      .sort(compareSemanticPosts)
      .forEach((post) => {
        seenIds.add(post.id)
        relatedPosts.push(post)
      })
  }

  posts
    .filter(post => !seenIds.has(post.id))
    .map(post => ({ post, sharedTags: countSharedTags(currentPost, post) }))
    .filter(entry => entry.sharedTags > 0)
    .sort((left, right) =>
      right.sharedTags - left.sharedTags
      || right.post.data.published.valueOf() - left.post.data.published.valueOf()
      || left.post.data.title.localeCompare(right.post.data.title),
    )
    .forEach(({ post }) => {
      seenIds.add(post.id)
      relatedPosts.push(post)
    })

  return relatedPosts.slice(0, limit)
}
