import { Bonus } from '../stats/value.js';
export declare enum Consequence {
    Exhaustion = "Exhaustion",
    Poisoned = "Poisoned",
    Death = "Death"
}
export declare class ConsequenceDefinition {
    name: Consequence;
    ranked: boolean;
    description: string;
    descriptionForRank: ((rank: number) => string) | undefined;
    constructor({ name, ranked, description, descriptionForRank, }: {
        name: Consequence;
        ranked: boolean;
        description: string;
        descriptionForRank?: ((rank: number) => string) | undefined;
    });
}
export type ExhaustionData = {
    rank: number;
    bonus: Bonus;
    cmText: string;
};
export declare const Exhaustion: {
    fromRank: (rank: number) => ExhaustionData;
};
export declare const CONSEQUENCES: Record<Consequence, ConsequenceDefinition>;
//# sourceMappingURL=consequences.d.ts.map