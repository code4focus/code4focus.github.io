import type { Language } from '@/i18n/config'

interface FollowTranslation {
  nav: string
  pageTitle: string
  pageDescription: string
  heroTitle: string
  heroBody: string
  homeTitle: string
  homeBody: string
  pageAction: string
  postTitle: string
  postBody: string
  rssTitle: string
  rssDescription: string
  rssAction: string
  atomTitle: string
  atomDescription: string
  atomAction: string
  markdownTitle: string
  markdownDescription: string
  markdownAction: string
  browsePostsAction: string
  recentExportsTitle: string
  recentExportsDescription: string
  viewPostAction: string
}

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
  follow: FollowTranslation
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
    kindSeries: 'Series',
    kindTimeline: 'Timeline',
    kindEvergreen: 'Evergreen',
    follow: {
      nav: 'Follow',
      pageTitle: 'Follow Code4Focus',
      pageDescription: 'Use RSS or Atom to keep up with new posts, and grab clean Markdown exports when you want a portable copy.',
      heroTitle: 'Follow without the growth stack',
      heroBody: 'Code4Focus stays static-first: no popups, no embedded email forms, just durable links you can keep in your reader, automation, or notes workflow.',
      homeTitle: 'Follow without the noise',
      homeBody: 'Use RSS or Atom for new posts, or open the follow page for the lightweight subscription options.',
      pageAction: 'Open follow options',
      postTitle: 'Keep this post close',
      postBody: 'Download a Markdown copy of this article, or follow the site via RSS and Atom for future updates.',
      rssTitle: 'RSS feed',
      rssDescription: 'Best default for most feed readers, automations, and inbox services that speak RSS.',
      rssAction: 'Open RSS feed',
      atomTitle: 'Atom feed',
      atomDescription: 'Use Atom when your reader prefers richer update metadata or already expects Atom.',
      atomAction: 'Open Atom feed',
      markdownTitle: 'Markdown exports',
      markdownDescription: 'Every post exposes a clean `.md` export for offline reading, clipping, or pulling into your own notes.',
      markdownAction: 'Download Markdown',
      browsePostsAction: 'Browse posts',
      recentExportsTitle: 'Portable copies',
      recentExportsDescription: 'Recent posts also ship with Markdown exports. Pick a post and keep a portable copy.',
      viewPostAction: 'Open post',
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
    kindSeries: '系列',
    kindTimeline: '时间线',
    kindEvergreen: '长青',
    follow: {
      nav: '订阅',
      pageTitle: '订阅 Code4Focus',
      pageDescription: '通过 RSS 或 Atom 跟进新文章，需要便携副本时可直接导出 Markdown。',
      heroTitle: '用最轻的方式订阅',
      heroBody: 'Code4Focus 保持静态优先：没有弹窗，没有沉重的表单插件，只有可以长期保存的链接，适合阅读器、自动化和笔记流。',
      homeTitle: '轻量订阅，无需噪音',
      homeBody: '用 RSS 或 Atom 跟进新文章，或进入订阅页查看全部轻量订阅选项。',
      pageAction: '查看订阅选项',
      postTitle: '把这篇文章带走',
      postBody: '你可以下载这篇文章的 Markdown 副本，也可以通过 RSS 或 Atom 持续跟进后续更新。',
      rssTitle: 'RSS 订阅',
      rssDescription: '大多数阅读器、自动化服务和 inbox 工具都优先支持 RSS。',
      rssAction: '打开 RSS feed',
      atomTitle: 'Atom 订阅',
      atomDescription: '如果你的阅读器偏好 Atom，或需要更完整的更新元数据，可以使用它。',
      atomAction: '打开 Atom feed',
      markdownTitle: 'Markdown 导出',
      markdownDescription: '每篇文章都提供干净的 `.md` 导出，适合离线阅读、收藏剪藏或纳入你的笔记系统。',
      markdownAction: '下载 Markdown',
      browsePostsAction: '浏览文章',
      recentExportsTitle: '便携副本',
      recentExportsDescription: '最近发布的文章也都带有 Markdown 导出入口，你可以直接挑一篇保存。',
      viewPostAction: '打开文章',
    },
  },
}
