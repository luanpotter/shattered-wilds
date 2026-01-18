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
	upbringingPlusModifier: StatType.DIV,
	upbringingMinusModifier: StatType.INT,
});

const characterClass = new ClassInfo({
	characterClass: CharacterClass.Cleric,
});

export const Cedric = new CharacterSheet({
	name: 'Cedric deVale',
	race,
	characterClass,
	feats: CharacterFeats.from(
		{
			'feat.1.Minor.0': `ToolProficiency#Healer's Kit`,
			'feat.1.Minor.1': 'TradeSpecialization#Chandler',
			'feat.1.Minor.2': 'SavvyBarterer',
			'feat.2.Major.0': 'SacredCalm',
			'feat.3.Minor.0': 'ReligiousRites',
		},
		race,
		characterClass,
	),
	attributeRoot: StatTree.buildRootNode({
		Level: '3',
		Soul: '2',
		DIV: '1',
	}),
	equipment: new Equipment([
		item(BasicEquipmentType.Chainmail, { isEquipped: true }),
		item(BasicEquipmentType.Dagger, { isEquipped: true, name: 'Side-Stabber [1SP: +2 Attack]' }),
		item(BasicEquipmentType.SmallShield, { isEquipped: true, name: 'Holly Shield' }),
	]),
	circumstances: Circumstances.empty(),
	personality: new Personality({
		calling: undefined,
		vice: 'He takes on every burden himself, even when it is too much.',
		aversion: 'Letting others suffer in his stead, or because of his mistakes.',
		tenet: '"Mercy is not weakness; it is a gift to oneself."',
		leanings: 'Compassionate, Patient, Idealistic, Pious',
		protean: undefined,
		backstory: undefined,
	}),
});
