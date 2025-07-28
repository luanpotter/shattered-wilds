export enum ActionType {
	Movement = 'Movement',
	Attack = 'Attack',
}

export enum ActionCostResource {
	HeroismPoint = 'HeroismPoint',
	VitalityPoint = 'VitalityPoint',
	FocusPoint = 'FocusPoint',
	SpiritPoint = 'SpiritPoint',
	ActionPoint = 'ActionPoint',
}

export class ActionCost {
	resource: ActionCostResource;
	amount: number;
	variable: boolean;

	constructor({
		resource,
		amount,
		variable = false,
	}: {
		resource: ActionCostResource;
		amount: number;
		variable?: boolean;
	}) {
		this.resource = resource;
		this.amount = amount;
		this.variable = variable;
	}
}

export class ActionDefinition {
	key: Action;
	type: ActionType;
	name: string;
	description: string;
	costs: ActionCost[];

	constructor({
		key,
		type,
		name,
		description,
		costs,
	}: {
		key: Action;
		type: ActionType;
		name: string;
		description: string;
		costs: ActionCost[];
	}) {
		this.key = key;
		this.type = type;
		this.name = name;
		this.description = description;
		this.costs = costs;
	}
}

export enum Action {
	Stride = 'Stride',
}

export const ACTIONS = {
	[Action.Stride]: new ActionDefinition({
		key: Action.Stride,
		type: ActionType.Movement,
		name: 'Stride',
		description: 'Enables you to move up to [[Movement]] hexes. Movement can be saved for later.',
		costs: [new ActionCost({ resource: ActionCostResource.ActionPoint, amount: 1 })],
	}),
};
