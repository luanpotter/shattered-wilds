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

export const COVER_TYPES: Record<PassiveCoverType, PassiveCoverDefinition> = {
	[PassiveCoverType.None]: new PassiveCoverDefinition({
		type: PassiveCoverType.None,
		examples: 'No obstruction.',
		bonus: Bonus.zero(),
	}),
	[PassiveCoverType.Lesser]: new PassiveCoverDefinition({
		type: PassiveCoverType.Lesser,
		examples: 'Creatures on the way, 1m-tall obstacle, etc.',
		bonus: Bonus.of(-1),
	}),
	[PassiveCoverType.Standard]: new PassiveCoverDefinition({
		type: PassiveCoverType.Standard,
		examples: 'Line of sight is blocked by the corners of obstacles.',
		bonus: Bonus.of(-3),
	}),
	[PassiveCoverType.Greater]: new PassiveCoverDefinition({
		type: PassiveCoverType.Greater,
		examples: 'Line of sight is almost completely obstructed.',
		bonus: Bonus.of(-6),
	}),
};
