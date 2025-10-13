import { StatTree } from '@shattered-wilds/commons';
import React from 'react';
import { FaUndo } from 'react-icons/fa';

import { useModals } from '../../hooks/useModals';
import { useStore } from '../../store';
import { Button } from '../shared/Button';

import { PointAllocationWarning } from './PointAllocationWarning';

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
	const { openConfirmationModal } = useModals();

	const fontSize = variant === 'default' ? '1.2rem' : '1rem';
	const gap = variant === 'default' ? '1rem' : '8px';

	const handleResetAllPoints = async () => {
		const confirmed = await openConfirmationModal({
			title: 'Reset All Points',
			message: 'Are you sure you want to reset all stat points? This will undo all point allocations.',
			confirmText: 'Reset',
		});
		if (confirmed) {
			for (const update of tree.fullReset()) {
				onUpdateCharacterProp(update.key, update.value);
			}
		}
	};

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: variant === 'default' ? '1rem' : '12px',
				backgroundColor: 'var(--background-alt)',
				borderRadius: variant === 'default' ? '8px' : '4px',
				padding: '4px',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap }}>
				<span style={{ fontWeight: 'bold', fontSize }}>Level{variant === 'default' ? ':' : ''}</span>
				{attributeValueNode}
			</div>
			{editMode && (
				<div style={{ display: 'flex', alignItems: 'center', gap }}>
					<PointAllocationWarning node={tree.root} />
					<Button variant='inline' icon={FaUndo} title='Reset all points' onClick={handleResetAllPoints} />
				</div>
			)}
		</div>
	);
};
