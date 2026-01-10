import { CLASS_ROLES, ClassFlavor, ClassRealm, ClassRole } from './classes.js';
import { Race, RACE_DEFINITIONS, Upbringing } from './races.js';
import { InherentModifier, ModifierSource } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus } from '../stats/value.js';
import { PredefinedArcaneSpell } from './arcane.js';
export var FeatType;
(function (FeatType) {
    FeatType["Core"] = "Core";
    FeatType["Major"] = "Major";
    FeatType["Minor"] = "Minor";
})(FeatType || (FeatType = {}));
export var FeatCategory;
(function (FeatCategory) {
    FeatCategory["Racial"] = "Racial";
    FeatCategory["Upbringing"] = "Upbringing";
    FeatCategory["ClassRole"] = "Class Role";
    FeatCategory["ClassFlavor"] = "Class Flavor";
    FeatCategory["General"] = "General";
})(FeatCategory || (FeatCategory = {}));
export var StaticFeatSource;
(function (StaticFeatSource) {
    StaticFeatSource["General"] = "General";
    StaticFeatSource["ClassRole"] = "ClassRole";
    StaticFeatSource["Race"] = "Race";
    StaticFeatSource["Upbringing"] = "Upbringing";
})(StaticFeatSource || (StaticFeatSource = {}));
export class FeatStatModifier {
    statType;
    value;
    constructor(statType, value) {
        this.statType = statType;
        this.value = value;
    }
    toModifier(feat) {
        return new InherentModifier({
            source: ModifierSource.Feat,
            name: feat.name,
            statType: this.statType,
            value: this.value,
        });
    }
    static from(raceModifier) {
        return new FeatStatModifier(raceModifier.statType, raceModifier.value);
    }
}
export class FeatDefinition {
    key;
    name;
    type;
    sources;
    level;
    hideForPrint;
    description;
    parameter;
    fullDescription;
    effects;
    constructor({ key, name, type, sources, level, hideForPrint, description, parameter, fullDescription, effects, }) {
        this.key = key;
        this.name = name;
        this.type = type;
        this.sources = sources;
        this.level = level;
        this.hideForPrint = hideForPrint ?? false;
        this.description = description;
        this.parameter = parameter ?? undefined;
        this.fullDescription = fullDescription;
        this.effects = effects;
    }
    computeEffects(parameter) {
        const info = new FeatInfo({
            feat: this,
            slot: undefined,
            parameter,
        });
        return this.effects?.(info) ?? [];
    }
    get categories() {
        return this.sources.map(FeatDefinition.categoryFromSource);
    }
    get isGeneral() {
        return this.sources.includes(StaticFeatSource.General);
    }
    static categoryFromSource(source) {
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
        if (Object.values(Race).includes(source)) {
            return FeatCategory.Racial;
        }
        if (Object.values(Upbringing).includes(source)) {
            return FeatCategory.Upbringing;
        }
        if (Object.values(ClassRole).includes(source)) {
            return FeatCategory.ClassRole;
        }
        if (Object.values(ClassFlavor).includes(source)) {
            return FeatCategory.ClassFlavor;
        }
        if (Object.values(ClassRealm).includes(source)) {
            return FeatCategory.ClassRole;
        }
        throw new Error(`Unknown feat source: ${source}`);
    }
    fitsSlot(slot) {
        return this.fitsSlotLevel(slot.level) && this.fitsSlotType(slot.type);
    }
    fitsSlotLevel(slotLevel) {
        return this.level <= slotLevel;
    }
    fitsSlotType(slotType) {
        switch (this.type) {
            case FeatType.Core:
                return false; // core feats cannot be slotted
            case FeatType.Major:
                return slotType === FeatType.Major;
            case FeatType.Minor:
                return true; // you can always fit a minor feat on a major slot
        }
    }
    fitsClass(classDef) {
        return this.sources.some(source => FeatDefinition.doesSourceFitClass(source, classDef));
    }
    fitsRace(race, upbringing) {
        return this.sources.some(source => FeatDefinition.doesSourceFitRace(source, race, upbringing));
    }
    fitsCharacter(classDef, race, upbringing) {
        return this.sources.some(source => FeatDefinition.doesSourceFitCharacter(source, classDef, race, upbringing));
    }
    static doesSourceFitCharacter(source, classDef, raceDef, upbringingDef) {
        return (source === StaticFeatSource.General ||
            FeatDefinition.doesSourceFitClass(source, classDef) ||
            FeatDefinition.doesSourceFitRace(source, raceDef, upbringingDef));
    }
    static doesSourceFitClass(source, classDef) {
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
    static doesSourceFitRace(source, race, upbringing) {
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
export class FeatInfo {
    feat;
    slot;
    parameter;
    constructor({ feat, slot, parameter }) {
        this.feat = feat;
        this.slot = slot;
        this.parameter = parameter;
    }
    parameterSuffix() {
        if (!this.parameter) {
            return '';
        }
        if (this.feat.parameter &&
            !this.feat.parameter.exact &&
            typeof this.parameter === 'string' &&
            !this.feat.parameter.values.includes(this.parameter)) {
            return ` (Other: ${this.parameter})`;
        }
        return ` (${this.parameter})`;
    }
    get name() {
        return `${this.feat.name}${this.parameterSuffix()}`;
    }
    get description() {
        return this.feat?.fullDescription?.(this) ?? `${this.feat.description}${this.parameterSuffix()}`;
    }
    toProp() {
        const slot = this.slot;
        if (!slot) {
            return undefined; // core feat - no need to save it
        }
        return [slot.toProp(), this.encodeValue()];
    }
    encodeValue() {
        if (this.parameter) {
            // Always encode as key#parameter, even for custom
            return `${this.feat.key}#${this.parameter}`;
        }
        else {
            return this.feat.key;
        }
    }
    static fromProp([key, value]) {
        const slot = FeatSlot.fromProp(key);
        const [feat, parameter] = this.decodeFeatValue(value);
        const def = FEATS[feat];
        return new FeatInfo({ feat: def, slot, parameter });
    }
    static decodeFeatValue(value) {
        if (!value.includes('#')) {
            return [value, null];
        }
        // Support custom values: always treat after # as parameter
        const [feat, ...rest] = value.split('#');
        return [feat, rest.join('#')];
    }
    static parseParameter = (def, parameters) => {
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
        }
        else {
            return undefined;
        }
    };
    static hydrateFeatDefinition = (def, parameters, slot = undefined) => {
        // For core feats with user parameter, allow parameter from core prop
        let parameter = undefined;
        if (def.type === FeatType.Core && def.parameter && def.parameter.independentlyChosen && !slot) {
            const coreKey = FeatInfo.coreFeatPropKey(def.key);
            if (parameters[coreKey] !== undefined) {
                parameter = parameters[coreKey];
            }
            else {
                parameter = FeatInfo.parseParameter(def, parameters);
            }
        }
        else {
            parameter = FeatInfo.parseParameter(def, parameters);
        }
        return new FeatInfo({ feat: def, slot, parameter });
    };
    static hydrateFeatDefinitions = (defs, parameters) => {
        return defs.map(def => FeatInfo.hydrateFeatDefinition(def, parameters));
    };
    /**
     * Returns the prop key for a user-parametrized core feat (e.g., core.SignatureSpell)
     */
    static coreFeatPropKey(feat) {
        return `core.${feat}`;
    }
    /**
     * Returns the prop key/value tuple for a user-parametrized core feat,
     * or undefined if not applicable.
     */
    static toCoreProp(info) {
        if (info.feat.type === FeatType.Core &&
            info.feat.parameter &&
            info.feat.parameter.independentlyChosen &&
            !info.slot &&
            info.parameter) {
            return [FeatInfo.coreFeatPropKey(info.feat.key), info.parameter];
        }
        return undefined;
    }
    /**
     * Hydrates a FeatInfo from a core feat prop key/value
     */
    static fromCoreProp(feat, value) {
        const def = FEATS[feat];
        return new FeatInfo({ feat: def, slot: undefined, parameter: value });
    }
}
const skills = StatType.skills.map(stat => stat.name);
export var Feat;
(function (Feat) {
    // General
    Feat["TradeSpecialization"] = "TradeSpecialization";
    Feat["ToolProficiency"] = "ToolProficiency";
    Feat["LipReading"] = "LipReading";
    Feat["AnimalMimicry"] = "AnimalMimicry";
    Feat["Numberphile"] = "Numberphile";
    Feat["UnreliableMemory"] = "UnreliableMemory";
    Feat["GirthCompensation"] = "GirthCompensation";
    Feat["SavvyBarterer"] = "SavvyBarterer";
    Feat["UnassumingPresence"] = "UnassumingPresence";
    Feat["BlindSense"] = "BlindSense";
    Feat["SkillSpecialization"] = "SkillSpecialization";
    // Class
    Feat["ClassSpecialization"] = "ClassSpecialization";
    // Race
    Feat["RacialModifier"] = "RacialModifier";
    Feat["UpbringingFavoredModifier"] = "UpbringingFavoredModifier";
    Feat["UpbringingDisfavoredModifier"] = "UpbringingDisfavoredModifier";
    Feat["SpecializedKnowledge"] = "SpecializedKnowledge";
    Feat["SpecializedTraining"] = "SpecializedTraining";
    Feat["NomadicAlertness"] = "NomadicAlertness";
    Feat["TribalEndurance"] = "TribalEndurance";
    Feat["LightFeet"] = "LightFeet";
    Feat["DarkVision"] = "DarkVision";
    // Melee
    Feat["SweepAttack"] = "SweepAttack";
    Feat["OpportunityWindow"] = "OpportunityWindow";
    Feat["SpinAttack"] = "SpinAttack";
    // Ranged
    Feat["RefinedAiming"] = "TakeAim";
    Feat["RapidFire"] = "RapidFire";
    Feat["PinningShot"] = "PinningShot";
    Feat["QuickDraw"] = "QuickDraw";
    Feat["DoubleShot"] = "DoubleShot";
    Feat["SecondNatureShot"] = "SecondNatureShot";
    Feat["BallisticReconstruction"] = "BallisticReconstruction";
    // Tank
    Feat["ImprovedTaunt"] = "ImprovedTaunt";
    Feat["QuickBash"] = "QuickBash";
    Feat["ArmorFamiliarity"] = "ArmorFamiliarity";
    Feat["BulkyFrame"] = "BulkyFrame";
    Feat["ToughSkin"] = "ToughSkin";
    Feat["GreaterCoverUp"] = "GreaterCoverUp";
    Feat["StoutMetabolism"] = "StoutMetabolism";
    // Martial
    Feat["ExertAuthority"] = "ExertAuthority";
    Feat["DistributedShifts"] = "DistributedShifts";
    Feat["WeaponHoning"] = "WeaponHoning";
    Feat["OpportuneRetaliation"] = "OpportuneRetaliation";
    Feat["KnowThyEnemy"] = "KnowThyEnemy";
    // Survivalist
    Feat["Rage"] = "Rage";
    Feat["InstinctiveTracking"] = "InstinctiveTracking";
    Feat["DisregardCover"] = "DisregardCover";
    Feat["Potioneer"] = "Potioneer";
    Feat["ControlledRage"] = "ControlledRage";
    // Scoundrel
    Feat["FancyFootwork"] = "FancyFootwork";
    Feat["ThievesFingers"] = "ThievesFingers";
    Feat["Leverage"] = "Leverage";
    Feat["BeginnersLuck"] = "BeginnersLuck";
    // Caster
    Feat["ArcaneCasting"] = "ArcaneCasting";
    // Arcanist
    Feat["SignatureSpell"] = "SignatureSpell";
    Feat["ReactiveCasting"] = "ReactiveCasting";
    Feat["CantripCasting"] = "CantripCasting";
    // Mechanist
    Feat["ToolAssistedCasting"] = "ToolAssistedCasting";
    Feat["MechanisticAffinity"] = "MechanisticAffinity";
    Feat["EyeForContraptions"] = "EyeForContraptions";
    // Naturalist
    Feat["FocalConnection"] = "FocalConnection";
    Feat["NaturalAffinity"] = "NaturalAffinity";
    // Musicist
    Feat["LyricResonance"] = "LyricResonance";
    Feat["InspiringPerformance"] = "InspiringPerformance";
    Feat["TheresMoreToThisSong"] = "TheresMoreToThisSong";
    // Erudite
    Feat["OtherworldlyFocus"] = "OtherworldlyFocus";
    Feat["CognitiveResilience"] = "CognitiveResilience";
    Feat["IReadAboutThat"] = "IReadAboutThat";
    // Intuitive
    Feat["IntuitiveBlasting"] = "IntuitiveBlasting";
    // Innate
    Feat["InnateEmpathy"] = "InnateEmpathy";
    // Disciple
    Feat["DivineChanneling"] = "DivineChanneling";
    Feat["SacredCalm"] = "SacredCalm";
    Feat["FocusedReach"] = "FocusedReach";
    Feat["ReligiousRites"] = "ReligiousRites";
    Feat["DivineInspiration"] = "DivineInspiration";
    // Adept
    Feat["FlurryOfBlows"] = "FlurryOfBlows";
    Feat["ChannelingFists"] = "ChannelingFists";
    Feat["CallousFists"] = "CallousFists";
    Feat["SpiritToFlesh"] = "SpiritToFlesh";
    // Inspired
    Feat["BountifulLuck"] = "BountifulLuck";
    Feat["LuckyRelentlessness"] = "LuckyRelentlessness";
    Feat["FavorableMovement"] = "FavorableMovement";
    // Devout
    Feat["LesserDivineChanneling"] = "LesserDivineChanneling";
    Feat["EffortlessAttuning"] = "EffortlessAttuning";
    Feat["FocusedChanneling"] = "FocusedChanneling";
    Feat["PiousModesty"] = "PiousModesty";
    Feat["FervorousDevotion"] = "FervorousDevotion";
    Feat["PersonalizedBlessing"] = "PersonalizedBlessing";
    // Crusader
    Feat["DivineSmite"] = "DivineSmite";
    Feat["SpiritualArmor"] = "SpiritualArmor";
    Feat["MoralAuthority"] = "MoralAuthority";
})(Feat || (Feat = {}));
export var Trade;
(function (Trade) {
    Trade["Blacksmith"] = "Blacksmith";
    Trade["Bookbinder"] = "Bookbinder";
    Trade["Carpenter"] = "Carpenter";
    Trade["Cartographer"] = "Cartographer";
    Trade["Chandler"] = "Chandler";
    Trade["Clothier"] = "Clothier";
    Trade["Cook"] = "Cook";
    Trade["Farmer"] = "Farmer";
    Trade["Fisher"] = "Fisher";
    Trade["Fletcher"] = "Fletcher";
    Trade["Jeweler"] = "Jeweler";
    Trade["Locksmith"] = "Locksmith";
    Trade["Mason"] = "Mason";
    Trade["Miner"] = "Miner";
    Trade["Potter"] = "Potter";
    Trade["Tanner"] = "Tanner";
    Trade["Weaver"] = "Weaver";
    Trade["Woodcutter"] = "Woodcutter";
})(Trade || (Trade = {}));
export var Tool;
(function (Tool) {
    Tool["ThievesTools"] = "Thieves Tools";
    Tool["ClimbingGear"] = "Climbing Gear";
    Tool["DisguiseKit"] = "Disguise Kit";
    Tool["MusicalInstrument"] = "Musical Instrument";
    Tool["HealersKit"] = "Healer's Kit";
})(Tool || (Tool = {}));
// NOTE: typescript does not support generic type parameters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FEATS = {
    [Feat.TradeSpecialization]: new FeatDefinition({
        key: Feat.TradeSpecialization,
        name: 'Trade Specialization',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 1,
        description: 'You are acquainted with a specific trade, allowing you to perform basic tasks associated with it, such as a Blacksmith, Bookbinder, Carpenter, Cartographer, Chandler, Clothier, Cook, Farmer, Fisher, Fletcher, Herbalist, Jeweler, Locksmith, Mason, Miner, Potter, Tanner, Weaver, Weaver, Woodcutter, etc. You can pick this Feat multiple times for different trades.',
        fullDescription: info => {
            return `You are acquainted with the **${info.parameter}** trade, allowing you to perform basic tasks associated with it.`;
        },
        parameter: {
            id: 'trade',
            name: 'Trade',
            exact: false,
            values: Object.values(Trade),
        },
    }),
    [Feat.ToolProficiency]: new FeatDefinition({
        key: Feat.ToolProficiency,
        name: 'Tool Proficiency',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 1,
        description: 'You are proficient with a specific tool, granting you a `+3` [[Circumstance Modifier | CM]] when performing appropriate tasks using it. You can pick this Feat multiple times for different tools.',
        fullDescription: info => {
            return `You are proficient with a **${info.parameter}**, granting you a \`+3\` Circumstance Modifier (CM) when performing appropriate tasks using it.`;
        },
        parameter: {
            id: 'tool',
            name: 'Tool',
            exact: false,
            values: Object.values(Tool),
        },
    }),
    [Feat.LipReading]: new FeatDefinition({
        key: Feat.LipReading,
        name: 'Lip Reading',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 1,
        description: 'You can read lips to understand what people are saying when you can see them clearly.',
    }),
    [Feat.AnimalMimicry]: new FeatDefinition({
        key: Feat.AnimalMimicry,
        name: 'Animal Mimicry',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 1,
        description: 'You have an uncanny knack for mimicking animal sounds. If you are familiar with it, and a humanoid could conceivably reproduce it, you can make a good-enough impression that an untrained ear could not distinguish it. An expert (such as someone with the Sylvan Upbringing) could run an [[Intuition]] Check (or [[Knowledge]] if they have reason to suspect) to try to assess the veracity of the sound.',
    }),
    [Feat.Numberphile]: new FeatDefinition({
        key: Feat.Numberphile,
        name: 'Numberphile',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 1,
        description: 'You are particularly good at basic (up-to triple-digit) arithmetic in your head, and you can quickly estimate the number of items in a reasonably-sized group with relative accuracy at only a glance.',
    }),
    [Feat.UnreliableMemory]: new FeatDefinition({
        key: Feat.UnreliableMemory,
        name: 'Unreliable Memory',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 1,
        description: 'You gain a `+6` [[Circumstance Modifier | CM]] to all [[Memory]] Checks attempting to recall information; however, your rolls will be done in secret by the DM, and, if you fail, you will confidently remember incorrect (or half-correct) versions of the truth.',
    }),
    [Feat.GirthCompensation]: new FeatDefinition({
        key: Feat.GirthCompensation,
        name: 'Girth Compensation',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 1,
        description: 'You can use [[STR]] as the **Primary Attribute** for **Light Melee** weapons.',
    }),
    [Feat.SavvyBarterer]: new FeatDefinition({
        key: Feat.SavvyBarterer,
        name: 'Savvy Barterer',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 1,
        description: `You have a knack for getting good deals. When you are buying or selling goods or services and engage in haggling, you can have your target roll a contested [[Resolve]] check against your [[Presence]] to get a better deal. You can spend 1 [[Focus_Points | FP]] to gain a \`+3\` [[Circumstance Modifier | CM]] to your [[Presence]] check for this purpose.`,
    }),
    [Feat.UnassumingPresence]: new FeatDefinition({
        key: Feat.UnassumingPresence,
        name: 'Unassuming Presence',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 1,
        description: `You often pass unnoticed in a crowd. You gain a +3 [[Circumstance Modifier | CM]] to [[Finesse]] checks made to avoid being noticed in a crowd when you are not causing any disturbance.`,
    }),
    [Feat.BlindSense]: new FeatDefinition({
        key: Feat.BlindSense,
        name: 'Blind Sense',
        type: FeatType.Major,
        sources: [StaticFeatSource.General],
        level: 2,
        description: 'Your strong connection to your Soul Realm allows you to expand your sense of hearing and smell. You can spend 1 [[Action_Points | AP]] and 2 [[Spirit_Points | SP]] to know the positions of any creature you are aware of within `6 Hexes` as well as if you could see them clearly. If they are explicitly trying to sneak, you get `+6` [[Circumstance Modifier | CM]] to your [[Perception]] Check.',
    }),
    [Feat.SkillSpecialization]: new FeatDefinition({
        key: Feat.SkillSpecialization,
        name: 'Skill Specialization',
        type: FeatType.Minor,
        sources: [StaticFeatSource.General],
        level: 5,
        description: 'You have specialized into one of the three [[Skill | Skills]] for a given [[Attribute]]. You get +1 in that Skill and -1 on the other two.',
        parameter: {
            id: 'skill',
            name: 'Skill',
            exact: true,
            values: skills,
        },
        effects: info => {
            const skill = StatType.fromName(info.parameter);
            const siblings = StatType.skills.filter(s => s !== skill && s.parent === skill.parent);
            return [new FeatStatModifier(skill, Bonus.of(1)), ...siblings.map(s => new FeatStatModifier(s, Bonus.of(-1)))];
        },
        fullDescription: info => {
            const skill = StatType.fromName(info.parameter);
            const attribute = skill.parent;
            const effects = info.feat.effects?.(info);
            return `You have specialized into ${skill.name} within ${attribute}. You get:\n${effects?.map(e => `* ${e.statType.name}: ${e.value.description}`).join('\n')}`;
        },
    }),
    // Class
    [Feat.ClassSpecialization]: new FeatDefinition({
        key: Feat.ClassSpecialization,
        name: 'Class Specialization',
        type: FeatType.Core,
        sources: [StaticFeatSource.ClassRole],
        level: 1,
        hideForPrint: true,
        description: `+1 Attribute Modifier to the class's primary attribute`,
        parameter: {
            id: 'class-role',
            name: 'Class Role',
            exact: true,
            values: Object.values(ClassRole),
        },
        fullDescription: info => {
            const primaryAttribute = CLASS_ROLES[info.parameter].primaryAttribute;
            return `Class Specialization modifier for ${info.parameter}: +1 ${primaryAttribute}.`;
        },
        effects: info => {
            const primaryAttribute = CLASS_ROLES[info.parameter].primaryAttribute;
            return [new FeatStatModifier(primaryAttribute, Bonus.of(1))];
        },
    }),
    // Race
    [Feat.RacialModifier]: new FeatDefinition({
        key: Feat.RacialModifier,
        name: 'Racial Modifier',
        type: FeatType.Core,
        sources: [StaticFeatSource.Race],
        level: 0,
        hideForPrint: true,
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
    [Feat.UpbringingFavoredModifier]: new FeatDefinition({
        key: Feat.UpbringingFavoredModifier,
        name: 'Upbringing Favored Modifier',
        type: FeatType.Core,
        sources: [StaticFeatSource.Upbringing],
        level: 0,
        hideForPrint: true,
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
    [Feat.UpbringingDisfavoredModifier]: new FeatDefinition({
        key: Feat.UpbringingDisfavoredModifier,
        name: 'Upbringing Disfavored Modifier',
        type: FeatType.Core,
        sources: [StaticFeatSource.Upbringing],
        level: 0,
        hideForPrint: true,
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
    [Feat.SpecializedKnowledge]: new FeatDefinition({
        key: Feat.SpecializedKnowledge,
        name: 'Specialized Knowledge',
        type: FeatType.Core,
        sources: [StaticFeatSource.Upbringing],
        level: 0,
        description: 'You have `+3` to [[Knowledge]] or [[Intuition]] Checks about aspects related to a specific area of expertise.',
        fullDescription: info => {
            return `You have \`+3\` to **Knowledge** or **Intuition** Checks about aspects related to **${info.parameter}** Knowledge.`;
        },
        parameter: {
            id: 'upbringing',
            name: 'Upbringing',
            exact: true,
            values: Object.values(Upbringing),
        },
    }),
    [Feat.SpecializedTraining]: new FeatDefinition({
        key: Feat.SpecializedTraining,
        name: 'Specialized Training',
        type: FeatType.Core,
        sources: [Upbringing.Urban],
        level: 0,
        hideForPrint: true,
        description: 'You gain two additional **Minor Feat** slots at Level 1.',
    }),
    [Feat.NomadicAlertness]: new FeatDefinition({
        key: Feat.NomadicAlertness,
        name: 'Nomadic Alertness',
        type: FeatType.Core,
        sources: [Upbringing.Nomadic],
        level: 0,
        description: 'Can make [[Awareness]] Checks to spot danger while sleeping in the Wilds with no [[Circumstance Modifier | CM]] penalty.',
    }),
    [Feat.TribalEndurance]: new FeatDefinition({
        key: Feat.TribalEndurance,
        name: 'Tribal Endurance',
        type: FeatType.Core,
        sources: [Upbringing.Tribal],
        level: 0,
        description: 'Pay 1 [[Heroism_Points | Heroism Point]] to reduce your [[Exhaustion]] _rank_ by 1 if you can directly tie a current task to your personal sense of duty towards your tribe.',
    }),
    [Feat.LightFeet]: new FeatDefinition({
        key: Feat.LightFeet,
        name: 'Light Feet',
        type: FeatType.Core,
        sources: [Upbringing.Sylvan],
        level: 0,
        description: 'Ignore **Difficult Terrain** due to natural vegetation, forest growth, etc.',
    }),
    [Feat.DarkVision]: new FeatDefinition({
        key: Feat.DarkVision,
        name: 'Dark Vision',
        type: FeatType.Core,
        sources: [Upbringing.Telluric],
        level: 0,
        description: 'See black-and-white in the dark.',
    }),
    // Melee
    [Feat.SweepAttack]: new FeatDefinition({
        key: Feat.SweepAttack,
        name: 'Sweep Attack',
        type: FeatType.Core,
        sources: [ClassRole.Melee],
        level: 1,
        description: 'You can spend `3` [[Action_Points | AP]] and `1` [[Focus_Points | FP]] to perform an advanced **Melee Strike** against up to three adjacent enemies within your reach. You roll once for all targets, but they resist separately.',
    }),
    [Feat.OpportunityWindow]: new FeatDefinition({
        key: Feat.OpportunityWindow,
        name: 'Opportunity Window',
        type: FeatType.Major,
        sources: [ClassRole.Melee],
        level: 2,
        description: 'You can spend `1` [[Spirit_Points | SP]] to reduce by `1` (min `1`) the amount of [[Action_Points | AP]] you would spend to perform the [[Opportunity_Attack | Opportunity Attack]] reaction.',
    }),
    [Feat.SpinAttack]: new FeatDefinition({
        key: Feat.SpinAttack,
        name: 'Spin Attack',
        type: FeatType.Minor,
        sources: [ClassRole.Melee],
        level: 3,
        description: 'Upgrade the **Sweep Attack** to target any number of creatures; they no longer need to be adjacent to each other (they still need to be adjacent to you).',
    }),
    // Ranged
    [Feat.RefinedAiming]: new FeatDefinition({
        key: Feat.RefinedAiming,
        name: 'Refined Aiming',
        type: FeatType.Core,
        sources: [ClassRole.Ranged],
        level: 1,
        description: 'When using the [[Aim]] action, you can increase the base range of your **Ranged Weapon** by your [[Finesse]] modifier.',
    }),
    [Feat.RapidFire]: new FeatDefinition({
        key: Feat.RapidFire,
        name: 'Rapid Fire',
        type: FeatType.Major,
        sources: [ClassRole.Ranged],
        level: 3,
        description: 'Spend 2 [[Spirit_Points | SP]] (and the [[Action_Points | AP]] that it would cost) to use a [[Strike]] action for **Basic Ranged Attack** as a reaction; it loses the [[Concentrate]] trait.',
    }),
    [Feat.PinningShot]: new FeatDefinition({
        key: Feat.PinningShot,
        name: 'Pinning Shot',
        type: FeatType.Major,
        sources: [ClassRole.Ranged],
        level: 2,
        description: 'You can perform the [[Stun]] action with **Ranged Attacks**.',
    }),
    [Feat.QuickDraw]: new FeatDefinition({
        key: Feat.QuickDraw,
        name: 'Quick Draw',
        type: FeatType.Minor,
        sources: [ClassRole.Ranged],
        level: 3,
        description: 'If you have at least one hand free, you can spend 1 [[Focus_Points | FP]] to draw a **Light Melee Weapon** without spending an action.',
    }),
    [Feat.DoubleShot]: new FeatDefinition({
        key: Feat.DoubleShot,
        name: 'Double Shot',
        type: FeatType.Major,
        sources: [ClassRole.Ranged],
        level: 4,
        description: 'You can spend 3 [[Spirit_Points | SP]] to shoot two projectiles with a single [[Strike]] action. Roll for each separately, one after the other.',
    }),
    [Feat.SecondNatureShot]: new FeatDefinition({
        key: Feat.SecondNatureShot,
        name: 'Second-Nature Shot',
        type: FeatType.Major,
        sources: [ClassRole.Ranged],
        level: 4,
        description: `While performing a **Ranged Attack** with a weapon you are familiar with, you can spend 1 [[Spirit_Points | SP]] to ignore the [[Concentrate]] trait.

			You are "familiar" with a weapon that you have used at least twice each in at least two encounters in at least two distinct days; or you can spend a 1 hour during your daily downtime for at least a few days getting accustomed to it - to DM's discretion.`,
    }),
    [Feat.BallisticReconstruction]: new FeatDefinition({
        key: Feat.BallisticReconstruction,
        name: 'Ballistic Reconstruction',
        type: FeatType.Minor,
        sources: [ClassRole.Ranged],
        level: 5,
        description: 'You can analyze the undisturbed remains of a projectile (such as an arrow or dart) and its impact site to determine the ballistic trajectory taken, including the approximate direction and distance of origin, as well as the nature of the weapon used, with reliable accuracy.',
    }),
    // Tank
    [Feat.ImprovedTaunt]: new FeatDefinition({
        key: Feat.ImprovedTaunt,
        name: 'Improved Taunt',
        type: FeatType.Core,
        sources: [ClassRole.Tank],
        level: 1,
        description: 'You can spend an additional 1 [[Spirit_Points | SP]] as you perform a [[Taunt]] action to get a +6 [[Circumstance Modifier | CM]] to your [[Presence]] Check.',
    }),
    [Feat.QuickBash]: new FeatDefinition({
        key: Feat.QuickBash,
        name: 'Quick Bash',
        type: FeatType.Major,
        sources: [ClassRole.Tank],
        level: 2,
        description: 'You only need to spend 1 [[Action_Points | AP]] (instead of 2) to perform a **Shield Bash** .',
    }),
    [Feat.ArmorFamiliarity]: new FeatDefinition({
        key: Feat.ArmorFamiliarity,
        name: 'Armor Familiarity',
        type: FeatType.Minor,
        sources: [ClassRole.Tank],
        level: 3,
        description: 'You reduce your [[DEX]] penalty from wearing Armor by `1` (min `0`).',
    }),
    [Feat.BulkyFrame]: new FeatDefinition({
        key: Feat.BulkyFrame,
        name: 'Bulky Frame',
        type: FeatType.Major,
        sources: [ClassRole.Tank],
        level: 2,
        description: 'You have a `+6` [[Circumstance Modifier | CM]] to your [[Stance]] Checks to resist opponents of your size or larger attempting to [[Pass Through]] you.',
    }),
    [Feat.ToughSkin]: new FeatDefinition({
        key: Feat.ToughSkin,
        name: 'Tough Skin',
        type: FeatType.Major,
        sources: [ClassRole.Tank],
        level: 2,
        description: 'You can use your [[CON]] modifier instead of [[Body]] for Basic Body Defenses against **Melee Attacks**.',
    }),
    [Feat.GreaterCoverUp]: new FeatDefinition({
        key: Feat.GreaterCoverUp,
        name: 'Greater Cover-Up',
        type: FeatType.Major,
        sources: [ClassRole.Tank],
        level: 4,
        description: 'When a creature performs a **Ranged Attack** involving firing a projectile at a target other than you, you can pay 1 [[Action_Points | AP]] to react by jumping (at most `1 Hex`) onto the path of the incoming projectile. The original target gains [[Cover_Greater | Greater Cover]] against the attack, but if it misses by no more than -1 Shifts, you are hit instead.',
    }),
    [Feat.StoutMetabolism]: new FeatDefinition({
        key: Feat.StoutMetabolism,
        name: 'Stout Metabolism',
        type: FeatType.Minor,
        sources: [ClassRole.Tank],
        level: 5,
        description: 'You can go upwards of a week without eating before suffering any significant ill effects.',
    }),
    // Martial
    [Feat.ExertAuthority]: new FeatDefinition({
        key: Feat.ExertAuthority,
        name: 'Exert Authority',
        type: FeatType.Core,
        sources: [ClassFlavor.Martial],
        level: 1,
        description: 'Spend 1 [[Action_Points | AP]] and 1 [[Spirit_Points | SP]] to authoritatively command a creature that can see and hear you clearly to perform a specific 1 [[Action_Points | AP]] action of your choice. If the creature wishes to follow your command, they can perform the action immediately without spending the [[Action_Points | AP]].',
    }),
    [Feat.DistributedShifts]: new FeatDefinition({
        key: Feat.DistributedShifts,
        name: 'Distributed Shifts',
        type: FeatType.Major,
        sources: [ClassFlavor.Martial],
        level: 2,
        description: 'When you would inflict additional damage through a **Basic Melee Strike** to an enemy via **Crit Shifts**, you can instead attempt to distribute that additional Shift damage to any other adjacent creatures that would have been valid targets for this attack; they have to resist as if they were the target of the attack, but **Shifts** are not considered for this second roll.',
    }),
    [Feat.WeaponHoning]: new FeatDefinition({
        key: Feat.WeaponHoning,
        name: 'Weapon Honing',
        type: FeatType.Minor,
        sources: [ClassFlavor.Martial],
        level: 3,
        description: 'You can spend an hour and 1 [[Spirit_Points | SP]] to hone and carefully refine your weapon to your personal style, preferences and needs, creating a unique connection between you and it. This connection will last until the end of the day, as it fades away in your memory, but while it lasts, the weapon will concede an additional `+1` Equipment Modifier bonus to your [[Strike]] actions. You can do this as a downtime activity during a [[Long Rest]].',
    }),
    [Feat.OpportuneRetaliation]: new FeatDefinition({
        key: Feat.OpportuneRetaliation,
        name: 'Opportune Retaliation',
        type: FeatType.Major,
        sources: [ClassFlavor.Martial],
        level: 4,
        description: `Whenever a creature misses a **Melee Basic Attack** against you, you can spend 1 [[Focus_Points | FP]] to perform the [[Opportunity_Attack | Opportunity Attack]] reaction against them; you still pay the [[Action_Points | AP]] (and any other) cost.

For example, if you choose a [[Strike]] as your reaction, you will pay 2 [[Action_Points | AP]] and 1 [[Focus_Points | FP]] in total.`,
    }),
    [Feat.KnowThyEnemy]: new FeatDefinition({
        key: Feat.KnowThyEnemy,
        name: 'Know Thy Enemy',
        type: FeatType.Minor,
        sources: [ClassFlavor.Martial],
        level: 5,
        description: `You can roll an [[Intuition]] Check to inspect a creature you can see clearly for a couple minutes in order to asses their approximate threat or power level; some notion of their combat capabilities; or other noticeable tactical or military information. You can ask for specific details (to the DM's discretion), or just seek for a general impression.`,
    }),
    // Survivalist
    [Feat.Rage]: new FeatDefinition({
        key: Feat.Rage,
        name: 'Rage',
        type: FeatType.Core,
        sources: [ClassFlavor.Survivalist],
        level: 1,
        description: 'You can spend 1 [[Action_Points | AP]] and 1 [[Spirit_Points | SP]] to become **Enraged**: reduce your [[Focus_Points | Focus Points]] to `1`, and it cannot be further reduced while you are **Enraged**; you cannot [[Concentrate]] while **Enraged**; and you gain a [[Circumstance Modifier | CM]] to your **Body Attacks** while **Enraged** that starts with `+6` and is reduced by `1` each time it is used. When the bonus reaches `0`, or you fail to perform at least on **Basic Attack** in your turn, you are no longer **Enraged**.',
    }),
    [Feat.InstinctiveTracking]: new FeatDefinition({
        key: Feat.InstinctiveTracking,
        name: 'Instinctive Tracking',
        type: FeatType.Minor,
        sources: [ClassFlavor.Survivalist, ClassFlavor.Naturalist],
        level: 2,
        description: 'You get a `+3` [[Circumstance Modifier | CM]] to Checks you make related to tracking creatures (following footprints, etc), and you can spend 1 [[Focus_Points | FP]] to gain an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).',
    }),
    [Feat.DisregardCover]: new FeatDefinition({
        key: Feat.DisregardCover,
        name: 'Disregard Cover',
        type: FeatType.Major,
        sources: [ClassFlavor.Survivalist],
        level: 2,
        description: 'You can consider **Passive Cover** for your **Ranged Attacks** to be of one degree less than it would otherwise be.',
    }),
    [Feat.Potioneer]: new FeatDefinition({
        key: Feat.Potioneer,
        name: 'Potioneer',
        type: FeatType.Minor,
        sources: [ClassFlavor.Survivalist, ClassFlavor.Naturalist, ClassFlavor.Devout],
        level: 3,
        description: 'You can spend a few hours to forage for ingredients on the appropriate environment with an [[Intuition]] Check. You can also spend a few hours and 1 [[Spirit_Points | SP]] to brew a salve that can be used to heal an amount of points (determined by a [[Knowledge]] Check) of either [[Vitality_Points | VP]], [[Focus_Points | FP]] or [[Spirit_Points | SP]] (your choice). The salve will lose potency and expire after a few days.',
    }),
    [Feat.ControlledRage]: new FeatDefinition({
        key: Feat.ControlledRage,
        name: 'Controlled Rage',
        type: FeatType.Major,
        sources: [ClassFlavor.Survivalist],
        level: 4,
        description: `When using the [[Rage]] action, you can spend additional [[Spirit_Points | SPs]] to keep more of your [[Focus_Points | FP]]: for each additional [[Spirit_Points | SP]] you spend, you can keep an additional [[Focus_Points | FP]].

			For example, you can spend 1 [[Action_Points | AP]] and 3 [[Spirit_Points | SP]] in total to become **Enraged** while keeping 3 [[Focus_Points | FP]].`,
    }),
    // Scoundrel
    [Feat.FancyFootwork]: new FeatDefinition({
        key: Feat.FancyFootwork,
        name: 'Fancy Footwork',
        type: FeatType.Core,
        sources: [ClassFlavor.Scoundrel],
        level: 1,
        description: 'If you make a **Melee Basic Attack** against a target, you do not provoke [[Opportunity_Attack | Opportunity Attacks]] from that target until the end of the turn.',
    }),
    [Feat.ThievesFingers]: new FeatDefinition({
        key: Feat.ThievesFingers,
        name: 'Thieves Fingers',
        type: FeatType.Minor,
        sources: [ClassFlavor.Scoundrel],
        level: 2,
        description: 'You get a `+3` [[Circumstance Modifier | CM]] to any Checks you perform associated with lock picking or trap disarming. You can spend 1 [[Focus_Points | FP]] to get an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).',
    }),
    [Feat.Leverage]: new FeatDefinition({
        key: Feat.Leverage,
        name: 'Leverage',
        type: FeatType.Major,
        sources: [ClassFlavor.Scoundrel],
        level: 2,
        description: `If you would inflict additional damage through a **Basic Strike** to an enemy via **Crit Shifts**, you can instead spend any number of [[Spirit_Points | SP]] (up to your level) to inflict that many additional [[Vitality_Points | VP]] of damage.

			For example, if you get 2 **Shifts** for an attack (normal damage of 3), you can spend 2 [[Spirit_Points | SP]] to inflict 2 additional [[Vitality_Points | VP]] of damage (total damage of 5).`,
    }),
    [Feat.BeginnersLuck]: new FeatDefinition({
        key: Feat.BeginnersLuck,
        name: 'Beginners Luck',
        type: FeatType.Minor,
        sources: [ClassFlavor.Scoundrel],
        level: 3,
        description: 'You can use a [[Spirit_Points | SP]] (instead of a [[Heroism_Points | Heroism Point]]) to pay for a [[Luck_Die | Luck Die]] for a Check of a Skill you do not have any points invested in.',
    }),
    // Caster
    [Feat.ArcaneCasting]: new FeatDefinition({
        key: Feat.ArcaneCasting,
        name: 'Arcane Casting',
        type: FeatType.Core,
        sources: [ClassRealm.Caster],
        level: 1,
        description: 'Unlocks Arcane Casting. See [Rules: Arcane](/rules/arcane) for details on how the **Arcane** magic system works.',
        parameter: {
            id: 'stat',
            name: 'Stat',
            exact: true,
            values: StatType.mindAttributes,
        },
    }),
    // Arcanist
    [Feat.SignatureSpell]: new FeatDefinition({
        key: Feat.SignatureSpell,
        name: 'Signature Spell',
        type: FeatType.Core,
        sources: [ClassFlavor.Arcanist],
        level: 1,
        description: 'You have fully committed all the details of a specific form of the Fundamental Arcane Spell (such as from the [[Predefined_Arcane_Spells | Predefined Spells]] list); you have a `+3` to cast that exact spell.',
        fullDescription: info => {
            return `You have fully committed all the details of **${info.parameter}**; you have a \`+3\` to cast that exact spell without any additional augmentations.`;
        },
        parameter: {
            id: 'spell',
            name: 'Spell',
            exact: false,
            independentlyChosen: true,
            values: Object.values(PredefinedArcaneSpell),
        },
    }),
    [Feat.ReactiveCasting]: new FeatDefinition({
        key: Feat.ReactiveCasting,
        name: 'Reactive Casting',
        type: FeatType.Major,
        sources: [ClassFlavor.Arcanist],
        level: 2,
        description: 'You can spend 1 [[Heroism Points | Heroism Point]] to cast a standard 2 [[Action_Points | AP]] / 1 [[Focus_Points | FP]] spell as a reaction.',
    }),
    [Feat.CantripCasting]: new FeatDefinition({
        key: Feat.CantripCasting,
        name: 'Cantrip Casting',
        type: FeatType.Minor,
        sources: [ClassFlavor.Arcanist],
        level: 3,
        description: 'When not in the pressure of an **Encounter**, you can spend a few minutes to cast a standard 2 [[Action_Points | AP]] / 1 [[Focus_Points | FP]] spell without spending a [[Focus Point]].',
    }),
    // Mechanist
    [Feat.ToolAssistedCasting]: new FeatDefinition({
        key: Feat.ToolAssistedCasting,
        name: 'Tool-Assisted Casting',
        type: FeatType.Core,
        sources: [ClassFlavor.Mechanist],
        level: 1,
        description: 'You can create and use **One-Handed** (`+2`) and **Two-Handed** (`+3`) tools, crazy mechanical contraptions to assist you with the execution of **Somatic Spell Components**. You can use these tools to execute a **Somatic Component** of any spell, but you cannot use any other type of **Spell Component**.',
    }),
    [Feat.MechanisticAffinity]: new FeatDefinition({
        key: Feat.MechanisticAffinity,
        name: 'Mechanistic Affinity',
        type: FeatType.Major,
        sources: [ClassFlavor.Mechanist],
        level: 2,
        description: 'You can spend a few hours and 1+ [[Focus_Points | FP]] to attempt to concoct a mechanical contraption to achieve any specific simple goal (use a Check of your primary attribute). Think gears, belts, pulleys, etc in a small pocket sized creation. As an example, you could craft a music box, a clock, a small mechanical hinge to open a door. The DM will adjudicate the complexity and feasibility of the project.',
    }),
    [Feat.EyeForContraptions]: new FeatDefinition({
        key: Feat.EyeForContraptions,
        name: 'Eye for Contraptions',
        type: FeatType.Minor,
        sources: [ClassFlavor.Mechanist],
        level: 3,
        description: 'You are particularly good at analyzing and assessing the functionality of mechanical contraptions, such as mechanical devices, locks, and traps. You have a `+3` [[Circumstance Modifier | CM]] to [[IQ]] Checks to discern information from such contraptions, and can spend `1` [[Focus_Points | FP]] to get an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).',
    }),
    // Naturalist
    [Feat.FocalConnection]: new FeatDefinition({
        key: Feat.FocalConnection,
        name: 'Focal Connection',
        type: FeatType.Core,
        sources: [ClassFlavor.Naturalist],
        level: 1,
        description: 'You can create and use a personal **Custom Focus** (`+4`) that is bound to you. You can use this **Custom Focus** to execute the **Focal Component** of any spell, but you cannot use any other type of **Spell Component**.',
    }),
    [Feat.NaturalAffinity]: new FeatDefinition({
        key: Feat.NaturalAffinity,
        name: 'Natural Affinity',
        type: FeatType.Major,
        sources: [ClassFlavor.Naturalist],
        level: 2,
        description: 'You can use [[Command]] Spells with a `+3` [[Circumstance Modifier | CM]] to control plants, encouraging super-accelerated growth, redirection, flowers to blooms, etc. The difficult and augmentations are similar to the [[Guide Animal]] spell.',
    }),
    // Musicist
    [Feat.LyricResonance]: new FeatDefinition({
        key: Feat.LyricResonance,
        name: 'Lyric Resonance',
        type: FeatType.Core,
        sources: [ClassFlavor.Musicist],
        level: 1,
        description: 'You can use **One-Handed** (`+2`) and **Two-Handed** (`+3`) instruments to assist you with the execution of **Verbal Spell Components**. You can use these instruments to execute a **Verbal Component** of any spell, but you cannot use any other type of **Spell Component**.',
    }),
    [Feat.InspiringPerformance]: new FeatDefinition({
        key: Feat.InspiringPerformance,
        name: 'Inspiring Performance',
        type: FeatType.Major,
        sources: [ClassFlavor.Musicist],
        level: 2,
        description: 'As a reaction to an ally that can hear you performing an action, you can spend 1 [[Action_Points | AP]] and 1 [[Spirit_Points | SP]] to give them a +1 [[Circumstance Modifier | CM]] to a Check associated with their action. You can only do this once per action, the action must not be a reaction, and you cannot do this to yourself.',
    }),
    [Feat.TheresMoreToThisSong]: new FeatDefinition({
        key: Feat.TheresMoreToThisSong,
        name: "There's More to This Song",
        type: FeatType.Minor,
        sources: [ClassFlavor.Musicist],
        level: 3,
        description: 'You can attempt to hide a message in a song you are singing, only to be perceived by certain listeners. Roll a [[Speechcraft]] Check with `+6` [[Circumstance Modifier | CM]]; all listeners then contest with an [[IQ]] Check. The targets you wanted to understand get a `+3` [[Circumstance Modifier | CM]] to their Check, or a `+6` if they are aware that you are trying to hide a message.',
    }),
    // Erudite
    [Feat.OtherworldlyFocus]: new FeatDefinition({
        key: Feat.OtherworldlyFocus,
        name: 'Otherworldly Focus',
        type: FeatType.Major,
        sources: [ClassRole.Erudite],
        level: 2,
        description: 'Whenever you would spend [[Spirit_Points | SP]] to activate a wand or stave, you can spend [[Focus_Points | FP]] instead (the action still has the [[Channel]] trait).',
    }),
    [Feat.CognitiveResilience]: new FeatDefinition({
        key: Feat.CognitiveResilience,
        name: 'Cognitive Resilience',
        type: FeatType.Major,
        sources: [ClassRole.Erudite],
        level: 2,
        description: 'Whenever you become [[Distracted]] while you are concentrating, you can spend 1 [[Focus_Points | FP]] to avoid losing your concentration. You still become [[Distracted]], which affects any future actions.',
    }),
    [Feat.IReadAboutThat]: new FeatDefinition({
        key: Feat.IReadAboutThat,
        name: 'I Read About That',
        type: FeatType.Minor,
        sources: [ClassRole.Erudite],
        level: 3,
        description: 'While researching within a significant body of text (such as libraries), you can roll [[Knowledge]] instead of [[Serendipity]] when using the [[Write History]] action to establish that a specific answer can be encountered.',
    }),
    // Intuitive
    [Feat.IntuitiveBlasting]: new FeatDefinition({
        key: Feat.IntuitiveBlasting,
        name: 'Intuitive Blasting',
        type: FeatType.Major,
        sources: [ClassRole.Intuitive],
        level: 2,
        description: '"Blasting" is just second nature to you. Whenever you use a 2 [[Action_Points | AP]]/1 [[Focus_Points | FP]] **Fundamental Arcane Spell** of any school without any augmentations with the intent of dealing damage to a single target, you don\'t need to spend the 1 [[Focus_Points | FP]] cost if you succeed.',
    }),
    // Innate
    [Feat.InnateEmpathy]: new FeatDefinition({
        key: Feat.InnateEmpathy,
        name: 'Innate Empathy',
        type: FeatType.Major,
        sources: [ClassRole.Innate],
        level: 2,
        description: 'Whenever rolling your [[CHA]] Check for Arcane Spellcasting using **Being** as the noun ([[Transfiguration]] or [[Command]]), targeting a single creature you can clearly see, you get a `+2` [[Circumstance Modifier | CM]]. If you are acquainted with the **Being** in question (i.e. spent several days with them), you get a `+3` [[Circumstance Modifier | CM]] instead.',
    }),
    //Disciple
    [Feat.DivineChanneling]: new FeatDefinition({
        key: Feat.DivineChanneling,
        name: 'Divine Channeling',
        type: FeatType.Core,
        sources: [ClassRole.Disciple],
        level: 1,
        description: 'Unlocks Divine Channeling. See [Rules: Divine](/rules/divine) for details on how the **Divine** magic system works.',
    }),
    [Feat.SacredCalm]: new FeatDefinition({
        key: Feat.SacredCalm,
        name: 'Sacred Calm',
        type: FeatType.Major,
        sources: [ClassRole.Disciple],
        level: 2,
        description: 'You can perform the [[Calm]] action on an ally that you can touch. You can spend an additional 1 [[Focus_Points | FP]] to get a `+6` [[Circumstance Modifier | CM]] when performing the [[Calm]] action.',
    }),
    [Feat.FocusedReach]: new FeatDefinition({
        key: Feat.FocusedReach,
        name: 'Focused Reach',
        type: FeatType.Major,
        sources: [ClassRole.Disciple],
        level: 2,
        description: 'You can spend 1 [[Action_Points | AP]] and 1 [[Focus_Points | FP]] to double your [[Influence Range]] until the start of your next turn.',
    }),
    [Feat.ReligiousRites]: new FeatDefinition({
        key: Feat.ReligiousRites,
        name: 'Religious Rites',
        type: FeatType.Minor,
        sources: [ClassRole.Disciple],
        level: 3,
        description: 'You are particularly knowledgeable about the specific rites, rituals, the nature of your contract, or whatever are the details of your connection with your Protean. You get a `+3` to [[Knowledge]] Checks related to these topics, and can spend `1` [[Focus_Points | FP]] to get an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).',
    }),
    [Feat.DivineInspiration]: new FeatDefinition({
        key: Feat.DivineInspiration,
        name: 'Divine Inspiration',
        type: FeatType.Major,
        sources: [ClassRole.Disciple],
        level: 4,
        description: 'You can roll [[Devotion]] instead of [[Empathy]] when using the [[Inspire]] action; additionally, you can spend 1 [[Focus_Points | FP]] to gain a +3 [[Circumstance Modifier | CM]] to the Check.',
    }),
    //Adept
    [Feat.FlurryOfBlows]: new FeatDefinition({
        key: Feat.FlurryOfBlows,
        name: 'Flurry of Blows',
        type: FeatType.Core,
        sources: [ClassRole.Adept],
        level: 1,
        description: 'You can spend 1 [[Spirit_Points | SP]] to make an unarmed [[Strike]] cost only 1 [[Action_Points | AP]].',
    }),
    [Feat.ChannelingFists]: new FeatDefinition({
        key: Feat.ChannelingFists,
        name: 'Channeling Fists',
        type: FeatType.Major,
        sources: [ClassRole.Adept],
        level: 2,
        description: `You can spend 1 [[Spirit_Points | SP]] to get a +1 [[Circumstance Modifier | CM]] to an unarmed Attack Check. You _can_ stack this effect on the same attack.`,
    }),
    [Feat.CallousFists]: new FeatDefinition({
        key: Feat.CallousFists,
        name: 'Callous Fists',
        type: FeatType.Minor,
        sources: [ClassRole.Adept],
        level: 1,
        description: 'You can use [[CON]] instead of [[STR]] to perform unarmed attacks.',
    }),
    [Feat.SpiritToFlesh]: new FeatDefinition({
        key: Feat.SpiritToFlesh,
        name: 'Spirit to Flesh',
        type: FeatType.Minor,
        sources: [ClassRole.Adept],
        level: 3,
        description: 'You can resist the effects of **Transfiguration** spells against your body using your [[FOW]] instead of [[Toughness]].',
    }),
    // Inspired
    [Feat.BountifulLuck]: new FeatDefinition({
        key: Feat.BountifulLuck,
        name: 'Bountiful Luck',
        type: FeatType.Core,
        sources: [ClassRole.Inspired],
        level: 1,
        description: 'You can spend [[Spirit_Points | SP]] instead of [[Heroism_Points | Heroism Points]] to use the [[Karmic_Resistance | Karmic Resistance]], [[Write_History | Write History]] and [[Luck_Die | Luck Die]] actions.',
    }),
    [Feat.LuckyRelentlessness]: new FeatDefinition({
        key: Feat.LuckyRelentlessness,
        name: 'Lucky Relentlessness',
        type: FeatType.Minor,
        sources: [ClassRole.Inspired],
        level: 3,
        description: 'Your DC for the [[Heroic_Relentlessness | Heroic Relentlessness]] action is `10`.',
    }),
    [Feat.FavorableMovement]: new FeatDefinition({
        key: Feat.FavorableMovement,
        name: 'Favorable Movement',
        type: FeatType.Major,
        sources: [ClassRole.Inspired],
        level: 2,
        description: 'You can spend 1 [[Focus_Points | FP]] as you take a **Movement Action** to ignore **Difficult Terrain** for this movement.',
    }),
    // Devout
    [Feat.LesserDivineChanneling]: new FeatDefinition({
        key: Feat.LesserDivineChanneling,
        name: 'Lesser Divine Channeling',
        type: FeatType.Major,
        sources: [ClassFlavor.Devout],
        level: 2,
        description: 'Unlocks **Divine Channeling** for non-Adepts; this probably represent a much more indirect connection to some higher (possibly unknown) force. See [Rules: Divine](/rules/divine) for details on how the **Divine** magic system works.',
    }),
    [Feat.EffortlessAttuning]: new FeatDefinition({
        key: Feat.EffortlessAttuning,
        name: 'Effortless Attuning',
        type: FeatType.Core,
        sources: [ClassFlavor.Devout],
        level: 1,
        description: 'Whenever you would spend [[Spirit_Points | Spirit Points]] to use an **Imbued Item** that would otherwise not require an [[Attunement]] Check, you can make an [[Attunement]] Check (DC 15) to spend one (plus any **Shifts**) less [[Spirit_Points | SP]] (min 0).',
    }),
    [Feat.FocusedChanneling]: new FeatDefinition({
        key: Feat.FocusedChanneling,
        name: 'Focused Channeling',
        type: FeatType.Major,
        sources: [ClassFlavor.Devout],
        level: 2,
        description: "You can spend 1 [[Focus_Points | FP]] (and add the [[Concentrate]] trait, if it didn't have it already) when doing an action with the [[Channel]] trait to get a +3 [[Circumstance Modifier | CM]].",
    }),
    [Feat.PiousModesty]: new FeatDefinition({
        key: Feat.PiousModesty,
        name: 'Pious Modesty',
        type: FeatType.Major,
        sources: [ClassFlavor.Devout],
        level: 4,
        description: 'You gain a +6 [[Circumstance Modifier | CM]] to [[Resolve]] contested checks resisting the [[Demoralize]] or other actions attempting to cause the [[Distraught]] condition by targeting your self-esteem.',
    }),
    [Feat.FervorousDevotion]: new FeatDefinition({
        key: Feat.FervorousDevotion,
        name: 'Fervorous Devotion',
        type: FeatType.Minor,
        sources: [ClassFlavor.Devout],
        level: 5,
        description: 'You can use your [[Devotion]] instead of [[Discipline]] when resisting the temptation of your **Vices**.',
    }),
    // TODO: make this a Major feat after current adventure
    [Feat.PersonalizedBlessing]: new FeatDefinition({
        key: Feat.PersonalizedBlessing,
        name: 'Personalized Blessing',
        type: FeatType.Minor,
        sources: [ClassFlavor.Devout],
        level: 5,
        description: 'When [Divine Channeling](/rules/divine) with the intent of [[Blessed | blessing]] others, you can pay 1 [[Focus_Points | FP]] to include a personalized inspirational speech related to the targets; while their are [[Blessed]] by you, they can choose a **Skill** of your choice (related to your speech) other than [[Fortune]] for their free [[Luck Die]].',
    }),
    // Mixed - WIP
    // Crusader
    [Feat.DivineSmite]: new FeatDefinition({
        key: Feat.DivineSmite,
        name: 'Divine Smite',
        type: FeatType.Core,
        sources: [ClassFlavor.Crusader],
        level: 1,
        description: 'You can spend 2 [[Spirit_Points | SP]] when striking with a weapon to get a `+3` [[Circumstance Modifier | CM]] as you channel raw power into it, making it acquire a distinct glow as you lift it to strike. The attack gains the [[Channel]] trait.',
    }),
    [Feat.SpiritualArmor]: new FeatDefinition({
        key: Feat.SpiritualArmor,
        name: 'Spiritual Armor',
        type: FeatType.Major,
        sources: [ClassFlavor.Crusader],
        level: 2,
        description: 'You can roll the [[Shrug_Off | Shrug Off]] action using your **Primary Attribute** instead of [[Toughness]].',
    }),
    [Feat.MoralAuthority]: new FeatDefinition({
        key: Feat.MoralAuthority,
        name: 'Moral Authority',
        type: FeatType.Minor,
        sources: [ClassFlavor.Crusader],
        level: 3,
        description: "If you witness someone performing an action that directly contradicts your (or your Protean's) **Tenets**, you get a `+3` to any [[CHA]]-based Checks attempting to stop or dissuade this behavior (such as intimidation, persuasion, deception, etc), and can spend `1` [[Focus_Points | FP]] to get an additional `+3` [[Circumstance Modifier | CM]] (must be decided before rolling).",
    }),
};
export class FeatSlot {
    level;
    type;
    order;
    constructor({ level, type, order = 0 }) {
        this.level = level;
        this.type = type;
        this.order = order;
    }
    get name() {
        return `Level ${this.level} ${this.type} Feat Slot${this.order > 0 ? ` (Specialized Training)` : ''}`;
    }
    get isExtra() {
        return this.order > 0;
    }
    toProp() {
        return `feat.${this.level}.${this.type}.${this.order}`;
    }
    static fromProp(prop) {
        const match = prop.match(/^feat\.(\d+)\.(\w+)(?:\.(\d+))?$/);
        if (!match) {
            throw new Error(`Invalid feat slot property: ${prop}`);
        }
        const level = parseInt(match[1], 10);
        const type = match[2];
        const order = parseInt(match[3], 10);
        return new FeatSlot({ level, type, order });
    }
    static generateSlots({ maxLevel, hasSpecializedTraining, }) {
        const slots = [];
        for (let level = 1; level <= maxLevel; level++) {
            slots.push(new FeatSlot({
                level: level,
                type: level % 2 === 1 ? FeatType.Minor : FeatType.Major,
            }));
            if (level === 1 && hasSpecializedTraining) {
                slots.push(new FeatSlot({
                    level: 1,
                    type: FeatType.Minor,
                    order: 1,
                }), new FeatSlot({
                    level: 1,
                    type: FeatType.Minor,
                    order: 2,
                }));
            }
        }
        return slots;
    }
}
//# sourceMappingURL=feats.js.map