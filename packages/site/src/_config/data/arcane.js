import { PREDEFINED_ARCANE_SPELLS } from '@shattered-wilds/commons';
import { slugify } from '../utils.js';

export const predefinedArcaneSpells = Object.values(PREDEFINED_ARCANE_SPELLS).map((def, idx) => {
	const slug = `${slugify(def.name)}`;
	return {
		// wiki parameters
		group: 'Predefined_Arcane_Spells',
		slug,
		title: `${def.name}`,
		url: `/wiki/${slug}/`,
		content: `${def.description}`,
		order: idx,
		metadata: [
			{
				key: 'school',
				title: 'School',
				value: def.school,
				cssClass: 'metadata-school',
			},
			...def.traits.map(trait => ({
				key: trait.replace(' ', '_'),
				title: trait,
				value: undefined,
				cssClass: 'metadata-trait',
			})),
		],

		// other parameters
		school: def.school,
		augmentations: def.augmentations.map(augmentation => ({
			...augmentation,
			description: augmentation.description,
		})),
		traits: def.traits,
	};
});
