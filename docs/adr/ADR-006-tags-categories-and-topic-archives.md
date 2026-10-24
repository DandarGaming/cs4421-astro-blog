# ADR-006: Use tags and categories with generated topic archives

- **Status:** Accepted
- **Date:** 2026-10-24
- **Related implementation:** [`src/utils/topics.ts`](../../src/utils/topics.ts), [`src/pages/blog/[type]/[topic].astro`](../../src/pages/blog/%5Btype%5D/%5Btopic%5D.astro), [`src/layouts/BlogPost.astro`](../../src/layouts/BlogPost.astro)

## Context

Posts need lightweight taxonomy so readers can discover related entries. The
taxonomy must work with file-based content and static generation, while labels
may contain spaces, punctuation, accented characters, or other Unicode text.

## Decision drivers

- Improve navigation and content discoverability.
- Generate all pages during the build.
- Produce readable, URL-safe topic slugs.
- Preserve the distinction between categories and tags.
- Avoid an external taxonomy service.

## Options considered

### Free-form labels without archive pages

Easy to author, but labels would not provide useful navigation.

### Tags and categories with generated archives

Adds useful navigation while keeping metadata simple and compatible with
static hosting.

### Hierarchical or external taxonomy

Could support richer classification, but adds editorial and implementation
complexity that the current blog does not require.

## Decision

Support an optional single `category` and a `tags` array on each blog entry.
Render category and tag links on post pages. Generate topic archive pages at:

- `/blog/categories/<topic>/`
- `/blog/tags/<topic>/`

Normalize labels by trimming, Unicode-normalizing, removing diacritics,
lowercasing, replacing non-letter/non-number runs with hyphens, and removing
leading or trailing hyphens. If normalization produces an empty value, use a
code-point-based fallback slug.

Sort posts in each archive by publication date, newest first.

## Consequences

### Positive

- Readers can browse related content without a runtime service.
- Topic URLs are readable for common labels and deterministic for unusual
  Unicode input.
- Categories and tags have distinct editorial meaning and URL namespaces.

### Negative or trade-offs

- Renaming a label changes its generated URL.
- Slug collisions are possible for distinct labels that normalize identically.
- Taxonomy remains flat rather than hierarchical.

### Risks and mitigations

- **Risk:** Two labels normalize to the same slug.
  **Mitigation:** Review topic metadata for collisions and introduce a
  collision strategy before the taxonomy grows substantially.
- **Risk:** A label change breaks inbound links.
  **Mitigation:** Add redirects or aliases if stable external links become
  important.

## Implementation notes

`getTopicSlug()` owns normalization. The topic route collects posts, groups
them by type and slug, and passes the original display label to the page.
Topic links are rendered by `BlogPost.astro`.

## Review

- **Review trigger:** Need for nested topics, aliases, stable redirects, or a
  taxonomy larger than can be safely generated at build time.
- **Review date:** Not scheduled
