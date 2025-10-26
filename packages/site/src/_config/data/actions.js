import { ACTIONS, RESOURCES, Resource, slugify } from '@shattered-wilds/commons';

export const actions = Object.values(ACTIONS).map(def => {
	const slug = slugify(def.name);
	const addCostMetadata = (resource, force) => {
		const cost = def.costs.find(c => c.resource === resource);
		const amount = cost?.amount ?? 0;
		if (amount === 0 && !force) {
			return undefined;
		}

		return {
			key: resource,
			title: RESOURCES[resource].shortCode,
			value: cost.variable ? `${amount}+` : amount,
			cssClass: `metadata-cost`,
		};
	};
	return {
		// wiki parameters
		group: 'Action',
		groupSlug: 'Actions',
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
			...def.traits.map(trait => ({
				key: slugify(trait),
				title: trait,
				value: undefined,
				cssClass: 'metadata-trait',
			})),
			addCostMetadata(Resource.ActionPoint, true),
			addCostMetadata(Resource.FocusPoint, false),
			addCostMetadata(Resource.SpiritPoint, false),
			addCostMetadata(Resource.VitalityPoint, false),
			addCostMetadata(Resource.HeroismPoint, false),
		].filter(Boolean),

		// other data
		type: def.type,
		traits: def.traits,
	};
});
