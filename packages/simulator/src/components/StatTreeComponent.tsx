import React, { useState, ReactNode } from 'react';
import { FaUndo, FaExclamationTriangle, FaChevronDown, FaChevronRight, FaInfoCircle } from 'react-icons/fa';

import { useStore } from '../store';
import { StatTree, StatType, StatModifier, StatNode } from '../types';

interface StatTreeComponentProps {
	tree: StatTree;
	onUpdateCharacterProp: (key: string, value: string) => void;
	disabled?: boolean;
	characterId?: string;
}

// Value display with a colored background based on the value
const StatValueComponent: React.FC<{
	node: StatNode;
	modifier: StatModifier;
	onClick?: () => void;
	onRightClick?: () => void;
	canAllocate?: boolean;
	canDeallocate?: boolean;
	characterId?: string;
}> = ({ node, modifier, onClick, onRightClick, canAllocate = false, canDeallocate = false, characterId }) => {
	const editMode = useStore(state => state.editMode);
	const addWindow = useStore(state => state.addWindow);
	const value = modifier.value;

	const attributeName = node.type.name;

	const handleContextMenu = (e: React.MouseEvent) => {
		// Always prevent default context menu
		e.preventDefault();
		if (canDeallocate && onRightClick && editMode) {
			onRightClick();
		}
	};

	const handleClick = (e: React.MouseEvent) => {
		// Prevent click from reaching parent elements
		e.stopPropagation();
		if (editMode) {
			if (canAllocate && onClick) {
				onClick();
			}
		} else {
			// In play mode, open dice roll modal
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

	// Get tooltip text from modifiers and level cap
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
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width: '24px',
					height: '24px',
					borderRadius: '4px',
					backgroundColor: 'var(--background-alt)',
					fontSize: '0.9em',
					fontWeight: value >= 0 ? 'bold' : 'normal',
					position: 'relative',
					cursor: !editMode ? 'pointer' : 'default',
				}}
				title={tooltip}
				{...commonClickProps}
			>
				{value >= 0 ? `+${value}` : value}
				{hasTooltip && (
					<FaInfoCircle
						style={{
							position: 'absolute',
							top: '-4px',
							right: '-4px',
							width: '10px',
							height: '10px',
							color: 'var(--text)',
							cursor: 'help',
						}}
					/>
				)}
			</div>
		</div>
	);
};

// Reusable component for attribute boxes at any level
interface AttributeBoxProps {
	node: StatNode;
	isExpanded?: boolean;
	style?: React.CSSProperties;
	onClick?: () => void;
	expandable?: boolean;
	attributeValue: ReactNode;
	level: 'realm' | 'basic' | 'skill';
}

const AttributeBox: React.FC<AttributeBoxProps> = ({
	node,
	isExpanded = false,
	style = {},
	onClick,
	expandable = false,
	attributeValue,
	level,
}) => {
	const hasUnallocated = node.hasUnallocatedPoints;

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && onClick) {
			onClick();
		}
	};

	// Only use borderBottom: none if it's expanded (to connect with tab content)
	const baseStyle: React.CSSProperties = {
		padding: '8px',
		border: '1px solid var(--text)',
		borderRadius: isExpanded ? '4px 4px 0 0' : '4px',
		cursor: expandable ? 'pointer' : 'default',
		backgroundColor: level === 'skill' ? 'rgba(255, 255, 255, 0.1)' : undefined,
		maxWidth: '300px',
		boxSizing: 'border-box',
	};

	return (
		<div
			style={{ ...baseStyle, ...style }}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={expandable ? 0 : undefined}
			role={expandable ? 'button' : undefined}
			aria-expanded={expandable ? isExpanded : undefined}
			aria-controls={expandable && isExpanded ? `${node.type.name}-content` : undefined}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '4px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
					{expandable && (isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />)}
					<span style={{ fontWeight: level !== 'skill' ? 'bold' : 'normal' }}>{node.type.name}</span>
					{hasUnallocated && (
						<FaExclamationTriangle style={{ color: 'orange', marginLeft: '4px' }} title='Contains unallocated points' />
					)}
				</div>
				{attributeValue}
			</div>
			<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{node.type.description}</div>
		</div>
	);
};

export const StatTreeComponent: React.FC<StatTreeComponentProps> = ({
	tree,
	onUpdateCharacterProp,
	disabled = false, // ???
	characterId,
}) => {
	// Initialize state at the top level to fix conditional Hook calls
	const [selectedRealm, setSelectedRealm] = useState<StatType | null>(null);
	const [selectedBasicAttribute, setSelectedBasicAttribute] = useState<StatType | null>(null);
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

	const PointsAllocation: React.FC<{ node: StatNode }> = ({ node }) => {
		if (!editMode) return null;

		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
				<span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
					{node.unallocatedPoints}/{node.allocatablePoints} points
					{node.hasUnallocatedPoints && (
						<FaExclamationTriangle style={{ marginLeft: '6px', color: 'orange' }} title='You have unallocated points' />
					)}
				</span>
			</div>
		);
	};

	const AttributeValueNode = ({ node }: { node: StatNode }) => {
		const modifier = tree.getModifier(node.type);
		return (
			<StatValueComponent
				node={node}
				modifier={modifier}
				canAllocate={node.canAllocatePoint}
				canDeallocate={node.canDeallocatePoint}
				onClick={() => handleAllocatePoint(node)}
				onRightClick={() => handleDeallocatePoint(node)}
				{...(characterId && { characterId })}
			/>
		);
	};

	// Get the background color for a realm
	const getRealmBackgroundColor = (realmType: StatType) => {
		switch (realmType) {
			case StatType.Body:
				return 'rgba(255, 100, 100, 0.1)';
			case StatType.Mind:
				return 'rgba(100, 100, 255, 0.1)';
			case StatType.Soul:
				return 'rgba(100, 255, 100, 0.1)';
			default:
				throw new Error(`Unhandled realm type: ${realmType}`);
		}
	};

	// Create the tabbed panel structure
	const createTabPanel = (
		statNodes: StatNode[],
		selectedTab: StatType | null,
		onTabSelect: (tab: StatType | null) => void,
		tabLevel: 'realm' | 'basic',
		backgroundColor?: string,
		children?: React.ReactNode,
	) => {
		const selectedTabIndex = selectedTab ? statNodes.findIndex(t => t.type === selectedTab) : -1;

		return (
			<div style={{ marginBottom: tabLevel === 'realm' ? '12px' : 0 }}>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: '8px',
						position: 'relative',
						zIndex: 2,
					}}
				>
					{statNodes.map(statNode => {
						const isSelected = statNode.type === selectedTab;
						let tabStyle: React.CSSProperties = {};

						if (tabLevel === 'realm') {
							tabStyle = {
								backgroundColor: getRealmBackgroundColor(statNode.type),
								borderBottom: isSelected ? 'none' : '1px solid var(--text)',
								position: 'relative',
								zIndex: isSelected ? 1 : 0,
							};
						} else {
							tabStyle = {
								backgroundColor: 'rgba(255, 255, 255, 0.1)',
								borderBottom: isSelected ? 'none' : '1px solid var(--text)',
								position: 'relative',
								zIndex: isSelected ? 1 : 0,
							};
						}

						return (
							<AttributeBox
								key={statNode.type.name}
								node={statNode}
								isExpanded={isSelected}
								onClick={() => onTabSelect(isSelected ? null : statNode.type)}
								expandable={true}
								style={tabStyle}
								attributeValue={<AttributeValueNode node={statNode} />}
								level={tabLevel}
							/>
						);
					})}
				</div>

				{/* Tab content panel */}
				{selectedTab && (
					<div
						id={`${selectedTab}-content`}
						style={{
							border: '1px solid var(--text)',
							borderTop: selectedTabIndex >= 0 ? 'none' : '1px solid var(--text)',
							borderRadius: '0 0 4px 4px',
							padding: '8px',
							marginTop: '-1px', // Remove the gap between tab and content
							backgroundColor: backgroundColor || 'transparent',
							position: 'relative',
							zIndex: 0,
						}}
					>
						{children}
					</div>
				)}
			</div>
		);
	};

	return (
		<div style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
			{/* Level Section */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '12px',
					padding: '8px',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '4px',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<span style={{ fontWeight: 'bold' }}>Level:</span>
					<AttributeValueNode node={tree.root} />
				</div>
				{editMode && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
								padding: '4px 8px',
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

			{/* Realms Section with Tab Panel */}
			{createTabPanel(
				tree.root.children,
				selectedRealm,
				setSelectedRealm,
				'realm',
				selectedRealm
					? getRealmBackgroundColor(tree.root.children.find(r => r.type === selectedRealm)?.type || StatType.Body)
					: undefined,
				selectedRealm &&
					// Basic Attributes Tab Panel (nested)
					createTabPanel(
						tree.root.children.find(realm => realm.type === selectedRealm)?.children || [],
						selectedBasicAttribute,
						setSelectedBasicAttribute,
						'basic',
						'rgba(255, 255, 255, 0.05)',
						// Skills content
						selectedBasicAttribute && (
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(3, 1fr)',
									gap: '8px',
								}}
							>
								{tree.root.children
									.find(realm => realm.type === selectedRealm)
									?.children.find(attr => attr.type === selectedBasicAttribute)
									?.children.map(skill => (
										<AttributeBox
											key={skill.type.name}
											node={skill}
											style={{
												borderRadius: '4px',
											}}
											attributeValue={<AttributeValueNode node={skill} />}
											level='skill'
										/>
									))}
							</div>
						),
					),
			)}
		</div>
	);
};
