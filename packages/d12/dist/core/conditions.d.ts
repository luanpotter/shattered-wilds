export declare enum Condition {
    Blessed = "Blessed",
    Blinded = "Blinded",
    Distracted = "Distracted",
    Distraught = "Distraught",
    Frightened = "Frightened",
    Immobilized = "Immobilized",
    Incapacitated = "Incapacitated",
    OffGuard = "Off Guard",
    Prone = "Prone",
    Silenced = "Silenced",
    Unconscious = "Unconscious"
}
export declare class ConditionDefinition {
    name: Condition;
    ranked: boolean;
    description: string;
    constructor({ name, ranked, description }: {
        name: Condition;
        ranked: boolean;
        description: string;
    });
}
export declare const CONDITIONS: Record<Condition, ConditionDefinition>;
//# sourceMappingURL=conditions.d.ts.map