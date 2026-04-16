import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import process from 'node:process'

interface CliOptions {
  srcDir: string
  outDir: string
}

const slugPattern = /^[a-z0-9-]+$/

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function printHelp() {
  console.log(`Build the standalone Cloudflare Pages output directory.

Usage:
  pnpm build:standalone-pages
  node --import tsx scripts/build-standalone-pages.ts --src standalone-pages-src --out standalone-pages-dist

Options:
  --src <path>      Source directory, default: standalone-pages-src
  --out <path>      Output directory, default: standalone-pages-dist
  --help            Show this help text
`)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    srcDir: 'standalone-pages-src',
    outDir: 'standalone-pages-dist',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }

    switch (arg) {
      case '--src':
        if (!next)
          fail('Missing value for --src')
        options.srcDir = next
        index += 1
        break
      case '--out':
        if (!next)
          fail('Missing value for --out')
        options.outDir = next
        index += 1
        break
      default:
        fail(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

function renderIndex(slugs: string[]) {
  const pageCountLabel = slugs.length === 1 ? '1 page' : `${slugs.length} pages`
  const entries = slugs.length > 0
    ? slugs
        .map(slug => `        <li><a href="./${encodeURIComponent(slug)}/">${escapeHtml(slug)}</a></li>`)
        .join('\n')
    : '        <li class="empty">No standalone pages have been published yet.</li>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>mimeadow standalone pages</title>
<style>
  :root {
    color-scheme: light;
    --bg: #f6f2e8;
    --panel: rgba(255, 255, 255, 0.72);
    --text: #191510;
    --muted: #64594b;
    --line: rgba(25, 21, 16, 0.12);
    --accent: #8b4f22;
    --accent-soft: rgba(139, 79, 34, 0.1);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    min-height: 100vh;
    padding: 32px 20px 64px;
    background:
      radial-gradient(circle at top left, rgba(139, 79, 34, 0.12), transparent 32%),
      linear-gradient(180deg, #f7f2e9 0%, #efe6d8 100%);
    color: var(--text);
    font-family: Iowan Old Style, Palatino Linotype, Book Antiqua, Georgia, serif;
  }

  main {
    max-width: 48rem;
    margin: 0 auto;
    padding: 28px;
    border: 1px solid var(--line);
    border-radius: 28px;
    background: var(--panel);
    backdrop-filter: blur(16px);
    box-shadow: 0 16px 50px rgba(25, 21, 16, 0.08);
  }

  h1 {
    margin: 0;
    font-size: clamp(2.2rem, 6vw, 3.8rem);
    line-height: 0.95;
    letter-spacing: -0.03em;
  }

  p {
    margin: 1rem 0 0;
    color: var(--muted);
    font-size: 1.05rem;
    line-height: 1.65;
  }

  .eyebrow {
    margin: 0 0 0.9rem;
    color: var(--accent);
    font: 600 0.78rem/1.2 ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .meta {
    margin-top: 1.2rem;
    color: var(--muted);
    font: 500 0.9rem/1.4 ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace;
    letter-spacing: 0.04em;
  }

  ul {
    list-style: none;
    margin: 2rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.85rem;
  }

  li {
    margin: 0;
  }

  a {
    display: block;
    width: 100%;
    padding: 1rem 1.1rem;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: white;
    color: inherit;
    text-decoration: none;
    transition: transform 150ms ease, border-color 150ms ease, background-color 150ms ease;
  }

  a:hover {
    transform: translateY(-1px);
    border-color: rgba(139, 79, 34, 0.35);
    background: var(--accent-soft);
  }

  .empty {
    padding: 1rem 1.1rem;
    border: 1px dashed var(--line);
    border-radius: 18px;
    color: var(--muted);
    background: rgba(255, 255, 255, 0.42);
  }
</style>
</head>
<body>
<main>
  <div class="eyebrow">mimeadow.pages.dev</div>
  <h1>Standalone Pages</h1>
  <p>Self-contained HTML pages published from this repository to the dedicated Cloudflare Pages host.</p>
  <div class="meta">${pageCountLabel}</div>
  <ul>
${entries}
  </ul>
</main>
</body>
</html>
`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const srcDir = resolve(process.cwd(), options.srcDir)
  const outDir = resolve(process.cwd(), options.outDir)
  const dirEntries = await readdir(srcDir, { withFileTypes: true }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    fail(`Failed to read source directory "${options.srcDir}": ${message}`)
  })

  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const pageEntries: Array<{ fileName: string, slug: string }> = []

  for (const entry of dirEntries) {
    if (entry.isDirectory()) {
      fail(`Nested directories are not supported in "${options.srcDir}": ${entry.name}`)
    }

    if (!entry.isFile()) {
      fail(`Unsupported source entry in "${options.srcDir}": ${entry.name}`)
    }

    if (extname(entry.name) !== '.html') {
      fail(`Only .html source files are supported in "${options.srcDir}": ${entry.name}`)
    }

    const slug = basename(entry.name, '.html')
    if (!slugPattern.test(slug)) {
      fail(`Invalid standalone page slug "${slug}". Use lowercase letters, numbers, and hyphens only.`)
    }

    pageEntries.push({
      fileName: entry.name,
      slug,
    })
  }

  pageEntries.sort((left, right) => left.slug.localeCompare(right.slug))

  for (const page of pageEntries) {
    const sourcePath = join(srcDir, page.fileName)
    const outputDir = join(outDir, page.slug)
    const outputPath = join(outputDir, 'index.html')
    const source = await readFile(sourcePath, 'utf8')

    await mkdir(outputDir, { recursive: true })
    await writeFile(outputPath, source, 'utf8')
  }

  await writeFile(join(outDir, 'index.html'), renderIndex(pageEntries.map(page => page.slug)), 'utf8')

  console.log(`✅ Built ${pageEntries.length} standalone page${pageEntries.length === 1 ? '' : 's'} into ${options.outDir}`)
  for (const page of pageEntries) {
    console.log(`- ${page.slug} -> /${page.slug}/`)
  }
}

await main()
