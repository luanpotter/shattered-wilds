import { RESOURCES, slugify } from '@shattered-wilds/commons';

export const resources = Object.values(RESOURCES).map(resource => {
	const slug = slugify(resource.name);
	return {
		// wiki parameters
		group: 'Resource',
		slug,
		title: resource.name,
		url: `/wiki/${slug}/`,
		content: resource.description,
		metadata: [],

		// other parameters
		name: resource.name,
		description: resource.description,
		formula: resource.formula,
	};
});
