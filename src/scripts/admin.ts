import { createClient, type User } from '@supabase/supabase-js';
import { addCategory, normalizeCategoryName } from '../utils/admin';

interface Draft {
	id: string;
	title: string;
	author: string;
	updated_at: string;
	categories: string[];
}

const shell = document.querySelector<HTMLElement>('.admin-shell');
const supabaseUrl = shell?.dataset.supabaseUrl;
const supabaseKey = shell?.dataset.supabaseKey;
const client = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const loginForm = document.querySelector<HTMLFormElement>('#login-form');
const adminApp = document.querySelector<HTMLElement>('#admin-app');
const message = document.querySelector<HTMLElement>('#admin-message');
const draftList = document.querySelector<HTMLElement>('#draft-list');
const search = document.querySelector<HTMLInputElement>('#draft-search');
const categoryFilter = document.querySelector<HTMLSelectElement>('#category-filter');
const newCategoryDraft = document.querySelector<HTMLSelectElement>('#new-category-draft');
const genericError = 'Unable to complete that request.';
let drafts: Draft[] = [];
let categories: string[] = [];
let user: User | null = null;

function showMessage(text: string, isError = false) {
	if (!message) return;
	message.textContent = text;
	message.classList.toggle('error', isError);
}

function renderFilters() {
	if (!categoryFilter || !newCategoryDraft) return;
	categoryFilter.replaceChildren(new Option('All categories', ''));
	categories.forEach((category) => categoryFilter.add(new Option(category, category)));
	newCategoryDraft.replaceChildren(...drafts.map((draft) => new Option(draft.title, draft.id)));
}

function renderDrafts() {
	if (!draftList) return;
	const query = search?.value.trim().toLocaleLowerCase() ?? '';
	const selectedCategory = categoryFilter?.value ?? '';
	const visibleDrafts = drafts.filter(
		(draft) =>
			draft.title.toLocaleLowerCase().includes(query) &&
			(!selectedCategory || draft.categories.includes(selectedCategory)),
	);
	draftList.replaceChildren(
		...visibleDrafts.map((draft) => {
			const card = document.createElement('article');
			card.className = 'draft-card';
			const title = document.createElement('h3');
			title.textContent = draft.title;
			const meta = document.createElement('p');
			meta.className = 'draft-meta';
			meta.textContent = `${draft.author} · Updated ${new Date(draft.updated_at).toLocaleDateString()}`;
			const fieldset = document.createElement('fieldset');
			const legend = document.createElement('legend');
			legend.textContent = 'Assigned categories';
			fieldset.append(legend);
			const options = document.createElement('div');
			options.className = 'category-options';
			categories.forEach((category) => {
				const label = document.createElement('label');
				const input = document.createElement('input');
				input.type = 'checkbox';
				input.value = category;
				input.checked = draft.categories.includes(category);
				label.append(input, document.createTextNode(category));
				options.append(label);
			});
			fieldset.append(options);
			const save = document.createElement('button');
			save.type = 'button';
			save.textContent = 'Save categories';
			save.addEventListener('click', () =>
				saveDraft(
					draft,
					[...options.querySelectorAll<HTMLInputElement>('input:checked')].map((input) => input.value),
				),
			);
			card.append(title, meta, fieldset, save);
			return card;
		}),
	);
	if (!visibleDrafts.length) {
		const empty = document.createElement('p');
		empty.className = 'empty-state';
		empty.textContent = 'No drafts match your filters.';
		draftList.append(empty);
	}
}

async function saveDraft(draft: Draft, selected: string[]) {
	if (!client || !user) return false;
	try {
		const { error: deleteError } = await client.from('draft_categories').delete().eq('draft_id', draft.id);
		if (deleteError) throw deleteError;
		if (selected.length) {
			const { error } = await client
				.from('draft_categories')
				.insert(selected.map((category) => ({ draft_id: draft.id, category_name: category })));
			if (error) throw error;
		}
		draft.categories = selected;
		showMessage(`Categories saved for “${draft.title}”.`);
		renderDrafts();
		return true;
	} catch {
		showMessage(genericError, true);
		return false;
	}
}

async function loadAdminData() {
	if (!client) throw new Error('Unavailable');
	const { data: admin, error: adminError } = await client.rpc('is_admin');
	if (adminError || !admin) throw new Error('Unauthorized');
	const { data: categoryRows, error: categoryError } = await client.from('categories').select('name').order('name');
	const { data: draftRows, error: draftError } = await client
		.from('drafts')
		.select('id,title,author,updated_at,draft_categories(category_name)')
		.order('updated_at', { ascending: false });
	if (categoryError || draftError) throw categoryError ?? draftError;
	categories = (categoryRows ?? []).map((row) => row.name);
	drafts = (draftRows ?? []).map((row) => ({
		id: row.id,
		title: row.title,
		author: row.author,
		updated_at: row.updated_at,
		categories: row.draft_categories.map((category) => category.category_name),
	}));
	loginForm?.setAttribute('hidden', '');
	adminApp?.removeAttribute('hidden');
	window.history.replaceState(null, '', '/admin/#dashboard');
	renderFilters();
	renderDrafts();
}

loginForm?.addEventListener('submit', async (event) => {
	event.preventDefault();
	const submit = loginForm.querySelector<HTMLButtonElement>('button[type="submit"]');
	submit?.setAttribute('disabled', '');
	showMessage('');
	try {
		if (!client) throw new Error('Unavailable');
		const email = document.querySelector<HTMLInputElement>('#email')?.value ?? '';
		const password = document.querySelector<HTMLInputElement>('#password')?.value ?? '';
		const { data, error } = await client.auth.signInWithPassword({ email, password });
		if (error || !data.user) throw new Error('Sign-in failed');
		user = data.user;
		await loadAdminData();
	} catch {
		showMessage(genericError, true);
	} finally {
		submit?.removeAttribute('disabled');
	}
});

document.querySelector('#sign-out')?.addEventListener('click', async () => {
	await client?.auth.signOut();
	window.location.reload();
});
search?.addEventListener('input', renderDrafts);
categoryFilter?.addEventListener('change', renderDrafts);
document.querySelector<HTMLFormElement>('#new-category-form')?.addEventListener('submit', async (event) => {
	event.preventDefault();
	if (!client || !user || !newCategoryDraft) return;
	const input = document.querySelector<HTMLInputElement>('#new-category-name');
	if (!input) return;
	try {
		const name = normalizeCategoryName(input.value);
		if (categories.some((category) => category.toLocaleLowerCase() === name.toLocaleLowerCase())) {
			throw new Error('Duplicate');
		}
		const { error } = await client.from('categories').insert({ name });
		if (error) throw error;
		categories = addCategory(categories, name);
		const draft = drafts.find((item) => item.id === newCategoryDraft.value);
		if (!draft) throw new Error('Missing draft');
		draft.categories = [...draft.categories, name];
		if (!(await saveDraft(draft, draft.categories))) return;
		input.value = '';
		renderFilters();
		renderDrafts();
	} catch {
		showMessage(genericError, true);
	}
});

void (async () => {
	if (!client) return;
	try {
		const { data } = await client.auth.getUser();
		user = data.user;
		if (user) await loadAdminData();
	} catch {
		showMessage(genericError, true);
	}
})();
