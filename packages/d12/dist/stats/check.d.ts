import { CircumstanceModifier, StatModifier } from './stat-tree.js';
import { Bonus } from './value.js';
export declare enum CheckMode {
    Static = "Static",
    Contested = "Contested"
}
export declare enum CheckNature {
    Active = "Active",
    Resisted = "Resisted"
}
export type CheckType = `${CheckMode}-${CheckNature}`;
export declare const CHECK_TYPES: ("Static-Active" | "Static-Resisted" | "Contested-Active" | "Contested-Resisted")[];
export declare class Check {
    mode: CheckMode;
    nature: CheckNature;
    descriptor: string;
    statModifier: StatModifier;
    constructor({ mode, descriptor, nature, statModifier, }: {
        mode: CheckMode;
        descriptor: string;
        nature: CheckNature;
        statModifier: StatModifier;
    });
    get type(): CheckType;
    get modifierValue(): Bonus;
    get name(): string;
    withAdditionalCM(cm: CircumstanceModifier): Check;
    withType(type: CheckType): Check;
    static fromJSON(data: {
        mode: CheckMode;
        nature: CheckNature;
        descriptor: string;
        statModifier: Parameters<typeof StatModifier.fromJSON>[0];
    }): Check;
}
//# sourceMappingURL=check.d.ts.map