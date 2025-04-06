import React, { useState, ReactNode } from 'react';
import { FaUndo, FaExclamationTriangle, FaChevronDown, FaChevronRight } from 'react-icons/fa';

import { Attribute, AttributeType } from '../types';

interface AttributeTreeComponentProps {
	tree: Attribute;
	onUpdateCharacterProp: (key: string, value: string) => void;
}

// Value display with a colored background based on the value
const AttributeValue: React.FC<{
	baseValue: number;
	finalModifier: number;
	level: number;
	onClick?: () => void;
	onRightClick?: () => void;
	canAllocate?: boolean;
	canDeallocate?: boolean;
}> = ({
	baseValue,
	finalModifier,
	level,
	onClick,
	onRightClick,
	canAllocate = false,
	canDeallocate = false,
}) => {
	const handleContextMenu = (e: React.MouseEvent) => {
		// Always prevent default context menu
		e.preventDefault();
		if (canDeallocate && onRightClick) {
			onRightClick();
		}
	};

	const handleClick = (e: React.MouseEvent) => {
		// Prevent click from reaching parent elements
		e.stopPropagation();
		if (canAllocate && onClick) {
			onClick();
		}
	};

	const isCapped = finalModifier > level;
	const displayModifier = isCapped ? level : finalModifier;

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
					backgroundColor: canAllocate || canDeallocate ? 'var(--background-alt)' : 'transparent',
					border: '1px solid var(--text)',
					cursor: canAllocate || canDeallocate ? 'pointer' : 'default',
					fontSize: '0.9em',
					fontWeight: 'bold',
				}}
				onClick={handleClick}
				onContextMenu={handleContextMenu}
				onKeyDown={canAllocate ? e => e.key === 'Enter' && onClick?.() : undefined}
				tabIndex={canAllocate ? 0 : undefined}
				role={canAllocate ? 'button' : undefined}
				aria-label={
					canAllocate ? `Allocate point to attribute (current value: ${baseValue})` : undefined
				}
			>
				{baseValue}
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
					fontWeight: displayModifier >= 0 ? 'bold' : 'normal',
					position: 'relative',
				}}
			>
				{displayModifier >= 0 ? `+${displayModifier}` : displayModifier}
				{isCapped && (
					<FaExclamationTriangle
						style={{
							position: 'absolute',
							bottom: '-2px',
							right: '-2px',
							width: '10px',
							height: '10px',
							color: 'orange',
							cursor: 'default',
						}}
						title={`Actual modifier: +${finalModifier} (capped to +${level} due to level)`}
					/>
				)}
			</div>
		</div>
	);
};

// Reusable component for attribute boxes at any level
interface AttributeBoxProps {
	attribute: Attribute;
	isExpanded?: boolean;
	style?: React.CSSProperties;
	onClick?: () => void;
	expandable?: boolean;
	attributeValue: ReactNode;
	level: 'realm' | 'basic' | 'skill';
}

const AttributeBox: React.FC<AttributeBoxProps> = ({
	attribute,
	isExpanded = false,
	style = {},
	onClick,
	expandable = false,
	attributeValue,
	level,
}) => {
	const hasUnallocated = attribute.hasUnallocatedPoints?.();

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
	};

	return (
		<div
			style={{ ...baseStyle, ...style }}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={expandable ? 0 : undefined}
			role={expandable ? 'button' : undefined}
			aria-expanded={expandable ? isExpanded : undefined}
			aria-controls={expandable && isExpanded ? `${attribute.type.name}-content` : undefined}
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
					<span style={{ fontWeight: level !== 'skill' ? 'bold' : 'normal' }}>
						{attribute.type.name}
					</span>
					{hasUnallocated && (
						<FaExclamationTriangle
							style={{ color: 'orange', marginLeft: '4px' }}
							title='Contains unallocated points'
						/>
					)}
				</div>
				{attributeValue}
			</div>
			<div style={{ fontSize: '0.8em', opacity: 0.8 }}>{attribute.type.description}</div>
		</div>
	);
};

export const AttributeTreeComponent: React.FC<AttributeTreeComponentProps> = ({
	tree,
	onUpdateCharacterProp,
}) => {
	// Initialize state at the top level to fix conditional Hook calls
	const [selectedRealm, setSelectedRealm] = useState<string | null>(null);
	const [selectedBasicAttribute, setSelectedBasicAttribute] = useState<string | null>(null);

	if (!tree.grouped) {
		return <div>Loading...</div>;
	}

	const canAllocatePoint = (node: Attribute) => {
		const parent = tree.getNode(node.type.parent);
		return parent?.canChildrenAllocatePoint ?? true;
	};

	const handleAllocatePoint = (node: Attribute) => {
		if (canAllocatePoint(node)) {
			onUpdateCharacterProp(node.type.name, (node.baseValue + 1).toString());
		}
	};

	const handleDeallocatePoint = (node: Attribute) => {
		if (node.canDeallocatePoint) {
			onUpdateCharacterProp(node.type.name, (node.baseValue - 1).toString());
		}
	};

	const PointsAllocation: React.FC<{ node: Attribute }> = ({ node }) => {
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
				<span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
					{node.childrenAllocatedPoints}/{node.totalPointsToPropagate} points
					{node.childrenAllocatedPoints < node.totalPointsToPropagate &&
						node.totalPointsToPropagate > 0 && (
							<FaExclamationTriangle
								style={{ marginLeft: '6px', color: 'orange' }}
								title='You have unallocated points'
							/>
						)}
				</span>
			</div>
		);
	};

	const AttributeValueNode = ({ node }: { node: Attribute }) => {
		const modifier = tree.modifierOf(node);
		const level = tree.baseValue; // Get level from root node
		return (
			<AttributeValue
				baseValue={node.baseValue}
				finalModifier={modifier}
				level={level}
				canAllocate={canAllocatePoint(node)}
				canDeallocate={node.canDeallocatePoint}
				onClick={() => handleAllocatePoint(node)}
				onRightClick={() => handleDeallocatePoint(node)}
			/>
		);
	};

	// Get the background color for a realm
	const getRealmBackgroundColor = (realmType: AttributeType) => {
		return realmType === AttributeType.Body
			? 'rgba(255, 100, 100, 0.1)'
			: realmType === AttributeType.Mind
				? 'rgba(100, 100, 255, 0.1)'
				: 'rgba(100, 255, 100, 0.1)';
	};

	// Create the tabbed panel structure
	const createTabPanel = (
		tabs: Attribute[],
		selectedTab: string | null,
		onTabSelect: (tab: string | null) => void,
		tabLevel: 'realm' | 'basic',
		backgroundColor?: string,
		children?: React.ReactNode
	) => {
		const selectedTabIndex = selectedTab ? tabs.findIndex(t => t.type.name === selectedTab) : -1;
		
		return (
			<div style={{ marginBottom: tabLevel === 'realm' ? '12px' : 0 }}>
				{/* Tab headers row */}
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: '8px',
						position: 'relative',
						zIndex: 2,
					}}
				>
					{tabs.map(tab => {
						const isSelected = tab.type.name === selectedTab;
						let tabStyle: React.CSSProperties = {};
						
						if (tabLevel === 'realm') {
							tabStyle = {
								backgroundColor: getRealmBackgroundColor(tab.type),
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
								key={tab.type.name}
								attribute={tab}
								isExpanded={isSelected}
								onClick={() => onTabSelect(isSelected ? null : tab.type.name)}
								expandable={true}
								style={tabStyle}
								attributeValue={<AttributeValueNode node={tab} />}
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
					<AttributeValueNode node={tree} />
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<PointsAllocation node={tree} />
					<button
						onClick={() => {
							const updates = tree.children.flatMap(child => child.reset());
							for (const update of updates) {
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
			</div>

			{/* Realms Section with Tab Panel */}
			{createTabPanel(
				tree.children,
				selectedRealm,
				setSelectedRealm,
				'realm',
				selectedRealm
					? getRealmBackgroundColor(
							tree.children.find(r => r.type.name === selectedRealm)?.type || AttributeType.Body
					  )
					: undefined,
				selectedRealm && (
					// Basic Attributes Tab Panel (nested)
					createTabPanel(
						tree.children.find(realm => realm.type.name === selectedRealm)?.children || [],
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
								{tree.children
									.find(realm => realm.type.name === selectedRealm)
									?.children.find(attr => attr.type.name === selectedBasicAttribute)
									?.children.map(skill => (
										<AttributeBox
											key={skill.type.name}
											attribute={skill}
											style={{
												borderRadius: '4px',
											}}
											attributeValue={<AttributeValueNode node={skill} />}
											level='skill'
										/>
									))}
							</div>
						)
					)
				)
			)}
		</div>
	);
};
