import { ACTIONS, ActionType, ActionValueParameter, ActionCheckParameter, StatTree } from '@shattered-wilds/commons';
import React, { useEffect, useState } from 'react';
import { FaDice, FaFistRaised, FaHandHolding, FaRunning, FaStar } from 'react-icons/fa';
import { FaShield } from 'react-icons/fa6';

import { useStore } from '../store';
import { Character, CharacterSheet, Weapon } from '../types';

import Block from './shared/Block';
import { RichText } from './shared/RichText';

interface ActionsSectionProps {
	character: Character;
}

interface ValueParameterProps {
	parameter: ActionValueParameter;
	statTree: StatTree;
}

const ValueParameter: React.FC<ValueParameterProps> = ({ parameter, statTree }) => {
	const computedValue = parameter.compute(statTree);
	const tooltipText = parameter.formula
		.map(factor => {
			const factorValue = factor.compute(statTree);
			const roundText = factor.round ? ` (${factor.round})` : '';
			return `${factor.coefficient} × ${factor.variable} = ${factorValue}${roundText}`;
		})
		.join(' + ');

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
				backgroundColor: 'var(--background-alt)',
				minWidth: '100px',
				textAlign: 'center',
				cursor: 'help',
			}}
			title={tooltipText}
		>
			<div style={{ fontSize: '0.8em', color: 'var(--text-secondary)', marginBottom: '2px' }}>{parameter.name}</div>
			<div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
				{computedValue} {parameter.unit}
			</div>
		</div>
	);
};

interface CheckParameterProps {
	parameter: ActionCheckParameter;
	statTree: StatTree;
}

const CheckParameter: React.FC<CheckParameterProps> = ({ parameter, statTree }) => {
	const circumstanceModifiers = parameter.circumstanceModifier ? [parameter.circumstanceModifier] : [];
	const statModifier = statTree.getModifier(parameter.statType, circumstanceModifiers);
	const totalModifier = statModifier.value;

	const tooltipText = [
		`Stat: ${parameter.statType.name}`,
		statModifier.description,
		`Check type: ${parameter.mode}-${parameter.nature}`,
		parameter.targetDc && `Target DC: ${parameter.targetDc}`,
	]
		.filter(Boolean)
		.join('\n');

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
				backgroundColor: 'var(--background-alt)',
				minWidth: '100px',
				textAlign: 'center',
				cursor: 'pointer',
			}}
			title={tooltipText}
		>
			<div style={{ fontSize: '0.8em', color: 'var(--text-secondary)', marginBottom: '2px' }}>{parameter.name}</div>
			<div style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: '2px' }}>
				{totalModifier >= 0 ? '+' : ''}
				{totalModifier}
			</div>
			<FaDice size={12} style={{ color: 'var(--text-secondary)' }} />
		</div>
	);
};

export const ActionsSection: React.FC<ActionsSectionProps> = ({ character }) => {
	const editMode = useStore(state => state.editMode);
	const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
	const [activeTab, setActiveTab] = useState<ActionType>(ActionType.Movement);

	const sheet = CharacterSheet.from(character.props);
	const tree = sheet.getStatTree();
	const weapons = sheet.equipment.items.filter(item => item instanceof Weapon) as Weapon[];

	// Auto-select first weapon if available
	useEffect(() => {
		if (weapons.length > 0 && !selectedWeapon) {
			setSelectedWeapon(weapons[0]);
		}
	}, [weapons, selectedWeapon]);

	const getAvailableActionTypes = () => {
		const types = Object.values(ActionType);
		return types.filter(type => {
			const actions = Object.values(ACTIONS).filter(action => action.type === type);
			return actions.length > 0;
		});
	};

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
		const availableTabs = getAvailableActionTypes();

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

		return (
			<div key={type}>
				{/* Type-specific info */}
				{type === ActionType.Movement && (
					<>
						<div
							style={{
								fontSize: '0.9em',
								color: 'var(--text-secondary)',
								marginBottom: '12px',
								padding: '8px 12px',
								backgroundColor: 'var(--background-alt)',
								borderRadius: '4px',
								border: '1px solid var(--text)',
							}}
						>
							<strong>Movement:</strong> {sheet.derivedStats.movement.value} hexes
						</div>
						<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
					</>
				)}

				{type === ActionType.Attack && weapons.length > 0 && (
					<>
						<div style={{ marginBottom: '12px' }}>
							<label htmlFor='weapon-select' style={{ fontSize: '0.9em', marginBottom: '4px', display: 'block' }}>
								<strong>Weapon:</strong>
							</label>
							<select
								id='weapon-select'
								value={selectedWeapon?.name || ''}
								onChange={e => {
									const weapon = weapons.find(w => w.name === e.target.value);
									setSelectedWeapon(weapon || null);
								}}
								style={{
									padding: '6px 10px',
									fontSize: '0.9em',
									borderRadius: '4px',
									border: '1px solid var(--text)',
									backgroundColor: 'var(--background)',
									color: 'var(--text)',
									width: '100%',
								}}
							>
								{weapons.map(weapon => (
									<option key={weapon.name} value={weapon.name}>
										{weapon.name} (+{weapon.bonus})
									</option>
								))}
							</select>
						</div>
						<hr style={{ border: 'none', borderTop: '1px solid var(--text)', margin: '0 0 12px 0', opacity: 0.3 }} />
					</>
				)}

				{/* Action cards */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					{actions.map(action => {
						const costs = action.costs
							.map(cost => {
								let displayName: string;
								if (cost.resource === 'ActionPoint') {
									displayName = 'AP';
								} else if (cost.resource === 'VitalityPoint') {
									displayName = 'VP';
								} else if (cost.resource === 'FocusPoint') {
									displayName = 'FP';
								} else if (cost.resource === 'SpiritPoint') {
									displayName = 'SP';
								} else if (cost.resource === 'HeroismPoint') {
									displayName = 'HP';
								} else {
									displayName = cost.resource;
								}
								return `${cost.amount}${cost.variable ? '+' : ''} ${displayName}`;
							})
							.join(', ');

						const actionModifier = undefined; // TODO(luan): compute action modifier
						const displayName = actionModifier ? `${action.name} (${actionModifier})` : action.name;
						const isClickable = false; // TODO(luan): add action modals

						return (
							<div key={action.key} style={{ display: 'flex', gap: '2px' }}>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										padding: '12px',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										backgroundColor: editMode ? 'var(--background-alt)' : 'var(--background)',
										opacity: editMode ? 0.7 : 1,
										minWidth: '120px',
										textAlign: 'center',
									}}
								>
									<div style={{ fontSize: '1.2em', color: 'var(--text-secondary)' }}>{costs}</div>
								</div>

								<div
									style={{
										flex: 1,
										padding: '12px',
										border: '1px solid var(--text)',
										borderRadius: '4px',
										backgroundColor: editMode ? 'var(--background-alt)' : 'var(--background)',
										cursor: isClickable ? 'pointer' : 'default',
										opacity: editMode ? 0.7 : 1,
									}}
								>
									<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
										<div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
											<span style={{ fontWeight: 'bold' }}>{displayName}</span>
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
									if (parameter instanceof ActionValueParameter) {
										return <ValueParameter key={index} parameter={parameter} statTree={tree} />;
									} else if (parameter instanceof ActionCheckParameter) {
										return <CheckParameter key={index} parameter={parameter} statTree={tree} />;
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
