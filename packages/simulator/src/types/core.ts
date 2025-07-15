// TODO(luan): rename to CheckType, there are 4 combinations
export type RollType = 'Static' | 'Contested (Active)' | 'Contested (Resisted)';

export enum StatHierarchy {
	Level = 'Level',
	Realm = 'Realm',
	Attribute = 'Attribute',
	Skill = 'Skill',
}

export const StatHierarchyProperties: {
	[key in StatHierarchy]: { baseMultiplier: number };
} = {
	[StatHierarchy.Level]: { baseMultiplier: 1 / 4 },
	[StatHierarchy.Realm]: { baseMultiplier: 1 / 2 },
	[StatHierarchy.Attribute]: { baseMultiplier: 1 },
	[StatHierarchy.Skill]: { baseMultiplier: 1 },
};

export class StatType {
	static readonly Level = new StatType(
		StatHierarchy.Level,
		null,
		'Level',
		'Overall indicator of how competent you are, your proficiency.'
	);
	static readonly Body = new StatType(
		StatHierarchy.Realm,
		StatType.Level,
		'Body',
		'Physique; determines your Vitality Points'
	);
	static readonly Mind = new StatType(
		StatHierarchy.Realm,
		StatType.Level,
		'Mind',
		'Intellect; determines your Focus Points'
	);
	static readonly Soul = new StatType(
		StatHierarchy.Realm,
		StatType.Level,
		'Soul',
		'Life force; determines your Spirit Points'
	);
	static readonly STR = new StatType(StatHierarchy.Attribute, StatType.Body, 'STR', 'Strength');
	static readonly DEX = new StatType(StatHierarchy.Attribute, StatType.Body, 'DEX', 'Dexterity');
	static readonly CON = new StatType(StatHierarchy.Attribute, StatType.Body, 'CON', 'Constitution');
	static readonly INT = new StatType(StatHierarchy.Attribute, StatType.Mind, 'INT', 'Intelligence');
	static readonly WIS = new StatType(StatHierarchy.Attribute, StatType.Mind, 'WIS', 'Wisdom');
	static readonly CHA = new StatType(StatHierarchy.Attribute, StatType.Mind, 'CHA', 'Charisma');
	static readonly DIV = new StatType(StatHierarchy.Attribute, StatType.Soul, 'DIV', 'Divinity');
	static readonly FOW = new StatType(
		StatHierarchy.Attribute,
		StatType.Soul,
		'FOW',
		'Force of Will'
	);
	static readonly LCK = new StatType(StatHierarchy.Attribute, StatType.Soul, 'LCK', 'Luck');
	static readonly Muscles = new StatType(
		StatHierarchy.Skill,
		StatType.STR,
		'Muscles',
		'Raw power you can impact in a short burst, e.g. pulling a stuck lever, breaking down an inanimate object, smashing a mug on your hands'
	);
	static readonly Stance = new StatType(
		StatHierarchy.Skill,
		StatType.STR,
		'Stance',
		'How hard it is to move or push you around, how well you can keep your stance, resist being pushed back'
	);
	static readonly Lift = new StatType(
		StatHierarchy.Skill,
		StatType.STR,
		'Lift',
		'How much weight you can lift and carry for short periods of times, including yourself (climbing, using ropes, etc)'
	);
	static readonly Finesse = new StatType(
		StatHierarchy.Skill,
		StatType.DEX,
		'Finesse',
		'Aim, Quick Fingers, Sleight of Hand, precise hand movement'
	);
	static readonly Evasiveness = new StatType(
		StatHierarchy.Skill,
		StatType.DEX,
		'Evasiveness',
		'Evasion, Acrobatics, precise movement of the body'
	);
	static readonly Agility = new StatType(
		StatHierarchy.Skill,
		StatType.DEX,
		'Agility',
		'Speed, how fast you can move and do things'
	);
	static readonly Toughness = new StatType(
		StatHierarchy.Skill,
		StatType.CON,
		'Toughness',
		'Damage reduction, tough skin, fall damage'
	);
	static readonly Stamina = new StatType(
		StatHierarchy.Skill,
		StatType.CON,
		'Stamina',
		'Breath, how much exert yourself in a short period of time, your ability to sustain athleticism'
	);
	static readonly Resilience = new StatType(
		StatHierarchy.Skill,
		StatType.CON,
		'Resilience',
		'Resistance to sickness, poison, disease'
	);
	static readonly IQ = new StatType(
		StatHierarchy.Skill,
		StatType.INT,
		'IQ',
		'Ability to learn new information, apply logic'
	);
	static readonly Knowledge = new StatType(
		StatHierarchy.Skill,
		StatType.INT,
		'Knowledge',
		'Consolidated knowledge and lore about the world'
	);
	static readonly Memory = new StatType(
		StatHierarchy.Skill,
		StatType.INT,
		'Memory',
		'Short-term memory, ability to recall details'
	);
	static readonly Perception = new StatType(
		StatHierarchy.Skill,
		StatType.WIS,
		'Perception',
		'Active perception, seeing, hearing, sensing, feeling'
	);
	static readonly Awareness = new StatType(
		StatHierarchy.Skill,
		StatType.WIS,
		'Awareness',
		'Alertness, passive perception, attention to details when not paying attention'
	);
	static readonly Intuition = new StatType(
		StatHierarchy.Skill,
		StatType.WIS,
		'Intuition',
		'Common Sense, "Street Smarts", cunning, eg Survival or Animal Handling would be base Intuition (plus any aspect specific bonuses)'
	);
	static readonly Speechcraft = new StatType(
		StatHierarchy.Skill,
		StatType.CHA,
		'Speechcraft',
		'Rhetoric, speech, ability to persuade, inspire or deceit with language'
	);
	static readonly Presence = new StatType(
		StatHierarchy.Skill,
		StatType.CHA,
		'Presence',
		'Personal magnetism, body language, physical attractiveness, and non-verbal communication through physical presence'
	);
	static readonly Empathy = new StatType(
		StatHierarchy.Skill,
		StatType.CHA,
		'Empathy',
		'Reading people, understanding emotions and motivations, connecting with others on an emotional level'
	);
	static readonly Revelation = new StatType(
		StatHierarchy.Skill,
		StatType.DIV,
		'Revelation',
		'Your ability to channel messages, visions or revelations from your deity'
	);
	static readonly Attunement = new StatType(
		StatHierarchy.Skill,
		StatType.DIV,
		'Attunement',
		'Your general attunement to the Aether, how well you can let divine forces flow through you'
	);
	static readonly Devotion = new StatType(
		StatHierarchy.Skill,
		StatType.DIV,
		'Devotion',
		'Your personal connection to your specific Deity [must have one]'
	);
	static readonly Discipline = new StatType(
		StatHierarchy.Skill,
		StatType.FOW,
		'Discipline',
		'Ability to resist urges and temptations, vices and instant gratification'
	);
	static readonly Tenacity = new StatType(
		StatHierarchy.Skill,
		StatType.FOW,
		'Tenacity',
		'Concentration, ability to ignore pain or hardship or being disturbed and keep going'
	);
	static readonly Resolve = new StatType(
		StatHierarchy.Skill,
		StatType.FOW,
		'Resolve',
		'Resistance to mind control, social manipulation, deceit, charm; fortitude of the mind; insight'
	);
	static readonly Karma = new StatType(
		StatHierarchy.Skill,
		StatType.LCK,
		'Karma',
		'Resistance to harm and causing misfortune to those who would harm you'
	);
	static readonly Fortune = new StatType(
		StatHierarchy.Skill,
		StatType.LCK,
		'Fortune',
		'Your personal luck for your own actions, mainly used for the Luck Die mechanic'
	);
	static readonly Serendipity = new StatType(
		StatHierarchy.Skill,
		StatType.LCK,
		'Serendipity',
		'Expectations for the external world, also used for the Write History mechanic'
	);

	private constructor(
		public readonly hierarchy: StatHierarchy,
		public readonly parent: StatType | null,
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
	attributeType: StatType;
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

export interface BasicAttack {
	name: string;
	description: string;
	check: Check;
}

export interface Check {
	attribute: StatType;
	bonus: number;
	modifier: number;
}

export enum DefenseType {
	Basic = 'Basic',
	Dodge = 'Dodge',
	Shield = 'Shield',
}
