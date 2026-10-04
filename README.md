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
