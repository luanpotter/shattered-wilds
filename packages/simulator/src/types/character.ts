import { StatType, Size } from './core';

export enum Race {
	Human = 'Human',
	Elf = 'Elf',
	Dwarf = 'Dwarf',
	Orc = 'Orc',
	Fey = 'Fey',
	Goliath = 'Goliath',
	Goblin = 'Goblin',
}

export enum CharacterClass {
	// Warriors - Melee (STR)
	Fighter = 'Fighter',
	Berserker = 'Berserker',
	Swashbuckler = 'Swashbuckler',
	// Warriors - Ranged (DEX)
	Marksman = 'Marksman',
	Hunter = 'Hunter',
	Rogue = 'Rogue',
	// Warriors - Tank (CON)
	Guardian = 'Guardian',
	Barbarian = 'Barbarian',
	Scout = 'Scout',
	// Casters - Erudite (INT)
	Wizard = 'Wizard',
	Engineer = 'Engineer',
	Alchemist = 'Alchemist',
	Storyteller = 'Storyteller',
	// Casters - Intuitive (WIS)
	Mage = 'Mage',
	Artificer = 'Artificer',
	Druid = 'Druid',
	Minstrel = 'Minstrel',
	// Casters - Innate (CHA)
	Sorcerer = 'Sorcerer',
	Machinist = 'Machinist',
	Shaman = 'Shaman',
	Bard = 'Bard',
	// Mystics - Disciple (DIV)
	Cleric = 'Cleric',
	Warlock = 'Warlock',
	Paladin = 'Paladin',
	// Mystics - Adept (FOW)
	Sage = 'Sage',
	Monk = 'Monk',
	Ranger = 'Ranger',
	// Mystics - Inspired (LCK)
	Wanderer = 'Wanderer',
	Wayfarer = 'Wayfarer',
	Warden = 'Warden',
}

// Define a structure for race attribute modifiers
export interface AttributeModifier {
	attributeType: StatType;
	value: number;
}

export interface RaceDefinition {
	name: Race;
	modifiers: AttributeModifier[];
	size: Size;
}

export interface ClassDefinition {
	name: CharacterClass;
	primaryAttribute: StatType;
	archetype: 'Warrior' | 'Caster' | 'Mystic';
	role: string;
	flavor: string;
}

// Equipment types
export enum PrimaryWeaponType {
	Unarmed = 'Unarmed',
	Thrown = 'Thrown',
	LightMelee = 'Light Melee',
	Ranged = 'Ranged',
	HeavyMelee = 'Heavy Melee',
}

export enum ArmorType {
	Light = 'Light Armor',
	Medium = 'Medium Armor',
	Heavy = 'Heavy Armor',
}

export enum ShieldType {
	Small = 'Small Shield',
	Large = 'Large Shield',
}

export interface Item {
	name: string;
}

export class Weapon implements Item {
	name: string;
	type: PrimaryWeaponType;
	bonus: number;
	traits: string[];
	range: number | undefined; // in meters, for thrown/ranged weapons
	attribute: StatType;

	constructor(
		name: string,
		type: PrimaryWeaponType,
		bonus: number,
		traits: string[],
		attribute: StatType,
		range?: number
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
		if (!prop) {
			return new Equipment();
		}

		try {
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
					const attributeType =
						Object.values(StatType).find(attr => attr.name === data.attribute) || StatType.STR;
					return new Weapon(
						data.name,
						data.type as PrimaryWeaponType,
						data.bonus || 0,
						data.traits || [],
						attributeType,
						data.range
					);
				} else if (Object.values(ArmorType).includes(data.type as ArmorType)) {
					return new Armor(
						data.name,
						data.type as ArmorType,
						data.bonus || 0,
						data.dexPenalty || 0
					);
				} else if (Object.values(ShieldType).includes(data.type as ShieldType)) {
					return new Shield(
						data.name,
						data.type as ShieldType,
						data.bonus || 0,
						data.twoHanded || false
					);
				}
				return { name: data.name };
			});

			return new Equipment(items);
		} catch {
			return new Equipment();
		}
	}

	toProp(): string {
		return JSON.stringify(this.items);
	}
}
