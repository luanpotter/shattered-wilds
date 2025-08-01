import { Size } from './size.js';
import { StatType } from '../stats/stat-type.js';

export enum Race {
	Human = 'Human',
	Elf = 'Elf',
	Dwarf = 'Dwarf',
	Orc = 'Orc',
	Fey = 'Fey',
	Goliath = 'Goliath',
	Goblin = 'Goblin',
}

export enum Upbringing {
	Urban = 'Urban',
	Nomadic = 'Nomadic',
	Tribal = 'Tribal',
	Sylvan = 'Sylvan',
	Telluric = 'Telluric',
}

export interface RacialStatModifier {
	statType: StatType;
	value: number;
}

export interface RaceDefinition {
	name: Race;
	size: Size;
	modifiers: RacialStatModifier[];
}

export const RACE_DEFINITIONS: Record<Race, RaceDefinition> = {
	[Race.Human]: {
		name: Race.Human,
		modifiers: [], // Neutral - no modifiers
		size: Size.M,
	},
	[Race.Elf]: {
		name: Race.Elf,
		modifiers: [
			{ statType: StatType.DEX, value: 1 },
			{ statType: StatType.CON, value: -1 },
		],
		size: Size.M,
	},
	[Race.Dwarf]: {
		name: Race.Dwarf,
		modifiers: [
			{ statType: StatType.CON, value: 1 },
			{ statType: StatType.DEX, value: -1 },
		],
		size: Size.S,
	},
	[Race.Orc]: {
		name: Race.Orc,
		modifiers: [
			{ statType: StatType.STR, value: 1 },
			{ statType: StatType.DEX, value: -1 },
		],
		size: Size.L,
	},
	[Race.Fey]: {
		name: Race.Fey,
		modifiers: [
			{ statType: StatType.DEX, value: 1 },
			{ statType: StatType.STR, value: -1 },
		],
		size: Size.S,
	},
	[Race.Goliath]: {
		name: Race.Goliath,
		modifiers: [
			{ statType: StatType.STR, value: 1 },
			{ statType: StatType.CON, value: -1 },
		],
		size: Size.L,
	},
	[Race.Goblin]: {
		name: Race.Goblin,
		modifiers: [
			{ statType: StatType.CON, value: 1 },
			{ statType: StatType.STR, value: -1 },
		],
		size: Size.S,
	},
};
