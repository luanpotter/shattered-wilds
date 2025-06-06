import type { RollType } from './components/DiceRollModal';

export interface Point {
	x: number;
	y: number;
}

export interface HexPosition {
	q: number;
	r: number;
}

export type DragType = 'none' | 'window' | 'grid' | 'character';

export interface DragState {
	type: DragType;
	objectId?: string;
	startPosition?: Point;
	offset?: Point;
}

export enum Race {
	Human = 'Human',
	Elf = 'Elf',
	Dwarf = 'Dwarf',
	Orc = 'Orc',
	Fey = 'Fey',
	Goliath = 'Goliath',
	Tellur = 'Tellur',
}

export enum Size {
	F = 'Fine',
	D = 'Diminutive',
	T = 'Tiny',
	S = 'Small',
	M = 'Medium',
	L = 'Large',
	H = 'Huge',
	G = 'Gargantuan',
	C = 'Colossal',
}

export const SizeModifiers: Record<Size, number> = {
	[Size.F]: -8,
	[Size.D]: -4,
	[Size.T]: -2,
	[Size.S]: -1,
	[Size.M]: 0,
	[Size.L]: 1,
	[Size.H]: 2,
	[Size.G]: 4,
	[Size.C]: 8,
};

// Define a structure for race attribute modifiers, but move the implementation after AttributeType is defined
export interface AttributeModifier {
	attributeType: AttributeType;
	value: number;
}

export interface RaceDefinition {
	name: Race;
	modifiers: AttributeModifier[];
	size: Size;
}

export class RaceInfo {
	primaryRace: Race;
	halfRace: Race | null;
	combineHalfRaceStats: boolean;

	constructor(
		primaryRace: Race,
		halfRace: Race | null = null,
		combineHalfRaceStats: boolean = false
	) {
		this.primaryRace = primaryRace;
		this.halfRace = halfRace;
		this.combineHalfRaceStats = combineHalfRaceStats;
	}

	static from(props: Record<string, string>): RaceInfo {
		const primaryRace = (props['race'] as Race) ?? Race.Human;
		const halfRace = props['race.half'] ? (props['race.half'] as Race) : null;
		const combineHalfRaceStats = props['race.half.combined-stats'] === 'true';

		return new RaceInfo(primaryRace, halfRace, combineHalfRaceStats);
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
	// Mystics - Adept (DIV)
	Cleric = 'Cleric',
	Warlock = 'Warlock',
	Paladin = 'Paladin',
	// Mystics - Disciple (FOW)
	Sage = 'Sage',
	Monk = 'Monk',
	Ranger = 'Ranger',
	// Mystics - Inspired (LCK)
	Wanderer = 'Wanderer',
	Wayfarer = 'Wayfarer',
	Warden = 'Warden',
}

// Attribute system enums and types
export enum AttributeHierarchy {
	Level = 'Level',
	Realm = 'Realm',
	BasicAttribute = 'BasicAttribute',
	Skill = 'Skill',
}

export const AttributeHierarchyProperties: {
	[key in AttributeHierarchy]: { baseMultiplier: number };
} = {
	[AttributeHierarchy.Level]: { baseMultiplier: 1 / 4 },
	[AttributeHierarchy.Realm]: { baseMultiplier: 1 / 2 },
	[AttributeHierarchy.BasicAttribute]: { baseMultiplier: 1 },
	[AttributeHierarchy.Skill]: { baseMultiplier: 1 },
};

export class AttributeType {
	static readonly Level = new AttributeType(
		AttributeHierarchy.Level,
		null,
		'Level',
		'Overall indicator of how competent you are, your proficiency.'
	);
	static readonly Body = new AttributeType(
		AttributeHierarchy.Realm,
		AttributeType.Level,
		'Body',
		'Physique; determines your Vitality Points'
	);
	static readonly Mind = new AttributeType(
		AttributeHierarchy.Realm,
		AttributeType.Level,
		'Mind',
		'Intellect; determines your Focus Points'
	);
	static readonly Soul = new AttributeType(
		AttributeHierarchy.Realm,
		AttributeType.Level,
		'Soul',
		'Life force; determines your Spirit Points'
	);
	static readonly STR = new AttributeType(
		AttributeHierarchy.BasicAttribute,
		AttributeType.Body,
		'STR',
		'Strength'
	);
	static readonly DEX = new AttributeType(
		AttributeHierarchy.BasicAttribute,
		AttributeType.Body,
		'DEX',
		'Dexterity'
	);
	static readonly CON = new AttributeType(
		AttributeHierarchy.BasicAttribute,
		AttributeType.Body,
		'CON',
		'Constitution'
	);
	static readonly INT = new AttributeType(
		AttributeHierarchy.BasicAttribute,
		AttributeType.Mind,
		'INT',
		'Intelligence'
	);
	static readonly WIS = new AttributeType(
		AttributeHierarchy.BasicAttribute,
		AttributeType.Mind,
		'WIS',
		'Wisdom'
	);
	static readonly CHA = new AttributeType(
		AttributeHierarchy.BasicAttribute,
		AttributeType.Mind,
		'CHA',
		'Charisma'
	);
	static readonly DIV = new AttributeType(
		AttributeHierarchy.BasicAttribute,
		AttributeType.Soul,
		'DIV',
		'Divinity'
	);
	static readonly FOW = new AttributeType(
		AttributeHierarchy.BasicAttribute,
		AttributeType.Soul,
		'FOW',
		'Force of Will'
	);
	static readonly LCK = new AttributeType(
		AttributeHierarchy.BasicAttribute,
		AttributeType.Soul,
		'LCK',
		'Luck'
	);
	static readonly Muscles = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.STR,
		'Muscles',
		'Raw power you can impact in a short burst, e.g. pulling a stuck lever, breaking down an inanimate object, smashing a mug on your hands'
	);
	static readonly Stance = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.STR,
		'Stance',
		'How hard it is to move or push you around, how well you can keep your stance, resist being pushed back'
	);
	static readonly Lift = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.STR,
		'Lift',
		'How much weight you can lift and carry for short periods of times, including yourself (climbing, using ropes, etc)'
	);
	static readonly Finesse = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.DEX,
		'Finesse',
		'Aim, Quick Fingers, Sleight of Hand, precise hand movement'
	);
	static readonly Evasiveness = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.DEX,
		'Evasiveness',
		'Evasion, Acrobatics, precise movement of the body'
	);
	static readonly Agility = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.DEX,
		'Agility',
		'Speed, how fast you can move and do things'
	);
	static readonly Toughness = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.CON,
		'Toughness',
		'Damage reduction, tough skin, fall damage'
	);
	static readonly Stamina = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.CON,
		'Stamina',
		'Breath, how much exert yourself in a short period of time, your ability to sustain athleticism'
	);
	static readonly Resilience = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.CON,
		'Resilience',
		'Resistance to sickness, poison, disease'
	);
	static readonly IQ = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.INT,
		'IQ',
		'Ability to learn new information, apply logic'
	);
	static readonly Knowledge = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.INT,
		'Knowledge',
		'Consolidated knowledge and lore about the world'
	);
	static readonly Memory = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.INT,
		'Memory',
		'Short-term memory, ability to recall details'
	);
	static readonly Perception = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.WIS,
		'Perception',
		'Active perception, seeing, hearing, sensing, feeling'
	);
	static readonly Awareness = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.WIS,
		'Awareness',
		'Alertness, passive perception, attention to details when not paying attention'
	);
	static readonly Intuition = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.WIS,
		'Intuition',
		'Common Sense, "Street Smarts", cunning, eg Survival or Animal Handling would be base Intuition (plus any aspect specific bonuses)'
	);
	static readonly Speechcraft = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.CHA,
		'Speechcraft',
		'Rhetoric, speech, ability to persuade, inspire or deceit with language'
	);
	static readonly Charm = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.CHA,
		'Charm',
		'Natural panache, beguilingness, body language'
	);
	static readonly Appearance = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.CHA,
		'Appearance',
		'Physical attractiveness, ability to dress and present well, body odor'
	);
	static readonly Faith = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.DIV,
		'Faith',
		'Strength of your belief your deity [must have one], knowledge about your faith, effectiveness of your Prayers'
	);
	static readonly Attunement = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.DIV,
		'Attunement',
		'Your general attunement to the Aether, how well you can let divine forces flow through you'
	);
	static readonly Devotion = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.DIV,
		'Devotion',
		'Your personal connection to your specific Deity [must have one]'
	);
	static readonly Discipline = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.FOW,
		'Discipline',
		'Ability to resist urges and temptations, vices and instant gratification'
	);
	static readonly Tenacity = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.FOW,
		'Tenacity',
		'Concentration, ability to ignore pain or hardship or being disturbed and keep going'
	);
	static readonly Resolve = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.FOW,
		'Resolve',
		'Resistance to mind control, social manipulation, deceit, charm; fortitude of the mind; insight'
	);
	static readonly Gambling = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.LCK,
		'Gambling',
		'Specifically for when you are gambling'
	);
	static readonly Fortune = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.LCK,
		'Fortune',
		'Your personal luck for your own actions, mainly used for the Luck Die mechanic'
	);
	static readonly Serendipity = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.LCK,
		'Serendipity',
		'Expectations for the external world, also used for the Write History mechanic'
	);

	private constructor(
		public readonly hierarchy: AttributeHierarchy,
		public readonly parent: AttributeType | null,
		public readonly name: string,
		public readonly description: string
	) {}

	toString(): string {
		return this.name;
	}
}

export class AttributeTree {
	root: Attribute;
	modifiers: Modifier[];

	constructor(root: Attribute, modifiers: Modifier[]) {
		this.root = root;
		this.modifiers = modifiers;
	}

	// level getter
	get level(): number {
		return this.root.baseValue;
	}

	private isApplicableModifier(mod: Modifier, node: Attribute): boolean {
		if (mod.attributeType === node.type) {
			return true;
		}
		const parent = this.root.getNode(node.type.parent);
		if (parent !== null) {
			return this.isApplicableModifier(mod, parent);
		}
		return false;
	}

	// Get modifiers applicable to this attribute from a list of modifiers
	getApplicableModifiers(node: Attribute): Modifier[] {
		return this.modifiers.filter(mod => this.isApplicableModifier(mod, node));
	}

	// Calculate total modifier value for this attribute
	getTotalModifierValue(node: Attribute): number {
		return this.getApplicableModifiers(node).reduce((total, mod) => total + mod.value, 0);
	}

	valueOf(type: AttributeType): number {
		const node = this.root.getNode(type);
		if (node == null) {
			throw new Error(`Attribute type ${type.name} not found`);
		}
		return this.getFinalModifier(node).value;
	}

	// Get the base modifier (node + parent) with level cap applied
	private getBaseModifier(node: Attribute): number {
		return Math.ceil(
			node.baseValue * AttributeHierarchyProperties[node.type.hierarchy].baseMultiplier
		);
	}

	// Get the parent modifier with level cap applied
	private getParentModifier(node: Attribute): number {
		const parentType = node.type.parent;
		if (parentType == null) {
			return 0;
		}
		const parent = this.root.getNode(parentType);
		if (parent == null) {
			return 0;
		}
		return this.getFinalModifier(parent).baseValue;
	}

	// Get the final modifier including derived modifiers
	getFinalModifier(node: Attribute): AttributeValue {
		return new AttributeValue(
			this.getParentModifier(node),
			node.baseValue,
			this.getBaseModifier(node),
			this.level, // level cap
			this.getApplicableModifiers(node) // modifiers
		);
	}
}

export class Attribute {
	type: AttributeType;
	baseValue: number;
	children: Attribute[];

	constructor(type: AttributeType, baseValue: number = 0, children: Attribute[] = []) {
		this.type = type;
		this.baseValue = baseValue;
		this.children = children;
	}

	// Computed properties
	get totalPointsToPropagate(): number {
		return Math.max(this.baseValue - 1, 0);
	}

	get childrenAllocatedPoints(): number {
		return this.children.reduce((acc, child) => acc + child.baseValue, 0);
	}

	get unallocatedPoints(): number {
		return this.totalPointsToPropagate - this.childrenAllocatedPoints;
	}

	get canChildrenAllocatePoint(): boolean {
		if (this.children.length === 0) {
			return false;
		}
		return this.unallocatedPoints > 0;
	}

	get canDeallocatePoint(): boolean {
		if (this.baseValue === 0) {
			return false;
		}
		if (this.childrenAllocatedPoints === 0) {
			return true;
		}
		return this.childrenAllocatedPoints < this.totalPointsToPropagate;
	}

	hasUnallocatedPoints(): boolean {
		return (
			this.canChildrenAllocatePoint || this.children.some(child => child.hasUnallocatedPoints())
		);
	}

	reset(): { key: string; value: string }[] {
		return [{ key: this.type.name, value: '0' }, ...this.children.flatMap(child => child.reset())];
	}

	getNode(type: AttributeType | null): Attribute | null {
		if (type == null) {
			return null;
		}
		if (this.type.name === type.name) {
			return this;
		}
		return this.children.map(child => child.getNode(type)).find(child => child !== null) || null;
	}

	grouped(hierarchy: AttributeHierarchy): Attribute[] {
		if (this.type.hierarchy === hierarchy) {
			return [this];
		}
		return this.children.flatMap(child => child.grouped(hierarchy));
	}
}

export class AttributeValue {
	parentValue?: number;
	nodeValue: number;
	nodeModifier: number;
	levelCap: number;
	modifiers: Modifier[];

	constructor(
		parentValue: number,
		nodeValue: number,
		nodeModifier: number,
		levelCap: number,
		modifiers: Modifier[]
	) {
		this.parentValue = parentValue;
		this.nodeValue = nodeValue;
		this.nodeModifier = nodeModifier;
		this.levelCap = levelCap;
		this.modifiers = modifiers;
	}

	get uncappedBaseValue(): number {
		return this.nodeModifier + (this.parentValue ?? 0);
	}

	get baseValue(): number {
		let baseValue = this.uncappedBaseValue;
		if (this.levelCap) {
			baseValue = Math.min(baseValue, this.levelCap);
		}
		return baseValue;
	}

	get modifierValue(): number {
		return this.modifiers.reduce((acc, mod) => acc + mod.value, 0);
	}

	get value(): number {
		return this.baseValue + this.modifierValue;
	}

	get wasLevelCapped(): boolean {
		if (this.levelCap == null) {
			return false;
		}
		return this.uncappedBaseValue > this.levelCap;
	}

	get hasModifiers(): boolean {
		return this.modifiers.length > 0;
	}
}

export const makeAttributeTree = (values: Record<string, string> = {}): Attribute => {
	const attr = (type: AttributeType, children: Attribute[] = []): Attribute => {
		return new Attribute(type, parseInt(values[type.name] ?? '0'), children);
	};

	return attr(AttributeType.Level, [
		attr(AttributeType.Body, [
			attr(AttributeType.STR, [
				attr(AttributeType.Muscles),
				attr(AttributeType.Stance),
				attr(AttributeType.Lift),
			]),
			attr(AttributeType.DEX, [
				attr(AttributeType.Finesse),
				attr(AttributeType.Evasiveness),
				attr(AttributeType.Agility),
			]),
			attr(AttributeType.CON, [
				attr(AttributeType.Toughness),
				attr(AttributeType.Stamina),
				attr(AttributeType.Resilience),
			]),
		]),
		attr(AttributeType.Mind, [
			attr(AttributeType.INT, [
				attr(AttributeType.IQ),
				attr(AttributeType.Knowledge),
				attr(AttributeType.Memory),
			]),
			attr(AttributeType.WIS, [
				attr(AttributeType.Perception),
				attr(AttributeType.Awareness),
				attr(AttributeType.Intuition),
			]),
			attr(AttributeType.CHA, [
				attr(AttributeType.Speechcraft),
				attr(AttributeType.Charm),
				attr(AttributeType.Appearance),
			]),
		]),
		attr(AttributeType.Soul, [
			attr(AttributeType.DIV, [
				attr(AttributeType.Faith),
				attr(AttributeType.Attunement),
				attr(AttributeType.Devotion),
			]),
			attr(AttributeType.FOW, [
				attr(AttributeType.Discipline),
				attr(AttributeType.Tenacity),
				attr(AttributeType.Resolve),
			]),
			attr(AttributeType.LCK, [
				attr(AttributeType.Gambling),
				attr(AttributeType.Fortune),
				attr(AttributeType.Serendipity),
			]),
		]),
	]);
};

// Modifier represents bonuses/penalties from different sources
export interface Modifier {
	source: string;
	value: number;
	attributeType: AttributeType;
	description?: string;
}

export class DerivedStat<T> {
	value: T;
	description: string;

	constructor(value: T, description: string) {
		this.value = value;
		this.description = description;
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
		const agility = attributeTree.valueOf(AttributeType.Agility);
		const value = HUMANOID_BASE + sizeModifier + Math.floor(agility / 4);
		return new DerivedStat(
			Math.max(value, 1),
			`Movement = ${HUMANOID_BASE} (base) + ${sizeModifier} (size) + ${agility} (Agility) / 4`
		);
	}

	private computeInitiative(attributeTree: AttributeTree): DerivedStat<number> {
		const agility = attributeTree.valueOf(AttributeType.Agility);
		const awareness = attributeTree.valueOf(AttributeType.Awareness);
		const value = agility + awareness;
		return new DerivedStat(value, `Initiative = ${agility} (Agility) + ${awareness} (Awareness)`);
	}

	private computeMaxHeroism(attributeTree: AttributeTree): DerivedStat<number> {
		const level = attributeTree.root.baseValue;
		return new DerivedStat(level, `Max Heroism Points = ${level} (Level)`);
	}

	private computeMaxVitality(attributeTree: AttributeTree): DerivedStat<number> {
		const body = attributeTree.valueOf(AttributeType.Body);
		const value = Math.max(1, 4 + body);
		return new DerivedStat(value, `Max Vitality Points = max(1, 4 + ${body} (Body))`);
	}

	private computeMaxFocus(attributeTree: AttributeTree): DerivedStat<number> {
		const mind = attributeTree.valueOf(AttributeType.Mind);
		const value = Math.max(1, 4 + mind);
		return new DerivedStat(value, `Max Focus Points = max(1, 4 + ${mind} (Mind))`);
	}

	private computeMaxSpirit(attributeTree: AttributeTree): DerivedStat<number> {
		const soul = attributeTree.valueOf(AttributeType.Soul);
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

	constructor(
		name: string,
		race: RaceInfo,
		characterClass: ClassInfo,
		attributes: Attribute,
		equipment: Equipment,
		currentValues: CurrentValues
	) {
		this.name = name;
		this.race = race;
		this.characterClass = characterClass;
		this.attributes = attributes;
		this.equipment = equipment;

		this.derivedStats = new DerivedStats(this.race, this.getAttributeTree());
		this.currentValues = currentValues;
	}

	getAttributeTree(): AttributeTree {
		return new AttributeTree(this.attributes, this.getAllModifiers());
	}

	// Get all modifiers from all sources (race, class, equipment, etc.)
	getAllModifiers(): Modifier[] {
		const modifiers: Modifier[] = [];

		// Add race modifiers
		modifiers.push(...this.race.getModifiers());

		// Add class modifiers
		modifiers.push(...this.characterClass.getModifiers());

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
		const tree = this.getAttributeTree();
		return this.equipment.items
			.filter(item => item instanceof Weapon)
			.map(item => {
				const weapon = item as Weapon;
				return {
					name: weapon.name,
					check: {
						attribute: weapon.attribute,
						bonus: weapon.bonus,
						modifier: tree.valueOf(weapon.attribute) + weapon.bonus,
					},
				};
			});
	}

	getBasicDefense(): DerivedStat<number> {
		const body = this.getAttributeTree().valueOf(AttributeType.Body);
		const sizeModifier = SizeModifiers[this.derivedStats.size.value];
		const armorBonus = this.equipment.items
			.filter(item => item instanceof Armor)
			.reduce((acc, item) => acc + (item as Armor).bonus, 0);
		const defense = body - sizeModifier + armorBonus;
		return {
			value: defense,
			description: `Basic Defense = ${body} (Body) - ${sizeModifier} (size modifier) + ${armorBonus} (armor bonus)`,
		};
	}

	static from(props: Record<string, string>): CharacterSheet {
		const sheet = new CharacterSheet(
			props['name']!!,
			RaceInfo.from(props),
			ClassInfo.from(props),
			makeAttributeTree(props),
			Equipment.from(props['equipment']),
			CurrentValues.from(props)
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

/**
 * Get character initials for display
 * - For multi-word names (e.g., "Foo Bar"), returns initials ("FB")
 * - For single-word names (e.g., "Warrior"), returns first two letters ("WA")
 */
export function getCharacterInitials(character: Character): string {
	const name = character.props.name.trim();

	// Check if name has multiple words
	if (name.includes(' ')) {
		// Split by spaces and get first letter of each word
		return name
			.split(' ')
			.map((word: string) => word.charAt(0).toUpperCase())
			.join('');
	}

	// If single word, return first two letters
	return name.slice(0, 2).toUpperCase();
}

export interface Window {
	id: string;
	title: string;
	type:
		| 'character-sheet'
		| 'character-list'
		| 'character-creation'
		| 'race-setup'
		| 'class-setup'
		| 'basic-attacks'
		| 'dice-roll'
		| 'attack-action'
		| 'measure';
	characterId?: string;
	position: Point;
	hexPosition?: HexPosition;
	modifier?: number;
	attributeName?: string;
	characterSheet?: CharacterSheet;
	initialRollType?: RollType;
	attackerId?: string;
	defenderId?: string;
	attackIndex?: number;
	fromCharacterId?: string;
	toPosition?: HexPosition;
	distance?: number;
	onDiceRollComplete?: (result: { total: number; shifts: number }) => void;
	width?: string;
	height?: string;
}

export interface GridState {
	scale: number;
	offset: Point;
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
	[Race.Tellur]: {
		name: Race.Tellur,
		modifiers: [
			{ attributeType: AttributeType.CON, value: 1 },
			{ attributeType: AttributeType.STR, value: -1 },
		],
		size: Size.S,
	},
};

export interface ClassDefinition {
	name: CharacterClass;
	primaryAttribute: AttributeType;
	archetype: 'Warrior' | 'Caster' | 'Mystic';
	role: string;
	flavor: string;
}

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
	// Mystics - Adept (DIV)
	[CharacterClass.Cleric]: {
		name: CharacterClass.Cleric,
		primaryAttribute: AttributeType.DIV,
		archetype: 'Mystic',
		role: 'Adept',
		flavor: 'Pure',
	},
	[CharacterClass.Warlock]: {
		name: CharacterClass.Warlock,
		primaryAttribute: AttributeType.DIV,
		archetype: 'Mystic',
		role: 'Adept',
		flavor: 'Mixed',
	},
	[CharacterClass.Paladin]: {
		name: CharacterClass.Paladin,
		primaryAttribute: AttributeType.DIV,
		archetype: 'Mystic',
		role: 'Adept',
		flavor: 'Martial',
	},
	// Mystics - Disciple (FOW)
	[CharacterClass.Sage]: {
		name: CharacterClass.Sage,
		primaryAttribute: AttributeType.FOW,
		archetype: 'Mystic',
		role: 'Disciple',
		flavor: 'Pure',
	},
	[CharacterClass.Monk]: {
		name: CharacterClass.Monk,
		primaryAttribute: AttributeType.FOW,
		archetype: 'Mystic',
		role: 'Disciple',
		flavor: 'Mixed',
	},
	[CharacterClass.Ranger]: {
		name: CharacterClass.Ranger,
		primaryAttribute: AttributeType.FOW,
		archetype: 'Mystic',
		role: 'Disciple',
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

export class Weapon implements Item {
	name: string;
	type: PrimaryWeaponType;
	bonus: number;
	traits: string[];
	range: number | undefined; // in meters, for thrown/ranged weapons
	attribute: AttributeType;

	constructor(
		name: string,
		type: PrimaryWeaponType,
		bonus: number,
		traits: string[],
		attribute: AttributeType,
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

export interface Item {
	name: string;
}

export class Equipment {
	items: Item[];

	constructor(items: Item[] = []) {
		this.items = items;
	}

	static from(prop: string): Equipment {
		if (!prop) return new Equipment([]);
		const raw = JSON.parse(prop) as any[];
		const items: Item[] = raw.map(obj => {
			switch (obj.type) {
				case PrimaryWeaponType.Unarmed:
				case PrimaryWeaponType.Thrown:
				case PrimaryWeaponType.LightMelee:
				case PrimaryWeaponType.Ranged:
				case PrimaryWeaponType.HeavyMelee:
					return new Weapon(
						obj.name,
						obj.type,
						obj.bonus,
						obj.traits || [],
						obj.attribute,
						obj.range
					);
				case ArmorType.Light:
				case ArmorType.Medium:
				case ArmorType.Heavy:
					return new Armor(obj.name, obj.type, obj.bonus, obj.dexPenalty);
				case ShieldType.Small:
				case ShieldType.Large:
					return new Shield(obj.name, obj.type, obj.bonus, obj.twoHanded);
				default:
					throw new Error(`Unknown item type: ${obj.type}`);
			}
		});
		return new Equipment(items);
	}

	toProp(): string {
		return JSON.stringify(this.items);
	}
}

export interface BasicAttack {
	name: string;
	check: Check;
}

export interface Check {
	attribute: AttributeType;
	bonus: number;
	modifier: number;
}
