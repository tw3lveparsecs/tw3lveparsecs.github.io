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
