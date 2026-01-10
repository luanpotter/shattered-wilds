import { StatType } from '../stats/stat-type.js';
export declare enum TraitTarget {
    Action = "Action",
    Equipment = "Equipment"
}
export declare enum Trait {
    Reaction = "Reaction",
    Melee = "Melee",
    Ranged = "Ranged",
    Concentrate = "Concentrate",
    Channel = "Channel",
    BodyAttack = "Body Attack",
    MindAttack = "Mind Attack",
    SoulAttack = "Soul Attack",
    SpecialAttack = "Special Attack",
    BodyDefense = "Body Defense",
    MindDefense = "Mind Defense",
    SoulDefense = "Soul Defense",
    Concealable = "Concealable",
    Reloadable = "Reloadable",
    TwoHanded = "Two-Handed",
    Polearm = "Polearm"
}
export declare const DEFENSE_TRAITS: {
    readonly "Body Defense": StatType;
    readonly "Mind Defense": StatType;
    readonly "Soul Defense": StatType;
};
export type DefenseTrait = keyof typeof DEFENSE_TRAITS;
export declare class TraitDefinition {
    key: Trait;
    name: string;
    description: string;
    target: TraitTarget;
    constructor({ key, name, description, target, }: {
        key: Trait;
        name: string;
        description: string;
        target: TraitTarget;
    });
}
export declare const TRAITS: Record<Trait, TraitDefinition>;
//# sourceMappingURL=traits.d.ts.map