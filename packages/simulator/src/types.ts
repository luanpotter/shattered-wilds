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

export enum CharacterClass {
	Fighter = 'Fighter',
	Berserker = 'Berserker',
	Swashbuckler = 'Swashbuckler',
	Marksman = 'Marksman',
	Hunter = 'Hunter',
	Rogue = 'Rogue',
	Guardian = 'Guardian',
	Barbarian = 'Barbarian',
	Scout = 'Scout',
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
		'Physique; determines your Vitality Points',
	);
	static readonly Mind = new AttributeType(
		AttributeHierarchy.Realm,
		AttributeType.Level,
		'Mind',
		'Intellect; determines your Focus Points',
	);
	static readonly Soul = new AttributeType(
		AttributeHierarchy.Realm,
		AttributeType.Level,
		'Soul',
		'Life force; determines your Spirit Points',
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

	get nodeModifier(): number {
		return Math.ceil(
			this.baseValue * AttributeHierarchyProperties[this.type.hierarchy].baseMultiplier
		);
	}

	hasUnallocatedPoints(): boolean {
		return this.canChildrenAllocatePoint || this.children.some(child => child.hasUnallocatedPoints());
	}

	reset(): { key: string; value: string }[] {
		return [{ key: this.type.name, value: '0' }, ...this.children.flatMap(child => child.reset())];
	}

	modifierOf(node: Attribute): number {
		return node.nodeModifier + this.parentModifier(node);
	}

	parentModifier(node: Attribute): number {
		const parentType = node.type.parent;
		if (parentType == null) {
			return 0;
		}
		const parent = this.getNode(parentType);
		if (parent == null) {
			return 0;
		}
		return this.modifierOf(parent) ?? 0;
	}


	getNode(type: AttributeType | null): Attribute | null {
		if (type == null) {
			return null;
		}
		if (this.type === type) {
			return this;
		}
		return this.children
			.map(child => child.getNode(type))
			.find(child => child !== null) || null;
	}

	grouped(hierarchy: AttributeHierarchy): Attribute[] {
		if (this.type.hierarchy === hierarchy) {
			return [this];
		}
		return this.children.flatMap(child => child.grouped(hierarchy));
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
	description?: string;
}

// Derived statistics interfaces
export interface DerivedStats {
	maxVitality: number;
	currentVitality: number;
	maxFocus: number;
	currentFocus: number;
	maxSpirit: number;
	currentSpirit: number;
	maxHeroism: number;
	currentHeroism: number;
	initiative: number;
	speed: number;
}
export class CharacterSheet {
	name: string;
	race: Race;
	characterClass: CharacterClass;
	attributes: Attribute;

	constructor(name: string, race: Race, characterClass: CharacterClass, attributes: Attribute) {
		this.name = name;
		this.race = race;
		this.characterClass = characterClass;
		this.attributes = attributes;
	}

	static from(props: Record<string, string>): CharacterSheet {
		return new CharacterSheet(
			props.name,
			(props.race as Race) ?? Race.Human,
			(props.class as CharacterClass) ?? CharacterClass.Fighter,
			makeAttributeTree(props)
		);
	}
}

export interface Character {
	id: string;
	position?: HexPosition;
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
	type: 'character-sheet' | 'character-list' | 'character-creation';
	characterId?: string;
	position: Point;
	hexPosition?: HexPosition;
}

export interface GridState {
	scale: number;
	offset: Point;
}
