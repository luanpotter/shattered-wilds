import {
	ActionCheckParameter,
	ActionType,
	ActionValueParameter,
	ActionValueUnit,
	Armor,
	Bonus,
	CharacterSheet,
	Check,
	CircumstanceModifier,
	COVER_TYPES,
	DerivedStatType,
	Distance,
	IncludeEquipmentModifier,
	ModifierSource,
	PassiveCoverType,
	Resource,
	Shield,
	StandardCheck,
	StatTree,
	StatType,
	Trait,
	Value,
	Weapon,
	WeaponMode,
	ActionsSection,
	ActionTabInputName,
	getRecordKeys,
} from '@shattered-wilds/commons';
import React, { useEffect, useCallback, useMemo } from 'react';
import { FaDice, FaFistRaised, FaHandHolding, FaRunning, FaStar } from 'react-icons/fa';
import { FaShield } from 'react-icons/fa6';

import { useModals } from '../../hooks/useModals';
import { useUIStateFactory } from '../../hooks/useUIState';
import { useStore } from '../../store';
import { Character } from '../../types/ui';
import { numberToOrdinal } from '../../utils';
import { CostBoxComponent } from '../CostBoxComponent';
import { ParameterBoxComponent } from '../ParameterBoxComponent';
import { ResourceInputComponent } from '../ResourceInputComponent';
import Block from '../shared/Block';
import { LabeledCheckbox } from '../shared/LabeledCheckbox';
import LabeledDropdown from '../shared/LabeledDropdown';
import LabeledInput from '../shared/LabeledInput';
import { RichText } from '../shared/RichText';
import { Tabs } from '../shared/Tabs';

interface ActionsSectionProps {
	characterId: string;
}

interface ActionsSectionInnerProps {
	characterId: string;
	sheet: CharacterSheet;
}

interface WeaponModeOption {
	weapon: Weapon;
	mode: WeaponMode;
}

interface ValueParameterProps {
	parameter: ActionValueParameter;
	statTree: StatTree;
}

const ValueParameter: React.FC<ValueParameterProps> = ({ parameter, statTree }) => {
	const computeValueForUnit = (value: number, unit: ActionValueUnit): Value => {
		switch (unit) {
			case ActionValueUnit.Modifier:
				return new Bonus({ value });
			case ActionValueUnit.Hex:
				return new Distance({ value });
		}
	};
	const result = parameter.compute(statTree);
	const value = computeValueForUnit(result.value, parameter.unit);
	const tooltip = [parameter.name, result.tooltip].filter(Boolean).join('\n');

	return (
		<ParameterBoxComponent title={parameter.name} tooltip={tooltip}>
			{value.description}
		</ParameterBoxComponent>
	);
};

interface CheckParameterProps {
	parameter: ActionCheckParameter;
	statTree: StatTree;
	character: Character;
	tabParameters: TabParameters;
	requireTrait?: Trait.Melee | Trait.Ranged;
}

interface TabParameters {
	selectedWeapon: WeaponModeOption | null;
	rangeIncrementModifier: CircumstanceModifier | null;
	passiveCoverModifier: CircumstanceModifier | null;
	heightIncrementsModifier: CircumstanceModifier | null;
	selectedDefenseRealm: StatType;
	selectedShield: Shield | 'None';
	selectedArmor: Armor | 'None';
}

const computeIncludedModifiers = (
	includeModifierFor: IncludeEquipmentModifier,
	tabParameters: TabParameters,
): CircumstanceModifier[] => {
	switch (includeModifierFor) {
		case IncludeEquipmentModifier.Weapon: {
			const weaponMode = tabParameters.selectedWeapon;
			const weaponModifier = weaponMode ? weaponMode.weapon.getEquipmentModifier(weaponMode.mode) : null;
			return [
				weaponModifier,
				tabParameters.rangeIncrementModifier,
				tabParameters.passiveCoverModifier,
				tabParameters.heightIncrementsModifier,
			].filter(e => e !== null);
		}
		case IncludeEquipmentModifier.Armor: {
			if (tabParameters.selectedDefenseRealm !== StatType.Body) {
				return [];
			}
			const armor = tabParameters.selectedArmor;
			return armor !== 'None' ? [armor.getEquipmentModifier()] : [];
		}
		case IncludeEquipmentModifier.Shield: {
			const shield = tabParameters.selectedShield;
			return shield !== 'None' ? [shield.getEquipmentModifier()] : [];
		}
	}
};

const computeStatType = (statType: StatType | StandardCheck, tabParameters: TabParameters): StatType => {
	if (statType instanceof StatType) {
		return statType;
	}

	const weaponMode = tabParameters.selectedWeapon;
	switch (statType) {
		case StandardCheck.BodyAttack: {
			return weaponMode ? weaponMode.mode.statType : StatType.STR;
		}
		case StandardCheck.Defense: {
			return tabParameters.selectedDefenseRealm;
		}
	}
};

const CheckParameter: React.FC<CheckParameterProps> = ({
	parameter,
	statTree,
	character,
	tabParameters,
	requireTrait,
}) => {
	const { openDiceRollModal } = useModals();

	// Weapon trait validation (existing logic)
	if (requireTrait && parameter.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Weapon)) {
		const currentWeaponRangeTrait = tabParameters.selectedWeapon?.mode.rangeType ?? Trait.Melee;
		if (currentWeaponRangeTrait !== requireTrait) {
			return (
				<ParameterBoxComponent
					title='Invalid Weapon'
					tooltip={`This action requires a weapon with the ${requireTrait} trait.`}
				>
					<div style={{ color: 'var(--error-color)' }}>{`${requireTrait} Required`}</div>
				</ParameterBoxComponent>
			);
		}
	}

	if (
		parameter.includeEquipmentModifiers.includes(IncludeEquipmentModifier.Shield) &&
		tabParameters.selectedShield === 'None'
	) {
		return (
			<ParameterBoxComponent title='Invalid Shield' tooltip='This action requires a shield to be equipped.'>
				<div style={{ color: 'var(--error-color)' }}>Shield Required</div>
			</ParameterBoxComponent>
		);
	}

	const statType = computeStatType(parameter.statType, tabParameters);
	const cms = parameter.includeEquipmentModifiers.flatMap(includeModifierFor =>
		computeIncludedModifiers(includeModifierFor, tabParameters),
	);
	const circumstanceModifiers = [parameter.circumstanceModifier, ...cms].filter(e => e !== undefined);

	const statModifier = statTree.getModifier(statType, circumstanceModifiers);
	const name = statType.name;
	const tooltipText = [
		`Stat: ${statType.name}`,
		statModifier.description,
		`Check type: ${parameter.mode}-${parameter.nature}`,
		parameter.targetDc && `Target DC: ${parameter.targetDc}`,
	]
		.filter(Boolean)
		.join('\n');

	const inherentModifier = statModifier.inherentModifier;
	const targetDcSuffix = parameter.targetDc ? ` | DC ${parameter.targetDc}` : '';
	return (
		<ParameterBoxComponent
			title={`${name} (${inherentModifier.description})`}
			tooltip={tooltipText}
			onClick={() => {
				openDiceRollModal({
					characterId: character.id,
					check: new Check({
						mode: parameter.mode,
						nature: parameter.nature,
						statModifier: statModifier,
					}),
					title: `Roll ${name} Check`,
					...(parameter.targetDc !== undefined && { initialTargetDC: parameter.targetDc }),
				});
			}}
		>
			{statModifier.value.description}
			<FaDice size={12} />
			{targetDcSuffix}
		</ParameterBoxComponent>
	);
};

const ActionsSectionInner: React.FC<ActionsSectionInnerProps> = ({ characterId, sheet }) => {
	const { useState, useStateArrayItem } = useUIStateFactory(`actions-${characterId}`);
	const [activeTab, setActiveTab] = useState('activeTab', ActionType.Movement);
	const [showAll, setShowAll] = useState('showAll', true);

	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const tree = sheet.getStatTree();
	const hasShield = sheet.equipment.items.some(item => item instanceof Shield);
	const weapons = sheet.equipment.items.filter(item => item instanceof Weapon) as Weapon[];
	const weaponModes = useMemo(
		() => [
			Weapon.unarmed(),
			...(hasShield ? [Weapon.shieldBash()] : []),
			...weapons.flatMap(weapon => weapon.modes.map(mode => ({ weapon, mode }))),
		],
		[hasShield, weapons],
	);

	const [selectedRange, setSelectedRange] = useState<Distance | null>('selectedRange', null);
	const [selectedDefenseRealm, setSelectedDefenseRealm] = useStateArrayItem(
		'selectedDefenseRealm',
		StatType.realms,
		StatType.Body,
	);
	const [selectedPassiveCover, setSelectedPassiveCover] = useState('selectedPassiveCover', PassiveCoverType.None);
	const [heightIncrements, setHeightIncrements] = useState('heightIncrements', '');
	const armors = useMemo(
		() => ['None', ...sheet.equipment.items.filter(item => item instanceof Armor)] as const,
		[sheet.equipment.items],
	);
	const shields = useMemo(
		() => ['None', ...sheet.equipment.items.filter(item => item instanceof Shield)] as const,
		[sheet.equipment.items],
	);

	const [selectedWeapon, setSelectedWeapon] = useStateArrayItem('selectedWeapon', weaponModes, null);
	const [selectedArmor, setSelectedArmor] = useStateArrayItem('selectedArmor', armors, 'None');
	const [selectedShield, setSelectedShield] = useStateArrayItem('selectedShield', shields, 'None');

	const rangeIncrementModifier = useMemo(() => {
		if (!selectedWeapon || !selectedRange || selectedWeapon.mode.rangeType !== Trait.Ranged) {
			return null;
		}
		const weaponRange = selectedWeapon.mode.range;
		const rangeIncrements = Math.max(0, Math.floor((selectedRange.value - 1) / weaponRange.value));

		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `${numberToOrdinal(rangeIncrements)} Range Increment Penalty`,
			value: Bonus.of(rangeIncrements * -3),
		});
	}, [selectedWeapon, selectedRange]);

	const passiveCoverModifier = useMemo(() => {
		if (selectedPassiveCover === PassiveCoverType.None) {
			return null;
		}
		return COVER_TYPES[selectedPassiveCover].modifier;
	}, [selectedPassiveCover]);
	const heightIncrementsModifier = useMemo(() => {
		const increments = parseInt(heightIncrements);
		if (!increments || isNaN(increments) || increments === 0) {
			return null;
		}
		return new CircumstanceModifier({
			source: ModifierSource.Circumstance,
			name: `Height Increments (${increments})`,
			value: Bonus.of(increments * -3),
		});
	}, [heightIncrements]);

	const actionsSection = ActionsSection.create({
		characterId,
		characterSheet: sheet,
		showAll,
		inputValues: {
			selectedWeapon,
		},
	});

	const updateSelectedWeapon = useCallback(
		(weapon: WeaponModeOption) => {
			setSelectedWeapon(weapon);
			setSelectedRange(null);
			setSelectedPassiveCover(PassiveCoverType.None);
			setHeightIncrements('');
		},
		[setSelectedWeapon, setSelectedRange, setSelectedPassiveCover, setHeightIncrements],
	);

	useEffect(() => {
		if (weaponModes.length > 0 && !selectedWeapon) {
			updateSelectedWeapon(weaponModes[0]);
		}
	}, [weaponModes, selectedWeapon, updateSelectedWeapon]);
	useEffect(() => {
		if (armors.length > 0 && !selectedArmor) {
			setSelectedArmor(armors[0]);
		}
	}, [armors, selectedArmor, setSelectedArmor]);

	const getTypeIcon = (type: ActionType) => {
		switch (type) {
			case ActionType.Movement:
				return FaRunning;
			case ActionType.Attack:
				return FaFistRaised;
			case ActionType.Defense:
				return FaShield;
			case ActionType.Support:
				return FaHandHolding;
			case ActionType.Heroic:
				return FaStar;
			case ActionType.Meta:
				return FaDice;
		}
	};

	const renderTabButtons = () => {
		const tabItems = getRecordKeys(actionsSection.tabs).map(actionType => ({
			key: actionType,
			label: actionType,
			icon: getTypeIcon(actionType),
		}));
		return <Tabs tabs={tabItems} activeKey={activeTab} onChange={setActiveTab} iconSize={14} />;
	};

	const getHeaderInputsForTab = (type: ActionType): React.ReactNode | null => {
		const headerDivStyle = { marginBottom: '12px', display: 'flex', gap: '8px' };
		const { inputs } = actionsSection.tabs[type];

		const movement = sheet.getStatTree().getDistance(DerivedStatType.Movement);
		const hasRangedWeaponSelected = selectedWeapon?.mode.rangeType === Trait.Ranged;
		const isBody = selectedDefenseRealm === StatType.Body;

		const resourceInput = (resource: Resource) => {
			return <ResourceInputComponent variant='normal' character={character} sheet={sheet} resource={resource} />;
		};

		const reactInputs = inputs.map(input => {
			switch (input.name) {
				case ActionTabInputName.ActionPoints:
					return resourceInput(Resource.ActionPoint);
				case ActionTabInputName.VitalityPoints:
					return resourceInput(Resource.VitalityPoint);
				case ActionTabInputName.FocusPoints:
					return resourceInput(Resource.FocusPoint);
				case ActionTabInputName.SpiritPoints:
					return resourceInput(Resource.SpiritPoint);
				case ActionTabInputName.HeroismPoints:
					return resourceInput(Resource.HeroismPoint);
				case ActionTabInputName.Movement:
					return (
						<LabeledInput
							label='Movement'
							tooltip={movement.description}
							value={movement.value.description}
							disabled={true}
						/>
					);
				case ActionTabInputName.WeaponMode:
					return (
						<LabeledDropdown
							label='Weapon'
							value={selectedWeapon}
							options={weaponModes}
							describe={weaponMode => `${weaponMode.weapon.name} - ${weaponMode.mode.description}`}
							onChange={updateSelectedWeapon}
						/>
					);
				case ActionTabInputName.RangeIncrement:
					return hasRangedWeaponSelected ? (
						<LabeledInput label='Range Increment' value={selectedWeapon.mode.range.description} disabled={true} />
					) : null;
				case ActionTabInputName.RangeCM:
					return (
						hasRangedWeaponSelected &&
						rangeIncrementModifier && (
							<LabeledInput
								label='Range CM'
								disabled={true}
								tooltip={rangeIncrementModifier.description}
								value={rangeIncrementModifier.value.description}
							/>
						)
					);
				case ActionTabInputName.Target:
					return hasRangedWeaponSelected ? (
						<LabeledInput
							label='Target (Hexes)'
							value={selectedRange?.value.toString() ?? ''}
							onChange={value => {
								setSelectedRange(value && parseInt(value) > 0 ? Distance.of(parseInt(value)) : null);
							}}
						/>
					) : null;
				case ActionTabInputName.PassiveCover:
					return hasRangedWeaponSelected ? (
						<LabeledDropdown
							label='Passive Cover'
							value={selectedPassiveCover}
							options={Object.values(PassiveCoverType) as PassiveCoverType[]}
							onChange={cover => setSelectedPassiveCover(cover)}
						/>
					) : null;
				case ActionTabInputName.HeightIncrements:
					return hasRangedWeaponSelected ? (
						<LabeledInput
							label='Height Increments'
							value={heightIncrements}
							tooltip={
								heightIncrementsModifier
									? heightIncrementsModifier.description
									: 'Provide the number of height increments between the attacker and the target.'
							}
							onChange={value => setHeightIncrements(value)}
						/>
					) : null;
				case ActionTabInputName.HeightCM:
					return heightIncrementsModifier ? (
						<LabeledInput
							label='Height CM'
							disabled={true}
							tooltip={heightIncrementsModifier.description}
							value={heightIncrementsModifier.value.description}
						/>
					) : null;
				case ActionTabInputName.DefenseRealm:
					return (
						<LabeledDropdown
							label='Realm'
							value={selectedDefenseRealm}
							options={StatType.realms}
							describe={realm => realm.name}
							onChange={realm => setSelectedDefenseRealm(realm)}
						/>
					);
				case ActionTabInputName.Armor:
					return (
						isBody &&
						selectedArmor && (
							<LabeledDropdown<Armor | 'None'>
								label='Armor'
								tooltip='Armor is applied to the any **Body Defense** check.'
								value={selectedArmor}
								options={armors}
								describe={armor => (armor === 'None' ? 'No Armor' : armor.displayText)}
								onChange={setSelectedArmor}
							/>
						)
					);
				case ActionTabInputName.Shield:
					return (
						isBody &&
						shields.length > 0 && (
							<LabeledDropdown
								label='Shield'
								value={selectedShield}
								options={shields}
								describe={shield => (shield === 'None' ? 'No Shield' : shield.displayText)}
								onChange={setSelectedShield}
								disabled={!hasShield}
							/>
						)
					);
			}
		});

		if (reactInputs.length === 0) {
			return null;
		}

		return <div style={headerDivStyle}>{reactInputs}</div>;
	};

	const renderActionsByType = (type: ActionType) => {
		const Header = getHeaderInputsForTab(type);
		const actions = actionsSection.tabs[type].actions;
		return (
			<div key={type}>
				{Header}
				{Header && (
					<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
				)}

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					{actions.length === 0 && (
						<div style={{ display: 'flex', justifyContent: 'center' }}>
							<RichText>_No actions available. Select `Show All` to see all actions._</RichText>
						</div>
					)}
					{actions.map(action => {
						return (
							<div key={action.key} style={{ display: 'flex', gap: '2px' }}>
								<CostBoxComponent
									characterId={action.cost.characterId}
									sheet={action.cost.characterSheet}
									name={action.cost.name}
									actionCosts={action.cost.actionCosts}
								/>

								<div
									style={{
										flex: 1,
										padding: '12px',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										backgroundColor: 'var(--background-alt)',
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
										<div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
											<span style={{ fontWeight: 'bold' }}>{action.title}</span>
											{action.traits.map(trait => (
												<span key={trait} className='trait'>
													{trait}
												</span>
											))}
										</div>
									</div>
									<div style={{ fontSize: '0.9em' }}>
										<RichText>{action.description}</RichText>
									</div>
								</div>

								{action.parameters.map(actionParameter => {
									const { key, parameter } = actionParameter;
									if (parameter instanceof ActionValueParameter) {
										return <ValueParameter key={key} parameter={parameter} statTree={tree} />;
									} else if (parameter instanceof ActionCheckParameter) {
										return (
											<CheckParameter
												key={key}
												parameter={parameter}
												statTree={tree}
												character={character}
												tabParameters={{
													selectedWeapon,
													selectedDefenseRealm,
													selectedArmor,
													selectedShield,
													rangeIncrementModifier,
													passiveCoverModifier,
													heightIncrementsModifier,
												}}
												requireTrait={action.traits.filter(trait => trait === Trait.Melee || trait === Trait.Ranged)[0]}
											/>
										);
									}
									return null;
								})}
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	return (
		<Block>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em' }}>Actions</h3>
				<LabeledCheckbox label='Show All' checked={showAll} onChange={setShowAll} />
			</div>

			{renderTabButtons()}
			{renderActionsByType(activeTab)}
		</Block>
	);
};

export const ActionsSectionComponent: React.FC<ActionsSectionProps> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId))!;
	const sheet = CharacterSheet.from(character.props);

	return <ActionsSectionInner characterId={characterId} sheet={sheet} />;
};
