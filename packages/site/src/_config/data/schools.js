import { slugify } from '@shattered-wilds/commons';
import { ARCANE_SCHOOLS } from '@shattered-wilds/d12';

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
