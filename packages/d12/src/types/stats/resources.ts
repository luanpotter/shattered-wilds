import { F, Formula } from './formula.js';
import { StatType } from './stat-type.js';

export enum Resource {
	HeroismPoint = 'HeroismPoint',
	VitalityPoint = 'VitalityPoint',
	FocusPoint = 'FocusPoint',
	SpiritPoint = 'SpiritPoint',
	ActionPoint = 'ActionPoint',
}

export class ResourceCost {
	resource: Resource;
	amount: number;
	variable: boolean;

	constructor({ resource, amount, variable = false }: { resource: Resource; amount: number; variable?: boolean }) {
		this.resource = resource;
		this.amount = amount;
		this.variable = variable;
	}

	get resourceDefinition(): ResourceDefinition {
		return RESOURCES[this.resource];
	}

	get shortDescription(): string {
		return `${this.amount}${this.variable ? '+' : ''} ${this.resourceDefinition.shortCode}`;
	}

	get longDescription(): string {
		return `${this.amount}${this.variable ? '+' : ''} ${this.resourceDefinition.fullName}`;
	}
}

export class ResourceDefinition {
	key: Resource;
	fullName: string;
	shortName: string;
	shortCode: string;
	description: string;
	color: string; // rgb hex representing the resource
	formula: Formula;

	constructor({
		key,
		fullName,
		shortName,
		shortCode,
		description,
		color,
		formula,
	}: {
		key: Resource;
		fullName: string;
		shortName: string;
		shortCode: string;
		description: string;
		color: string;
		formula: Formula;
	}) {
		this.key = key;
		this.fullName = fullName;
		this.shortName = shortName;
		this.shortCode = shortCode;
		this.description = description;
		this.color = color;
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
		fullName: 'Heroism Points',
		shortName: 'Heroism',
		shortCode: 'HP',
		description: `Represents a character's heroic potential in the narrative. Each character has a maximum number of Heroism Points equal to their [[Level]] value.

They can be used to invoke [[Extra Die | Extras]] and [[Luck Die]], to call for [[Write History]], amongst other powerful actions. These are harder to recover, at one per [[Long Rest]] rate plus the DM can award Heroism Points (within your maximum) to reward good roleplaying or other out-of-the-box thinking (similar to the Inspiration mechanic in D&D 5e).`,
		color: '#8E24AA',
		formula: F.level(),
	}),
	[Resource.VitalityPoint]: new ResourceDefinition({
		key: Resource.VitalityPoint,
		fullName: 'Vitality Points',
		shortName: 'Vitality',
		shortCode: 'VP',
		description: `Represents a character's physical ability to keep going during intense situations. They are analogous to Health in other games, but in the D12 System, you only take real damage after you are [[Incapacitated]]. A character has a maximum **VP** equal to 4 + [[Body]] modifier.

Like other crucial resource points, they can also be spent to power special abilities.`,
		color: '#4CAF50',
		formula: F.constant(4).add(F.variable(1, StatType.Body)),
	}),
	[Resource.FocusPoint]: new ResourceDefinition({
		key: Resource.FocusPoint,
		fullName: 'Focus Points',
		shortName: 'Focus',
		shortCode: 'FP',
		description: `Represents a character's mental vigor and ability to focus during intense situations. They are analogous to Mana in other games for Arcane casters, but they are also used by any characters to power special abilities that require focus, mental acuity and concentration. A character has a maximum **FP** equal to 4 + [[Mind]] modifier.`,
		color: '#1E88E5',
		formula: F.constant(4).add(F.variable(1, StatType.Mind)),
	}),
	[Resource.SpiritPoint]: new ResourceDefinition({
		key: Resource.SpiritPoint,
		fullName: 'Spirit Points',
		shortName: 'Spirit',
		shortCode: 'SP',
		description: `Represents a character's morale and spiritual strength. They are a different form of Mana (for non-Arcane powers) or a form of mental stress or morale in other games, but they are also used by any characters to power special abilities. A character has a maximum **SP** equal to 4 + [[Soul]] modifier.`,
		color: '#FFD700',
		formula: F.constant(4).add(F.variable(1, StatType.Soul)),
	}),
	[Resource.ActionPoint]: new ResourceDefinition({
		key: Resource.ActionPoint,
		fullName: 'Action Points',
		shortName: 'Action Point',
		shortCode: 'AP',
		description: `Represents the amount of effort a character can expend in a given turn. Each character has **4 AP** per round, refilled at the end of their turn, which can be used to perform different [[Action | Actions]].`,
		color: '#E53935',
		formula: F.constant(4),
	}),
};
