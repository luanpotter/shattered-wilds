import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

import { useStore } from '../../store';
import { StatNode } from '../../types';

interface PointAllocationWarningProps {
	node: StatNode;
	variant?: 'default' | 'compact';
}

export const PointAllocationWarning: React.FC<PointAllocationWarningProps> = ({ node, variant = 'default' }) => {
	const editMode = useStore(state => state.editMode);
	if (!editMode || !node.childrenHaveUnallocatedPoints) {
		return null;
	}

	const fontSize = variant === 'compact' ? '0.9em' : '1.1em';
	const tooltip = node.hasUnallocatedPoints
		? [
				`Contains ${node.unallocatedPoints} unallocated points.`,
				`${node.allocatedPoints} / ${node.allocatablePoints} points allocated.`,
			]
		: [`Children contain unallocated points.`];

	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
			<span style={{ fontWeight: 'bold', fontSize }}>
				<FaExclamationTriangle style={{ marginLeft: '6px', color: 'orange' }} title={tooltip.join('\n')} />
			</span>
		</div>
	);
};
