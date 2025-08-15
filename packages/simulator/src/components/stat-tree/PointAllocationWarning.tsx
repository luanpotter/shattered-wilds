import { StatNode } from '@shattered-wilds/commons';
import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

import { useStore } from '../../store';

interface PointAllocationWarningProps {
	node: StatNode;
}

export const PointAllocationWarning: React.FC<PointAllocationWarningProps> = ({ node }) => {
	const editMode = useStore(state => state.editMode);
	if (!editMode || !node.childrenHaveUnallocatedPoints) {
		return null;
	}

	const tooltip = node.hasUnallocatedPoints
		? [
				`Contains ${node.unallocatedPoints} unallocated points.`,
				`${node.allocatedPoints} / ${node.allocatablePoints} points allocated.`,
			]
		: [`Children contain unallocated points.`];

	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
			<span style={{ fontWeight: 'bold' }}>
				<FaExclamationTriangle style={{ marginLeft: '6px', color: 'orange' }} title={tooltip.join('\n')} />
			</span>
		</div>
	);
};
