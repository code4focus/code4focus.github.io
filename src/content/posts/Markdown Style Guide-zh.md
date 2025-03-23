---
title: Markdown 样式指南
published: 2025-03-08
updated: 2025-03-23
tags: ["指南"]
pin: 1
lang: zh
abbrlink: markdown-style-guide
---

本文是在 Retypeset 中编写 Markdown 内容时可用的一些基础语法示例。

## 标题

HTML 的 `<h1>` 至 `<h6>` 元素对应六级标题。`<h1>` 为最高级标题，`<h6>` 为最低级。

# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

## 段落

孔乙己是站着喝酒而穿长衫的唯一的人。他身材很高大；青白脸色，皱纹间时常夹些伤痕；一部乱蓬蓬的花白的胡子。穿的虽然是长衫，可是又脏又破，似乎十多年没有补，也没有洗。他对人说话，总是满口之乎者也，教人半懂不懂的。因为他姓孔，别人便从描红纸上的“上大人孔乙己”这半懂不懂的话里，替他取下一个绰号，叫作孔乙己。孔乙己一到店，所有喝酒的人便都看着他笑，有的叫道：“孔乙己，你脸上又添上新伤疤了！”他不回答，对柜里说：“温两碗酒，要一碟茴香豆。”便排出九文大钱。他们又故意的高声嚷道：“你一定又偷了人家的东西了！”孔乙己睁大眼睛说：“你怎么这样凭空污人清白……”“什么清白？我前天亲眼见你偷了何家的书，吊着打。”孔乙己便涨红了脸，额上的青筋条条绽出，争辩道：“窃书不能算偷……窃书！……读书人的事，能算偷么？”接连便是难懂的话，什么“君子固穷”，什么“者乎”之类，引得众人都哄笑起来：店内外充满了快活的空气。

听人家背地里谈论，孔乙己原来也读过书，但终于没有进学，又不会营生；于是愈过愈穷，弄到将要讨饭了。

## 图片

### 语法

```markdown
![图片描述](./full/or/relative/path/of/image)
```

### 效果

![图片占位符](/image-placeholder.jpg)

## 块引用

块引用用于标注外部来源内容，内部可使用 Markdown 语法。若需添加来源注释，应通过 footer 或 cite 元素实现。

### 无来源注释

#### 语法

```markdown
> 天地不仁，以万物为刍狗。
>
> **注意**：引用块内可使用 _Markdown 语法_。
```

#### 效果

> 天地不仁，以万物为刍狗。
>
> **注意**：引用块内可使用 _Markdown 语法_。

### 带来源注释

#### 语法

```markdown
> 其实地上本没有路，走的人多了，也便成了路。
>
> — <cite>《故乡》鲁迅[^1]</cite>
```

#### 效果

> 其实地上本没有路，走的人多了，也便成了路。
>
> — <cite>《故乡》鲁迅[^1]</cite>

[^1]: 摘自鲁迅在 1921 年 1 月发表的[《故乡》](https://zh.wikisource.org/wiki/%E6%95%85%E9%84%89)。

## 表格

### 语法

```markdown
| 斜体    | 粗体      | 代码   |
| ------ | -------- | ------ |
| _斜体_  | **粗体**  | `代码` |
```

### 效果

| 斜体    | 粗体      | 代码   |
| ------ | -------- | ------ |
| _斜体_  | **粗体**  | `代码` |

## 代码块

### 语法

在代码的开头和结尾处，使用三个反引号 ``` 包裹代码，并在开头的反引号后标注 html、javascript、css 等语言类型，以实现不同的语法高亮效果。

````markdown
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>HTML5 示例文档</title>
  </head>
  <body>
    <p>测试</p>
  </body>
</html>
```
````

### 效果

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>HTML5 示例文档</title>
  </head>
  <body>
    <p>测试</p>
  </body>
</html>
```

## 列表

### 有序列表

#### 语法

```markdown
1. 第一项
2. 第二项
3. 第三项
```

#### 效果

1. 第一项
2. 第二项
3. 第三项

### 无序列表

#### 语法

```markdown
- 列表项
- 另一项
- 更多项
```

#### 效果

- 列表项
- 另一项
- 更多项

### 嵌套列表

#### 语法

```markdown
- 水果
  - 苹果
  - 橙子
  - 香蕉
- 蔬菜
  - 青菜
  - 萝卜
```

#### 效果

- 水果
  - 苹果
  - 橙子
  - 香蕉
- 蔬菜
  - 青菜
  - 萝卜

## 其他元素

### 语法

```markdown
H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

<abbr title="Graphics Interchange Format">GIF</abbr> 是一种位图图像格式。

书籍是人类进步的<del>楼梯</del>阶梯。

优秀的作者总是会仔细检查<u title="拼">拚</u>写错误。

按下 <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Delete</kbd> 以结束会话。

大多数<mark>蝾螈</mark>昼伏夜出，以昆虫、蠕虫等小生物为食。
```

### 效果

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

<abbr title="Graphics Interchange Format">GIF</abbr> 是一种位图图像格式。

书籍是人类进步的<del>楼梯</del>阶梯。

优秀的作者总是会仔细检查<u title="拼">拚</u>写错误。

按下 <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Delete</kbd> 以结束会话。

大多数<mark>蝾螈</mark>昼伏夜出，以昆虫、蠕虫等小生物为食。

<!-- <details>
  <summary>
    我有钥匙却无门，有空间却无房间。你能进入却无法离开。我是什么？
  </summary>
  键盘。
</details>

<figure>
  <img src="https://image.radishzz.cc/picsmaller/03.webp">
  <figcaption text-center="">Node 模块检查器 - 概览</figcaption>
</figure> -->
```
