---
title: Руководство по стилю Markdown
published: 2025-03-08
updated: 2025-03-23
tags: ["Руководство"]
pin: 1
lang: ru
abbrlink: markdown-style-guide
---

Вот примеры базового синтаксиса Markdown, который можно использовать при написании контента в Retypeset.

## Заголовки

Следующие HTML-элементы `<h1>`—`<h6>` представляют шесть уровней заголовков разделов. `<h1>` — самый высокий уровень раздела, а `<h6>` — самый низкий.

# Заголовок 1

## Заголовок 2

### Заголовок 3

#### Заголовок 4

##### Заголовок 5

###### Заголовок 6

## Абзац

Xerum, quo qui aut unt expliquam qui dolut labo. Aque venitatiusda cum, voluptionse latur sitiae dolessi aut parist aut dollo enim qui voluptate ma dolestendit peritin re plis aut quas inctum laceat est volestemque commosa as cus endigna tectur, offic to cor sequas etum rerum idem sintibus eiur? Quianimin porecus evelectur, cum que nis nust voloribus ratem aut omnimi, sitatur? Quiatem. Nam, omnis sum am facea corem alique molestrunt et eos evelece arcillit ut aut eos eos nus, sin conecerem erum fuga. Ri oditatquam, ad quibus unda veliamenimin cusam et facea ipsamus es exerum sitate dolores editium rerore eost, temped molorro ratiae volorro te reribus dolorer sperchicium faceata tiustia prat.

Itatur? Quiatae cullecum rem ent aut odis in re eossequodi nonsequ idebis ne sapicia is sinveli squiatum, core et que aut hariosam ex eat.

## Изображения

### Синтаксис

```markdown
![Описание изображения](./full/or/relative/path/of/image)
```

### Результат

![Описание изображения](/image-placeholder)

## Цитаты

Элемент цитирования представляет контент, цитируемый из другого источника, с возможным указанием источника внутри элемента `footer` или `cite`, а также с возможными встроенными изменениями, такими как аннотации и сокращения.

### Цитата без указания авторства

#### Синтаксис

```markdown
> Tiam, ad mint andaepu dandae nostion secatur sequo quae.<br>
> **Обратите внимание**, что внутри цитаты можно использовать _синтаксис Markdown_.
```

#### Результат

> Tiam, ad mint andaepu dandae nostion secatur sequo quae.<br>
> **Обратите внимание**, что внутри цитаты можно использовать _синтаксис Markdown_.

### Цитата с указанием авторства

#### Синтаксис

```markdown
> Не общайтесь путем совместного использования памяти, а делитесь памятью через общение.<br>
> — <cite>Роб Пайк[^1]</cite>
```

#### Результат

> Не общайтесь путем совместного использования памяти, а делитесь памятью через общение.<br>
> — <cite>Роб Пайк[^1]</cite>

[^1]: Приведенная выше цитата взята из [выступления](https://www.youtube.com/watch?v=PAAkCSZUG1c) Роба Пайка на Gopherfest 18 ноября 2015 года.

## Таблицы

### Синтаксис

```markdown
| Курсив   | Жирный     | Код   |
| -------- | ---------- | ----- |
| _курсив_ | **жирный** | `код` |
```

### Результат

| Курсив   | Жирный     | Код   |
| -------- | ---------- | ----- |
| _курсив_ | **жирный** | `код` |

## Блоки кода

Мы можем использовать 3 обратные кавычки ``` в новой строке, написать фрагмент кода и закрыть 3 обратными кавычками в новой строке. Для подсветки синтаксиса конкретного языка укажите название языка после первых 3 обратных кавычек, например: html, javascript, css, markdown, typescript, txt, bash.

### Синтаксис

````markdown
```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Пример документа HTML5</title>
  </head>
  <body>
    <p>Тест</p>
  </body>
</html>
```
````

### Результат

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Пример документа HTML5</title>
  </head>
  <body>
    <p>Тест</p>
  </body>
</html>
```

## Типы списков

### Упорядоченный список

#### Синтаксис

```markdown
1. Первый пункт
2. Второй пункт
3. Третий пункт
```

#### Результат

1. Первый пункт
2. Второй пункт
3. Третий пункт

### Неупорядоченный список

#### Синтаксис

```markdown
- Пункт списка
- Еще один пункт
- И еще один пункт
```

#### Результат

- Пункт списка
- Еще один пункт
- И еще один пункт

### Вложенный список

#### Синтаксис

```markdown
- Фрукты
  - Яблоко
  - Апельсин
  - Банан
- Молочные продукты
  - Молоко
  - Сыр
```

#### Результат

- Фрукты
  - Яблоко
  - Апельсин
  - Банан
- Молочные продукты
  - Молоко
  - Сыр

## Другие элементы

Включая верхний индекс `<sup>`, нижний индекс `<sub>`, аббревиатуру `<abbr>`, зачеркнутый текст `<del>`, волнистое подчеркивание `<u>`, ввод с клавиатуры `<kbd>` и выделение `<mark>`.

### Синтаксис

```markdown
H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

<abbr title="Graphics Interchange Format">GIF</abbr> — это формат растровых изображений.

Хорошие писатели всегда проверяют <u title="правописание">правописание</u>.

Нажмите <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Delete</kbd>, чтобы завершить сеанс.

Нет <del>ничего</del> ни хорошего, ни плохого кода, но запуск делает его таковым.

Большинство <mark>саламандр</mark> ведут ночной образ жизни и охотятся на насекомых, червей и других мелких существ.
```

### Результат

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

<abbr title="Graphics Interchange Format">GIF</abbr> — это формат растровых изображений.

Хорошие писатели всегда проверяют <u title="правописание">правописание</u>.

Нажмите <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Delete</kbd>, чтобы завершить сеанс.

Нет <del>ничего</del> ни хорошего, ни плохого кода, но запуск делает его таковым.

Большинство <mark>саламандр</mark> ведут ночной образ жизни и охотятся на насекомых, червей и других мелких существ.
