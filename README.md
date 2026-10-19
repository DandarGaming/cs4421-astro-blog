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
- ✅ Static, client-side search across post titles and descriptions
- ✅ Author directory and statically generated author profiles

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

## Categorizing blog posts

Blog post frontmatter may include a category and a list of tags. Both are
optional, so existing posts without topic metadata continue to work. For
example:

```yaml
category: Guides
tags:
  - Astro
  - Markdown
```

Topic links appear in the journal and on each post. Each tag and category has a
pre-rendered archive at `/blog/tags/<topic>/` or
`/blog/categories/<topic>/`, so topic navigation works on the static S3 and
CloudFront deployment.

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

For every push to `main`, GitHub Actions runs the lint, test, site-build, and
CDK-build checks, then deploys the static site if they pass. The deployment
builds the site, syncs `dist/` to S3, and invalidates the CloudFront cache.
GitHub authenticates to AWS with OpenID Connect; do not store long-lived AWS
access keys in GitHub.

The production site is statically generated. Blog post routes are rendered
during the build, and the CloudFront distribution rewrites clean URLs to their
generated `index.html` files. Request-time server rendering and runtime
process-health details are not available on this S3 deployment.

### One-time setup

1. Configure AWS credentials locally with permission to bootstrap CDK and
   deploy the site stack. Build the site, then from PowerShell bootstrap the
   selected account and region and deploy `StaticSiteStack`:

   ```powershell
   $env:CDK_DEFAULT_ACCOUNT = "YOUR_ACCOUNT_ID"
   $env:CDK_DEFAULT_REGION = "YOUR_AWS_REGION"
   npm ci
   npm run build
   cd cdk
   npm ci
   npx cdk bootstrap
   npx cdk deploy StaticSiteStack
   ```

   Use an AWS CLI profile or temporary credentials rather than putting
   credentials in the repository. The CDK app requires the account and region
   to match the credentials used for both commands.
2. In AWS IAM, create the GitHub Actions OIDC provider for
   `token.actions.githubusercontent.com` if the account does not already have
   one. Create a role with this trust policy, replacing the account ID:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": {
         "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
       },
       "Action": "sts:AssumeRoleWithWebIdentity",
       "Condition": {
         "StringEquals": {
           "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
         },
         "StringLike": {
           "token.actions.githubusercontent.com:sub": "repo:dandargaming/cs4421-astro-blog:ref:refs/heads/main"
         }
       }
     }]
   }
   ```

3. Attach a permissions policy to the role, scoped to the bucket and
   distribution created by `StaticSiteStack`. The stack outputs
   `SiteBucketName` and `SiteDistributionId`; use those values in place of the
   placeholders below:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": "cloudformation:DescribeStacks",
         "Resource": "arn:aws:cloudformation:REGION:ACCOUNT_ID:stack/StaticSiteStack/*"
       },
       {
         "Effect": "Allow",
         "Action": ["s3:ListBucket", "s3:ListBucketMultipartUploads"],
         "Resource": "arn:aws:s3:::SITE_BUCKET"
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:AbortMultipartUpload",
           "s3:ListMultipartUploadParts"
         ],
         "Resource": "arn:aws:s3:::SITE_BUCKET/*"
       },
       {
         "Effect": "Allow",
         "Action": "cloudfront:CreateInvalidation",
         "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
       }
     ]
   }
   ```

4. In the GitHub repository settings, add the role ARN as the
   `AWS_ROLE_ARN` Actions secret. The GitHub Actions deployment is configured
   to use `us-east-1`, so deploy `StaticSiteStack` to that same AWS region.

After setup, every push to `main` builds and publishes the site. For an
existing installation of the former CodePipeline deployment, use the same
AWS account and region for `StaticSiteStack`; once GitHub Actions has deployed
successfully, disable or delete the old `AstroBlogPipelineStack` so only one
pipeline deploys production.

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
