// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { STATIC_SITE_URL, sharedConfig } from './astro.shared.mjs';

// Statically generated build, deployed to S3 + CloudFront by cdk/lib/static-site-stack.ts.
// For the server-rendered build, see astro.ssr.config.mjs.
export default defineConfig({
	site: STATIC_SITE_URL,
	output: 'static',
	...sharedConfig,
	integrations: [...sharedConfig.integrations, sitemap()],
});
