import { UPBRINGING_DEFINITIONS, slugify } from '@shattered-wilds/commons';

export const upbringings = Object.values(UPBRINGING_DEFINITIONS).map(def => {
	const slug = slugify(def.name);
	return {
		// wiki parameters
		group: 'Upbringings',
		groupSlug: 'Upbringings',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: def.description,
	};
});
