import { ARCANE_SCHOOLS, slugify } from '@shattered-wilds/commons';

export const schools = Object.values(ARCANE_SCHOOLS).map(def => {
	const slug = `${slugify(def.name)}`;
	return {
		// wiki parameters
		group: 'Arcane_Schools',
		groupSlug: 'Arcane_Schools',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: `${def.description}`,
	};
});
