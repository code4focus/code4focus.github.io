/* eslint-disable test/no-import-node-test */

import type { SemanticPostLike } from './content-semantics'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildRelatedPosts, buildSemanticGroups } from './content-semantics'

function createPost(
  id: string,
  options: {
    lang?: 'en' | 'zh'
    order?: number
    published: string
    seriesId?: string
    seriesKind?: 'series' | 'timeline' | 'evergreen'
    seriesTitle?: string
    tags?: string[]
    title: string
  },
): SemanticPostLike {
  return {
    id,
    data: {
      lang: options.lang ?? 'en',
      published: new Date(options.published),
      series: options.seriesId
        ? {
            id: options.seriesId,
            kind: options.seriesKind,
            order: options.order,
            title: options.seriesTitle,
          }
        : undefined,
      tags: options.tags ?? [],
      title: options.title,
    },
  }
}

test('buildSemanticGroups sorts grouped posts by semantic order and preserves languages', () => {
  const posts = [
    createPost('series-en-2', {
      lang: 'en',
      order: 2,
      published: '2026-04-02T00:00:00.000Z',
      seriesId: 'build-notes',
      seriesKind: 'series',
      seriesTitle: 'Build Notes',
      title: 'Part 2',
    }),
    createPost('series-zh-1', {
      lang: 'zh',
      order: 1,
      published: '2026-04-01T00:00:00.000Z',
      seriesId: 'build-notes',
      seriesKind: 'series',
      title: '第一部分',
    }),
    createPost('series-en-3', {
      lang: 'en',
      published: '2026-04-03T00:00:00.000Z',
      seriesId: 'build-notes',
      title: 'Part 3',
    }),
  ]

  const groups = buildSemanticGroups(posts)

  assert.equal(groups.length, 1)
  assert.equal(groups[0]?.id, 'build-notes')
  assert.equal(groups[0]?.title, 'Build Notes')
  assert.equal(groups[0]?.kind, 'series')
  assert.deepEqual(groups[0]?.languages, ['zh', 'en'])
  assert.deepEqual(groups[0]?.posts.map(post => post.id), ['series-zh-1', 'series-en-2', 'series-en-3'])
})

test('buildRelatedPosts prioritizes shared semantic groups before tag-only matches', () => {
  const currentPost = createPost('current', {
    order: 1,
    published: '2026-04-01T00:00:00.000Z',
    seriesId: 'roadmap',
    tags: ['AI', 'Product'],
    title: 'Roadmap Part 1',
  })
  const posts = [
    currentPost,
    createPost('same-series-2', {
      order: 2,
      published: '2026-04-02T00:00:00.000Z',
      seriesId: 'roadmap',
      tags: ['AI'],
      title: 'Roadmap Part 2',
    }),
    createPost('tag-match', {
      published: '2026-04-05T00:00:00.000Z',
      tags: ['AI'],
      title: 'Tag Match',
    }),
    createPost('same-series-3', {
      order: 3,
      published: '2026-04-03T00:00:00.000Z',
      seriesId: 'roadmap',
      tags: ['Product'],
      title: 'Roadmap Part 3',
    }),
  ]

  const relatedPosts = buildRelatedPosts(currentPost, posts, 3)

  assert.deepEqual(relatedPosts.map(post => post.id), [
    'same-series-2',
    'same-series-3',
    'tag-match',
  ])
})
