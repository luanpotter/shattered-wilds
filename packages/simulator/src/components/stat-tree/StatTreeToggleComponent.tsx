import React, { ReactNode, useState } from 'react';
import { FaChevronDown, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';

import { StatNode, StatTree, StatType } from '../../types';

import { LevelSection } from './LevelSection';
import { getRealmBackgroundColor, useHandleAllocatePoint, useHandleDeallocatePoint } from './shared-logic';
import { StatValueComponent } from './StatValueComponent';

interface StatTreeToggleComponentProps {
	tree: StatTree;
	onUpdateCharacterProp: (key: string, value: string) => void;
	disabled?: boolean;
	characterId: string;
}

// Reusable component for attribute boxes at any level
interface StatBoxProps {
	node: StatNode;
	isExpanded?: boolean;
	style?: React.CSSProperties;
	onClick?: () => void;
	expandable?: boolean;
	attributeValue: ReactNode;
	level: 'realm' | 'basic' | 'skill';
}

const StatBox: React.FC<StatBoxProps> = ({
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

export const StatTreeToggleComponent: React.FC<StatTreeToggleComponentProps> = ({
	tree,
	onUpdateCharacterProp,
	characterId,
}) => {
	// Initialize state at the top level to fix conditional Hook calls
	const [selectedRealm, setSelectedRealm] = useState<StatType | null>(null);
	const [selectedBasicAttribute, setSelectedBasicAttribute] = useState<StatType | null>(null);

	const onAllocate = useHandleAllocatePoint(onUpdateCharacterProp);
	const onDeallocate = useHandleDeallocatePoint(onUpdateCharacterProp);

	const StatValue = ({ node }: { node: StatNode }) => {
		return (
			<StatValueComponent
				tree={tree}
				node={node}
				canAllocate={node.canAllocatePoint}
				canDeallocate={node.canDeallocatePoint}
				onClick={() => onAllocate(node)}
				onRightClick={() => onDeallocate(node)}
				characterId={characterId}
			/>
		);
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
							<StatBox
								key={statNode.type.name}
								node={statNode}
								isExpanded={isSelected}
								onClick={() => onTabSelect(isSelected ? null : statNode.type)}
								expandable={true}
								style={tabStyle}
								attributeValue={<StatValue node={statNode} />}
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
			<LevelSection
				tree={tree}
				onUpdateCharacterProp={onUpdateCharacterProp}
				attributeValueNode={<StatValue node={tree.root} />}
				variant='default'
			/>

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
										<StatBox
											key={skill.type.name}
											node={skill}
											style={{
												borderRadius: '4px',
											}}
											attributeValue={<StatValue node={skill} />}
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
