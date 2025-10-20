---
layout: post
title: "DevOps: Enhanced Release Automation with GitHub's AI-Powered Release Notes"
date: 2025-10-22 06:00:00 +1100
categories: [DevOps]
tags: [devops, release, tags, automation, api]
image: /assets/img/posts/2025-10-22-devops-release-tag-generation/feature_image.png
---

In my previous article, "[DevOps: Automating Release Tags](https://azurewithaj.com/posts/devops-release-tags/)", I shared how we automated version tagging and release creation using GitHub Actions. While that solution worked well, the release notes generation was basic, essentially just copying the PR title and description. Today, I'll show you how we evolved this approach by leveraging GitHub's powerful automatic release notes generation API.

## The Evolution: From Basic to Intelligent Release Notes

Our original workflow created releases with simple summaries, but we wanted something more comprehensive and professional. We envisioned release notes that would include:

- **Comprehensive Release Overview**: A clear summary of what's included in the release
- **Merged Pull Requests**: A complete list of all PRs that contributed to the release
- **Contributor Recognition**: Acknowledgement of all team members who contributed to this release
- **Complete Changelog**: A full, detailed changelog showing every change with proper attribution and links

GitHub provides a powerful API that generates release notes automatically based on pull requests, labels, and commit history. This seemed like the perfect solution, but how do we integrate it effectively into our existing automation workflow?

## Leveraging the GitHub API for Release Notes Generation

### Understanding the GitHub Release Notes API

The GitHub API provides a dedicated endpoint for generating release notes: `/repos/{owner}/{repo}/releases/generate-notes`. This endpoint is intelligent. It analyses all changes between two tags, extracts contributors, and formats everything into a polished markdown changelog.

**Key API Parameters:**

- `tag_name`: The tag for which you're generating release notes (required)
- `previous_tag_name`: The tag to compare against (optional, but essential for meaningful changelogs)
- `target_commitish`: The target branch or commit (defaults to the repository's default branch)

### Integration Strategy

Rather than making shell calls with `curl`, I discovered that using GitHub's JavaScript API client within `actions/github-script@v7` provided a cleaner, more reliable approach. This eliminated the need for complex JSON manipulation with `jq` and provided better error handling.

Here's how the integration works:

**Step 1: Fetch Latest Tag**

First, we need to identify the latest tag to compare against our new tagged release:

```yaml
{% raw %}
- name: Get latest tag
  id: get_tag
  run: |
    git fetch --tags
    latest_tag=$(git tag --sort=-v:refname | head -n 1)
    echo "latest_tag=$latest_tag" >> $GITHUB_OUTPUT
{% endraw %}
```

This step is crucial, it gives the API the context it needs to generate a meaningful changelog comparing the latest tagged version with our new tagged release.

**Step 2: Tag our New Release**

```yaml
{% raw %}
- name: Bump version and create tag
  id: bump_tag
  run: |
    latest_tag=${{ steps.get_tag.outputs.latest_tag }}
    is_major=${{ steps.major_trigger.outputs.major }}
    if [[ -z "$latest_tag" ]]; then
      new_tag="v1.0.0"
    else
      IFS='.' read -r major minor patch <<< "${latest_tag#v}"
      if [[ "$is_major" == "true" ]]; then
        new_tag="v$((major+1)).0.0"
      else
        new_tag="v$major.$minor.$((patch+1))"
      fi
    fi
    git config user.name "github-actions"
    git config user.email "github-actions@github.com"
    git tag "$new_tag"
    git push origin "$new_tag"
    echo "new_tag=$new_tag" >> $GITHUB_OUTPUT
{% endraw %}
```

This step creates the new tag for our release based on whether it's a major or minor release.

**Step 3: Call the GitHub API with JavaScript**

```yaml
{% raw %}
- name: Generate release notes
  id: release_notes
  uses: actions/github-script@v7
  with:
    script: |
      const tag = '${{ steps.bump_tag.outputs.new_tag }}';
      const latestTag = '${{ steps.get_tag.outputs.latest_tag }}';

      // Use GitHub's automatic release notes generation API
      const response = await github.rest.repos.generateReleaseNotes({
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag_name: tag,
        previous_tag_name: latestTag || undefined, // Use previous tag if available
        target_commitish: 'main'
      });

      // Determine release type based on version number analysis
      const major = tag.split('.')[0].replace('v', '');
      const minor = tag.split('.')[1];
      const patch = tag.split('.')[2];

      let releaseType;
      if (minor === '0' && patch === '0') {
        releaseType = "🚀 Major Release";
      } else if (patch === '0') {
        releaseType = "✨ Minor Release";
      } else {
        releaseType = "🐛 Patch Release";
      }

      // Combine release type with auto-generated notes
      const releaseNotes = `${releaseType} ${tag}\n\n${response.data.body}`;

      // Write to file for use in release creation
      const fs = require('fs');
      fs.writeFileSync('release-notes.txt', releaseNotes);

      // Also output for debugging
      core.setOutput('release_notes', releaseNotes);
      core.setOutput('release_name', response.data.name);

- name: Create GitHub Release
  if: steps.is_major.outputs.major == 'true'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh release create "${{ steps.bump_tag.outputs.new_tag }}" \
      --title "Release ${{ steps.bump_tag.outputs.new_tag }}" \
      --notes-file release-notes.txt
{% endraw %}
```

This step uses the GitHub API to generate the release notes and writes the final notes to a file for the release creation step.

**Key Benefits of This Approach:**

1. **Automatic Context Awareness**: GitHub's API analyses commit history, PR titles, and labels to categorise changes intelligently
2. **Built-in Contributor Detection**: The API automatically identifies and credits all contributors
3. **No Manual Parsing**: Unlike shell-based approaches, we don't need complex regex or JSON parsing

### Handling Edge Cases

The implementation accounts for several edge cases:

**1. First Release (No Previous Tag)**

```javascript
previous_tag_name: latestTag || undefined;
```

When `latestTag` is undefined (first release), the API generates notes for all commits in the repository, which is appropriate for initial releases.

**2. No Changes Between Tags**
The API gracefully handles scenarios where tags are identical or when no PRs exist between versions.

**3. Missing PR Metadata**
If PRs lack proper labels or descriptions, the API uses commit messages and titles as fallbacks.

## The Complete Enhanced Workflow

Here's the complete GitHub Actions workflow that combines automated tagging with intelligent release notes:

```yaml
{% raw %}
name: Enhanced Tag and Release with AI-Powered Notes

on:
  push:
    branches:
      - main

jobs:
  tag-and-release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Get latest PR merged
        id: pr
        uses: actions/github-script@v7
        with:
          script: |
            const prs = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'closed',
              sort: 'updated',
              direction: 'desc',
              per_page: 1
            });
            const pr = prs.data.find(pr => pr.merged_at && pr.merge_commit_sha === context.sha);
            if (!pr) throw new Error('No merged PR found for this commit.');
            core.setOutput('pr_number', pr.number);
            core.setOutput('pr_title', pr.title);
            core.setOutput('pr_body', pr.body);

      - name: Check for major release trigger
        id: major_trigger
        uses: actions/github-script@v7
        with:
          script: |
            const prNumber = Number(process.env.PR_NUMBER || '${{ steps.pr.outputs.pr_number }}');
            let isMajor = false;
            if (prNumber) {
              const pr = await github.rest.pulls.get({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: prNumber
              });
              const labels = pr.data.labels.map(l => l.name.toLowerCase());
              if (labels.includes('major-release')) isMajor = true;
              if (pr.data.title.includes('[major]') || (pr.data.body && pr.data.body.includes('[major]'))) isMajor = true;
            } else {
              // Fallback: check commit message
              const commit = await github.rest.repos.getCommit({
                owner: context.repo.owner,
                repo: context.repo.repo,
                ref: context.sha
              });
              if (commit.data.commit.message.includes('[major]')) isMajor = true;
            }
            core.setOutput('major', isMajor ? 'true' : 'false');

      - name: Get latest tag
        id: get_tag
        run: |
          git fetch --tags
          latest_tag=$(git tag --sort=-v:refname | head -n 1)
          echo "latest_tag=$latest_tag" >> $GITHUB_OUTPUT

      - name: Bump version and create tag
        id: bump_tag
        run: |
          latest_tag=${{ steps.get_tag.outputs.latest_tag }}
          is_major=${{ steps.major_trigger.outputs.major }}
          if [[ -z "$latest_tag" ]]; then
            new_tag="v1.0.0"
          else
            IFS='.' read -r major minor patch <<< "${latest_tag#v}"
            if [[ "$is_major" == "true" ]]; then
              new_tag="v$((major+1)).0.0"
            else
              new_tag="v$major.$minor.$((patch+1))"
            fi
          fi
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
          git tag "$new_tag"
          git push origin "$new_tag"
          echo "new_tag=$new_tag" >> $GITHUB_OUTPUT

      - name: Check if major version
        id: is_major
        run: |
          tag=${{ steps.bump_tag.outputs.new_tag }}
          major=$(echo $tag | cut -d'.' -f1 | tr -d 'v')
          minor=$(echo $tag | cut -d'.' -f2)
          patch=$(echo $tag | cut -d'.' -f3)
          if [[ "$minor" == "0" && "$patch" == "0" ]]; then
            echo "major=true" >> $GITHUB_OUTPUT
          else
            echo "major=false" >> $GITHUB_OUTPUT
          fi

      - name: Generate release notes
        id: release_notes
        uses: actions/github-script@v7
        with:
          script: |
            const tag = '${{ steps.bump_tag.outputs.new_tag }}';
            const latestTag = '${{ steps.get_tag.outputs.latest_tag }}';

            // Use GitHub's automatic release notes generation API
            const response = await github.rest.repos.generateReleaseNotes({
              owner: context.repo.owner,
              repo: context.repo.repo,
              tag_name: tag,
              previous_tag_name: latestTag || undefined, // Use previous tag if available
              target_commitish: 'main'
            });

            // Determine release type based on version number analysis
            const major = tag.split('.')[0].replace('v', '');
            const minor = tag.split('.')[1];
            const patch = tag.split('.')[2];

            let releaseType;
            if (minor === '0' && patch === '0') {
              releaseType = "🚀 Major Release";
            } else if (patch === '0') {
              releaseType = "✨ Minor Release";
            } else {
              releaseType = "🐛 Patch Release";
            }

            // Combine release type with auto-generated notes
            const releaseNotes = `${releaseType} ${tag}\n\n${response.data.body}`;

            // Write to file for use in release creation
            const fs = require('fs');
            fs.writeFileSync('release-notes.txt', releaseNotes);

            // Also output for debugging
            core.setOutput('release_notes', releaseNotes);
            core.setOutput('release_name', response.data.name);

      - name: Create GitHub Release
        if: steps.is_major.outputs.major == 'true'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh release create "${{ steps.bump_tag.outputs.new_tag }}" \
            --title "Release ${{ steps.bump_tag.outputs.new_tag }}" \
            --notes-file release-notes.txt
{% endraw %}
```

## Key Improvements Over the Original Workflow

### 1. **Intelligent Release Notes**

The GitHub API automatically:

- Summarise changes since last release
- Lists all contributors
- Groups changes logically
- Filters out noise (like dependency updates)

### 2. **Better Historical Context**

By comparing against the previous tag, the release notes include:

- All changes since the last release
- Complete PR history with links
- Proper attribution for each contribution

### 3. **Enhanced Major Releases**

Major version releases get special treatment:

- Prominent release highlights section
- Assists with highlighting warnings about breaking changes
- Enhanced formatting for visibility

### 4. **Robust Error Handling**

The workflow handles edge cases:

- First release (no previous tag)
- Missing PR metadata

## Conclusion

By combining GitHub's automatic release notes API with our existing automated tagging workflow, we've created a powerful, hands-off release management system.

The result is a system that:

- Runs completely automatically
- Generates comprehensive, well-formatted release notes
- Recognises all contributors
- Scales effortlessly as the team grows
- Requires zero manual intervention

[Click here to view a working example of the complete workflow on GitHub.](https://github.com/tw3lveparsecs/azure-iac-and-devops/tree/main/.github/workflows/tags-and-release.yml)

If you're still manually creating release notes, I highly recommend implementing this approach.

Have you implemented automated release notes in your projects? What challenges did you face? Share your experiences in the comments below!
