import { TRAITS, slugify } from '@shattered-wilds/commons';

export const traits = Object.values(TRAITS).map(def => {
	const slug = slugify(def.name);
	return {
		// wiki parameters
		group: 'Trait',
		groupSlug: 'Trait',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: def.description,
		metadata: [
			{
				key: def.target,
				title: def.target,
				value: undefined,
				cssClass: `metadata-trait`,
			},
		],

		// other data
		target: def.target,
	};
});
