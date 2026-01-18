import {
	ArcaneComponentMode,
	ArcaneSpellComponentType,
	BasicEquipmentType,
	Bonus,
	CharacterClass,
	CharacterFeats,
	CharacterSheet,
	Circumstances,
	ClassInfo,
	Distance,
	Equipment,
	Item,
	Personality,
	PrimaryWeaponType,
	Race,
	RaceInfo,
	Resource,
	ResourceCost,
	SlotType,
	StatTree,
	StatType,
	Trait,
	Upbringing,
	WeaponMode,
} from '@shattered-wilds/d12';

import { ItemBuilder } from './items';

const { item } = ItemBuilder;

const race = new RaceInfo({
	primaryRace: Race.Goblin,
	upbringing: Upbringing.Sylvan,
	upbringingPlusModifier: StatType.WIS,
	upbringingMinusModifier: StatType.CHA,
});

const characterClass = new ClassInfo({
	characterClass: CharacterClass.Druid,
});

const druidicStaff = new Item({
	name: 'Druidic Staff',
	slot: SlotType.TwoHands,
	isEquipped: true,
	traits: [Trait.TwoHanded],
	modes: [
		new WeaponMode({
			type: PrimaryWeaponType.LightMelee,
			bonus: Bonus.of(4),
			range: Distance.melee(),
			costs: [],
		}),
		new ArcaneComponentMode({
			category: 'Focus',
			component: ArcaneSpellComponentType.Focal,
			bonus: Bonus.of(4),
			costs: [new ResourceCost({ resource: Resource.SpiritPoint, amount: 1 })],
		}),
	],
});

export const Bikk = new CharacterSheet({
	name: 'Bikk Rattlefix',
	race,
	characterClass,
	feats: CharacterFeats.from(
		{
			'feat.1.Minor.0': "ToolProficiency#Healer's Kit",
			'feat.2.Major.0': 'NaturalAffinity',
			'feat.3.Minor.0': 'InstinctiveTracking',
		},
		race,
		characterClass,
	),
	attributeRoot: StatTree.buildRootNode({
		Level: '3',
		Mind: '2',
		WIS: '1',
	}),
	equipment: new Equipment([
		item(BasicEquipmentType.LeatherArmor, { isEquipped: true, name: 'Leather Robes' }),
		druidicStaff,
		item(BasicEquipmentType.BowAndArrows, { isEquipped: false }),
		item(BasicEquipmentType.Dagger, { isEquipped: false }),
	]),
	circumstances: Circumstances.empty(),
	personality: new Personality({
		calling: undefined,
		vice: 'Hoarding shiny trinkets and oddities, or sticks with unique shapes.',
		aversion: 'Urban life and tight spaces.',
		tenet: 'Nature shall reclaim all - even us.',
		leanings: 'Playful, Curious, Chaotic, Compassionate',
		protean: undefined,
		backstory: undefined,
	}),
});
