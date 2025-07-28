import { CLASS_DEFINITIONS } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

export const classes = Object.values(CLASS_DEFINITIONS).map(def => {
	const slug = slugify(def.name);
	return {
		// wiki parameters
		group: 'Class',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: def.description,
		metadata: [],

		// other parameters
		name: def.name,
		realm: def.realm,
		primaryAttribute: def.primaryAttribute,
		role: def.role,
		flavor: def.flavor,
	};
});
