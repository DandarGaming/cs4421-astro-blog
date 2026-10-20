import { describe, expect, it } from 'vitest';
import { getTopicSlug } from './topics';

describe('getTopicSlug', () => {
	it('converts topic names to lowercase URL slugs', () => {
		expect(getTopicSlug('Web Development')).toBe('web-development');
	});

	it('normalizes accents and punctuation', () => {
		expect(getTopicSlug('  Café & Code!  ')).toBe('cafe-code');
	});

	it('produces a usable slug for topics without letters or numbers', () => {
		expect(getTopicSlug('!!!')).toBe('topic-21-21-21');
	});
});
