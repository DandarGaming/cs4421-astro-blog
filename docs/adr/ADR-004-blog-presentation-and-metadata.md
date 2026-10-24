# ADR-004: Use custom Astro layouts and shared components for presentation

- **Status:** Accepted
- **Date:** 2026-10-24
- **Related implementation:** [`src/components/`](../../src/components/), [`src/layouts/`](../../src/layouts/), [`src/styles/`](../../src/styles/), [`astro.config.mjs`](../../astro.config.mjs)

## Context

The starter blog needed a consistent visual identity across the home page,
journal, posts, author pages, and topic archives. The site also needs
responsive markup, accessible navigation, local font loading, canonical URLs,
Open Graph metadata, RSS discovery, and sitemap generation without introducing
a client-side UI framework.

## Decision drivers

- Preserve Astro's mostly static rendering and performance characteristics.
- Keep shared page structure in reusable components and layouts.
- Provide responsive and semantic HTML.
- Centralize SEO and social metadata.
- Avoid unnecessary client-side JavaScript and framework runtime overhead.

## Options considered

### Keep the starter theme unchanged

Lowest implementation effort, but it would not provide the desired visual
identity or the project-specific navigation and metadata behavior.

### Use a client-side UI framework

Would provide component abstractions, but would add JavaScript and complexity
for pages that can be rendered with Astro components.

### Use custom Astro components and layouts

Provides reusable server-rendered structure, scoped styles, and minimal
client-side behavior while keeping the site aligned with Astro's strengths.

## Decision

Use custom `.astro` components for shared elements such as the header, footer,
head metadata, author bio, formatted dates, and navigation links. Use the
`BlogPost` layout for post presentation and `global.css` for site-wide styles.

Use Astro's local font provider for the Atkinson regular and bold font files.
Use `@astrojs/mdx` and `@astrojs/sitemap` integrations. Centralize canonical,
description, favicon, RSS, Open Graph, Twitter, and generator metadata in
`BaseHead.astro`.

## Consequences

### Positive

- Shared structure and metadata stay consistent across routes.
- Pages are primarily rendered as static HTML.
- Local fonts avoid a third-party font request.
- Semantic labels, live search status, image alt text, and keyboard focus
  styles can be maintained in the source components.

### Negative or trade-offs

- Custom CSS and components require ongoing maintenance.
- Metadata depends on correct page props and the configured site URL.
- Visual changes may need updates in several scoped component styles.

### Risks and mitigations

- **Risk:** A route omits or misconfigures metadata.
  **Mitigation:** Route pages through `BaseHead` and verify production builds.
- **Risk:** Responsive or accessibility regressions are introduced by styling.
  **Mitigation:** Use semantic HTML, focus-visible styles, and review changes
  at narrow and wide viewport sizes.

## Implementation notes

The configured site URL is `https://d1wb73pnm22nqf.cloudfront.net`. Images use
Astro assets where applicable, and the blog layout renders topic links and
author information from typed collection entries.

## Review

- **Review trigger:** Adoption of a UI framework, a major redesign, dynamic
  personalization, or a change in hosting that requires runtime rendering.
- **Review date:** Not scheduled
