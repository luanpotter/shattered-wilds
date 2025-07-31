import { Check, StatType } from '@shattered-wilds/commons';

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

// TODO(luan): get rid of this and use ACTIONS instead
export enum DefenseType {
	BasicBody = 'Basic Body',
	BasicMind = 'Basic Mind',
	BasicSoul = 'Basic Soul',
	Dodge = 'Dodge',
	TakeCover = 'Take Cover',
	ShieldBlock = 'Shield Block',
}

export const DEFENSE_TYPE_PROPERTIES: Record<
	DefenseType,
	{
		stat: StatType;
		cm: number;
	}
> = {
	[DefenseType.BasicBody]: {
		stat: StatType.Body,
		cm: 0,
	},
	[DefenseType.BasicMind]: {
		stat: StatType.Mind,
		cm: 0,
	},
	[DefenseType.BasicSoul]: {
		stat: StatType.Soul,
		cm: 0,
	},
	[DefenseType.Dodge]: {
		stat: StatType.Evasiveness,
		cm: 3,
	},
	[DefenseType.TakeCover]: {
		stat: StatType.Agility,
		cm: 6,
	},
	[DefenseType.ShieldBlock]: {
		stat: StatType.Body,
		cm: 0,
	},
};
