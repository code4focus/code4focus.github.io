---
title: Guía de Estilo Markdown
published: 2025-03-08
updated: 2025-03-23
tags: ["Guía"]
pin: 1
lang: es
abbrlink: markdown-style-guide
---

Aquí hay una muestra de sintaxis básica de Markdown que se puede utilizar al escribir contenido en Retypeset.

## Encabezados

Los siguientes elementos HTML `<h1>`—`<h6>` representan seis niveles de encabezados de sección. `<h1>` es el nivel de sección más alto mientras que `<h6>` es el más bajo.

# Encabezado 1

## Encabezado 2

### Encabezado 3

#### Encabezado 4

##### Encabezado 5

###### Encabezado 6

## Párrafo

Xerum, quo qui aut unt expliquam qui dolut labo. Aque venitatiusda cum, voluptionse latur sitiae dolessi aut parist aut dollo enim qui voluptate ma dolestendit peritin re plis aut quas inctum laceat est volestemque commosa as cus endigna tectur, offic to cor sequas etum rerum idem sintibus eiur? Quianimin porecus evelectur, cum que nis nust voloribus ratem aut omnimi, sitatur? Quiatem. Nam, omnis sum am facea corem alique molestrunt et eos evelece arcillit ut aut eos eos nus, sin conecerem erum fuga. Ri oditatquam, ad quibus unda veliamenimin cusam et facea ipsamus es exerum sitate dolores editium rerore eost, temped molorro ratiae volorro te reribus dolorer sperchicium faceata tiustia prat.

Itatur? Quiatae cullecum rem ent aut odis in re eossequodi nonsequ idebis ne sapicia is sinveli squiatum, core et que aut hariosam ex eat.

## Imágenes

### Sintaxis

```markdown
![Descripción de la Imagen](./full/or/relative/path/of/image)
```

### Resultado

![Descripción de la Imagen](/image-placeholder)

## Citas en bloque

El elemento de cita en bloque representa contenido citado de otra fuente, opcionalmente con una cita que debe estar dentro de un elemento `footer` o `cite`, y opcionalmente con cambios en línea como anotaciones y abreviaturas.

### Cita en bloque sin atribución

#### Sintaxis

```markdown
> Tiam, ad mint andaepu dandae nostion secatur sequo quae.<br>
> **Nota** que puedes usar _sintaxis Markdown_ dentro de una cita en bloque.
```

#### Resultado

> Tiam, ad mint andaepu dandae nostion secatur sequo quae.<br>
> **Nota** que puedes usar _sintaxis Markdown_ dentro de una cita en bloque.

### Cita en bloque con atribución

#### Sintaxis

```markdown
> No te comuniques compartiendo memoria, comparte memoria comunicándote.<br>
> — <cite>Rob Pike[^1]</cite>
```

#### Resultado

> No te comuniques compartiendo memoria, comparte memoria comunicándote.<br>
> — <cite>Rob Pike[^1]</cite>

[^1]: La cita anterior es un extracto de la [charla](https://www.youtube.com/watch?v=PAAkCSZUG1c) de Rob Pike durante Gopherfest, 18 de noviembre de 2015.

## Tablas

### Sintaxis

```markdown
| Cursiva   | Negrita     | Código   |
| --------- | ----------- | -------- |
| _cursiva_ | **negrita** | `código` |
```

### Resultado

| Cursiva   | Negrita     | Código   |
| --------- | ----------- | -------- |
| _cursiva_ | **negrita** | `código` |

## Bloques de Código

Podemos usar 3 comillas invertidas ``` en una nueva línea, escribir el fragmento y cerrar con 3 comillas invertidas en una nueva línea. Para resaltar la sintaxis específica del lenguaje, escriba una palabra del nombre del lenguaje después de las primeras 3 comillas invertidas, por ejemplo, html, javascript, css, markdown, typescript, txt, bash.

### Sintaxis

````markdown
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Ejemplo de Documento HTML5</title>
  </head>
  <body>
    <p>Prueba</p>
  </body>
</html>
```
````

### Resultado

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Ejemplo de Documento HTML5</title>
  </head>
  <body>
    <p>Prueba</p>
  </body>
</html>
```

## Tipos de Listas

### Lista Ordenada

#### Sintaxis

```markdown
1. Primer elemento
2. Segundo elemento
3. Tercer elemento
```

#### Resultado

1. Primer elemento
2. Segundo elemento
3. Tercer elemento

### Lista No Ordenada

#### Sintaxis

```markdown
- Elemento de lista
- Otro elemento
- Y otro elemento más
```

#### Resultado

- Elemento de lista
- Otro elemento
- Y otro elemento más

### Lista Anidada

#### Sintaxis

```markdown
- Frutas
  - Manzana
  - Naranja
  - Plátano
- Lácteos
  - Leche
  - Queso
```

#### Resultado

- Frutas
  - Manzana
  - Naranja
  - Plátano
- Lácteos
  - Leche
  - Queso

## Otros Elementos

Incluyen superíndice `<sup>`, subíndice `<sub>`, abreviatura `<abbr>`, tachado `<del>`, subrayado ondulado `<u>`, entrada de teclado `<kbd>` y resaltado `<mark>`.

### Sintaxis

```markdown
H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

<abbr title="Graphics Interchange Format">GIF</abbr> es un formato de imagen de mapa de bits.

Los buenos escritores siempre revisan la <u title="ortografía">ortografia</u>.

Presiona <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Suprimir</kbd> para finalizar la sesión.

No hay <del>nada</del> ningún código que sea bueno o malo, pero ejecutarlo lo hace así.

La mayoría de las <mark>salamandras</mark> son nocturnas y cazan insectos, gusanos y otras criaturas pequeñas.
```

### Resultado

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

<abbr title="Graphics Interchange Format">GIF</abbr> es un formato de imagen de mapa de bits.

Los buenos escritores siempre revisan la <u title="ortografía">ortografia</u>.

Presiona <kbd>CTRL</kbd> + <kbd>ALT</kbd> + <kbd>Suprimir</kbd> para finalizar la sesión.

No hay <del>nada</del> ningún código que sea bueno o malo, pero ejecutarlo lo hace así.

La mayoría de las <mark>salamandras</mark> son nocturnas y cazan insectos, gusanos y otras criaturas pequeñas.
