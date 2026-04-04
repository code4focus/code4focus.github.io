import { toString } from 'mdast-util-to-string'
import getReadingTime from 'reading-time'

function stripCitationDefinitions(node) {
  if (!Array.isArray(node.children)) {
    return
  }

  node.children = node.children.filter(child =>
    !(child.type === 'containerDirective' && child.name === 'cite-def'),
  )

  node.children.forEach(stripCitationDefinitions)
}

export function remarkReadingTime() {
  return (tree, { data }) => {
    const readingTree = structuredClone(tree)
    stripCitationDefinitions(readingTree)

    const textOnPage = toString(readingTree)
    const readingTime = getReadingTime(textOnPage)

    data.astro.frontmatter.minutes = Math.max(1, Math.round(readingTime.minutes))
  }
}
