import { slugify } from '@shattered-wilds/commons';
import { COVER_TYPES } from '@shattered-wilds/d12';

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
