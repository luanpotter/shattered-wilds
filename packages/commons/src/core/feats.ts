import { CLASS_ROLE_PRIMARY_ATTRIBUTE, ClassDefinition, ClassFlavor, ClassRealm, ClassRole } from './classes.js';
import { Race, RACE_DEFINITIONS, RacialStatModifier, Upbringing } from './races.js';
import { InherentModifier, ModifierSource } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus } from '../stats/value.js';
import { PredefinedArcaneSpell } from './arcane.js';

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
	General = 'General',
	ClassRole = 'ClassRole',
	Race = 'Race',
	Upbringing = 'Upbringing',
}

export type FeatSource = StaticFeatSource | Race | Upbringing | ClassRealm | ClassRole | ClassFlavor;

export type FeatEffect = FeatStatModifier;

export class FeatStatModifier {
	constructor(
		public statType: StatType,
		public value: Bonus,
	) {}

	toModifier(feat: FeatDefinition<string | void>): InherentModifier {
		return new InherentModifier({
			source: ModifierSource.Feat,
			name: feat.name,
			statType: this.statType,
			value: this.value,
		});
	}

	static from(raceModifier: RacialStatModifier): FeatStatModifier {
		return new FeatStatModifier(raceModifier.statType, raceModifier.value);
	}
}

export class FeatDefinition<T extends string | void> {
	key: Feat;
	name: string;
	type: FeatType;
	sources: FeatSource[];
	level: number;
	description: string;
	parameter: FeatParameter<T> | undefined;
	fullDescription: ((info: FeatInfo<T>) => string) | undefined;
	effects: ((info: FeatInfo<T>) => FeatEffect[]) | undefined;

	constructor({
		key,
		name,
		type,
		sources,
		level,
		description,
		parameter,
		fullDescription,
		effects,
	}: {
		key: Feat;
		name: string;
		type: FeatType;
		sources: FeatSource[];
		level: number;
		description: string;
		parameter?: FeatParameter<T>;
		fullDescription?: (info: FeatInfo<T>) => string;
		effects?: (info: FeatInfo<T>) => FeatEffect[];
	}) {
		this.key = key;
		this.name = name;
		this.type = type;
		this.sources = sources;
		this.level = level;
		this.description = description;
		this.parameter = parameter ?? undefined;
		this.fullDescription = fullDescription;
		this.effects = effects;
	}

	computeEffects(parameter: T): FeatEffect[] {
		const info = new FeatInfo<T>({
			feat: this,
			slot: undefined,
			parameter,
		});
		return this.effects?.(info) ?? [];
	}

	get categories(): FeatCategory[] {
		return this.sources.map(FeatDefinition.categoryFromSource);
	}

	get isGeneral(): boolean {
		return this.sources.includes(StaticFeatSource.General);
	}

	static categoryFromSource(source: FeatSource): FeatCategory {
		switch (source) {
			case StaticFeatSource.General:
				return FeatCategory.General;
			case StaticFeatSource.ClassRole:
				return FeatCategory.ClassRole;
			case StaticFeatSource.Race:
				return FeatCategory.Racial;
			case StaticFeatSource.Upbringing:
				return FeatCategory.Upbringing;
		}

		// Handle enum instances
		if (Object.values(Race).includes(source as Race)) {
			return FeatCategory.Racial;
		}
		if (Object.values(Upbringing).includes(source as Upbringing)) {
			return FeatCategory.Upbringing;
		}
		if (Object.values(ClassRole).includes(source as ClassRole)) {
			return FeatCategory.ClassRole;
		}
		if (Object.values(ClassFlavor).includes(source as ClassFlavor)) {
			return FeatCategory.ClassFlavor;
		}
		if (Object.values(ClassRealm).includes(source as ClassRealm)) {
			return FeatCategory.ClassRole;
		}

		throw new Error(`Unknown feat source: ${source}`);
	}

	fitsSlot(slot: FeatSlot): boolean {
		return this.fitsSlotLevel(slot.level) && this.fitsSlotType(slot.type);
	}

	private fitsSlotLevel(slotLevel: number): boolean {
		return this.level <= slotLevel;
	}

	private fitsSlotType(slotType: FeatType): boolean {
		switch (this.type) {
			case FeatType.Core:
				return false; // core feats cannot be slotted
			case FeatType.Major:
				return slotType === FeatType.Major;
			case FeatType.Minor:
				return true; // you can always fit a minor feat on a major slot
		}
	}

	fitsClass(classDef: ClassDefinition): boolean {
		return this.sources.some(source => FeatDefinition.doesSourceFitClass(source, classDef));
	}

	fitsRace(race: Race, upbringing: Upbringing): boolean {
		return this.sources.some(source => FeatDefinition.doesSourceFitRace(source, race, upbringing));
	}

	fitsCharacter(classDef: ClassDefinition, race: Race, upbringing: Upbringing): boolean {
		return this.sources.some(source => FeatDefinition.doesSourceFitCharacter(source, classDef, race, upbringing));
	}

	static doesSourceFitCharacter(
		source: FeatSource,
		classDef: ClassDefinition,
		raceDef: Race,
		upbringingDef: Upbringing,
	): boolean {
		return (
			source === StaticFeatSource.General ||
			FeatDefinition.doesSourceFitClass(source, classDef) ||
			FeatDefinition.doesSourceFitRace(source, raceDef, upbringingDef)
		);
	}

	private static doesSourceFitClass(source: FeatSource, classDef: ClassDefinition): boolean {
		const category = FeatDefinition.categoryFromSource(source);
		switch (category) {
			case FeatCategory.ClassRole:
				return source === classDef.role || source === classDef.realm || source === StaticFeatSource.ClassRole;
			case FeatCategory.ClassFlavor:
				return source === classDef.flavor;
			default:
				return false;
		}
	}

	private static doesSourceFitRace(source: FeatSource, race: Race, upbringing: Upbringing): boolean {
		const category = FeatDefinition.categoryFromSource(source);
		switch (category) {
			case FeatCategory.Racial:
				return source === race || source === StaticFeatSource.Race;
			case FeatCategory.Upbringing:
				return source === upbringing || source === StaticFeatSource.Upbringing;
			default:
				return false;
		}
	}
}

export interface FeatParameter<T extends string | void> {
	id: string;
	name: string;
	exact: boolean;
	// for Core feats only; sometimes the parameter can be independently chosen
	independentlyChosen?: boolean;
	values: T[];
}

export class FeatInfo<T extends string | void> {
	feat: FeatDefinition<T>;
	slot: FeatSlot | undefined;
	parameter: T;

	constructor({ feat, slot, parameter }: { feat: FeatDefinition<T>; slot: FeatSlot | undefined; parameter: T }) {
		this.feat = feat;
		this.slot = slot;
		this.parameter = parameter;
	}

	private parameterSuffix(): string {
		if (!this.parameter) {
			return '';
		}
		if (
			this.feat.parameter &&
			!this.feat.parameter.exact &&
			typeof this.parameter === 'string' &&
			!this.feat.parameter.values.includes(this.parameter)
		) {
			return ` (Other: ${this.parameter})`;
		}
		return ` (${this.parameter})`;
	}

	get name(): string {
		return `${this.feat.name}${this.parameterSuffix()}`;
	}

	get description(): string {
		return this.feat?.fullDescription?.(this) ?? `${this.feat.description}${this.parameterSuffix()}`;
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
			// Always encode as key#parameter, even for custom
			return `${this.feat.key}#${this.parameter}`;
		} else {
			return this.feat.key;
		}
	}

	static fromProp([key, value]: [string, string]): FeatInfo<string | void> {
		const slot = FeatSlot.fromProp(key);
		const [feat, parameter] = this.decodeFeatValue(value);
		const def = FEATS[feat];
		return new FeatInfo({ feat: def, slot, parameter });
	}

	private static decodeFeatValue(value: string): [Feat, string | null] {
		if (!value.includes('#')) {
			return [value as Feat, null];
		}
		// Support custom values: always treat after # as parameter
		const [feat, ...rest] = value.split('#');
		return [feat as Feat, rest.join('#')];
	}

	private static parseParameter = (
		def: FeatDefinition<string | void>,
		parameters: Record<string, string>,
	): string | undefined => {
		const parameterType = def.parameter?.id;
		if (parameterType) {
			const parameterValue = parameters[parameterType];
			if (parameterValue === undefined) {
				// For independentlyChosen core feats, do not fallback to 'N/A'
				if (def.parameter?.independentlyChosen) {
					return undefined;
				}
				throw new Error(`Parameter value for ${parameterType} is not defined for feat ${def.key}.`);
			}
			// If not exact, allow any string
			if (!def.parameter?.exact) {
				return parameterValue;
			}
			// If exact, must be in values
			if (!def.parameter.values.includes(parameterValue)) {
				throw new Error(`Parameter value '${parameterValue}' is not valid for feat ${def.key}.`);
			}
			return parameterValue;
		} else {
			return undefined;
		}
	};

	static hydrateFeatDefinition = (
		def: FeatDefinition<string | void>,
		parameters: Record<string, string>,
		slot: FeatSlot | undefined = undefined,
	): FeatInfo<string | void> => {
		// For core feats with user parameter, allow parameter from core prop
		let parameter: string | void = undefined;
		if (def.type === FeatType.Core && def.parameter && def.parameter.independentlyChosen && !slot) {
			const coreKey = FeatInfo.coreFeatPropKey(def.key);
			if (parameters[coreKey] !== undefined) {
				parameter = parameters[coreKey];
			} else {
				parameter = FeatInfo.parseParameter(def, parameters);
			}
		} else {
			parameter = FeatInfo.parseParameter(def, parameters);
		}
		return new FeatInfo({ feat: def, slot, parameter });
	};

	static hydrateFeatDefinitions = (
		defs: FeatDefinition<string | void>[],
		parameters: Record<string, string>,
	): FeatInfo<string | void>[] => {
		return defs.map(def => FeatInfo.hydrateFeatDefinition(def, parameters));
	};

	/**
	 * Returns the prop key for a user-parametrized core feat (e.g., core.SignatureSpell)
	 */
	static coreFeatPropKey(feat: Feat): string {
		return `core.${feat}`;
	}

	/**
	 * Returns the prop key/value tuple for a user-parametrized core feat,
	 * or undefined if not applicable.
	 */
	static toCoreProp(info: FeatInfo<string | void>): [string, string] | undefined {
		if (
			info.feat.type === FeatType.Core &&
			info.feat.parameter &&
			info.feat.parameter.independentlyChosen &&
			!info.slot &&
			info.parameter
		) {
			return [FeatInfo.coreFeatPropKey(info.feat.key), info.parameter];
		}
		return undefined;
	}

	/**
	 * Hydrates a FeatInfo from a core feat prop key/value
	 */
	static fromCoreProp(feat: Feat, value: string): FeatInfo<string | void> {
		const def = FEATS[feat];
		return new FeatInfo({ feat: def, slot: undefined, parameter: value });
	}
}

type MindAttributes = (typeof StatType.mindAttributes)[number];
type MindOrSoulAttributes = (typeof StatType.mindOrSoulAttributes)[number];

const skills = StatType.skills.map(stat => stat.name);
type Skills = (typeof skills)[number];

export enum Feat {
	// General
	TradeSpecialization = 'TradeSpecialization',
	ToolProficiency = 'ToolProficiency',
	LipReading = 'LipReading',
	AnimalMimicry = 'AnimalMimicry',
	Numberphile = 'Numberphile',
	UnreliableMemory = 'UnreliableMemory',
	GirthCompensation = 'GirthCompensation',
	BlindSense = 'BlindSense',
	SkillSpecialization = 'SkillSpecialization',
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
	RefinedAiming = 'TakeAim',
	RapidFire = 'RapidFire',
	PinningShot = 'PinningShot',
	QuickDraw = 'QuickDraw',
	DoubleShot = 'DoubleShot',
	SecondNatureShot = 'SecondNatureShot',
	BallisticReconstruction = 'BallisticReconstruction',
	// Tank
	ImprovedTaunt = 'ImprovedTaunt',
	QuickBash = 'QuickBash',
	ArmorFamiliarity = 'ArmorFamiliarity',
	BulkyFrame = 'BulkyFrame',
	GreaterCoverUp = 'GreaterCoverUp',
	StoutMetabolism = 'StoutMetabolism',
	// Martial
	ExertAuthority = 'ExertAuthority',
	DistributedShifts = 'DistributedShifts',
	WeaponHoning = 'WeaponHoning',
	Retaliation = 'Retaliation',
	KnowThyEnemy = 'KnowThyEnemy',
	// Survivalist
	Rage = 'Rage',
	InstinctiveTracking = 'InstinctiveTracking', // shared with Naturalist
	DisregardCover = 'DisregardCover',
	Potioneer = 'Potioneer', // shared with Naturalist
	ControlledRage = 'ControlledRage',
	// Scoundrel
	FancyFootwork = 'FancyFootwork',
	ThievesFingers = 'ThievesFingers',
	Leverage = 'Leverage',
	BeginnersLuck = 'BeginnersLuck',
	// Caster
	ArcaneCasting = 'ArcaneCasting',
	// Arcanist
	SignatureSpell = 'SignatureSpell',
	ReactiveCasting = 'ReactiveCasting',
	CantripCasting = 'CantripCasting',
	// Mechanist
	ToolAssistedCasting = 'ToolAssistedCasting',
	MechanisticAffinity = 'MechanisticAffinity',
	EyeForContraptions = 'EyeForContraptions',
	// Naturalist
	FocalConnection = 'FocalConnection',
	NaturalAffinity = 'NaturalAffinity',
	// Musicist
	LyricResonance = 'LyricResonance',
	InspiringPerformance = 'InspiringPerformance',
	TheresMoreToThisSong = 'TheresMoreToThisSong',
	// Erudite
	OtherworldlyFocus = 'OtherworldlyFocus',
	CognitiveResilience = 'CognitiveResilience',
	IReadAboutThat = 'IReadAboutThat',
	// Disciple
	DivineChanneling = 'DivineChanneling',
	SacredCalm = 'SacredCalm',
	FocusedReach = 'FocusedReach',
	ReligiousRites = 'ReligiousRites',
	DivineInspiration = 'DivineInspiration',
	// Adept
	FlurryOfBlows = 'FlurryOfBlows',
	ChannelingFists = 'ChannelingFists',
	CallousFists = 'CallousFists',
	SpiritToFlesh = 'SpiritToFlesh',
	// Inspired
	BountifulLuck = 'BountifulLuck',
	LuckyRelentlessness = 'LuckyRelentlessness',
	FavorableMovement = 'FavorableMovement',
	// Devout
	LesserDivineChanneling = 'LesserDivineChanneling',
	EffortlessAttuning = 'EffortlessAttuning',
	FocusedChanneling = 'FocusedChanneling',
	PiousModesty = 'PiousModesty',
	FervorousDevotion = 'FervorousDevotion',
	// Crusader
	DivineSmite = 'DivineSmite',
	SpiritualArmor = 'SpiritualArmor',
	MoralAuthority = 'MoralAuthority',
}

export enum Trade {
	Blacksmith = 'Blacksmith',
	Bookbinder = 'Bookbinder',
	Carpenter = 'Carpenter',
	Cartographer = 'Cartographer',
	Chandler = 'Chandler',
	Clothier = 'Clothier',
	Cook = 'Cook',
	Farmer = 'Farmer',
	Fisher = 'Fisher',
	Fletcher = 'Fletcher',
	Jeweler = 'Jeweler',
	Locksmith = 'Locksmith',
	Mason = 'Mason',
	Miner = 'Miner',
	Potter = 'Potter',
	Tanner = 'Tanner',
	Weaver = 'Weaver',
	Woodcutter = 'Woodcutter',
}

export enum Tool {
	ThievesTools = 'Thieves Tools',
	ClimbingGear = 'Climbing Gear',
	DisguiseKit = 'Disguise Kit',
	MusicalInstrument = 'Musical Instrument',
	HealersKit = "Healer's Kit",
}

// NOTE: typescript does not support generic type parameters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FEATS: Record<Feat, FeatDefinition<any>> = {
	[Feat.TradeSpecialization]: new FeatDefinition<Trade>({
		key: Feat.TradeSpecialization,
		name: 'Trade Specialization',
		type: FeatType.Minor,
		sources: [StaticFeatSource.General],
		level: 1,
		description:
			'You are acquainted with a specific trade, allowing you to perform basic tasks associated with it, such as a Blacksmith, Bookbinder, Carpenter, Cartographer, Chandler, Clothier, Cook, Farmer, Fisher, Fletcher, Herbalist, Jeweler, Locksmith, Mason, Miner, Potter, Tanner, Weaver, Weaver, Woodcutter, etc. You can pick this Feat multiple times for different trades.',
		parameter: {
			id: 'trade',
			name: 'Trade',
			exact: false,
			values: Object.values(Trade),
		},
	}),
	[Feat.ToolProficiency]: new FeatDefinition<Tool>({
		key: Feat.ToolProficiency,
		name: 'Tool Proficiency',
		type: FeatType.Minor,
		sources: [StaticFeatSource.General],
		level: 1,
		description:
			'You are proficient with a specific tool, granting you a `+3` [[Circumstance Modifier | CM]] when performing appropriate tasks using it. You can pick this Feat multiple times for different tools.',
		parameter: {
			id: 'tool',
			name: 'Tool',
			exact: false,
			values: Object.values(Tool),
		},
	}),
	[Feat.LipReading]: new FeatDefinition<void>({
		key: Feat.LipReading,
		name: 'Lip Reading',
		type: FeatType.Minor,
		sources: [StaticFeatSource.General],
		level: 1,
		description: 'You can read lips to understand what people are saying when you can see them clearly.',
	}),
	[Feat.AnimalMimicry]: new FeatDefinition<void>({
		key: Feat.AnimalMimicry,
		name: 'Animal Mimicry',
		type: FeatType.Minor,
		sources: [StaticFeatSource.General],
		level: 1,
		description:
			'You have an uncanny knack for mimicking animal sounds. If you are familiar with it, and a humanoid could conceivably reproduce it, you can make a good-enough impression that an untrained ear could not distinguish it. An expert (such as someone with the Sylvan Upbringing) could run an [[Intuition]] Check (or [[Knowledge]] if they have reason to suspect) to try to assess the veracity of the sound.',
	}),
	[Feat.Numberphile]: new FeatDefinition<void>({
		key: Feat.Numberphile,
		name: 'Numberphile',
		type: FeatType.Minor,
		sources: [StaticFeatSource.General],
		level: 1,
		description:
			'You are particularly good at double-digit basic arithmetic in your head, and you can quickly estimate the number of items in a group with relative accuracy at only a glance.',
	}),
	[Feat.UnreliableMemory]: new FeatDefinition<void>({
		key: Feat.UnreliableMemory,
		name: 'Unreliable Memory',
		type: FeatType.Minor,
		sources: [StaticFeatSource.General],
		level: 1,
		description:
			'You gain a `+6` [[Circumstance Modifier | CM]] to all [[Memory]] Checks attempting to recall information; however, your rolls will be done in secret by the DM, and if you fail, you will confidently remember incorrect (or half-correct) versions of the truth.',
	}),
	[Feat.GirthCompensation]: new FeatDefinition<void>({
		key: Feat.GirthCompensation,
		name: 'Girth Compensation',
		type: FeatType.Major,
		sources: [StaticFeatSource.General],
		level: 1,
		description: 'You can use [[STR]] as the **Primary Attribute** for **Light Melee** weapons.',
	}),
	[Feat.BlindSense]: new FeatDefinition<void>({
		key: Feat.BlindSense,
		name: 'Blind Sense',
		type: FeatType.Major,
		sources: [StaticFeatSource.General],
		level: 2,
		description:
			'Your strong connection to your Soul Realm allows you to expand your sense of hearing and smell. You can spend 1 [[Action_Point | AP]] and 2 [[Spirit_Point | SP]] to know the positions of any creature you are aware of within `6 Hexes` as well as if you could see them clearly. If they are explicitly trying to sneak, you get a +6 in your [[Perception]] Check.',
	}),
	[Feat.SkillSpecialization]: new FeatDefinition<Skills>({
		key: Feat.SkillSpecialization,
		name: 'Skill Specialization',
		type: FeatType.Major,
		sources: [StaticFeatSource.General],
		level: 4,
		description:
			'You have specialized into one of the three [[Skill | Skills]] for a given [[Attribute]]. You get +2 in that Skill and -2 on the other two.',
		parameter: {
			id: 'skill',
			name: 'Skill',
			exact: true,
			values: skills,
		},
		effects: info => {
			const skill = StatType.fromName(info.parameter);
			const siblings = StatType.skills.filter(s => s !== skill && s.parent === skill.parent);
			return [new FeatStatModifier(skill, Bonus.of(2)), ...siblings.map(s => new FeatStatModifier(s, Bonus.of(-2)))];
		},
		fullDescription: info => {
			const skill = StatType.fromName(info.parameter);
			const attribute = skill.parent;
			const effects = info.feat.effects?.(info);
			return `You have specialized into ${skill.name} within ${attribute}. You get:\n${effects?.map(e => `* ${e.statType.name}: ${e.value.description}`).join('\n')}`;
		},
	}),
	// Class
	[Feat.ClassSpecialization]: new FeatDefinition<ClassRole>({
		key: Feat.ClassSpecialization,
		name: 'Class Specialization',
		type: FeatType.Core,
		sources: [StaticFeatSource.ClassRole],
		level: 1,
		description: `+1 Attribute Modifier to the class's primary attribute`,
		parameter: {
			id: 'class-role',
			name: 'Class Role',
			exact: true,
			values: Object.values(ClassRole),
		},
		fullDescription: info => {
			const primaryAttribute = CLASS_ROLE_PRIMARY_ATTRIBUTE[info.parameter];
			return `Class Specialization modifier for ${info.parameter}: +1 ${primaryAttribute}.`;
		},
		effects: info => {
			const primaryAttribute = CLASS_ROLE_PRIMARY_ATTRIBUTE[info.parameter];
			return [new FeatStatModifier(primaryAttribute, Bonus.of(1))];
		},
	}),
	// Race
	[Feat.RacialModifier]: new FeatDefinition<Race>({
		key: Feat.RacialModifier,
		name: 'Racial Modifier',
		type: FeatType.Core,
		sources: [StaticFeatSource.Race],
		level: 0,
		description: '+1/-1 Racial Modifiers',
		parameter: {
			id: 'race',
			name: 'Race',
			exact: true,
			values: Object.values(Race),
		},
		fullDescription: info => {
			const raceDefinition = RACE_DEFINITIONS[info.parameter];
			const modifiers = raceDefinition.modifiers.map(e => `${e.statType}: ${e.value.description}`).join(' / ');
			if (!modifiers) {
				return `Racial Modifiers for ${raceDefinition.name}: Neutral.`;
			}
			return `Racial Modifiers for ${raceDefinition.name}: ${modifiers}.`;
		},
		effects: info => {
			const raceDefinition = RACE_DEFINITIONS[info.parameter];
			return raceDefinition.modifiers.map(FeatStatModifier.from);
		},
	}),
	[Feat.UpbringingFavoredModifier]: new FeatDefinition<MindOrSoulAttributes>({
		key: Feat.UpbringingFavoredModifier,
		name: 'Upbringing Favored Modifier',
		type: FeatType.Core,
		sources: [StaticFeatSource.Upbringing],
		level: 0,
		description: '+1 Upbringing Modifier',
		parameter: {
			id: 'upbringing-favored-modifier',
			name: 'Upbringing Favored Modifier',
			exact: true,
			values: StatType.mindOrSoulAttributes,
		},
		fullDescription: info => {
			const statName = info.parameter;
			return `Upbringing Favored Modifier: +1 ${statName}.`;
		},
		effects: info => {
			const statName = info.parameter;
			return [new FeatStatModifier(StatType.fromName(statName), Bonus.of(1))];
		},
	}),
	[Feat.UpbringingDisfavoredModifier]: new FeatDefinition<MindOrSoulAttributes>({
		key: Feat.UpbringingDisfavoredModifier,
		name: 'Upbringing Disfavored Modifier',
		type: FeatType.Core,
		sources: [StaticFeatSource.Upbringing],
		level: 0,
		description: '-1 Upbringing Modifier',
		parameter: {
			id: 'upbringing-disfavored-modifier',
			name: 'Upbringing Disfavored Modifier',
			exact: true,
			values: StatType.mindOrSoulAttributes,
		},
		fullDescription: info => {
			const statName = info.parameter;
			return `Upbringing Disfavored Modifier: -1 ${statName}.`;
		},
		effects: info => {
			const stat = info.parameter;
			return [new FeatStatModifier(StatType.fromName(stat), Bonus.of(-1))];
		},
	}),
	[Feat.SpecializedKnowledge]: new FeatDefinition<Upbringing>({
		key: Feat.SpecializedKnowledge,
		name: 'Specialized Knowledge',
		type: FeatType.Core,
		sources: [StaticFeatSource.Upbringing],
		level: 0,
		description:
			'You have `+3` to [[Knowledge]] or [[Intuition]] Checks about aspects related to a specific area of expertise.',
		parameter: {
			id: 'upbringing',
			name: 'Upbringing',
			exact: true,
			values: Object.values(Upbringing),
		},
	}),
	[Feat.SpecializedTraining]: new FeatDefinition<void>({
		key: Feat.SpecializedTraining,
		name: 'Specialized Training',
		type: FeatType.Core,
		sources: [Upbringing.Urban],
		level: 0,
		description: 'You gain two additional **Minor Feat** slots at Level 1.',
	}),
	[Feat.NomadicAlertness]: new FeatDefinition<void>({
		key: Feat.NomadicAlertness,
		name: 'Nomadic Alertness',
		type: FeatType.Core,
		sources: [Upbringing.Nomadic],
		level: 0,
		description:
			'Can make [[Awareness]] Checks to spot danger while sleeping in the Wilds with no [[Circumstance Modifier | CM]] penalty.',
	}),
	[Feat.TribalEndurance]: new FeatDefinition<void>({
		key: Feat.TribalEndurance,
		name: 'Tribal Endurance',
		type: FeatType.Core,
		sources: [Upbringing.Tribal],
		level: 0,
		description:
			'Pay 1 [[Heroism_Point | Heroism Point]] to reduce your [[Exhaustion]] _rank_ by 1 if you can directly tie a current task to your personal sense of duty to your tribe.',
	}),
	[Feat.LightFeet]: new FeatDefinition<void>({
		key: Feat.LightFeet,
		name: 'Light Feet',
		type: FeatType.Core,
		sources: [Upbringing.Sylvan],
		level: 0,
		description: 'Ignore **Difficult Terrain** due to natural vegetation, forest growth, etc.',
	}),
	[Feat.DarkVision]: new FeatDefinition<void>({
		key: Feat.DarkVision,
		name: 'Dark Vision',
		type: FeatType.Core,
		sources: [Upbringing.Telluric],
		level: 0,
		description: 'See black-and-white in the dark.',
	}),
	// Melee
	[Feat.SweepAttack]: new FeatDefinition<void>({
		key: Feat.SweepAttack,
		name: 'Sweep Attack',
		type: FeatType.Core,
		sources: [ClassRole.Melee],
		level: 1,
		description:
			'You can spend `3` [[Action_Points | AP]] and `1` [[Focus_Points | FP]] to perform an advanced **Melee Strike** against up to three adjacent enemies within your reach. You roll once for all targets, but they resist separately.',
	}),
	[Feat.OpportunityWindow]: new FeatDefinition<void>({
		key: Feat.OpportunityWindow,
		name: 'Opportunity Window',
		type: FeatType.Major,
		sources: [ClassRole.Melee],
		level: 2,
		description:
			'You can spend `1` [[Spirit_Point | SP]] to reduce by `1` (min `1`) the amount of [[Action_Point | AP]] you would spend to perform the [[Opportunity_Attack | Opportunity Attack]] reaction.',
	}),
	[Feat.SpinAttack]: new FeatDefinition<void>({
		key: Feat.SpinAttack,
		name: 'Spin Attack',
		type: FeatType.Minor,
		sources: [ClassRole.Melee],
		level: 3,
		description:
			'Upgrade the **Sweep Attack** to target any number of creatures; they no longer need to be adjacent to each other.',
	}),
	// Ranged
	[Feat.RefinedAiming]: new FeatDefinition<void>({
		key: Feat.RefinedAiming,
		name: 'Refined Aiming',
		type: FeatType.Core,
		sources: [ClassRole.Ranged],
		level: 1,
		description:
			'When using the [[Aim]] action, you can increase the base range of your Ranged Weapon by your [[Finesse]] modifier.',
	}),
	[Feat.RapidFire]: new FeatDefinition<void>({
		key: Feat.RapidFire,
		name: 'Rapid Fire',
		type: FeatType.Major,
		sources: [ClassRole.Ranged],
		level: 3,
		description:
			'Spend 2 [[Spirit_Points | SP]] (and the [[Action_Point | AP]] that it would cost) to use a [[Strike]] action for **Basic Ranged Attack** as a reaction; it loses the [[Concentrate]] trait.',
	}),
	[Feat.PinningShot]: new FeatDefinition<void>({
		key: Feat.PinningShot,
		name: 'Pinning Shot',
		type: FeatType.Major,
		sources: [ClassRole.Ranged],
		level: 2,
		description: 'You can perform the [[Stun]] action with **Ranged Attacks**.',
	}),
	[Feat.QuickDraw]: new FeatDefinition<void>({
		key: Feat.QuickDraw,
		name: 'Quick Draw',
		type: FeatType.Minor,
		sources: [ClassRole.Ranged],
		level: 3,
		description:
			'If you have at least one hand free, you can spend 1 [[Focus_Point | FP]] to draw a Light Melee Weapon without spending an action.',
	}),
	[Feat.DoubleShot]: new FeatDefinition<void>({
		key: Feat.DoubleShot,
		name: 'Double Shot',
		type: FeatType.Major,
		sources: [ClassRole.Ranged],
		level: 4,
		description:
			'You can spend 3 [[Spirit_Points | SP]] to shoot two projectiles with a single [[Strike]] action. Roll for each separately, one after the other.',
	}),
	[Feat.SecondNatureShot]: new FeatDefinition<void>({
		key: Feat.SecondNatureShot,
		name: 'Second Nature Shot',
		type: FeatType.Minor,
		sources: [ClassRole.Ranged],
		level: 4,
		description:
			'While performing a **Ranged Attack** with a weapon you are familiar with, you can spend 1 [[Spirit_Point | SP]] to ignore the [[Concentrate]] trait.',
	}),
	[Feat.BallisticReconstruction]: new FeatDefinition<void>({
		key: Feat.BallisticReconstruction,
		name: 'Ballistic Reconstruction',
		type: FeatType.Minor,
		sources: [ClassRole.Ranged],
		level: 5,
		description:
			'You can analyze the undisturbed remains of a projectile (such as an arrow or dart) and its impact site to determine the ballistic trajectory taken, including the approximate direction and distance of origin, as well as the nature of the weapon used,with reliable accuracy.',
	}),
	// Tank
	[Feat.ImprovedTaunt]: new FeatDefinition<void>({
		key: Feat.ImprovedTaunt,
		name: 'Improved Taunt',
		type: FeatType.Core,
		sources: [ClassRole.Tank],
		level: 1,
		description:
			'You can spend an additional 1 [[Spirit_Point | SP]] as you perform a [[Taunt]] action to get a +6 [[Circumstance Modifier | CM]] to your [[Presence]] Check.',
	}),
	[Feat.QuickBash]: new FeatDefinition<void>({
		key: Feat.QuickBash,
		name: 'Quick Bash',
		type: FeatType.Major,
		sources: [ClassRole.Tank],
		level: 2,
		description: 'You only need to spend 1 [[Action_Point | AP]] to perform a **Shield Bash** .',
	}),
	[Feat.ArmorFamiliarity]: new FeatDefinition<void>({
		key: Feat.ArmorFamiliarity,
		name: 'Armor Familiarity',
		type: FeatType.Minor,
		sources: [ClassRole.Tank],
		level: 3,
		description: 'You reduce your [[DEX]] penalty from wearing Armor by `1` (min `0`).',
	}),
	[Feat.BulkyFrame]: new FeatDefinition<void>({
		key: Feat.BulkyFrame,
		name: 'Bulky Frame',
		type: FeatType.Major,
		sources: [ClassRole.Tank],
		level: 2,
		description:
			'You have a `+6` [[Circumstance Modifier | CM]] to your [[Stance]] Checks to resist opponents of your size or larger attempting to [[Pass Through]] you.',
	}),
	[Feat.GreaterCoverUp]: new FeatDefinition<void>({
		key: Feat.GreaterCoverUp,
		name: 'Greater Cover-Up',
		type: FeatType.Major,
		sources: [ClassRole.Tank],
		level: 4,
		description:
			'When a creature performs a **Ranged Attack** involving firing a projectile at a target other than you, you can use pay 1 [[Action_Point | AP]] to react by jumping at most `1 Hex` onto the path of the incoming projectile. The original target gains [Cover_Greater | Greater Cover] against the attack, but if it misses by no more than -1 Shifts, you are hit instead.',
	}),
	[Feat.StoutMetabolism]: new FeatDefinition<void>({
		key: Feat.StoutMetabolism,
		name: 'Stout Metabolism',
		type: FeatType.Minor,
		sources: [ClassRole.Tank],
		level: 5,
		description: 'You can go upwards of a week without eating before suffering any significant ill effects.',
	}),
	// Martial
	[Feat.ExertAuthority]: new FeatDefinition<void>({
		key: Feat.ExertAuthority,
		name: 'Exert Authority',
		type: FeatType.Core,
		sources: [ClassFlavor.Martial],
		level: 1,
		description:
			'Spend 1 [[Action_Point | AP]] and 1 [[Spirit_Point | SP]] to authoritatively command an ally that can see and hear you clearly to perform a specific 1 [[Action_Point | AP]] action of your choice. The ally can choose to perform the action immediately without spending any AP if they wish.',
	}),
	[Feat.DistributedShifts]: new FeatDefinition<void>({
		key: Feat.DistributedShifts,
		name: 'Distributed Shifts',
		type: FeatType.Major,
		sources: [ClassFlavor.Martial],
		level: 2,
		description:
			'When you would inflict additional damage through a **Basic Melee Strike** to an enemy via **Crit Shifts**, you can instead attempt to distribute that additional Shift damage to any other adjacent creatures that would have been valid targets for this attack; they have to resist as if they were the target of the attack, but **Shifts** are not considered for this second roll.',
	}),
	[Feat.WeaponHoning]: new FeatDefinition<void>({
		key: Feat.WeaponHoning,
		name: 'Weapon Honing',
		type: FeatType.Minor,
		sources: [ClassFlavor.Martial],
		level: 3,
		description:
			'You can spend a few hours and 1 [[Spirit_Point | SP]] to hone and carefully refine your weapon to your personal style, preferences and needs, creating a unique connection between you and it. This connection will last until the end of the day, as it fades away in your memory, but while it lasts, the weapon will concede an additional `+1` Equipment Modifier bonus to your [[Strike]] actions.',
	}),
	[Feat.Retaliation]: new FeatDefinition<void>({
		key: Feat.Retaliation,
		name: 'Retaliation',
		type: FeatType.Major,
		sources: [ClassFlavor.Martial],
		level: 4,
		description: `Whenever a creature misses a **Melee Basic Attack** against you, you can spend 1 [[Focus_Point | FP]] to perform the [[Opportunity_Attack | Opportunity Attack]] reaction against them; you still pay the [[Action_Point | AP]] (and any other) cost.

			For example, if you choose a [[Strike]] as your reaction, you will pay 2 [[Action_Points | AP]] and 1 [[Focus_Point | FP]] in total.`,
	}),
	[Feat.KnowThyEnemy]: new FeatDefinition<void>({
		key: Feat.KnowThyEnemy,
		name: 'Know Thy Enemy',
		type: FeatType.Minor,
		sources: [ClassFlavor.Martial],
		level: 5,
		description: `You can roll an [[Intuition]] Check to inspect a creature you can see clearly for a couple minutes in order to asses their approximate threat or power level; some notion of their combat capabilities; or other noticeable tactical or military information. You can ask for specific details (to the DM's discretion), or just seek for a general impression.`,
	}),
	// Survivalist
	[Feat.Rage]: new FeatDefinition<void>({
		key: Feat.Rage,
		name: 'Rage',
		type: FeatType.Core,
		sources: [ClassFlavor.Survivalist],
		level: 1,
		description:
			'You can spend 1 [[Action_Point | AP]] and 1 [[Spirit_Point | SP]] to become **Enraged**: reduce your [[Focus_Point | Focus Points]] to `1`, and it cannot be further reduced while you are **Enraged**; you cannot [[Concentrate]] while **Enraged**; and you gain a [[Circumstance Modifier | CM]] to your **Body Attacks** while **Enraged** that starts with `+6` and is reduced by `1` each time it is used. When the bonus reaches `0`, or you fail to perform at least on **Basic Attack** in your turn, you are no longer **Enraged**.',
	}),
	[Feat.InstinctiveTracking]: new FeatDefinition<void>({
		key: Feat.InstinctiveTracking,
		name: 'Instinctive Tracking',
		type: FeatType.Minor,
		sources: [ClassFlavor.Survivalist, ClassFlavor.Naturalist],
		level: 2,
		description:
			'You get a `+3` [[Circumstance Modifier | CM]] to Checks you make related to tracking creatures (following footprints, etc), and you can spend 1 [[Focus_Point | FP]] to gain an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).',
	}),
	[Feat.DisregardCover]: new FeatDefinition<void>({
		key: Feat.DisregardCover,
		name: 'Disregard Cover',
		type: FeatType.Major,
		sources: [ClassFlavor.Survivalist],
		level: 2,
		description:
			'You can consider **Passive Cover** for your **Ranged Attacks** to be of one degree less than it would otherwise be.',
	}),
	[Feat.Potioneer]: new FeatDefinition<void>({
		key: Feat.Potioneer,
		name: 'Potioneer',
		type: FeatType.Minor,
		sources: [ClassFlavor.Survivalist, ClassFlavor.Naturalist, ClassFlavor.Devout],
		level: 3,
		description:
			'You can spend a few hours to forage for ingredients on the appropriate environment with an [[Intuition]] Check. You can also spend a few hours and 1 [[Spirit_Point | SP]] to brew a salve that can be used to heal an amount of points (determined by a [[Knowledge]] Check) of either [[Vitality_Point | VP]], [[Focus_Point | FP]] or [[Spirit_Point | SP]] (your choice). The salve will lose potency and expire after a few days.',
	}),
	[Feat.ControlledRage]: new FeatDefinition<void>({
		key: Feat.ControlledRage,
		name: 'Controlled Rage',
		type: FeatType.Major,
		sources: [ClassFlavor.Survivalist],
		level: 4,
		description: `When using the [[Rage]] action, you can spend additional [[Spirit_Point | SPs]] to keep more of your [[Focus_Point | FP]]: for each additional [[Spirit_Point | SP]] you spend, you can keep an additional [[Focus_Point | FP]].

			For example you can spend 1 [[Action_Point | AP]] and 3 [[Spirit_Point | SP]] in total to become **Enraged** while keeping 3 [[Focus_Point | FP]].`,
	}),
	// Scoundrel
	[Feat.FancyFootwork]: new FeatDefinition<void>({
		key: Feat.FancyFootwork,
		name: 'Fancy Footwork',
		type: FeatType.Core,
		sources: [ClassFlavor.Scoundrel],
		level: 1,
		description:
			'If you make a **Melee Basic Attack** against a target, you do not provoke [[Opportunity_Attack | Opportunity Attacks]] from that target until the end of the turn.',
	}),
	[Feat.ThievesFingers]: new FeatDefinition<void>({
		key: Feat.ThievesFingers,
		name: 'Thieves Fingers',
		type: FeatType.Minor,
		sources: [ClassFlavor.Scoundrel],
		level: 2,
		description:
			'You get a `+3` [[Circumstance Modifier | CM]] to any Checks you perform associated with lock picking or trap disarming. You can spend 1 [[Focus_Point | FP]] to get an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).',
	}),
	[Feat.Leverage]: new FeatDefinition<void>({
		key: Feat.Leverage,
		name: 'Leverage',
		type: FeatType.Major,
		sources: [ClassFlavor.Scoundrel],
		level: 2,
		description:
			'If you would inflict additional damage through a **Basic Strike** to an enemy via **Crit Shifts**, you can instead spend any number of [[Spirit_Point | SP]] (up to your level) to inflict that many additional [[Vitality_Point | VP]] of damage. So for example if you get 2 **Shifts** for an attack (normal damage of 3), you can spend 2 [[Spirit_Point | SP]] to inflict 2 additional [[Vitality_Point | VP]] of damage (total damage of 5).',
	}),
	[Feat.BeginnersLuck]: new FeatDefinition<void>({
		key: Feat.BeginnersLuck,
		name: 'Beginners Luck',
		type: FeatType.Minor,
		sources: [ClassFlavor.Scoundrel],
		level: 3,
		description:
			'You can use a [[Focus_Point | FP]] to pay for a [[Luck_Die | Luck Die]] for a Check of a Skill you do not have any points invested in.',
	}),
	// Caster
	[Feat.ArcaneCasting]: new FeatDefinition<MindAttributes>({
		key: Feat.ArcaneCasting,
		name: 'Arcane Casting',
		type: FeatType.Core,
		sources: [ClassRealm.Caster],
		level: 1,
		description:
			'Unlocks Arcane Casting. See [Rules: Arcane](/rules/arcane) for details on how the **Arcane** magic system works.',
		parameter: {
			id: 'stat',
			name: 'Stat',
			exact: true,
			values: StatType.mindAttributes,
		},
	}),
	// Arcanist
	[Feat.SignatureSpell]: new FeatDefinition<PredefinedArcaneSpell>({
		key: Feat.SignatureSpell,
		name: 'Signature Spell',
		type: FeatType.Core,
		sources: [ClassFlavor.Arcanist],
		level: 1,
		description:
			'You have fully committed all the details of a specific form of the Fundamental Arcane Spell (such as from the [[Predefined_Arcane_Spells | Predefined Spells]] list); you have a `+3` to cast that exact spell.',
		parameter: {
			id: 'spell',
			name: 'Spell',
			exact: false,
			independentlyChosen: true,
			values: Object.values(PredefinedArcaneSpell),
		},
	}),
	[Feat.ReactiveCasting]: new FeatDefinition<void>({
		key: Feat.ReactiveCasting,
		name: 'Reactive Casting',
		type: FeatType.Major,
		sources: [ClassFlavor.Arcanist],
		level: 2,
		description:
			'You can spend 1 [[Heroism Point]] to cast a standard 2 [[Action_Point | AP]] / 1 [[Focus_Point | FP]] spell as a reaction.',
	}),
	[Feat.CantripCasting]: new FeatDefinition<void>({
		key: Feat.CantripCasting,
		name: 'Cantrip Casting',
		type: FeatType.Minor,
		sources: [ClassFlavor.Arcanist],
		level: 3,
		description:
			'When not in the pressure of an **Encounter**, you can spend a few minutes to cast a standard 2 [[Action_Point | AP]] / 1 [[Focus_Point | FP]] spell without spending a [[Focus Point]].',
	}),
	// Mechanist
	[Feat.ToolAssistedCasting]: new FeatDefinition<void>({
		key: Feat.ToolAssistedCasting,
		name: 'Tool-Assisted Casting',
		type: FeatType.Core,
		sources: [ClassFlavor.Mechanist],
		level: 1,
		description:
			'You can create and use **One-Handed** (`+2`) and **Two-Handed** (`+3`) tools, crazy mechanical contraptions to assist you with the execution of **Somatic Spell Components**. You can use these tools to execute a **Somatic Component** of any spell, but you cannot use any other type of **Spell Component**.',
	}),
	[Feat.MechanisticAffinity]: new FeatDefinition<void>({
		key: Feat.MechanisticAffinity,
		name: 'Mechanistic Affinity',
		type: FeatType.Major,
		sources: [ClassFlavor.Mechanist],
		level: 2,
		description:
			'You can spend a few hours and 1+ [[Focus_Point | FP]] to attempt to concoct a mechanical contraption to achieve any specific simple goal (use a Check of your primary attribute). Think gears, belts, pulleys, etc in a small pocket sized creation. As an example, you could craft a music box, a clock, a small mechanical hinge to open a door. The DM will adjudicate the complexity and feasibility of the project.',
	}),
	[Feat.EyeForContraptions]: new FeatDefinition<void>({
		key: Feat.EyeForContraptions,
		name: 'Eye for Contraptions',
		type: FeatType.Minor,
		sources: [ClassFlavor.Mechanist],
		level: 3,
		description:
			'You are particularly good at analyzing and assessing the functionality of mechanical contraptions, such as mechanical devices, locks, and traps. You have a `+3` [[Circumstance Modifier | CM]] to [[IQ]] Checks to discern information from such contraptions, and can spend `1` [[Focus_Point | FP]] to get an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).',
	}),
	// Naturalist
	[Feat.FocalConnection]: new FeatDefinition<void>({
		key: Feat.FocalConnection,
		name: 'Focal Connection',
		type: FeatType.Core,
		sources: [ClassFlavor.Naturalist],
		level: 1,
		description:
			'You can create and use a personal **Custom Focus** (`+4`) that is bound to you. You can use this **Custom Focus** to execute the **Focal Component** of any spell, but you cannot use any other type of **Spell Component**.',
	}),
	[Feat.NaturalAffinity]: new FeatDefinition<void>({
		key: Feat.NaturalAffinity,
		name: 'Natural Affinity',
		type: FeatType.Major,
		sources: [ClassFlavor.Naturalist],
		level: 2,
		description:
			'You can use [[Command]] Spells with a `+3` [[Circumstance Modifier | CM]] to control plants, encouraging super-accelerated growth, redirection, flowers to blooms, etc. The difficult and augmentations are similar to the [[Guide Animal]] spell.',
	}),
	// Musicist
	[Feat.LyricResonance]: new FeatDefinition<void>({
		key: Feat.LyricResonance,
		name: 'Lyric Resonance',
		type: FeatType.Core,
		sources: [ClassFlavor.Musicist],
		level: 1,
		description:
			'You can use **One-Handed** (`+2`) and **Two-Handed** (`+3`) instruments to assist you with the execution of **Verbal Spell Components**. You can use these instruments to execute a **Verbal Component** of any spell, but you cannot use any other type of **Spell Component**.',
	}),
	[Feat.InspiringPerformance]: new FeatDefinition<void>({
		key: Feat.InspiringPerformance,
		name: 'Inspiring Performance',
		type: FeatType.Major,
		sources: [ClassFlavor.Musicist],
		level: 2,
		description:
			'As a reaction to an ally performing an action, you can spend a [[Spirit_Point | SP]] to give them a +1 [[Circumstance Modifier | CM]] to a Check associated with their action. You can only do this once per action, the action must not be a reaction, and you cannot do this to yourself.',
	}),
	[Feat.TheresMoreToThisSong]: new FeatDefinition<void>({
		key: Feat.TheresMoreToThisSong,
		name: "There's More to This Song",
		type: FeatType.Minor,
		sources: [ClassFlavor.Musicist],
		level: 3,
		description:
			'You can attempt to hide a message in a song you are singing, only to be perceived by certain listeners. Roll a [[Speechcraft]] Check with `+6` [[Circumstance Modifier | CM]]; all listeners then contest with an [[IQ]] Check. The targets you wanted to understand get a `+3` [[Circumstance Modifier | CM]] to their Check, or a `+6` if they are aware that you are trying to hide a message.',
	}),
	// Erudite
	[Feat.OtherworldlyFocus]: new FeatDefinition<void>({
		key: Feat.OtherworldlyFocus,
		name: 'Otherworldly Focus',
		type: FeatType.Major,
		sources: [ClassRole.Erudite],
		level: 4,
		description:
			'Whenever you would spend [[Spirit_Point | SP]] to activate a wand or stave, you can spend [[Focus_Point | FP]] instead (the action still treated as [[Channeling]]).',
	}),
	[Feat.CognitiveResilience]: new FeatDefinition<void>({
		key: Feat.CognitiveResilience,
		name: 'Cognitive Resilience',
		type: FeatType.Major,
		sources: [ClassRole.Erudite],
		level: 4,
		description:
			'Whenever you become [[Distracted]] while you are concentrating, you can spend 1 [[Focus_Point | FP]] to avoid losing your concentration. You still become [[Distracted]], which affects any future actions.',
	}),
	[Feat.IReadAboutThat]: new FeatDefinition<void>({
		key: Feat.IReadAboutThat,
		name: 'I Read About That',
		type: FeatType.Minor,
		sources: [ClassRole.Erudite],
		level: 5,
		description:
			'While researching in substantial text collections (such as libraries), you can roll [[Knowledge]] instead of [[Serendipity]] when using the [[Write History]] action to establish that a specific answer is present.',
	}),
	//Disciple
	[Feat.DivineChanneling]: new FeatDefinition<void>({
		key: Feat.DivineChanneling,
		name: 'Divine Channeling',
		type: FeatType.Core,
		sources: [ClassRole.Disciple],
		level: 1,
		description:
			'Unlocks Divine Channeling. See [Rules: Divine](/rules/divine) for details on how the **Divine** magic system works.',
	}),
	[Feat.SacredCalm]: new FeatDefinition<void>({
		key: Feat.SacredCalm,
		name: 'Sacred Calm',
		type: FeatType.Major,
		sources: [ClassRole.Disciple],
		level: 2,
		description:
			'You can perform the [[Calm]] action on an ally that you can touch. You can spend an additional 1 [[Focus_Point | FP]] to get a `+6` [[Circumstance Modifier | CM]] when performing the [[Calm]] action.',
	}),
	[Feat.FocusedReach]: new FeatDefinition<void>({
		key: Feat.FocusedReach,
		name: 'Focused Reach',
		type: FeatType.Major,
		sources: [ClassRole.Disciple],
		level: 2,
		description:
			'You can spend 1 [[Action_Point | AP]] and 1 [[Focus_Point | FP]] to double your [[Influence Range]] until the start of your next turn.',
	}),
	[Feat.ReligiousRites]: new FeatDefinition<void>({
		key: Feat.ReligiousRites,
		name: 'Religious Rites',
		type: FeatType.Minor,
		sources: [ClassRole.Disciple],
		level: 3,
		description:
			'You are particularly knowledgeable about the specific rites, rituals, the nature of your contract, or whatever are the details of your connection with your Protean. You get a `+3` to [[Knowledge]] Checks related to these topics, and can spend `1` [[Focus_Point | FP]] to get an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).',
	}),
	[Feat.DivineInspiration]: new FeatDefinition<void>({
		key: Feat.DivineInspiration,
		name: 'Divine Inspiration',
		type: FeatType.Major,
		sources: [ClassRole.Disciple],
		level: 4,
		description:
			'You can roll [[Devotion]] instead of [[Empathy]] when using the [[Inspire]] action; additionally, you can spend 1 [[Focus_Point | FP]] to gain a +3 [[Circumstance Modifier | CM]] to the Check.',
	}),
	//Adept
	[Feat.FlurryOfBlows]: new FeatDefinition<void>({
		key: Feat.FlurryOfBlows,
		name: 'Flurry of Blows',
		type: FeatType.Core,
		sources: [ClassRole.Adept],
		level: 1,
		description:
			'You can spend 1 [[Spirit_Point | SP]] to make an unarmed [[Strike]] cost only 1 [[Action_Point | AP]].',
	}),
	[Feat.ChannelingFists]: new FeatDefinition<void>({
		key: Feat.ChannelingFists,
		name: 'Channeling Fists',
		type: FeatType.Major,
		sources: [ClassRole.Adept],
		level: 2,
		description: `You can spend 1 [[Spirit_Point | SP]] to get a +1 [[Circumstance Modifier | CM]] to an unarmed Attack Check. You _can_ stack this effect on the same attack.`,
	}),
	[Feat.CallousFists]: new FeatDefinition<void>({
		key: Feat.CallousFists,
		name: 'Callous Fists',
		type: FeatType.Minor,
		sources: [ClassRole.Adept],
		level: 1,
		description: 'You can use [[CON]] instead of [[STR]] to perform unarmed attacks.',
	}),
	[Feat.SpiritToFlesh]: new FeatDefinition<void>({
		key: Feat.SpiritToFlesh,
		name: 'Spirit to Flesh',
		type: FeatType.Minor,
		sources: [ClassRole.Adept],
		level: 3,
		description:
			'You can resist the effects of **Transfiguration** spells against your body using your [[FOW]] instead of [[Toughness]].',
	}),
	// Inspired
	[Feat.BountifulLuck]: new FeatDefinition<void>({
		key: Feat.BountifulLuck,
		name: 'Bountiful Luck',
		type: FeatType.Core,
		sources: [ClassRole.Inspired],
		level: 1,
		description:
			'You can spend [[Spirit_Points | SP]] instead of [[Heroism_Points | Heroism Points]] to use the [[Karmic_Resistance | Karmic Resistance]], [[Write_History | Write History]] and [[Luck_Die | Luck Die]] actions.',
	}),
	[Feat.LuckyRelentlessness]: new FeatDefinition<void>({
		key: Feat.LuckyRelentlessness,
		name: 'Lucky Relentlessness',
		type: FeatType.Minor,
		sources: [ClassRole.Inspired],
		level: 3,
		description: 'Your DC for the [[Heroic_Relentlessness | Heroic Relentlessness]] action is `10`.',
	}),
	[Feat.FavorableMovement]: new FeatDefinition<void>({
		key: Feat.FavorableMovement,
		name: 'Favorable Movement',
		type: FeatType.Major,
		sources: [ClassRole.Inspired],
		level: 2,
		description:
			'You can spend 1 [[Focus_Point | FP]] as you take a **Movement Action** to ignore **Difficult Terrain** for this movement.',
	}),
	// Devout
	[Feat.LesserDivineChanneling]: new FeatDefinition<void>({
		key: Feat.LesserDivineChanneling,
		name: 'Lesser Divine Channeling',
		type: FeatType.Major,
		sources: [ClassFlavor.Devout],
		level: 2,
		description:
			'Unlocks Divine Channeling for non-Adepts; this probably represent a much more indirect connection to some higher (possibly unknown) force. See [Rules: Divine](/rules/divine) for details on how the **Divine** magic system works.',
	}),
	[Feat.EffortlessAttuning]: new FeatDefinition<void>({
		key: Feat.EffortlessAttuning,
		name: 'Effortless Attuning',
		type: FeatType.Core,
		sources: [ClassFlavor.Devout],
		level: 1,
		description:
			'Whenever you would spend [[Spirit_Point | Spirit Points]] to use an **Imbued Item** that would otherwise not require an [[Attunement]] Check, you can make an [[Attunement]] Check DC 15 to spend one less [[Spirit_Point | SP]] (min 0).',
	}),
	[Feat.FocusedChanneling]: new FeatDefinition<void>({
		key: Feat.FocusedChanneling,
		name: 'Focused Channeling',
		type: FeatType.Major,
		sources: [ClassFlavor.Devout],
		level: 2,
		description:
			"You can spend 1 [[Focus_Points | FP]] (and add the [[Concentrate]] trait, if it didn't have it already) when doing an action with the [[Channeling]] trait to get a +3 [[Circumstance Modifier | CM]].",
	}),
	[Feat.PiousModesty]: new FeatDefinition<void>({
		key: Feat.PiousModesty,
		name: 'Pious Modesty',
		type: FeatType.Major,
		sources: [ClassFlavor.Devout],
		level: 4,
		description:
			'You gain a +6 [[Circumstance Modifier | CM]] to [[Resolve]] contested checks resisting the [[Demoralize]] or other actions attempting to cause the [[Distraught]] condition by targeting your self-esteem.',
	}),
	[Feat.FervorousDevotion]: new FeatDefinition<void>({
		key: Feat.FervorousDevotion,
		name: 'Fervorous Devotion',
		type: FeatType.Minor,
		sources: [ClassFlavor.Devout],
		level: 5,
		description:
			'You can use your [[Devotion]] instead of [[Discipline]] when resisting the temptation of your **Vices**.',
	}),
	// Mixed - WIP
	// Crusader
	[Feat.DivineSmite]: new FeatDefinition<void>({
		key: Feat.DivineSmite,
		name: 'Divine Smite',
		type: FeatType.Core,
		sources: [ClassFlavor.Crusader],
		level: 1,
		description:
			'You can spend 2 [[Spirit_Point | SP]] when striking with a weapon to get a +3 [[Circumstance Modifier | CM]] as you channel raw power into it, making it acquire a distinct glow as you lift it to strike.',
	}),
	[Feat.SpiritualArmor]: new FeatDefinition<void>({
		key: Feat.SpiritualArmor,
		name: 'Spiritual Armor',
		type: FeatType.Major,
		sources: [ClassFlavor.Crusader],
		level: 2,
		description:
			'You can roll the [[Shrug_Off | Shrug Off]] action using your **Primary Attribute** instead of [[Toughness]].',
	}),
	[Feat.MoralAuthority]: new FeatDefinition<void>({
		key: Feat.MoralAuthority,
		name: 'Moral Authority',
		type: FeatType.Minor,
		sources: [ClassFlavor.Crusader],
		level: 3,
		description:
			"If you witness someone performing an action that directly contradicts your (or your Protean's) **Tenets**, you get a `+6` to any [[CHA]]-based Checks attempting to stop or dissuade this behavior (such as intimidation, persuasion, deception, etc).",
	}),
};

export class FeatSlot {
	level: number;
	type: FeatType;
	order: number;

	constructor({ level, type, order = 0 }: { level: number; type: FeatType; order?: number }) {
		this.level = level;
		this.type = type;
		this.order = order;
	}

	get name(): string {
		return `Level ${this.level} ${this.type} Feat Slot${this.order > 0 ? ` (Specialized Training)` : ''}`;
	}

	get isExtra(): boolean {
		return this.order > 0;
	}

	toProp(): string {
		return `feat.${this.level}.${this.type}.${this.order}`;
	}

	static fromProp(prop: string): FeatSlot {
		const match = prop.match(/^feat\.(\d+)\.(\w+)(?:\.(\d+))?$/);
		if (!match) {
			throw new Error(`Invalid feat slot property: ${prop}`);
		}
		const level = parseInt(match[1]!, 10);
		const type = match[2]! as FeatType;
		const order = parseInt(match[3]!, 10);
		return new FeatSlot({ level, type, order });
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
				new FeatSlot({
					level: level,
					type: level % 2 === 1 ? FeatType.Minor : FeatType.Major,
				}),
			);
			if (level === 1 && hasSpecializedTraining) {
				slots.push(
					new FeatSlot({
						level: 1,
						type: FeatType.Minor,
						order: 1,
					}),
					new FeatSlot({
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
