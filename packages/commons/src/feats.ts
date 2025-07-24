import { CLASS_ROLE_PRIMARY_ATTRIBUTE, ClassFlavor, ClassRealm, ClassRole } from './classes.js';
import { Race, RACE_DEFINITIONS, Upbringing } from './races.js';
import { StatType, StatTypeName } from './stats/stat-type.js';

export enum FeatType {
	Core = 'Core',
	Major = 'Major',
	Minor = 'Minor',
}

export enum FeatCategory {
	Racial = 'Racial',
	Upbringing = 'Upbringing',
	ClassRole = 'Class Role',
	ClassFlavor = 'Class Flavor',
	General = 'General',
}

export enum StaticFeatSource {
	Class = 'Class',
	Race = 'Race',
	Upbringing = 'Upbringing',
}

export type FeatSource = StaticFeatSource | Race | Upbringing | ClassRealm | ClassRole | ClassFlavor;

export interface FeatEffect {}
export class FeatStatModifier implements FeatEffect {
	constructor(
		public statType: StatType,
		public value: number,
	) {}
}

export interface FeatDefinition<T extends string | void> {
	key: Feat;
	name: string;
	type: FeatType;
	category: FeatCategory;
	source: FeatSource;
	level: number;
	description: string;
	parameter?: FeatParameter<T>;
	fullDescription?: (info: FeatInfo<T>) => string;
	effects?: (info: FeatInfo<T>) => FeatEffect[];
}

export interface FeatParameter<T extends string | void> {
	id: string;
	name: string;
	values: T[];
}

export class FeatInfo<T extends string | void> {
	feat: FeatDefinition<T>;
	slot: FeatSlot | undefined;
	parameter: T;

	constructor(feat: FeatDefinition<T>, slot: FeatSlot | undefined, parameter: T) {
		this.feat = feat;
		this.slot = slot;
		this.parameter = parameter;
	}

	get name(): string {
		if (this.parameter) {
			return `${this.feat.name} (${this.parameter})`;
		}
		return this.feat.name;
	}

	get description(): string {
		return this.feat?.fullDescription?.(this) ?? this.feat.description;
	}

	toProp(): [string, string] | undefined {
		const slot = this.slot;
		if (!slot) {
			return undefined; // core feat - no need to save it
		}
		return [slot.toProp(), this.encodeValue()];
	}

	private encodeValue(): string {
		if (this.parameter) {
			return `${this.feat.key}#${this.parameter}`;
		} else {
			return this.feat.key;
		}
	}

	static fromProp([key, value]: [string, string]): FeatInfo<string | void> {
		const slot = FeatSlot.fromProp(key);
		const [feat, parameter] = this.decodeFeatValue(value);
		const def = FEATS[feat];
		return new FeatInfo(def, slot, parameter);
	}

	static build<T extends string | void>({
		feat,
		slot,
		parameter,
	}: {
		feat: FeatDefinition<T>;
		slot: FeatSlot | undefined;
		parameter: T;
	}): FeatInfo<T> {
		return new FeatInfo(feat, slot, parameter);
	}

	private static decodeFeatValue(value: string): [Feat, string | null] {
		if (!value.includes('#')) {
			return [value as Feat, null];
		}
		return value.split('#') as [Feat, string];
	}

	private static parseParameter = (def: FeatDefinition<string | void>, parameters: Record<string, string>) => {
		const parameterType = def.parameter?.id;
		if (parameterType) {
			const parameterValue = parameters[parameterType];
			if (parameterValue === undefined) {
				throw new Error(`Parameter value for ${parameterType} is not defined for feat ${def.key}.`);
			}
			return parameterValue;
		} else {
			return undefined;
		}
	};

	static hydrateFeatDefinition = (
		def: FeatDefinition<string | void>,
		parameters: Record<string, string>,
	): FeatInfo<string | void> => {
		const parameter = FeatInfo.parseParameter(def, parameters);
		return FeatInfo.build({ feat: def, slot: undefined, parameter });
	};

	static hydrateFeatDefinitions = (
		defs: FeatDefinition<string | void>[],
		parameters: Record<string, string>,
	): FeatInfo<string | void>[] => {
		return defs.map(def => FeatInfo.hydrateFeatDefinition(def, parameters));
	};
}

const mindAttributes = [StatTypeName.INT, StatTypeName.WIS, StatTypeName.CHA];
type MindAttributes = (typeof mindAttributes)[number];
const soulAttributes = [StatTypeName.DIV, StatTypeName.FOW, StatTypeName.LCK];
const mindOrSoulAttributes = [...mindAttributes, ...soulAttributes];
type MindOrSoulAttributes = (typeof mindOrSoulAttributes)[number];

export enum Feat {
	// Class
	ClassSpecialization = 'ClassSpecialization',
	// Race
	RacialModifier = 'RacialModifier',
	UpbringingFavoredModifier = 'UpbringingFavoredModifier',
	UpbringingDisfavoredModifier = 'UpbringingDisfavoredModifier',
	SpecializedKnowledge = 'SpecializedKnowledge',
	SpecializedTraining = 'SpecializedTraining',
	NomadicAlertness = 'NomadicAlertness',
	TribalEndurance = 'TribalEndurance',
	LightFeet = 'LightFeet',
	DarkVision = 'DarkVision',
	// Melee
	SweepAttack = 'SweepAttack',
	OpportunityWindow = 'OpportunityWindow',
	SpinAttack = 'SpinAttack',
	// Ranged
	TakeAim = 'TakeAim',
	RapidFire = 'RapidFire',
	PinningShot = 'PinningShot',
	DoubleShot = 'DoubleShot',
	// Tank
	ImprovedTaunt = 'ImprovedTaunt',
	QuickBash = 'QuickBash',
	ArmorFamiliarity = 'ArmorFamiliarity',
	BulkyFrame = 'BulkyFrame',
	// Martial
	ExertAuthority = 'ExertAuthority',
	DistributedShifts = 'DistributedShifts',
	// Survivalist
	Rage = 'Rage',
	InstinctiveTracking = 'InstinctiveTracking',
	DisregardCover = 'DisregardCover',
	// Scoundrel
	FancyFootwork = 'FancyFootwork',
	ThievesFingers = 'ThievesFingers',
	Leverage = 'Leverage',
	BeginnersLuck = 'BeginnersLuck',
	// Caster
	ArcaneCasting = 'ArcaneCasting',
	// Arcanist
	SignatureSpell = 'SignatureSpell',
	// Mechanist
	ToolAssistedCasting = 'ToolAssistedCasting',
	// Naturalist
	FocalConnection = 'FocalConnection',
	// Musicist
	LyricResonance = 'LyricResonance',
	TheresMoreToThisSong = 'TheresMoreToThisSong',
	// Mystic
	DivineChanneling = 'DivineChanneling',
	// Adept
	SacredCalm = 'SacredCalm',
	// Disciple
	FlurryOfBlows = 'FlurryOfBlows',
	ChannelingFists = 'ChannelingFists',
	CallousFists = 'CallousFists',
	// Inspired
	BountifulLuck = 'BountifulLuck',
	LuckyRelentlessness = 'LuckyRelentlessness',
	FavorableMovement = 'FavorableMovement',
	// Devout
	EffortlessImbuedItemChanneling = 'EffortlessImbuedItemChanneling',
	FocusedChanneling = 'FocusedChanneling',
	// Crusader
	DivineSmite = 'DivineSmite',
	SpiritualArmor = 'SpiritualArmor',
}

export const FEATS: Record<Feat, FeatDefinition<any>> = {
	// Class
	[Feat.ClassSpecialization]: <FeatDefinition<ClassRole>>{
		key: Feat.ClassSpecialization,
		name: 'Class Specialization',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: StaticFeatSource.Class,
		level: 1,
		description: `+1 Attribute Modifier to the class's primary attribute`,
		parameter: {
			id: 'class-role',
			name: 'Class Role',
			values: Object.values(ClassRole),
		},
		fullDescription: info => {
			const primaryAttribute = CLASS_ROLE_PRIMARY_ATTRIBUTE[info.parameter];
			return `Class Specialization: +1 ${primaryAttribute}.`;
		},
		effects: info => {
			const primaryAttribute = CLASS_ROLE_PRIMARY_ATTRIBUTE[info.parameter];
			return [new FeatStatModifier(primaryAttribute, 1)];
		},
	},
	// Race
	[Feat.RacialModifier]: <FeatDefinition<Race>>{
		key: Feat.RacialModifier,
		name: 'Racial Modifier',
		type: FeatType.Core,
		category: FeatCategory.Racial,
		source: StaticFeatSource.Race,
		level: 0,
		description: '+1/-1 Racial Modifiers',
		parameter: {
			id: 'race',
			name: 'Race',
			values: Object.values(Race),
		},
		fullDescription: info => {
			const raceDefinition = RACE_DEFINITIONS[info.parameter];
			const modifiers = raceDefinition.modifiers.map(e => `${e.stat}: ${e.value > 0 ? '+' : ''}${e.value}`).join(' / ');
			if (!modifiers) {
				return `Racial Modifiers for ${raceDefinition.name}: Neutral.`;
			}
			return `Racial Modifiers for ${raceDefinition.name}: ${modifiers}.`;
		},
		effects: info => {
			const raceDefinition = RACE_DEFINITIONS[info.parameter];
			return raceDefinition.modifiers.map(e => new FeatStatModifier(e.stat, e.value));
		},
	},
	[Feat.UpbringingFavoredModifier]: <FeatDefinition<MindOrSoulAttributes>>{
		key: Feat.UpbringingFavoredModifier,
		name: 'Upbringing Favored Modifier',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		source: StaticFeatSource.Upbringing,
		level: 0,
		description: '+1 Upbringing Modifier',
		parameter: {
			id: 'upbringing-favored-modifier',
			name: 'Upbringing Favored Modifier',
			values: mindOrSoulAttributes,
		},
		fullDescription: info => {
			const statName = info.parameter;
			return `Upbringing Favored Modifier: +1 ${statName}.`;
		},
		effects: info => {
			const statName = info.parameter;
			return [new FeatStatModifier(StatType.fromName(statName), 1)];
		},
	},
	[Feat.UpbringingDisfavoredModifier]: <FeatDefinition<MindOrSoulAttributes>>{
		key: Feat.UpbringingDisfavoredModifier,
		name: 'Upbringing Disfavored Modifier',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		source: StaticFeatSource.Upbringing,
		level: 0,
		description: '-1 Upbringing Modifier',
		parameter: {
			id: 'upbringing-disfavored-modifier',
			name: 'Upbringing Disfavored Modifier',
			values: mindOrSoulAttributes,
		},
		fullDescription: info => {
			const statName = info.parameter;
			return `Upbringing Disfavored Modifier: -1 ${statName}.`;
		},
		effects: info => {
			const stat = info.parameter;
			return [new FeatStatModifier(StatType.fromName(stat), -1)];
		},
	},
	[Feat.SpecializedKnowledge]: <FeatDefinition<Upbringing>>{
		key: Feat.SpecializedKnowledge,
		name: 'Specialized Knowledge',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		source: StaticFeatSource.Upbringing,
		level: 0,
		description: 'You have +3 to Knowledge or Intuition Checks about aspects related to a specific area of expertise',
		parameter: {
			id: 'upbringing',
			name: 'Upbringing',
			values: Object.values(Upbringing),
		},
	},
	[Feat.SpecializedTraining]: <FeatDefinition<void>>{
		key: Feat.SpecializedTraining,
		name: 'Specialized Training',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		source: Upbringing.Urban,
		level: 0,
		description: 'You gain two additional Minor Feat slots at Level 1',
	},
	[Feat.NomadicAlertness]: <FeatDefinition<void>>{
		key: Feat.NomadicAlertness,
		name: 'Nomadic Alertness',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		source: Upbringing.Nomadic,
		level: 0,
		description: 'Can make Awareness Checks to spot danger while sleeping in the Wilds with no CM penalty',
	},
	[Feat.TribalEndurance]: <FeatDefinition<void>>{
		key: Feat.TribalEndurance,
		name: 'Tribal Endurance',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		source: Upbringing.Tribal,
		level: 0,
		description:
			'Pay 1 Heroism Point to reduce your Exhaustion Level by 1 if you can directly tie a current task to your personal sense of duty to your tribe',
	},
	[Feat.LightFeet]: <FeatDefinition<void>>{
		key: Feat.LightFeet,
		name: 'Light Feet',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		source: Upbringing.Sylvan,
		level: 0,
		description: 'Ignore difficult terrain due to natural vegetation, forest growth, etc.',
	},
	[Feat.DarkVision]: <FeatDefinition<void>>{
		key: Feat.DarkVision,
		name: 'Dark Vision',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		source: Upbringing.Telluric,
		level: 0,
		description: 'See black-and-white in the dark',
	},
	// Melee
	[Feat.SweepAttack]: <FeatDefinition<void>>{
		key: Feat.SweepAttack,
		name: 'Sweep Attack',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassRole.Melee,
		level: 1,
		description:
			'You can spend `3` [[Resource_Action_Points | AP]] and `1` [[Resource_Focus_Points | FP]] to perform an advanced **Melee Strike** against up to three adjacent enemies within your reach. You roll once for all targets, but they resist separately.',
	},
	[Feat.OpportunityWindow]: <FeatDefinition<void>>{
		key: Feat.OpportunityWindow,
		name: 'Opportunity Window',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassRole.Melee,
		level: 2,
		description:
			'You can spend 1 [[Resource_Soul_Point | SP]] to reduce by 1 (min 1) the amount of [[Resource_Action_Point | AP]] you would spend to perform the [[Action_Opportunity_Attack | Opportunity Attack]] reaction.',
	},
	[Feat.SpinAttack]: <FeatDefinition<void>>{
		key: Feat.SpinAttack,
		name: 'Spin Attack',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassRole.Melee,
		level: 3,
		description: 'Upgrade the **Sweep Attack** to target any number of adjacent creatures.',
	},
	// Ranged
	[Feat.TakeAim]: <FeatDefinition<void>>{
		key: Feat.TakeAim,
		name: 'Take Aim',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassRole.Ranged,
		level: 1,
		description:
			'Spend 1 [[Resource_Focus_Points | FP]] and 1 [[Resource_Action_Points | AP]] to target a specific enemy within range of your Ranged Weapon and that you can see clearly; if your next action is a **Basic Ranged Attack** against that target, you can roll with [[Stat_Finesse | Finesse]] instead and +3 [[Circumstance Modifier | CM]] to the **Attack Check**.',
	},
	[Feat.RapidFire]: <FeatDefinition<void>>{
		key: Feat.RapidFire,
		name: 'Rapid Fire',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassRole.Ranged,
		level: 2,
		description:
			'Spend 2 [[Resource_Spirit_Points | SP]] (and the [[Resource_Action_Point | AP]] that it would cost) to use a [[Action_Strike | Strike]] action for **Basic Ranged Attack** as a reaction; it loses the [[Concentrate]] trait.',
	},
	[Feat.PinningShot]: <FeatDefinition<void>>{
		key: Feat.PinningShot,
		name: 'Pinning Shot',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassRole.Ranged,
		level: 2,
		description: 'You can perform the [[Action_Stun | Stun]] action with **Ranged Attacks**.',
	},
	[Feat.DoubleShot]: <FeatDefinition<void>>{
		key: Feat.DoubleShot,
		name: 'Double Shot',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassRole.Ranged,
		level: 4,
		description:
			'You can spend 3 [[Resource_Spirit_Points | SP]] to shoot two projectiles with a single [[Action_Strike | Strike]] action. Roll for each separately, one after the other.',
	},
	// Tank
	[Feat.ImprovedTaunt]: <FeatDefinition<void>>{
		key: Feat.ImprovedTaunt,
		name: 'Improved Taunt',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassRole.Tank,
		level: 1,
		description:
			'You can spend an additional 1 [[Resource_Spirit_Point | SP]] as you perform a [[Action_Taunt | Taunt]] action to get a +6 [[Circumstance Modifier | CM]] to your [[Stat_Intimidation | Intimidation]] Check.',
	},
	[Feat.QuickBash]: <FeatDefinition<void>>{
		key: Feat.QuickBash,
		name: 'Quick Bash',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassRole.Tank,
		level: 2,
		description: 'You only need to spend 1 [[Resource_Action_Point | AP]] to perform a **Shield Bash** .',
	},
	[Feat.ArmorFamiliarity]: <FeatDefinition<void>>{
		key: Feat.ArmorFamiliarity,
		name: 'Armor Familiarity',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassRole.Tank,
		level: 3,
		description: 'You reduce your [[Stat_DEX | DEX]] penalty from wearing Armor by `1` (min `0`).',
	},
	[Feat.BulkyFrame]: <FeatDefinition<void>>{
		key: Feat.BulkyFrame,
		name: 'Bulky Frame',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassRole.Tank,
		level: 2,
		description:
			'You have a `+6` [[Circumstance Modifier | CM]] to your [[Stat_Stance | Stance]] Checks to resist opponents of your size or larger attempting to [[Action_Stumble_Through | Stumble Through]] you.',
	},
	// Martial
	[Feat.ExertAuthority]: <FeatDefinition<void>>{
		key: Feat.ExertAuthority,
		name: 'Exert Authority',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Martial,
		level: 1,
		description:
			'Spend 1 [[Resource_Action_Point | AP]] and 1 [[Resource_Spirit_Point | SP]] to authoritatively command an ally that can see and hear you clearly to perform a specific 1 [[Resource_Action_Point | AP]] action of your choice. The ally can choose to perform the action immediately without spending any AP if they wish.',
	},
	[Feat.DistributedShifts]: <FeatDefinition<void>>{
		key: Feat.DistributedShifts,
		name: 'Distributed Shifts',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Martial,
		level: 2,
		description:
			'When you would inflict additional damage through a **Basic Melee Strike** to an enemy via **Crit Shifts**, you can instead attempt to distribute that additional Shift damage to any other adjacent creatures that would have been valid targets for this attack; they can resist with a [[Stat_Evasiveness | Evasiveness]], [[Stat_Toughness | Toughness]] or [[Stat_Karma | Karma]] Check.',
	},
	// Survivalist
	[Feat.Rage]: <FeatDefinition<void>>{
		key: Feat.Rage,
		name: 'Rage',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Survivalist,
		level: 1,
		description:
			'You can spend 1 [[Resource_Action_Point | AP]] and 2 [[Resource_Spirit_Point | SP]] to become **Enraged**: reduce your [[Resource_Focus_Points | Focus Points]] to `1`, and it cannot be further reduced while you are **Enraged**; you cannot [[Concentrate]] while **Enraged**; and you gain a [[Circumstance Modifier | CM]] to your next **Basic Attacks** while **Enraged** that starts with `+6` and is reduced by `1` each time it is used. When the bonus reaches `0`, or you fail to perform at least on **Basic Attack** in your turn, you are no longer **Enraged**.',
	},
	[Feat.InstinctiveTracking]: <FeatDefinition<void>>{
		key: Feat.InstinctiveTracking,
		name: 'Instinctive Tracking',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Survivalist,
		level: 2,
		description:
			'You get a `+3` [[Circumstance Modifier | CM]] to Checks you make related to tracking creatures (following footprints, etc).',
	},
	[Feat.DisregardCover]: <FeatDefinition<void>>{
		key: Feat.DisregardCover,
		name: 'Disregard Cover',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Survivalist,
		level: 4,
		description:
			'You can consider **Basic Cover** for your **Ranged Attacks** to be of one degree less than it would otherwise be.',
	},
	// Scoundrel
	[Feat.FancyFootwork]: <FeatDefinition<void>>{
		key: Feat.FancyFootwork,
		name: 'Fancy Footwork',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Scoundrel,
		level: 1,
		description:
			'If you make a **Melee Basic Attack** against a target, you do not provoke [[Opportunity_Attack | Opportunity Attacks]] from that target until the end of the turn.',
	},
	[Feat.ThievesFingers]: <FeatDefinition<void>>{
		key: Feat.ThievesFingers,
		name: 'Thieves Fingers',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Scoundrel,
		level: 2,
		description:
			'You get a `+3` [[Circumstance Modifier | CM]] to any Checks you perform associated with lock picking or trap disarming. You can spend 1 [[Resource_Focus_Point | FP]] to get an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).',
	},
	[Feat.Leverage]: <FeatDefinition<void>>{
		key: Feat.Leverage,
		name: 'Leverage',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Scoundrel,
		level: 2,
		description:
			'If you would inflict additional damage through a **Basic Strike** to an enemy via **Crit Shifts**, you can instead spend any number of [[Resource_Spirit_Point | SP]] (up to your level) to inflict that many additional [[Resource_Vitality_Point | VP]] of damage.',
	},
	[Feat.BeginnersLuck]: <FeatDefinition<void>>{
		key: Feat.BeginnersLuck,
		name: 'Beginners Luck',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Scoundrel,
		level: 2,
		description:
			'You can use a [[Resource_Focus_Point | FP]] to pay for a [[Action_Luck_Die | Luck Die]] for a Check of a Skill you do not have any points invested in.',
	},
	// Caster
	[Feat.ArcaneCasting]: <FeatDefinition<MindAttributes>>{
		key: Feat.ArcaneCasting,
		name: 'Arcane Casting',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassRealm.Caster,
		level: 1,
		description:
			'Unlocks Arcane Casting. See [Arcane Spellcasting](/rules/arcane) for details on how the **Arcane** magic system works.',
		parameter: {
			id: 'stat',
			name: 'Stat',
			values: mindAttributes,
		},
	},
	// Arcanist
	// TODO(luan): support free-form parameters
	[Feat.SignatureSpell]: <FeatDefinition<void>>{
		key: Feat.SignatureSpell,
		name: 'Signature Spell',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Arcanist,
		level: 1,
		description:
			'You can spend 1 [[Resource_Action_Point | AP]] and 1 [[Resource_Focus_Point | FP]] to cast a spell of your choice as a reaction.',
	},
	// Mechanist
	[Feat.ToolAssistedCasting]: <FeatDefinition<void>>{
		key: Feat.ToolAssistedCasting,
		name: 'Tool-Assisted Casting',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Mechanist,
		level: 1,
		description:
			'You can create and use **One-Handed** (`+2`) and **Two-Handed** (`+3`) tools, crazy mechanical contraptions to assist you with the execution of **Somatic Spell Components**. You can use these tools to execute a **Somatic Component** of any spell, but you cannot use any other type of **Spell Component**.',
	},
	// Naturalist
	[Feat.FocalConnection]: <FeatDefinition<void>>{
		key: Feat.FocalConnection,
		name: 'Focal Connection',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Naturalist,
		level: 1,
		description:
			'You can create and use a personal **Custom Focus** (`+3`) that is bound to you. You can use this **Custom Focus** to execute the **Focal Component** of any spell, but you cannot use any other type of **Spell Component**.',
	},
	// Musicist
	[Feat.LyricResonance]: <FeatDefinition<void>>{
		key: Feat.LyricResonance,
		name: 'Lyric Resonance',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Musicist,
		level: 1,
		description:
			'You can use **One-Handed** (`+2`) and **Two-Handed** (`+3`) instruments to assist you with the execution of **Verbal Spell Components**. You can use these instruments to execute a **Verbal Component** of any spell, but you cannot use any other type of **Spell Component**.',
	},
	[Feat.TheresMoreToThisSong]: <FeatDefinition<void>>{
		key: Feat.TheresMoreToThisSong,
		name: "There's More to This Song",
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Musicist,
		level: 2,
		description:
			'You can attempt to hide a message in a song you are singing, only to be perceived by certain listeners. Roll a [[Stat_Speechcraft | Speechcraft]] Check with `+6` [[Circumstance Modifier | CM]]; all listeners then contest with an [[Stat_IQ | IQ]] Check. The targets you wanted to understand get a `+3` [[Circumstance Modifier | CM]] to their Check, or a `+6` if they are aware that you are trying to hide a message.',
	},
	// Mystic
	[Feat.DivineChanneling]: <FeatDefinition<void>>{
		key: Feat.DivineChanneling,
		name: 'Divine Channeling',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassRealm.Mystic,
		level: 1,
		description:
			'Unlocks Divine Channeling. See [Divine Channeling](/rules/divine) for details on how the **Divine** magic system works.',
	},
	// Adept
	[Feat.SacredCalm]: <FeatDefinition<void>>{
		key: Feat.SacredCalm,
		name: 'Sacred Calm',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassRealm.Mystic,
		level: 1,
		description:
			'You can perform the [[Action_Calm | Calm]] action on an ally that you can touch. You can spend an additional 1 [[Resource_Focus_Point | FP]] to get a +3 [[Circumstance Modifier | CM]] when performing the [[Action_Calm | Calm]] action.',
	},
	// Disciple
	[Feat.FlurryOfBlows]: <FeatDefinition<void>>{
		key: Feat.FlurryOfBlows,
		name: 'Flurry of Blows',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassRealm.Mystic,
		level: 1,
		description:
			'You can spend 1 [[Resource_Spirit_Point | SP]] to make an unarmed [[Action_Strike | Strike]] cost only 1 [[Resource_Action_Point | AP]].',
	},
	[Feat.ChannelingFists]: <FeatDefinition<void>>{
		key: Feat.ChannelingFists,
		name: 'Channeling Fists',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassRealm.Mystic,
		level: 2,
		description:
			'You can spend 1 [[Resource_Spirit_Point | SP]] to get a +1 [[Circumstance Modifier | CM]] to an unarmed Attack Check.',
	},
	[Feat.CallousFists]: <FeatDefinition<void>>{
		key: Feat.CallousFists,
		name: 'Callous Fists',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassRealm.Mystic,
		level: 2,
		description: 'You can use [[Stat_CON | CON]] instead of [[Stat_STR | STR]] to perform unarmed attacks.',
	},
	// Inspired
	[Feat.BountifulLuck]: <FeatDefinition<void>>{
		key: Feat.BountifulLuck,
		name: 'Bountiful Luck',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassRealm.Mystic,
		level: 1,
		description:
			'You can spend [[Resource_Spirit_Points | SP]] instead of [[Resource_Heroism_Points | Heroism Points]] to use the [[Action_Karmic_Resistance | Karmic Resistance]], [[Action_Write_History | Write History]] and [[Action_Luck_Die | Luck Die]] actions.',
	},
	[Feat.LuckyRelentlessness]: <FeatDefinition<void>>{
		key: Feat.LuckyRelentlessness,
		name: 'Lucky Relentlessness',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassRealm.Mystic,
		level: 2,
		description: 'Your DC for the [[Action_Heroic_Relentlessness | Heroic Relentlessness]] action is `15`.',
	},
	[Feat.FavorableMovement]: <FeatDefinition<void>>{
		key: Feat.FavorableMovement,
		name: 'Favorable Movement',
		type: FeatType.Major,
		category: FeatCategory.ClassRole,
		source: ClassRealm.Mystic,
		level: 3,
		description:
			'You can spend 1 [[Resource_Focus_Point | FP]] to ignore the **Difficult Terrain** trait of a hex while moving through it.',
	},
	// Devout
	[Feat.EffortlessImbuedItemChanneling]: <FeatDefinition<void>>{
		key: Feat.EffortlessImbuedItemChanneling,
		name: 'Effortless Imbued Item Channeling',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Devout,
		level: 1,
		description:
			'Whenever you would spend [[Resource_Spirit_Point | Spirit Points]] to use an **Imbued Item** that would otherwise not require a [[Stat_Channeling | Channeling]] Check, you can make a [[Stat_Channeling | Channeling]] Check DC 15 to spend one less [[Resource_Spirit_Point | SP]].',
	},
	[Feat.FocusedChanneling]: <FeatDefinition<void>>{
		key: Feat.FocusedChanneling,
		name: 'Focused Channeling',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Devout,
		level: 3,
		description:
			"You can spend 2 [[Resource_Focus_Points | FP]] (and add the [[Concentrate]] trait, if it didn't have it already) when doing an action with the [[Channeling]] trait to get a +3 [[Circumstance Modifier | CM]].",
	},
	// Mixed
	// Crusader
	[Feat.DivineSmite]: <FeatDefinition<void>>{
		key: Feat.DivineSmite,
		name: 'Divine Smite',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Crusader,
		level: 1,
		description:
			'You can spend 2 [[Resource_Spirit_Point | SP]] when striking with a weapon to get a +3 [[Circumstance Modifier | CM]] as you channel raw power into it, making it acquire a distinct glow as you lift it to strike.',
	},
	[Feat.SpiritualArmor]: <FeatDefinition<void>>{
		key: Feat.SpiritualArmor,
		name: 'Spiritual Armor',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		source: ClassFlavor.Crusader,
		level: 2,
		description:
			'You can roll the [[Action_Shrug_Off | Shrug Off]] action using your **Primary Attribute** instead of [[Stat_Toughness | Toughness]].',
	},
};

export class FeatSlot {
	level: number;
	type: FeatType;

	// Normally all levels have only a order=0 feat slot, but additional feat slots can be acquired via feats
	order: number;

	constructor(level: number, type: FeatType, order: number = 0) {
		this.level = level;
		this.type = type;
		this.order = order;
	}

	get name(): string {
		return `Level ${this.level} ${this.type} Feat Slot${this.order > 0 ? ` (Specialized Training)` : ''}`;
	}

	toProp(): string {
		return `feat.${this.level}.${this.type}.${this.order}`;
	}

	static build({ level, type, order = 0 }: { level: number; type: FeatType; order?: number }): FeatSlot {
		return new FeatSlot(level, type, order);
	}

	static fromProp(prop: string): FeatSlot {
		const match = prop.match(/^feat\.(\d+)\.(\w+)(?:\.(\d+))?$/);
		if (!match) {
			throw new Error(`Invalid feat slot property: ${prop}`);
		}
		const level = parseInt(match[1]!, 10);
		const type = match[2]! as FeatType;
		const order = parseInt(match[3]!, 10);
		return new FeatSlot(level, type, order);
	}

	static generateSlots({
		maxLevel,
		hasSpecializedTraining,
	}: {
		maxLevel: number;
		hasSpecializedTraining: boolean;
	}): FeatSlot[] {
		const slots: FeatSlot[] = [];

		for (let level = 1; level <= maxLevel; level++) {
			slots.push(
				FeatSlot.build({
					level: level,
					type: level % 2 === 1 ? FeatType.Minor : FeatType.Major,
				}),
			);
			if (level === 1 && hasSpecializedTraining) {
				slots.push(
					FeatSlot.build({
						level: 1,
						type: FeatType.Minor,
						order: 1,
					}),
					FeatSlot.build({
						level: 1,
						type: FeatType.Minor,
						order: 2,
					}),
				);
			}
		}

		return slots;
	}
}
