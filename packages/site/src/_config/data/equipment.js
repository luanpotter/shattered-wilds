import { BASIC_EQUIPMENT, Weapon, Armor, Shield } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

const computeType = item => {
	if (item instanceof Weapon) {
		return 'Weapon';
	}
	if (item instanceof Armor) {
		return 'Armor';
	}
	if (item instanceof Shield) {
		return 'Shield';
	}
	return 'Other';
};

export const equipment = Object.values(BASIC_EQUIPMENT).map(def => {
	const item = def.generator();
	const slug = slugify(item.name);

	const type = computeType(item);
	return {
		// wiki parameters
		group: 'Equipment',
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

		// other data
		type,
		traits: item.traits,
		alternativeNames: def.alternativeNames,
		modes: item.modes?.map(mode => ({ ...mode, description: mode.description })),
	};
});
