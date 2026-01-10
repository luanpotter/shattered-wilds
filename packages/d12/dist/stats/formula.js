export class Formula {
    factors;
    constructor(factors) {
        this.factors = factors;
    }
    compute(statTree) {
        const results = this.factors.map(factor => factor.compute(statTree));
        const value = results.reduce((acc, result) => acc + result.value, 0);
        const tooltip = `${value} = ` + results.map(result => result.tooltip).join(' + ');
        return { value, tooltip };
    }
    add(other) {
        return new Formula([...this.factors, ...other.factors]);
    }
}
export class F {
    static constant(value) {
        return new Formula([new SimpleFormulaFactor({ coefficient: value })]);
    }
    static variable(coefficient, variable, round) {
        return new Formula([new SimpleFormulaFactor({ coefficient, variable, round })]);
    }
    static level() {
        return new Formula([new LevelFormulaFactor()]);
    }
}
export var RoundMode;
(function (RoundMode) {
    RoundMode["ceil"] = "ceil";
    RoundMode["floor"] = "floor";
    RoundMode["round"] = "round";
})(RoundMode || (RoundMode = {}));
/**
 * Some formulas might require the actual Level value of a character (rather than their level modifier which is
 * already built into the rest of the stat tree). Level is the _only_ stat whose raw point value might be used in for
 * anything.
 */
export class LevelFormulaFactor {
    compute(statTree) {
        const level = statTree.level;
        return { value: level, tooltip: `Level: ${level}` };
    }
}
export class SimpleFormulaFactor {
    coefficient;
    variable;
    round;
    constructor({ coefficient, variable, round, }) {
        this.coefficient = coefficient ?? 1;
        this.variable = variable;
        this.round = round ?? undefined;
    }
    compute(statTree) {
        const value = this.computeValue(statTree);
        const tooltip = this.computeTooltip(value);
        return { value, tooltip };
    }
    computeValue(statTree) {
        const variableValue = this.variable ? statTree.valueOf(this.variable).value : 1;
        const value = this.coefficient * variableValue;
        if (this.round) {
            return Math[this.round](value);
        }
        return value;
    }
    computeTooltip(value) {
        const roundText = this.round ? ` (${this.round})` : '';
        if (!this.variable) {
            return `${this.coefficient}`;
        }
        const coefficientText = this.coefficient === 1 ? '' : `${this.coefficient} × `;
        return `${coefficientText}${this.variable}${roundText} [${value}]`;
    }
}
//# sourceMappingURL=formula.js.map