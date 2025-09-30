import { CharacterSheet } from '../character/character-sheet.js';
import { WeaponModeOption, Armor, Shield } from '../character/equipment.js';
import {
	ActionCheckParameter,
	ActionCost,
	ActionDefinition,
	ActionParameter,
	ACTIONS,
	ActionType,
	ActionValueParameter,
	ActionValueUnit,
	IncludeEquipmentModifier,
	StandardCheck,
} from '../core/actions.js';
import { COVER_TYPES, PassiveCoverType } from '../core/cover.js';
import { Trait } from '../core/traits.js';
import { Check } from '../index.js';
import { CircumstanceModifier, ModifierSource } from '../stats/stat-tree.js';
import { StatType } from '../stats/stat-type.js';
import { Bonus, Distance, Value } from '../stats/value.js';
import { mapEnumToRecord, numberToOrdinal } from '../utils/utils.js';

/// A pre-computed, tab-grouped breakdown of which actions the a given character sheet
/// can currently execute, include pre-computed costs and parameters.
export class ActionsSection {
	tabs: Record<ActionType, ActionTab>;
	inputValues: ActionTabInputValues;

	constructor({ tabs, inputValues }: { tabs: Record<ActionType, ActionTab>; inputValues: ActionTabInputValues }) {
		this.tabs = tabs;
		this.inputValues = inputValues;
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
									return ActionTabParameter.create({
										key: `${action.name}-${parameter.constructor.name}-${index}`,
										characterSheet,
										action,
										parameter,
										inputValues,
									});
								}),
							}),
					);
				return new ActionTab({
					type: type,
					parameters: ActionsSection.getParametersForActionType(type, inputValues),
					actions,
				});
			}),
			inputValues,
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

	static getParametersForActionType(type: ActionType, inputValues?: ActionTabInputValues): ActionTabInputs[] {
		const allInputs = ActionsSection.getAllParametersForActionType(type);

		// If no input values provided, return all inputs (for initial setup)
		if (!inputValues) {
			return allInputs;
		}

		// Filter inputs based on current selections and visibility rules
		return allInputs.filter(input => ActionsSection.shouldShowInput(input.name, inputValues));
	}

	private static getAllParametersForActionType(type: ActionType): ActionTabInputs[] {
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

	private static shouldShowInput(inputName: ActionTabInputName, inputValues: ActionTabInputValues): boolean {
		const hasRangedWeapon = inputValues.selectedWeapon?.mode.rangeType === Trait.Ranged;
		const isBodyDefense = inputValues.selectedDefenseRealm?.name === 'Body';

		switch (inputName) {
			// Always visible inputs
			case ActionTabInputName.Movement:
			case ActionTabInputName.WeaponMode:
			case ActionTabInputName.DefenseRealm:
			case ActionTabInputName.ActionPoints:
			case ActionTabInputName.VitalityPoints:
			case ActionTabInputName.FocusPoints:
			case ActionTabInputName.SpiritPoints:
			case ActionTabInputName.HeroismPoints:
				return true;

			// Ranged weapon only inputs
			case ActionTabInputName.RangeIncrement:
			case ActionTabInputName.Target:
			case ActionTabInputName.PassiveCover:
			case ActionTabInputName.HeightIncrements:
				return hasRangedWeapon;

			// Ranged weapon + additional condition inputs
			case ActionTabInputName.RangeCM:
				return hasRangedWeapon && inputValues.selectedRange !== null;

			case ActionTabInputName.HeightCM:
				return hasRangedWeapon && inputValues.heightIncrementsModifier() !== null;

			// Body defense only inputs
			case ActionTabInputName.Armor:
			case ActionTabInputName.Shield:
				return isBodyDefense;

			default:
				return true;
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

export class ActionTabInputValues {
	selectedWeapon: WeaponModeOption | null;
	selectedRange: Distance | null;
	selectedDefenseRealm: StatType;
	selectedPassiveCover: PassiveCoverType;
	heightIncrements: string;
	selectedArmor: Armor | 'None';
	selectedShield: Shield | 'None';

	constructor({
		selectedWeapon,
		selectedRange,
		selectedDefenseRealm,
		selectedPassiveCover,
		heightIncrements,
		selectedArmor,
		selectedShield,
	}: {
		selectedWeapon: WeaponModeOption | null;
		selectedRange: Distance | null;
		selectedDefenseRealm: StatType;
		selectedPassiveCover: PassiveCoverType;
		heightIncrements: string;
		selectedArmor: Armor | 'None';
		selectedShield: Shield | 'None';
	}) {
		this.selectedWeapon = selectedWeapon;
		this.selectedRange = selectedRange;
		this.selectedDefenseRealm = selectedDefenseRealm;
		this.selectedPassiveCover = selectedPassiveCover;
		this.heightIncrements = heightIncrements;
		this.selectedArmor = selectedArmor;
		this.selectedShield = selectedShield;
	}

	weaponModifier = (): CircumstanceModifier | null => {
		return this.selectedWeapon ? this.selectedWeapon.weapon.getEquipmentModifier(this.selectedWeapon.mode) : null;
	};

	rangeIncrementModifier = (): CircumstanceModifier | null => {
		if (!this.selectedWeapon || !this.selectedRange || this.selectedWeapon.mode.rangeType !== Trait.Ranged) {
			return null;
		}
		const weaponRange = this.selectedWeapon.mode.range;
		const rangeIncrements = Math.max(0, Math.floor((this.selectedRange.value - 1) / weaponRange.value));

		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `${numberToOrdinal(rangeIncrements)} Range Increment Penalty`,
			value: Bonus.of(rangeIncrements * -3),
		});
	};

	passiveCoverModifier = (): CircumstanceModifier | null => {
		if (this.selectedPassiveCover === PassiveCoverType.None) {
			return null;
		}
		return COVER_TYPES[this.selectedPassiveCover].modifier;
	};

	heightIncrementsModifier = (): CircumstanceModifier | null => {
		const increments = parseInt(this.heightIncrements);
		if (!increments || isNaN(increments) || increments === 0) {
			return null;
		}
		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `Height Increments (${increments})`,
			value: Bonus.of(increments * -3),
		});
	};
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

export class ActionTabParameterCheckError {
	title: string;
	tooltip: string;
	text: string;

	constructor({ title, tooltip, text }: { title: string; tooltip: string; text: string }) {
		this.title = title;
		this.tooltip = tooltip;
		this.text = text;
	}
}

export class CheckData {
	title: string;
	check: Check;
	targetDc: number | undefined;

	constructor({ title, check, targetDc }: { title: string; check: Check; targetDc: number | undefined }) {
		this.title = title;
		this.check = check;
		this.targetDc = targetDc;
	}
}

export class ActionTabParameterCheckData {
	title: string;
	tooltip: string;
	checkData: CheckData;
	textTitle: string;
	textSubtitle: string;
	errors: ActionTabParameterCheckError[];
	modifierBreakdown: Record<string, number>;

	constructor({
		title,
		tooltip,
		checkData,
		textTitle,
		textSubtitle,
		errors,
		modifierBreakdown,
	}: {
		title: string;
		tooltip: string;
		checkData: CheckData;
		textTitle: string;
		textSubtitle: string;
		errors: ActionTabParameterCheckError[];
		modifierBreakdown: Record<string, number>;
	}) {
		this.title = title;
		this.tooltip = tooltip;
		this.checkData = checkData;
		this.errors = errors;
		this.textTitle = textTitle;
		this.textSubtitle = textSubtitle;
		this.modifierBreakdown = modifierBreakdown;
	}
}

export class ActionTabParameterValueData {
	title: string;
	tooltip: string;
	description: string;

	constructor({ title, tooltip, description }: { title: string; tooltip: string; description: string }) {
		this.title = title;
		this.tooltip = tooltip;
		this.description = description;
	}
}

export class ActionTabParameter {
	key: string;
	parameter: ActionParameter;
	data: ActionTabParameterCheckData | ActionTabParameterValueData;

	constructor({
		key,
		parameter,
		data,
	}: {
		key: string;
		parameter: ActionParameter;
		data: ActionTabParameterCheckData | ActionTabParameterValueData;
	}) {
		this.key = key;
		this.parameter = parameter;
		this.data = data;
	}

	private static computeStatType = (
		statType: StatType | StandardCheck,
		inputValues: ActionTabInputValues,
	): StatType => {
		if (statType instanceof StatType) {
			return statType;
		}

		const weaponMode = inputValues.selectedWeapon;
		switch (statType) {
			case StandardCheck.BodyAttack: {
				return weaponMode ? weaponMode.mode.statType : StatType.STR;
			}
			case StandardCheck.Defense: {
				return inputValues.selectedDefenseRealm;
			}
		}
	};

	private static computeIncludedModifiers = (
		includeModifierFor: IncludeEquipmentModifier,
		inputValues: ActionTabInputValues,
	): CircumstanceModifier[] => {
		switch (includeModifierFor) {
			case IncludeEquipmentModifier.Weapon: {
				const modifiers = [];
				const hasRangedWeapon = inputValues.selectedWeapon?.mode.rangeType === Trait.Ranged;

				// Always include weapon modifier if weapon is selected
				if (inputValues.selectedWeapon) {
					modifiers.push(inputValues.weaponModifier());
				}

				// Only include range modifier if RangeCM input should be visible
				if (hasRangedWeapon && inputValues.selectedRange !== null) {
					modifiers.push(inputValues.rangeIncrementModifier());
				}

				// Only include passive cover if PassiveCover input should be visible
				if (hasRangedWeapon) {
					modifiers.push(inputValues.passiveCoverModifier());
				}

				// Only include height increments if HeightCM input should be visible
				if (hasRangedWeapon && inputValues.heightIncrementsModifier() !== null) {
					modifiers.push(inputValues.heightIncrementsModifier());
				}

				return modifiers.filter(e => e !== null);
			}
			case IncludeEquipmentModifier.Armor: {
				if (inputValues.selectedDefenseRealm !== StatType.Body) {
					return [];
				}
				const armor = inputValues.selectedArmor;
				return armor !== 'None' ? [armor.getEquipmentModifier()] : [];
			}
			case IncludeEquipmentModifier.Shield: {
				const shield = inputValues.selectedShield;
				return shield !== 'None' ? [shield.getEquipmentModifier()] : [];
			}
		}
	};

	private static computeDataForCheckParameter = ({
		characterSheet,
		action,
		parameter,
		inputValues,
	}: {
		characterSheet: CharacterSheet;
		action: ActionDefinition;
		parameter: ActionCheckParameter;
		inputValues: ActionTabInputValues;
	}): ActionTabParameterCheckData => {
		const requireTrait = action.traits.filter(trait => trait === Trait.Melee || trait === Trait.Ranged)[0];
		const errors: ActionTabParameterCheckError[] = [];

		if (requireTrait && parameter.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Weapon)) {
			const currentWeaponRangeTrait = inputValues.selectedWeapon?.mode.rangeType ?? Trait.Melee;
			if (currentWeaponRangeTrait !== requireTrait) {
				errors.push({
					title: `${requireTrait} Required`,
					tooltip: `This action requires a weapon with the ${requireTrait} trait.`,
					text: `${requireTrait} Required`,
				});
			}
		}

		if (
			parameter.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Shield) &&
			inputValues.selectedShield === 'None'
		) {
			errors.push({
				title: 'Invalid Shield',
				tooltip: 'This action requires a shield to be equipped.',
				text: 'Shield Required',
			});
		}

		const statType = ActionTabParameter.computeStatType(parameter.statType, inputValues);
		const cms = parameter.includeEquipmentModifiers.flatMap(includeModifierFor =>
			ActionTabParameter.computeIncludedModifiers(includeModifierFor, inputValues),
		);
		const circumstanceModifiers = [parameter.circumstanceModifier, ...cms].filter(e => e !== undefined);

		const statTree = characterSheet.getStatTree();
		const statModifier = statTree.getModifier(statType, circumstanceModifiers);
		const name = statType.name;

		const tooltip = [
			`Stat: ${statType.name}`,
			statModifier.description,
			`Check type: ${parameter.mode}-${parameter.nature}`,
			parameter.targetDc && `Target DC: ${parameter.targetDc}`,
		]
			.filter(Boolean)
			.join('\n');

		const inherentModifier = statModifier.inherentModifier;
		const targetDcSuffix = parameter.targetDc ? ` | DC ${parameter.targetDc}` : '';
		const title = `${name} (${inherentModifier.description})`;

		const check = new Check({
			mode: parameter.mode,
			nature: parameter.nature,
			statModifier: statModifier,
		});

		const textTitle = statModifier.value.description;
		const textSubtitle = targetDcSuffix ? ` ${targetDcSuffix}` : '';

		const checkData = new CheckData({ title, check, targetDc: parameter.targetDc });

		// Build modifier breakdown for VTT dice modal
		const modifierBreakdown: Record<string, number> = {};

		// Get the base stat value (without any circumstance modifiers)
		const baseStatModifier = statTree.getModifier(statType, []);
		if (baseStatModifier.value.value !== 0) {
			modifierBreakdown['Base'] = baseStatModifier.value.value;
		}

		// Add each circumstance modifier separately
		for (const cm of circumstanceModifiers) {
			if (cm.value.value !== 0) {
				// Use a more descriptive name based on the modifier source
				let modifierName = cm.name;
				if (cm.source === ModifierSource.Circumstance) {
					modifierName = 'CM';
				} else if (cm.source === ModifierSource.Equipment) {
					modifierName = 'Equipment';
				}

				// If we already have a modifier with this name, combine them
				const existingValue = modifierBreakdown[modifierName];
				if (existingValue !== undefined) {
					modifierBreakdown[modifierName] = existingValue + cm.value.value;
				} else {
					modifierBreakdown[modifierName] = cm.value.value;
				}
			}
		}

		return new ActionTabParameterCheckData({
			title,
			tooltip,
			checkData,
			textTitle,
			textSubtitle,
			errors,
			modifierBreakdown,
		});
	};

	private static computeDataForValueParameter = ({
		characterSheet,
		parameter,
	}: {
		characterSheet: CharacterSheet;
		action: ActionDefinition;
		parameter: ActionValueParameter;
		inputValues: ActionTabInputValues;
	}): ActionTabParameterValueData => {
		const computeValueForUnit = (value: number, unit: ActionValueUnit): Value => {
			switch (unit) {
				case ActionValueUnit.Modifier:
					return new Bonus({ value });
				case ActionValueUnit.Hex:
					return new Distance({ value });
			}
		};
		const statTree = characterSheet.getStatTree();
		const result = parameter.compute(statTree);
		const value = computeValueForUnit(result.value, parameter.unit);
		const tooltip = [parameter.name, result.tooltip].filter(Boolean).join('\n');
		return new ActionTabParameterValueData({
			title: parameter.name,
			tooltip,
			description: value.description,
		});
	};

	private static computeData = ({
		characterSheet,
		action,
		parameter,
		inputValues,
	}: {
		characterSheet: CharacterSheet;
		action: ActionDefinition;
		parameter: ActionParameter;
		inputValues: ActionTabInputValues;
	}): ActionTabParameterCheckData | ActionTabParameterValueData => {
		const args = { characterSheet, action, inputValues };
		return parameter instanceof ActionCheckParameter
			? ActionTabParameter.computeDataForCheckParameter({ ...args, parameter })
			: ActionTabParameter.computeDataForValueParameter({ ...args, parameter });
	};

	static create = ({
		key,
		characterSheet,
		action,
		parameter,
		inputValues,
	}: {
		key: string;
		characterSheet: CharacterSheet;
		action: ActionDefinition;
		parameter: ActionParameter;
		inputValues: ActionTabInputValues;
	}): ActionTabParameter => {
		const data = ActionTabParameter.computeData({ characterSheet, action, parameter, inputValues });
		return new ActionTabParameter({ key, parameter, data });
	};
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
