---
title: 主题上手指南
published: 2025-01-26
updated: 2025-03-12
tags: ["博客主题","指南"]
pin: 99
lang: zh
abbrlink: theme-guide
---

Retypeset 是一款基于 [Astro](https://astro.build/) 框架的静态博客主题，中文名为重新编排。本主题以 [活版印字](https://astro-theme-typography.vercel.app/) 为设计灵感，通过建立全新的视觉规范，对所有页面进行重新编排，打造纸质书页般的阅读体验，再现版式之美。所见皆为细节，方寸尽显优雅。

## 主题配置

以下为 Retypeset 的主题配置介绍。通过修改配置文件 [src/config.ts](https://github.com/radishzzz/astro-theme-retypeset/blob/master/src/config.ts) 来自定义你的博客。

### 站点信息

```ts
site: {
  // 站点标题
  title: 'Retypeset'
  // 站点副标题
  subtitle: 'Revive the beauty of typography'
  // 站点介绍
  description: 'Retypeset is a static blog theme...'
  // 使用 src/i18n/ui.ts 中的多语言标题/副标题/站点描述，替换以上静态配置
  i18nTitle: true // true, false
  // 作者名称
  author: 'radishzz'
  // 站点地址
  url: 'https://retypeset.radishzz.cc'
  // 站点图标
  // 推荐格式: svg, png, ico
  favicon: '/icon/favicon.svg' // 或 https://example.com/favicon.svg
}
```

### 主题配色

```ts
color: {
  // 默认主题
  mode: 'light' // light, dark
  // 亮色模式
  light: {
    // 高亮颜色
    // 用于站点标题、鼠标悬停效果等
    primary: 'oklch(25% 0.005 298)'
    // 次要颜色
    // 用于普通文本
    secondary: 'oklch(40% 0.005 298)'
    // 背景色
    background: 'oklch(96% 0.005 298)'
  }
  // 暗色模式
  dark: {
    // 高亮颜色
    // 用于标题、hover等
    primary: 'oklch(92% 0.005 298)'
    // 次要颜色
    // 用于普通文本
    secondary: 'oklch(77% 0.005 298)'
    // 背景色
    background: 'oklch(22% 0.005 298)'
  }
}
```

### 全局设置

```ts
global: {
  // 默认语言
  // 站点根路径 ‘/’ 的语言
  locale: 'zh' // zh, zh-tw, ja, en, es, ru
  // 更多语言
  // 生成 ‘/ja/' '/en/’ 等多语言路径
  // 不要重复填写默认语言
  moreLocales: ['zh-tw', 'ja', 'en', 'es', 'ru'] // ['zh', 'zh-tw', 'ja', 'en', 'es', 'ru']
  // 字体样式
  fontStyle: 'sans' // sans, serif
  // 文章日期格式
  dateFormat: 'YYYY-MM-DD' // YYYY-MM-DD, MM-DD-YYYY, DD-MM-YYYY, MONTH DAY YYYY, DAY MONTH YYYY
  // 标题与副标题之间的距离
  titleGap: 2 // 1, 2, 3
}
```

### 评论服务

```ts
comment: {
  // 开启评论
  enabled: true // true, false
  // waline 评论
  waline: {
    // 服务器地址
    serverURL: 'https://retypeset-comment.radishzz.cc'
    // emoji 表情地址
    emoji: [
      'https://unpkg.com/@waline/emojis@1.2.0/tw-emoji'
      // 'https://unpkg.com/@waline/emojis@1.2.0/bmoji'
      // 更多表情: https://waline.js.org/en/guide/features/emoji.html
    ]
    // gif 搜索
    search: false // true, false
    // 图片上传
    imageUploader: false // true, false
  }
}
```

### 搜索引擎优化

```ts
seo: {
  // @twitter ID
  twitterID: '@radishzz_'
  // 站点验证
  verification: {
    // google 搜索控制台
    google: 'AUCrz5F1e5qbnmKKDXl2Sf8u6y0kOpEO1wLs6HMMmlM'
    // bing 网站管理员工具
    bing: '64708CD514011A7965C84DDE1D169F87'
    // yandex 网站管理员
    yandex: ''
    // baidu 站长工具
    baidu: ''
  }
  // google 网站分析
  googleAnalyticsID: ''
  // umami 网站分析
  umamiAnalyticsID: '520af332-bfb7-4e7c-9386-5f273ee3d697'
  // follow 验证
  follow: {
    // 订阅 ID
    feedID: ''
    // 用户 ID
    userID: ''
  }
  // apiflash access key 访问密钥
  // 自动生成网站截图用于 open graph
  // 获取访问密钥: https://apiflash.com/
  apiflashKey: ''
}
```

### 自定义页脚

```ts
footer: {
  // 社交链接
  links: [
    {
      name: 'RSS',
      url: '/rss.xml', // rss.xml, atom.xml
    },
    {
      name: 'GitHub',
      url: 'https://github.com/radishzzz/astro-theme-retypeset',
    },
    {
      name: 'Twitter',
      url: 'https://x.com/radishzz_',
    },
    // {
    //   name: 'Email',
    //   url: 'https://example@gmail.com',
    // }
  ]
  // 建站年份
  startYear: 2024
}
```

### 资源预加载

```ts
preload: {
  // 链接预加载策略
  linkPrefetch: 'viewport' // hover, tap, viewport, load
  // 评论服务器地址
  commentURL: 'https://retypeset-comment.radishzz.cc'
  // 图床地址
  imageHostURL: 'https://image.radishzz.cc'
  // 定制 google analytics js
  // 适用于路由 google analytics js 到自定义域名的情况
  customGoogleAnalyticsJS: ''
  // 定制 umami analytics js
  // 适用于自部署 umami，或路由 umami analytics js 到自定义域名的情况
  customUmamiAnalyticsJS: 'https://js.radishzz.cc/jquery.min.js'
}
```
