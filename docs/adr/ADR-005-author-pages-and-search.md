# ADR-005: Provide generated author pages and client-side post filtering

- **Status:** Accepted
- **Date:** 2026-10-24
- **Related implementation:** [`src/pages/authors/`](../../src/pages/authors/), [`src/pages/blog/index.astro`](../../src/pages/blog/index.astro)

## Context

Readers need to browse the people behind the posts and quickly filter the
journal. The site is statically hosted, so the feature must not require a
search server, database, or per-request API.

## Decision drivers

- Work with static S3 and CloudFront hosting.
- Keep the search experience immediate for the current post collection.
- Avoid external search services, credentials, and usage costs.
- Provide accessible author profiles and useful empty states.

## Options considered

### No author directory or search

Would minimize implementation work but reduce content discoverability.

### Server-side or external search

Would scale better for a large collection, but requires runtime
infrastructure or a third-party index.

### Generated author pages and static client-side filtering

Uses the already-built collection data, preserves static deployment, and is
appropriate for the current collection size.

## Decision

Generate an author directory at `/authors/` and one profile page per author at
`/authors/<author-id>/`. Each profile displays the author's avatar, bio,
optional social links, post count, and posts sorted newest first.

Add a journal search field at `/blog/`. The page renders each post's title and
description into a data attribute, then uses a small browser-side input handler
to filter matching posts. The interface exposes help text and an
`aria-live` status for result counts and no-match states.

## Consequences

### Positive

- Author navigation and profile pages work without a server.
- Search is fast and has no external data dependency.
- The browser only filters the content already visible on the journal page.

### Negative or trade-offs

- Search only covers the title and description fields.
- The entire journal list is sent to the browser.
- A very large collection could make client-side filtering or page payloads
  less suitable.

### Risks and mitigations

- **Risk:** Client-side filtering becomes slow as the collection grows.
  **Mitigation:** Reconsider an indexed or external search solution if the
  journal size makes the current approach unsuitable.
- **Risk:** An author has no published posts.
  **Mitigation:** Render an explicit empty state on the author profile.

## Implementation notes

Author routes use `getStaticPaths()`, `getCollection()`, and `getEntry()`.
Unknown author slugs render a not-found message. The journal search is
progressive enhancement: the complete post list remains available in HTML.

## Review

- **Review trigger:** Need to search full post bodies, add pagination, support
  runtime content, or handle a substantially larger collection.
- **Review date:** Not scheduled
