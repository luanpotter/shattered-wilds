import { DerivedStatType } from './derived-stat.js';
import { StatTree } from './stat-tree.js';
import { StatType } from './stat-type.js';

export interface FormulaResult {
	value: number;
	tooltip: string;
}

export class Formula {
	factors: FormulaFactor[];

	constructor(factors: FormulaFactor[]) {
		this.factors = factors;
	}

	compute(statTree: StatTree): FormulaResult {
		const results = this.factors.map(factor => factor.compute(statTree));
		const value = results.reduce((acc, result) => acc + result.value, 0);
		const tooltip = `${value} = ` + results.map(result => result.tooltip).join(' + ');
		return { value, tooltip };
	}

	add(other: Formula): Formula {
		return new Formula([...this.factors, ...other.factors]);
	}
}

export class F {
	static constant(value: number): Formula {
		return new Formula([new SimpleFormulaFactor({ coefficient: value })]);
	}

	static variable(coefficient: number, variable: StatType | DerivedStatType, round?: RoundMode | undefined): Formula {
		return new Formula([new SimpleFormulaFactor({ coefficient, variable, round })]);
	}

	static level(): Formula {
		return new Formula([new LevelFormulaFactor()]);
	}
}

export enum RoundMode {
	ceil = 'ceil',
	floor = 'floor',
	round = 'round',
}

export interface FormulaFactor {
	compute(statTree: StatTree): FormulaResult;
}

/**
 * Some formulas might require the actual Level value of a character (rather than their level modifier which is
 * already built into the rest of the stat tree). Level is the _only_ stat whose raw point value might be used in for
 * anything.
 */
export class LevelFormulaFactor implements FormulaFactor {
	compute(statTree: StatTree): FormulaResult {
		const level = statTree.level;
		return { value: level, tooltip: `Level: ${level}` };
	}
}

export class SimpleFormulaFactor implements FormulaFactor {
	coefficient: number;
	variable: StatType | DerivedStatType | undefined;
	round: RoundMode | undefined;

	constructor({
		coefficient,
		variable,
		round,
	}: {
		coefficient?: number;
		variable?: StatType | DerivedStatType | undefined;
		round?: RoundMode | undefined;
	}) {
		this.coefficient = coefficient ?? 1;
		this.variable = variable;
		this.round = round ?? undefined;
	}

	compute(statTree: StatTree): FormulaResult {
		const value = this.computeValue(statTree);
		const tooltip = this.computeTooltip(value);
		return { value, tooltip };
	}

	private computeValue(statTree: StatTree): number {
		const variableValue = this.variable ? statTree.valueOf(this.variable).value : 1;
		const value = this.coefficient * variableValue;
		if (this.round) {
			return Math[this.round](value);
		}
		return value;
	}

	private computeTooltip(value: number): string {
		const roundText = this.round ? ` (${this.round})` : '';
		if (!this.variable) {
			return `${this.coefficient}`;
		}
		const coefficientText = this.coefficient === 1 ? '' : `${this.coefficient} × `;
		return `${coefficientText}${this.variable}${roundText} [${value}]`;
	}
}
