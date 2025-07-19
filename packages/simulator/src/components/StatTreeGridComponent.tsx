import React from 'react';
import { FaUndo, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

import { useStore } from '../store';
import { StatModifier, StatNode, StatTree, StatType } from '../types';

interface StatTreeGridComponentProps {
	tree: StatTree;
	onUpdateCharacterProp: (key: string, value: string) => void;
	disabled?: boolean;
	characterId?: string;
}

// Value display component (reusing from original)
const StatValueComponent: React.FC<{
	node: StatNode;
	modifier: StatModifier;
	onClick?: () => void;
	onRightClick?: () => void;
	canAllocate?: boolean;
	canDeallocate?: boolean;
	attributeName: string;
	characterId?: string;
}> = ({
	node,
	modifier,
	onClick,
	onRightClick,
	canAllocate = false,
	canDeallocate = false,
	attributeName,
	characterId,
}) => {
	const editMode = useStore(state => state.editMode);
	const addWindow = useStore(state => state.addWindow);
	const value = modifier.value;

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		if (canDeallocate && onRightClick && editMode) {
			onRightClick();
		}
	};

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (editMode) {
			if (canAllocate && onClick) {
				onClick();
			}
		} else {
			if (characterId) {
				addWindow({
					id: window.crypto.randomUUID(),
					title: `Roll ${attributeName} Check`,
					type: 'dice-roll',
					position: { x: e.clientX, y: e.clientY },
					modifier: value,
					attributeName,
					characterId: characterId,
				});
			}
		}
	};

	const getModifierTooltip = () => {
		const tooltip = [];
		tooltip.push(
			...modifier.appliedModifiers.map(mod => `${mod.source}: ${mod.value > 0 ? '+' + mod.value : mod.value}`),
		);
		return tooltip.join('\n');
	};

	const tooltip = getModifierTooltip();
	const hasTooltip = tooltip.length > 0;

	const commonClickProps = !editMode
		? {
				onClick: handleClick,
				onKeyDown: (e: React.KeyboardEvent) => {
					if (e.key === 'Enter' || e.key === ' ') {
						handleClick(e as unknown as React.MouseEvent);
					}
				},
				role: 'button',
				tabIndex: 0,
			}
		: {};

	return (
		<div
			style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
			onClick={e => e.stopPropagation()}
			role='presentation'
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width: '24px',
					height: '24px',
					borderRadius: '50%',
					backgroundColor:
						(editMode && (canAllocate || canDeallocate)) || !editMode ? 'var(--background-alt)' : 'transparent',
					border: '1px solid var(--text)',
					cursor: (editMode && (canAllocate || canDeallocate)) || !editMode ? 'pointer' : 'default',
					fontSize: '0.9em',
					fontWeight: 'bold',
					position: 'relative',
				}}
				onClick={handleClick}
				onContextMenu={handleContextMenu}
				onKeyDown={canAllocate ? e => e.key === 'Enter' && onClick?.() : undefined}
				tabIndex={canAllocate ? 0 : undefined}
				role={canAllocate ? 'button' : undefined}
				aria-label={canAllocate ? `Allocate point to attribute` : undefined}
			>
				{node.points}
			</div>
			<span
				style={{
					fontSize: '0.9em',
					fontWeight: value >= 0 ? 'bold' : 'normal',
					cursor: !editMode ? 'pointer' : 'default',
				}}
				title={tooltip}
				{...commonClickProps}
			>
				{value >= 0 ? `+${value}` : value}
				{hasTooltip && (
					<FaInfoCircle
						style={{
							marginLeft: '4px',
							width: '10px',
							height: '10px',
							color: 'var(--text)',
							cursor: 'help',
						}}
					/>
				)}
			</span>
		</div>
	);
};

export const AttributeTreeGridComponent: React.FC<StatTreeGridComponentProps> = ({
	tree,
	onUpdateCharacterProp,
	disabled = false,
	characterId,
}) => {
	const editMode = useStore(state => state.editMode);

	const handleAllocatePoint = (node: StatNode) => {
		if (!disabled && node.canAllocatePoint) {
			onUpdateCharacterProp(node.type.name, (node.points + 1).toString());
		}
	};

	const handleDeallocatePoint = (node: StatNode) => {
		if (!disabled && node.canDeallocatePoint) {
			onUpdateCharacterProp(node.type.name, (node.points - 1).toString());
		}
	};

	const StatValueNode = ({ node }: { node: StatNode }) => {
		const modifier = tree.getModifier(node.type);
		return (
			<StatValueComponent
				node={node}
				modifier={modifier}
				canAllocate={node.canAllocatePoint}
				canDeallocate={node.canDeallocatePoint}
				onClick={() => handleAllocatePoint(node)}
				onRightClick={() => handleDeallocatePoint(node)}
				attributeName={node.type.name}
				{...(characterId && { characterId })}
			/>
		);
	};

	const PointsAllocation: React.FC<{ node: StatNode }> = ({ node }) => {
		if (!editMode) return null;

		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
				<span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>
					{node.unallocatedPoints}/{node.allocatablePoints} points
					{node.unallocatedPoints > 0 && (
						<FaExclamationTriangle style={{ marginLeft: '6px', color: 'orange' }} title='You have unallocated points' />
					)}
				</span>
			</div>
		);
	};

	// Get realms in order
	const bodyRealm = tree.root.children.find(r => r.type === StatType.Body);
	const mindRealm = tree.root.children.find(r => r.type === StatType.Mind);
	const soulRealm = tree.root.children.find(r => r.type === StatType.Soul);

	// Helper function to find attribute by type
	const findAttributeByType = (realm: StatNode | undefined, type: StatType): StatNode | undefined => {
		return realm?.children.find(attr => attr.type === type);
	};

	// Component for individual attribute panels
	const AttributePanel: React.FC<{ attribute: StatNode }> = ({ attribute }) => {
		const hasUnallocated = attribute.hasUnallocatedPoints;

		return (
			<div
				style={{
					border: '1px solid var(--text)',
					borderRadius: '8px',
					backgroundColor: 'var(--background-alt)',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					minHeight: '200px',
				}}
			>
				{/* Header */}
				<div
					style={{
						padding: '0.75rem',
						borderBottom: '1px solid var(--text)',
						backgroundColor: 'var(--background)',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{attribute.type.name}</span>
						{hasUnallocated && (
							<FaExclamationTriangle style={{ color: 'orange' }} title='Contains unallocated points' />
						)}
					</div>
					<StatValueNode node={attribute} />
				</div>

				{/* Skills */}
				<div style={{ padding: '0.75rem', flex: 1 }}>
					{attribute.children.map(skill => {
						const skillModifier = tree.getModifier(skill.type);
						return (
							<div
								key={skill.type.name}
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '0.25rem 0',
									borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
									fontSize: '0.9rem',
								}}
							>
								<span style={{ flex: 1 }}>{skill.type.name}</span>
								<StatValueComponent
									node={skill}
									modifier={skillModifier}
									canAllocate={skill.canAllocatePoint}
									canDeallocate={skill.canDeallocatePoint}
									onClick={() => handleAllocatePoint(skill)}
									onRightClick={() => handleDeallocatePoint(skill)}
									attributeName={skill.type.name}
									{...(characterId && { characterId })}
								/>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	// Component for vertical realm labels
	const RealmLabel: React.FC<{ realm: StatNode }> = ({ realm }) => {
		const hasUnallocated = realm.hasUnallocatedPoints;

		const getRealmBackgroundColor = (realmType: StatType) => {
			return realmType === StatType.Body
				? 'rgba(255, 100, 100, 0.1)'
				: realmType === StatType.Mind
					? 'rgba(100, 100, 255, 0.1)'
					: 'rgba(100, 255, 100, 0.1)';
		};

		return (
			<div
				style={{
					width: '120px',
					height: '100%',
					border: '1px solid var(--text)',
					borderRadius: '8px',
					backgroundColor: getRealmBackgroundColor(realm.type),
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '0.5rem',
					padding: '1rem 0.5rem',
					boxSizing: 'border-box',
				}}
			>
				<div
					style={{
						writingMode: 'vertical-lr',
						textOrientation: 'mixed',
						fontWeight: 'bold',
						fontSize: '1.1rem',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '0.5rem',
						transform: 'rotate(180deg)',
					}}
				>
					<span>{realm.type.name}</span>
					{hasUnallocated && <FaExclamationTriangle style={{ color: 'orange' }} title='Contains unallocated points' />}
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
					<StatValueNode node={realm} />
					{editMode && <PointsAllocation node={realm} />}
				</div>
			</div>
		);
	};

	return (
		<div style={{ width: '100%', padding: '1rem', boxSizing: 'border-box' }}>
			{/* Level Section */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '1rem',
					padding: '0.5rem 1rem',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '8px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
					<span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Level</span>
					<StatValueNode node={tree.root} />
				</div>
				{editMode && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
						<PointsAllocation node={tree.root} />
						<button
							onClick={() => {
								for (const update of tree.fullReset()) {
									onUpdateCharacterProp(update.key, update.value);
								}
							}}
							style={{
								background: 'none',
								border: '1px solid var(--text)',
								borderRadius: '4px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
								padding: '0.5rem 1rem',
								color: 'var(--text)',
							}}
							title='Reset all points'
						>
							<FaUndo />
							<span>Reset All Points</span>
						</button>
					</div>
				)}
			</div>

			{/* Main Grid Layout */}
			<div style={{ display: 'flex', gap: '1rem' }}>
				{/* Vertical Realm Labels Column */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
					{bodyRealm && <RealmLabel realm={bodyRealm} />}
					{mindRealm && <RealmLabel realm={mindRealm} />}
					{soulRealm && <RealmLabel realm={soulRealm} />}
				</div>

				{/* 3x3 Attribute Grid */}
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gridTemplateRows: 'repeat(3, 1fr)',
						gap: '1rem',
						flex: 1,
					}}
				>
					{/* Body Row */}
					{findAttributeByType(bodyRealm, StatType.STR) && (
						<AttributePanel attribute={findAttributeByType(bodyRealm, StatType.STR)!} />
					)}
					{findAttributeByType(bodyRealm, StatType.DEX) && (
						<AttributePanel attribute={findAttributeByType(bodyRealm, StatType.DEX)!} />
					)}
					{findAttributeByType(bodyRealm, StatType.CON) && (
						<AttributePanel attribute={findAttributeByType(bodyRealm, StatType.CON)!} />
					)}

					{/* Mind Row */}
					{findAttributeByType(mindRealm, StatType.INT) && (
						<AttributePanel attribute={findAttributeByType(mindRealm, StatType.INT)!} />
					)}
					{findAttributeByType(mindRealm, StatType.WIS) && (
						<AttributePanel attribute={findAttributeByType(mindRealm, StatType.WIS)!} />
					)}
					{findAttributeByType(mindRealm, StatType.CHA) && (
						<AttributePanel attribute={findAttributeByType(mindRealm, StatType.CHA)!} />
					)}

					{/* Soul Row */}
					{findAttributeByType(soulRealm, StatType.DIV) && (
						<AttributePanel attribute={findAttributeByType(soulRealm, StatType.DIV)!} />
					)}
					{findAttributeByType(soulRealm, StatType.FOW) && (
						<AttributePanel attribute={findAttributeByType(soulRealm, StatType.FOW)!} />
					)}
					{findAttributeByType(soulRealm, StatType.LCK) && (
						<AttributePanel attribute={findAttributeByType(soulRealm, StatType.LCK)!} />
					)}
				</div>
			</div>
		</div>
	);
};
