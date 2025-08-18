import { F, Formula } from './formula.js';
import { StatType } from './stat-type.js';

export enum Resource {
	HeroismPoint = 'HeroismPoint',
	VitalityPoint = 'VitalityPoint',
	FocusPoint = 'FocusPoint',
	SpiritPoint = 'SpiritPoint',
	ActionPoint = 'ActionPoint',
}

export class ResourceDefinition {
	key: Resource;
	name: string;
	shortName: string;
	description: string;
	formula: Formula;

	constructor({
		key,
		name,
		shortName,
		description,
		formula,
	}: {
		key: Resource;
		name: string;
		shortName: string;
		description: string;
		formula: Formula;
	}) {
		this.key = key;
		this.name = name;
		this.shortName = shortName;
		this.description = description;
		this.formula = formula;
	}
}

export interface ResourceValue {
	resource: Resource;
	current: number;
	max: number;
}

export const RESOURCES: Record<Resource, ResourceDefinition> = {
	[Resource.HeroismPoint]: new ResourceDefinition({
		key: Resource.HeroismPoint,
		name: 'Heroism Point',
		shortName: 'HP',
		description: `Represents a character's heroic potential in the narrative. Each character has a maximum number of Heroism Points equal to their [[Level]] value.

They can be used to invoke [[Extra Die | Extras]] and [[Luck Die]], to call for [[Write History]], amongst other powerful actions. These are harder to recover, at one per [[Long Rest]] rate plus the DM can award Heroism Points (within your maximum) to reward good roleplaying or other out-of-the-box thinking (similar to the Inspiration mechanic in D&D 5e).`,
		formula: F.level(),
	}),
	[Resource.VitalityPoint]: new ResourceDefinition({
		key: Resource.VitalityPoint,
		name: 'Vitality Point',
		shortName: 'VP',
		description: `Represents a character's physical ability to keep going during intense situations. They are analogous to Health in other games, but in the D12 System, you only take real damage after you are [[Incapacitated]]. A character has a maximum **VP** equal to 4 + [[Body]] modifier.

Like other crucial resource points, they can also be spent to power special abilities.`,
		formula: F.constant(4).add(F.variable(1, StatType.Body)),
	}),
	[Resource.FocusPoint]: new ResourceDefinition({
		key: Resource.FocusPoint,
		name: 'Focus Point',
		shortName: 'FP',
		description: `Represents a character's mental vigor and ability to focus during intense situations. They are analogous to Mana in other games for Arcane casters, but they are also used by any characters to power special abilities that require focus, mental acuity and concentration. A character has a maximum **FP** equal to 4 + [[Mind]] modifier.`,
		formula: F.constant(4).add(F.variable(1, StatType.Mind)),
	}),
	[Resource.SpiritPoint]: new ResourceDefinition({
		key: Resource.SpiritPoint,
		name: 'Spirit Point',
		shortName: 'SP',
		description: `Represents a character's morale and spiritual strength. They are a different form of Mana (for non-Arcane powers) or a form of mental stress or morale in other games, but they are also used by any characters to power special abilities. A character has a maximum **SP** equal to 4 + [[Soul]] modifier.`,
		formula: F.constant(4).add(F.variable(1, StatType.Soul)),
	}),
	[Resource.ActionPoint]: new ResourceDefinition({
		key: Resource.ActionPoint,
		name: 'Action Point',
		shortName: 'AP',
		description: `Represents the amount of effort a character can expend in a given turn. Each character has **4 AP** per round, refilled at the end of their turn, which can be used to perform different [[Action | Actions]].`,
		formula: F.constant(4),
	}),
};
