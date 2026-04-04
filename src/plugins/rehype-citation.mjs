function createText(value) {
  return {
    type: 'text',
    value,
  }
}

function createElement(tagName, properties = {}, children = []) {
  return {
    type: 'element',
    tagName,
    properties,
    children,
  }
}

function getProperty(node, key) {
  return typeof node.properties?.[key] === 'string'
    ? node.properties[key]
    : ''
}

function createCitationReference(node) {
  const sourceId = getProperty(node, 'data-cite-id')
  const preview = getProperty(node, 'data-cite-preview')
  const index = getProperty(node, 'data-cite-index')
  const occurrence = getProperty(node, 'data-cite-occurrence')

  return createElement('sup', { className: ['cite-ref'] }, [
    createElement(
      'a',
      {
        'href': `#cite-${sourceId}`,
        'id': `cite-ref-${sourceId}-${occurrence}`,
        'data-cite-id': sourceId,
        'data-cite-preview': preview,
        'data-cite-index': index,
      },
      [createText(`[${index}]`)],
    ),
  ])
}

function extractCitationNodes(node, definitionElements) {
  if (!Array.isArray(node.children)) {
    return
  }

  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index]

    if (child.type === 'element' && child.tagName === 'citation-definition') {
      const sourceId = getProperty(child, 'data-cite-id')
      if (sourceId) {
        definitionElements.set(sourceId, child)
      }

      node.children.splice(index, 1)
      index -= 1
      continue
    }

    if (child.type === 'element' && child.tagName === 'citation-ref') {
      node.children[index] = createCitationReference(child)
      continue
    }

    extractCitationNodes(child, definitionElements)
  }
}

function createBacklinks(sourceId, referenceCount) {
  if (referenceCount === 0) {
    return null
  }

  const children = []

  for (let occurrence = 1; occurrence <= referenceCount; occurrence++) {
    if (children.length > 0) {
      children.push(createText(' '))
    }

    children.push(
      createElement(
        'a',
        {
          'href': `#cite-ref-${sourceId}-${occurrence}`,
          'className': ['citation-backref'],
          'aria-label': `Back to citation ${occurrence}`,
        },
        [createText(referenceCount === 1 ? '↩' : `↩${occurrence}`)],
      ),
    )
  }

  return createElement('span', { className: ['citation-backrefs'] }, children)
}

function attachBacklinks(itemChildren, backlinks) {
  if (!backlinks) {
    return
  }

  const lastChild = itemChildren.at(-1)
  if (lastChild?.type === 'element' && lastChild.tagName === 'p') {
    lastChild.children.push(createText(' '), backlinks)
    return
  }

  itemChildren.push(createElement('p', {}, [backlinks]))
}

function createCitationList(orderedSourceIds, definitions, definitionElements) {
  const items = orderedSourceIds.map((sourceId) => {
    const definition = definitions[sourceId]
    const definitionElement = definitionElements.get(sourceId)
    const itemChildren = definitionElement
      ? structuredClone(definitionElement.children)
      : [createElement('p', {}, [createText(definition.short || sourceId)])]

    const backlinks = createBacklinks(sourceId, definition.referenceCount)
    attachBacklinks(itemChildren, backlinks)

    return createElement('li', { id: `cite-${sourceId}` }, itemChildren)
  })

  return createElement(
    'section',
    {
      'className': ['citation-list'],
      'aria-label': 'References',
    },
    [createElement('ol', {}, items)],
  )
}

function createCitationTemplates(orderedSourceIds, definitions, definitionElements) {
  const templates = []

  for (const sourceId of orderedSourceIds) {
    const definition = definitions[sourceId]
    const definitionElement = definitionElements.get(sourceId)

    for (const previewMode of definition.previewModes) {
      const children = previewMode === 'short'
        ? [createElement('p', {}, [createText(definition.short)])]
        : structuredClone(definitionElement?.children ?? [])

      templates.push(
        createElement(
          'template',
          {
            'data-cite-template': `${sourceId}:${previewMode}`,
          },
          children,
        ),
      )
    }
  }

  if (templates.length === 0) {
    return null
  }

  return createElement(
    'div',
    {
      id: 'citation-templates',
      hidden: true,
    },
    templates,
  )
}

export function rehypeCitation() {
  return (tree, file) => {
    const citationState = file.data.citations
    if (!citationState) {
      return
    }

    const definitionElements = new Map()
    extractCitationNodes(tree, definitionElements)

    const citationList = createCitationList(
      citationState.orderedSourceIds,
      citationState.definitions,
      definitionElements,
    )

    tree.children.push(citationList)

    const templates = createCitationTemplates(
      citationState.orderedSourceIds,
      citationState.definitions,
      definitionElements,
    )

    if (templates) {
      tree.children.push(templates)
    }
  }
}
