# ADR-002: Use Static S3 and CloudFront Hosting

- **Status:** Accepted
- **Date:** 2026-10-12
- **Supersedes:** [ADR-001](./ADR-001-transition-to-ssr-and-containers.md)

## Context

The production AWS stack serves files from S3 through CloudFront. It cannot run
the Node.js server produced by Astro's server output, which left the site
without a root `index.html` and caused CloudFront to return `403 AccessDenied`.

## Decision

Build Astro in static output mode and pre-render every blog post with
`getStaticPaths()`. Keep the existing S3 and CloudFront deployment pipeline,
and use a CloudFront Function to map clean page URLs to their generated
`index.html` files. The Docker image, if used, serves the same static build
with Nginx rather than running an Astro server.

## Consequences

- Blog pages are generated during deployment; request-time rendering is not
  available.
- `/api/health` is a static build artifact and reports status only, not process
  uptime or the current request time.
- CloudFront rewrites clean page paths to static files and maps missing S3
  objects to the generated 404 page.
- Both the S3 deployment and optional container image use the same static
  build output.
