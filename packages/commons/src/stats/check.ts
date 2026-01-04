import { CircumstanceModifier, StatModifier } from './stat-tree.js';
import { StatType } from './stat-type.js';
import { Bonus } from './value.js';

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
	descriptor: string;
	statModifier: StatModifier;

	constructor({
		mode,
		descriptor,
		nature,
		statModifier,
	}: {
		mode: CheckMode;
		descriptor: string;
		nature: CheckNature;
		statModifier: StatModifier;
	}) {
		this.mode = mode;
		this.nature = nature;
		this.descriptor = descriptor;
		this.statModifier = statModifier;
	}

	get type(): CheckType {
		return `${this.mode}-${this.nature}`;
	}

	get modifierValue(): Bonus {
		return this.statModifier.value;
	}

	get name(): string {
		if (this.statModifier.statType instanceof StatType) {
			return this.statModifier.statType.name;
		}
		return this.statModifier.statType;
	}

	// NOTE: we typically try to build the check with all the parameters it needs at once,
	// but these withX methods are used for "last mile" adjustments (e.g., on the Dice Roll dialog itself)
	withAdditionalCM(cm: CircumstanceModifier): Check {
		const newStatModifier = this.statModifier.withAdditionalCM(cm);
		return new Check({
			mode: this.mode,
			nature: this.nature,
			descriptor: this.descriptor,
			statModifier: newStatModifier,
		});
	}

	withType(type: CheckType): Check {
		const [mode, nature] = type.split('-') as [CheckMode, CheckNature];
		return new Check({
			mode,
			nature,
			descriptor: this.descriptor,
			statModifier: this.statModifier,
		});
	}

	static fromJSON(data: {
		mode: CheckMode;
		nature: CheckNature;
		descriptor: string;
		statModifier: Parameters<typeof StatModifier.fromJSON>[0];
	}): Check {
		if (data instanceof Check) return data;
		return new Check({
			mode: data.mode,
			nature: data.nature,
			descriptor: data.descriptor,
			statModifier: StatModifier.fromJSON(data.statModifier),
		});
	}
}
