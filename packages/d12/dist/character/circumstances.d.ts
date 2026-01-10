import { Condition } from '../core/conditions.js';
import { Consequence } from '../core/consequences.js';
import { Resource, ResourceValue } from '../stats/resources.js';
import { StatModifier, StatTree } from '../stats/stat-tree.js';
export type AppliedCircumstance<T> = {
    name: T;
    rank: number;
};
export declare class Circumstances {
    currentResources: CurrentResources;
    conditions: AppliedCircumstance<Condition>[];
    consequences: AppliedCircumstance<Consequence>[];
    otherCircumstances: string[];
    constructor({ currentResources, conditions, consequences, otherCircumstances, }: {
        currentResources: CurrentResources;
        conditions: AppliedCircumstance<Condition>[];
        consequences: AppliedCircumstance<Consequence>[];
        otherCircumstances: string[];
    });
    applyCircumstanceModifiers(statModifier: StatModifier): StatModifier;
    static parse<T>(prop: string | undefined): AppliedCircumstance<T>[];
    static from(props: Record<string, string>): Circumstances;
}
export declare class CurrentResources {
    currentResources: Record<Resource, number>;
    constructor(currentResources: Record<Resource, number>);
    static MAX_VALUE: number;
    static from(props: Record<string, string>): CurrentResources;
    private getCurrentValue;
    get(statTree: StatTree, resource: Resource): ResourceValue;
}
//# sourceMappingURL=circumstances.d.ts.map