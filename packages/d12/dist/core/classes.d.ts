import { StatType } from '../stats/stat-type.js';
export declare enum CharacterClass {
    Fighter = "Fighter",
    Berserker = "Berserker",
    Swashbuckler = "Swashbuckler",
    Marksman = "Marksman",
    Hunter = "Hunter",
    Rogue = "Rogue",
    Guardian = "Guardian",
    Barbarian = "Barbarian",
    Scout = "Scout",
    Wizard = "Wizard",
    Engineer = "Engineer",
    Alchemist = "Alchemist",
    Storyteller = "Storyteller",
    Mage = "Mage",
    Artificer = "Artificer",
    Druid = "Druid",
    Minstrel = "Minstrel",
    Sorcerer = "Sorcerer",
    Machinist = "Machinist",
    Shaman = "Shaman",
    Bard = "Bard",
    Cleric = "Cleric",
    Warlock = "Warlock",
    Paladin = "Paladin",
    Sage = "Sage",
    Monk = "Monk",
    Ranger = "Ranger",
    Wanderer = "Wanderer",
    Wayfarer = "Wayfarer",
    Warden = "Warden"
}
export declare enum ClassRealm {
    Warrior = "Warrior",
    Caster = "Caster",
    Mystic = "Mystic"
}
export interface ClassRealmDefinition {
    name: ClassRealm;
    realm: StatType;
}
export declare const CLASS_REALMS: Record<ClassRealm, ClassRealmDefinition>;
export declare enum ClassRole {
    Melee = "Melee",
    Ranged = "Ranged",
    Tank = "Tank",
    Erudite = "Erudite",
    Intuitive = "Intuitive",
    Innate = "Innate",
    Disciple = "Disciple",
    Adept = "Adept",
    Inspired = "Inspired"
}
export interface ClassRoleDefinition {
    name: ClassRole;
    realm: ClassRealm;
    primaryAttribute: StatType;
    description: string;
}
export declare const CLASS_ROLES: Record<ClassRole, ClassRoleDefinition>;
export declare enum ClassFlavor {
    Martial = "Martial",
    Survivalist = "Survivalist",
    Scoundrel = "Scoundrel",
    Arcanist = "Arcanist",
    Mechanist = "Mechanist",
    Naturalist = "Naturalist",
    Musicist = "Musicist",
    Devout = "Devout",
    Mixed = "Mixed",
    Crusader = "Crusader"
}
export interface ClassFlavorDefinition {
    name: ClassFlavor;
    realm: ClassRealm;
    description: string;
}
export declare const CLASS_FLAVORS: Record<ClassFlavor, ClassFlavorDefinition>;
export declare class ClassDefinition {
    name: CharacterClass;
    realm: ClassRealm;
    role: ClassRole;
    flavor: ClassFlavor;
    constructor({ name, realm, role, flavor, }: {
        name: CharacterClass;
        realm: ClassRealm;
        role: ClassRole;
        flavor: ClassFlavor;
    });
    get primaryAttribute(): StatType;
    get description(): string;
}
export declare const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition>;
//# sourceMappingURL=classes.d.ts.map