import { AppliedCircumstance } from '../../character/circumstances.js';
import { CharacterSheet } from '../../character/character-sheet.js';
import { Condition } from '../../core/conditions.js';
import { Consequence } from '../../core/consequences.js';
import { Resource, ResourceValue } from '../../stats/resources.js';
export type CharacterCondition = {
    condition: Condition;
    rank: number;
};
export type CharacterConsequence = {
    consequence: Consequence;
    rank: number;
};
export declare class CircumstancesSection {
    resources: Record<Resource, ResourceValue>;
    conditions: CharacterCondition[];
    consequences: CharacterConsequence[];
    otherCircumstances: string[];
    constructor({ resources, conditions, consequences, otherCircumstances, }: {
        resources: Record<Resource, ResourceValue>;
        conditions: CharacterCondition[];
        consequences: CharacterConsequence[];
        otherCircumstances: string[];
    });
    static create({ characterSheet }: {
        characterSheet: CharacterSheet;
    }): CircumstancesSection;
    static serializeConditions(conditions: AppliedCircumstance<Condition>[]): string;
    static serializeConsequences(consequences: AppliedCircumstance<Consequence>[]): string;
    static serializeOtherCircumstances(circumstances: string[]): string;
}
//# sourceMappingURL=circumstances-section.d.ts.map