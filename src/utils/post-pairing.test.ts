/* eslint-disable test/no-import-node-test */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getPairedPostKey, getPairedPostSiblingCandidatePaths, getPairedPostSlug } from './post-pairing'

test('getPairedPostSlug falls back to the shared pair stem for localized posts without abbrlink', () => {
  assert.equal(getPairedPostSlug({
    id: 'notes/hello-world-en',
    data: { abbrlink: '' },
  }), 'notes/hello-world')
  assert.equal(getPairedPostSlug({
    id: 'notes/hello-world-zh',
    data: { abbrlink: '' },
  }), 'notes/hello-world')
})

test('getPairedPostSlug prefers an explicit shared abbrlink when present', () => {
  assert.equal(getPairedPostSlug({
    id: 'notes/hello-world-en',
    data: { abbrlink: 'hello-world' },
  }), 'hello-world')
})

test('getPairedPostKey strips markdown extensions and locale suffixes consistently', () => {
  assert.equal(getPairedPostKey('src/content/posts/site/hello-world-en.md'), 'src/content/posts/site/hello-world')
  assert.equal(getPairedPostKey('src/content/posts/site/hello-world-zh.mdx'), 'src/content/posts/site/hello-world')
  assert.equal(getPairedPostKey('src/content/posts/site/universal-post'), 'src/content/posts/site/universal-post')
})

test('getPairedPostSiblingCandidatePaths enumerates the shared pair candidates from one source path', () => {
  assert.deepEqual(
    getPairedPostSiblingCandidatePaths('/tmp/notes/hello-world-en.md'),
    [
      '/tmp/notes/hello-world.md',
      '/tmp/notes/hello-world.mdx',
      '/tmp/notes/hello-world-en.md',
      '/tmp/notes/hello-world-en.mdx',
      '/tmp/notes/hello-world-zh.md',
      '/tmp/notes/hello-world-zh.mdx',
    ],
  )
})
