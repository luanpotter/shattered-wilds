import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { Bonus } from '../stats/value.js';

export enum PassiveCoverType {
	None = 'None',
	Lesser = 'Lesser',
	Standard = 'Standard',
	Greater = 'Greater',
}

export class PassiveCoverDefinition {
	type: PassiveCoverType;
	examples: string;
	bonus: Bonus;

	constructor({ type, examples, bonus }: { type: PassiveCoverType; examples: string; bonus: Bonus }) {
		this.type = type;
		this.examples = examples;
		this.bonus = bonus;
	}

	get modifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `Passive Cover (${this.type})`,
			value: this.bonus,
		});
	}

	get description(): string {
		return `Passive Cover - ${this.type} (${this.examples})`;
	}
}
