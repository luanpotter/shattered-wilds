import { Bonus, Distance, StatType, Trait } from '@shattered-wilds/commons';

export enum PrimaryWeaponType {
	Unarmed = 'Unarmed',
	Thrown = 'Thrown',
	LightMelee = 'Light Melee',
	Ranged = 'Ranged',
	HeavyMelee = 'Heavy Melee',
}

export const PRIMARY_WEAPON_TYPES: Record<PrimaryWeaponType, StatType> = {
	[PrimaryWeaponType.Unarmed]: StatType.STR,
	[PrimaryWeaponType.Thrown]: StatType.STR,
	[PrimaryWeaponType.LightMelee]: StatType.STR,
	[PrimaryWeaponType.Ranged]: StatType.DEX,
	[PrimaryWeaponType.HeavyMelee]: StatType.STR,
};

export enum ArmorType {
	LightArmor = 'Light Armor',
	MediumArmor = 'Medium Armor',
	HeavyArmor = 'Heavy Armor',
}

export enum ShieldType {
	SmallShield = 'Small Shield',
	LargeShield = 'Large Shield',
}

export interface Item {
	name: string;
	traits: Trait[];
}

export class WeaponMode {
	type: PrimaryWeaponType;
	bonus: Bonus;
	range: Distance;

	constructor({ type, bonus, range }: { type: PrimaryWeaponType; bonus: Bonus; range?: Distance | undefined }) {
		this.type = type;
		this.bonus = bonus;
		this.range = range ?? Distance.of(1);
	}

	get statType(): StatType {
		return PRIMARY_WEAPON_TYPES[this.type];
	}
}

export class Weapon implements Item {
	name: string;
	modes: WeaponMode[];
	traits: Trait[];

	constructor({ name, modes, traits = [] }: { name: string; modes: WeaponMode[]; traits?: Trait[] }) {
		this.name = name;
		this.modes = modes;
		this.traits = traits;
	}

	static simple({
		name,
		type,
		bonus,
		range,
		traits = [],
	}: {
		name: string;
		type: PrimaryWeaponType;
		bonus: Bonus;
		range?: Distance;
		traits?: Trait[];
	}): Weapon {
		return new Weapon({
			name,
			modes: [new WeaponMode({ type, bonus, range })],
			traits,
		});
	}
}

export class Armor implements Item {
	name: string;
	type: ArmorType;
	bonus: Bonus;
	dexPenalty: Bonus;
	traits: Trait[];

	constructor({
		name,
		type,
		bonus,
		dexPenalty,
		traits = [],
	}: {
		name: string;
		type: ArmorType;
		bonus: Bonus;
		dexPenalty: Bonus;
		traits?: Trait[];
	}) {
		this.name = name;
		this.type = type;
		this.bonus = bonus;
		this.dexPenalty = dexPenalty;
		this.traits = traits;
	}
}

export class Shield implements Item {
	name: string;
	type: ShieldType;
	bonus: Bonus;
	traits: Trait[];

	constructor({ name, type, bonus, traits = [] }: { name: string; type: ShieldType; bonus: Bonus; traits?: Trait[] }) {
		this.name = name;
		this.type = type;
		this.bonus = bonus;
		this.traits = traits;
	}
}

export class Equipment {
	items: Item[];

	constructor(items: Item[] = []) {
		this.items = items;
	}

	static from(prop: string): Equipment {
		if (!prop) {
			return new Equipment();
		}

		const itemData = JSON.parse(prop) as Array<{
			name: string;
			type: string;
			bonus?: number;
			traits?: string[];
			range?: number;
			attribute?: string;
			dexPenalty?: number;
			twoHanded?: boolean;
		}>;

		const items: Item[] = itemData.map(data => {
			const traits = data.traits?.map(trait => trait as Trait) || [];
			if (Object.values(PrimaryWeaponType).includes(data.type as PrimaryWeaponType)) {
				return new Weapon({
					name: data.name,
					modes: [
						new WeaponMode({
							type: data.type as PrimaryWeaponType,
							bonus: Bonus.of((data.bonus as number) ?? 0),
							range: data.range ? new Distance({ value: data.range }) : undefined,
						}),
					],
					traits,
				});
			} else if (Object.values(ArmorType).includes(data.type as ArmorType)) {
				return new Armor({
					name: data.name,
					type: data.type as ArmorType,
					bonus: Bonus.of(data.bonus ?? 0),
					dexPenalty: Bonus.of(data.dexPenalty ?? 0),
					traits,
				});
			} else if (Object.values(ShieldType).includes(data.type as ShieldType)) {
				return new Shield({
					name: data.name,
					type: data.type as ShieldType,
					bonus: Bonus.of(data.bonus ?? 0),
					traits,
				});
			} else {
				throw new Error(`Unknown equipment type: ${data.type}`);
			}
		});

		return new Equipment(items);
	}

	toProp(): string {
		return JSON.stringify(this.items);
	}
}

// TODO(luan): rename to BASIC_EQUIPMENT and add a BasicEquipmentType enum
export const EQUIPMENT: Record<string, () => Item> = {
	// Weapons
	Javelin: () =>
		Weapon.simple({
			name: 'Javelin',
			type: PrimaryWeaponType.Thrown,
			bonus: Bonus.of(2),
			range: Distance.of(6),
		}),
	Hatchet: () =>
		new Weapon({
			name: 'Hatchet',
			modes: [
				new WeaponMode({
					type: PrimaryWeaponType.LightMelee,
					bonus: Bonus.of(2),
				}),
				new WeaponMode({
					type: PrimaryWeaponType.Thrown,
					bonus: Bonus.of(3),
					range: Distance.of(3),
				}),
			],
		}),
	Dagger: () =>
		new Weapon({
			name: 'Dagger',
			modes: [
				new WeaponMode({
					type: PrimaryWeaponType.LightMelee,
					bonus: Bonus.of(3),
				}),
				new WeaponMode({
					type: PrimaryWeaponType.Thrown,
					bonus: Bonus.of(2),
					range: Distance.of(3),
				}),
			],
			traits: [Trait.Concealable],
		}),
	Rapier: () =>
		Weapon.simple({
			name: 'Rapier',
			type: PrimaryWeaponType.LightMelee,
			bonus: Bonus.of(4),
		}),
	'Bow & Arrows': () =>
		Weapon.simple({
			name: 'Bow & Arrows',
			type: PrimaryWeaponType.Ranged,
			bonus: Bonus.of(4),
			range: Distance.of(12),
		}),
	'Crossbow & Darts': () =>
		Weapon.simple({
			name: 'Crossbow & Darts',
			type: PrimaryWeaponType.Ranged,
			bonus: Bonus.of(5),
			range: Distance.of(12),
			traits: [Trait.Reloadable],
		}),
	Spear: () =>
		Weapon.simple({
			name: 'Spear',
			type: PrimaryWeaponType.HeavyMelee,
			bonus: Bonus.of(4),
			range: Distance.of(2),
			traits: [Trait.Polearm],
		}),
	Mace: () =>
		Weapon.simple({
			name: 'Mace',
			type: PrimaryWeaponType.HeavyMelee,
			bonus: Bonus.of(5),
			range: Distance.of(12),
		}),
	Longsword: () =>
		Weapon.simple({
			name: 'Longsword',
			type: PrimaryWeaponType.HeavyMelee,
			bonus: Bonus.of(6),
			traits: [Trait.TwoHanded],
		}),

	// Armor
	'Light Armor': () =>
		new Armor({
			name: 'Light Armor',
			type: ArmorType.LightArmor,
			bonus: Bonus.of(1),
			dexPenalty: Bonus.of(-1),
		}),
	'Medium Armor': () =>
		new Armor({
			name: 'Medium Armor',
			type: ArmorType.MediumArmor,
			bonus: Bonus.of(3),
			dexPenalty: Bonus.of(-1),
		}),
	'Heavy Armor': () =>
		new Armor({
			name: 'Heavy Armor',
			type: ArmorType.HeavyArmor,
			bonus: Bonus.of(5),
			dexPenalty: Bonus.of(-3),
		}),

	// Shields
	'Small Shield': () =>
		new Shield({
			name: 'Small Shield',
			type: ShieldType.SmallShield,
			bonus: Bonus.of(2),
		}),
	'Large Shield': () =>
		new Shield({
			name: 'Large Shield',
			type: ShieldType.LargeShield,
			bonus: Bonus.of(6),
			traits: [Trait.TwoHanded],
		}),
};
