import { CONSEQUENCES, slugify } from '@shattered-wilds/commons';

export const consequences = Object.values(CONSEQUENCES).map(def => {
	const slug = `${slugify(def.name)}`;
	return {
		// wiki parameters
		group: 'Consequence',
		groupSlug: 'Consequence',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: `${def.description}`,
	};
});
