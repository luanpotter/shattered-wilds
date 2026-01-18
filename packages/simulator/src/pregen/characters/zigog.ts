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
	primaryRace: Race.Orc,
	upbringing: Upbringing.Nomadic,
	upbringingPlusModifier: StatType.CHA,
	upbringingMinusModifier: StatType.WIS,
});
const characterClass = new ClassInfo({
	characterClass: CharacterClass.Swashbuckler,
});

export const Zigog = new CharacterSheet({
	name: 'Zigog Il-kat',
	race,
	characterClass,
	feats: CharacterFeats.from(
		{
			'feat.1.Minor.0': 'ToolProficiency#Thieves Tools',
			'feat.2.Major.0': 'OpportunityWindow',
			'feat.3.Minor.0': 'BeginnersLuck',
		},
		race,
		characterClass,
	),
	attributeRoot: StatTree.buildRootNode({
		Level: '3',
		Body: '2',
		STR: '1',
	}),
	equipment: new Equipment([
		item(BasicEquipmentType.Chainmail, { isEquipped: true }),
		item(BasicEquipmentType.Longsword, { isEquipped: true }),
		item(BasicEquipmentType.Dagger, { isEquipped: false }),
	]),
	circumstances: Circumstances.empty(),
	personality: new Personality({
		calling: undefined,
		vice: `Gambling, bets, taking risks - if the reward is high enough, the consequences don't matter.`,
		aversion: 'Cowardice in himself or others disgusts him.',
		tenet: 'Complete freedom is the most important thing.',
		leanings: 'Fiery, Playful, Daring, Opportunistic',
		protean: undefined,
		backstory: undefined,
	}),
});
