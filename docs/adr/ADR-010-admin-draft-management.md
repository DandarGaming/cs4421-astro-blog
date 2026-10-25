# ADR-010: Manage drafts and categories through a Supabase-backed admin page

- **Status:** Accepted
- **Date:** 2026-10-25
- **Related decisions:** [ADR-002](./ADR-002-static-s3-cloudfront.md),
  [ADR-006](./ADR-006-tags-categories-and-topic-archives.md),
  [ADR-009](./ADR-009-supabase-playlist-data.md)
- **Related implementation:** [`src/pages/admin/index.astro`](../../src/pages/admin/index.astro),
  [`src/scripts/admin.ts`](../../src/scripts/admin.ts),
  [`src/utils/admin.ts`](../../src/utils/admin.ts),
  [`src/utils/admin.test.ts`](../../src/utils/admin.test.ts)
- **Related issue:** [#23](https://github.com/DandarGaming/cs4421-astro-blog/issues/23)

## Context

The blog publishes posts through content collections, but unpublished drafts and
their categories need to be organised before publication. Issue
[#23](https://github.com/DandarGaming/cs4421-astro-blog/issues/23) asks for a
single private page where an administrator can review drafts, assign existing
categories, and create new ones.

The site is statically generated and deployed to S3/CloudFront, so there is no
application server to host a session or run privileged queries. Draft content
must not appear in any public route or build output.

## Decision drivers

- Keep the existing static deployment and build pipeline.
- Never ship a privileged Supabase credential, and never expose drafts to
  anonymous visitors.
- Let an administrator work with draft and category data without a new
  deployment.
- Keep the category rules (normalisation, duplicate rejection, de-duplication)
  testable without a browser or database.
- Give the page explicit empty, error, and confirmation states.

## Options considered

### Server-rendered admin routes behind an application session

Would centralise authorisation on the server, but requires SSR hosting and a
session layer that the current static S3/CloudFront deployment does not have.

### Separate admin application

Would isolate the surface area cleanly, but duplicates styling, layout, and
build configuration for a small internal feature.

### Static `/admin/` page that talks to Supabase from the browser

Keeps the deployment unchanged. The page ships as HTML with no draft data; after
sign-in the browser reads and writes drafts and categories through the Supabase
client using the publishable key, and Row Level Security makes the final
authorisation decision.

## Decision

Ship a private admin page at `/admin/` that performs all data access in the
browser against Supabase.

1. [`src/pages/admin/index.astro`](../../src/pages/admin/index.astro) renders
   the sign-in form and the draft desk shell only. It sends
   `noindex, nofollow, noarchive` and exposes only the Supabase URL and
   publishable key through `data-*` attributes read from `import.meta.env`.
2. [`src/scripts/admin.ts`](../../src/scripts/admin.ts) signs the administrator
   in with `signInWithPassword`, restores an existing session with
   `auth.getUser()`, and refuses to load data unless the `is_admin()` RPC
   returns true.
3. Drafts are read from `drafts` with their `draft_categories` relation, and the
   category list from `categories`, ordered by name. Each draft shows its title,
   author, last updated date, and assigned categories, and can be searched by
   title and filtered by category in the browser.
4. Saving categories deletes the draft's current `draft_categories` rows and
   inserts the selected set, then confirms the save or reports a generic error.
5. Creating a category inserts it into `categories` and immediately assigns it to
   the selected draft, rejecting empty and case-insensitively duplicate names.
6. Category normalisation, duplicate rejection, sorting, and de-duplication live
   in [`src/utils/admin.ts`](../../src/utils/admin.ts) as pure functions covered
   by unit tests, so the rules are verifiable without Supabase.

## Consequences

### Positive

- The admin page fits the existing static deployment and build unchanged.
- No draft data or category data reaches an unauthenticated visitor, because the
  page ships without data and the browser only queries after sign-in.
- Category rules are unit-tested pure functions rather than DOM or network code.
- The publishable key is the only Supabase credential in the page; no
  service-role key is used anywhere in the application.

### Negative or trade-offs

- Authorisation depends entirely on Supabase Row Level Security and the
  `is_admin()` function. The client-side check is a convenience gate, not a
  security boundary.
- The admin UI and its Supabase client are downloaded by any visitor who
  requests `/admin/`, so the page is discoverable even though its data is not.
- Saving categories is two requests (delete, then insert) rather than a single
  transaction; a failure between them leaves the draft with no categories.
- The `drafts`, `categories`, and `draft_categories` tables and the `is_admin()`
  function must be provisioned in Supabase outside this repository, and are not
  yet captured in versioned SQL alongside
  [`supabase/music.sql`](../../supabase/music.sql).

### Risks and mitigations

- **Risk:** An anonymous browser session calls the Supabase API directly and
  reads or writes drafts.
  **Mitigation:** Enable Row Level Security on `drafts`, `categories`, and
  `draft_categories`, allow reads and writes only to administrators, and keep
  the `is_admin()` check server-side in the database.
- **Risk:** Draft content leaks into the published site.
  **Mitigation:** Drafts are never queried during the Astro build; all draft
  access happens in the browser after authentication.
- **Risk:** Duplicate or inconsistently cased category names fragment the
  category list.
  **Mitigation:** Normalise names in the shared helper, reject case-insensitive
  duplicates in both the helper and the UI, and add a unique constraint on the
  category name in Supabase.
- **Risk:** A partial save leaves a draft without categories.
  **Mitigation:** Report the failure to the administrator and reload the draft
  list so the stored state is visible.

## Implementation notes

- Route: [`src/pages/admin/index.astro`](../../src/pages/admin/index.astro),
  served at `/admin/` in the static build.
- Browser logic: [`src/scripts/admin.ts`](../../src/scripts/admin.ts), loaded
  with `<script src="../../scripts/admin.ts">` so Astro bundles and processes it.
- Shared rules: [`src/utils/admin.ts`](../../src/utils/admin.ts), tested by
  [`src/utils/admin.test.ts`](../../src/utils/admin.test.ts).
- Required configuration: `SUPABASE_URL` and `SUPABASE_KEY`, the same
  publishable key used by the playlist feature.
- Validation: `npm run test:unit`, `npm run lint`, and `npm run build`.

## Review

- **Review trigger:** Move draft management to server-rendered routes, require
  an audit trail for category changes, publish drafts from the admin page, or
  commit the admin schema as versioned SQL.
- **Review date:** Not scheduled
