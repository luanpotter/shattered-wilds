import { COVER_TYPES, slugify } from '@shattered-wilds/commons';

export const covers = Object.values(COVER_TYPES).map(def => {
	const slug = `Cover_${slugify(def.type)}`;
	return {
		// wiki parameters
		group: 'Cover',
		groupSlug: 'Cover',
		slug,
		title: `Passive Cover - ${def.type}`,
		url: `/wiki/${slug}/`,
		content: `${def.bonus.description} (${def.examples})`,
		order: -def.bonus.value,
	};
});
