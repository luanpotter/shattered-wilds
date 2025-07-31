import { TRAITS } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

export const traits = Object.values(TRAITS).map(def => {
	const slug = slugify(def.name);
	return {
		// wiki parameters
		group: 'Trait',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: def.description,
	};
});
