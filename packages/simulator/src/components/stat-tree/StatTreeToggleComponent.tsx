import React, { ReactNode, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

import { StatHierarchy, StatNode, StatTree, StatType } from '../../types';

import { LevelSection } from './LevelSection';
import { PointAllocationWarning } from './PointAllocationWarning';
import { getRealmBackgroundColor } from './shared-logic';
import { StatValueComponent } from './StatValueComponent';

interface StatTreeToggleComponentProps {
	tree: StatTree;
	onUpdateCharacterProp: (key: string, value: string) => void;
	disabled?: boolean;
	characterId: string;
}

interface StatBoxProps {
	node: StatNode;
	isExpanded?: boolean;
	style?: React.CSSProperties;
	onClick?: () => void;
	expandable?: boolean;
	children: ReactNode;
}

const StatBox: React.FC<StatBoxProps> = ({
	node,
	isExpanded = false,
	style = {},
	onClick,
	expandable = false,
	children,
}) => {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && onClick) {
			onClick();
		}
	};

	const isSkill = node.type.hierarchy === StatHierarchy.Skill;
	const baseStyle: React.CSSProperties = {
		padding: '8px',
		border: '1px solid var(--text)',
		borderRadius: isExpanded ? '4px 4px 0 0' : '4px',
		cursor: expandable ? 'pointer' : 'default',
		backgroundColor: isSkill ? 'rgba(255, 255, 255, 0.1)' : undefined,
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
					<span style={{ fontWeight: isSkill ? 'normal' : 'bold' }}>{node.type.name}</span>
					<PointAllocationWarning node={node} />
				</div>
				{children}
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
	const [selectedRealm, setSelectedRealm] = useState<StatType | null>(null);
	const [selectedBasicAttribute, setSelectedBasicAttribute] = useState<StatType | null>(null);

	const StatValue = ({ node }: { node: StatNode }) => {
		return (
			<StatValueComponent
				tree={tree}
				node={node}
				onUpdateCharacterProp={onUpdateCharacterProp}
				characterId={characterId}
			/>
		);
	};

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
						const tabStyle = {
							backgroundColor:
								tabLevel === 'realm' ? getRealmBackgroundColor(statNode.type) : 'rgba(255, 255, 255, 0.1)',
							borderBottom: isSelected ? 'none' : '1px solid var(--text)',
							position: 'relative' as const,
							zIndex: isSelected ? 1 : 0,
						};

						return (
							<StatBox
								key={statNode.type.name}
								node={statNode}
								isExpanded={isSelected}
								onClick={() => onTabSelect(isSelected ? null : statNode.type)}
								expandable={true}
								style={tabStyle}
							>
								<StatValue node={statNode} />
							</StatBox>
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

	const rootNode = tree.root;
	const realmNode = selectedRealm ? tree.getNode(selectedRealm) : null;
	const basicAttributeNode = selectedBasicAttribute ? tree.getNode(selectedBasicAttribute) : null;
	return (
		<div style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
			{/* Level Section */}
			<LevelSection
				tree={tree}
				onUpdateCharacterProp={onUpdateCharacterProp}
				attributeValueNode={<StatValue node={rootNode} />}
				variant='default'
			/>

			{/* Realms Section with Tab Panel */}
			{createTabPanel(
				rootNode.children,
				selectedRealm,
				realm => {
					setSelectedRealm(realm);
					setSelectedBasicAttribute(null);
				},
				'realm',
				selectedRealm ? getRealmBackgroundColor(selectedRealm) : undefined,
				selectedRealm &&
					// Basic Attributes Tab Panel (nested)
					createTabPanel(
						realmNode?.children || [],
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
								{basicAttributeNode?.children.map(skill => (
									<StatBox
										key={skill.type.name}
										node={skill}
										style={{
											borderRadius: '4px',
										}}
									>
										<StatValue node={skill} />
									</StatBox>
								))}
							</div>
						),
					),
			)}
		</div>
	);
};
