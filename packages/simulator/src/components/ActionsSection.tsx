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
} from '@shattered-wilds/commons';
import React, { useEffect, useState } from 'react';
import { FaDice, FaFistRaised, FaHandHolding, FaRunning, FaStar } from 'react-icons/fa';
import { FaShield } from 'react-icons/fa6';

import { useModals } from '../hooks/useModals';
import { Character, CharacterSheet, Weapon, WeaponMode } from '../types';

import Block from './shared/Block';
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
}

const checkOptions = (statType: StatType | StandardCheck, tabParameters: TabParameters): [StatType, Bonus] => {
	if (statType instanceof StatType) {
		return [statType, Bonus.zero()];
	}

	const weaponMode = tabParameters.selectedWeapon?.mode;
	switch (statType) {
		case StandardCheck.Attack: {
			const type = weaponMode ? weaponMode.statType : StatType.STR;
			const bonus = weaponMode ? weaponMode.bonus : Bonus.zero();
			return [type, bonus];
		}
		case StandardCheck.Defense: {
			return [StatType.Body, Bonus.zero()];
		}
	}
};

const CheckParameter: React.FC<CheckParameterProps> = ({ parameter, statTree, character, tabParameters }) => {
	const { openDiceRollModal } = useModals();
	const [statType, bonus] = checkOptions(parameter.statType, tabParameters);
	const circumstanceModifiers = [
		parameter.circumstanceModifier ? parameter.circumstanceModifier : undefined,
		bonus.isNotZero
			? new CircumstanceModifier({ source: ModifierSource.Equipment, name: 'Weapon Bonus', value: bonus })
			: undefined,
	].filter(Boolean) as CircumstanceModifier[];

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
		</ParameterBox>
	);
};

export const ActionsSection: React.FC<ActionsSectionProps> = ({ character }) => {
	const { openConsumeResourceModal } = useModals();
	const [selectedWeapon, setSelectedWeapon] = useState<WeaponModeOption | null>(null);
	const [activeTab, setActiveTab] = useState<ActionType>(ActionType.Movement);

	const sheet = CharacterSheet.from(character.props);
	const tree = sheet.getStatTree();
	const hasShield = sheet.equipment.items.some(item => item instanceof Shield);
	const weapons = sheet.equipment.items.filter(item => item instanceof Weapon) as Weapon[];
	const weaponModes = [
		Weapon.unarmed(),
		...(hasShield ? [Weapon.shieldBash()] : []),
		...weapons.flatMap(weapon => weapon.modes.map(mode => ({ weapon, mode }))),
	];

	// Auto-select first weapon if available
	useEffect(() => {
		if (weaponModes.length > 0 && !selectedWeapon) {
			setSelectedWeapon(weaponModes[0]);
		}
	}, [weaponModes, selectedWeapon]);

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

	const renderActionsByType = (type: ActionType) => {
		const actions = Object.values(ACTIONS).filter(action => action.type === type);
		if (actions.length === 0) return null;

		const movement = sheet.getStatTree().computeDerivedStat(DerivedStatType.Movement);
		return (
			<div key={type}>
				{/* Type-specific info */}
				{type === ActionType.Movement && (
					<>
						<LabeledInput
							label='Movement'
							tooltip={movement.tooltip}
							value={movement.value.toString()}
							disabled={true}
						/>
						<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
					</>
				)}

				{type === ActionType.Attack && weaponModes.length > 0 && (
					<>
						<div style={{ marginBottom: '12px' }}>
							<LabeledDropdown
								label='Weapon'
								value={selectedWeapon}
								options={weaponModes}
								describe={({ weapon, mode }) => `${weapon.name} - ${mode.type} (${mode.bonus.description})`}
								onChange={setSelectedWeapon}
							/>
						</div>
						<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
					</>
				)}

				{/* Action cards */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					{actions.map(action => {
						const costs = action.costs.map(cost => {
							const resource = RESOURCES[cost.resource];
							const value = `${cost.amount}${cost.variable ? '+' : ''} ${resource.shortName}`;
							const tooltip = `${cost.amount}${cost.variable ? '+' : ''} ${resource.name}`;
							return { value, tooltip };
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
										<div key={e.value}>{e.value}</div>
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
												tabParameters={{ selectedWeapon }}
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
			<h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em' }}>Actions</h3>

			{renderTabButtons()}
			{renderActionsByType(activeTab)}
		</Block>
	);
};
