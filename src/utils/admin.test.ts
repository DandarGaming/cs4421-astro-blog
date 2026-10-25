import { describe, expect, it } from 'vitest';
import { addCategory, saveDraftCategories } from './admin';

describe('draft category management', () => {
	it('rejects duplicate category names without regard to case', () => {
		expect(() => addCategory(['Engineering'], ' engineering ')).toThrow('already exists');
	});

	it('creates normalized categories', () => {
		expect(addCategory(['Engineering'], '  Web   Development ')).toEqual([
			'Engineering',
			'Web Development',
		]);
	});

	it('persists only unique category assignments for a draft', () => {
		expect(saveDraftCategories({}, 'second-post', ['Engineering', 'Engineering'])).toEqual({
			'second-post': ['Engineering'],
		});
	});
});
