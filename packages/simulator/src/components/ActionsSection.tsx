import {
	ACTIONS,
	ActionType,
	ActionValueParameter,
	ActionCheckParameter,
	StatTree,
	DerivedStatType,
	RESOURCES,
	Check,
	StatType,
	StandardCheck,
	CircumstanceModifier,
	ModifierSource,
	ActionValueUnit,
	Value,
	Bonus,
	Distance,
	Shield,
	ActionDefinition,
	Trait,
	Resource,
	PassiveCoverType,
	COVER_TYPES,
	Armor,
} from '@shattered-wilds/commons';
import React, { useEffect, useMemo, useState } from 'react';
import { FaDice, FaFistRaised, FaHandHolding, FaRunning, FaStar } from 'react-icons/fa';
import { FaShield } from 'react-icons/fa6';

import { useModals } from '../hooks/useModals';
import { Character, CharacterSheet, Weapon, WeaponMode } from '../types';
import { numberToOrdinal } from '../utils';

import { ResourceInputComponent } from './ResourceInputComponent';
import Block from './shared/Block';
import { LabeledCheckbox } from './shared/LabeledCheckbox';
import LabeledDropdown from './shared/LabeledDropdown';
import LabeledInput from './shared/LabeledInput';
import { RichText } from './shared/RichText';

interface ActionsSectionProps {
	character: Character;
}

const ParameterBox: React.FC<{
	title: string;
	tooltip: string;
	children: React.ReactNode;
	onClick?: () => void;
}> = ({ title, tooltip, children, onClick }) => {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '8px',
				border: '1px solid var(--text)',
				borderRadius: '4px',
				backgroundColor: onClick ? 'var(--button-base)' : 'var(--background-alt)',
				minWidth: '100px',
				textAlign: 'center',
				cursor: onClick ? 'pointer' : 'help',
			}}
			title={tooltip}
			onClick={onClick}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					onClick?.();
				}
			}}
		>
			<div style={{ fontSize: '0.8em', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '2px' }}>
				{title}
			</div>
			<div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{children}</div>
		</div>
	);
};

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
		<ParameterBox title={parameter.name} tooltip={tooltip}>
			{value.description}
		</ParameterBox>
	);
};

interface CheckParameterProps {
	parameter: ActionCheckParameter;
	statTree: StatTree;
	character: Character;
	tabParameters: TabParameters;
}

interface TabParameters {
	selectedWeapon: WeaponModeOption | null;
	rangeIncrementModifier: CircumstanceModifier | null;
	passiveCoverModifier: CircumstanceModifier | null;
	heightIncrementsModifier: CircumstanceModifier | null;
	selectedDefenseRealm: StatType;
	selectedShield: Shield | null;
	selectedArmor: Armor | null;
}

const checkOptions = (
	statType: StatType | StandardCheck,
	tabParameters: TabParameters,
): [StatType, CircumstanceModifier[]] | undefined => {
	if (statType instanceof StatType) {
		return [statType, []];
	}

	const weaponMode = tabParameters.selectedWeapon;
	switch (statType) {
		case StandardCheck.Attack: {
			const type = weaponMode ? weaponMode.mode.statType : StatType.STR;
			const weaponModifier = weaponMode ? weaponMode.weapon.getEquipmentModifier(weaponMode.mode) : null;

			const modifiers = [
				weaponModifier,
				tabParameters.rangeIncrementModifier,
				tabParameters.passiveCoverModifier,
				tabParameters.heightIncrementsModifier,
			].filter(e => e !== null);

			return [type, modifiers];
		}
		case StandardCheck.Defense: {
			const realm = tabParameters.selectedDefenseRealm;
			const armor = tabParameters.selectedArmor;
			return [realm, armor ? [armor.getEquipmentModifier()] : []];
		}
		case StandardCheck.ShieldBlock: {
			const shield = tabParameters.selectedShield;
			if (!shield) {
				return undefined;
			}
			return [StatType.Body, [shield.getEquipmentModifier()]];
		}
	}
};

const CheckParameter: React.FC<CheckParameterProps> = ({ parameter, statTree, character, tabParameters }) => {
	const { openDiceRollModal } = useModals();
	const options = checkOptions(parameter.statType, tabParameters);
	if (!options) {
		return null;
	}

	const [statType, cms] = options;
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
		<ParameterBox
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
			<FaDice size={12} style={{ color: 'var(--text-secondary)' }} />
			{targetDcSuffix}
		</ParameterBox>
	);
};

export const ActionsSection: React.FC<ActionsSectionProps> = ({ character }) => {
	const { openConsumeResourceModal } = useModals();
	const [activeTab, setActiveTab] = useState<ActionType>(ActionType.Movement);
	const [showAll, setShowAll] = useState(true);

	const [selectedWeapon, setSelectedWeapon] = useState<WeaponModeOption | null>(null);
	const [selectedRange, setSelectedRange] = useState<Distance | null>(null);
	const [selectedDefenseRealm, setSelectedDefenseRealm] = useState<StatType>(StatType.Body);
	const [selectedArmor, setSelectedArmor] = useState<Armor | null>(null);
	const [selectedShield, setSelectedShield] = useState<Shield | null>(null);
	const [selectedPassiveCover, setSelectedPassiveCover] = useState<PassiveCoverType>(PassiveCoverType.None);
	const [heightIncrements, setHeightIncrements] = useState<string>('');

	const sheet = CharacterSheet.from(character.props);
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
	const armors = sheet.equipment.items.filter(item => item instanceof Armor) as Armor[];

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

	// Auto-select first weapon and armor if available
	useEffect(() => {
		if (weaponModes.length > 0 && !selectedWeapon) {
			setSelectedWeapon(weaponModes[0]);
		}
	}, [weaponModes, selectedWeapon]);
	useEffect(() => {
		if (armors.length > 0 && !selectedArmor) {
			setSelectedArmor(armors[0]);
		}
	}, [armors, selectedArmor]);

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
		const availableTabs = [...new Set(Object.values(ACTIONS).map(action => action.type))];

		return (
			<div
				style={{
					display: 'flex',
					borderBottom: '1px solid var(--text)',
					marginBottom: '16px',
					gap: '2px',
				}}
			>
				{availableTabs.map(tab => {
					const Icon = getTypeIcon(tab);
					const isActive = activeTab === tab;

					return (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
								padding: '8px 12px',
								border: 'none',
								borderBottom: isActive ? '2px solid var(--text)' : '2px solid transparent',
								backgroundColor: isActive ? 'var(--background-alt)' : 'transparent',
								color: 'var(--text)',
								cursor: 'pointer',
								fontSize: '0.9em',
								fontWeight: isActive ? 'bold' : 'normal',
							}}
						>
							<Icon size={14} />
							{tab}
						</button>
					);
				})}
			</div>
		);
	};

	const getHeaderForTab = (
		type: ActionType,
	): {
		Header: React.ReactNode | undefined;
		filter?: (action: ActionDefinition) => boolean;
	} => {
		const headerDivStyle = { marginBottom: '12px', display: 'flex', gap: '8px' };
		switch (type) {
			case ActionType.Movement: {
				const movement = sheet.getStatTree().computeDerivedStat(DerivedStatType.Movement);
				return {
					Header: (
						<div style={headerDivStyle}>
							<LabeledInput
								label='Movement'
								tooltip={movement.tooltip}
								value={movement.value.toString()}
								disabled={true}
							/>
							<ResourceInputComponent
								variant='normal'
								character={character}
								sheet={sheet}
								resource={Resource.ActionPoint}
							/>
						</div>
					),
				};
			}
			case ActionType.Attack: {
				const hasRangedWeaponSelected = selectedWeapon?.mode.rangeType === Trait.Ranged;
				return {
					Header: (
						<div style={headerDivStyle}>
							<LabeledDropdown
								label='Weapon'
								value={selectedWeapon}
								options={weaponModes}
								describe={weaponMode => `${weaponMode.weapon.name} - ${weaponMode.mode.description}`}
								onChange={setSelectedWeapon}
							/>
							{hasRangedWeaponSelected && (
								<LabeledInput
									label='Range Increment'
									value={hasRangedWeaponSelected ? selectedWeapon.mode.range.description : '-'}
									disabled={true}
								/>
							)}
							{hasRangedWeaponSelected && (
								<LabeledInput
									label='Target (Hexes)'
									value={selectedRange?.value.toString() ?? ''}
									onChange={value => {
										setSelectedRange(value && parseInt(value) > 0 ? Distance.of(parseInt(value)) : null);
									}}
								/>
							)}
							{hasRangedWeaponSelected && rangeIncrementModifier && (
								<LabeledInput
									label='Range CM'
									disabled={true}
									tooltip={rangeIncrementModifier.description}
									value={rangeIncrementModifier.value.description}
								/>
							)}
							{hasRangedWeaponSelected && (
								<LabeledDropdown
									label='Passive Cover'
									value={selectedPassiveCover}
									options={Object.values(PassiveCoverType) as PassiveCoverType[]}
									describe={cover => cover}
									onChange={cover => setSelectedPassiveCover(cover)}
								/>
							)}
							{passiveCoverModifier && (
								<LabeledInput
									label='Cover CM'
									disabled={true}
									tooltip={passiveCoverModifier.description}
									value={passiveCoverModifier.value.description}
								/>
							)}
							{hasRangedWeaponSelected && (
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
							)}
							{heightIncrementsModifier && (
								<LabeledInput
									label='Height CM'
									disabled={true}
									tooltip={heightIncrementsModifier.description}
									value={heightIncrementsModifier.value.description}
								/>
							)}
						</div>
					),
					filter: action => {
						if (action.type !== ActionType.Attack) {
							return false;
						}
						const weaponMode = selectedWeapon?.mode?.rangeType;
						switch (weaponMode) {
							case Trait.Melee:
								return !action.traits.includes(Trait.Ranged);
							case Trait.Ranged:
								return !action.traits.includes(Trait.Melee);
							default:
								return true;
						}
					},
				};
			}
			case ActionType.Defense: {
				const shields = sheet.equipment.items.filter(item => item instanceof Shield) as Shield[];
				const isBody = selectedDefenseRealm === StatType.Body;
				return {
					Header: (
						<div style={headerDivStyle}>
							<LabeledDropdown
								label='Realm'
								value={selectedDefenseRealm}
								options={StatType.realms}
								describe={realm => realm.name}
								onChange={realm => setSelectedDefenseRealm(realm)}
							/>
							{isBody && selectedArmor && (
								<LabeledDropdown
									label='Armor'
									value={selectedArmor}
									options={armors}
									describe={armor => armor.displayText}
									onChange={armor => setSelectedArmor(armor)}
								/>
							)}
							{isBody && shields.length > 0 && (
								<LabeledDropdown
									label='Shield'
									value={selectedShield}
									options={shields}
									describe={shield => shield.displayText}
									placeholder='Select shield...'
									onChange={shield => setSelectedShield(shield ?? null)}
									disabled={!hasShield}
								/>
							)}
						</div>
					),
				};
			}

			case ActionType.Support: {
				return {
					Header: (
						<div style={headerDivStyle}>
							{[Resource.ActionPoint, Resource.VitalityPoint, Resource.FocusPoint, Resource.SpiritPoint].map(
								resource => (
									<ResourceInputComponent
										variant='normal'
										key={resource}
										character={character}
										sheet={sheet}
										resource={resource}
									/>
								),
							)}
						</div>
					),
				};
			}

			case ActionType.Heroic: {
				return {
					Header: (
						<div style={headerDivStyle}>
							<ResourceInputComponent
								variant='normal'
								character={character}
								sheet={sheet}
								resource={Resource.HeroismPoint}
							/>
						</div>
					),
				};
			}

			default: {
				return { Header: undefined };
			}
		}
	};

	const renderActionsByType = (type: ActionType) => {
		const { Header, filter } = getHeaderForTab(type);
		const actions = Object.values(ACTIONS)
			.filter(action => action.type === type)
			.filter(action => showAll || action.costs.every(cost => sheet.getResource(cost.resource).current >= cost.amount))
			.filter(action => showAll || (filter?.(action) ?? true));

		return (
			<div key={type}>
				{Header}
				{Header && (
					<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
				)}

				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					{actions.map(action => {
						const costs = action.costs.map(cost => {
							const resource = RESOURCES[cost.resource];
							const value = `${cost.amount}${cost.variable ? '+' : ''} ${resource.shortName}`;
							const tooltip = `${cost.amount}${cost.variable ? '+' : ''} ${resource.name}`;
							const current = sheet.getResource(cost.resource).current;
							const insufficient = current < cost.amount;
							return { value, tooltip, insufficient };
						});

						return (
							<div key={action.key} style={{ display: 'flex', gap: '2px' }}>
								<ParameterBox
									title='COST'
									tooltip={costs.map(e => e.tooltip).join('\n')}
									onClick={() => {
										openConsumeResourceModal({
											characterId: character.id,
											actionCosts: action.costs,
											title: `Consume Resources - ${action.name}`,
										});
									}}
								>
									{costs.map(e => (
										<div
											key={e.value}
											style={{
												color: e.insufficient ? 'var(--error-color)' : 'inherit',
											}}
										>
											{e.value}
										</div>
									))}
								</ParameterBox>

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
											<span style={{ fontWeight: 'bold' }}>{action.name}</span>
											{action.traits.map(trait => (
												<span key={trait} className='trait'>
													{trait}
												</span>
											))}
										</div>
									</div>
									<div style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
										<RichText>{action.description}</RichText>
									</div>
								</div>

								{action.parameters.map((parameter, index) => {
									const key = `${action.name}-${parameter.constructor.name}-${index}`;
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
