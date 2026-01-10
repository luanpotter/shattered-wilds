import { slugify } from '@shattered-wilds/commons';
import { CONDITIONS } from '@shattered-wilds/d12';

export const conditions = Object.values(CONDITIONS).map(def => {
	const slug = `${slugify(def.name)}`;
	return {
		// wiki parameters
		group: 'Condition',
		groupSlug: 'Condition',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: `${def.description}`,
	};
});
