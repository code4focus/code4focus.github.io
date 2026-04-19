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
  seo: {
    homeTitle: string
    homeDescription: string
    aboutTitle: string
    aboutDescription: string
    tagsTitle: string
    tagsDescription: string
    tagTitle: (tag: string) => string
    tagDescription: (tag: string, count: number) => string
  }
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
    seo: {
      homeTitle: 'Software engineering, AI, product thinking, and durable systems',
      homeDescription: 'Essays and project notes on software engineering, AI tools, product thinking, and work worth compounding over time.',
      aboutTitle: 'About Code4Focus',
      aboutDescription: 'Learn what Code4Focus writes about, how the site is built, and why the blog emphasizes speed, clarity, and long-term craft.',
      tagsTitle: 'Tags and topics',
      tagsDescription: 'Browse tags across software engineering, AI, product thinking, and related notes published on Code4Focus.',
      tagTitle: tag => `Tag: ${tag}`,
      tagDescription: (tag, count) => `Browse ${count} ${count === 1 ? 'post' : 'posts'} tagged ${tag} on Code4Focus.`,
    },
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
    seo: {
      homeTitle: '软件工程、AI 与长期积累',
      homeDescription: '这里记录软件开发、AI 工具、产品思考，以及那些值得长期投入、反复打磨的事情。',
      aboutTitle: '关于 Code4Focus',
      aboutDescription: '了解 Code4Focus 的写作方向、建站方式，以及这个站点为何强调速度、清晰表达与长期主义。',
      tagsTitle: '标签与主题',
      tagsDescription: '按标签浏览软件工程、AI、产品思考与相关记录。',
      tagTitle: tag => `标签：${tag}`,
      tagDescription: (tag, count) => `浏览标签「${tag}」下的 ${count} 篇文章，内容涵盖软件工程、AI、产品思考等主题。`,
    },
  },
}
