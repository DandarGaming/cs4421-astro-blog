# Astro Starter Kit: Blog

```sh
npm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## AWS deployment

The CDK app defines an AWS CodePipeline that watches `main` in
`dandargaming/cs4421-astro-blog`. Each push builds the Astro site, synthesizes
the CDK app, and deploys the `StaticSiteStack` to S3 and CloudFront. GitHub
Actions only runs validation; AWS credentials are not stored in GitHub.
The pipeline uses CodePipeline V2 push triggers, which are billed per action
execution minute; see [AWS CodePipeline pricing](https://aws.amazon.com/codepipeline/pricing/).

The production static site is generated during the build, and the CloudFront
distribution rewrites clean URLs to their generated `index.html` files. A
second, server-rendered deployment lives in `SsrSiteStack`; see the next
section for the three deployment URLs the project has to cover.

## Static and server-rendered deployments

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

### Who owns the running image

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

### GitHub Actions setup

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

### Alarms and the rollback drill

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

### Custom DNS and TLS

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

Local check without AWS:

```bash
npm run build:ssr
npm run start:ssr
# http://localhost:4321 and http://localhost:4321/api/health
```

Roughly $25/month while it runs: about $16 for the ALB and about $9 for the
always-on Fargate task, plus minimal data transfer. There is no NAT gateway, and
the task sits in public subnets behind a security group that only accepts
traffic from the load balancer.

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

   The app also accepts the `PUBLIC_SUPABASE_URL` and
   `PUBLIC_SUPABASE_PUBLISHABLE_KEY` names if you prefer Astro's public
   variable convention.

4. Insert metadata into `public.songs`, leaving `published` as `false` until
   the tracks and artwork are licensed for public website playback/display.
5. Set `published` to `true` only for approved rows and run `npm run build`.

This site is deployed statically, so Supabase metadata is read during the
build. Publishing or changing tracks requires another deployment. The
publishable key is safe for browser use when Row Level Security is configured;
never add a Supabase service-role key to `.env`, source code, or frontend
configuration.

### One-time setup

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

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
