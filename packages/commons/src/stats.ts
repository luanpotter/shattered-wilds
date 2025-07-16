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
	private static build = ({
		name,
		description,
		hierarchy,
		parent,
	}: {
		name: string;
		description: string;
		hierarchy: StatHierarchy;
		parent?: StatType | null;
	}): StatType => {
		return new StatType(hierarchy, parent ?? null, name, description);
	};

	static readonly Level = StatType.build({
		hierarchy: StatHierarchy.Level,
		name: 'Level',
		description: 'Overall indicator of how competent you are, your proficiency.',
	});
	static readonly Body = StatType.build({
		hierarchy: StatHierarchy.Realm,
		parent: StatType.Level,
		name: 'Body',
		description: 'Physique; determines your Vitality Points',
	});
	static readonly Mind = StatType.build({
		hierarchy: StatHierarchy.Realm,
		parent: StatType.Level,
		name: 'Mind',
		description: 'Intellect; determines your Focus Points',
	});
	static readonly Soul = StatType.build({
		hierarchy: StatHierarchy.Realm,
		parent: StatType.Level,
		name: 'Soul',
		description: 'Life force; determines your Spirit Points',
	});
	static readonly STR = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Body,
		name: 'STR',
		description: 'Strength',
	});
	static readonly DEX = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Body,
		name: 'DEX',
		description: 'Dexterity',
	});
	static readonly CON = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Body,
		name: 'CON',
		description: 'Constitution',
	});
	static readonly INT = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Mind,
		name: 'INT',
		description: 'Intelligence',
	});
	static readonly WIS = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Mind,
		name: 'WIS',
		description: 'Wisdom',
	});
	static readonly CHA = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Mind,
		name: 'CHA',
		description: 'Charisma',
	});
	static readonly DIV = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Soul,
		name: 'DIV',
		description: 'Divinity',
	});
	static readonly FOW = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Soul,
		name: 'FOW',
		description: 'Force of Will',
	});
	static readonly LCK = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Soul,
		name: 'LCK',
		description: 'Luck',
	});
	static readonly Muscles = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.STR,
		name: 'Muscles',
		description:
			'Raw power you can impact in a short burst, e.g. pulling a stuck lever, breaking down an inanimate object, smashing a mug on your hands',
	});
	static readonly Stance = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.STR,
		name: 'Stance',
		description:
			'How hard it is to move or push you around, how well you can keep your stance, resist being pushed back',
	});
	static readonly Lift = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.STR,
		name: 'Lift',
		description:
			'How much weight you can lift and carry for short periods of times, including yourself (climbing, using ropes, etc)',
	});
	static readonly Finesse = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DEX,
		name: 'Finesse',
		description: 'Aim, Quick Fingers, Sleight of Hand, precise hand movement',
	});
	static readonly Evasiveness = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DEX,
		name: 'Evasiveness',
		description: 'Evasion, Acrobatics, precise movement of the body',
	});
	static readonly Agility = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DEX,
		name: 'Agility',
		description: 'Speed, how fast you can move and do things',
	});
	static readonly Toughness = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CON,
		name: 'Toughness',
		description: 'Damage reduction, tough skin, fall damage',
	});
	static readonly Stamina = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CON,
		name: 'Stamina',
		description: 'Breath, how much exert yourself in a short period of time, your ability to sustain athleticism',
	});
	static readonly Resilience = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CON,
		name: 'Resilience',
		description: 'Resistance to sickness, poison, disease',
	});
	static readonly IQ = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.INT,
		name: 'IQ',
		description: 'Ability to learn new information, apply logic',
	});
	static readonly Knowledge = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.INT,
		name: 'Knowledge',
		description: 'Consolidated knowledge and lore about the world',
	});
	static readonly Memory = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.INT,
		name: 'Memory',
		description: 'Short-term memory, ability to recall details',
	});
	static readonly Perception = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.WIS,
		name: 'Perception',
		description: 'Active perception, seeing, hearing, sensing, feeling',
	});
	static readonly Awareness = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.WIS,
		name: 'Awareness',
		description: 'Alertness, passive perception, attention to details when not paying attention',
	});
	static readonly Intuition = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.WIS,
		name: 'Intuition',
		description:
			'Common Sense, "Street Smarts", cunning, eg Survival or Animal Handling would be base Intuition (plus any aspect specific bonuses)',
	});
	static readonly Speechcraft = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CHA,
		name: 'Speechcraft',
		description: 'Rhetoric, speech, ability to persuade, inspire or deceit with language',
	});
	static readonly Presence = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CHA,
		name: 'Presence',
		description:
			'Personal magnetism, body language, physical attractiveness, and non-verbal communication through physical presence',
	});
	static readonly Empathy = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CHA,
		name: 'Empathy',
		description: 'Reading people, understanding emotions and motivations, connecting with others on an emotional level',
	});
	static readonly Revelation = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DIV,
		name: 'Revelation',
		description: 'Your ability to channel messages, visions or revelations from your deity',
	});
	static readonly Attunement = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DIV,
		name: 'Attunement',
		description: 'Your general attunement to the Aether, how well you can let divine forces flow through you',
	});
	static readonly Devotion = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DIV,
		name: 'Devotion',
		description: 'Your personal connection to your specific Deity [must have one]',
	});
	static readonly Discipline = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.FOW,
		name: 'Discipline',
		description: 'Ability to resist urges and temptations, vices and instant gratification',
	});
	static readonly Tenacity = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.FOW,
		name: 'Tenacity',
		description: 'Concentration, ability to ignore pain or hardship or being disturbed and keep going',
	});
	static readonly Resolve = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.FOW,
		name: 'Resolve',
		description: 'Resistance to mind control, social manipulation, deceit, charm; fortitude of the mind; insight',
	});
	static readonly Karma = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.LCK,
		name: 'Karma',
		description: 'Resistance to harm and causing misfortune to those who would harm you',
	});
	static readonly Fortune = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.LCK,
		name: 'Fortune',
		description: 'Your personal luck for your own actions, mainly used for the Luck Die mechanic',
	});
	static readonly Serendipity = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.LCK,
		name: 'Serendipity',
		description: 'Expectations for the external world, also used for the Write History mechanic',
	});

	private constructor(
		public readonly hierarchy: StatHierarchy,
		public readonly parent: StatType | null,
		public readonly name: string,
		public readonly description: string,
	) {}

	toString(): string {
		return this.name;
	}
}
