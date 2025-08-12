import { CONDITIONS } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

export const conditions = Object.values(CONDITIONS).map(def => {
	const slug = `${slugify(def.name)}`;
	return {
		// wiki parameters
		group: 'Condition',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: `${def.description}`,
	};
});
