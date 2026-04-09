---
title: Comment moderation policy
published: 2026-04-09
description: The public moderation baseline for Code4Focus comments, including what is welcome, what may be minimized automatically, and how to handle mistakes.
updated: ''
tags:
  - Comments
  - Community
  - Moderation
draft: false
pin: 0
toc: true
lang: en
abbrlink: comment-moderation-policy
---

Comments on this site currently run on `Giscus + GitHub Discussions`.

That is an intentional first step. The initial rollout prefers the lowest-maintenance and most auditable platform path. If moderation later needs finer private rules, stronger filtering, or a separate account system, the site can still move to a self-hosted backend without rewriting the public baseline first.

## What is welcome

- corrections, questions, and additions that stay close to the article
- relevant examples, counterexamples, and implementation notes
- disagreement backed by reasons and facts
- feedback about layout, links, citations, or readability problems

## What may be moderated

The following content is not a fit for the comment area:

- obvious ads, lead-gen drops, SEO link spam, or bulk junk
- phishing, credential theft, malware distribution, or wallet-seed/private-key bait
- threats, harassment, personal attacks, or deliberate flooding
- doxxing or exposure of personal information that should not be public
- off-topic content posted only to hijack the discussion or redirect attention elsewhere

## What automation actually does

Automation is intentionally narrow.

It only acts on comments that look clearly like:

- ad or scam spam
- malicious links, credential-phishing prompts, or malware-style bait

When a comment matches that narrow rule set, GitHub may automatically minimize it and keep a platform-visible reason such as `spam` or `abuse`.

Automation does not replace human judgment for gray areas. Sharp disagreement, blunt criticism, or comments that need context are not supposed to be auto-moderated just because they are uncomfortable.

## If a comment was minimized by mistake

If your comment was minimized and you believe that was wrong:

- open a GitHub issue and include the discussion link
- explain the original intent of the comment and why the minimization looks incorrect

Review will follow the public policy above instead of an undisclosed private rule set.
