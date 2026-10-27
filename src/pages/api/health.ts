import type { APIRoute } from 'astro';

// In the static build this response is generated once, at build time.
// In the SSR build it is rendered per request, so the timestamp and uptime change.
export const GET: APIRoute = () =>
	new Response(
		JSON.stringify({
			status: 'ok',
			renderedAt: new Date().toISOString(),
			uptimeSeconds: Math.round(process.uptime()),
			node: process.version,
			region: process.env.AWS_REGION ?? null,
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-store',
			},
		},
	);
