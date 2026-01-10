import { ClassFlavor } from './classes.js';
import { Trait } from './traits.js';
import { CircumstanceModifier } from '../stats/stat-tree.js';
import { Bonus } from '../stats/value.js';
export declare enum ArcaneSpellAugmentationType {
    Material = "Material",
    Intensity = "Intensity",
    Area = "Area",
    Volume = "Volume",
    Duration = "Duration",
    Specificity = "Specificity"
}
export declare enum ArcaneSpellSchool {
    Conjuration = "Conjuration",
    Evocation = "Evocation",
    Transmutation = "Transmutation",
    Transfiguration = "Transfiguration",
    Command = "Command",
    Telekinesis = "Telekinesis"
}
export type ArcaneSpellSchoolDefinition = {
    name: string;
    description: string;
};
export declare const FUNDAMENTAL_ARCANE_SPELL_DESCRIPTION = "The **Fundamental Arcane Spell** is the basic spell that all other spells are based on. In the most broad form, it can be used as a **Mind Attack** against **Body** ([[Rock Smash]]), **Mind** ([[Confuse Mind]]) or **Soul Defenses** ([[Erode Will]]).\n\nSelecting a specific **School** will provide more details about the **Fundamental Arcane Spell** tailored to that school.";
export declare const ARCANE_SCHOOLS: Record<ArcaneSpellSchool, ArcaneSpellSchoolDefinition>;
export declare enum ArcaneSpellComponentType {
    Somatic = "Somatic",
    Verbal = "Verbal",
    Focal = "Focal"
}
export type ArcaneSpellComponentOption = {
    name: string;
    type: ArcaneSpellComponentType;
    cost?: string | undefined;
    toComponentModifier(): CircumstanceModifier;
};
export declare class ArcaneSpellComponentDefinition implements ArcaneSpellComponentOption {
    type: ArcaneSpellComponentType;
    name: string;
    cost?: string | undefined;
    flavors: ClassFlavor[];
    bonus: Bonus;
    constructor({ type, name, cost, flavors, bonus, }: {
        type: ArcaneSpellComponentType;
        name: string;
        cost?: string | undefined;
        flavors: ClassFlavor[];
        bonus: Bonus;
    });
    toComponentModifier(): CircumstanceModifier;
}
export declare const SOMATIC_BASE_COMPONENTS: ArcaneSpellComponentDefinition[];
export declare const ARCANE_SPELL_COMPONENTS: ArcaneSpellComponentDefinition[];
export declare class ArcaneSpellAugmentation {
    type: ArcaneSpellAugmentationType;
    value: string;
    bonus: Bonus;
    variable: boolean;
    constructor({ type, value, bonus, variable, }: {
        type: ArcaneSpellAugmentationType;
        value: string;
        bonus: Bonus;
        variable?: boolean;
    });
    get key(): string;
    get shortDescription(): string;
    get description(): string;
    computeBonus(multiplier: number | undefined): number;
    getTooltip(multiplier: number | undefined): string;
}
export declare class ArcaneSpellDefinition {
    name: string;
    school: ArcaneSpellSchool;
    description: string;
    augmentations: ArcaneSpellAugmentation[];
    traits: Trait[];
    constructor({ name, school, description, augmentations, traits, }: {
        name: string;
        school: ArcaneSpellSchool;
        description: string;
        augmentations?: ArcaneSpellAugmentation[];
        traits?: Trait[];
    });
}
export declare enum PredefinedArcaneSpell {
    ConjureWater = "Conjure Water",
    RockSmash = "Rock Smash",
    ConjureDebris = "Conjure Debris",
    PoisonCloud = "Poison Cloud",
    EvokeLight = "Evoke Light",
    BlindingLight = "Blinding Light",
    EvokeFlames = "Evoke Flames",
    MudFeet = "Mud Feet",
    MendObject = "Mend Object",
    MageHand = "Mage Hand",
    ControlFlames = "Control Flames",
    MagicShove = "Magic Shove",
    HardenFists = "Harden Fists",
    HardenSkin = "Harden Skin",
    DisguiseBeing = "Disguise Being",
    HideousVisage = "Hideous Visage",
    ConfuseMind = "Confuse Mind",
    ErodeWill = "Erode Will",
    MessageBeing = "Message Being",
    GuideAnimal = "Guide Animal",
    CommandBeing = "Command Being"
}
export declare const PREDEFINED_ARCANE_SPELLS: Record<PredefinedArcaneSpell, ArcaneSpellDefinition>;
//# sourceMappingURL=arcane.d.ts.map