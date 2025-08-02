import {
	ACTIONS,
	ActionType,
	ActionValueParameter,
	ActionCheckParameter,
	StatTree,
	DerivedStatType,
	RESOURCES,
	Check,
} from '@shattered-wilds/commons';
import React, { useEffect, useState } from 'react';
import { FaDice, FaFistRaised, FaHandHolding, FaRunning, FaStar } from 'react-icons/fa';
import { FaShield } from 'react-icons/fa6';

import { useStore } from '../store';
import { Character, CharacterSheet, Weapon } from '../types';
import { findNextWindowPosition } from '../utils';

import Block from './shared/Block';
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

interface ValueParameterProps {
	parameter: ActionValueParameter;
	statTree: StatTree;
}

const ValueParameter: React.FC<ValueParameterProps> = ({ parameter, statTree }) => {
	const result = parameter.compute(statTree);

	return (
		<ParameterBox title={parameter.name} tooltip={result.tooltip}>
			{`${result.value} ${parameter.unit}`}
		</ParameterBox>
	);
};

interface CheckParameterProps {
	parameter: ActionCheckParameter;
	statTree: StatTree;
	character: Character;
}

const CheckParameter: React.FC<CheckParameterProps> = ({ parameter, statTree, character }) => {
	const addWindow = useStore(state => state.addWindow);
	const circumstanceModifiers = parameter.circumstanceModifier ? [parameter.circumstanceModifier] : [];
	const statModifier = statTree.getModifier(parameter.statType, circumstanceModifiers);

	const tooltipText = [
		`Stat: ${parameter.statType.name}`,
		statModifier.description,
		`Check type: ${parameter.mode}-${parameter.nature}`,
		parameter.targetDc && `Target DC: ${parameter.targetDc}`,
	]
		.filter(Boolean)
		.join('\n');

	return (
		<ParameterBox
			title={`${parameter.name} (${statModifier.baseValueString})`}
			tooltip={tooltipText}
			onClick={() => {
				addWindow({
					id: window.crypto.randomUUID(),
					title: `Roll ${parameter.name} Check`,
					type: 'dice-roll',
					position: findNextWindowPosition(useStore.getState().windows),
					check: new Check({
						mode: parameter.mode,
						nature: parameter.nature,
						statModifier: statModifier,
					}),
					characterId: character.id,
				});
			}}
		>
			{statModifier.valueString}
			<FaDice size={12} style={{ color: 'var(--text-secondary)' }} />
		</ParameterBox>
	);
};

export const ActionsSection: React.FC<ActionsSectionProps> = ({ character }) => {
	const addWindow = useStore(state => state.addWindow);
	const windows = useStore(state => state.windows);
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
		const availableTabs = Object.values(ACTIONS);

		return (
			<div
				style={{
					display: 'flex',
					borderBottom: '1px solid var(--text)',
					marginBottom: '16px',
					gap: '2px',
				}}
			>
				{availableTabs.map(action => {
					const tab = action.type;
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
										addWindow({
											id: window.crypto.randomUUID(),
											title: `Consume Resources - ${action.name}`,
											type: 'consume-resource',
											characterId: character.id,
											position: findNextWindowPosition(windows),
											actionCosts: action.costs,
											width: '400px',
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
									if (parameter instanceof ActionValueParameter) {
										return <ValueParameter key={index} parameter={parameter} statTree={tree} />;
									} else if (parameter instanceof ActionCheckParameter) {
										return <CheckParameter key={index} parameter={parameter} statTree={tree} character={character} />;
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
