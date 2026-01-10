import { ClassDefinition, ClassFlavor, ClassRealm, ClassRole } from './classes.js';
import { Race, RacialStatModifier, Upbringing } from './races.js';
import { InherentModifier } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus } from '../stats/value.js';
export declare enum FeatType {
    Core = "Core",
    Major = "Major",
    Minor = "Minor"
}
export declare enum FeatCategory {
    Racial = "Racial",
    Upbringing = "Upbringing",
    ClassRole = "Class Role",
    ClassFlavor = "Class Flavor",
    General = "General"
}
export declare enum StaticFeatSource {
    General = "General",
    ClassRole = "ClassRole",
    Race = "Race",
    Upbringing = "Upbringing"
}
export type FeatSource = StaticFeatSource | Race | Upbringing | ClassRealm | ClassRole | ClassFlavor;
export type FeatEffect = FeatStatModifier;
export declare class FeatStatModifier {
    statType: StatType;
    value: Bonus;
    constructor(statType: StatType, value: Bonus);
    toModifier(feat: FeatDefinition<string | void>): InherentModifier;
    static from(raceModifier: RacialStatModifier): FeatStatModifier;
}
export declare class FeatDefinition<T extends string | void> {
    key: Feat;
    name: string;
    type: FeatType;
    sources: FeatSource[];
    level: number;
    hideForPrint: boolean;
    description: string;
    parameter: FeatParameter<T> | undefined;
    fullDescription: ((info: FeatInfo<T>) => string) | undefined;
    effects: ((info: FeatInfo<T>) => FeatEffect[]) | undefined;
    constructor({ key, name, type, sources, level, hideForPrint, description, parameter, fullDescription, effects, }: {
        key: Feat;
        name: string;
        type: FeatType;
        sources: FeatSource[];
        level: number;
        hideForPrint?: boolean;
        description: string;
        parameter?: FeatParameter<T>;
        fullDescription?: (info: FeatInfo<T>) => string;
        effects?: (info: FeatInfo<T>) => FeatEffect[];
    });
    computeEffects(parameter: T): FeatEffect[];
    get categories(): FeatCategory[];
    get isGeneral(): boolean;
    static categoryFromSource(source: FeatSource): FeatCategory;
    fitsSlot(slot: FeatSlot): boolean;
    private fitsSlotLevel;
    private fitsSlotType;
    fitsClass(classDef: ClassDefinition): boolean;
    fitsRace(race: Race, upbringing: Upbringing): boolean;
    fitsCharacter(classDef: ClassDefinition, race: Race, upbringing: Upbringing): boolean;
    static doesSourceFitCharacter(source: FeatSource, classDef: ClassDefinition, raceDef: Race, upbringingDef: Upbringing): boolean;
    private static doesSourceFitClass;
    private static doesSourceFitRace;
}
export interface FeatParameter<T extends string | void> {
    id: string;
    name: string;
    exact: boolean;
    independentlyChosen?: boolean;
    values: T[];
}
export declare class FeatInfo<T extends string | void> {
    feat: FeatDefinition<T>;
    slot: FeatSlot | undefined;
    parameter: T;
    constructor({ feat, slot, parameter }: {
        feat: FeatDefinition<T>;
        slot: FeatSlot | undefined;
        parameter: T;
    });
    private parameterSuffix;
    get name(): string;
    get description(): string;
    toProp(): [string, string] | undefined;
    private encodeValue;
    static fromProp([key, value]: [string, string]): FeatInfo<string | void>;
    private static decodeFeatValue;
    private static parseParameter;
    static hydrateFeatDefinition: (def: FeatDefinition<string | void>, parameters: Record<string, string>, slot?: FeatSlot | undefined) => FeatInfo<string | void>;
    static hydrateFeatDefinitions: (defs: FeatDefinition<string | void>[], parameters: Record<string, string>) => FeatInfo<string | void>[];
    /**
     * Returns the prop key for a user-parametrized core feat (e.g., core.SignatureSpell)
     */
    static coreFeatPropKey(feat: Feat): string;
    /**
     * Returns the prop key/value tuple for a user-parametrized core feat,
     * or undefined if not applicable.
     */
    static toCoreProp(info: FeatInfo<string | void>): [string, string] | undefined;
    /**
     * Hydrates a FeatInfo from a core feat prop key/value
     */
    static fromCoreProp(feat: Feat, value: string): FeatInfo<string | void>;
}
export declare enum Feat {
    TradeSpecialization = "TradeSpecialization",
    ToolProficiency = "ToolProficiency",
    LipReading = "LipReading",
    AnimalMimicry = "AnimalMimicry",
    Numberphile = "Numberphile",
    UnreliableMemory = "UnreliableMemory",
    GirthCompensation = "GirthCompensation",
    SavvyBarterer = "SavvyBarterer",
    UnassumingPresence = "UnassumingPresence",
    BlindSense = "BlindSense",
    SkillSpecialization = "SkillSpecialization",
    ClassSpecialization = "ClassSpecialization",
    RacialModifier = "RacialModifier",
    UpbringingFavoredModifier = "UpbringingFavoredModifier",
    UpbringingDisfavoredModifier = "UpbringingDisfavoredModifier",
    SpecializedKnowledge = "SpecializedKnowledge",
    SpecializedTraining = "SpecializedTraining",
    NomadicAlertness = "NomadicAlertness",
    TribalEndurance = "TribalEndurance",
    LightFeet = "LightFeet",
    DarkVision = "DarkVision",
    SweepAttack = "SweepAttack",
    OpportunityWindow = "OpportunityWindow",
    SpinAttack = "SpinAttack",
    RefinedAiming = "TakeAim",
    RapidFire = "RapidFire",
    PinningShot = "PinningShot",
    QuickDraw = "QuickDraw",
    DoubleShot = "DoubleShot",
    SecondNatureShot = "SecondNatureShot",
    BallisticReconstruction = "BallisticReconstruction",
    ImprovedTaunt = "ImprovedTaunt",
    QuickBash = "QuickBash",
    ArmorFamiliarity = "ArmorFamiliarity",
    BulkyFrame = "BulkyFrame",
    ToughSkin = "ToughSkin",
    GreaterCoverUp = "GreaterCoverUp",
    StoutMetabolism = "StoutMetabolism",
    ExertAuthority = "ExertAuthority",
    DistributedShifts = "DistributedShifts",
    WeaponHoning = "WeaponHoning",
    OpportuneRetaliation = "OpportuneRetaliation",
    KnowThyEnemy = "KnowThyEnemy",
    Rage = "Rage",
    InstinctiveTracking = "InstinctiveTracking",// shared with Naturalist
    DisregardCover = "DisregardCover",
    Potioneer = "Potioneer",// shared with Naturalist
    ControlledRage = "ControlledRage",
    FancyFootwork = "FancyFootwork",
    ThievesFingers = "ThievesFingers",
    Leverage = "Leverage",
    BeginnersLuck = "BeginnersLuck",
    ArcaneCasting = "ArcaneCasting",
    SignatureSpell = "SignatureSpell",
    ReactiveCasting = "ReactiveCasting",
    CantripCasting = "CantripCasting",
    ToolAssistedCasting = "ToolAssistedCasting",
    MechanisticAffinity = "MechanisticAffinity",
    EyeForContraptions = "EyeForContraptions",
    FocalConnection = "FocalConnection",
    NaturalAffinity = "NaturalAffinity",
    LyricResonance = "LyricResonance",
    InspiringPerformance = "InspiringPerformance",
    TheresMoreToThisSong = "TheresMoreToThisSong",
    OtherworldlyFocus = "OtherworldlyFocus",
    CognitiveResilience = "CognitiveResilience",
    IReadAboutThat = "IReadAboutThat",
    IntuitiveBlasting = "IntuitiveBlasting",
    InnateEmpathy = "InnateEmpathy",
    DivineChanneling = "DivineChanneling",
    SacredCalm = "SacredCalm",
    FocusedReach = "FocusedReach",
    ReligiousRites = "ReligiousRites",
    DivineInspiration = "DivineInspiration",
    FlurryOfBlows = "FlurryOfBlows",
    ChannelingFists = "ChannelingFists",
    CallousFists = "CallousFists",
    SpiritToFlesh = "SpiritToFlesh",
    BountifulLuck = "BountifulLuck",
    LuckyRelentlessness = "LuckyRelentlessness",
    FavorableMovement = "FavorableMovement",
    LesserDivineChanneling = "LesserDivineChanneling",
    EffortlessAttuning = "EffortlessAttuning",
    FocusedChanneling = "FocusedChanneling",
    PiousModesty = "PiousModesty",
    FervorousDevotion = "FervorousDevotion",
    PersonalizedBlessing = "PersonalizedBlessing",
    DivineSmite = "DivineSmite",
    SpiritualArmor = "SpiritualArmor",
    MoralAuthority = "MoralAuthority"
}
export declare enum Trade {
    Blacksmith = "Blacksmith",
    Bookbinder = "Bookbinder",
    Carpenter = "Carpenter",
    Cartographer = "Cartographer",
    Chandler = "Chandler",
    Clothier = "Clothier",
    Cook = "Cook",
    Farmer = "Farmer",
    Fisher = "Fisher",
    Fletcher = "Fletcher",
    Jeweler = "Jeweler",
    Locksmith = "Locksmith",
    Mason = "Mason",
    Miner = "Miner",
    Potter = "Potter",
    Tanner = "Tanner",
    Weaver = "Weaver",
    Woodcutter = "Woodcutter"
}
export declare enum Tool {
    ThievesTools = "Thieves Tools",
    ClimbingGear = "Climbing Gear",
    DisguiseKit = "Disguise Kit",
    MusicalInstrument = "Musical Instrument",
    HealersKit = "Healer's Kit"
}
export declare const FEATS: Record<Feat, FeatDefinition<any>>;
export declare class FeatSlot {
    level: number;
    type: FeatType;
    order: number;
    constructor({ level, type, order }: {
        level: number;
        type: FeatType;
        order?: number;
    });
    get name(): string;
    get isExtra(): boolean;
    toProp(): string;
    static fromProp(prop: string): FeatSlot;
    static generateSlots({ maxLevel, hasSpecializedTraining, }: {
        maxLevel: number;
        hasSpecializedTraining: boolean;
    }): FeatSlot[];
}
//# sourceMappingURL=feats.d.ts.map