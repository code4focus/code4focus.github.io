import type { Language } from '@/i18n/config'

interface Translation {
  title: string
  subtitle: string
  description: string
  posts: string
  series: string
  seriesDescription: string
  seriesEmpty: string
  inSeries: string
  entries: string
  latest: string
  continueReading: string
  previousArticle: string
  nextArticle: string
  relatedReading: string
  tags: string
  about: string
  toc: string
  kindSeries: string
  kindTimeline: string
  kindEvergreen: string
  skipToContent: string
  skipToArticle: string
  readingTools: string
  readingProgress: string
  readingRemaining: string
  focusMode: string
  exitFocusMode: string
  minutesShort: string
}

export const ui: Record<Language, Translation> = {
  en: {
    title: 'Code4Focus',
    subtitle: 'Build with focus, write with clarity',
    description: 'Code4Focus is a personal blog built with Astro and Retypeset, focused on software, AI, product thinking, and long-term craftsmanship.',
    posts: 'Posts',
    series: 'Series',
    seriesDescription: 'Series, timelines, and evergreen reading paths built from first-party content.',
    seriesEmpty: 'No series have been published in this language yet.',
    inSeries: 'In this series',
    entries: 'entries',
    latest: 'Latest',
    continueReading: 'Continue reading',
    previousArticle: 'Previous article',
    nextArticle: 'Next article',
    relatedReading: 'Related reading',
    tags: 'Tags',
    about: 'About',
    toc: 'Table of Contents',
    kindSeries: 'Series',
    kindTimeline: 'Timeline',
    kindEvergreen: 'Evergreen',
    skipToContent: 'Skip to content',
    skipToArticle: 'Skip to article',
    readingTools: 'Reading tools',
    readingProgress: 'Progress',
    readingRemaining: 'Time left',
    focusMode: 'Focus mode',
    exitFocusMode: 'Exit focus mode',
    minutesShort: 'min',
  },
  zh: {
    title: 'Code4Focus',
    subtitle: '专注地构建，清晰地表达',
    description: 'Code4Focus 是一个使用 Astro 与 Retypeset 构建的个人博客，记录软件工程、AI、产品思考与长期主义相关的内容。',
    posts: '文章',
    series: '系列',
    seriesDescription: '由一方内容语义组织起来的系列、时间线与长青阅读路径。',
    seriesEmpty: '当前语言下还没有可浏览的系列内容。',
    inSeries: '本系列',
    entries: '篇',
    latest: '最新',
    continueReading: '继续阅读',
    previousArticle: '上一篇',
    nextArticle: '下一篇',
    relatedReading: '相关文章',
    tags: '标签',
    about: '关于',
    toc: '目录',
    kindSeries: '系列',
    kindTimeline: '时间线',
    kindEvergreen: '长青',
    skipToContent: '跳到正文',
    skipToArticle: '跳到文章内容',
    readingTools: '阅读工具',
    readingProgress: '阅读进度',
    readingRemaining: '剩余时间',
    focusMode: '专注模式',
    exitFocusMode: '退出专注模式',
    minutesShort: '分钟',
  },
}
