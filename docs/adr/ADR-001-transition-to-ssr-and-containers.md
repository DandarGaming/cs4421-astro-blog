# ADR-001: Transition to SSR and Containers

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The blog was configured as a statically generated Astro site. Its AWS CDK
deployment builds `dist/` and publishes it to an S3 bucket behind CloudFront.
That architecture cannot execute per-request server code, so it cannot provide
runtime health information or server-side request logs.

## Decision

Use Astro's server output with the official `@astrojs/node` adapter in
standalone mode. The built application runs as a Node.js HTTP server from
`dist/server/entry.mjs`. All pages and endpoints are rendered on demand unless
explicitly prerendered. Add a `/api/health` endpoint for process health and
middleware that emits one-line JSON request completion/failure logs.

The Node standalone server is the target runtime for a containerized
deployment. The existing CDK S3/CloudFront deployment is not converted by this
decision; it remains incompatible with this SSR build until a separate
infrastructure change deploys and routes traffic to the Node server.

## Consequences

- Production now requires a running Node.js process (Node.js 22.12 or later),
  rather than only static object hosting.
- Health checks can query `/api/health` and receive process uptime and a UTC
  timestamp.
- Request logs are JSON lines written to standard output/error, suitable for
  collection by a container runtime.
- The existing static-site deployment pipeline must be migrated separately
  before it can publish this server-rendered application.

## Local operation

Build the standalone server with `npm run build`, then run it in PowerShell:

```powershell
$env:HOST = "0.0.0.0"
$env:PORT = "4321"
node .\dist\server\entry.mjs
```

In another terminal, check it with:

```powershell
curl.exe -i http://localhost:4321/api/health
```
