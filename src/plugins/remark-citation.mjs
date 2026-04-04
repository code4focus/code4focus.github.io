import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'

const citationIdPattern = /^\w[\w-]*$/
const previewModes = new Set(['off', 'short', 'full', 'auto'])

function getNodeText(node) {
  return toString(node).trim()
}

function getDirectiveLabel(node) {
  return getNodeText({
    type: 'root',
    children: node.children ?? [],
  })
}

function getDefinitionSourceId(node) {
  const labelNode = node.children?.[0]
  if (!labelNode?.data?.directiveLabel) {
    return ''
  }

  return getNodeText(labelNode)
}

function getDefinitionContent(node) {
  const labelNode = node.children?.[0]
  if (labelNode?.data?.directiveLabel) {
    return node.children.slice(1)
  }

  return node.children ?? []
}

function createDirectiveLabelNode(children) {
  return {
    type: 'paragraph',
    data: {
      directiveLabel: true,
    },
    children: children.length > 0
      ? structuredClone(children)
      : [{ type: 'text', value: '' }],
  }
}

function findLastTextNode(node) {
  if (node.type === 'text') {
    return node
  }

  if (!Array.isArray(node.children)) {
    return null
  }

  for (let index = node.children.length - 1; index >= 0; index--) {
    const result = findLastTextNode(node.children[index])
    if (result) {
      return result
    }
  }

  return null
}

function splitLegacyClosingParagraph(node) {
  if (node.type !== 'paragraph') {
    return null
  }

  if (getNodeText(node) === '::') {
    return { contentNode: null }
  }

  const clonedNode = structuredClone(node)
  const lastTextNode = findLastTextNode(clonedNode)
  if (!lastTextNode || !lastTextNode.value.endsWith('\n::')) {
    return null
  }

  lastTextNode.value = lastTextNode.value.slice(0, -3).replace(/\n$/, '')
  return {
    contentNode: getNodeText(clonedNode) ? clonedNode : null,
  }
}

function normalizeCitationId(sourceId, file, node) {
  const normalizedId = sourceId.trim()
  if (!normalizedId) {
    file.fail('`cite-def` and `cite-ref` require a non-empty citation id.', node)
  }

  if (!citationIdPattern.test(normalizedId)) {
    file.fail(
      `Invalid citation id "${normalizedId}". Use letters, numbers, "-" or "_" and do not end with punctuation.`,
      node,
    )
  }

  return normalizedId
}

function normalizePreviewMode(value, file, node) {
  const preview = typeof value === 'string' && value.trim()
    ? value.trim()
    : 'auto'

  if (!previewModes.has(preview)) {
    file.fail(
      `Invalid citation preview mode "${preview}". Expected one of: off, short, full, auto.`,
      node,
    )
  }

  return preview
}

function resolvePreviewMode(preview, definition, file, node) {
  if (preview === 'off') {
    return 'off'
  }

  if (preview === 'short') {
    if (!definition.short) {
      file.fail(`Citation "${definition.id}" requested short preview but no short content is defined.`, node)
    }

    return 'short'
  }

  if (preview === 'full') {
    return 'full'
  }

  return definition.short ? 'short' : 'full'
}

function convertLegacyCitationDefinitions(node) {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return
  }

  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index]

    if (child?.type === 'leafDirective' && child.name === 'cite-def') {
      const collectedContent = []
      let closingIndex = -1

      for (let cursor = index + 1; cursor < node.children.length; cursor++) {
        const currentNode = node.children[cursor]
        const splitResult = splitLegacyClosingParagraph(currentNode)

        if (splitResult) {
          if (splitResult.contentNode) {
            collectedContent.push(splitResult.contentNode)
          }

          closingIndex = cursor
          break
        }

        collectedContent.push(currentNode)
      }

      if (closingIndex !== -1) {
        const containerNode = {
          type: 'containerDirective',
          name: 'cite-def',
          attributes: structuredClone(child.attributes ?? {}),
          children: [
            createDirectiveLabelNode(child.children ?? []),
            ...collectedContent,
          ],
        }

        node.children.splice(index, closingIndex - index + 1, containerNode)
        convertLegacyCitationDefinitions(containerNode)
        continue
      }
    }

    convertLegacyCitationDefinitions(child)
  }
}

export function remarkCitation() {
  return (tree, file) => {
    file.data.astro ??= {}
    file.data.astro.frontmatter ??= {}
    file.data.astro.frontmatter.hasCitations = false
    file.data.astro.frontmatter.hasCitationPreview = false

    convertLegacyCitationDefinitions(tree)

    const definitions = new Map()

    visit(tree, 'leafDirective', (node) => {
      if (node.name === 'cite-def') {
        file.fail('`cite-def` must use `::cite-def ... ::` or `:::cite-def ... :::` block syntax.', node)
      }
    })

    visit(tree, 'containerDirective', (node) => {
      if (node.name !== 'cite-def') {
        return
      }

      const sourceId = normalizeCitationId(getDefinitionSourceId(node), file, node)
      if (definitions.has(sourceId)) {
        file.fail(`Duplicate citation definition "${sourceId}".`, node)
      }

      const short = typeof node.attributes?.short === 'string'
        ? node.attributes.short.trim()
        : ''

      if ('short' in (node.attributes ?? {}) && !short) {
        file.fail(`Citation "${sourceId}" declares an empty short preview.`, node)
      }

      const contentChildren = getDefinitionContent(node)
      if (contentChildren.length === 0) {
        file.fail(`Citation "${sourceId}" must include full citation content.`, node)
      }

      definitions.set(sourceId, {
        id: sourceId,
        short,
        previewModes: new Set(),
        referenceCount: 0,
        index: 0,
      })

      node.children = contentChildren
      node.data ??= {}
      node.data.hName = 'citation-definition'
      node.data.hProperties = {
        'data-cite-id': sourceId,
        ...(short ? { 'data-cite-short': short } : {}),
      }
    })

    const orderedSourceIds = []
    let hasCitationPreview = false

    visit(tree, 'textDirective', (node) => {
      if (node.name !== 'cite-ref') {
        return
      }

      const sourceId = normalizeCitationId(getDirectiveLabel(node), file, node)
      const definition = definitions.get(sourceId)
      if (!definition) {
        file.fail(`Citation reference "${sourceId}" does not match any citation definition.`, node)
      }

      const preview = normalizePreviewMode(node.attributes?.preview, file, node)
      const resolvedPreview = resolvePreviewMode(preview, definition, file, node)

      if (definition.index === 0) {
        definition.index = orderedSourceIds.length + 1
        orderedSourceIds.push(sourceId)
      }

      definition.referenceCount += 1

      if (resolvedPreview !== 'off') {
        definition.previewModes.add(resolvedPreview)
        hasCitationPreview = true
      }

      node.children = []
      node.data ??= {}
      node.data.hName = 'citation-ref'
      node.data.hProperties = {
        'data-cite-id': sourceId,
        'data-cite-preview': resolvedPreview,
        'data-cite-index': String(definition.index),
        'data-cite-occurrence': String(definition.referenceCount),
      }
    })

    if (orderedSourceIds.length === 0) {
      return
    }

    file.data.astro.frontmatter.hasCitations = true
    file.data.astro.frontmatter.hasCitationPreview = hasCitationPreview
    file.data.citations = {
      orderedSourceIds,
      definitions: Object.fromEntries(
        Array.from(definitions.entries(), ([sourceId, definition]) => [
          sourceId,
          {
            id: definition.id,
            index: definition.index,
            referenceCount: definition.referenceCount,
            short: definition.short,
            previewModes: [...definition.previewModes],
          },
        ]),
      ),
    }
  }
}
