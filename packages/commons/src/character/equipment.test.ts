import { describe, it, expect } from 'vitest';
import {
	ArcaneComponentMode,
	BASIC_EQUIPMENT,
	BasicEquipmentType,
	Equipment,
	Item,
	PrimaryWeaponType,
	SlotType,
	WeaponMode,
} from './equipment';
import { Bonus, Distance } from '../stats/value';
import { Resource, ResourceCost } from '../stats/resources';
import { ArcaneSpellComponentType } from '../core/arcane';
import { Trait } from '../core/traits';

describe('equipment serialization and rehydration', () => {
	it('simple weapons can be serialized and de-serialized', () => {
		const simpleAxe = WeaponMode.simple({
			name: 'Simple Axe',
			type: PrimaryWeaponType.LightMelee,
			bonus: Bonus.of(2),
		});

		const equipment = new Equipment([simpleAxe]);
		const prop = equipment.toProp();

		const rehydratedAxe = Equipment.from(prop).items[0]!;
		expect(rehydratedAxe).toEqual(simpleAxe);
	});

	it('basic equipment definitions roundtrip through serialization', () => {
		const items = Object.values(BASIC_EQUIPMENT).map(definition => definition.generator());
		const equipment = new Equipment(items);
		const prop = equipment.toProp();

		const rehydrated = Equipment.from(prop).items;
		expect(rehydrated).toEqual(items);
	});

	it('multi-mode weapons retain their class instances after roundtrip', () => {
		const hatchet = BASIC_EQUIPMENT[BasicEquipmentType.Hatchet].generator();
		const equipment = new Equipment([hatchet]);
		const prop = equipment.toProp();

		const [rehydratedHatchet] = Equipment.from(prop).items;
		const lightMode = rehydratedHatchet!.modes[0]! as WeaponMode;
		const thrownMode = rehydratedHatchet!.modes[1]! as WeaponMode;
		expect(lightMode).toBeInstanceOf(WeaponMode);
		expect(lightMode.bonus).toBeInstanceOf(Bonus);
		expect(lightMode.range).toBeInstanceOf(Distance);
		expect(thrownMode).toBeInstanceOf(WeaponMode);
		expect(thrownMode.range.value).toBe(3);
	});

	it('arcane foci preserve nested costs, traits, and bonuses', () => {
		const focus = new Item({
			name: 'Custom Focus',
			slot: SlotType.TwoHands,
			traits: [Trait.TwoHanded],
			modes: [
				new ArcaneComponentMode({
					category: 'Special Focus',
					component: ArcaneSpellComponentType.Focal,
					bonus: Bonus.of(4),
					costs: [
						new ResourceCost({
							resource: Resource.SpiritPoint,
							amount: 2,
							variable: true,
						}),
					],
				}),
			],
		});
		const equipment = new Equipment([focus]);
		const prop = equipment.toProp();

		const [rehydratedFocus] = Equipment.from(prop).items;
		expect(rehydratedFocus).toBeDefined();
		expect(rehydratedFocus!.traits).toEqual([Trait.TwoHanded]);
		const rehydratedMode = rehydratedFocus!.modes[0]! as ArcaneComponentMode;
		expect(rehydratedMode).toBeInstanceOf(ArcaneComponentMode);
		expect(rehydratedMode.bonus).toBeInstanceOf(Bonus);
		const modeCost = rehydratedMode.costs[0]!;
		expect(modeCost).toBeInstanceOf(ResourceCost);
		expect(modeCost).toEqual((focus.modes[0]! as ArcaneComponentMode).costs[0]!);
	});

	it('full basic equipment list survives a roundtrip', () => {
		const items = Object.values(BASIC_EQUIPMENT).map(definition => definition.generator());
		const equipment = new Equipment(items);
		const serialized = equipment.toProp();

		const roundTrip = Equipment.from(serialized);
		expect(roundTrip.items).toEqual(items);
	});

	it('equipped and non-equipped items are preserved through serialization', () => {
		const sword = BASIC_EQUIPMENT[BasicEquipmentType.Longsword].generator();
		sword.isEquipped = true;
		const shield = BASIC_EQUIPMENT[BasicEquipmentType.SmallShield].generator();
		shield.isEquipped = false;

		const equipment = new Equipment([sword, shield]);
		const prop = equipment.toProp();

		const [rehydratedSword, rehydratedShield] = Equipment.from(prop).items;
		expect(rehydratedSword!.isEquipped).toBe(true);
		expect(rehydratedShield!.isEquipped).toBe(false);
	});
});
