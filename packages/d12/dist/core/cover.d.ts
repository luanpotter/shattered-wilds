import { CircumstanceModifier } from '../stats/stat-tree.js';
import { Bonus } from '../stats/value.js';
export declare enum PassiveCoverType {
    None = "None",
    Lesser = "Lesser",
    Standard = "Standard",
    Greater = "Greater"
}
export declare class PassiveCoverDefinition {
    type: PassiveCoverType;
    examples: string;
    bonus: Bonus;
    constructor({ type, examples, bonus }: {
        type: PassiveCoverType;
        examples: string;
        bonus: Bonus;
    });
    get modifier(): CircumstanceModifier;
    get description(): string;
}
export declare const COVER_TYPES: Record<PassiveCoverType, PassiveCoverDefinition>;
//# sourceMappingURL=cover.d.ts.map