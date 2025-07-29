import { StatType } from '@shattered-wilds/commons';

export enum PrimaryWeaponType {
	Unarmed = 'Unarmed',
	Thrown = 'Thrown',
	LightMelee = 'Light Melee',
	Ranged = 'Ranged',
	HeavyMelee = 'Heavy Melee',
}

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
	attribute: StatType;

	constructor(
		name: string,
		type: PrimaryWeaponType,
		bonus: number,
		traits: string[],
		attribute: StatType,
		range?: number,
	) {
		this.name = name;
		this.type = type;
		this.bonus = bonus;
		this.traits = traits;
		this.attribute = attribute;
		this.range = range;
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
				const attributeType = Object.values(StatType).find(attr => attr.name === data.attribute) || StatType.STR;
				return new Weapon(
					data.name,
					data.type as PrimaryWeaponType,
					data.bonus || 0,
					data.traits || [],
					attributeType,
					data.range,
				);
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
	Javelin: () => new Weapon('Javelin', PrimaryWeaponType.Thrown, 2, [], StatType.STR, 7),
	Hatchet: () => new Weapon('Hatchet', PrimaryWeaponType.LightMelee, 2, ['Thrown (Range 3m)'], StatType.DEX, 5),
	Dagger: () =>
		new Weapon('Dagger', PrimaryWeaponType.LightMelee, 3, ['Concealable', 'Thrown (Range 3m)'], StatType.DEX, 5),
	Rapier: () => new Weapon('Rapier', PrimaryWeaponType.LightMelee, 4, [], StatType.DEX),
	'Bow & Arrows': () =>
		new Weapon('Bow & Arrows', PrimaryWeaponType.Ranged, 4, ['Concentrate', 'Two-Handed'], StatType.DEX, 12),
	'Crossbow & Darts': () =>
		new Weapon(
			'Crossbow & Darts',
			PrimaryWeaponType.Ranged,
			5,
			['Concentrate', 'Two-Handed', 'Reload'],
			StatType.DEX,
			12,
		),
	Spear: () => new Weapon('Spear', PrimaryWeaponType.HeavyMelee, 4, ['Polearm', 'Two-Handed'], StatType.STR),
	Mace: () => new Weapon('Mace', PrimaryWeaponType.HeavyMelee, 5, [], StatType.STR),
	Longsword: () => new Weapon('Longsword', PrimaryWeaponType.HeavyMelee, 6, ['Two-Handed'], StatType.STR),
	'Light Armor': () => new Armor('Light Armor', ArmorType.LightArmor, 1, 0),
	'Medium Armor': () => new Armor('Medium Armor', ArmorType.MediumArmor, 3, -1),
	'Heavy Armor': () => new Armor('Heavy Armor', ArmorType.HeavyArmor, 5, -3),
	'Small Shield': () => new Shield('Small Shield', ShieldType.SmallShield, 2, false),
	'Large Shield': () => new Shield('Large Shield', ShieldType.LargeShield, 6, true),
};
