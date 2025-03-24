---
title: Markdown 样式指南
published: 2025-03-08
updated: 2025-03-23
tags: ["指南"]
pin: 1
lang: zh
abbrlink: markdown-style-guide
---

以下是一些基本的 Markdown 语法示例，可以在 Retypeset 主题中使用。

## 标题

HTML 的 `<h1>` 至 `<h6>` 标签对应六个等级的标题。`<h1>` 为最高级标题，`<h6>` 为最低级。

# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

## 段落

孔乙己一到店，所有喝酒的人便都看着他笑，有的叫道：“孔乙己，你脸上又添上新伤疤了！”他不回答，对柜里说：“温两碗酒，要一碟茴香豆。”便排出九文大钱。他们又故意的高声嚷道：“你一定又偷了人家的东西了！”孔乙己睁大眼睛说：“你怎么这样凭空污人清白……”“什么清白？我前天亲眼见你偷了何家的书，吊着打。”孔乙己便涨红了脸，额上的青筋条条绽出，争辩道：“窃书不能算偷……窃书！……读书人的事，能算偷么？”接连便是难懂的话，什么“君子固穷”，什么“者乎”之类，引得众人都哄笑起来：店内外充满了快活的空气。

听人家背地里谈论，孔乙己原来也读过书，但终于没有进学，又不会营生；于是愈过愈穷，弄到将要讨饭了。

## 图片

### 语法

```markdown
![图片描述](./full/or/relative/path/of/image)
```

### 效果

![图片描述](/image-placeholder)

## 块引用

块引用标签表示从外部引用的内容，可以使用 `footer` 或 `cite` 标签标注内容来源，也可以在块引用中使用 `<mark>`、`<abbr>` 等标签。

### 未标注内容来源

#### 语法

```markdown
> 天地不仁，以万物为刍狗。<br>
> **提示**：引用块内可使用 _Markdown 语法_。
```

#### 效果

> 天地不仁，以万物为刍狗。<br>
> **提示**：引用块内可使用 _Markdown 语法_。

### 标注内容来源

#### 语法

```markdown
> 在我的后园，可以看见墙外有两株树，一株是枣树，还有一株也是枣树。<br>
> —— <cite>《秋夜》[^1]</cite>
```

#### 效果

> 在我的后园，可以看见墙外有两株树，一株是枣树，还有一株也是枣树。<br>
> —— <cite>《秋夜》[^1]</cite>

[^1]: [《秋夜》](https://zh.wikisource.org/wiki/%E7%A7%8B%E5%A4%9C_(%E9%AD%AF%E8%BF%85)) 是鲁迅散文诗集《野草》中的第一首散文诗，创作于1924年。

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

在代码的开头和结尾处，添加三个反引号 ``` 来创建代码块。在开头的反引号后标注语言类型，例如 html、javascript、css、markdown 等，以实现语法高亮效果。

### 语法

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

包括 `<sup>` 上标，`<sub>` 下标，`<abbr>` 缩写，`<del>` 删除线，`<u>` 波浪线，`<kbd>` 键盘输入，`<mark>` 高亮。

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

优秀的作家总是会仔细检查<u title="拼写">拚写</u>问题。

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
