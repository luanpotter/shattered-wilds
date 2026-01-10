import { slugify } from '@shattered-wilds/commons';
import { RESOURCES } from '@shattered-wilds/d12';

export const resources = Object.values(RESOURCES).map(resource => {
	const slug = slugify(resource.fullName);
	return {
		// wiki parameters
		group: 'Resource',
		groupSlug: 'Resource',
		slug,
		title: resource.fullName,
		url: `/wiki/${slug}/`,
		content: resource.description,
		metadata: [],

		// other parameters
		name: resource.fullName,
		description: resource.description,
		formula: resource.formula,
	};
});
