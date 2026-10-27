// @ts-check

import mdx from '@astrojs/mdx';
import { fontProviders } from 'astro/config';

/** URL of the statically generated site served by S3 + CloudFront. */
export const STATIC_SITE_URL = 'https://d1wb73pnm22nqf.cloudfront.net';

/** URL of the server-rendered site served by the ALB in front of Fargate. */
export const SSR_SITE_URL = 'https://app.danielsukhanov.me';

/** Integrations and settings that both build variants share. */
export const sharedConfig = {
	integrations: [mdx()],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
};
