import { slugify } from '@shattered-wilds/commons';
import { UPBRINGING_DEFINITIONS } from '@shattered-wilds/d12';

export const upbringings = Object.values(UPBRINGING_DEFINITIONS).map(def => {
	const slug = slugify(def.name);
	return {
		// wiki parameters
		group: 'Upbringings',
		groupSlug: 'Upbringings',
		globalDataKey: 'upbringings',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: def.description,
	};
});
