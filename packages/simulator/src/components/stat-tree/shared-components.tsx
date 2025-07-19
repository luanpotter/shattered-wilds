import React from 'react';
import { FaUndo, FaExclamationTriangle } from 'react-icons/fa';

import { useStore } from '../../store';
import { StatNode, StatTree } from '../../types';

import { StatValueComponent } from './StatValueComponent';

interface PointsAllocationProps {
	node: StatNode;
	variant?: 'default' | 'compact';
}

export const PointsAllocation: React.FC<PointsAllocationProps> = ({ node, variant = 'default' }) => {
	const editMode = useStore(state => state.editMode);

	if (!editMode) return null;

	const fontSize = variant === 'compact' ? '0.9em' : '1.1em';

	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
			<span style={{ fontWeight: 'bold', fontSize }}>
				{node.unallocatedPoints}/{node.allocatablePoints} points
				{node.hasUnallocatedPoints && (
					<FaExclamationTriangle style={{ marginLeft: '6px', color: 'orange' }} title='You have unallocated points' />
				)}
			</span>
		</div>
	);
};

interface LevelSectionProps {
	tree: StatTree;
	onUpdateCharacterProp: (key: string, value: string) => void;
	attributeValueNode: React.ReactNode;
	variant?: 'default' | 'compact';
}

export const LevelSection: React.FC<LevelSectionProps> = ({
	tree,
	onUpdateCharacterProp,
	attributeValueNode,
	variant = 'default',
}) => {
	const editMode = useStore(state => state.editMode);

	const fontSize = variant === 'compact' ? '1.2rem' : '1rem';
	const padding = variant === 'compact' ? '0.5rem 1rem' : '8px';
	const gap = variant === 'compact' ? '1rem' : '8px';

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: variant === 'compact' ? '1rem' : '12px',
				padding,
				backgroundColor: 'var(--background-alt)',
				borderRadius: variant === 'compact' ? '8px' : '4px',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap }}>
				<span style={{ fontWeight: 'bold', fontSize }}>Level{variant === 'default' ? ':' : ''}</span>
				{attributeValueNode}
			</div>
			{editMode && (
				<div style={{ display: 'flex', alignItems: 'center', gap }}>
					<PointsAllocation node={tree.root} variant={variant === 'compact' ? 'compact' : 'default'} />
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
							padding: variant === 'compact' ? '0.5rem 1rem' : '4px 8px',
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
	);
};

interface StatValueNodeProps {
	node: StatNode;
	tree: StatTree;
	onAllocate: (node: StatNode) => void;
	onDeallocate: (node: StatNode) => void;
	characterId?: string;
	variant?: 'default' | 'text-only';
}

export const StatValueNode: React.FC<StatValueNodeProps> = ({
	node,
	tree,
	onAllocate,
	onDeallocate,
	characterId,
	variant = 'default',
}) => {
	const modifier = tree.getModifier(node.type);
	return (
		<StatValueComponent
			node={node}
			modifier={modifier}
			canAllocate={node.canAllocatePoint}
			canDeallocate={node.canDeallocatePoint}
			onClick={() => onAllocate(node)}
			onRightClick={() => onDeallocate(node)}
			variant={variant}
			{...(characterId && { characterId })}
		/>
	);
};
