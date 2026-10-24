# ADR-003: Use Astro content collections for blog and author content

- **Status:** Accepted
- **Date:** 2026-10-24
- **Related implementation:** [`src/content.config.ts`](../../src/content.config.ts), [`src/content/`](../../src/content/)

## Context

The blog needs a maintainable way to author Markdown and MDX posts, store
author profiles, validate frontmatter, and connect each post to its author.
Unstructured frontmatter would allow malformed dates, missing titles, invalid
URLs, and broken author references to reach the build.

## Decision drivers

- Keep content in version control with a simple authoring workflow.
- Validate content at build time with inferred TypeScript types.
- Support both Markdown and MDX.
- Model post-to-author relationships explicitly.
- Handle local images through Astro's asset pipeline.

## Options considered

### Unstructured Markdown/frontmatter

Simple to start, but provides no central schema or reliable relationship
validation.

### External CMS or database

Would provide editorial tooling, but would add hosting, credentials, runtime
dependencies, and complexity that the current static site does not need.

### Astro content collections

Provides file-based authoring, loaders, schemas, references, typed collection
entries, and build-time validation while remaining compatible with static
generation.

## Decision

Use Astro content collections loaded with `glob()`:

- `blog` loads `src/content/blog/**/*.{md,mdx}`.
- `authors` loads `src/content/authors/**/*.{md,mdx}`.
- Blog entries require `title`, `description`, `pubDate`, and `author`.
- `updatedDate` and `heroImage` are optional.
- `tags` defaults to an empty array and `category` is optional.
- `author` references the `authors` collection.
- Author entries require `name`, `bio`, and `avatar`; `socialLinks` defaults to
  an empty array and each social URL must be valid.
- Dates are coerced to `Date` values and images use Astro's image schema.

## Consequences

### Positive

- Invalid content fails during validation rather than silently producing a
  broken page.
- Components receive typed collection data.
- Authors can be reused consistently across profiles, post pages, and lists.
- Markdown and MDX remain easy to review in Git.

### Negative or trade-offs

- Non-technical editors need repository access and Markdown knowledge.
- Schema changes can require updating existing content before a build passes.
- Content is deployed with the site rather than updated independently.

### Risks and mitigations

- **Risk:** A schema change breaks older posts.
  **Mitigation:** Run the build and CI validation before deployment.
- **Risk:** A referenced author is renamed or removed.
  **Mitigation:** Use collection references so the build reports invalid links.

## Implementation notes

`getCollection()`, `getEntry()`, and `render()` are used by generated routes
and the `BlogPost` layout. New content should be validated with the normal
Astro build and CI checks.

## Review

- **Review trigger:** Need for non-Git editorial workflows, draft scheduling,
  remote content, or runtime content updates.
- **Review date:** Not scheduled
