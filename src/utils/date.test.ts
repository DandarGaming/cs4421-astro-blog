import { describe, expect, it } from 'vitest';

describe('date formatting', () => {
	it('formats a date for the blog display', () => {
		const date = new Date('2026-09-23T00:00:00.000Z');

		expect(
			date.toLocaleDateString('en-us', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				timeZone: 'UTC',
			}),
		).toBe('Sep 23, 2026');
	});
});
