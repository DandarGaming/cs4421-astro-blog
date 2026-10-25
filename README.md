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

The production site is statically generated. Blog post routes are rendered
during the build, and the CloudFront distribution rewrites clean URLs to their
generated `index.html` files. Request-time server rendering and runtime
process-health details are not available on this S3 deployment.

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
