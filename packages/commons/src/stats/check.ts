import { StatModifier } from './stat-tree.js';

export enum CheckMode {
	Static = 'Static',
	Contested = 'Contested',
}

export enum CheckNature {
	Active = 'Active',
	Resisted = 'Resisted',
}

export type CheckType = `${CheckMode}-${CheckNature}`;

export const CHECK_TYPES = Object.values(CheckMode).flatMap(mode =>
	Object.values(CheckNature).map(nature => `${mode}-${nature}` as CheckType),
);

export class Check {
	mode: CheckMode;
	nature: CheckNature;
	statModifier: StatModifier;

	constructor({ mode, nature, statModifier }: { mode: CheckMode; nature: CheckNature; statModifier: StatModifier }) {
		this.mode = mode;
		this.nature = nature;
		this.statModifier = statModifier;
	}

	get type(): CheckType {
		return `${this.mode}-${this.nature}`;
	}

	get modifierValue(): number {
		return this.statModifier.value;
	}
}
