import React from 'react';
import { FaUndo } from 'react-icons/fa';

import { useStore } from '../../store';
import { StatTree } from '../../types';

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
					<PointAllocationWarning node={tree.root} />
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
