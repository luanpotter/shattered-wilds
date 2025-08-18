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

export enum StatTypeName {
	Level = 'Level',
	Body = 'Body',
	Mind = 'Mind',
	Soul = 'Soul',
	STR = 'STR',
	DEX = 'DEX',
	CON = 'CON',
	INT = 'INT',
	WIS = 'WIS',
	CHA = 'CHA',
	LCK = 'LCK',
	DIV = 'DIV',
	FOW = 'FOW',
	Muscles = 'Muscles',
	Stance = 'Stance',
	Lift = 'Lift',
	Finesse = 'Finesse',
	Evasiveness = 'Evasiveness',
	Agility = 'Agility',
	Toughness = 'Toughness',
	Stamina = 'Stamina',
	Resilience = 'Resilience',
	IQ = 'IQ',
	Knowledge = 'Knowledge',
	Memory = 'Memory',
	Perception = 'Perception',
	Awareness = 'Awareness',
	Intuition = 'Intuition',
	Speechcraft = 'Speechcraft',
	Presence = 'Presence',
	Empathy = 'Empathy',
	Devotion = 'Devotion',
	Aura = 'Aura',
	Attunement = 'Attunement',
	Discipline = 'Discipline',
	Tenacity = 'Tenacity',
	Resolve = 'Resolve',
	Fortune = 'Fortune',
	Karma = 'Karma',
	Serendipity = 'Serendipity',
}

export class StatType {
	private static build = ({
		hierarchy,
		parent,
		name,
		description,
		longDescription = undefined,
		exampleUsages = [],
	}: {
		hierarchy: StatHierarchy;
		parent?: StatType;
		name: StatTypeName;
		description: string;
		longDescription?: string;
		exampleUsages?: string[];
	}): StatType => {
		return new StatType(hierarchy, parent, name, description, longDescription, exampleUsages);
	};

	static readonly Level = StatType.build({
		hierarchy: StatHierarchy.Level,
		name: StatTypeName.Level,
		description: `The root statistic that represents the character's overall power and experience.`,
	});
	static readonly Body = StatType.build({
		hierarchy: StatHierarchy.Realm,
		parent: StatType.Level,
		name: StatTypeName.Body,
		description: `The realm of physical capabilities, representing the character's physique.`,
		exampleUsages: [
			`Determines [[Vitality Point | Vitality Points]].`,
			`Is used for **Basic Body Defense** resisted checks.`,
		],
	});
	static readonly Mind = StatType.build({
		hierarchy: StatHierarchy.Realm,
		parent: StatType.Level,
		name: StatTypeName.Mind,
		description: `The realm of mental capabilities, representing your character's intellect.`,
		exampleUsages: [
			`Determines [[Focus Point | Focus Points]].`,
			`Is used for **Basic Mind Defense** resisted checks.`,
		],
	});
	static readonly Soul = StatType.build({
		hierarchy: StatHierarchy.Realm,
		parent: StatType.Level,
		name: StatTypeName.Soul,
		description: `The realm of spiritual capabilities, representing your character's life force, connection to the **Aether** and to their own Soul.`,
		exampleUsages: [
			`Determines [[Spirit Point | Spirit Points]].`,
			`Is used for **Basic Soul Defense** resisted checks.`,
		],
	});
	static readonly STR = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Body,
		name: StatTypeName.STR,
		description: `**Strength** is a measure of the power of the [[Body]]. Think punch hard, big muscles, heavy lifting.`,
	});
	static readonly DEX = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Body,
		name: StatTypeName.DEX,
		description: `**Dexterity** is a measure of speed of the [[Body]]. Think reflexes, quickness, agility, precision.`,
	});
	static readonly CON = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Body,
		name: StatTypeName.CON,
		description: `**Constitution** is a measure of the endurance of the [[Body]]. Think stamina, health, resilience.`,
	});
	static readonly INT = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Mind,
		name: StatTypeName.INT,
		description: `**Intelligence** is a measure of the [[Mind]]'s ability to learn, reason, and understand. Think logic, reasoning, and knowledge.`,
	});
	static readonly WIS = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Mind,
		name: StatTypeName.WIS,
		description: `**Wisdom** is a measure of the [[Mind]]'s ability to perceive and interpret the world. Think perception, awareness, and intuition.`,
	});
	static readonly CHA = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Mind,
		name: StatTypeName.CHA,
		description: `**Charisma** is a measure of the [[Mind]]'s ability to influence, persuade, inspire, and connect with others, as well as understand emotions (be it your own or others'). Think empathy, magnetism, charm, physical attractiveness.`,
		longDescription: `Unlike on other systems, where Charisma is further broken down into Skills based on _intent of usage_, such as Persuasion, Intimidation, Seduction, etc. In Shattered Wilds, we break it down by means, and different Skills can be used for different intents.

In fact the exact nature of _how_ the Charisma is being applied will determine which are the best Skills to use for certain situations. Depending on the flavor and roleplaying, all 3 Skills can be used for most intents. The table below gives some guidance on which Skills are better suited for which intents. This also includes a column for potential Extras to be used in such rolls.

| Function   | Speechcraft | Presence | Empathy | Extra                            |
|------------|-------------|----------|---------|----------------------------------|
| Intimidate |  0          | +1       | -1      | <a href="/wiki/STR">STR</a> |
| Deceive    | +1          | -1       |  0      | <a href="/wiki/WIS">WIS</a> |
| Persuade   | +1          | -1       |  0      | <a href="/wiki/INT">INT</a> |
| Inspire    |  0          | -1       | +1      | <a href="/wiki/DIV">DIV</a> |
| Beguile    | -1          | +1       |  0      | <a href="/wiki/FOW">FOW</a> |
| Seduce     | -1          | +1       |  0      | <a href="/wiki/DEX">DEX</a> |

Similarly, the different Skills can be used for different types of performances:

| Performances       | Speechcraft | Presence | Empathy | Extra                            |
|--------------------|-------------|----------|---------|----------------------------------|
| Singing            | +1          | -1       |  0      | <a href="/wiki/CON">CON</a> |
| Playing Instrument | +1          | -1       |  0      | <a href="/wiki/INT">INT</a> |
| Dancing            | -1          | +1       |  0      | <a href="/wiki/DEX">DEX</a> |
| Acting             | +1          | +1       | -1      | <a href="/wiki/FOW">FOW</a> |
| Storytelling       | +1          | -1       |  0      | <a href="/wiki/WIS">WIS</a> |

If you want to be particularly good at a specific type of performance, you can get the appropriate Minor Feat.

On top of these types of actions, the different Skills can still be used for other purposes; for example, [[Empathy]] can be used to read emotions or figure out if someone is lying or has hidden intents; [[Speechcraft]] can be used to craft poems and texts with specific artistic or practical intents; and [[Presence]] can be used to command attention or exert authority over crowds.
`,
	});
	static readonly DIV = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Soul,
		name: StatTypeName.DIV,
		description: `**Divinity** is a measure of the [[Soul]]'s ability to connect with the Aether. It determines the conviction of one's faith and devotion in the unknown and how well one can attune to [[Imbued Item | Imbued Items]].`,
	});
	static readonly FOW = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Soul,
		name: StatTypeName.FOW,
		description: `**Force of Will** is a measure of the [[Soul]]'s ability to resist temptations, vices, and instant gratification. Think willpower, determination, and psychological resilience.`,
	});
	static readonly LCK = StatType.build({
		hierarchy: StatHierarchy.Attribute,
		parent: StatType.Soul,
		name: StatTypeName.LCK,
		description: `**Luck** is a measure of the [[Soul]]'s connection with forces even beyond the **Aether**, measuring a character's unexplainable connection with Luck as a concept that appears to escape the realm of reality itself.`,
	});
	static readonly Muscles = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.STR,
		name: StatTypeName.Muscles,
		description: `Raw power that can be impacted in a short burst, e.g. pulling a stuck lever, breaking down an inanimate object, smashing a mug on one's hands.`,
		exampleUsages: [
			`Can be used instead of [[STR]] to perform an attack with the [[Charge]] action.`,
			`A Contested Check can be used to resist certain [[Transfiguration]] Arcane Spells.`,
			`A Contested Check can be used to resist a [[Disarm]] Special Attack.`,
			`A Contested Check can be used to resist a [[Drag_Grappler | Drag Grappler]] Special Attack.`,
		],
	});
	static readonly Stance = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.STR,
		name: StatTypeName.Stance,
		description: `How hard it is to move or push one around, how well one can keep their stance, resist to being shoved back.`,
		exampleUsages: [
			`A Contested Check can be used to resist a [[Shove]] Special Attack.`,
			`A Contested Check can be used to resist some Telekinesis Arcane Special Attacks, such as Magic Shove.`,
		],
	});
	static readonly Lift = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.STR,
		name: StatTypeName.Lift,
		description: `How much weight that can be lifted and carried for short periods of times, including oneself (climbing, using ropes, etc).`,
		exampleUsages: [
			`A Check can be used to lift a heavy object.`,
			`A Check can be used to perform challenging upwards movements, such as climbing, ascending a rope, etc.`,
		],
	});
	static readonly Finesse = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DEX,
		name: StatTypeName.Finesse,
		description: `Aim, quick fingers, sleight of hand, stealth; delicate movement of the hands and the body; used for the [[Aim]] action.`,
		exampleUsages: [
			`A Check can be used to aim a particularly tricky shot or reduce range increment penalties through the [[Aim]] action.`,
			`A Check can be used to perform a [[Sneak]] or [[Hide]] action.`,
			`A Check can be used to disarm a trap, pick a lock or a pocket.`,
		],
	});
	static readonly Evasiveness = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DEX,
		name: StatTypeName.Evasiveness,
		description: `Evasion, acrobatics; precise movement of the body; used for the [[Dodge]] action.`,
		exampleUsages: [
			`A Check can be used to perform a tricky acrobatic maneuver.`,
			`A Contested Check can be used to defend against a **Basic Body Attack** by using the [[Dodge]] action.`,
			`A Contested Check can be used to resist certain **Special Attacks** actions such as [[Grapple]].`,
			`A Contested Check can be used to resist **Arcane Special Attacks** such as **Hurl Spikes**.`,
		],
	});
	static readonly Agility = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DEX,
		name: StatTypeName.Agility,
		description: `Speed, quickness; how fast one can move and do things; used to derive [[Movement]] and [[Initiative]] stats.`,
		exampleUsages: [
			`Used to computed [[Initiative]]`,
			`Used to computed [[Movement]]`,
			`A Check can be used to react quickly enough to an event; for example, catching a poorly or unexpectedly thrown object.`,
		],
	});
	static readonly Toughness = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CON,
		name: StatTypeName.Toughness,
		description: `Tough skin, resistance to fall damage; damage reduction through [[Shrug_Off | Shrug Off]].`,
		exampleUsages: [
			`A Check can be used to perform the [[Shrug_Off | Shrug Off]] action.`,
			`A Contested Check can be used to resist certain Transfiguration Arcane Spells.`,
			`A Contested Check can be used to resist fall damage.`,
		],
	});
	static readonly Stamina = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CON,
		name: StatTypeName.Stamina,
		description: `Breath, how much exertion can be sustained in a short period of time; continued athleticism.`,
		exampleUsages: [
			`A Check can be used to perform a [[Catch_Breath | Catch Breath]] action.`,
			`A Check is required to avoid losing a [[Vitality_Point | VP]] when performing the [[Run]] action.`,
			`A Check can be used to push your limits in physical activities, such as running, climbing, etc.`,
		],
	});
	static readonly Resilience = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CON,
		name: StatTypeName.Resilience,
		description: `Resistance to heat, cold, sickness, poison and disease.`,
		exampleUsages: [
			`A Contested Check can be used to resist the effects of [[Noxious Gas]] or other poisons.`,
			`A Check can be used to resist the effects of heat, cold or extreme weather.`,
		],
	});
	static readonly IQ = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.INT,
		name: StatTypeName.IQ,
		description: `Ability to learn new information, apply logic, raw intelligence and reasoning power.`,
		exampleUsages: [
			`A Check can be used to assess, analyze, and understand the activation mechanism of an unfamiliar device or trap.`,
			`A Check can be used to decipher an unknown language, code, or cypher that the character is aware of.`,
			`A Check might be required to proc a particularly complex trigger for the [[Action_Prepare_Action | Prepare Action]] action.`,
		],
	});
	static readonly Knowledge = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.INT,
		name: StatTypeName.Knowledge,
		description: `Consolidated knowledge and lore about the world and how it works; learned information and academic understanding; "book smarts".`,
		longDescription: `**Note**: before using a **Knowledge Check**, one should always consider if they might want to use the [[Write_History | Write History]] action instead.`,
		exampleUsages: [
			`A Check can be used to recall specific historical events, geographical information, or cultural details.`,
			`A Check can be used to recall details about creatures, plants, or magical phenomena encountered in the world.`,
			`Circumstantial Bonuses are often acquired via a character's **Upbringing**.`,
		],
	});
	static readonly Memory = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.INT,
		name: StatTypeName.Memory,
		description: `Short-term memory, ability to recall details and retain information from recent experiences.`,
		exampleUsages: [
			`A Check can be used to remember specific details from recent conversations or events.`,
			`A Check can be used to recall the exact layout of a location you've visited recently.`,
			`A Check can be used to identify a specific person or object from a recent memory.`,
		],
	});
	static readonly Perception = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.WIS,
		name: StatTypeName.Perception,
		description: `Active perception, seeing, hearing, sensing, feeling and noticing details in the environment.`,
		exampleUsages: [
			`A Check can be used whenever you are actively trying to see, hear, or sense something.`,
			`A Check can be used to actively seek relevant details in your surroundings.`,
		],
	});
	static readonly Awareness = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.WIS,
		name: StatTypeName.Awareness,
		description: `Alertness, passive perception, attention to details when not paying attention; intuitive awareness of surroundings.`,
		exampleUsages: [
			`Used to compute [[Initiative]] alongside [[Agility]].`,
			`A Contested Check is used in case an opponent is attempting to [[Sneak]] past you.`,
			`A Check can be used to sense ambushes or detect when you're being followed.`,
			`A Check can be used for any other form of "Passive Perception".`,
		],
	});
	static readonly Intuition = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.WIS,
		name: StatTypeName.Intuition,
		description: `Common sense, "street smarts", cunning, instinctive understanding of situations and environments.`,
		exampleUsages: [
			`A Check can be used for survival skills like finding food, shelter, tracks, or safe paths in the wilderness.`,
			`A Check can be used to understand animal behavior and handle beasts effectively.`,
		],
	});
	static readonly Speechcraft = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CHA,
		name: StatTypeName.Speechcraft,
		description: `Rhetoric, speech, verbal (or written) communication; the art of expressing ideas through language.`,
		exampleUsages: [
			`A Check can be used for various social influence attempts (see [[CHA]] for the full table).`,
			`A Check can be used for verbal performances like singing, playing instruments, or storytelling (see [[CHA]] for the full table).`,
			`A Check can be used to deliver complex information clearly, succinctly, artfully, and / or memorably.`,
			`A Check can be used to conduct formal negotiations or legal proceedings.`,
		],
	});
	static readonly Presence = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CHA,
		name: StatTypeName.Presence,
		description: `Personal magnetism, body language, physical attractiveness, and non-verbal communication through physical poise.`,
		exampleUsages: [
			`A Check can be used for various social influence attempts (see [[CHA]] for the full table).`,
			`A Check can be used for physical performances like dancing or acting (see [[CHA]] for the full table).`,
			`A Check can be used to command attention in a crowded room, even without speaking.`,
			`A Check can be used to project authority and leadership in crisis situations.`,
		],
	});
	static readonly Empathy = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.CHA,
		name: StatTypeName.Empathy,
		description: `Reading people, understanding emotions and motivations, connecting with others on an emotional level.`,
		exampleUsages: [
			`A Check can be used to read emotions or figure out if someone is lying or has hidden intents.`,
			`A Check can be used for social influence attempts that rely on emotional connection (see [[CHA]] for the full table).`,
			`A Check can be used to assess someone's emotional state or mental condition.`,
			`A Check can be used to understand cultural nuances and social hierarchies.`,
		],
	});
	static readonly Devotion = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DIV,
		name: StatTypeName.Devotion,
		description: `A personal connection to a deity; faith, ability to believe, ask and receive for providence through Prayer.`,
		longDescription: `**Note**: While a character does not need to be an **Adept** to perform **Devotion Checks**, they do need to have a connection to one specific **Protean**. If they start investing in [[Devotion]], and attempt to **Pray**, they might be answered by some unspecified force, or it might not work at all.`,
		exampleUsages: [
			`A Check can be used to determine the effectiveness of their **Prayers**.`,
			`A Check can be used to maintain divine favor during morally challenging situations.`,
			`A Check can be used to resist effects that would corrupt or turn you away from your faith.`,
			`A Check can be requested by the DM to receive and understand messages, visions, omens, guidance or requests from your **Protean**.`,
			`A Check can be used when trying to connect to, interpret, or understand your deity.`,
		],
	});
	static readonly Aura = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DIV,
		name: StatTypeName.Aura,
		description: `The extent and range of the power of your Soul over the Aether (and the material world). Your spiritual presence, as well as your ability to perceive other people's Souls (or influences).`,
		exampleUsages: [
			`Used to determine the range increment of your [Arcane](/rules/arcane) and [Divine](/rules/divine) spells.`,
			`A Check can be used to detect the presence of other Souls or influences from the **Aether**.`,
			`A Check can be used to strengthen the projection of your own Soul and power into the material world.`,
		],
	});
	static readonly Attunement = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.DIV,
		name: StatTypeName.Attunement,
		description: `General attunement to the Aether, how well external forces can flow and be channeled through one's Soul; conduit to external powers.`,
		exampleUsages: [
			`A Check can be required to use or get the best use of [[Imbued Item | Imbued Items]].`,
			`A Check can be used to interact with powers originating from the **Aether**..`,
		],
	});
	static readonly Discipline = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.FOW,
		name: StatTypeName.Discipline,
		description: `Ability to resist fear, urges and temptations, vices and instant gratification, self-control and restraint.`,
		exampleUsages: [
			`A Check can be used to resist a character's [[Vice]].`,
			`A Check can be used to confront or endure a character's [[Aversion]].`,
			`A Check can be used to resist fear effects, such as the [[Frightened]] condition, whether from supernatural sources or terrifying situations.`,
			`A Contested Check can be used to resist addictive substances, compulsive behaviors, or the temptation of a prize.`,
			`A Contested Check can be used to resist the temptation to act rashly or impulsively in critical situations.`,
		],
	});
	static readonly Tenacity = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.FOW,
		name: StatTypeName.Tenacity,
		description: `Concentration, ability to ignore pain or hardship or being disturbed and keep going, mental toughness and grit.`,
		exampleUsages: [
			`A Check can be used to perform the [[Focus]] action.`,
			`A Check can be used to maintain [[Concentration]] when disrupted or damaged.`,
			`A Check can be used to continue acting in the face of pain, hardship, or distractions.`,
			`A Check can be used to temporarily mitigate the effects of [[Exhaustion]].`,
		],
	});
	static readonly Resolve = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.FOW,
		name: StatTypeName.Resolve,
		description: `Resistance to mind control, social manipulation, deceit, charm, and intimidation; fortitude of the mind and mental resilience.`,
		exampleUsages: [
			`A Contested Check can be used to resist **Command** Arcane Spells that attempt to control your mind.`,
			`A Contested Check can be used to resist social manipulation, intimidation, or coercion attempts (for example to resist [[CHA]]-based checks).`,
		],
	});
	static readonly Fortune = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.LCK,
		name: StatTypeName.Fortune,
		description: `Personal luck for one's own actions; used for the [[Luck_Die | Luck Die]] mechanic.`,
		exampleUsages: [
			`Can be used for the [[Luck_Die | Luck Die]] mechanic.`,
			`A Check can be used when a character is actively trying to achieve a lucky outcome, such as gambling, games of chance, rolling dice, etc.`,
		],
	});
	static readonly Karma = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.LCK,
		name: StatTypeName.Karma,
		description: `Things just don't seem to go well for people who wrong ones with high Karma; used for the [[Karmic_Resistance | Karmic Resistance]] reaction.`,
		exampleUsages: [
			`Use for the [[Karmic_Resistance | Karmic Resistance]] reaction.`,
			`A Check can be used to decide Luck-based aspects related to others.`,
		],
	});
	static readonly Serendipity = StatType.build({
		hierarchy: StatHierarchy.Skill,
		parent: StatType.LCK,
		name: StatTypeName.Serendipity,
		description: `The Luck for the world itself; an uncanny ability to be favored by external chance and coincidences; synchronism; used for the [[Write_History | Write History]] action.`,
		exampleUsages: [
			`Can be used for the [[Write_History | Write History]] action.`,
			`A Check can be used to determine the outcome of external random events (not caused by the character or others), such as the weather.`,
		],
	});

	private constructor(
		public readonly hierarchy: StatHierarchy,
		public readonly parent: StatType | undefined,
		public readonly name: StatTypeName,
		public readonly description: string,
		public readonly longDescription: string | undefined,
		public readonly exampleUsages: string[],
	) {}

	toString(): string {
		return this.name;
	}

	static readonly values: StatType[] = Object.values(StatType).filter(stat => stat.description);

	static fromString(name: string | undefined, fallback: StatType): StatType {
		if (!name) {
			return fallback;
		}
		const stat = StatType.values.find(stat => stat.name === name);
		if (!stat) {
			throw new Error(`Stat type ${name} not found`);
		}
		return stat;
	}

	static fromName(name: StatTypeName): StatType {
		return StatType.values.find(stat => stat.name === name)!;
	}

	static childrenOf(stat: StatType): StatType[] {
		return StatType.values.filter(child => child.parent?.name === stat.name);
	}

	static mindAttributes = [StatTypeName.INT, StatTypeName.WIS, StatTypeName.CHA];
	static soulAttributes = [StatTypeName.DIV, StatTypeName.FOW, StatTypeName.LCK];
	static mindOrSoulAttributes = [...StatType.mindAttributes, ...StatType.soulAttributes];

	static get realms(): StatType[] {
		return StatType.values.filter(stat => stat.hierarchy === StatHierarchy.Realm);
	}

	static get attributes(): StatType[] {
		return StatType.values.filter(stat => stat.hierarchy === StatHierarchy.Attribute);
	}

	static get skills(): StatType[] {
		return StatType.values.filter(stat => stat.hierarchy === StatHierarchy.Skill);
	}
}
