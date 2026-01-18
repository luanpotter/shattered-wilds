import {
	BasicEquipmentType,
	CharacterClass,
	CharacterFeats,
	CharacterSheet,
	Circumstances,
	ClassInfo,
	Equipment,
	Personality,
	Race,
	RaceInfo,
	StatTree,
	StatType,
	Upbringing,
} from '@shattered-wilds/d12';

import { ItemBuilder } from './items';

const { item } = ItemBuilder;

const race = new RaceInfo({
	primaryRace: Race.Goliath,
	upbringing: Upbringing.Nomadic,
	upbringingPlusModifier: StatType.CHA,
	upbringingMinusModifier: StatType.DIV,
});

const characterClass = new ClassInfo({
	characterClass: CharacterClass.Bard,
});

export const Yornna = new CharacterSheet({
	name: 'Yornna Stormpeak',
	race,
	characterClass,
	feats: CharacterFeats.from(
		{
			'feat.1.Minor.0': 'ToolProficiency#Musical Instrument',
			'feat.2.Major.0': 'InspiringPerformance',
			'feat.3.Minor.0': 'TheresMoreToThisSong',
		},
		race,
		characterClass,
	),
	attributeRoot: StatTree.buildRootNode({
		Level: '3',
		Mind: '2',
		CHA: '1',
	}),
	equipment: new Equipment([
		item(BasicEquipmentType.LeatherArmor, { isEquipped: true }),
		item(BasicEquipmentType.Mace, { isEquipped: true, name: 'Morningstar' }),
		item(BasicEquipmentType.Ocarina, { isEquipped: true, name: 'Horn' }),
		item(BasicEquipmentType.Dagger, { isEquipped: false }),
	]),
	circumstances: Circumstances.empty(),
	personality: new Personality({
		calling: undefined,
		vice: 'Her desire for attention. She craves an audience, even at the worst times.',
		aversion: 'Silence during celebrations; people being reticent when they should speak up.',
		tenet: '"A story untold is a life not lived."',
		leanings: 'Fiery, Charming, Daring, Extravagant',
		protean: undefined,
		backstory: undefined,
	}),
});
