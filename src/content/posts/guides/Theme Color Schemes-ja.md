---
title: テーマカラースキーム
published: 2025-04-11
tags:
  - ガイド
toc: false
lang: ja
abbrlink: theme-color-schemes
---

Retypesetは、[OKLCH](https://oklch.com/)カラースペースに基づいてテーマカラーを定義し、デフォルトでは印刷スタイルの白黒グレーの配色を採用しています。

個性的なニーズを満たすため、いくつかのカラースキームを作成しました。[src/config.ts](https://github.com/radishzzz/astro-theme-retypeset/blob/master/src/config.ts)でデフォルトカラーを置き換え、**開発サーバーを再起動**して新しい配色を適用できます。

## 若葱色

![Light mode](../../../assets/1-light.jpeg)
![Dark mode](../../../assets/1-dark.jpeg)

```
light: {
  primary: 'oklch(0.25 0.03 211.86)',
  secondary: 'oklch(0.40 0.03 211.86)',
  background: 'oklch(0.99 0.0039 106.47)',
},
dark: {
  primary: 'oklch(0.92 0.0015 106.47)',
  secondary: 'oklch(0.79 0.0015 106.47)',
  background: 'oklch(0.24 0.0039 106.47)',
},
```

## 濡羽色

![Light mode](../../../assets/2-light.jpeg)
![Dark mode](../../../assets/2-dark.jpeg)

```
light: {
  primary: 'oklch(0.24 0.0172 280.05)',
  secondary: 'oklch(0.40 0.0172 280.05)',
  background: 'oklch(0.98 0.0172 280.05)',
},
dark: {
  primary: 'oklch(0.92 0.0172 280.05)',
  secondary: 'oklch(0.79 0.0172 280.05)',
  background: 'oklch(0.24 0.0172 280.05)',
},
```

## 藍墨色

![Light mode](../../../assets/4-light.jpeg)
![Dark mode](../../../assets/4-dark.jpeg)

```
light: {
  primary: 'oklch(0.24 0.053 261.24)',
  secondary: 'oklch(0.39 0.053 261.24)',
  background: 'oklch(1 0 0)',
},
dark: {
  primary: 'oklch(0.92 0 0)',
  secondary: 'oklch(0.79 0 0)',
  background: 'oklch(0.24 0.016 265.21)',
},
```

## 糯色

![Light mode](../../../assets/3-light.jpeg)
![Dark mode](../../../assets/3-dark.jpeg)

```
light: {
  primary: 'oklch(0.25 0 0)',
  secondary: 'oklch(0.41 0 0)',
  background: 'oklch(0.95 0.0237 59.39)',
},
dark: {
  primary: 'oklch(0.93 0.019 59.39)',
  secondary: 'oklch(0.80 0.017 59.39)',
  background: 'oklch(0.23 0 0)',
},
``` 
