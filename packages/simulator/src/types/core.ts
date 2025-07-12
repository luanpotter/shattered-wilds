import type { RollType } from '../components/DiceRollModal';

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
	static readonly Presence = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.CHA,
		'Presence',
		'Personal magnetism, body language, physical attractiveness, and non-verbal communication through physical presence'
	);
	static readonly Empathy = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.CHA,
		'Empathy',
		'Reading people, understanding emotions and motivations, connecting with others on an emotional level'
	);
	static readonly Revelation = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.DIV,
		'Revelation',
		'Your ability to channel messages, visions or revelations from your deity'
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
	static readonly Karma = new AttributeType(
		AttributeHierarchy.Skill,
		AttributeType.LCK,
		'Karma',
		'Resistance to harm and causing misfortune to those who would harm you'
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

// Modifier represents bonuses/penalties from different sources
export interface Modifier {
	source: string;
	value: number;
	attributeType: AttributeType;
	description?: string;
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

export class DerivedStat<T> {
	value: T;
	description: string;

	constructor(value: T, description: string) {
		this.value = value;
		this.description = description;
	}
}

export interface GridState {
	scale: number;
	offset: Point;
}

export interface BasicAttack {
	name: string;
	description: string;
	check: Check;
}

export interface Check {
	attribute: AttributeType;
	bonus: number;
	modifier: number;
}

export enum DefenseType {
	Basic = 'Basic',
	Dodge = 'Dodge',
	Shield = 'Shield',
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
		| 'feats-setup'
		| 'basic-attacks'
		| 'dice-roll'
		| 'attack-action'
		| 'measure';
	characterId?: string;
	position: Point;
	hexPosition?: HexPosition;
	modifier?: number;
	attributeName?: string;
	characterSheet?: any; // Will be properly typed in character-sheet.ts
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

export function getCharacterInitials(character: { props: { name: string } }): string {
	const words = character.props.name.split(' ');
	if (words.length === 1) {
		// Single word, return up to first 2 characters, uppercased
		return words[0].slice(0, 2).toUpperCase();
	} else {
		// Multiple words, return first letter of each word, uppercased
		return words
			.slice(0, 2) // Take first 2 words max
			.map(word => word.charAt(0))
			.join('')
			.toUpperCase();
	}
}
