import { BASIC_EQUIPMENT, Weapon, Armor, Shield } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

export const equipment = Object.values(BASIC_EQUIPMENT).map(def => {
	const item = def.generator();
	const slug = slugify(item.name);

	const computeType = () => {
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
				value: computeType(),
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
		type: item.type,
		traits: item.traits,
		alternativeNames: def.alternativeNames,
	};
});
