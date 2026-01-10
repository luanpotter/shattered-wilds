import { slugify } from '@shattered-wilds/commons';
import { DERIVED_STATS } from '@shattered-wilds/d12';

export const derivedStats = Object.values(DERIVED_STATS).map(stat => {
	const slug = slugify(stat.name);
	return {
		// wiki parameters
		group: 'Derived_Stat',
		groupSlug: 'Derived_Stat',
		slug,
		title: stat.name,
		url: `/wiki/${slug}/`,
		content: stat.description,
		metadata: [],

		// other parameters
		name: stat.name,
		description: stat.description,
		formula: stat.formula,
	};
});
