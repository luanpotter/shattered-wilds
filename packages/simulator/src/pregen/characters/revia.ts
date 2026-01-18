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
	primaryRace: Race.Elf,
	upbringing: Upbringing.Sylvan,
	upbringingPlusModifier: StatType.LCK,
	upbringingMinusModifier: StatType.DIV,
});
const characterClass = new ClassInfo({
	characterClass: CharacterClass.Marksman,
});

export const Revia = new CharacterSheet({
	name: 'Revia Moonlarn',
	race,
	characterClass,
	feats: CharacterFeats.from(
		{
			'feat.1.Minor.0': 'ToolProficiency#Climbing Gear',
			'feat.2.Major.0': 'PinningShot',
			'feat.3.Minor.0': 'WeaponHoning',
		},
		race,
		characterClass,
	),
	attributeRoot: StatTree.buildRootNode({
		Level: '3',
		Body: '2',
		DEX: '1',
	}),
	equipment: new Equipment([
		item(BasicEquipmentType.LeatherArmor, { isEquipped: true }),
		item(BasicEquipmentType.BowAndArrows, {
			isEquipped: true,
			name: 'Bow & Arrows [Honed]',
			weaponMode: { bonus: Bonus.of(1) },
		}),
		item(BasicEquipmentType.Rapier, { isEquipped: false }),
		item(BasicEquipmentType.Dagger, { isEquipped: false }),
	]),
	circumstances: Circumstances.empty(),
	personality: new Personality({
		calling: undefined,
		vice: 'Pride; she cannot resist proving her skill with a bow.',
		aversion: 'Accepting from others help she deems unearned.',
		tenet: '"Precision is a virtue; every arrow shall have a purpose."',
		leanings: 'Stoic, Serene, Honorable, Methodical',
		protean: undefined,
		backstory: undefined,
	}),
});
