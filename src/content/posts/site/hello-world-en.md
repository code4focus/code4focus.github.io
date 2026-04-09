---
title: Starting a new writing space with Astro and Retypeset
published: 2026-04-04
description: The first post on the new site, used to validate the structure, typography, and direction of the blog.
updated: ''
tags:
  - Astro
  - Blogging
  - Typography
series:
  id: site-foundations
  kind: series
  order: "1"
  title: Site Foundations
draft: false
pin: 1
toc: true
lang: en
abbrlink: hello-world
---

The new blog is now in place.

I chose `Astro + Retypeset` as the first version of the stack for a few practical reasons.

For contrast, a plain static citation stays quiet in the reading flow :cite-ref[astro-docs]{preview="off"}. A preview-enabled citation can expose context inline on desktop :cite-ref[retypeset-demo]{preview="auto"}.

## Why this stack

1. It is a strong fit for static deployment and works cleanly with `GitHub Pages`.
2. The SEO baseline is already solid, including `sitemap`, `Open Graph`, `RSS`, and structured metadata.
3. The reading experience feels intentional, especially for long-form writing and Chinese typography.

## What this site will cover

- Software engineering and frontend development
- AI tooling and workflows
- Product thinking and long-term projects
- Reading, writing, and knowledge management

## What comes next

The next round will focus on:

- production deployment to GitHub Pages
- search engine verification
- comments and analytics
- more refined typography and visual tuning

This post marks the point where the idea became a working site.

::cite-def[astro-docs]{short="Astro Docs, Why Astro"}
The official [Astro documentation](https://astro.build) presents Astro as a framework designed for content-heavy, static-first websites, which matches the deployment and maintenance goals of this blog.
::

::cite-def[retypeset-demo]{short="Retypeset demo site"}
The original [Retypeset demo](https://retypeset.radishzz.cc/en/) shows the typography, spacing, and long-form reading experience that made this theme a strong fit for a writing-focused site.
::

