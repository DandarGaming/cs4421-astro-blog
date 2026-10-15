export function getTopicSlug(topic: string): string {
	const trimmedTopic = topic.trim();
	const slug = trimmedTopic
		.normalize('NFKD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^\p{Letter}\p{Number}]+/gu, '-')
		.replace(/^-|-$/g, '');

	return slug || `topic-${Array.from(trimmedTopic, (character) => character.codePointAt(0)?.toString(16) ?? '0').join('-')}`;
}
