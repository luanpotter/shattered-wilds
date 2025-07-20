import { StatType } from './stats/stat-type.js';

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

export const CLASS_ROLE_PRIMARY_ATTRIBUTE: Record<ClassRole, StatType> = {
	[ClassRole.Melee]: StatType.STR,
	[ClassRole.Ranged]: StatType.DEX,
	[ClassRole.Tank]: StatType.CON,
	[ClassRole.Erudite]: StatType.INT,
	[ClassRole.Intuitive]: StatType.WIS,
	[ClassRole.Innate]: StatType.CHA,
	[ClassRole.Disciple]: StatType.DIV,
	[ClassRole.Adept]: StatType.FOW,
	[ClassRole.Inspired]: StatType.LCK,
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
	constructor(
		public name: CharacterClass,
		public realm: ClassRealm,
		public role: ClassRole,
		public flavor: ClassFlavor,
	) {}

	get primaryAttribute(): StatType {
		return CLASS_ROLE_PRIMARY_ATTRIBUTE[this.role];
	}

	static build(props: {
		name: CharacterClass;
		realm: ClassRealm;
		role: ClassRole;
		flavor: ClassFlavor;
	}): ClassDefinition {
		return new ClassDefinition(props.name, props.realm, props.role, props.flavor);
	}
}

export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
	// Warriors - Melee (STR)
	[CharacterClass.Fighter]: ClassDefinition.build({
		name: CharacterClass.Fighter,
		realm: ClassRealm.Warrior,
		role: ClassRole.Melee,
		flavor: ClassFlavor.Martial,
	}),
	[CharacterClass.Berserker]: ClassDefinition.build({
		name: CharacterClass.Berserker,
		realm: ClassRealm.Warrior,
		role: ClassRole.Melee,
		flavor: ClassFlavor.Survivalist,
	}),
	[CharacterClass.Swashbuckler]: ClassDefinition.build({
		name: CharacterClass.Swashbuckler,
		realm: ClassRealm.Warrior,
		role: ClassRole.Melee,
		flavor: ClassFlavor.Scoundrel,
	}),
	// Warriors - Ranged (DEX)
	[CharacterClass.Marksman]: ClassDefinition.build({
		name: CharacterClass.Marksman,
		realm: ClassRealm.Warrior,
		role: ClassRole.Ranged,
		flavor: ClassFlavor.Martial,
	}),
	[CharacterClass.Hunter]: ClassDefinition.build({
		name: CharacterClass.Hunter,
		realm: ClassRealm.Warrior,
		role: ClassRole.Ranged,
		flavor: ClassFlavor.Survivalist,
	}),
	[CharacterClass.Rogue]: ClassDefinition.build({
		name: CharacterClass.Rogue,
		realm: ClassRealm.Warrior,
		role: ClassRole.Ranged,
		flavor: ClassFlavor.Scoundrel,
	}),
	// Warriors - Tank (CON)
	[CharacterClass.Guardian]: ClassDefinition.build({
		name: CharacterClass.Guardian,
		realm: ClassRealm.Warrior,
		role: ClassRole.Tank,
		flavor: ClassFlavor.Martial,
	}),
	[CharacterClass.Barbarian]: ClassDefinition.build({
		name: CharacterClass.Barbarian,
		realm: ClassRealm.Warrior,
		role: ClassRole.Tank,
		flavor: ClassFlavor.Survivalist,
	}),
	[CharacterClass.Scout]: ClassDefinition.build({
		name: CharacterClass.Scout,
		realm: ClassRealm.Warrior,
		role: ClassRole.Tank,
		flavor: ClassFlavor.Scoundrel,
	}),
	// Casters - Erudite (INT)
	[CharacterClass.Wizard]: ClassDefinition.build({
		name: CharacterClass.Wizard,
		realm: ClassRealm.Caster,
		role: ClassRole.Erudite,
		flavor: ClassFlavor.Arcanist,
	}),
	[CharacterClass.Engineer]: ClassDefinition.build({
		name: CharacterClass.Engineer,
		realm: ClassRealm.Caster,
		role: ClassRole.Erudite,
		flavor: ClassFlavor.Mechanist,
	}),
	[CharacterClass.Alchemist]: ClassDefinition.build({
		name: CharacterClass.Alchemist,
		realm: ClassRealm.Caster,
		role: ClassRole.Erudite,
		flavor: ClassFlavor.Naturalist,
	}),
	[CharacterClass.Storyteller]: ClassDefinition.build({
		name: CharacterClass.Storyteller,
		realm: ClassRealm.Caster,
		role: ClassRole.Erudite,
		flavor: ClassFlavor.Musicist,
	}),
	// Casters - Intuitive (WIS)
	[CharacterClass.Mage]: ClassDefinition.build({
		name: CharacterClass.Mage,
		realm: ClassRealm.Caster,
		role: ClassRole.Intuitive,
		flavor: ClassFlavor.Arcanist,
	}),
	[CharacterClass.Artificer]: ClassDefinition.build({
		name: CharacterClass.Artificer,
		realm: ClassRealm.Caster,
		role: ClassRole.Intuitive,
		flavor: ClassFlavor.Mechanist,
	}),
	[CharacterClass.Druid]: ClassDefinition.build({
		name: CharacterClass.Druid,
		realm: ClassRealm.Caster,
		role: ClassRole.Intuitive,
		flavor: ClassFlavor.Naturalist,
	}),
	[CharacterClass.Minstrel]: ClassDefinition.build({
		name: CharacterClass.Minstrel,
		realm: ClassRealm.Caster,
		role: ClassRole.Intuitive,
		flavor: ClassFlavor.Musicist,
	}),
	// Casters - Innate (CHA)
	[CharacterClass.Sorcerer]: ClassDefinition.build({
		name: CharacterClass.Sorcerer,
		realm: ClassRealm.Caster,
		role: ClassRole.Innate,
		flavor: ClassFlavor.Arcanist,
	}),
	[CharacterClass.Machinist]: ClassDefinition.build({
		name: CharacterClass.Machinist,
		realm: ClassRealm.Caster,
		role: ClassRole.Innate,
		flavor: ClassFlavor.Mechanist,
	}),
	[CharacterClass.Shaman]: ClassDefinition.build({
		name: CharacterClass.Shaman,
		realm: ClassRealm.Caster,
		role: ClassRole.Innate,
		flavor: ClassFlavor.Naturalist,
	}),
	[CharacterClass.Bard]: ClassDefinition.build({
		name: CharacterClass.Bard,
		realm: ClassRealm.Caster,
		role: ClassRole.Innate,
		flavor: ClassFlavor.Musicist,
	}),
	// Mystics - Disciple (DIV)
	[CharacterClass.Cleric]: ClassDefinition.build({
		name: CharacterClass.Cleric,
		realm: ClassRealm.Mystic,
		role: ClassRole.Disciple,
		flavor: ClassFlavor.Devout,
	}),
	[CharacterClass.Warlock]: ClassDefinition.build({
		name: CharacterClass.Warlock,
		realm: ClassRealm.Mystic,
		role: ClassRole.Disciple,
		flavor: ClassFlavor.Mixed,
	}),
	[CharacterClass.Paladin]: ClassDefinition.build({
		name: CharacterClass.Paladin,
		realm: ClassRealm.Mystic,
		role: ClassRole.Disciple,
		flavor: ClassFlavor.Crusader,
	}),
	// Mystics - Adept (FOW)
	[CharacterClass.Sage]: ClassDefinition.build({
		name: CharacterClass.Sage,
		realm: ClassRealm.Mystic,
		role: ClassRole.Adept,
		flavor: ClassFlavor.Devout,
	}),
	[CharacterClass.Monk]: ClassDefinition.build({
		name: CharacterClass.Monk,
		realm: ClassRealm.Mystic,
		role: ClassRole.Adept,
		flavor: ClassFlavor.Mixed,
	}),
	[CharacterClass.Ranger]: ClassDefinition.build({
		name: CharacterClass.Ranger,
		realm: ClassRealm.Mystic,
		role: ClassRole.Adept,
		flavor: ClassFlavor.Crusader,
	}),
	// Mystics - Inspired (LCK)
	[CharacterClass.Wanderer]: ClassDefinition.build({
		name: CharacterClass.Wanderer,
		realm: ClassRealm.Mystic,
		role: ClassRole.Inspired,
		flavor: ClassFlavor.Devout,
	}),
	[CharacterClass.Wayfarer]: ClassDefinition.build({
		name: CharacterClass.Wayfarer,
		realm: ClassRealm.Mystic,
		role: ClassRole.Inspired,
		flavor: ClassFlavor.Mixed,
	}),
	[CharacterClass.Warden]: ClassDefinition.build({
		name: CharacterClass.Warden,
		realm: ClassRealm.Mystic,
		role: ClassRole.Inspired,
		flavor: ClassFlavor.Crusader,
	}),
};
