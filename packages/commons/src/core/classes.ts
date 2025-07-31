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
		return CLASS_ROLE_PRIMARY_ATTRIBUTE[this.role];
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
