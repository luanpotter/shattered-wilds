import { StatType } from '../stats/stat-type.js';

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
	// Mystics - Disciple (DIV)
	Cleric = 'Cleric',
	Warlock = 'Warlock',
	Paladin = 'Paladin',
	// Mystics - Adept (FOW)
	Sage = 'Sage',
	Monk = 'Monk',
	Ranger = 'Ranger',
	// Mystics - Inspired (LCK)
	Wanderer = 'Wanderer',
	Wayfarer = 'Wayfarer',
	Warden = 'Warden',
}

export enum ClassRealm {
	Warrior = 'Warrior',
	Caster = 'Caster',
	Mystic = 'Mystic',
}

export enum ClassRole {
	// Warriors
	Melee = 'Melee',
	Ranged = 'Ranged',
	Tank = 'Tank',
	// Casters
	Erudite = 'Erudite',
	Intuitive = 'Intuitive',
	Innate = 'Innate',
	// Mystics
	Disciple = 'Disciple',
	Adept = 'Adept',
	Inspired = 'Inspired',
}

export interface ClassRoleDefinition {
	name: ClassRole;
	realm: ClassRealm;
	primaryAttribute: StatType;
	description: string;
}

export const CLASS_ROLES: Record<ClassRole, ClassRoleDefinition> = {
	[ClassRole.Melee]: {
		name: ClassRole.Melee,
		realm: ClassRealm.Warrior,
		primaryAttribute: StatType.STR,
		description:
			'_Melee Warriors_ focus on [[STR | Strength]], and thus are favored to use **Heavy Melee** or **Thrown** weapons.',
	},
	[ClassRole.Ranged]: {
		name: ClassRole.Ranged,
		realm: ClassRealm.Warrior,
		primaryAttribute: StatType.DEX,
		description:
			'_Ranged Warriors_ focus on [[DEX | Dexterity]], and thus are favored to use **Light Melee** or **Ranged** weapons.',
	},
	[ClassRole.Tank]: {
		name: ClassRole.Tank,
		realm: ClassRealm.Warrior,
		primaryAttribute: StatType.CON,
		description:
			'_Tank Warriors_ focus on [[CON | Constitution]], and thus are focused on defense and therefore do not have a specific weapon-type focus.',
	},
	[ClassRole.Erudite]: {
		name: ClassRole.Erudite,
		realm: ClassRealm.Caster,
		primaryAttribute: StatType.INT,
		description:
			'The _Erudite_ caster has studied the science of the Arcane and has an actual understanding of how it works. They use their [[INT | Intelligence]] to figure out what precise sequence of movements are required to cast their spells.',
	},
	[ClassRole.Intuitive]: {
		name: ClassRole.Intuitive,
		realm: ClassRealm.Caster,
		primaryAttribute: StatType.WIS,
		description:
			'The _Intuitive_ caster has an intuitive knowledge of the Arcane, relying on instinct and second-nature to guide their spellcasting. Through trial and error they have honed their ability to wield magic using their [[WIS | Wisdom]].',
	},
	[ClassRole.Innate]: {
		name: ClassRole.Innate,
		realm: ClassRealm.Caster,
		primaryAttribute: StatType.CHA,
		description:
			'The _Innate_ caster has a natural talent for the Arcane, and has learned to listen to their own body and emotions to discern the necessary movements to cast spells. Their [[CHA | Charisma]] allows them to better understand and connect with their own inner selves.',
	},
	[ClassRole.Disciple]: {
		name: ClassRole.Disciple,
		realm: ClassRealm.Mystic,
		primaryAttribute: StatType.DIV,
		description: `The **Disciple** is a **Mystic** who either has (1) submitted, (2) a contract, or (3) a bond with a specific higher power in the **Aether** - i.e., a **Protean**. The nature of their connection can be varied, from an abstract concept and blind devotion to a more personal touch towards an Avatar (see the **Archetypes** section in [Divine](/rules/divine)).`,
	},
	[ClassRole.Adept]: {
		name: ClassRole.Adept,
		realm: ClassRealm.Mystic,
		primaryAttribute: StatType.FOW,
		description: `The **Adept** is a **Mystic** who is able to channel the power within their **Soul** into the Material World. They are still finely connected and attuned to the **Aether**, but they are not bound to a specific **Protean**, but rather strengthen the connection with their own **Soul**. Therefore, they are uniquely equipped to fight with their own power-unlocked Body.`,
	},
	[ClassRole.Inspired]: {
		name: ClassRole.Inspired,
		realm: ClassRealm.Mystic,
		primaryAttribute: StatType.LCK,
		description: `The **Inspired** is a **Mystic** who is able to receive their [[LCK]] through an unexplainable connection to the **Aether** (and possibly beyond). If the typical channeling power is vague and abstract, the origin of the good fortune of the **Inspired** is completely beyond comprehension.`,
	},
};

export enum ClassFlavor {
	// Warriors
	Martial = 'Martial',
	Survivalist = 'Survivalist',
	Scoundrel = 'Scoundrel',
	// Casters
	Arcanist = 'Arcanist',
	Mechanist = 'Mechanist',
	Naturalist = 'Naturalist',
	Musicist = 'Musicist',
	// Mystics
	Devout = 'Devout',
	Mixed = 'Mixed',
	Crusader = 'Crusader',
}

export class ClassDefinition {
	name: CharacterClass;
	realm: ClassRealm;
	role: ClassRole;
	flavor: ClassFlavor;

	constructor({
		name,
		realm,
		role,
		flavor,
	}: {
		name: CharacterClass;
		realm: ClassRealm;
		role: ClassRole;
		flavor: ClassFlavor;
	}) {
		this.name = name;
		this.realm = realm;
		this.role = role;
		this.flavor = flavor;
	}

	get primaryAttribute(): StatType {
		return CLASS_ROLES[this.role].primaryAttribute;
	}

	get description(): string {
		return `${this.flavor} ${this.role}`;
	}
}

export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
	// Warriors - Melee (STR)
	[CharacterClass.Fighter]: new ClassDefinition({
		name: CharacterClass.Fighter,
		realm: ClassRealm.Warrior,
		role: ClassRole.Melee,
		flavor: ClassFlavor.Martial,
	}),
	[CharacterClass.Berserker]: new ClassDefinition({
		name: CharacterClass.Berserker,
		realm: ClassRealm.Warrior,
		role: ClassRole.Melee,
		flavor: ClassFlavor.Survivalist,
	}),
	[CharacterClass.Swashbuckler]: new ClassDefinition({
		name: CharacterClass.Swashbuckler,
		realm: ClassRealm.Warrior,
		role: ClassRole.Melee,
		flavor: ClassFlavor.Scoundrel,
	}),
	// Warriors - Ranged (DEX)
	[CharacterClass.Marksman]: new ClassDefinition({
		name: CharacterClass.Marksman,
		realm: ClassRealm.Warrior,
		role: ClassRole.Ranged,
		flavor: ClassFlavor.Martial,
	}),
	[CharacterClass.Hunter]: new ClassDefinition({
		name: CharacterClass.Hunter,
		realm: ClassRealm.Warrior,
		role: ClassRole.Ranged,
		flavor: ClassFlavor.Survivalist,
	}),
	[CharacterClass.Rogue]: new ClassDefinition({
		name: CharacterClass.Rogue,
		realm: ClassRealm.Warrior,
		role: ClassRole.Ranged,
		flavor: ClassFlavor.Scoundrel,
	}),
	// Warriors - Tank (CON)
	[CharacterClass.Guardian]: new ClassDefinition({
		name: CharacterClass.Guardian,
		realm: ClassRealm.Warrior,
		role: ClassRole.Tank,
		flavor: ClassFlavor.Martial,
	}),
	[CharacterClass.Barbarian]: new ClassDefinition({
		name: CharacterClass.Barbarian,
		realm: ClassRealm.Warrior,
		role: ClassRole.Tank,
		flavor: ClassFlavor.Survivalist,
	}),
	[CharacterClass.Scout]: new ClassDefinition({
		name: CharacterClass.Scout,
		realm: ClassRealm.Warrior,
		role: ClassRole.Tank,
		flavor: ClassFlavor.Scoundrel,
	}),
	// Casters - Erudite (INT)
	[CharacterClass.Wizard]: new ClassDefinition({
		name: CharacterClass.Wizard,
		realm: ClassRealm.Caster,
		role: ClassRole.Erudite,
		flavor: ClassFlavor.Arcanist,
	}),
	[CharacterClass.Engineer]: new ClassDefinition({
		name: CharacterClass.Engineer,
		realm: ClassRealm.Caster,
		role: ClassRole.Erudite,
		flavor: ClassFlavor.Mechanist,
	}),
	[CharacterClass.Alchemist]: new ClassDefinition({
		name: CharacterClass.Alchemist,
		realm: ClassRealm.Caster,
		role: ClassRole.Erudite,
		flavor: ClassFlavor.Naturalist,
	}),
	[CharacterClass.Storyteller]: new ClassDefinition({
		name: CharacterClass.Storyteller,
		realm: ClassRealm.Caster,
		role: ClassRole.Erudite,
		flavor: ClassFlavor.Musicist,
	}),
	// Casters - Intuitive (WIS)
	[CharacterClass.Mage]: new ClassDefinition({
		name: CharacterClass.Mage,
		realm: ClassRealm.Caster,
		role: ClassRole.Intuitive,
		flavor: ClassFlavor.Arcanist,
	}),
	[CharacterClass.Artificer]: new ClassDefinition({
		name: CharacterClass.Artificer,
		realm: ClassRealm.Caster,
		role: ClassRole.Intuitive,
		flavor: ClassFlavor.Mechanist,
	}),
	[CharacterClass.Druid]: new ClassDefinition({
		name: CharacterClass.Druid,
		realm: ClassRealm.Caster,
		role: ClassRole.Intuitive,
		flavor: ClassFlavor.Naturalist,
	}),
	[CharacterClass.Minstrel]: new ClassDefinition({
		name: CharacterClass.Minstrel,
		realm: ClassRealm.Caster,
		role: ClassRole.Intuitive,
		flavor: ClassFlavor.Musicist,
	}),
	// Casters - Innate (CHA)
	[CharacterClass.Sorcerer]: new ClassDefinition({
		name: CharacterClass.Sorcerer,
		realm: ClassRealm.Caster,
		role: ClassRole.Innate,
		flavor: ClassFlavor.Arcanist,
	}),
	[CharacterClass.Machinist]: new ClassDefinition({
		name: CharacterClass.Machinist,
		realm: ClassRealm.Caster,
		role: ClassRole.Innate,
		flavor: ClassFlavor.Mechanist,
	}),
	[CharacterClass.Shaman]: new ClassDefinition({
		name: CharacterClass.Shaman,
		realm: ClassRealm.Caster,
		role: ClassRole.Innate,
		flavor: ClassFlavor.Naturalist,
	}),
	[CharacterClass.Bard]: new ClassDefinition({
		name: CharacterClass.Bard,
		realm: ClassRealm.Caster,
		role: ClassRole.Innate,
		flavor: ClassFlavor.Musicist,
	}),
	// Mystics - Disciple (DIV)
	[CharacterClass.Cleric]: new ClassDefinition({
		name: CharacterClass.Cleric,
		realm: ClassRealm.Mystic,
		role: ClassRole.Disciple,
		flavor: ClassFlavor.Devout,
	}),
	[CharacterClass.Warlock]: new ClassDefinition({
		name: CharacterClass.Warlock,
		realm: ClassRealm.Mystic,
		role: ClassRole.Disciple,
		flavor: ClassFlavor.Mixed,
	}),
	[CharacterClass.Paladin]: new ClassDefinition({
		name: CharacterClass.Paladin,
		realm: ClassRealm.Mystic,
		role: ClassRole.Disciple,
		flavor: ClassFlavor.Crusader,
	}),
	// Mystics - Adept (FOW)
	[CharacterClass.Sage]: new ClassDefinition({
		name: CharacterClass.Sage,
		realm: ClassRealm.Mystic,
		role: ClassRole.Adept,
		flavor: ClassFlavor.Devout,
	}),
	[CharacterClass.Monk]: new ClassDefinition({
		name: CharacterClass.Monk,
		realm: ClassRealm.Mystic,
		role: ClassRole.Adept,
		flavor: ClassFlavor.Mixed,
	}),
	[CharacterClass.Ranger]: new ClassDefinition({
		name: CharacterClass.Ranger,
		realm: ClassRealm.Mystic,
		role: ClassRole.Adept,
		flavor: ClassFlavor.Crusader,
	}),
	// Mystics - Inspired (LCK)
	[CharacterClass.Wanderer]: new ClassDefinition({
		name: CharacterClass.Wanderer,
		realm: ClassRealm.Mystic,
		role: ClassRole.Inspired,
		flavor: ClassFlavor.Devout,
	}),
	[CharacterClass.Wayfarer]: new ClassDefinition({
		name: CharacterClass.Wayfarer,
		realm: ClassRealm.Mystic,
		role: ClassRole.Inspired,
		flavor: ClassFlavor.Mixed,
	}),
	[CharacterClass.Warden]: new ClassDefinition({
		name: CharacterClass.Warden,
		realm: ClassRealm.Mystic,
		role: ClassRole.Inspired,
		flavor: ClassFlavor.Crusader,
	}),
};
