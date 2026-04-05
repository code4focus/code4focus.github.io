---
title: 用 Astro 与 Retypeset 搭起新的写作起点
published: 2026-04-04
description: 这是博客的第一篇文章，用来确认新的站点结构、排版风格与内容方向。
updated: ''
tags:
  - Astro
  - Blogging
  - Typography
draft: false
pin: 1
toc: true
lang: zh
abbrlink: hello-world
---

新的博客已经搭起来了。

我选择 `Astro + Retypeset` 作为第一版基础设施，原因很直接。

作为对照，普通静态引用会尽量保持安静 :cite-ref[astro-docs]{preview="off"}。启用预览的引用则可以在桌面端就地补足上下文 :cite-ref[retypeset-demo]{preview="auto"}。

## 为什么是这套组合

1. 它天然适合静态部署，放到 `GitHub Pages` 成本低、维护轻。
2. SEO 基础能力完整，包含 `sitemap`、`Open Graph`、`RSS` 和结构化元信息能力。
3. 它对中文内容的阅读体验更认真，不只是“能显示中文”，而是更接近“认真排版过”的感觉。

## 这个站会写什么

- 软件工程与前端开发
- AI 工具链与工作流
- 产品思考与长期项目
- 阅读、写作与知识整理

## 下一步

接下来我会继续补齐这些内容：

- GitHub Pages 正式部署
- Search Console / Bing Webmaster 验证
- 评论系统与统计方案
- 更细致的中文字体与排版优化

如果你正在读这篇文章，说明这个博客已经从想法进入了运行状态。

::cite-def[astro-docs]{short="Astro 文档，Why Astro"}
[Astro 官方文档](https://astro.build) 明确把 Astro 定位为适合内容型、静态优先网站的框架，这和这个博客当前的部署方式与维护目标是一致的。
::

::cite-def[retypeset-demo]{short="Retypeset 演示站"}
[Retypeset 演示站](https://retypeset.radishzz.cc/) 所呈现的字距、留白和长文阅读体验，是我判断这套主题适合写作场景的重要依据。
::
