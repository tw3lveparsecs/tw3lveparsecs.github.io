# Azure with AJ Repository Guide

This repository contains the source for [azurewithaj.com](https://azurewithaj.com), a Jekyll blog hosted on GitHub Pages. Use this file as the operating guide for repository work. For detailed blog voice, structure, SEO, and technical writing rules, also read `.github/agents/blog-writer.agent.md` before drafting or substantially rewriting a post.

## Commands First

Run commands from the repository root in PowerShell.

```powershell
# Start the local site, including future-dated posts.
./scripts/start-site.ps1

# Rebuild the image before starting when dependencies or the Dockerfile changed.
./scripts/start-site.ps1 -Rebuild

# Start on another host port if 4000 is occupied.
./scripts/start-site.ps1 -Port 4001

# Stop and remove the local container.
./scripts/stop-site.ps1

# Stop the site and remove its image.
./scripts/stop-site.ps1 -RemoveImage
```

The local site is available at `http://localhost:<Port>`. `start-site.ps1` follows the logs in the foreground; `Ctrl+C` stops following logs but leaves the detached container running. Always run `stop-site.ps1` when the site is no longer needed.

### Container Runtime

- Use `wslc` (WSL Container CLI), not Docker Desktop, `docker`, or `docker compose`, for local container work.
- The scripts are the supported interface. Do not replace them with ad hoc container commands unless debugging the scripts themselves.
- The image and container default to `jekyll-blog`.
- The start script recreates an existing container so its bind mount points at the current worktree. This matters when several Copilot worktrees exist.
- Local Jekyll runs with `--future`, so scheduled posts are visible before publication.
- `Dockerfile` defines the Ruby container. `docker-entrypoint.sh` prepares the bundle before running Jekyll.
- `docker-compose.yml` exists, but it is not the primary local workflow.

Useful diagnostics:

```powershell
wslc list --all
wslc inspect jekyll-blog
wslc logs jekyll-blog
```

When inspecting a reused container, verify that `Mounts[].Source` is this worktree and `Config.Cmd` includes `--future`.

## Repository Map

- `_posts/`: Published and scheduled Markdown posts.
- `_pages/`: Standalone pages such as About, Archives, Categories, and Tags.
- `_layouts/`: Jekyll page shells. `default.html` owns the shared document head and global page structure; `post.html` owns article rendering.
- `_includes/`: Reusable Liquid and HTML fragments for navigation, search, sharing, comments, consent, pagination, tables of contents, and structured data.
- `_sass/`: Sass partials and theme styling.
- `assets/css/`: CSS entry points and generated/static styles used by layouts.
- `assets/js/`: Browser JavaScript.
- `assets/fonts/`: Local fonts.
- `assets/images/posts/`: Per-post image directories.
- `assets/images/about/` and `assets/images/favicons/`: Profile and site identity assets.
- `scripts/`: Supported WSL container start and stop scripts.
- `.github/agents/blog-writer.agent.md`: Detailed blog authoring and AJ voice guidance.
- `.github/workflows/pages.yml`: Production GitHub Pages build and deployment.
- `_config.yml`: Site metadata, plugins, archives, pagination, Markdown, and Mermaid configuration.
- `Gemfile` and `Gemfile.lock`: Ruby and Jekyll dependencies.
- `README.md`: High-level site, cache busting, SEO, and AI discoverability notes. Its Docker Compose local-development commands are legacy; use the WSL scripts documented here.
- `llms.txt`, `llms-full.txt`, and `feed.xml` are tracked Liquid source templates for discovery outputs. `sitemap.xml` is plugin-generated. `_site/` contains their rendered output and must not be edited by hand.

## Blog Posts

### Files and Front Matter

- Name post files `YYYY-MM-DD-post-slug.md` using lowercase words and hyphens.
- Keep the filename date, front matter `date`, and image directory date aligned when creating or rescheduling a post.
- Use Melbourne time in the form `YYYY-MM-DD HH:MM:SS +1100` unless daylight-saving requirements for the publication date dictate otherwise.
- Use existing categories and lowercase tags; hyphenate multi-word tags.
- Include a concise `description` suitable for search and social metadata.
- Set `author: AJ Bajada` and `layout: post`.
- Set `toc: true` when the post has useful section navigation.
- Include `mermaid: true` only when the post contains a `mermaid` fenced block. Remove the flag when the last diagram is removed.
- Use root-relative repository paths without a leading slash for front matter images.

Current full example:

```yaml
---
layout: post
title: "Post title"
date: 2026-09-08 06:00:00 +1100
categories: [DevOps, AI]
tags: [github, azure, ai, automation]
image: assets/images/posts/2026-09-08-post-slug/post_image.png
featured_image: assets/images/posts/2026-09-08-post-slug/feature_image.png
author: AJ Bajada
toc: true
featured: true
description: "A concise summary of the article and its value to the reader."
---
```

Older posts do not all contain both image fields. Follow the current two-image convention for new posts rather than copying a legacy post blindly.

### Writing and References

- Read `.github/agents/blog-writer.agent.md` before authoring. It is the source of truth for AJ's voice, Australian English, humour, structure, SEO, code examples, and target length.
- Preserve AJ's first-person experience and opinions. Do not turn posts into generic marketing copy or a formal white paper.
- Prefer official primary documentation over secondary articles. For Microsoft, Azure, GitHub, or GitHub Copilot claims, use Microsoft Learn, Microsoft blogs, GitHub Docs, or GitHub Blog where available.
- Use descriptive link text. Internal links should use the public `https://azurewithaj.com/<slug>` URL.
- External links in posts use `{:target="\_blank" rel="noopener"}` immediately after the Markdown link.
- Verify factual claims and links before publishing. Do not invent product behaviour, dates, licensing, availability, or URLs.
- Keep posts concise. The blog-writer guidance targets 1,500 to 1,800 words and sets a hard ceiling of 2,000 readable words unless the user explicitly requests otherwise.

## Post Images

For each new post, create:

```text
assets/images/posts/YYYY-MM-DD-post-slug/
|-- feature_image.png
`-- post_image.png
```

Required dimensions:

- `feature_image.png`: `1024 x 1536` pixels, portrait.
- `post_image.png`: `1536 x 1024` pixels, landscape.

Image rules:

- Match the directory slug and date to the post front matter paths.
- Preserve the important subject when cropping between landscape and portrait. Use a deliberate focal point rather than stretching the image.
- Do not distort aspect ratios.
- Prefer PNG for generated artwork and screenshots unless an existing post intentionally uses JPG or WebP.
- Optimise file size without making text or technical detail unreadable.
- Do not remove, obscure, or reconstruct over provenance, copyright, or attribution marks. A crop may exclude a mark only when the user has the right to use the resulting image and the crop does not misrepresent provenance.
- Confirm image dimensions and open each output after processing.

PowerShell dimension check:

```powershell
Add-Type -AssemblyName System.Drawing
$image = [System.Drawing.Image]::FromFile((Resolve-Path "assets/images/posts/<slug>/feature_image.png"))
try { "$($image.Width)x$($image.Height)" } finally { $image.Dispose() }
```

## Site Behaviour

- Jekyll uses Kramdown with GFM and Rouge syntax highlighting.
- Permalinks use `/:title/`; changing a post slug can change its public URL.
- Pagination displays six posts per page.
- Category archive pages are generated by `jekyll-archives`.
- Mermaid is disabled globally and enabled per post with `mermaid: true`.
- Cache busting is implemented in `_layouts/default.html` and related includes. Preserve the query parameter when changing asset references.
- Structured data is generated by `_includes/structured-data.html`; review it when changing page metadata contracts.
- `llms.txt` and `llms-full.txt` are regenerated from site content during builds. New posts should not require manual index updates.
- The production workflow builds with `JEKYLL_ENV=production` and does not pass `--future`. Future posts therefore remain local previews until their date or a scheduled production build includes them.

## Validation

Use the narrowest relevant checks, then perform a local site validation for user-facing changes.

### Content-only changes

1. Check front matter syntax, image paths, headings, fenced code blocks, and links.
2. Confirm `mermaid: true` agrees with actual Mermaid blocks.
3. Run editor diagnostics on the changed Markdown.
4. Run `git diff --check`. On Windows CRLF files, use:

```powershell
git -c core.whitespace=cr-at-eol diff --check
```

### Site, layout, include, style, script, or dependency changes

1. Run `./scripts/start-site.ps1` or `./scripts/start-site.ps1 -Rebuild` when the container image or dependencies changed.
2. Wait for Jekyll to report `Server running`.
3. Open `http://localhost:4000` and inspect the affected page.
4. For future posts, verify the title appears because the local command includes `--future`.
5. Check relevant responsive layouts when changing HTML or CSS.
6. Run `./scripts/stop-site.ps1` after validation.

There is no dedicated automated test suite. A successful Jekyll build, clean diagnostics, a clean diff check, and focused browser verification are the expected validation signals.

## Editing Boundaries

- Keep changes scoped to the requested post or site behaviour.
- Do not edit `_site/`; it is ignored and generated.
- Do not modify `Gemfile.lock` unless dependencies intentionally changed.
- Do not change `CNAME`, analytics, Giscus, advertising, social identity, or deployment settings unless explicitly requested.
- Do not rewrite old posts solely to make them match newer conventions.
- Do not rename a published post or image directory without considering permalink and inbound-link impact.
- Do not commit, push, merge, or modify the active pull request unless explicitly requested.
- Preserve unrelated user changes in a dirty worktree.
