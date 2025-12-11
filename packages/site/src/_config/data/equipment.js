import { BASIC_EQUIPMENT, getItemType, MODE_TYPE_LABELS, slugify } from '@shattered-wilds/commons';

const computeTypeLabel = item => {
	const itemType = getItemType(item);
	return itemType ? MODE_TYPE_LABELS[itemType] : 'Other';
};

export const equipment = Object.values(BASIC_EQUIPMENT).map(def => {
	const item = def.generator();
	const slug = slugify(item.name);

	const type = computeTypeLabel(item);
	const bonusForSorting = item.modes.length > 0 ? Math.min(...item.modes.map(mode => mode.bonus.value)) : 0;
	return {
		// wiki parameters
		group: 'Equipment',
		groupSlug: 'Equipment',
		slug,
		title: `${item.name}`,
		url: `/wiki/${slug}/`,
		content: item.description,
		metadata: [
			{
				key: 'type',
				title: 'Type',
				value: type,
				cssClass: 'metadata-type',
			},
			...item.traits.map(trait => ({
				key: trait,
				title: trait,
				value: undefined,
				cssClass: 'metadata-trait',
			})),
		].filter(Boolean),
		order: bonusForSorting,

		// other data
		type,
		traits: item.traits,
		alternativeNames: def.alternativeNames,
		modes: item.modes.map(mode => ({ description: mode.description })),
	};
});
