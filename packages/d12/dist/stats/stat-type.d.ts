export declare enum StatHierarchy {
    Level = "Level",
    Realm = "Realm",
    Attribute = "Attribute",
    Skill = "Skill"
}
export declare const StatHierarchyProperties: {
    [key in StatHierarchy]: {
        baseMultiplier: number;
    };
};
export declare enum StatTypeName {
    Level = "Level",
    Body = "Body",
    Mind = "Mind",
    Soul = "Soul",
    STR = "STR",
    DEX = "DEX",
    CON = "CON",
    INT = "INT",
    WIS = "WIS",
    CHA = "CHA",
    LCK = "LCK",
    DIV = "DIV",
    FOW = "FOW",
    Muscles = "Muscles",
    Stance = "Stance",
    Lift = "Lift",
    Finesse = "Finesse",
    Evasiveness = "Evasiveness",
    Agility = "Agility",
    Toughness = "Toughness",
    Stamina = "Stamina",
    Resilience = "Resilience",
    IQ = "IQ",
    Knowledge = "Knowledge",
    Memory = "Memory",
    Perception = "Perception",
    Awareness = "Awareness",
    Intuition = "Intuition",
    Speechcraft = "Speechcraft",
    Presence = "Presence",
    Empathy = "Empathy",
    Devotion = "Devotion",
    Aura = "Aura",
    Attunement = "Attunement",
    Discipline = "Discipline",
    Tenacity = "Tenacity",
    Resolve = "Resolve",
    Fortune = "Fortune",
    Karma = "Karma",
    Serendipity = "Serendipity"
}
export declare class StatType {
    readonly hierarchy: StatHierarchy;
    readonly parent: StatType | undefined;
    readonly name: StatTypeName;
    readonly description: string;
    readonly longDescription: string | undefined;
    readonly exampleUsages: string[];
    private static build;
    static readonly Level: StatType;
    static readonly Body: StatType;
    static readonly Mind: StatType;
    static readonly Soul: StatType;
    static readonly STR: StatType;
    static readonly DEX: StatType;
    static readonly CON: StatType;
    static readonly INT: StatType;
    static readonly WIS: StatType;
    static readonly CHA: StatType;
    static readonly DIV: StatType;
    static readonly FOW: StatType;
    static readonly LCK: StatType;
    static readonly Muscles: StatType;
    static readonly Stance: StatType;
    static readonly Lift: StatType;
    static readonly Finesse: StatType;
    static readonly Evasiveness: StatType;
    static readonly Agility: StatType;
    static readonly Toughness: StatType;
    static readonly Stamina: StatType;
    static readonly Resilience: StatType;
    static readonly IQ: StatType;
    static readonly Knowledge: StatType;
    static readonly Memory: StatType;
    static readonly Perception: StatType;
    static readonly Awareness: StatType;
    static readonly Intuition: StatType;
    static readonly Speechcraft: StatType;
    static readonly Presence: StatType;
    static readonly Empathy: StatType;
    static readonly Devotion: StatType;
    static readonly Aura: StatType;
    static readonly Attunement: StatType;
    static readonly Discipline: StatType;
    static readonly Tenacity: StatType;
    static readonly Resolve: StatType;
    static readonly Fortune: StatType;
    static readonly Karma: StatType;
    static readonly Serendipity: StatType;
    private constructor();
    toString(): string;
    toJSON(): string;
    static readonly values: StatType[];
    static fromString(name: string | undefined, fallback: StatType): StatType;
    static fromName(name: StatTypeName): StatType;
    static childrenOf(stat: StatType): StatType[];
    static mindAttributes: StatTypeName[];
    static soulAttributes: StatTypeName[];
    static mindOrSoulAttributes: StatTypeName[];
    static get realms(): StatType[];
    static get attributes(): StatType[];
    static get skills(): StatType[];
}
//# sourceMappingURL=stat-type.d.ts.map