import { StatType } from '@shattered-wilds/commons';

// TODO(luan): rename to CheckType, there are 4 combinations
export type RollType = 'Static' | 'Contested (Active)' | 'Contested (Resisted)';

export enum Size {
	F = 'Fine',
	D = 'Diminutive',
	T = 'Tiny',
	S = 'Small',
	M = 'Medium',
	L = 'Large',
	H = 'Huge',
	G = 'Gargantuan',
	C = 'Colossal',
}

export const SizeModifiers: Record<Size, number> = {
	[Size.F]: -8,
	[Size.D]: -4,
	[Size.T]: -2,
	[Size.S]: -1,
	[Size.M]: 0,
	[Size.L]: 1,
	[Size.H]: 2,
	[Size.G]: 4,
	[Size.C]: 8,
};

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
