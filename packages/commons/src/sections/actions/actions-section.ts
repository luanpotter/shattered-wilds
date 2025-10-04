import { CharacterSheet } from '../../character/character-sheet.js';
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
} from '../../core/actions.js';
import { DEFENSE_TRAITS, DefenseTrait, Trait } from '../../core/traits.js';
import { Check } from '../../stats/check.js';
import { CircumstanceModifier, ModifierSource } from '../../stats/stat-tree.js';
import { StatType } from '../../stats/stat-type.js';
import { Bonus, Distance, Value } from '../../stats/value.js';
import { mapEnumToRecord } from '../../utils/utils.js';
import { ActionsSectionInputFactory, ActionTabInputValues } from './actions-section-inputs.js';
import { SectionInput } from '../common/section-inputs.js';

export { ActionTabInputValues };

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
		update,
	}: {
		characterId: string;
		characterSheet: CharacterSheet;
		showAll: boolean;
		inputValues: ActionTabInputValues;
		update: (inputValues: ActionTabInputValues) => void;
	}): ActionsSection {
		const factory = new ActionsSectionInputFactory({
			sheet: characterSheet,
			inputValues,
			update,
		});
		return new ActionsSection({
			tabs: mapEnumToRecord(ActionType, type => {
				const actions = Object.values(ACTIONS)
					.filter(action => action.type === type)
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
					)
					.filter(actionItem => showAll || (actionItem.cost.canAfford && !actionItem.hasErrors()));
				return new ActionTab({
					type: type,
					inputs: factory.getInputsForActionType(type),
					actions,
				});
			}),
			inputValues,
		});
	}
}

export class ActionTab {
	type: ActionType;
	inputs: SectionInput[];
	actions: ActionTabItem[];

	constructor({
		type,
		inputs: inputs,
		actions,
	}: {
		type: ActionType;
		inputs: SectionInput[];
		actions: ActionTabItem[];
	}) {
		this.type = type;
		this.inputs = inputs;
		this.actions = actions;
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

	hasErrors(): boolean {
		return this.parameters.some(param => {
			if (param.data instanceof ActionTabParameterCheckData) {
				return param.data.errors.length > 0;
			}
			return false;
		});
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

		const weaponMode = inputValues.selectedWeaponMode;
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
				const hasRangedWeapon = inputValues.selectedWeaponMode?.mode.rangeType === Trait.Ranged;

				// Always include weapon modifier if weapon is selected
				if (inputValues.selectedWeaponMode) {
					modifiers.push(inputValues.weaponModifier());
				}

				// Only include range modifier if RangeCM input should be visible
				if (hasRangedWeapon && inputValues.selectedRangeValue !== null) {
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
		const requireRangeTrait = action.traits.filter(trait => trait === Trait.Melee || trait === Trait.Ranged)[0];
		const defenseTraits = action.traits.filter((trait): trait is DefenseTrait => trait in DEFENSE_TRAITS);
		const errors: ActionTabParameterCheckError[] = [];

		if (requireRangeTrait && parameter.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Weapon)) {
			const currentWeaponRangeTrait = inputValues.selectedWeaponMode?.mode.rangeType ?? Trait.Melee;
			if (currentWeaponRangeTrait !== requireRangeTrait) {
				errors.push({
					title: `${requireRangeTrait} Required`,
					tooltip: `This action requires a weapon with the ${requireRangeTrait} trait.`,
					text: `${requireRangeTrait} Required`,
				});
			}
		}

		if (defenseTraits.length > 0) {
			const selectedRealm = inputValues.selectedDefenseRealm.name;
			const validRealms = defenseTraits.map(trait => DEFENSE_TRAITS[trait].name);
			const isValid = validRealms.includes(selectedRealm);
			if (!isValid) {
				const validRealmNames = validRealms.join(', ');
				errors.push({
					title: 'Invalid Realm',
					tooltip: `This action requires the defense realm to be one of: ${validRealmNames}.`,
					text: `${selectedRealm} Invalid`,
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
	canAfford: boolean;

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
		this.canAfford = actionCosts.every(cost => characterSheet.getResource(cost.resource).current >= cost.amount);
	}
}
