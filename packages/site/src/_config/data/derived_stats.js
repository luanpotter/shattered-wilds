import { DERIVED_STATS, slugify } from '@shattered-wilds/commons';

export const derivedStats = Object.values(DERIVED_STATS).map(stat => {
	const slug = slugify(stat.name);
	return {
		// wiki parameters
		group: 'Derived_Stat',
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
