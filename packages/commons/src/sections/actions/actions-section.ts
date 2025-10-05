import { CharacterSheet } from '../../character/character-sheet.js';
import {
	ActionCheckParameter,
	ActionDefinition,
	ACTIONS,
	ActionType,
	ActionValueParameter,
	ActionValueUnit,
	IncludeEquipmentModifier,
	StandardCheck,
} from '../../core/actions.js';
import { DEFENSE_TRAITS, DefenseTrait, Trait } from '../../core/traits.js';
import { Check } from '../../stats/check.js';
import { CircumstanceModifier } from '../../stats/stat-tree.js';
import { StatType } from '../../stats/stat-type.js';
import { Bonus, Distance, Value } from '../../stats/value.js';
import { mapEnumToRecord } from '../../utils/utils.js';
import {
	ActionRow,
	ActionRowBox,
	ActionRowCheckBox,
	ActionRowCheckBoxError,
	ActionRowCost,
	ActionRowValueBox,
} from '../common/action-row.js';
import { SectionInput } from '../common/section-inputs.js';
import { ActionsSectionInputFactory, ActionTabInputValues } from './actions-section-inputs.js';

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
							new ActionRow({
								key: action.key,
								cost: new ActionRowCost({
									characterId,
									characterSheet,
									name: action.name,
									actionCosts: action.costs,
								}),
								title: action.name,
								traits: action.traits,
								description: action.description,
								boxes: action.parameters.map((parameter, index) => {
									const key = `${action.name}-${parameter}-${index}`;
									return parameter instanceof ActionCheckParameter
										? ActionTabParameterCalculator.createBoxForCheck({
												key,
												characterSheet,
												action,
												parameter,
												inputValues,
											})
										: ActionTabParameterCalculator.createBoxForValue({
												key,
												characterSheet,
												action,
												parameter: parameter as ActionValueParameter,
												inputValues,
											});
								}),
							}),
					)
					.filter(actionItem => showAll || !actionItem.hasErrors());
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
	actions: ActionRow[];

	constructor({ type, inputs: inputs, actions }: { type: ActionType; inputs: SectionInput[]; actions: ActionRow[] }) {
		this.type = type;
		this.inputs = inputs;
		this.actions = actions;
	}
}

const ActionTabParameterCalculator = {
	computeStatType: (statType: StatType | StandardCheck, inputValues: ActionTabInputValues): StatType => {
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
	},

	computeIncludedModifiers: (
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
	},

	createBoxForCheck: ({
		key,
		characterSheet,
		action,
		parameter,
		inputValues,
	}: {
		key: string;
		characterSheet: CharacterSheet;
		action: ActionDefinition;
		parameter: ActionCheckParameter;
		inputValues: ActionTabInputValues;
	}): ActionRowBox => {
		const requireRangeTrait = action.traits.filter(trait => trait === Trait.Melee || trait === Trait.Ranged)[0];
		const defenseTraits = action.traits.filter((trait): trait is DefenseTrait => trait in DEFENSE_TRAITS);
		const errors: ActionRowCheckBoxError[] = [];

		if (requireRangeTrait && parameter.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Weapon)) {
			const currentWeaponRangeTrait = inputValues.selectedWeaponMode?.mode.rangeType ?? Trait.Melee;
			if (currentWeaponRangeTrait !== requireRangeTrait) {
				errors.push({
					title: `Invalid Weapon`,
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

		const statType = ActionTabParameterCalculator.computeStatType(parameter.statType, inputValues);
		const cms = parameter.includeEquipmentModifiers.flatMap(includeModifierFor =>
			ActionTabParameterCalculator.computeIncludedModifiers(includeModifierFor, inputValues),
		);
		const circumstanceModifiers = [parameter.circumstanceModifier, ...cms].filter(e => e !== undefined);

		const statTree = characterSheet.getStatTree();
		const statModifier = statTree.getModifier(statType, circumstanceModifiers);
		const name = statType.name;

		const tooltip = [
			`Stat: ${statType.name}`,
			statModifier.description,
			`Check type: ${parameter.mode}-${parameter.nature}`,
			parameter.targetDC && `Target DC: ${parameter.targetDC}`,
		]
			.filter(Boolean)
			.join('\n');

		const inherentModifier = statModifier.inherentModifier;
		const title = `${name} (${inherentModifier.description})`;

		const check = new Check({
			mode: parameter.mode,
			nature: parameter.nature,
			descriptor: action.name,
			statModifier: statModifier,
		});

		const data = new ActionRowCheckBox({ check, targetDC: parameter.targetDC, errors });

		return new ActionRowBox({
			key,
			labels: [title],
			tooltip,
			data,
		});
	},

	createBoxForValue: ({
		key,
		characterSheet,
		parameter,
	}: {
		key: string;
		characterSheet: CharacterSheet;
		action: ActionDefinition;
		parameter: ActionValueParameter;
		inputValues: ActionTabInputValues;
	}): ActionRowBox => {
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
		return new ActionRowBox({
			key,
			labels: [parameter.name],
			tooltip,
			data: new ActionRowValueBox({ value }),
		});
	},
};
