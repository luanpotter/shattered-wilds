import { Formula, FormulaResult } from './formula.js';
import { StatTree } from './stat-tree.js';
export declare enum DerivedStatType {
    Movement = "Movement",
    Initiative = "Initiative",
    InfluenceRange = "InfluenceRange"
}
export declare class DerivedStat {
    type: DerivedStatType;
    name: string;
    description: string;
    formula: Formula;
    constructor({ type, name, description, formula, }: {
        type: DerivedStatType;
        name: string;
        description: string;
        formula: Formula;
    });
    compute(statTree: StatTree): FormulaResult;
}
export declare const DERIVED_STATS: Record<DerivedStatType, DerivedStat>;
//# sourceMappingURL=derived-stat.d.ts.map