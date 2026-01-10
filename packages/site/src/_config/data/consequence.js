import { slugify } from '@shattered-wilds/commons';
import { CONSEQUENCES } from '@shattered-wilds/d12';

export const consequences = Object.values(CONSEQUENCES).map(def => {
	const slug = `${slugify(def.name)}`;
	return {
		// wiki parameters
		group: 'Consequence',
		groupSlug: 'Consequence',
		globalDataKey: 'consequences',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: `${def.description}`,
	};
});
