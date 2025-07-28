import { ACTIONS, ActionCostResource } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

export const actions = Object.values(ACTIONS).map(def => {
	const slug = slugify(def.name);
	return {
		// wiki parameters
		group: 'Action',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: def.description,
		metadata: [
			{
				key: 'type',
				title: 'Type',
				value: def.type,
				cssClass: 'metadata-type',
			},
			{
				key: 'ap',
				title: 'AP',
				value: def.costs.find(c => c.resource === ActionCostResource.ActionPoint)?.amount ?? 0,
				cssClass: 'metadata-ap',
			},
		],
	};
});
