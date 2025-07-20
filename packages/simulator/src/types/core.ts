import { StatType } from '@shattered-wilds/commons';

// TODO(luan): rename to CheckType, there are 4 combinations
export type RollType = 'Static' | 'Contested (Active)' | 'Contested (Resisted)';

export class DerivedStat<T> {
	value: T;
	description: string;

	constructor(value: T, description: string) {
		this.value = value;
		this.description = description;
	}
}

export interface BasicAttack {
	name: string;
	description: string;
	check: Check;
}

export interface Check {
	attribute: StatType;
	bonus: number;
	modifier: number;
}

export enum DefenseType {
	Basic = 'Basic',
	Dodge = 'Dodge',
	Shield = 'Shield',
}
