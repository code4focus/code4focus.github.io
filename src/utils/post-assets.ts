import type { ImageMetadata } from 'astro'
import { getImage } from 'astro:assets'
import { memoize } from '@/utils/cache'

const imagesGlob = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/posts/_images/**/*.{jpeg,jpg,png,gif,webp}',
)

async function _getAbsolutePostImageUrl(srcPath: string, baseUrl: string) {
  const prefixRemoved = srcPath.replace(/^(?:\.\.\/)+|^\.\//, '')
  const absolutePath = `/src/content/posts/${prefixRemoved}`
  const imageImporter = imagesGlob[absolutePath]

  if (!imageImporter) {
    return null
  }

  const imageMetadata = await imageImporter()
    .then(importedModule => importedModule.default)
    .catch((error) => {
      console.warn(`Failed to import image: ${absolutePath}`, error)
      return null
    })

  if (!imageMetadata) {
    return null
  }

  const optimizedImage = await getImage({ src: imageMetadata })
  return new URL(optimizedImage.src, baseUrl).toString()
}

export const getAbsolutePostImageUrl = memoize(_getAbsolutePostImageUrl)
