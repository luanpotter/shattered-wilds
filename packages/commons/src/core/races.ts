import { Size } from './size.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus } from '../stats/value.js';

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
	value: Bonus;
}

export interface RaceDefinition {
	name: Race;
	size: Size;
	modifiers: RacialStatModifier[];
	typicalUpbringings: Upbringing[];
}

export const RACE_DEFINITIONS: Record<Race, RaceDefinition> = {
	[Race.Human]: {
		name: Race.Human,
		modifiers: [],
		size: Size.M,
		typicalUpbringings: [Upbringing.Urban, Upbringing.Nomadic],
	},
	[Race.Elf]: {
		name: Race.Elf,
		modifiers: [
			{ statType: StatType.DEX, value: Bonus.of(1) },
			{ statType: StatType.CON, value: Bonus.of(-1) },
		],
		size: Size.M,
		typicalUpbringings: [Upbringing.Urban, Upbringing.Sylvan],
	},
	[Race.Dwarf]: {
		name: Race.Dwarf,
		modifiers: [
			{ statType: StatType.CON, value: Bonus.of(1) },
			{ statType: StatType.DEX, value: Bonus.of(-1) },
		],
		size: Size.S,
		typicalUpbringings: [Upbringing.Tribal, Upbringing.Telluric],
	},
	[Race.Orc]: {
		name: Race.Orc,
		modifiers: [
			{ statType: StatType.STR, value: Bonus.of(1) },
			{ statType: StatType.DEX, value: Bonus.of(-1) },
		],
		size: Size.L,
		typicalUpbringings: [Upbringing.Nomadic, Upbringing.Telluric],
	},
	[Race.Fey]: {
		name: Race.Fey,
		modifiers: [
			{ statType: StatType.DEX, value: Bonus.of(1) },
			{ statType: StatType.STR, value: Bonus.of(-1) },
		],
		size: Size.S,
		typicalUpbringings: [Upbringing.Tribal, Upbringing.Sylvan],
	},
	[Race.Goliath]: {
		name: Race.Goliath,
		modifiers: [
			{ statType: StatType.STR, value: Bonus.of(1) },
			{ statType: StatType.CON, value: Bonus.of(-1) },
		],
		size: Size.L,
		typicalUpbringings: [Upbringing.Tribal, Upbringing.Telluric],
	},
	[Race.Goblin]: {
		name: Race.Goblin,
		modifiers: [
			{ statType: StatType.CON, value: Bonus.of(1) },
			{ statType: StatType.STR, value: Bonus.of(-1) },
		],
		size: Size.S,
		typicalUpbringings: [Upbringing.Nomadic, Upbringing.Sylvan],
	},
};
