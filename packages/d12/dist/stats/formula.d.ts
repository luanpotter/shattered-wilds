import { DerivedStatType } from './derived-stat.js';
import { StatTree } from './stat-tree.js';
import { StatType } from './stat-type.js';
export interface FormulaResult {
    value: number;
    tooltip: string;
}
export declare class Formula {
    factors: FormulaFactor[];
    constructor(factors: FormulaFactor[]);
    compute(statTree: StatTree): FormulaResult;
    add(other: Formula): Formula;
}
export declare class F {
    static constant(value: number): Formula;
    static variable(coefficient: number, variable: StatType | DerivedStatType, round?: RoundMode | undefined): Formula;
    static level(): Formula;
}
export declare enum RoundMode {
    ceil = "ceil",
    floor = "floor",
    round = "round"
}
export interface FormulaFactor {
    compute(statTree: StatTree): FormulaResult;
}
/**
 * Some formulas might require the actual Level value of a character (rather than their level modifier which is
 * already built into the rest of the stat tree). Level is the _only_ stat whose raw point value might be used in for
 * anything.
 */
export declare class LevelFormulaFactor implements FormulaFactor {
    compute(statTree: StatTree): FormulaResult;
}
export declare class SimpleFormulaFactor implements FormulaFactor {
    coefficient: number;
    variable: StatType | DerivedStatType | undefined;
    round: RoundMode | undefined;
    constructor({ coefficient, variable, round, }: {
        coefficient?: number;
        variable?: StatType | DerivedStatType | undefined;
        round?: RoundMode | undefined;
    });
    compute(statTree: StatTree): FormulaResult;
    private computeValue;
    private computeTooltip;
}
//# sourceMappingURL=formula.d.ts.map