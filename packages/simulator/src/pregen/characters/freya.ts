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
	primaryRace: Race.Dwarf,
	upbringing: Upbringing.Tribal,
	upbringingPlusModifier: StatType.DIV,
	upbringingMinusModifier: StatType.LCK,
});

const characterClass = new ClassInfo({
	characterClass: CharacterClass.Paladin,
});

export const Freya = new CharacterSheet({
	name: 'Freya Goldbraid',
	race,
	characterClass,
	feats: CharacterFeats.from(
		{
			'feat.1.Minor.0': 'ToolProficiency#Musical Instrument',
			'feat.2.Major.0': 'FocusedReach',
			'feat.3.Minor.0': 'MoralAuthority',
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
		item(BasicEquipmentType.LeatherArmor, { isEquipped: true }),
		item(BasicEquipmentType.Longsword, { isEquipped: true, name: 'Sword of Ithil' }),
		item(BasicEquipmentType.Dagger, { isEquipped: false }),
	]),
	circumstances: Circumstances.empty(),
	personality: new Personality({
		calling: undefined,
		vice: 'Judgmental; she too quickly deems others unworthy, and slow to update her views.',
		aversion: 'Deception and trickery.',
		tenet: '"Honor is the forge that tempers the soul."',
		leanings: 'Stoic, Honorable, Protective, Disciplined',
		protean: undefined,
		backstory: undefined,
	}),
});
