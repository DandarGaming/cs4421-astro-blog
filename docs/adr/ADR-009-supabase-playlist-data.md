# ADR-009: Store playlist metadata and media references in Supabase

- **Status:** Accepted
- **Date:** 2026-10-25
- **Related decisions:** [ADR-002](./ADR-002-static-s3-cloudfront.md),
  [ADR-008](./ADR-008-static-container-image.md)
- **Related implementation:** [`supabase/music.sql`](../../supabase/music.sql),
  [`src/lib/supabase.ts`](../../src/lib/supabase.ts),
  [`src/components/MusicPlayer.astro`](../../src/components/MusicPlayer.astro),
  [`README.md`](../../README.md)

## Context

The blog's music player needs a central source for playlist metadata and
media references. The site is statically generated and must not expose
privileged Supabase credentials in the build output or browser.

## Decision drivers

- Store song titles, album metadata, artwork references, and audio references
  in a managed database.
- Allow the public site to read only tracks approved for publication.
- Keep media files in Supabase Storage and derive public URLs from their paths.
- Preserve the static Astro deployment model.
- Document setup and required environment variables for local and production
  builds.

## Options considered

### Store playlist data in the repository

This would be simple to deploy, but changing songs would require source
changes and would not provide a central data source for playlist management.

### Use a privileged Supabase server credential

This would provide broad database access, but it is unsafe for a static site
because the credential could be exposed in the build output or client
configuration.

### Use Supabase with public reads protected by Row Level Security

This stores metadata in `public.songs`, keeps media in the `music` Storage
bucket, and exposes only a publishable/anonymous key. Row Level Security
restricts public reads to rows where `published = true`.

## Decision

Use Supabase for playlist metadata and media references:

1. Define `public.songs` in [`supabase/music.sql`](../../supabase/music.sql).
2. Store `title`, optional `album`, `artwork_filename`, and
   `audio_filename`, along with the folder path and publication status.
3. Enable Row Level Security and grant anonymous/authenticated `SELECT` only
   through the policy requiring `published = true`.
4. Use `SUPABASE_URL` and the publishable `SUPABASE_KEY` (or the documented
   `PUBLIC_*` equivalents). Never use a service-role key in the application.
5. Query published songs during the Astro build and generate public Storage
   URLs for the `music` bucket.
6. Show explicit loading, empty, configuration, and error states in the music
   player. The current build-time query resolves before the page is emitted,
   so the loading message is hidden for the static path. The client-side state
   transition is still present so a future runtime playlist fetch can show
   loading without changing the player markup or controls.

## Consequences

### Positive

- Playlist metadata is centrally managed in Supabase.
- Unpublished rows remain unavailable to public reads.
- The static site never requires a privileged runtime credential.
- Artwork and MP3 URLs are derived consistently from Storage paths.
- The build remains compatible with S3/CloudFront and the static container.

### Negative or trade-offs

- Publishing or changing songs requires another site build and deployment.
- Public Storage URLs require the bucket and its object policies to be
  configured correctly.
- The static build-time query does not require an in-browser loading period;
  runtime fetching must use the existing explicit loading state.
- A Supabase project and Storage bucket must be provisioned outside this
  repository.

## Review

- **Review trigger:** Move playlist fetching to runtime/client-side data
  loading, require playlist edits without redeployment, or change media
  hosting.
- **Review date:** Not scheduled
