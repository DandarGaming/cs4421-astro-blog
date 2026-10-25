# ADR-008: Serve the static build from a multi-stage Nginx container

- **Status:** Accepted
- **Date:** 2026-10-24
- **Related decisions:** [ADR-001](./ADR-001-transition-to-ssr-and-containers.md), [ADR-002](./ADR-002-static-s3-cloudfront.md)
- **Related implementation:** [`Dockerfile`](../../Dockerfile), [`nginx.conf`](../../nginx.conf)

## Context

The project needs an optional container image for environments that prefer
container deployment. The production architecture is static hosting, so the
container must serve the same generated files rather than reintroduce the
superseded Astro SSR runtime.

## Decision drivers

- Match the S3/CloudFront static build.
- Keep the runtime image small and simple.
- Build the site reproducibly inside the image.
- Run as a non-root user.
- Expose a health-checkable HTTP endpoint.

## Options considered

### No container image

Would reduce repository maintenance, but would not support container-oriented
deployment environments.

### Node.js image running Astro SSR

Matches the earlier SSR experiment, but conflicts with the accepted static
hosting architecture and requires a Node server at runtime.

### Multi-stage static build served by Nginx

Builds the Astro site once, copies only `dist/` into an Nginx runtime image,
and serves the same static output as AWS.

## Decision

Use a two-stage Docker build:

1. Build with `node:22.23.4-alpine`, `npm ci`, and `npm run build`.
2. Serve the generated `dist/` directory from `nginx:alpine`.

Configure Nginx to listen on port `4321`, serve static files, return the
generated `/404.html` for missing pages, and expose the generated
`/api/health` artifact. Run the container as the `nginx` user and define a
Docker health check against `http://127.0.0.1:4321/api/health`.

## Consequences

### Positive

- The container and S3 deployment serve the same static artifact.
- The runtime image does not need Node.js or application dependencies.
- The process runs without root privileges.
- Health checks and standard output/error access logs are available.

### Negative or trade-offs

- The health endpoint reports static build content, not live process uptime.
- Runtime server behavior depends on Nginx configuration.
- The image is not suitable for request-time Astro rendering.

### Risks and mitigations

- **Risk:** The health endpoint becomes stale or is missing from `dist/`.
  **Mitigation:** Keep it in the Astro build and validate the production build
  before creating the image.
- **Risk:** Nginx cannot write temporary files as the non-root user.
  **Mitigation:** Use temporary paths under `/tmp` and configure them in
  `nginx.conf`.

## Implementation notes

The Docker build copies `package*.json` before source files to improve layer
caching. The runtime exposes port `4321` and starts Nginx in the foreground.
The image is optional and is not the deployment mechanism used by the current
GitHub Actions AWS workflow.

## Review

- **Review trigger:** A hosting platform requiring SSR, runtime APIs, dynamic
  health information, or a different container ingress contract.
- **Review date:** Not scheduled
