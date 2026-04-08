import type { Language } from '@/i18n/config'

interface Translation {
  title: string
  subtitle: string
  description: string
  posts: string
  tags: string
  about: string
  toc: string
}

export const ui: Record<Language, Translation> = {
  en: {
    title: 'Code4Focus',
    subtitle: 'Build with focus, write with clarity',
    description: 'Code4Focus is a personal blog built with Astro and Retypeset, focused on software, AI, product thinking, and long-term craftsmanship.',
    posts: 'Posts',
    tags: 'Tags',
    about: 'About',
    toc: 'Table of Contents',
  },
  zh: {
    title: 'Code4Focus',
    subtitle: '专注地构建，清晰地表达',
    description: 'Code4Focus 是一个使用 Astro 与 Retypeset 构建的个人博客，记录软件工程、AI、产品思考与长期主义相关的内容。',
    posts: '文章',
    tags: '标签',
    about: '关于',
    toc: '目录',
  },
}
