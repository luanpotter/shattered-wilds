import { AttributeType, Modifier } from './core';

// Feat Types
export enum FeatType {
	Core = 'Core',
	Major = 'Major',
	Minor = 'Minor',
}

export enum FeatCategory {
	Racial = 'Racial',
	Upbringing = 'Upbringing',
	ClassModifier = 'Class Modifier',
	ClassRole = 'Class Role',
	ClassFlavor = 'Class Flavor',
	General = 'General',
}

export interface FeatDefinition {
	id: string;
	name: string;
	type: FeatType;
	category: FeatCategory;
	description: string;
	level?: number;
	prerequisites?: string[];
	modifiers?: Modifier[];
	traits?: string[];
	parameters?: FeatParameter[];
	canPickMultipleTimes?: boolean;
}

export interface FeatParameter {
	id: string;
	name: string;
	type: 'choice' | 'text';
	options?: string[]; // For choice type
	placeholder?: string; // For text type
	required: boolean;
}

export interface ParameterizedFeatInstance {
	baseFeatId: string;
	parameters: Record<string, string>;
	fullName: string;
	fullId: string;
}

// Races
export enum Race {
	Human = 'Human',
	Elf = 'Elf',
	Dwarf = 'Dwarf',
	Orc = 'Orc',
	Fey = 'Fey',
	Goliath = 'Goliath',
	Goblin = 'Goblin',
}

// Upbringings
export enum Upbringing {
	Urban = 'Urban',
	Nomadic = 'Nomadic',
	Tribal = 'Tribal',
	Sylvan = 'Sylvan',
	Telluric = 'Telluric',
}

// All Feats definitions
export const FEATS: Record<string, FeatDefinition> = {
	// ==== RACIAL MODIFIERS ====
	'racial-human': {
		id: 'racial-human',
		name: 'Human Racial Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Racial,
		description: 'Neutral - no modifiers',
		modifiers: [],
	},
	'racial-elf': {
		id: 'racial-elf',
		name: 'Elf Racial Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Racial,
		description: '+DEX, -CON',
		modifiers: [
			{ source: 'Elf Race', value: 1, attributeType: AttributeType.DEX },
			{ source: 'Elf Race', value: -1, attributeType: AttributeType.CON },
		],
	},
	'racial-dwarf': {
		id: 'racial-dwarf',
		name: 'Dwarf Racial Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Racial,
		description: '+CON, -DEX',
		modifiers: [
			{ source: 'Dwarf Race', value: 1, attributeType: AttributeType.CON },
			{ source: 'Dwarf Race', value: -1, attributeType: AttributeType.DEX },
		],
	},
	'racial-orc': {
		id: 'racial-orc',
		name: 'Orc Racial Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Racial,
		description: '+STR, -DEX',
		modifiers: [
			{ source: 'Orc Race', value: 1, attributeType: AttributeType.STR },
			{ source: 'Orc Race', value: -1, attributeType: AttributeType.DEX },
		],
	},
	'racial-fey': {
		id: 'racial-fey',
		name: 'Fey Racial Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Racial,
		description: '+DEX, -STR',
		modifiers: [
			{ source: 'Fey Race', value: 1, attributeType: AttributeType.DEX },
			{ source: 'Fey Race', value: -1, attributeType: AttributeType.STR },
		],
	},
	'racial-goliath': {
		id: 'racial-goliath',
		name: 'Goliath Racial Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Racial,
		description: '+STR, -CON',
		modifiers: [
			{ source: 'Goliath Race', value: 1, attributeType: AttributeType.STR },
			{ source: 'Goliath Race', value: -1, attributeType: AttributeType.CON },
		],
	},
	'racial-goblin': {
		id: 'racial-goblin',
		name: 'Goblin Racial Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Racial,
		description: '+CON, -STR',
		modifiers: [
			{ source: 'Goblin Race', value: 1, attributeType: AttributeType.CON },
			{ source: 'Goblin Race', value: -1, attributeType: AttributeType.STR },
		],
	},

	// ==== UPBRINGING MODIFIERS ====
	'upbringing-urban': {
		id: 'upbringing-urban',
		name: 'Urban Upbringing Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description: 'Typical: +INT/CHA/LCK, -WIS/DIV/FOW',
		modifiers: [], // Will be applied dynamically based on player choice
	},
	'upbringing-nomadic': {
		id: 'upbringing-nomadic',
		name: 'Nomadic Upbringing Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description: 'Typical: +WIS/FOW/LCK, -INT/CHA/DIV',
		modifiers: [], // Will be applied dynamically based on player choice
	},
	'upbringing-tribal': {
		id: 'upbringing-tribal',
		name: 'Tribal Upbringing Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description: 'Typical: +CHA/DIV/FOW, -INT/WIS/LCK',
		modifiers: [], // Will be applied dynamically based on player choice
	},
	'upbringing-sylvan': {
		id: 'upbringing-sylvan',
		name: 'Sylvan Upbringing Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description: 'Typical: +WIS/DIV/FOW, -INT/CHA/LCK',
		modifiers: [], // Will be applied dynamically based on player choice
	},
	'upbringing-telluric': {
		id: 'upbringing-telluric',
		name: 'Telluric Upbringing Modifiers',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description: 'Typical: +INT/CHA/LCK, -WIS/DIV/FOW',
		modifiers: [], // Will be applied dynamically based on player choice
	},

	// ==== UPBRINGING SPECIFIC FEATS ====
	'specialized-training': {
		id: 'specialized-training',
		name: 'Specialized Training',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description: 'Choose any two Minor Feats from the General Feats list',
		level: 0,
	},
	'specialized-knowledge-urban': {
		id: 'specialized-knowledge-urban',
		name: 'Specialized Knowledge (Urban)',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description:
			'You have +3 to Knowledge or Intuition Checks about urban lore, politics, commerce',
		level: 0,
	},
	'nomadic-alertness': {
		id: 'nomadic-alertness',
		name: 'Nomadic Alertness',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description:
			'Can make Awareness Checks to spot danger while sleeping in the Wilds with no CM penalty',
		level: 0,
	},
	'specialized-knowledge-nomadic': {
		id: 'specialized-knowledge-nomadic',
		name: 'Specialized Knowledge (Nomadic)',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description:
			'You have +3 to Knowledge or Intuition Checks about surviving in the Wilds, foraging, tracking',
		level: 0,
	},
	'tribal-endurance': {
		id: 'tribal-endurance',
		name: 'Tribal Endurance',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description:
			'Pay 1 Heroism Point to reduce your Exhaustion Level by 1 if you can directly tie a current task to your personal sense of duty to your tribe',
		level: 0,
	},
	'specialized-knowledge-tribal': {
		id: 'specialized-knowledge-tribal',
		name: 'Specialized Knowledge (Tribal)',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description:
			'You have +3 to Knowledge or Intuition Checks about specific tribal knowledge and lore, intuiting hierarchical structures',
		level: 0,
	},
	'light-feet': {
		id: 'light-feet',
		name: 'Light Feet',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description: 'Ignore difficult terrain due to natural vegetation, forest growth, etc.',
		level: 0,
	},
	'specialized-knowledge-sylvan': {
		id: 'specialized-knowledge-sylvan',
		name: 'Specialized Knowledge (Sylvan)',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description: 'You have +3 to Knowledge or Intuition Checks about fauna and flora lore',
		level: 0,
	},
	'dark-vision': {
		id: 'dark-vision',
		name: 'Dark Vision',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description: 'See black-and-white in the dark',
		level: 0,
	},
	'specialized-knowledge-telluric': {
		id: 'specialized-knowledge-telluric',
		name: 'Specialized Knowledge (Telluric)',
		type: FeatType.Core,
		category: FeatCategory.Upbringing,
		description:
			'You have +3 to Knowledge or Intuition Checks about caves, dungeons, minerals, mining, and ore lore',
		level: 0,
	},

	// ==== CLASS MODIFIERS ====
	'class-modifier-str': {
		id: 'class-modifier-str',
		name: 'Class Modifier (STR)',
		type: FeatType.Core,
		category: FeatCategory.ClassModifier,
		description: '+1 STR from class specialization',
		modifiers: [{ source: 'Class', value: 1, attributeType: AttributeType.STR }],
	},
	'class-modifier-dex': {
		id: 'class-modifier-dex',
		name: 'Class Modifier (DEX)',
		type: FeatType.Core,
		category: FeatCategory.ClassModifier,
		description: '+1 DEX from class specialization',
		modifiers: [{ source: 'Class', value: 1, attributeType: AttributeType.DEX }],
	},
	'class-modifier-con': {
		id: 'class-modifier-con',
		name: 'Class Modifier (CON)',
		type: FeatType.Core,
		category: FeatCategory.ClassModifier,
		description: '+1 CON from class specialization',
		modifiers: [{ source: 'Class', value: 1, attributeType: AttributeType.CON }],
	},
	'class-modifier-int': {
		id: 'class-modifier-int',
		name: 'Class Modifier (INT)',
		type: FeatType.Core,
		category: FeatCategory.ClassModifier,
		description: '+1 INT from class specialization',
		modifiers: [{ source: 'Class', value: 1, attributeType: AttributeType.INT }],
	},
	'class-modifier-wis': {
		id: 'class-modifier-wis',
		name: 'Class Modifier (WIS)',
		type: FeatType.Core,
		category: FeatCategory.ClassModifier,
		description: '+1 WIS from class specialization',
		modifiers: [{ source: 'Class', value: 1, attributeType: AttributeType.WIS }],
	},
	'class-modifier-cha': {
		id: 'class-modifier-cha',
		name: 'Class Modifier (CHA)',
		type: FeatType.Core,
		category: FeatCategory.ClassModifier,
		description: '+1 CHA from class specialization',
		modifiers: [{ source: 'Class', value: 1, attributeType: AttributeType.CHA }],
	},
	'class-modifier-div': {
		id: 'class-modifier-div',
		name: 'Class Modifier (DIV)',
		type: FeatType.Core,
		category: FeatCategory.ClassModifier,
		description: '+1 DIV from class specialization',
		modifiers: [{ source: 'Class', value: 1, attributeType: AttributeType.DIV }],
	},
	'class-modifier-fow': {
		id: 'class-modifier-fow',
		name: 'Class Modifier (FOW)',
		type: FeatType.Core,
		category: FeatCategory.ClassModifier,
		description: '+1 FOW from class specialization',
		modifiers: [{ source: 'Class', value: 1, attributeType: AttributeType.FOW }],
	},
	'class-modifier-lck': {
		id: 'class-modifier-lck',
		name: 'Class Modifier (LCK)',
		type: FeatType.Core,
		category: FeatCategory.ClassModifier,
		description: '+1 LCK from class specialization',
		modifiers: [{ source: 'Class', value: 1, attributeType: AttributeType.LCK }],
	},

	// ==== WARRIOR ROLE FEATS ====
	'sweep-attack': {
		id: 'sweep-attack',
		name: 'Sweep Attack',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		description:
			'You can spend 3 AP and 1 FP to perform an advanced Melee Strike against up to three adjacent enemies within your reach',
		level: 1,
	},
	'take-aim': {
		id: 'take-aim',
		name: 'Take Aim',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		description:
			'Spend 1 FP and 1 AP to target a specific enemy within range; if your next action is a Ranged Attack against that target, you get a +3 CM to the DEX Check',
		level: 1,
	},
	'improved-taunt': {
		id: 'improved-taunt',
		name: 'Improved Taunt',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		description:
			'You can spend an additional 1 SP as you perform a Taunt action to get a +6 CM to your Intimidation Check',
		level: 1,
	},

	// ==== WARRIOR FLAVOR FEATS ====
	'exert-authority': {
		id: 'exert-authority',
		name: 'Exert Authority',
		type: FeatType.Core,
		category: FeatCategory.ClassFlavor,
		description:
			'Spend 1 AP and 1 SP to authoritatively command an ally that can see and hear you clearly to perform a specific 1 AP action',
		level: 1,
	},
	rage: {
		id: 'rage',
		name: 'Rage',
		type: FeatType.Core,
		category: FeatCategory.ClassFlavor,
		description:
			'You can spend 1 AP and 2 SP to become Enraged: reduce your Focus Points to 1, cannot Concentrate while Enraged, and gain CM to Basic Attacks starting with +6 and reducing by 1 each use',
		level: 1,
	},
	'fancy-footwork': {
		id: 'fancy-footwork',
		name: 'Fancy Footwork',
		type: FeatType.Core,
		category: FeatCategory.ClassFlavor,
		description:
			'If you make a Melee Basic Attack against a target, you do not provoke Opportunity Attacks from that target until the end of the turn',
		level: 1,
	},

	// ==== CASTER CORE FEATS ====
	'arcane-casting-int': {
		id: 'arcane-casting-int',
		name: 'Arcane Casting (INT)',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		description: 'Unlocks Arcane Casting using INT as primary attribute',
		level: 1,
		traits: ['Concentration'],
	},
	'arcane-casting-wis': {
		id: 'arcane-casting-wis',
		name: 'Arcane Casting (WIS)',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		description: 'Unlocks Arcane Casting using WIS as primary attribute',
		level: 1,
		traits: ['Concentration'],
	},
	'arcane-casting-cha': {
		id: 'arcane-casting-cha',
		name: 'Arcane Casting (CHA)',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		description: 'Unlocks Arcane Casting using CHA as primary attribute',
		level: 1,
		traits: ['Concentration'],
	},

	// ==== CASTER FLAVOR FEATS ====
	'signature-spell': {
		id: 'signature-spell',
		name: 'Signature Spell',
		type: FeatType.Core,
		category: FeatCategory.ClassFlavor,
		description:
			'You have the exact execution step decision tree for this specific spell committed to muscle memory; get a +3 CM when casting this specific spell',
		level: 1,
		parameters: [
			{
				id: 'spell',
				name: 'Spell',
				type: 'text',
				placeholder: 'Enter spell name and description',
				required: true,
			},
		],
	},
	'tool-assisted-casting': {
		id: 'tool-assisted-casting',
		name: 'Tool-Assisted Casting',
		type: FeatType.Core,
		category: FeatCategory.ClassFlavor,
		description:
			'You can create and use One-Handed (+2) and Two-Handed (+3) tools to assist with Somatic Spell Components, but cannot use Verbal or Focal components',
		level: 1,
	},
	'focal-connection': {
		id: 'focal-connection',
		name: 'Focal Connection',
		type: FeatType.Core,
		category: FeatCategory.ClassFlavor,
		description:
			'You can create and use a personal Custom Focus (+3) bound to you for Focal Components, but cannot use Verbal or Somatic components',
		level: 1,
	},
	'lyrical-resonance': {
		id: 'lyrical-resonance',
		name: 'Lyrical Resonance',
		type: FeatType.Core,
		category: FeatCategory.ClassFlavor,
		description:
			'You can use One-Handed (+2) and Two-Handed (+3) instruments to assist with Verbal Spell Components, but cannot use Somatic or Focal components',
		level: 1,
	},

	// ==== MYSTIC CORE FEATS ====
	'divine-channeling': {
		id: 'divine-channeling',
		name: 'Divine Channeling',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		description: 'Unlocks Divine Channeling',
		level: 1,
		traits: ['Channeling'],
	},
	'flurry-of-blows': {
		id: 'flurry-of-blows',
		name: 'Flurry of Blows',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		description: 'You can spend 1 SP to make an unarmed Strike cost only 1 AP',
		level: 1,
		traits: ['Channeling'],
	},
	'bountiful-luck': {
		id: 'bountiful-luck',
		name: 'Bountiful Luck',
		type: FeatType.Core,
		category: FeatCategory.ClassRole,
		description:
			'You can spend Spirit Points instead of Heroism Points to use the Karmic Resistance, Write History and Luck Die actions',
		level: 1,
		traits: ['Channeling'],
	},

	// ==== MYSTIC FLAVOR FEATS ====
	'effortless-imbued-item-channeling': {
		id: 'effortless-imbued-item-channeling',
		name: 'Effortless Imbued Item Channeling',
		type: FeatType.Core,
		category: FeatCategory.ClassFlavor,
		description:
			'Whenever you would spend Spirit Points to use an Imbued Item that would otherwise not require a Channeling Check, you can make a Channeling Check DC 15 to spend one less SP',
		level: 1,
	},
	'divine-smite': {
		id: 'divine-smite',
		name: 'Divine Smite',
		type: FeatType.Core,
		category: FeatCategory.ClassFlavor,
		description:
			'You can spend 2 SP when striking with a weapon to get a +3 CM as you channel raw power into it, making it acquire a distinct glow',
		level: 1,
		traits: ['Channeling'],
	},

	// ==== GENERAL MINOR FEATS ====
	'trade-specialization': {
		id: 'trade-specialization',
		name: 'Trade Specialization',
		type: FeatType.Minor,
		category: FeatCategory.General,
		description:
			'You are acquainted with a specific trade, allowing you to perform basic tasks associated with it',
		level: 1,
		canPickMultipleTimes: true,
		parameters: [
			{
				id: 'trade',
				name: 'Trade',
				type: 'choice',
				options: [
					'Blacksmith',
					'Bookbinder',
					'Carpenter',
					'Cartographer',
					'Chandler',
					'Clothier',
					'Cook',
					'Farmer',
					'Fisher',
					'Fletcher',
					'Herbalist',
					'Jeweler',
					'Locksmith',
					'Mason',
					'Miner',
					'Potter',
					'Tanner',
					'Weaver',
					'Woodcutter',
				],
				required: true,
			},
		],
	},
	'specialized-knowledge': {
		id: 'specialized-knowledge',
		name: 'Specialized Knowledge',
		type: FeatType.Minor,
		category: FeatCategory.General,
		description:
			'You have +3 to Knowledge or Intuition Checks about aspects related to a specific area of expertise',
		level: 1,
		canPickMultipleTimes: true,
		parameters: [
			{
				id: 'expertise',
				name: 'Area of Expertise',
				type: 'choice',
				options: ['Urban', 'Nomadic', 'Tribal', 'Sylvan', 'Telluric'],
				required: true,
			},
		],
	},
	'lip-reading': {
		id: 'lip-reading',
		name: 'Lip Reading',
		type: FeatType.Minor,
		category: FeatCategory.General,
		description:
			'You can read lips to understand what people are saying when you can see them clearly',
		level: 1,
	},
	'animal-mimicry': {
		id: 'animal-mimicry',
		name: 'Animal Mimicry',
		type: FeatType.Minor,
		category: FeatCategory.General,
		description:
			'You have an uncanny knack for mimicking animal sounds. If you are familiar with it, and a humanoid could conceivably reproduce it, you can make a good-enough impression that an untrained ear could not distinguish it',
		level: 1,
	},

	// ==== CLASS-SPECIFIC MINOR FEATS ====
	'opportunity-window': {
		id: 'opportunity-window',
		name: 'Opportunity Window',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		description:
			'You can spend 1 SP to reduce by 1 (min 1) the amount of AP you would spend to perform the Opportunity Attack reaction',
		level: 2,
	},
	'spin-attack': {
		id: 'spin-attack',
		name: 'Spin Attack',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		description: 'Upgrade your Sweep Attack to target any number of creatures adjacent to you',
		level: 3,
		prerequisites: ['sweep-attack'],
	},
	'specialized-knowledge-sylvian-class': {
		id: 'specialized-knowledge-sylvian-class',
		name: 'Specialized Knowledge (Sylvian)',
		type: FeatType.Minor,
		category: FeatCategory.ClassFlavor,
		description: 'Exactly the same as the one obtained via the Sylvian Upbringing',
		level: 2,
	},
	'thieves-fingers': {
		id: 'thieves-fingers',
		name: "Thieves's Fingers",
		type: FeatType.Minor,
		category: FeatCategory.ClassFlavor,
		description: 'Lock picking, trap disarming, etc.',
		level: 2,
	},
	'channeling-fists': {
		id: 'channeling-fists',
		name: 'Channeling Fists',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		description: 'You can spend 1 SP to get a +1 CM to an unarmed Attack Check',
		level: 2,
		traits: ['Channeling'],
	},
	'lucky-relentlessness': {
		id: 'lucky-relentlessness',
		name: 'Lucky Relentlessness',
		type: FeatType.Minor,
		category: FeatCategory.ClassRole,
		description: 'Your DC for the Heroic Relentlessness action is 15',
		level: 2,
		traits: ['Channeling'],
	},
	'focused-channeling': {
		id: 'focused-channeling',
		name: 'Focused Channeling',
		type: FeatType.Minor,
		category: FeatCategory.ClassFlavor,
		description:
			"You can spend 2 FP (and add the Concentrate trait, if it didn't have it already) when doing an action with the Channeling trait to get a +3 CM",
		level: 3,
	},
	'spiritual-armor': {
		id: 'spiritual-armor',
		name: 'Spiritual Armor',
		type: FeatType.Minor,
		category: FeatCategory.ClassFlavor,
		description:
			'You can roll the Shrug Off action using your Primary Attribute instead of Toughness',
		level: 2,
		traits: ['Channeling'],
	},

	// ==== CLASS-SPECIFIC MAJOR FEATS ====
	leverage: {
		id: 'leverage',
		name: 'Leverage',
		type: FeatType.Major,
		category: FeatCategory.ClassFlavor,
		description: 'Sneak attack equivalent (TODO: full implementation)',
		level: 2,
	},
	skilled: {
		id: 'skilled',
		name: 'Skilled',
		type: FeatType.Major,
		category: FeatCategory.ClassFlavor,
		description: 'Base bonus on things you are not good at (TODO: full implementation)',
		level: 2,
	},
	'distributed-shifts': {
		id: 'distributed-shifts',
		name: 'Distributed Shifts',
		type: FeatType.Major,
		category: FeatCategory.ClassFlavor,
		description: 'TODO: full implementation',
		level: 2,
	},
	'divine-channeling-major': {
		id: 'divine-channeling-major',
		name: 'Divine Channeling',
		type: FeatType.Major,
		category: FeatCategory.ClassFlavor,
		description:
			'Unlocks Divine Channeling (for Purist Mystics at Level 2, Martial Mystics at Level 3)',
		level: 2,
		traits: ['Channeling'],
	},

	// ==== GENERAL MAJOR FEATS ====
	'quick-draw': {
		id: 'quick-draw',
		name: 'Quick Draw',
		type: FeatType.Major,
		category: FeatCategory.General,
		description:
			'If you have at least one hand free, you can spend 1 FP to draw a Light Melee Weapon without spending an action',
		level: 2,
	},
	'blind-sense': {
		id: 'blind-sense',
		name: 'Blind Sense',
		type: FeatType.Major,
		category: FeatCategory.General,
		description:
			'You can spend 1 AP and 2 SP to know the positions of any creature you are aware of within 6m as well as if you could see them clearly. If they are explicitly trying to sneak, you get a +6 in your Perception Check',
		level: 2,
		traits: ['Concentrate'],
	},
	'mounted-combat-specialization': {
		id: 'mounted-combat-specialization',
		name: 'Mounted Combat Specialization',
		type: FeatType.Major,
		category: FeatCategory.General,
		description:
			'WIP - Mounted Combat Rules are still being developed and are not available as an option yet',
		level: 2,
	},
};

// Helper functions
export function getFeatsByCategory(category: FeatCategory): FeatDefinition[] {
	return Object.values(FEATS).filter(feat => feat.category === category);
}

export function getFeatsByType(type: FeatType): FeatDefinition[] {
	return Object.values(FEATS).filter(feat => feat.type === type);
}

export function getFeatsByLevel(level: number): FeatDefinition[] {
	return Object.values(FEATS).filter(feat => feat.level === level || feat.level === undefined);
}

export function getRacialFeatId(race: Race): string {
	return `racial-${race.toLowerCase()}`;
}

export function getUpbringingFeats(upbringing: Upbringing): string[] {
	const baseId = `upbringing-${upbringing.toLowerCase()}`;
	const knowledgeId = `specialized-knowledge-${upbringing.toLowerCase()}`;

	const specificFeats: Record<Upbringing, string> = {
		[Upbringing.Urban]: 'specialized-training',
		[Upbringing.Nomadic]: 'nomadic-alertness',
		[Upbringing.Tribal]: 'tribal-endurance',
		[Upbringing.Sylvan]: 'light-feet',
		[Upbringing.Telluric]: 'dark-vision',
	};

	return [baseId, knowledgeId, specificFeats[upbringing]];
}

export function getClassModifierFeatId(attributeType: AttributeType): string {
	return `class-modifier-${attributeType.name.toLowerCase()}`;
}

// Get class-specific feats available for a character class
export function getClassSpecificFeats(characterClass: string): string[] {
	const roleFlavorInfo = CLASS_TO_ROLE_FLAVOR[characterClass];
	if (!roleFlavorInfo) {
		return [];
	}

	const roleFeats = CLASS_ROLE_FEATS[roleFlavorInfo.role] || [];
	const flavorFeats = CLASS_FLAVOR_FEATS[roleFlavorInfo.flavor] || [];

	return [...roleFeats, ...flavorFeats];
}

// Feat slot definitions
export interface FeatSlot {
	id: string;
	name: string;
	level: number;
	type: FeatType;
	description: string;
}

// Generate core feat slots for race/upbringing
export function generateCoreRaceSlots(): FeatSlot[] {
	return [
		{
			id: 'feat-core-race-1',
			name: 'Racial Modifiers',
			level: 0,
			type: FeatType.Core,
			description: 'Racial attribute modifiers',
		},
		{
			id: 'feat-core-upbringing-1',
			name: 'Upbringing Modifiers',
			level: 0,
			type: FeatType.Core,
			description: 'Upbringing attribute modifiers',
		},
		{
			id: 'feat-core-upbringing-2',
			name: 'Specialized Knowledge',
			level: 0,
			type: FeatType.Core,
			description: 'Specialized knowledge from upbringing',
		},
		{
			id: 'feat-core-upbringing-3',
			name: 'Upbringing Feat',
			level: 0,
			type: FeatType.Core,
			description: 'Core feat from upbringing',
		},
	];
}

// Generate core feat slots for class
export function generateCoreClassSlots(): FeatSlot[] {
	return [
		{
			id: 'feat-core-class-1',
			name: 'Class Modifier',
			level: 1,
			type: FeatType.Core,
			description: '+1 to primary attribute',
		},
		{
			id: 'feat-core-class-2',
			name: 'Role Feat',
			level: 1,
			type: FeatType.Core,
			description: 'Core feat from class role',
		},
		{
			id: 'feat-core-class-3',
			name: 'Flavor Feat',
			level: 1,
			type: FeatType.Core,
			description: 'Core feat from class flavor',
		},
	];
}

// Generate level-based feat slots
export function generateLevelBasedSlots(maxLevel: number): FeatSlot[] {
	const slots: FeatSlot[] = [];

	for (let level = 1; level <= maxLevel; level++) {
		if (level % 2 === 1) {
			// Odd levels: Minor feats
			slots.push({
				id: `feat-lv${level}`,
				name: `Level ${level} Minor Feat`,
				level: level,
				type: FeatType.Minor,
				description: 'Minor feat slot',
			});
		} else {
			// Even levels: Major feats
			slots.push({
				id: `feat-lv${level}`,
				name: `Level ${level} Major Feat`,
				level: level,
				type: FeatType.Major,
				description: 'Major feat slot',
			});
		}
	}

	return slots;
}

// Get all feat slots for a character level
export function getAllFeatSlots(characterLevel: number): FeatSlot[] {
	const slots: FeatSlot[] = [];

	// Add core race/upbringing slots (Level 0)
	slots.push(...generateCoreRaceSlots());

	// Add core class slots (Level 1)
	if (characterLevel >= 1) {
		slots.push(...generateCoreClassSlots());
	}

	// Add level-based slots
	slots.push(...generateLevelBasedSlots(characterLevel));

	return slots;
}

// Get upbringing modifier feat with custom modifiers
export function getUpbringingModifierFeat(
	upbringing: Upbringing,
	plusModifier: AttributeType,
	minusModifier: AttributeType
): FeatDefinition {
	const baseFeat = FEATS[`upbringing-${upbringing.toLowerCase()}`];
	if (!baseFeat) {
		throw new Error(`Unknown upbringing: ${upbringing}`);
	}

	return {
		...baseFeat,
		description: `${baseFeat.description.split('Typical:')[0].trim()} +${plusModifier.name}, -${minusModifier.name}`,
		modifiers: [
			{
				source: `${upbringing} Upbringing`,
				value: 1,
				attributeType: plusModifier,
			},
			{
				source: `${upbringing} Upbringing`,
				value: -1,
				attributeType: minusModifier,
			},
		],
	};
}

// Map class roles and flavors to their available non-core feats
export const CLASS_ROLE_FEATS: Record<string, string[]> = {
	// Warrior roles
	Melee: ['opportunity-window', 'spin-attack'],
	Ranged: [], // TODO: rapid-fire, pinning-shot, double-shot when implemented
	Tank: [], // TODO: shield-bash, armor, stumble-through-resistance when implemented

	// Caster roles (no additional feats beyond general for now)
	Erudite: [],
	Intuitive: [],
	Innate: [],

	// Mystic roles
	Adept: [], // Divine channeling already provided as core
	Disciple: ['channeling-fists'],
	Inspired: ['lucky-relentlessness'],
};

export const CLASS_FLAVOR_FEATS: Record<string, string[]> = {
	// Warrior flavors
	'Warrior-Martial': ['distributed-shifts'],
	'Warrior-Survivalist': ['specialized-knowledge-sylvian-class'],
	'Warrior-Scoundrel': ['thieves-fingers', 'leverage', 'skilled'],

	// Caster flavors
	'Caster-Arcanist': [],
	'Caster-Mechanist': [],
	'Caster-Naturalist': ['specialized-knowledge-sylvian-class'], // Level 3
	'Caster-Musicist': [],

	// Mystic flavors
	'Mystic-Pure': ['focused-channeling', 'divine-channeling-major'],
	'Mystic-Mixed': [], // WIP
	'Mystic-Martial': ['spiritual-armor', 'divine-channeling-major'],
};

// Map character classes to their role and flavor for feat lookup
export const CLASS_TO_ROLE_FLAVOR: Record<string, { role: string; flavor: string }> = {
	// Warriors
	Fighter: { role: 'Melee', flavor: 'Warrior-Martial' },
	Berserker: { role: 'Melee', flavor: 'Warrior-Survivalist' },
	Swashbuckler: { role: 'Melee', flavor: 'Warrior-Scoundrel' },
	Marksman: { role: 'Ranged', flavor: 'Warrior-Martial' },
	Hunter: { role: 'Ranged', flavor: 'Warrior-Survivalist' },
	Rogue: { role: 'Ranged', flavor: 'Warrior-Scoundrel' },
	Guardian: { role: 'Tank', flavor: 'Warrior-Martial' },
	Barbarian: { role: 'Tank', flavor: 'Warrior-Survivalist' },
	Scout: { role: 'Tank', flavor: 'Warrior-Scoundrel' },

	// Casters
	Wizard: { role: 'Erudite', flavor: 'Caster-Arcanist' },
	Engineer: { role: 'Erudite', flavor: 'Caster-Mechanist' },
	Alchemist: { role: 'Erudite', flavor: 'Caster-Naturalist' },
	Storyteller: { role: 'Erudite', flavor: 'Caster-Musicist' },
	Mage: { role: 'Intuitive', flavor: 'Caster-Arcanist' },
	Artificer: { role: 'Intuitive', flavor: 'Caster-Mechanist' },
	Druid: { role: 'Intuitive', flavor: 'Caster-Naturalist' },
	Minstrel: { role: 'Intuitive', flavor: 'Caster-Musicist' },
	Sorcerer: { role: 'Innate', flavor: 'Caster-Arcanist' },
	Machinist: { role: 'Innate', flavor: 'Caster-Mechanist' },
	Shaman: { role: 'Innate', flavor: 'Caster-Naturalist' },
	Bard: { role: 'Innate', flavor: 'Caster-Musicist' },

	// Mystics
	Cleric: { role: 'Adept', flavor: 'Mystic-Pure' },
	Warlock: { role: 'Adept', flavor: 'Mystic-Mixed' },
	Paladin: { role: 'Adept', flavor: 'Mystic-Martial' },
	Sage: { role: 'Disciple', flavor: 'Mystic-Pure' },
	Monk: { role: 'Disciple', flavor: 'Mystic-Mixed' },
	Ranger: { role: 'Disciple', flavor: 'Mystic-Martial' },
	Wanderer: { role: 'Inspired', flavor: 'Mystic-Pure' },
	Wayfarer: { role: 'Inspired', flavor: 'Mystic-Mixed' },
	Warden: { role: 'Inspired', flavor: 'Mystic-Martial' },
};

// Map classes to their core feats
export const CLASS_CORE_FEATS: Record<string, { role: string; flavor: string }> = {
	// Warriors - Melee (STR)
	Fighter: { role: 'sweep-attack', flavor: 'exert-authority' },
	Berserker: { role: 'sweep-attack', flavor: 'rage' },
	Swashbuckler: { role: 'sweep-attack', flavor: 'fancy-footwork' },
	// Warriors - Ranged (DEX)
	Marksman: { role: 'take-aim', flavor: 'exert-authority' },
	Hunter: { role: 'take-aim', flavor: 'rage' },
	Rogue: { role: 'take-aim', flavor: 'fancy-footwork' },
	// Warriors - Tank (CON)
	Guardian: { role: 'improved-taunt', flavor: 'exert-authority' },
	Barbarian: { role: 'improved-taunt', flavor: 'rage' },
	Scout: { role: 'improved-taunt', flavor: 'fancy-footwork' },
	// Casters - Erudite (INT)
	Wizard: { role: 'arcane-casting-int', flavor: 'signature-spell' },
	Engineer: { role: 'arcane-casting-int', flavor: 'tool-assisted-casting' },
	Alchemist: { role: 'arcane-casting-int', flavor: 'focal-connection' },
	Storyteller: { role: 'arcane-casting-int', flavor: 'lyrical-resonance' },
	// Casters - Intuitive (WIS)
	Mage: { role: 'arcane-casting-wis', flavor: 'signature-spell' },
	Artificer: { role: 'arcane-casting-wis', flavor: 'tool-assisted-casting' },
	Druid: { role: 'arcane-casting-wis', flavor: 'focal-connection' },
	Minstrel: { role: 'arcane-casting-wis', flavor: 'lyrical-resonance' },
	// Casters - Innate (CHA)
	Sorcerer: { role: 'arcane-casting-cha', flavor: 'signature-spell' },
	Machinist: { role: 'arcane-casting-cha', flavor: 'tool-assisted-casting' },
	Shaman: { role: 'arcane-casting-cha', flavor: 'focal-connection' },
	Bard: { role: 'arcane-casting-cha', flavor: 'lyrical-resonance' },
	// Mystics - Disciple (DIV)
	Cleric: { role: 'divine-channeling', flavor: 'effortless-imbued-item-channeling' },
	Warlock: { role: 'divine-channeling', flavor: 'effortless-imbued-item-channeling' }, // Mixed - WIP
	Paladin: { role: 'divine-channeling', flavor: 'divine-smite' },
	// Mystics - Adept (FOW)
	Sage: { role: 'flurry-of-blows', flavor: 'effortless-imbued-item-channeling' },
	Monk: { role: 'flurry-of-blows', flavor: 'effortless-imbued-item-channeling' }, // Mixed - WIP
	Ranger: { role: 'flurry-of-blows', flavor: 'divine-smite' },
	// Mystics - Inspired (LCK)
	Wanderer: { role: 'bountiful-luck', flavor: 'effortless-imbued-item-channeling' },
	Wayfarer: { role: 'bountiful-luck', flavor: 'effortless-imbued-item-channeling' }, // Mixed - WIP
	Warden: { role: 'bountiful-luck', flavor: 'divine-smite' },
};

// Helper functions for parameterized feats
export function createParameterizedFeat(
	baseFeatId: string,
	parameters: Record<string, string>
): ParameterizedFeatInstance {
	const baseFeat = FEATS[baseFeatId];
	if (!baseFeat) {
		throw new Error(`Base feat not found: ${baseFeatId}`);
	}

	// Generate full name with parameters
	const parameterValues = Object.values(parameters);
	const fullName =
		parameterValues.length > 0 ? `${baseFeat.name} (${parameterValues.join(', ')})` : baseFeat.name;

	// Generate unique ID for this parameterized instance
	const parameterString = Object.entries(parameters)
		.map(([key, value]) => `${key}:${value}`)
		.join('|');
	const fullId = parameterString ? `${baseFeatId}#${parameterString}` : baseFeatId;

	return {
		baseFeatId,
		parameters,
		fullName,
		fullId,
	};
}

export function parseParameterizedFeatId(fullId: string): {
	baseFeatId: string;
	parameters: Record<string, string>;
} {
	const [baseFeatId, parameterString] = fullId.split('#');
	const parameters: Record<string, string> = {};

	if (parameterString) {
		parameterString.split('|').forEach(param => {
			const [key, value] = param.split(':');
			if (key && value) {
				parameters[key] = value;
			}
		});
	}

	return { baseFeatId, parameters };
}

export function getParameterizedFeatDefinition(fullId: string): FeatDefinition {
	const { baseFeatId, parameters } = parseParameterizedFeatId(fullId);
	const baseFeat = FEATS[baseFeatId];

	if (!baseFeat) {
		throw new Error(`Base feat not found: ${baseFeatId}`);
	}

	const parameterizedInstance = createParameterizedFeat(baseFeatId, parameters);

	return {
		...baseFeat,
		id: fullId,
		name: parameterizedInstance.fullName,
	};
}

export function isParameterizedFeat(featId: string): boolean {
	return featId.includes('#');
}

export function getAvailableParameterizedFeats(baseFeatId: string): FeatDefinition | null {
	const baseFeat = FEATS[baseFeatId];
	if (!baseFeat || !baseFeat.parameters) {
		return null;
	}
	return baseFeat;
}
