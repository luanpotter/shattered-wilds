import { AttributeTree, Attribute, makeAttributeTree } from './attributes';
import {
	Race,
	CharacterClass,
	Equipment,
	Armor,
	RaceDefinition,
	ClassDefinition,
	Shield,
	Weapon,
} from './character';
import {
	StatType,
	Modifier,
	Size,
	SizeModifiers,
	DerivedStat,
	BasicAttack,
	DefenseType,
} from './core';
import {
	FEATS,
	Upbringing,
	getRacialFeatId,
	getUpbringingFeats,
	getClassModifierFeatId,
	CLASS_CORE_FEATS,
	getUpbringingModifierFeat,
} from './feats';
import { HexPosition } from './ui';

export class RaceInfo {
	primaryRace: Race;
	halfRace: Race | null;
	combineHalfRaceStats: boolean;
	upbringing: Upbringing;
	upbringingPlusModifier: StatType;
	upbringingMinusModifier: StatType;

	constructor(
		primaryRace: Race,
		upbringing: Upbringing,
		halfRace: Race | null = null,
		combineHalfRaceStats: boolean = false,
		upbringingPlusModifier: StatType = StatType.INT,
		upbringingMinusModifier: StatType = StatType.WIS
	) {
		this.primaryRace = primaryRace;
		this.halfRace = halfRace;
		this.combineHalfRaceStats = combineHalfRaceStats;
		this.upbringing = upbringing;
		this.upbringingPlusModifier = upbringingPlusModifier;
		this.upbringingMinusModifier = upbringingMinusModifier;
	}

	static from(props: Record<string, string>): RaceInfo {
		const primaryRace = (props['race'] as Race) ?? Race.Human;
		const halfRace = props['race.half'] ? (props['race.half'] as Race) : null;
		const combineHalfRaceStats = props['race.half.combined-stats'] === 'true';
		const upbringing = (props['upbringing'] as Upbringing) ?? Upbringing.Urban;
		const upbringingPlusModifier =
			Object.values(StatType).find(type => type.name === props['upbringing.plus']) ?? StatType.INT;
		const upbringingMinusModifier =
			Object.values(StatType).find(type => type.name === props['upbringing.minus']) ?? StatType.WIS;

		return new RaceInfo(
			primaryRace,
			upbringing,
			halfRace,
			combineHalfRaceStats,
			upbringingPlusModifier,
			upbringingMinusModifier
		);
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
		const size = RACE_DEFINITIONS[race.primaryRace].size;
		return new DerivedStat(size, `Size is determined by your primary race (${size})`);
	}

	private computeMovement(attributeTree: AttributeTree): DerivedStat<number> {
		const HUMANOID_BASE = 3;
		const sizeModifier = SizeModifiers[this.size.value];
		const agility = attributeTree.valueOf(StatType.Agility);
		const value = HUMANOID_BASE + sizeModifier + Math.floor(agility / 4);
		return new DerivedStat(
			Math.max(value, 1),
			`Movement = ${HUMANOID_BASE} (base) + ${sizeModifier} (size) + ${agility} (Agility) / 4`
		);
	}

	private computeInitiative(attributeTree: AttributeTree): DerivedStat<number> {
		const agility = attributeTree.valueOf(StatType.Agility);
		const awareness = attributeTree.valueOf(StatType.Awareness);
		const value = agility + awareness;
		return new DerivedStat(value, `Initiative = ${agility} (Agility) + ${awareness} (Awareness)`);
	}

	private computeMaxHeroism(attributeTree: AttributeTree): DerivedStat<number> {
		const level = attributeTree.root.baseValue;
		return new DerivedStat(level, `Max Heroism Points = ${level} (Level)`);
	}

	private computeMaxVitality(attributeTree: AttributeTree): DerivedStat<number> {
		const body = attributeTree.valueOf(StatType.Body);
		const value = Math.max(1, 4 + body);
		return new DerivedStat(value, `Max Vitality Points = max(1, 4 + ${body} (Body))`);
	}

	private computeMaxFocus(attributeTree: AttributeTree): DerivedStat<number> {
		const mind = attributeTree.valueOf(StatType.Mind);
		const value = Math.max(1, 4 + mind);
		return new DerivedStat(value, `Max Focus Points = max(1, 4 + ${mind} (Mind))`);
	}

	private computeMaxSpirit(attributeTree: AttributeTree): DerivedStat<number> {
		const soul = attributeTree.valueOf(StatType.Soul);
		const value = Math.max(1, 4 + soul);
		return new DerivedStat(value, `Max Spirit Points = max(1, 4 + ${soul} (Soul))`);
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

	// Get all feat slots as slot-to-feat mapping
	getFeatSlots(): Record<string, string> {
		const featSlots: Record<string, string> = {};
		for (const [key, value] of Object.entries(this._props)) {
			if (key.startsWith('feat-') && value) {
				featSlots[key] = value;
			}
		}
		return featSlots;
	}

	// Get all feats from character props (backward compatibility)
	getFeats(): string[] {
		const featSlots = this.getFeatSlots();
		return Object.values(featSlots);
	}

	// Check if character has a specific feat
	hasFeat(featId: string): boolean {
		const featSlots = this.getFeatSlots();
		return Object.values(featSlots).includes(featId);
	}

	// Get feat for a specific slot
	getFeatForSlot(slotId: string): string | null {
		return this._props[slotId] || null;
	}

	// Set feat for a specific slot
	setFeatForSlot(slotId: string, featId: string): void {
		this._props[slotId] = featId;
	}

	// Remove feat from a specific slot
	removeFeatFromSlot(slotId: string): void {
		delete this._props[slotId];
	}

	// Get modifiers from feats
	getFeatModifiers(): Modifier[] {
		const modifiers: Modifier[] = [];
		const feats = this.getFeats();

		for (const featId of feats) {
			// Handle dynamic upbringing modifiers
			if (featId.startsWith('upbringing-')) {
				const upbringingFeat = getUpbringingModifierFeat(
					this.race.upbringing,
					this.race.upbringingPlusModifier,
					this.race.upbringingMinusModifier
				);
				if (upbringingFeat.modifiers) {
					modifiers.push(...upbringingFeat.modifiers);
				}
			} else {
				const feat = FEATS[featId];
				if (feat && feat.modifiers) {
					modifiers.push(...feat.modifiers);
				}
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
						attributeType: StatType.DEX,
						description: `Dexterity penalty from wearing ${armor.name}`,
					});
				}
			});

		return modifiers;
	}

	getBasicAttacks(): BasicAttack[] {
		const tree = this.getAttributeTree();
		const attacks: BasicAttack[] = [];

		// Add weapon attacks
		this.equipment.items
			.filter(item => item instanceof Weapon)
			.forEach(item => {
				const weapon = item as Weapon;
				const name = weapon.name;
				attacks.push({
					name: name,
					description: `${name} (+${weapon.bonus})`,
					check: {
						attribute: weapon.attribute,
						bonus: weapon.bonus,
						modifier: tree.valueOf(weapon.attribute) + weapon.bonus,
					},
				});
			});

		// Add Shield Bash if a shield is equipped
		const hasShield = this.equipment.items.some(item => item instanceof Shield);
		if (hasShield) {
			attacks.push({
				name: 'Shield Bash',
				description: 'Shield Bash',
				check: {
					attribute: StatType.STR,
					bonus: 1,
					modifier: tree.valueOf(StatType.STR) + 1,
				},
			});
		}

		// Add Unarmed attack (always available)
		attacks.push({
			name: 'Unarmed',
			description: 'Unarmed',
			check: {
				attribute: StatType.STR,
				bonus: 0,
				modifier: tree.valueOf(StatType.STR),
			},
		});

		return attacks;
	}

	getBasicDefense(type: DefenseType): DerivedStat<number> {
		const sizeModifier = SizeModifiers[this.derivedStats.size.value];
		const armorBonus = this.equipment.items
			.filter(item => item instanceof Armor)
			.reduce((acc, item) => acc + (item as Armor).bonus, 0);
		switch (type) {
			case DefenseType.Basic: {
				const body = this.getAttributeTree().valueOf(StatType.Body);
				const defense = body - sizeModifier + armorBonus;
				return {
					value: defense,
					description: `Basic Defense = ${body} (Body) - ${sizeModifier} (size modifier) + ${armorBonus} (armor bonus)`,
				};
			}
			case DefenseType.Dodge: {
				const evasiveness = this.getAttributeTree().valueOf(StatType.Evasiveness);
				const defense = evasiveness - sizeModifier + armorBonus + 3;
				return {
					value: defense,
					description: `Dodge Defense = ${evasiveness} (Evasiveness) - ${sizeModifier} (size modifier) + ${armorBonus} (armor bonus) + 3 (base)`,
				};
			}
			case DefenseType.Shield: {
				const body = this.getAttributeTree().valueOf(StatType.Body);
				const shieldBonus = this.equipment.items
					.filter(item => item instanceof Shield)
					.reduce((acc, item) => acc + (item as Shield).bonus, 0);
				const defense = body - sizeModifier + armorBonus + shieldBonus;
				return {
					value: defense,
					description: `Shield Defense = ${body} (Body) - ${sizeModifier} (size modifier) + ${armorBonus} (armor bonus) + ${shieldBonus} (shield bonus)`,
				};
			}
		}
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
			{ attributeType: StatType.DEX, value: 1 },
			{ attributeType: StatType.CON, value: -1 },
		],
		size: Size.M,
	},
	[Race.Dwarf]: {
		name: Race.Dwarf,
		modifiers: [
			{ attributeType: StatType.CON, value: 1 },
			{ attributeType: StatType.DEX, value: -1 },
		],
		size: Size.S,
	},
	[Race.Orc]: {
		name: Race.Orc,
		modifiers: [
			{ attributeType: StatType.STR, value: 1 },
			{ attributeType: StatType.DEX, value: -1 },
		],
		size: Size.L,
	},
	[Race.Fey]: {
		name: Race.Fey,
		modifiers: [
			{ attributeType: StatType.DEX, value: 1 },
			{ attributeType: StatType.STR, value: -1 },
		],
		size: Size.S,
	},
	[Race.Goliath]: {
		name: Race.Goliath,
		modifiers: [
			{ attributeType: StatType.STR, value: 1 },
			{ attributeType: StatType.CON, value: -1 },
		],
		size: Size.L,
	},
	[Race.Goblin]: {
		name: Race.Goblin,
		modifiers: [
			{ attributeType: StatType.CON, value: 1 },
			{ attributeType: StatType.STR, value: -1 },
		],
		size: Size.S,
	},
};

// Define the class definitions for all 30 classes
export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
	// Warriors - Melee (STR)
	[CharacterClass.Fighter]: {
		name: CharacterClass.Fighter,
		primaryAttribute: StatType.STR,
		archetype: 'Warrior',
		role: 'Melee',
		flavor: 'Martial',
	},
	[CharacterClass.Berserker]: {
		name: CharacterClass.Berserker,
		primaryAttribute: StatType.STR,
		archetype: 'Warrior',
		role: 'Melee',
		flavor: 'Survivalist',
	},
	[CharacterClass.Swashbuckler]: {
		name: CharacterClass.Swashbuckler,
		primaryAttribute: StatType.STR,
		archetype: 'Warrior',
		role: 'Melee',
		flavor: 'Scoundrel',
	},
	// Warriors - Ranged (DEX)
	[CharacterClass.Marksman]: {
		name: CharacterClass.Marksman,
		primaryAttribute: StatType.DEX,
		archetype: 'Warrior',
		role: 'Ranged',
		flavor: 'Martial',
	},
	[CharacterClass.Hunter]: {
		name: CharacterClass.Hunter,
		primaryAttribute: StatType.DEX,
		archetype: 'Warrior',
		role: 'Ranged',
		flavor: 'Survivalist',
	},
	[CharacterClass.Rogue]: {
		name: CharacterClass.Rogue,
		primaryAttribute: StatType.DEX,
		archetype: 'Warrior',
		role: 'Ranged',
		flavor: 'Scoundrel',
	},
	// Warriors - Tank (CON)
	[CharacterClass.Guardian]: {
		name: CharacterClass.Guardian,
		primaryAttribute: StatType.CON,
		archetype: 'Warrior',
		role: 'Tank',
		flavor: 'Martial',
	},
	[CharacterClass.Barbarian]: {
		name: CharacterClass.Barbarian,
		primaryAttribute: StatType.CON,
		archetype: 'Warrior',
		role: 'Tank',
		flavor: 'Survivalist',
	},
	[CharacterClass.Scout]: {
		name: CharacterClass.Scout,
		primaryAttribute: StatType.CON,
		archetype: 'Warrior',
		role: 'Tank',
		flavor: 'Scoundrel',
	},
	// Casters - Erudite (INT)
	[CharacterClass.Wizard]: {
		name: CharacterClass.Wizard,
		primaryAttribute: StatType.INT,
		archetype: 'Caster',
		role: 'Erudite',
		flavor: 'Arcanist',
	},
	[CharacterClass.Engineer]: {
		name: CharacterClass.Engineer,
		primaryAttribute: StatType.INT,
		archetype: 'Caster',
		role: 'Erudite',
		flavor: 'Mechanist',
	},
	[CharacterClass.Alchemist]: {
		name: CharacterClass.Alchemist,
		primaryAttribute: StatType.INT,
		archetype: 'Caster',
		role: 'Erudite',
		flavor: 'Naturalist',
	},
	[CharacterClass.Storyteller]: {
		name: CharacterClass.Storyteller,
		primaryAttribute: StatType.INT,
		archetype: 'Caster',
		role: 'Erudite',
		flavor: 'Musicist',
	},
	// Casters - Intuitive (WIS)
	[CharacterClass.Mage]: {
		name: CharacterClass.Mage,
		primaryAttribute: StatType.WIS,
		archetype: 'Caster',
		role: 'Intuitive',
		flavor: 'Arcanist',
	},
	[CharacterClass.Artificer]: {
		name: CharacterClass.Artificer,
		primaryAttribute: StatType.WIS,
		archetype: 'Caster',
		role: 'Intuitive',
		flavor: 'Mechanist',
	},
	[CharacterClass.Druid]: {
		name: CharacterClass.Druid,
		primaryAttribute: StatType.WIS,
		archetype: 'Caster',
		role: 'Intuitive',
		flavor: 'Naturalist',
	},
	[CharacterClass.Minstrel]: {
		name: CharacterClass.Minstrel,
		primaryAttribute: StatType.WIS,
		archetype: 'Caster',
		role: 'Intuitive',
		flavor: 'Musicist',
	},
	// Casters - Innate (CHA)
	[CharacterClass.Sorcerer]: {
		name: CharacterClass.Sorcerer,
		primaryAttribute: StatType.CHA,
		archetype: 'Caster',
		role: 'Innate',
		flavor: 'Arcanist',
	},
	[CharacterClass.Machinist]: {
		name: CharacterClass.Machinist,
		primaryAttribute: StatType.CHA,
		archetype: 'Caster',
		role: 'Innate',
		flavor: 'Mechanist',
	},
	[CharacterClass.Shaman]: {
		name: CharacterClass.Shaman,
		primaryAttribute: StatType.CHA,
		archetype: 'Caster',
		role: 'Innate',
		flavor: 'Naturalist',
	},
	[CharacterClass.Bard]: {
		name: CharacterClass.Bard,
		primaryAttribute: StatType.CHA,
		archetype: 'Caster',
		role: 'Innate',
		flavor: 'Musicist',
	},
	// Mystics - Disciple (DIV)
	[CharacterClass.Cleric]: {
		name: CharacterClass.Cleric,
		primaryAttribute: StatType.DIV,
		archetype: 'Mystic',
		role: 'Disciple',
		flavor: 'Pure',
	},
	[CharacterClass.Warlock]: {
		name: CharacterClass.Warlock,
		primaryAttribute: StatType.DIV,
		archetype: 'Mystic',
		role: 'Disciple',
		flavor: 'Mixed',
	},
	[CharacterClass.Paladin]: {
		name: CharacterClass.Paladin,
		primaryAttribute: StatType.DIV,
		archetype: 'Mystic',
		role: 'Disciple',
		flavor: 'Martial',
	},
	// Mystics - Adept (FOW)
	[CharacterClass.Sage]: {
		name: CharacterClass.Sage,
		primaryAttribute: StatType.FOW,
		archetype: 'Mystic',
		role: 'Adept',
		flavor: 'Pure',
	},
	[CharacterClass.Monk]: {
		name: CharacterClass.Monk,
		primaryAttribute: StatType.FOW,
		archetype: 'Mystic',
		role: 'Adept',
		flavor: 'Mixed',
	},
	[CharacterClass.Ranger]: {
		name: CharacterClass.Ranger,
		primaryAttribute: StatType.FOW,
		archetype: 'Mystic',
		role: 'Adept',
		flavor: 'Martial',
	},
	// Mystics - Inspired (LCK)
	[CharacterClass.Wanderer]: {
		name: CharacterClass.Wanderer,
		primaryAttribute: StatType.LCK,
		archetype: 'Mystic',
		role: 'Inspired',
		flavor: 'Pure',
	},
	[CharacterClass.Wayfarer]: {
		name: CharacterClass.Wayfarer,
		primaryAttribute: StatType.LCK,
		archetype: 'Mystic',
		role: 'Inspired',
		flavor: 'Mixed',
	},
	[CharacterClass.Warden]: {
		name: CharacterClass.Warden,
		primaryAttribute: StatType.LCK,
		archetype: 'Mystic',
		role: 'Inspired',
		flavor: 'Martial',
	},
};
