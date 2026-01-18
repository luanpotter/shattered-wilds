import {
	BasicEquipmentType,
	Bonus,
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
	primaryRace: Race.Dwarf,
	upbringing: Upbringing.Telluric,
	upbringingPlusModifier: StatType.LCK,
	upbringingMinusModifier: StatType.INT,
});
const characterClass = new ClassInfo({
	characterClass: CharacterClass.Barbarian,
});

export const Hank = new CharacterSheet({
	name: 'Hank Blackhammer',
	race,
	characterClass,
	feats: CharacterFeats.from(
		{
			'feat.1.Minor.0': 'TradeSpecialization#Blacksmith',
			'feat.2.Major.0': 'BulkyFrame',
			'feat.3.Minor.0': 'ArmorFamiliarity',
		},
		race,
		characterClass,
	),
	attributeRoot: StatTree.buildRootNode({
		Level: '3',
		Body: '2',
		CON: '1',
	}),
	equipment: new Equipment([
		item(BasicEquipmentType.FullPlate, {
			isEquipped: true,
			name: 'Full Plate [Armor Familiarity] [Tough Skin +2]',
			armorMode: { bonus: Bonus.of(2), dexPenalty: Bonus.of(1) },
		}),
		item(BasicEquipmentType.Longsword, {
			isEquipped: true,
			name: 'Dwarven Hammer',
		}),
	]),
	circumstances: Circumstances.empty(),
	personality: new Personality({
		calling: undefined,
		vice: 'Alcohol; he drinks to forget the past.',
		aversion: 'Having to show obedience or fealty; he despises being ordered around.',
		tenet: '"Stand your ground, even when it shatters beneath you."',
		leanings: 'Blunt, Loyal, Resolute, Melancholic',
		protean: undefined,
		backstory: undefined,
	}),
});
