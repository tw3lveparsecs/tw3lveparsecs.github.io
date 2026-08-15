This repository hosts the source code for my personal blog website [https://azurewithaj.com](https://azurewithaj.com), which is hosted on GitHub Pages.

The website is built using Jekyll, a static site generator, and is based on the [Mediumish for Jekyll](https://jekyllthemes.io/theme/mediumish) theme.

## Local development (Docker)

- Serve locally: `docker compose up`
- One-off build (optional): `docker compose run --rm jekyll-build`

## Cache busting

To ensure browsers fetch the latest CSS/JS after each build, local asset URLs include a cache-busting query parameter derived from the build time (or GitHub build revision when available).

- Implementation: The `cache_bust` variable is assigned and used across assets in [\_layouts/default.html](_layouts/default.html#L1).
- Includes: Search scripts use the same parameter with a fallback in [\_includes/search-lunr.html](_includes/search-lunr.html#L1).
- Verification: Generated pages such as [\_site/index.html](_site/index.html#L1) reference assets like `/assets/css/main.css?v=YYYYMMDDHHMMSS`.

Rebuild when changing styles or JS:

```bash
docker compose run --rm jekyll-build
```

## Discoverability (SEO and AI answer engines)

The site is built to be easy for both search engines and AI assistants to find, read and cite:

- [llms.txt](llms.txt): an [llmstxt.org](https://llmstxt.org/) style index generated at build time, listing every post with its publish date, description and tags, plus topics, pages and feeds. Served at `/llms.txt`.
- [llms-full.txt](llms-full.txt): the full text of every post concatenated into a single plain text file (code blocks are included without the Rouge line number gutters). Served at `/llms-full.txt`.
- [robots.txt](robots.txt): explicitly allows the major search and AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended and others) and points to the sitemap.
- [\_includes/structured-data.html](_includes/structured-data.html): schema.org JSON-LD (`WebSite`, `Person`, `Blog`, and on posts `BlogPosting` and `BreadcrumbList`) injected into every page from [\_layouts/default.html](_layouts/default.html#L1).
- `<head>` alternates: the RSS feed and `llms.txt` are advertised via `<link rel="alternate">`.
- `jekyll-sitemap`, `jekyll-feed` and `jekyll-seo-tag` continue to provide `/sitemap.xml`, `/feed.xml` and per-page meta/Open Graph tags. `author` and `social.name`/`social.links` in [\_config.yml](_config.yml#L1) feed the author and social profile metadata.

Both `llms.txt` and `llms-full.txt` regenerate automatically on every build, so new posts appear without any manual step.
