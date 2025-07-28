import { ACTIONS, ActionCostResource } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

export const actions = Object.values(ACTIONS).map(def => {
	const slug = slugify(def.name);
	const addCostMetadata = (resource, name, force) => {
		const key = name.toLowerCase();
		const value = def.costs.find(c => c.resource === resource)?.amount ?? 0;
		if (value === 0 && !force) {
			return undefined;
		}

		return {
			key,
			title: name,
			value,
			cssClass: `metadata-cost`,
		};
	};
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
			addCostMetadata(ActionCostResource.ActionPoint, 'AP', true),
			addCostMetadata(ActionCostResource.FocusPoint, 'FP', false),
			addCostMetadata(ActionCostResource.SpiritPoint, 'SP', false),
			addCostMetadata(ActionCostResource.VitalityPoint, 'VP', false),
			addCostMetadata(ActionCostResource.HeroismPoint, 'HP', false),
		].filter(Boolean),
	};
});
