import { StatType } from '@shattered-wilds/commons';

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
}

export class Weapon implements Item {
	name: string;
	type: PrimaryWeaponType;
	bonus: number;
	traits: string[];
	range: number | undefined; // in hexes, for thrown/ranged weapons

	constructor({
		name,
		type,
		bonus,
		traits = [],
		range,
	}: {
		name: string;
		type: PrimaryWeaponType;
		bonus: number;
		traits?: string[];
		range: number | undefined;
	}) {
		this.name = name;
		this.type = type;
		this.bonus = bonus;
		this.traits = traits;
		this.range = range;
	}

	get statType(): StatType {
		return PRIMARY_WEAPON_TYPES[this.type];
	}
}

export class Armor implements Item {
	name: string;
	type: ArmorType;
	bonus: number;
	dexPenalty: number;

	constructor(name: string, type: ArmorType, bonus: number, dexPenalty: number) {
		this.name = name;
		this.type = type;
		this.bonus = bonus;
		this.dexPenalty = dexPenalty;
	}
}

export class Shield implements Item {
	name: string;
	type: ShieldType;
	bonus: number;
	twoHanded: boolean;

	constructor(name: string, type: ShieldType, bonus: number, twoHanded: boolean) {
		this.name = name;
		this.type = type;
		this.bonus = bonus;
		this.twoHanded = twoHanded;
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
			if (Object.values(PrimaryWeaponType).includes(data.type as PrimaryWeaponType)) {
				return new Weapon({
					name: data.name,
					type: data.type as PrimaryWeaponType,
					bonus: data.bonus || 0,
					traits: data.traits || [],
					range: data.range,
				});
			} else if (Object.values(ArmorType).includes(data.type as ArmorType)) {
				return new Armor(data.name, data.type as ArmorType, data.bonus || 0, data.dexPenalty || 0);
			} else if (Object.values(ShieldType).includes(data.type as ShieldType)) {
				return new Shield(data.name, data.type as ShieldType, data.bonus || 0, data.twoHanded || false);
			}
			return { name: data.name };
		});

		return new Equipment(items);
	}

	toProp(): string {
		return JSON.stringify(this.items);
	}
}

export const EQUIPMENT: Record<string, () => Item> = {
	Javelin: () => new Weapon({ name: 'Javelin', type: PrimaryWeaponType.Thrown, bonus: 2, range: 7 }),
	Hatchet: () =>
		new Weapon({
			name: 'Hatchet',
			type: PrimaryWeaponType.LightMelee,
			bonus: 2,
			traits: ['Thrown (Range 3m)'],
			range: 5,
		}),
	Dagger: () =>
		new Weapon({
			name: 'Dagger',
			type: PrimaryWeaponType.LightMelee,
			bonus: 3,
			traits: ['Concealable', 'Thrown (Range 3m)'],
			range: 5,
		}),
	Rapier: () => new Weapon({ name: 'Rapier', type: PrimaryWeaponType.LightMelee, bonus: 4, range: 12 }),
	'Bow & Arrows': () =>
		new Weapon({
			name: 'Bow & Arrows',
			type: PrimaryWeaponType.Ranged,
			bonus: 4,
			traits: ['Concentrate', 'Two-Handed'],
			range: 12,
		}),
	'Crossbow & Darts': () =>
		new Weapon({
			name: 'Crossbow & Darts',
			type: PrimaryWeaponType.Ranged,
			bonus: 5,
			traits: ['Concentrate', 'Two-Handed', 'Reload'],
			range: 12,
		}),
	Spear: () =>
		new Weapon({
			name: 'Spear',
			type: PrimaryWeaponType.HeavyMelee,
			bonus: 4,
			traits: ['Polearm', 'Two-Handed'],
			range: 12,
		}),
	Mace: () => new Weapon({ name: 'Mace', type: PrimaryWeaponType.HeavyMelee, bonus: 5, range: 12 }),
	Longsword: () =>
		new Weapon({ name: 'Longsword', type: PrimaryWeaponType.HeavyMelee, bonus: 6, traits: ['Two-Handed'], range: 12 }),
	'Light Armor': () => new Armor('Light Armor', ArmorType.LightArmor, 1, 0),
	'Medium Armor': () => new Armor('Medium Armor', ArmorType.MediumArmor, 3, -1),
	'Heavy Armor': () => new Armor('Heavy Armor', ArmorType.HeavyArmor, 5, -3),
	'Small Shield': () => new Shield('Small Shield', ShieldType.SmallShield, 2, false),
	'Large Shield': () => new Shield('Large Shield', ShieldType.LargeShield, 6, true),
};
