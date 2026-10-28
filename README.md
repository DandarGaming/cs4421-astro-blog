# cs4421-astro-blog

[![CI](https://github.com/DandarGaming/cs4421-astro-blog/actions/workflows/ci.yml/badge.svg)](https://github.com/DandarGaming/cs4421-astro-blog/actions/workflows/ci.yml)
[![Validate site](https://github.com/DandarGaming/cs4421-astro-blog/actions/workflows/deploy-static.yml/badge.svg)](https://github.com/DandarGaming/cs4421-astro-blog/actions/workflows/deploy-static.yml)
[![Deploy container](https://github.com/DandarGaming/cs4421-astro-blog/actions/workflows/deploy-container.yml/badge.svg)](https://github.com/DandarGaming/cs4421-astro-blog/actions/workflows/deploy-container.yml)

## Overview

A personal blog built with [Astro](https://docs.astro.build/). It publishes
Markdown/MDX posts with authors, tags and archives, an RSS feed, a sitemap, a
neon music player backed by [Supabase](https://supabase.com/), and a small
admin area for drafting posts.

The same codebase ships in two deployment flavors:

| Flavor | Config | Runtime | Live URL |
| --- | --- | --- | --- |
| Static | `astro.config.mjs` (`output: 'static'`) | S3 + CloudFront | <https://www.danielsukhanov.me> |
| Server-rendered (SSR) | `astro.ssr.config.mjs` (`output: 'server'`) | ECS Fargate behind an ALB | <https://app.danielsukhanov.me> |

Both are provisioned with [AWS CDK](https://docs.aws.amazon.com/cdk/), and
every push to `main` is built and deployed by CI/CD (see
[Deployment](#deployment)).

## Tech stack

- [Astro 7](https://docs.astro.build/) with [MDX](https://mdxjs.com/) content
  and content collections
- [Astro Node adapter](https://docs.astro.build/en/guides/integrations-guide/node/)
  (standalone mode) for the SSR build
- [Supabase](https://supabase.com/) (PostgreSQL + Storage) for music player
  metadata
- [AWS CDK](https://docs.aws.amazon.com/cdk/) for infrastructure:
  S3 + CloudFront, ECS Fargate, ALB, CodePipeline
- [GitHub Actions](https://docs.github.com/en/actions) for CI/CD
- [ESLint](https://eslint.org/) (`eslint-plugin-astro`,
  `typescript-eslint`) and [Vitest](https://vitest.dev/) for quality checks

## Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | **22.23.4 or newer** (pinned by `engines` in `package.json`) | everything |
| npm | bundled with Node.js | installing dependencies, running scripts |
| Git | any recent version | cloning, branching, PRs |
| [Docker](https://www.docker.com/) | any recent version | building/running container images |
| [AWS CLI](https://aws.amazon.com/cli/) + CDK | any recent version | deploying to AWS (maintainers only) |

A Supabase project is only required for the music player and admin features;
the site builds and runs without it.

## Getting started

```bash
# 1. Clone your fork
git clone https://github.com/<your-user>/cs4421-astro-blog.git
cd cs4421-astro-blog

# 2. Install dependencies (npm ci installs exactly what package-lock.json pins)
npm ci

# 3. Create your local environment file (optional, see "Environment variables")
cp .env.example .env

# 4. Start the dev server
npm run dev
```

The site is now available at <http://localhost:4321>.

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL (also accepted as `PUBLIC_SUPABASE_URL`) |
| `SUPABASE_KEY` | Supabase publishable/anon key (also accepted as `PUBLIC_SUPABASE_PUBLISHABLE_KEY`) |

Never commit a service-role key; the publishable key is safe for browser use
when Row Level Security is enabled. See
[Music player and Supabase](#music-player-and-supabase) for the database setup.

## Development commands

All commands run from the repository root:

| Command | Action |
| : | : |
| `npm run dev` | Start the dev server at `localhost:4321` |
| `npm run build` | Build the production static site to `./dist/` |
| `npm run build:ssr` | Build the server-rendered site to `./dist/server/` |
| `npm run start:ssr` | Run the built SSR server (`./dist/server/entry.mjs`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the project |
| `npm run test:unit` | Run the unit tests once (Vitest) |
| `npm run test` | Run the unit tests in watch mode |
| `npm run astro -- --help` | Run any Astro CLI command |

### Running the project locally

```bash
npm run dev            # development server with hot reload
```

### Building the project

```bash
npm run build          # static site -> ./dist/
npm run build:ssr      # SSR server  -> ./dist/server/entry.mjs
```

### Previewing the production build

```bash
npm run preview        # serve the static build locally
```

Or run the server-rendered build without Docker or AWS:

```bash
npm run build:ssr
npm run start:ssr
# http://localhost:4321 and http://localhost:4321/api/health
```

`/api/health` returns a JSON payload with `renderedAt` and `uptimeSeconds`;
in the SSR build both change on every request.

## Project structure

```text
├── public/                  Static assets copied into the build as-is
├── src/
│   ├── assets/              Fonts and images processed by Astro
│   ├── components/          UI components (Header, Footer, MusicPlayer, ...)
│   ├── content/             Content collections: blog/ and authors/ (MD/MDX)
│   ├── content.config.ts    Collection schemas and references
│   ├── layouts/             Page layouts
│   ├── lib/supabase.ts      Supabase client
│   ├── pages/               Routes: index, about, blog/, authors/,
│   │                        admin/, api/health.ts, rss.xml.js, 404.astro
│   ├── scripts/             Browser-side scripts (admin)
│   ├── styles/              Global stylesheets
│   ├── utils/               Helpers (date, topics, admin) and their tests
│   ├── consts.ts            Shared site constants
│   └── middleware.ts        Structured one-line JSON request logs
├── cdk/                     AWS CDK app: static, SSR image and SSR site stacks
├── docs/adr/                Architecture Decision Records (see docs/adr/README.md)
├── scripts/rollback.sh      Roll the ECS service back to an earlier revision
├── supabase/music.sql       Database schema and read policy for the player
├── .github/workflows/       CI, Validate site, Deploy container
├── astro.config.mjs         Static build configuration
├── astro.ssr.config.mjs     SSR build configuration
├── astro.shared.mjs         Settings shared by both builds (integrations, fonts)
├── Dockerfile               Static image (nginx)
├── Dockerfile.ssr           SSR image (Node)
└── sum.js / sum.test.js     Sample unit test
```

## Testing and linting

```bash
npm run lint        # ESLint (flat config in eslint.config.js)
npm run test:unit   # Vitest unit tests (src/utils/*.test.ts, sum.test.js)
```

CI (`.github/workflows/ci.yml`) runs both plus a production build on every
push to `main` and on every pull request, so run them locally before opening a
PR.

## Documentation

- [ADR index](./docs/adr/README.md) — architecture decisions, including
  [ADR-001: Transition to SSR and containers](./docs/adr/ADR-001-transition-to-ssr-and-containers.md)
  and [ADR-002: Static S3 + CloudFront hosting](./docs/adr/ADR-002-static-s3-cloudfront.md)
- [Astro documentation](https://docs.astro.build/)
- [Supabase documentation](https://supabase.com/docs)
- [AWS CDK documentation](https://docs.aws.amazon.com/cdk/)

## Contributing

1. Branch from `main` (`git checkout -b <type>/<short-description>`).
2. Make your changes, keeping commits focused.
3. Run `npm run lint`, `npm run test:unit`, and `npm run build` locally.
4. Open a pull request; CI must be green before review.
5. Record structural decisions as an ADR in `docs/adr/` (see
   [ADR-000 template](./docs/adr/ADR-000-template.md)).

## Deployment

### How deployment works

An AWS CodePipeline watches `main` in this repository: each push builds the
Astro site, synthesizes the CDK app, and deploys the `StaticSiteStack` to S3
and CloudFront. GitHub Actions only runs validation; AWS credentials are not
stored in GitHub. The pipeline uses CodePipeline V2 push triggers, which are
billed per action execution minute; see
[AWS CodePipeline pricing](https://aws.amazon.com/codepipeline/pricing/).

GitHub Actions runs three workflows:

| Workflow | File | Trigger | What it does |
| --- | --- | --- | --- |
| CI | `.github/workflows/ci.yml` | push to `main` / `feat/**`, PRs to `main` | lint, unit tests, static build |
| Validate site | `.github/workflows/deploy-static.yml` | PRs and pushes | site validation |
| Deploy container | `.github/workflows/deploy-container.yml` | push to `main` | tests, Docker build, push to ECR, update the ECS service |

The static site's CloudFront distribution rewrites clean URLs to their
generated `index.html` files. A second, server-rendered deployment lives in
`SsrSiteStack`.

### Static and server-rendered deployments

Both deployments build from this repository, but from different configs:

| Build | Command | Config | Output |
| --- | --- | --- | --- |
| Static | `npm run build` | `astro.config.mjs` (`output: 'static'`) | `dist/`, served by S3 + CloudFront |
| SSR | `npm run build:ssr` | `astro.ssr.config.mjs` (`output: 'server'`, Node adapter) | `dist/server/entry.mjs`, served by Fargate |

The shared settings, including the local font setup, live in
`astro.shared.mjs` so the two variants cannot drift apart. In the SSR build
every route is rendered per request, and `/api/health` returns the render
timestamp and process uptime. The static build bakes that same response once,
at build time.

| Requirement | URL | Produced by |
| --- | --- | --- |
| SSR - load balancer URL | the `LoadBalancerUrl` stack output, `http://<alb-dns-name>` | `SsrSiteStack` ALB, no custom DNS |
| Static site - custom DNS | `https://www.danielsukhanov.me` | CloudFront distribution behind Cloudflare |
| SSR - custom DNS | `https://app.danielsukhanov.me` | Cloudflare CNAME to the ALB |

The static site's `www` record is configured outside CDK (in Cloudflare in
front of the CloudFront distribution); `StaticSiteStack` itself does not declare
the alternate domain name or certificate.

### Deploying the SSR site

AWS App Runner cannot be used: it stopped accepting new customers on
2026-04-30. The SSR site runs on ECS Fargate behind an internet-facing
Application Load Balancer instead, which is also what provides the load
balancer URL.

The SSR deployment is two stacks, because the ECS service cannot start until an
image exists, and the image cannot be pushed until the repository exists:

| Stack | What it creates |
| --- | --- |
| `SsrImageStack` | the `astro-ssr` ECR repository |
| `SsrSiteStack` | VPC, ALB, Fargate service, log group, alarms, GitHub deploy role |

Deploy the repository first:

```bash
npm ci && npm run build   # the CDK app embeds dist/ for the static stack
cd cdk && npm ci
export CDK_DEFAULT_ACCOUNT=YOUR_ACCOUNT_ID
export CDK_DEFAULT_REGION=us-east-1
export GITHUB_CONNECTION_ARN=YOUR_CONNECTION_ARN
export SSR_HOSTNAME=app.danielsukhanov.me

npx cdk deploy SsrImageStack
```

Seed the first image, since the service pulls `astro-ssr:stable` (Docker must be
running):

```bash
REPO="$CDK_DEFAULT_ACCOUNT.dkr.ecr.$CDK_DEFAULT_REGION.amazonaws.com/astro-ssr"
aws ecr get-login-password --region "$CDK_DEFAULT_REGION" \
  | docker login --username AWS --password-stdin "${REPO%/*}"
docker build -f Dockerfile.ssr -t "$REPO:stable" .
docker push "$REPO:stable"
```

Then create the service:

```bash
npx cdk deploy SsrSiteStack
```

To pass Supabase settings to the server instead of baking them into the image,
export them before this deploy; they become task environment variables:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_KEY=your-publishable-key
```

#### Who owns the running image

- CDK owns the infrastructure and the baseline task definition, which pulls the
  moving `astro-ssr:stable` tag.
- GitHub Actions owns what actually runs. Each push to `main` pushes
  `sha-<commit>` and `stable`, registers a new revision on the `astro-ssr` task
  family, and points the service at that revision.
- Because the baseline pulls `stable` rather than a pinned image, a later
  `cdk deploy` keeps whatever image CI last pushed instead of reverting to an
  old build.
- `scripts/rollback.sh` moves `stable` back to the revision it restores, so a
  rollback survives a later CDK deploy too.

#### GitHub Actions setup

The workflow is `.github/workflows/deploy-container.yml`. It authenticates with
OIDC, so no AWS keys live in GitHub. Set one repository variable:

| Variable | Value |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | the `DeployRoleArn` output of `SsrSiteStack` |
| `AWS_REGION` (optional) | defaults to `us-east-1` |

The role trusts this repository's `main` branch using both its legacy subject
and its current immutable-ID subject
(`repo:DandarGaming@103852756/cs4421-astro-blog@1362457966:ref:refs/heads/main`).
GitHub changed the default OIDC subject format for repositories created after
July 15, 2026; the IAM trust policy needs both patterns while older subject
formats are still in use. The role can only push to the `astro-ssr` repository,
register task definitions, update that one service, pass the two task roles, and
read the log group.

After changing this trust policy in CDK, redeploy `SsrSiteStack` using AWS
credentials with permission to update IAM. The IAM provider and role must also
exist in the same AWS account as the `AWS_DEPLOY_ROLE_ARN` repository variable.

The workflow runs the tests before it touches AWS, then builds `Dockerfile.ssr`,
pushes both tags, registers a task definition revision, updates the service,
waits for `services-stable`, and finally checks that the service still runs the
revision it asked for. If ECS rolled back because the new tasks never became
healthy, that last step fails the job.

#### Alarms and the rollback drill

The ALB health check hits `/api/health` every 10 seconds and needs two successes
to mark a task healthy; a task gets 15 seconds of grace at startup. Two failed
checks mark it unhealthy, so a broken image is detected in roughly 20 seconds
and the deployment circuit breaker rolls the service back.

Two alarms publish to an SNS topic:

- `UnHealthyTargets` — any target failing `/api/health` for a minute.
- `Target5xx` — any 5XX response from the targets in a minute.

Set `ALARM_EMAIL` before deploying to subscribe an address, and confirm the
subscription email. The `AlarmTopicArn` and `LogGroupName` (`/aws/ecs/astro-ssr`)
outputs are there for the drill.

Drill 2, as run:

1. Push a commit where `/api/health` returns 500. The workflow builds, pushes,
   and starts the rollout.
2. Watch the alarm fire and the target go unhealthy in the ECS console, or tail
   the log group:

   ```bash
   aws logs tail /aws/ecs/astro-ssr --since 10m --follow
   ```

3. The circuit breaker rolls the service back and the workflow's verification
   step fails, naming the revision the service reverted to.
4. For an explicit rollback to an earlier ECR image, run:

   ```bash
   ./scripts/rollback.sh          # the revision before the current one
   ./scripts/rollback.sh 3        # a specific revision
   ```

   It retags `stable` to that revision's image, points the service at the
   revision, and waits for it to stabilise — typically under a minute once the
   unhealthy task has been detected.

#### Custom DNS and TLS

After the service exists, add the record in Cloudflare:

1. Take the `LoadBalancerDnsName` stack output, e.g.
   `SsrSi-Alb16C2F182-1234567890.us-east-1.elb.amazonaws.com`.
2. Create a proxied (orange cloud) `CNAME` record `app` pointing at it, so
   Cloudflare terminates TLS and forwards over HTTP to the ALB's port 80.
3. Leave the Cloudflare SSL/TLS mode on **Full** or **Flexible**; the ALB
   serves plain HTTP and never redirects, so no redirect loop forms.

For end-to-end TLS, request an ACM certificate for `app.danielsukhanov.me` in
the stack region, add the validation CNAME in Cloudflare, then set
`SSR_CERTIFICATE_ARN` and redeploy to get an HTTPS listener on 443. Both
listeners forward to the same target group, so Cloudflare keeps working either
way.

Roughly $25/month while it runs: about $16 for the ALB and about $9 for the
always-on Fargate task, plus minimal data transfer. There is no NAT gateway, and
the task sits in public subnets behind a security group that only accepts
traffic from the load balancer.

### One-time setup (static pipeline)

1. In the AWS Console, create an **AWS CodeConnections** connection (formerly
   CodeStar Connections) to GitHub and complete the GitHub authorization. Wait
   until the connection status is **Available**, then copy its ARN.
2. Configure AWS credentials locally with permission to bootstrap CDK and
   create the pipeline and its resources. For an access key, set its values
   only in your local PowerShell session; do not paste them into source files
   or commit them. Prefer temporary credentials or an AWS CLI profile when
   available.
3. In PowerShell, set the credentials, account, region, and authorized
   connection ARN, then from the repository root bootstrap the selected AWS
   account and region and deploy the pipeline:

   ```powershell
   $env:AWS_ACCESS_KEY_ID = "YOUR_ACCESS_KEY_ID"
   $env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET_ACCESS_KEY"
   $env:CDK_DEFAULT_ACCOUNT = "YOUR_ACCOUNT_ID"
   $env:CDK_DEFAULT_REGION = "YOUR_AWS_REGION"
   $env:GITHUB_CONNECTION_ARN = "arn:aws:codestar-connections:REGION:ACCOUNT_ID:connection/CONNECTION_ID"
   cd cdk
   npx cdk bootstrap
   npx cdk deploy AstroBlogPipelineStack
   ```

   Use your real connection ARN. Both commands must use the same AWS account
   and region; the CDK app requires the connection ARN for either command.

After the pipeline is deployed, pushes to `main` trigger site deployments.
The first deployment may take several minutes. The `StaticSiteStack` uses the
same stack name as the original CDK site stack, so deploy into its existing
AWS account and region if you already deployed the site.

## Music player and Supabase

The home page includes a neon music player above the hero section. It reads
published rows from `public.songs` and creates Storage URLs using the `music`
bucket. The SQL schema and read policy are in [`supabase/music.sql`](./supabase/music.sql).

1. Run `supabase/music.sql` in the Supabase SQL Editor.
2. Create a Storage bucket named `music`. Use paths such as
   `Adolescents/cover.jpg` and `Adolescents/01-track-title.mp3`.
3. Add the connection values to a local `.env` file using
   [`.env.example`](./.env.example):

   ```dotenv
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-publishable-key
   ```

4. Insert metadata into `public.songs`, leaving `published` as `false` until
   the tracks and artwork are licensed for public website playback/display.
5. Set `published` to `true` only for approved rows and run `npm run build`.

This site is deployed statically, so Supabase metadata is read during the
build. Publishing or changing tracks requires another deployment.

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bear-blog/).
