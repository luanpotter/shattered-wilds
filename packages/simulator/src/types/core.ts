import { Bonus, Check, Distance, StatType } from '@shattered-wilds/commons';

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
	range: Distance;
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
		cm: Bonus;
	}
> = {
	[DefenseType.BasicBody]: {
		stat: StatType.Body,
		cm: Bonus.zero(),
	},
	[DefenseType.BasicMind]: {
		stat: StatType.Mind,
		cm: Bonus.zero(),
	},
	[DefenseType.BasicSoul]: {
		stat: StatType.Soul,
		cm: Bonus.zero(),
	},
	[DefenseType.Dodge]: {
		stat: StatType.Evasiveness,
		cm: Bonus.of(3),
	},
	[DefenseType.TakeCover]: {
		stat: StatType.Agility,
		cm: Bonus.of(6),
	},
	[DefenseType.ShieldBlock]: {
		stat: StatType.Body,
		cm: Bonus.zero(),
	},
};
