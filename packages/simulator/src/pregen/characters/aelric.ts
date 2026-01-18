import {
	BasicEquipmentType,
	Bonus,
	CharacterClass,
	CharacterFeats,
	CharacterSheet,
	Circumstances,
	ClassInfo,
	Distance,
	Equipment,
	Personality,
	PrimaryWeaponType,
	Race,
	RaceInfo,
	StatTree,
	StatType,
	Trait,
	Upbringing,
	WeaponMode,
} from '@shattered-wilds/d12';

import { ItemBuilder } from './items';

const { item } = ItemBuilder;

const race = new RaceInfo({
	primaryRace: Race.Fey,
	upbringing: Upbringing.Tribal,
	upbringingPlusModifier: StatType.LCK,
	upbringingMinusModifier: StatType.FOW,
});

const characterClass = new ClassInfo({
	characterClass: CharacterClass.Wanderer,
});

const bo = WeaponMode.simple({
	name: 'Bō',
	type: PrimaryWeaponType.HeavyMelee,
	bonus: Bonus.of(4),
	range: Distance.of(2),
	traits: [Trait.Polearm],
});

export const Aelric = new CharacterSheet({
	name: 'Aelric Mistsong',
	race,
	characterClass,
	feats: CharacterFeats.from(
		{
			'feat.1.Minor.0': 'UnreliableMemory',
			'feat.2.Major.0': 'LesserDivineChanneling',
			'feat.3.Minor.0': 'LuckyRelentlessness',
		},
		race,
		characterClass,
	),
	attributeRoot: StatTree.buildRootNode({
		Level: '3',
		Soul: '2',
		LCK: '1',
	}),
	equipment: new Equipment([
		item(BasicEquipmentType.LeatherArmor, { isEquipped: true }),
		bo,
		item(BasicEquipmentType.Dagger, { isEquipped: false }),
	]),
	circumstances: Circumstances.empty(),
	personality: new Personality({
		calling: undefined,
		vice: 'Daydreaming, drifting into reveries at the worst moments, thinking about hypotheticals that never will be.',
		aversion: 'People (or himself) breaking their word.',
		tenet: `"A man's word is the only thing they can truly have."`,
		leanings: 'Serene, Intuitive, Romantic, Fickle',
		protean: undefined,
		backstory: undefined,
	}),
});
