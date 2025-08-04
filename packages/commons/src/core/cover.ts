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
	description: string;
	bonus: Bonus;

	constructor({ type, description, bonus }: { type: PassiveCoverType; description: string; bonus: Bonus }) {
		this.type = type;
		this.description = description;
		this.bonus = bonus;
	}

	get modifier(): CircumstanceModifier {
		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `Passive Cover (${this.description})`,
			value: this.bonus,
		});
	}
}

export const COVER_TYPES: Record<PassiveCoverType, PassiveCoverDefinition> = {
	[PassiveCoverType.None]: new PassiveCoverDefinition({
		type: PassiveCoverType.None,
		description: 'None',
		bonus: Bonus.zero(),
	}),
	[PassiveCoverType.Lesser]: new PassiveCoverDefinition({
		type: PassiveCoverType.Lesser,
		description: 'Lesser',
		bonus: Bonus.of(-1),
	}),
	[PassiveCoverType.Standard]: new PassiveCoverDefinition({
		type: PassiveCoverType.Standard,
		description: 'Standard',
		bonus: Bonus.of(-3),
	}),
	[PassiveCoverType.Greater]: new PassiveCoverDefinition({
		type: PassiveCoverType.Greater,
		description: 'Greater',
		bonus: Bonus.of(-6),
	}),
};
