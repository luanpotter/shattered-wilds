import { CheckMode, CheckNature } from '../stats/check.js';
import { Formula, FormulaResult } from '../stats/formula.js';
import { ResourceCost } from '../stats/resources.js';
import { CircumstanceModifier, StatTree } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Trait } from './traits.js';
export declare enum ActionType {
    Movement = "Movement",
    Attack = "Attack",
    Defense = "Defense",
    Support = "Support",
    Heroic = "Heroic",
    Meta = "Meta"
}
export declare enum ActionValueUnit {
    Hex = "Hex",
    Modifier = "Modifier"
}
export type ActionParameter = ActionValueParameter | ActionCheckParameter;
export declare class ActionValueParameter {
    name: string;
    unit: ActionValueUnit;
    formula: Formula;
    constructor({ name, unit, formula }: {
        name: string;
        unit: ActionValueUnit;
        formula: Formula;
    });
    compute(statTree: StatTree): FormulaResult;
    toString(): string;
}
export declare enum StandardCheck {
    /** Will use STR or DEX depending on the selected Weapon. */
    BodyAttack = "BodyAttack",
    /** Will use Body, Mind or Soul depending on the selected Defense Realm. */
    Defense = "Defense"
}
export declare enum IncludeEquipmentModifier {
    Weapon = "Weapon",
    Armor = "Armor",
    Shield = "Shield"
}
export declare class ActionCheckParameter {
    mode: CheckMode;
    nature: CheckNature;
    statType: StatType | StandardCheck;
    includeEquipmentModifiers: IncludeEquipmentModifier[];
    circumstanceModifier: CircumstanceModifier | undefined;
    targetDC: number | undefined;
    constructor({ mode, nature, statType, includeEquipmentModifiers, circumstanceModifier, targetDC, }: {
        mode: CheckMode;
        nature: CheckNature;
        statType: StatType | StandardCheck;
        includeEquipmentModifiers?: IncludeEquipmentModifier[];
        circumstanceModifier?: CircumstanceModifier | undefined;
        targetDC?: number | undefined;
    });
    toString(): string;
    static bodyAttack({ statType, circumstanceModifier, }?: {
        statType?: StatType | StandardCheck;
        circumstanceModifier?: CircumstanceModifier;
    }): ActionCheckParameter;
    static attack({ statType, includeEquipmentModifiers, circumstanceModifier, }: {
        statType: StatType | StandardCheck;
        includeEquipmentModifiers?: IncludeEquipmentModifier[];
        circumstanceModifier?: CircumstanceModifier | undefined;
    }): ActionCheckParameter;
    static bodyDefense({ statType, includeEquipmentModifiers, circumstanceModifier, }?: {
        statType?: StatType | StandardCheck;
        includeEquipmentModifiers?: IncludeEquipmentModifier[];
        circumstanceModifier?: CircumstanceModifier | undefined;
    }): ActionCheckParameter;
    static defense({ statType, includeEquipmentModifiers, circumstanceModifier, }: {
        statType: StatType | StandardCheck;
        includeEquipmentModifiers?: IncludeEquipmentModifier[];
        circumstanceModifier?: CircumstanceModifier | undefined;
    }): ActionCheckParameter;
}
export declare class ActionDefinition {
    key: Action;
    type: ActionType;
    name: string;
    description: string;
    costs: ResourceCost[];
    traits: Trait[];
    parameters: ActionParameter[];
    constructor({ key, type, name, description, costs, traits, parameters, }: {
        key: Action;
        type: ActionType;
        name: string;
        description: string;
        costs: ResourceCost[];
        traits?: Trait[];
        parameters?: ActionParameter[];
    });
}
export declare enum Action {
    Aim = "Aim",
    Stride = "Stride",
    Stun = "Stun",
    CatchBreath = "CatchBreath",
    KarmicResistance = "KarmicResistance",
    WriteHistory = "WriteHistory",
    ExtraDie = "ExtraDie",
    Feint = "Feint",
    PrepareAction = "PrepareAction",
    Strike = "Strike",
    Taunt = "Taunt",
    Calm = "Calm",
    Focus = "Focus",
    HeroicRelentlessness = "HeroicRelentlessness",
    OpportunityAttack = "OpportunityAttack",
    Run = "Run",
    ShrugOff = "ShrugOff",
    FocusedStrike = "FocusedStrike",
    Demoralize = "Demoralize",
    Trip = "Trip",
    LuckDie = "LuckDie",
    DragGrappler = "DragGrappler",
    Escape = "Escape",
    GetUp = "GetUp",
    Grapple = "Grapple",
    Charge = "Charge",
    Climb = "Climb",
    Hide = "Hide",
    Inspire = "Inspire",
    Shove = "Shove",
    Sneak = "Sneak",
    PassThrough = "PassThrough",
    Swim = "Swim",
    TakeCover = "TakeCover",
    SteelConviction = "SteelConviction",
    SideStep = "SideStep",
    ShieldBlock = "ShieldBlock",
    SheatheUnsheathe = "SheatheUnsheathe",
    Reload = "Reload",
    Flank = "Flank",
    Dodge = "Dodge",
    Disarm = "Disarm",
    DecreaseInitiative = "DecreaseInitiative",
    BasicDefense = "BasicDefense"
}
export declare const ACTIONS: {
    Stride: ActionDefinition;
    Run: ActionDefinition;
    DragGrappler: ActionDefinition;
    Climb: ActionDefinition;
    PassThrough: ActionDefinition;
    Swim: ActionDefinition;
    SideStep: ActionDefinition;
    Sneak: ActionDefinition;
    Charge: ActionDefinition;
    Strike: ActionDefinition;
    Stun: ActionDefinition;
    Feint: ActionDefinition;
    FocusedStrike: ActionDefinition;
    Aim: ActionDefinition;
    Trip: ActionDefinition;
    Grapple: ActionDefinition;
    Shove: ActionDefinition;
    Disarm: ActionDefinition;
    Demoralize: ActionDefinition;
    OpportunityAttack: ActionDefinition;
    BasicDefense: ActionDefinition;
    ShieldBlock: ActionDefinition;
    Dodge: ActionDefinition;
    TakeCover: ActionDefinition;
    SteelConviction: ActionDefinition;
    GetUp: ActionDefinition;
    Hide: ActionDefinition;
    ShrugOff: ActionDefinition;
    Escape: ActionDefinition;
    Flank: ActionDefinition;
    Taunt: ActionDefinition;
    CatchBreath: ActionDefinition;
    Calm: ActionDefinition;
    Focus: ActionDefinition;
    Inspire: ActionDefinition;
    SheatheUnsheathe: ActionDefinition;
    Reload: ActionDefinition;
    KarmicResistance: ActionDefinition;
    WriteHistory: ActionDefinition;
    HeroicRelentlessness: ActionDefinition;
    LuckDie: ActionDefinition;
    ExtraDie: ActionDefinition;
    PrepareAction: ActionDefinition;
    DecreaseInitiative: ActionDefinition;
};
//# sourceMappingURL=actions.d.ts.map