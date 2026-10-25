export interface DraftCategoryState {
	[draftId: string]: string[];
}

export const DEFAULT_CATEGORIES = ['Engineering'];

export function normalizeCategoryName(name: string): string {
	return name.trim().replace(/\s+/g, ' ');
}

export function addCategory(categories: string[], name: string): string[] {
	const normalizedName = normalizeCategoryName(name);

	if (!normalizedName) {
		throw new Error('Category names cannot be empty.');
	}

	if (categories.some((category) => category.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
		throw new Error('That category already exists.');
	}

	return [...categories, normalizedName].sort((a, b) => a.localeCompare(b));
}

export function saveDraftCategories(
	state: DraftCategoryState,
	draftId: string,
	categories: string[],
): DraftCategoryState {
	const uniqueCategories = [...new Set(categories.map(normalizeCategoryName).filter(Boolean))];

	return { ...state, [draftId]: uniqueCategories };
}
