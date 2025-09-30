import { CharacterSheet } from '../character/character-sheet.js';
import { WeaponModeOption, Armor, Shield } from '../character/equipment.js';
import { ActionCost, ActionDefinition, ActionParameter, ACTIONS, ActionType } from '../core/actions.js';
import { PassiveCoverType } from '../core/cover.js';
import { Trait } from '../core/traits.js';
import { StatType } from '../stats/stat-type.js';
import { Distance } from '../stats/value.js';
import { mapEnumToRecord } from '../utils/utils.js';

/// A pre-computed, tab-grouped breakdown of which actions the a given character sheet
/// can currently execute, include pre-computed costs and parameters.
export class ActionsSection {
	tabs: Record<ActionType, ActionTab>;

	constructor({ tabs }: { tabs: Record<ActionType, ActionTab> }) {
		this.tabs = tabs;
	}

	static create({
		characterId,
		characterSheet,
		showAll,
		inputValues,
	}: {
		characterId: string;
		characterSheet: CharacterSheet;
		showAll: boolean;
		inputValues: ActionTabInputValues;
	}): ActionsSection {
		return new ActionsSection({
			tabs: mapEnumToRecord(ActionType, type => {
				const filter = ActionsSection.getFilterForActionType({ type, inputValues });
				const actions = Object.values(ACTIONS)
					.filter(action => action.type === type)
					.filter(
						action =>
							showAll || action.costs.every(cost => characterSheet.getResource(cost.resource).current >= cost.amount),
					)
					.filter(action => showAll || (filter?.(action) ?? true))
					.map(
						action =>
							new ActionTabItem({
								key: action.key,
								cost: new ActionTabItemCost({
									characterId,
									characterSheet,
									name: action.name,
									actionCosts: action.costs,
								}),
								title: action.name,
								traits: action.traits,
								description: action.description,
								parameters: action.parameters.map((parameter, index) => {
									const key = `${action.name}-${parameter.constructor.name}-${index}`;
									return new ActionTabParameter({
										key,
										parameter,
									});
								}),
							}),
					);
				return new ActionTab({
					type: type,
					parameters: ActionsSection.getParametersForActionType(type),
					actions,
				});
			}),
		});
	}

	static getFilterForActionType({
		type,
		inputValues,
	}: {
		type: ActionType;
		inputValues: ActionTabInputValues;
	}): ((action: ActionDefinition) => boolean) | null {
		switch (type) {
			case ActionType.Attack: {
				const weaponMode = inputValues.selectedWeapon?.mode?.rangeType;
				return (action: ActionDefinition) => {
					switch (weaponMode) {
						case Trait.Melee:
							return !action.traits.includes(Trait.Ranged);
						case Trait.Ranged:
							return !action.traits.includes(Trait.Melee);
						default:
							return true;
					}
				};
			}
			default:
				// No specific filter for other action types for now
				return null;
		}
	}

	static getParametersForActionType(type: ActionType): ActionTabInputs[] {
		switch (type) {
			case ActionType.Movement:
				return [
					new ActionTabInputs({ name: ActionTabInputName.Movement }),
					new ActionTabInputs({ name: ActionTabInputName.ActionPoints }),
				];
			case ActionType.Attack:
				return [
					new ActionTabInputs({ name: ActionTabInputName.WeaponMode }),
					new ActionTabInputs({ name: ActionTabInputName.RangeIncrement }),
					new ActionTabInputs({ name: ActionTabInputName.Target }),
					new ActionTabInputs({ name: ActionTabInputName.RangeCM }),
					new ActionTabInputs({ name: ActionTabInputName.PassiveCover }),
					new ActionTabInputs({ name: ActionTabInputName.HeightIncrements }),
					new ActionTabInputs({ name: ActionTabInputName.HeightCM }),
				];
			case ActionType.Defense:
				return [
					new ActionTabInputs({ name: ActionTabInputName.DefenseRealm }),
					new ActionTabInputs({ name: ActionTabInputName.Armor }),
					new ActionTabInputs({ name: ActionTabInputName.Shield }),
				];
			case ActionType.Support:
				return [
					new ActionTabInputs({ name: ActionTabInputName.ActionPoints }),
					new ActionTabInputs({ name: ActionTabInputName.VitalityPoints }),
					new ActionTabInputs({ name: ActionTabInputName.FocusPoints }),
					new ActionTabInputs({ name: ActionTabInputName.SpiritPoints }),
				];
			case ActionType.Heroic:
				return [
					new ActionTabInputs({ name: ActionTabInputName.ActionPoints }),
					new ActionTabInputs({ name: ActionTabInputName.HeroismPoints }),
				];
			case ActionType.Meta:
				return [];
		}
	}
}

export class ActionTab {
	type: ActionType;
	inputs: ActionTabInputs[];
	actions: ActionTabItem[];

	constructor({
		type,
		parameters,
		actions,
	}: {
		type: ActionType;
		parameters: ActionTabInputs[];
		actions: ActionTabItem[];
	}) {
		this.type = type;
		this.inputs = parameters;
		this.actions = actions;
	}
}

export enum ActionTabInputName {
	Movement,
	HeroismPoints,
	ActionPoints,
	VitalityPoints,
	FocusPoints,
	SpiritPoints,
	WeaponMode,
	RangeIncrement,
	Target,
	RangeCM,
	PassiveCover,
	HeightIncrements,
	HeightCM,
	DefenseRealm,
	Armor,
	Shield,
}

export interface ActionTabInputValues {
	selectedWeapon: WeaponModeOption | null;
	selectedRange: Distance | null;
	selectedDefenseRealm: StatType;
	selectedPassiveCover: PassiveCoverType;
	heightIncrements: string;
	selectedArmor: Armor | 'None';
	selectedShield: Shield | 'None';
}

export class ActionTabInputs {
	name: ActionTabInputName;

	constructor({ name }: { name: ActionTabInputName }) {
		this.name = name;
	}
}

export class ActionTabItem {
	key: string;
	cost: ActionTabItemCost;
	title: string;
	traits: Trait[] = [];
	description: string;
	parameters: ActionTabParameter[];

	constructor({
		key,
		cost,
		title,
		traits,
		description,
		parameters: boxes,
	}: {
		key: string;
		cost: ActionTabItemCost;
		title: string;
		traits: Trait[];
		description: string;
		parameters: ActionTabParameter[];
	}) {
		this.key = key;
		this.cost = cost;
		this.title = title;
		this.traits = traits;
		this.description = description;
		this.parameters = boxes;
	}
}

export class ActionTabParameter {
	key: string;
	parameter: ActionParameter;

	constructor({ key, parameter }: { key: string; parameter: ActionParameter }) {
		this.key = key;
		this.parameter = parameter;
	}
}

export class ActionTabItemCost {
	characterId: string;
	characterSheet: CharacterSheet;
	name: string;
	actionCosts: ActionCost[];

	constructor({
		characterId,
		characterSheet,
		name,
		actionCosts,
	}: {
		characterId: string;
		characterSheet: CharacterSheet;
		name: string;
		actionCosts: ActionCost[];
	}) {
		this.characterId = characterId;
		this.characterSheet = characterSheet;
		this.name = name;
		this.actionCosts = actionCosts;
	}
}
