import { F, Formula, FormulaResult, RoundMode } from './formula.js';
import { StatTree } from './stat-tree.js';
import { StatType } from './stat-type.js';

export enum DerivedStatType {
	Movement = 'Movement',
	Initiative = 'Initiative',
}

export class DerivedStat {
	name: DerivedStatType;
	description: string;
	formula: Formula;

	constructor({ name, description, formula }: { name: DerivedStatType; description: string; formula: Formula }) {
		this.name = name;
		this.description = description;
		this.formula = formula;
	}

	compute(statTree: StatTree): FormulaResult {
		return this.formula.compute(statTree);
	}
}

export const DERIVED_STATS: Record<DerivedStatType, DerivedStat> = {
	[DerivedStatType.Movement]: new DerivedStat({
		name: DerivedStatType.Movement,
		description: `The amount of hexes a character can move using a regular [[Stride]] action.

> Movement = [3 + floor([[Agility]] / 4)] hexes

This determines how many hexes a character can move in a single turn.

All movement forms can move at least 1 hex, regardless of the character's calculated movement speed.

Unused movement from the [[Stride]] action can be saved for later.`,
		formula: F.constant(3).add(F.variable(0.25, StatType.Agility, RoundMode.floor)),
	}),
	[DerivedStatType.Initiative]: new DerivedStat({
		name: DerivedStatType.Initiative,
		description: `Used to determine order in combat via an Initiative Check.

> Initiative = [[Awareness]] + [[Agility]]

The Initiative Check is a special type of [[Contested Check]] that is fully resisted. As a courtesy to the _Players_, ties are decided in their favor.`,
		formula: F.variable(1, StatType.Awareness).add(F.variable(1, StatType.Agility)),
	}),
};
