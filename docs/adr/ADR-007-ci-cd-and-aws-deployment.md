# ADR-007: Validate with GitHub Actions and deploy static output to AWS

- **Status:** Accepted
- **Date:** 2026-10-24
- **Related implementation:** [`.github/workflows/`](../../.github/workflows/), [`cdk/`](../../cdk/), [`README.md`](../../README.md)
- **Related decision:** [ADR-002](./ADR-002-static-s3-cloudfront.md)

## Context

The production site is a static Astro build hosted in S3 behind CloudFront.
Deployments need repeatable validation, least-privilege AWS authentication,
cache invalidation, and explicit failure when the infrastructure target is
missing.

## Decision drivers

- Validate code and infrastructure before publishing.
- Avoid long-lived AWS access keys in GitHub.
- Deploy only from `main`.
- Keep infrastructure provisioning separate from routine site publishing.
- Fail clearly when required CloudFormation outputs are unavailable.

## Options considered

### Manual deployment

Simple for occasional changes, but error-prone and difficult to audit.

### GitHub Actions with AWS OIDC

Provides automated checks and short-lived AWS credentials without storing
access keys.

### AWS CodePipeline

Can provide managed deployment orchestration, but the repository already has a
working GitHub Actions workflow and the static stack is managed separately.

## Decision

Use GitHub Actions with two workflows:

- On pushes to `main` and `feat/**`, and pull requests targeting `main`, run
  dependency installation, linting, unit tests, the Astro build, and CDK
  synthesis checks.
- On a successful push to `main`, call the deployment workflow.
- Authenticate to AWS through GitHub's OIDC provider and the
  `AWS_ROLE_ARN` secret.
- Read `SiteBucketName` and `SiteDistributionId` from `StaticSiteStack`.
- Sync `dist/` to S3 with deletion enabled, then invalidate CloudFront at
  `/*`.

The CDK stack is deployed separately; routine GitHub Actions runs publish site
files but do not provision infrastructure.

## Consequences

### Positive

- Every production deployment passes the same automated checks.
- AWS credentials are short-lived and scoped to the deployment role.
- Missing infrastructure outputs fail before an incomplete deployment.
- CloudFront cache invalidation makes the new build visible.

### Negative or trade-offs

- Deployment depends on the AWS stack and repository secret being configured.
- `aws s3 sync --delete` can remove objects not present in the current build.
- A deployment can succeed while a later runtime or content issue remains.

### Risks and mitigations

- **Risk:** The OIDC role is over-permissioned.
  **Mitigation:** Scope permissions to the stack, bucket, objects, and
  distribution required by deployment.
- **Risk:** A bad build is published.
  **Mitigation:** Require lint, tests, Astro build, and CDK synthesis to pass
  before deployment.

## Implementation notes

CI uses Node.js 22.12.0 and `npm ci`. The deploy workflow validates
`AWS_ROLE_ARN`, reads CloudFormation outputs, syncs to S3, and invalidates the
distribution. CDK outputs include the bucket name, distribution ID, and site
URL.

## Review

- **Review trigger:** Migration to a different host, infrastructure-as-code
  deployment from CI, preview environments, or a new release/rollback model.
- **Review date:** Not scheduled
