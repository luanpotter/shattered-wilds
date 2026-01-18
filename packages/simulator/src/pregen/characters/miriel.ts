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
	primaryRace: Race.Human,
	upbringing: Upbringing.Urban,
	upbringingPlusModifier: StatType.INT,
	upbringingMinusModifier: StatType.CHA,
});

const characterClass = new ClassInfo({
	characterClass: CharacterClass.Wizard,
});

export const Miriel = new CharacterSheet({
	name: 'Miriel Starweaver',
	race,
	characterClass,
	feats: CharacterFeats.from(
		{
			'feat.1.Minor.0': 'Numberphile',
			'feat.1.Minor.1': 'LipReading',
			'feat.1.Minor.2': 'TradeSpecialization#Cartographer',
			'feat.2.Major.0': 'ReactiveCasting',
			'feat.3.Minor.0': 'CantripCasting',
		},
		race,
		characterClass,
	),
	attributeRoot: StatTree.buildRootNode({
		Level: '3',
		Mind: '2',
		INT: '1',
	}),
	equipment: new Equipment([
		item(BasicEquipmentType.LeatherArmor, { isEquipped: true }),
		item(BasicEquipmentType.Wand, { isEquipped: true }),
		item(BasicEquipmentType.Rapier, { isEquipped: false }),
		item(BasicEquipmentType.BowAndArrows, { isEquipped: false }),
	]),
	circumstances: Circumstances.empty(),
	personality: new Personality({
		calling: undefined,
		vice: 'Obsession, specially with regard to studying. Once she puts something on her head, she will see it through.',
		aversion: 'Destroying knowledge, burning books. Information is sacred.',
		tenet: '"Seek the truth, even if it hurts."',
		leanings: 'Curious, Idealistic, Patient, Aloof',
		protean: undefined,
		backstory: undefined,
	}),
});
