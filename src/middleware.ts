import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	const start = performance.now();
	const { method } = context.request;
	const path = context.url.pathname;

	try {
		const response = await next();

		console.log(
			JSON.stringify({
				level: 'info',
				message: 'request completed',
				method,
				path,
				status: response.status,
				durationMs: Math.round(performance.now() - start),
				timestamp: new Date().toISOString(),
			}),
		);

		return response;
	} catch (error) {
		console.error(
			JSON.stringify({
				level: 'error',
				message: 'request failed',
				method,
				path,
				durationMs: Math.round(performance.now() - start),
				error: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString(),
			}),
		);

		throw error;
	}
});
