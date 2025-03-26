---
title: Guía del Tema
published: 2025-01-26
updated: 2025-03-12
tags: ["Tema de Blog","Guía"]
pin: 99
lang: es
abbrlink: theme-guide
---

Retypeset es un tema de blog estático basado en el framework [Astro](https://astro.build/). Inspirado por [Typography](https://astro-theme-typography.vercel.app/), Retypeset establece un nuevo estándar visual y reimagina el diseño de todas las páginas, creando una experiencia de lectura similar a la de los libros impresos, reviviendo la belleza de la tipografía. Detalles en cada mirada, elegancia en cada espacio.

## Configuración del Tema

A continuación se presenta la guía de configuración del tema Retypeset. Personaliza tu blog modificando el archivo de configuración [src/config.ts](https://github.com/radishzzz/astro-theme-retypeset/blob/master/src/config.ts).

### Información del Sitio

```ts
site: {
  // título del sitio
  title: 'Retypeset'
  // subtítulo del sitio
  subtitle: 'Revive the beauty of typography'
  // descripción del sitio
  description: 'Retypeset is a static blog theme...'
  // usar título/subtítulo/descripción en varios idiomas desde src/i18n/ui.ts en lugar de los estáticos anteriores
  i18nTitle: true // true, false
  // nombre del autor
  author: 'radishzz'
  // url del sitio
  url: 'https://retypeset.radishzz.cc'
  // url del favicon
  // formatos recomendados: svg, png o ico
  favicon: '/icon/favicon.svg' // o https://example.com/favicon.svg
}
```

### Color del Tema

```ts
color: {
  // modo de tema predeterminado
  mode: 'light' // light, dark
  // modo claro
  light: {
    // color primario
    // usado para títulos, hover, etc
    primary: 'oklch(25% 0.005 298)'
    // color secundario
    // usado para texto de publicaciones
    secondary: 'oklch(40% 0.005 298)'
    // color de fondo
    background: 'oklch(96% 0.005 298)'
  }
  // modo oscuro
  dark: {
    // color primario
    // usado para títulos, hover, etc
    primary: 'oklch(92% 0.005 298)'
    // color secundario
    // usado para texto de publicaciones
    secondary: 'oklch(77% 0.005 298)'
    // color de fondo
    background: 'oklch(22% 0.005 298)'
  }
}
```

### Configuración Global

```ts
global: {
  // idioma predeterminado
  // idioma de la ruta raíz del sitio '/'
  locale: 'zh' // zh, zh-tw, ja, en, es, ru
  // más idiomas
  // Genera rutas multilingües como '/es/' '/ru/'
  // no rellenar de nuevo el código de localización anterior
  moreLocales: ['zh-tw', 'ja', 'en', 'es', 'ru'] // ['zh', 'zh-tw', 'ja', 'en', 'es', 'ru']
  // estilo de fuente
  fontStyle: 'sans' // sans, serif
  // formato de fecha para publicaciones
  dateFormat: 'YYYY-MM-DD' // YYYY-MM-DD, MM-DD-YYYY, DD-MM-YYYY, MONTH DAY YYYY, DAY MONTH YYYY
  // espacio entre título y subtítulo
  titleGap: 2 // 1, 2, 3
}
```

### Sistema de Comentarios

```ts
comment: {
  // habilitar sistema de comentarios
  enabled: true // true, false
  // sistema de comentarios waline
  waline: {
    // URL del servidor
    serverURL: 'https://retypeset-comment.radishzz.cc'
    // URL de emojis
    emoji: [
      'https://unpkg.com/@waline/emojis@1.2.0/tw-emoji'
      // 'https://unpkg.com/@waline/emojis@1.2.0/bmoji'
      // más emojis: https://waline.js.org/en/guide/features/emoji.html
    ]
    // búsqueda de gif
    search: false // true, false
    // cargador de imágenes
    imageUploader: false // true, false
  }
}
```

### SEO

```ts
seo: {
  // ID de Twitter
  twitterID: '@radishzz_'
  // verificación del sitio
  verification: {
    // google search console
    google: 'AUCrz5F1e5qbnmKKDXl2Sf8u6y0kOpEO1wLs6HMMmlM'
    // herramientas para webmasters de bing
    bing: '64708CD514011A7965C84DDE1D169F87'
    // webmaster de yandex
    yandex: ''
    // búsqueda baidu
    baidu: ''
  }
  // google analytics
  googleAnalyticsID: ''
  // umami analytics
  umamiAnalyticsID: '520af332-bfb7-4e7c-9386-5f273ee3d697'
  // verificación de seguimiento
  follow: {
    // ID de feed
    feedID: ''
    // ID de usuario
    userID: ''
  }
  // clave de acceso apiflash
  // genera automáticamente capturas de pantalla del sitio web para imágenes de open graph
  // obtén tu clave de acceso en: https://apiflash.com/
  apiflashKey: ''
}
```

### Configuración del Pie de Página

```ts
footer: {
  // enlaces sociales
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
  // año de inicio del sitio web
  startYear: 2024
}
```

### Precargar Recursos

```ts
preload: {
  // estrategias de precarga de enlaces
  linkPrefetch: 'viewport' // hover, tap, viewport, load
  // URL del servidor de comentarios
  commentURL: 'https://retypeset-comment.radishzz.cc'
  // URL de alojamiento de imágenes
  imageHostURL: 'https://image.radishzz.cc'
  // js personalizado de google analytics
  // para usuarios que redirigen javascript de analytics a un dominio personalizado
  customGoogleAnalyticsJS: ''
  // js personalizado de umami analytics
  // para usuarios que implementan umami por su cuenta, o redirigen javascript de analytics a un dominio personalizado
  customUmamiAnalyticsJS: 'https://js.radishzz.cc/jquery.min.js'
}
```
