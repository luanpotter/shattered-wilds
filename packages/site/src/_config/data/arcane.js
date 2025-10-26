import { PREDEFINED_ARCANE_SPELLS, slugify } from '@shattered-wilds/commons';

export const predefinedArcaneSpells = Object.values(PREDEFINED_ARCANE_SPELLS).map((def, idx) => {
	const slug = `${slugify(def.name)}`;

	const combinedModifier = def.augmentations.reduce((acc, augmentation) => acc + augmentation.bonus.value, 0);
	const hasVariableModifier = def.augmentations.some(augmentation => augmentation.variable);

	return {
		// wiki parameters
		group: 'Predefined_Arcane_Spells',
		groupSlug: 'Predefined_Arcane_Spells',
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
			{
				key: 'modifier',
				title: 'CM',
				value: `${-combinedModifier}${hasVariableModifier ? '+' : ''}`,
				cssClass: 'metadata-cost',
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
