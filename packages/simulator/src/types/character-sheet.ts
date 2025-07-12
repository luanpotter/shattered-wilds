import {
	FEATS,
	Upbringing,
	getRacialFeatId,
	getUpbringingFeats,
	getClassModifierFeatId,
	CLASS_CORE_FEATS,
} from '../feats';

import { AttributeTree, Attribute, makeAttributeTree } from './attributes';
import {
	Race,
	CharacterClass,
	Equipment,
	Armor,
	RaceDefinition,
	ClassDefinition,
} from './character';
import {
	AttributeType,
	Modifier,
	Size,
	DerivedStat,
	HexPosition,
	BasicAttack,
	DefenseType,
} from './core';

export class RaceInfo {
	primaryRace: Race;
	halfRace: Race | null;
	combineHalfRaceStats: boolean;
	upbringing: Upbringing;

	constructor(
		primaryRace: Race,
		upbringing: Upbringing,
		halfRace: Race | null = null,
		combineHalfRaceStats: boolean = false
	) {
		this.primaryRace = primaryRace;
		this.halfRace = halfRace;
		this.combineHalfRaceStats = combineHalfRaceStats;
		this.upbringing = upbringing;
	}

	static from(props: Record<string, string>): RaceInfo {
		const primaryRace = (props['race'] as Race) ?? Race.Human;
		const halfRace = props['race.half'] ? (props['race.half'] as Race) : null;
		const combineHalfRaceStats = props['race.half.combined-stats'] === 'true';
		const upbringing = (props['upbringing'] as Upbringing) ?? Upbringing.Urban;

		return new RaceInfo(primaryRace, upbringing, halfRace, combineHalfRaceStats);
	}

	// Get the core feats that should be assigned to this race/upbringing combination
	getCoreFeats(): string[] {
		const coreFeats: string[] = [];

		// Add racial feat
		coreFeats.push(getRacialFeatId(this.primaryRace));

		// Add half race feat if applicable
		if (this.halfRace && this.combineHalfRaceStats) {
			coreFeats.push(getRacialFeatId(this.halfRace));
		}

		// Add upbringing feats
		coreFeats.push(...getUpbringingFeats(this.upbringing));

		return coreFeats;
	}

	getModifiers(): Modifier[] {
		const modifiers: Modifier[] = [];

		// Always apply primary race modifiers
		const primaryRaceDefinition = RACE_DEFINITIONS[this.primaryRace];
		primaryRaceDefinition.modifiers.forEach(mod => {
			modifiers.push({
				source: `${this.primaryRace} Race`,
				value: mod.value,
				attributeType: mod.attributeType,
			});
		});

		// Apply half race modifiers if enabled and we have a half race
		if (this.halfRace && this.combineHalfRaceStats) {
			const halfRaceDefinition = RACE_DEFINITIONS[this.halfRace];
			halfRaceDefinition.modifiers.forEach(mod => {
				modifiers.push({
					source: `${this.halfRace} Race`,
					value: mod.value,
					attributeType: mod.attributeType,
				});
			});
		}

		return modifiers;
	}

	toString(): string {
		if (this.halfRace) {
			return `Half ${this.primaryRace} / Half ${this.halfRace}`;
		}
		return this.primaryRace;
	}
}

export class ClassInfo {
	characterClass: CharacterClass;
	selectedFeats: string[];

	constructor(characterClass: CharacterClass, selectedFeats: string[] = []) {
		this.characterClass = characterClass;
		this.selectedFeats = selectedFeats;

		// Ensure the first feat (attribute specialization) is always included
		const firstFeat = `${CLASS_DEFINITIONS[characterClass].primaryAttribute.name} Attribute Specialization`;
		if (!this.selectedFeats.includes(firstFeat)) {
			this.selectedFeats.unshift(firstFeat);
		}
	}

	static from(props: Record<string, string>): ClassInfo {
		const characterClass = (props['class'] as CharacterClass) ?? CharacterClass.Fighter;
		const selectedFeats = props['class.feats']
			? (JSON.parse(props['class.feats']) as string[])
			: [];

		return new ClassInfo(characterClass, selectedFeats);
	}

	// Get the 3 core class feats for this class
	getCoreClassFeats(): string[] {
		const coreFeats: string[] = [];

		// Add class modifier feat
		const primaryAttribute = CLASS_DEFINITIONS[this.characterClass].primaryAttribute;
		coreFeats.push(getClassModifierFeatId(primaryAttribute));

		// Add role and flavor feats
		const classFeats = CLASS_CORE_FEATS[this.characterClass];
		if (classFeats) {
			coreFeats.push(classFeats.role);
			coreFeats.push(classFeats.flavor);
		}

		return coreFeats;
	}

	getModifiers(): Modifier[] {
		const modifiers: Modifier[] = [];

		// Add the attribute specialization modifier (+1 to primary attribute)
		const primaryAttribute = CLASS_DEFINITIONS[this.characterClass].primaryAttribute;
		modifiers.push({
			source: `${this.characterClass} Class`,
			value: 1,
			attributeType: primaryAttribute,
			description: `${primaryAttribute.name} Attribute Specialization from ${this.characterClass} class`,
		});

		return modifiers;
	}

	toString(): string {
		return this.characterClass;
	}

	toProp(): string {
		return JSON.stringify(this.selectedFeats);
	}
}

export class DerivedStats {
	size: DerivedStat<Size>;
	movement: DerivedStat<number>;
	initiative: DerivedStat<number>;
	maxHeroism: DerivedStat<number>;
	maxVitality: DerivedStat<number>;
	maxFocus: DerivedStat<number>;
	maxSpirit: DerivedStat<number>;

	constructor(race: RaceInfo, attributeTree: AttributeTree) {
		this.size = this.computeSize(race);
		this.movement = this.computeMovement(attributeTree);
		this.initiative = this.computeInitiative(attributeTree);
		this.maxHeroism = this.computeMaxHeroism(attributeTree);
		this.maxVitality = this.computeMaxVitality(attributeTree);
		this.maxFocus = this.computeMaxFocus(attributeTree);
		this.maxSpirit = this.computeMaxSpirit(attributeTree);
	}

	private computeSize(race: RaceInfo): DerivedStat<Size> {
		const raceDefinition = RACE_DEFINITIONS[race.primaryRace];
		return new DerivedStat(
			raceDefinition.size,
			`Size determined by primary race: ${race.primaryRace}`
		);
	}

	private computeMovement(attributeTree: AttributeTree): DerivedStat<number> {
		// Movement = 6 + DEX modifier (max +2)
		const dexValue = attributeTree.valueOf(AttributeType.DEX);
		const dexModifier = Math.min(2, Math.max(-2, dexValue - 10));
		const movement = 6 + dexModifier;
		return new DerivedStat(
			movement,
			`Base movement: 6 + DEX modifier (${dexModifier >= 0 ? '+' : ''}${dexModifier}, max ±2)`
		);
	}

	private computeInitiative(attributeTree: AttributeTree): DerivedStat<number> {
		// Initiative = 10 + DEX
		const dexValue = attributeTree.valueOf(AttributeType.DEX);
		const initiative = 10 + dexValue;
		return new DerivedStat(initiative, `Initiative: 10 + DEX (${dexValue})`);
	}

	private computeMaxHeroism(attributeTree: AttributeTree): DerivedStat<number> {
		const level = attributeTree.level;
		const heroism = Math.max(1, level);
		return new DerivedStat(heroism, `Max Heroism: Level (${level}), minimum 1`);
	}

	private computeMaxVitality(attributeTree: AttributeTree): DerivedStat<number> {
		const bodyValue = attributeTree.valueOf(AttributeType.Body);
		const vitality = bodyValue + 10;
		return new DerivedStat(vitality, `Max Vitality: Body (${bodyValue}) + 10`);
	}

	private computeMaxFocus(attributeTree: AttributeTree): DerivedStat<number> {
		const mindValue = attributeTree.valueOf(AttributeType.Mind);
		const focus = mindValue + 10;
		return new DerivedStat(focus, `Max Focus: Mind (${mindValue}) + 10`);
	}

	private computeMaxSpirit(attributeTree: AttributeTree): DerivedStat<number> {
		const soulValue = attributeTree.valueOf(AttributeType.Soul);
		const spirit = soulValue + 10;
		return new DerivedStat(spirit, `Max Spirit: Soul (${soulValue}) + 10`);
	}
}

export class CurrentValues {
	currentHeroism: number;
	currentVitality: number;
	currentFocus: number;
	currentSpirit: number;

	constructor(
		currentHeroism: number,
		currentVitality: number,
		currentFocus: number,
		currentSpirit: number
	) {
		this.currentHeroism = currentHeroism;
		this.currentVitality = currentVitality;
		this.currentFocus = currentFocus;
		this.currentSpirit = currentSpirit;
	}

	static MAX_VALUE = -1;

	static from(props: Record<string, string>): CurrentValues {
		const parse = (value?: string): number => {
			return value ? parseInt(value) : CurrentValues.MAX_VALUE;
		};
		const currentHeroism = parse(props['currentHeroism']);
		const currentVitality = parse(props['currentVitality']);
		const currentFocus = parse(props['currentFocus']);
		const currentSpirit = parse(props['currentSpirit']);

		return new CurrentValues(currentHeroism, currentVitality, currentFocus, currentSpirit);
	}

	backfill(sheet: CharacterSheet) {
		const fallback = (value: number, fallback: () => number): number => {
			return value === CurrentValues.MAX_VALUE ? fallback() : value;
		};
		this.currentHeroism = fallback(this.currentHeroism, () => sheet.derivedStats.maxHeroism.value);
		this.currentVitality = fallback(
			this.currentVitality,
			() => sheet.derivedStats.maxVitality.value
		);
		this.currentFocus = fallback(this.currentFocus, () => sheet.derivedStats.maxFocus.value);
		this.currentSpirit = fallback(this.currentSpirit, () => sheet.derivedStats.maxSpirit.value);
	}
}

export class CharacterSheet {
	name: string;
	race: RaceInfo;
	characterClass: ClassInfo;
	attributes: Attribute;
	derivedStats: DerivedStats;
	currentValues: CurrentValues;
	equipment: Equipment;
	private _props: Record<string, string>;

	constructor(
		name: string,
		race: RaceInfo,
		characterClass: ClassInfo,
		attributes: Attribute,
		equipment: Equipment,
		currentValues: CurrentValues,
		props: Record<string, string>
	) {
		this.name = name;
		this.race = race;
		this.characterClass = characterClass;
		this.attributes = attributes;
		this.equipment = equipment;
		this._props = props;

		this.derivedStats = new DerivedStats(this.race, this.getAttributeTree());
		this.currentValues = currentValues;
	}

	getAttributeTree(): AttributeTree {
		return new AttributeTree(this.attributes, this.getAllModifiers());
	}

	// Get all feats from character props
	getFeats(): string[] {
		const feats: string[] = [];
		for (const [key, value] of Object.entries(this._props)) {
			if (key.startsWith('feat:') && value === 'true') {
				feats.push(key.substring(5)); // Remove 'feat:' prefix
			}
		}
		return feats;
	}

	// Check if character has a specific feat
	hasFeat(featId: string): boolean {
		return this._props[`feat:${featId}`] === 'true';
	}

	// Get modifiers from feats
	getFeatModifiers(): Modifier[] {
		const modifiers: Modifier[] = [];
		const feats = this.getFeats();

		for (const featId of feats) {
			const feat = FEATS[featId];
			if (feat && feat.modifiers) {
				modifiers.push(...feat.modifiers);
			}
		}

		return modifiers;
	}

	// Get all modifiers from all sources (feats, equipment, etc.)
	getAllModifiers(): Modifier[] {
		const modifiers: Modifier[] = [];

		// Add feat modifiers (includes race, class, and upbringing modifiers)
		modifiers.push(...this.getFeatModifiers());

		// Add equipment modifiers (armor DEX penalties)
		this.equipment.items
			.filter(item => item instanceof Armor)
			.forEach(item => {
				const armor = item as Armor;
				if (armor.dexPenalty !== 0) {
					modifiers.push({
						source: `${armor.name} (${armor.type})`,
						value: armor.dexPenalty, // dexPenalty is already stored as negative
						attributeType: AttributeType.DEX,
						description: `Dexterity penalty from wearing ${armor.name}`,
					});
				}
			});

		return modifiers;
	}

	getBasicAttacks(): BasicAttack[] {
		// Implementation details for basic attacks...
		return [];
	}

	getBasicDefense(type: DefenseType): DerivedStat<number> {
		// TODO: Implementation details for basic defense based on type...
		// For now, return a placeholder
		return new DerivedStat(10, `Basic defense calculation for ${type}`);
	}

	static from(props: Record<string, string>): CharacterSheet {
		const sheet = new CharacterSheet(
			props['name']!!,
			RaceInfo.from(props),
			ClassInfo.from(props),
			makeAttributeTree(props),
			Equipment.from(props['equipment']),
			CurrentValues.from(props),
			props
		);
		// backfill maximal current values from attribute tree if needed
		sheet.currentValues.backfill(sheet);
		return sheet;
	}
}

export interface Character {
	id: string;
	position?: HexPosition;
	automaticMode?: boolean;
	props: { name: string } & Record<string, string>;
}

// Define the modifiers for each race
export const RACE_DEFINITIONS: Record<Race, RaceDefinition> = {
	[Race.Human]: {
		name: Race.Human,
		modifiers: [], // Neutral - no modifiers
		size: Size.M,
	},
	[Race.Elf]: {
		name: Race.Elf,
		modifiers: [
			{ attributeType: AttributeType.DEX, value: 1 },
			{ attributeType: AttributeType.CON, value: -1 },
		],
		size: Size.M,
	},
	[Race.Dwarf]: {
		name: Race.Dwarf,
		modifiers: [
			{ attributeType: AttributeType.CON, value: 1 },
			{ attributeType: AttributeType.DEX, value: -1 },
		],
		size: Size.S,
	},
	[Race.Orc]: {
		name: Race.Orc,
		modifiers: [
			{ attributeType: AttributeType.STR, value: 1 },
			{ attributeType: AttributeType.DEX, value: -1 },
		],
		size: Size.L,
	},
	[Race.Fey]: {
		name: Race.Fey,
		modifiers: [
			{ attributeType: AttributeType.DEX, value: 1 },
			{ attributeType: AttributeType.STR, value: -1 },
		],
		size: Size.S,
	},
	[Race.Goliath]: {
		name: Race.Goliath,
		modifiers: [
			{ attributeType: AttributeType.STR, value: 1 },
			{ attributeType: AttributeType.CON, value: -1 },
		],
		size: Size.L,
	},
	[Race.Goblin]: {
		name: Race.Goblin,
		modifiers: [
			{ attributeType: AttributeType.CON, value: 1 },
			{ attributeType: AttributeType.STR, value: -1 },
		],
		size: Size.S,
	},
};

// Define the class definitions for all 30 classes
export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
	// Warriors - Melee (STR)
	[CharacterClass.Fighter]: {
		name: CharacterClass.Fighter,
		primaryAttribute: AttributeType.STR,
		archetype: 'Warrior',
		role: 'Melee',
		flavor: 'Martial',
	},
	[CharacterClass.Berserker]: {
		name: CharacterClass.Berserker,
		primaryAttribute: AttributeType.STR,
		archetype: 'Warrior',
		role: 'Melee',
		flavor: 'Survivalist',
	},
	[CharacterClass.Swashbuckler]: {
		name: CharacterClass.Swashbuckler,
		primaryAttribute: AttributeType.STR,
		archetype: 'Warrior',
		role: 'Melee',
		flavor: 'Scoundrel',
	},
	// Warriors - Ranged (DEX)
	[CharacterClass.Marksman]: {
		name: CharacterClass.Marksman,
		primaryAttribute: AttributeType.DEX,
		archetype: 'Warrior',
		role: 'Ranged',
		flavor: 'Martial',
	},
	[CharacterClass.Hunter]: {
		name: CharacterClass.Hunter,
		primaryAttribute: AttributeType.DEX,
		archetype: 'Warrior',
		role: 'Ranged',
		flavor: 'Survivalist',
	},
	[CharacterClass.Rogue]: {
		name: CharacterClass.Rogue,
		primaryAttribute: AttributeType.DEX,
		archetype: 'Warrior',
		role: 'Ranged',
		flavor: 'Scoundrel',
	},
	// Warriors - Tank (CON)
	[CharacterClass.Guardian]: {
		name: CharacterClass.Guardian,
		primaryAttribute: AttributeType.CON,
		archetype: 'Warrior',
		role: 'Tank',
		flavor: 'Martial',
	},
	[CharacterClass.Barbarian]: {
		name: CharacterClass.Barbarian,
		primaryAttribute: AttributeType.CON,
		archetype: 'Warrior',
		role: 'Tank',
		flavor: 'Survivalist',
	},
	[CharacterClass.Scout]: {
		name: CharacterClass.Scout,
		primaryAttribute: AttributeType.CON,
		archetype: 'Warrior',
		role: 'Tank',
		flavor: 'Scoundrel',
	},
	// Casters - Erudite (INT)
	[CharacterClass.Wizard]: {
		name: CharacterClass.Wizard,
		primaryAttribute: AttributeType.INT,
		archetype: 'Caster',
		role: 'Erudite',
		flavor: 'Arcanist',
	},
	[CharacterClass.Engineer]: {
		name: CharacterClass.Engineer,
		primaryAttribute: AttributeType.INT,
		archetype: 'Caster',
		role: 'Erudite',
		flavor: 'Mechanist',
	},
	[CharacterClass.Alchemist]: {
		name: CharacterClass.Alchemist,
		primaryAttribute: AttributeType.INT,
		archetype: 'Caster',
		role: 'Erudite',
		flavor: 'Naturalist',
	},
	[CharacterClass.Storyteller]: {
		name: CharacterClass.Storyteller,
		primaryAttribute: AttributeType.INT,
		archetype: 'Caster',
		role: 'Erudite',
		flavor: 'Musicist',
	},
	// Casters - Intuitive (WIS)
	[CharacterClass.Mage]: {
		name: CharacterClass.Mage,
		primaryAttribute: AttributeType.WIS,
		archetype: 'Caster',
		role: 'Intuitive',
		flavor: 'Arcanist',
	},
	[CharacterClass.Artificer]: {
		name: CharacterClass.Artificer,
		primaryAttribute: AttributeType.WIS,
		archetype: 'Caster',
		role: 'Intuitive',
		flavor: 'Mechanist',
	},
	[CharacterClass.Druid]: {
		name: CharacterClass.Druid,
		primaryAttribute: AttributeType.WIS,
		archetype: 'Caster',
		role: 'Intuitive',
		flavor: 'Naturalist',
	},
	[CharacterClass.Minstrel]: {
		name: CharacterClass.Minstrel,
		primaryAttribute: AttributeType.WIS,
		archetype: 'Caster',
		role: 'Intuitive',
		flavor: 'Musicist',
	},
	// Casters - Innate (CHA)
	[CharacterClass.Sorcerer]: {
		name: CharacterClass.Sorcerer,
		primaryAttribute: AttributeType.CHA,
		archetype: 'Caster',
		role: 'Innate',
		flavor: 'Arcanist',
	},
	[CharacterClass.Machinist]: {
		name: CharacterClass.Machinist,
		primaryAttribute: AttributeType.CHA,
		archetype: 'Caster',
		role: 'Innate',
		flavor: 'Mechanist',
	},
	[CharacterClass.Shaman]: {
		name: CharacterClass.Shaman,
		primaryAttribute: AttributeType.CHA,
		archetype: 'Caster',
		role: 'Innate',
		flavor: 'Naturalist',
	},
	[CharacterClass.Bard]: {
		name: CharacterClass.Bard,
		primaryAttribute: AttributeType.CHA,
		archetype: 'Caster',
		role: 'Innate',
		flavor: 'Musicist',
	},
	// Mystics - Disciple (DIV)
	[CharacterClass.Cleric]: {
		name: CharacterClass.Cleric,
		primaryAttribute: AttributeType.DIV,
		archetype: 'Mystic',
		role: 'Disciple',
		flavor: 'Pure',
	},
	[CharacterClass.Warlock]: {
		name: CharacterClass.Warlock,
		primaryAttribute: AttributeType.DIV,
		archetype: 'Mystic',
		role: 'Disciple',
		flavor: 'Mixed',
	},
	[CharacterClass.Paladin]: {
		name: CharacterClass.Paladin,
		primaryAttribute: AttributeType.DIV,
		archetype: 'Mystic',
		role: 'Disciple',
		flavor: 'Martial',
	},
	// Mystics - Adept (FOW)
	[CharacterClass.Sage]: {
		name: CharacterClass.Sage,
		primaryAttribute: AttributeType.FOW,
		archetype: 'Mystic',
		role: 'Adept',
		flavor: 'Pure',
	},
	[CharacterClass.Monk]: {
		name: CharacterClass.Monk,
		primaryAttribute: AttributeType.FOW,
		archetype: 'Mystic',
		role: 'Adept',
		flavor: 'Mixed',
	},
	[CharacterClass.Ranger]: {
		name: CharacterClass.Ranger,
		primaryAttribute: AttributeType.FOW,
		archetype: 'Mystic',
		role: 'Adept',
		flavor: 'Martial',
	},
	// Mystics - Inspired (LCK)
	[CharacterClass.Wanderer]: {
		name: CharacterClass.Wanderer,
		primaryAttribute: AttributeType.LCK,
		archetype: 'Mystic',
		role: 'Inspired',
		flavor: 'Pure',
	},
	[CharacterClass.Wayfarer]: {
		name: CharacterClass.Wayfarer,
		primaryAttribute: AttributeType.LCK,
		archetype: 'Mystic',
		role: 'Inspired',
		flavor: 'Mixed',
	},
	[CharacterClass.Warden]: {
		name: CharacterClass.Warden,
		primaryAttribute: AttributeType.LCK,
		archetype: 'Mystic',
		role: 'Inspired',
		flavor: 'Martial',
	},
};
