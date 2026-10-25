// @ts-check

import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import { SSR_SITE_URL, sharedConfig } from './astro.shared.mjs';

// Server-rendered build, deployed to the ALB + Fargate stack in cdk/lib/ssr-site-stack.ts.
// Build it with `npm run build:ssr`; the output runs via `node ./dist/server/entry.mjs`.
export default defineConfig({
	site: SSR_SITE_URL,
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	...sharedConfig,
});
