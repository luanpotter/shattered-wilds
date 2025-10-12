import React from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';

import { Button } from '../shared/Button';

interface ResourceBarProps {
	label: string;
	current: number;
	max: number;
	color: string;
	onIncrement: () => void;
	onDecrement: () => void;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ label, current, max, color, onIncrement, onDecrement }) => {
	const percentage = max > 0 ? (current / max) * 100 : 0;

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: '1fr auto',
				alignItems: 'center',
				gap: '8px',
				width: '100%',
			}}
		>
			<div
				style={{
					height: '24px',
					backgroundColor: 'var(--background-alt)',
					border: '1px solid var(--text)',
					borderRadius: '4px',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						height: '100%',
						width: `${percentage}%`,
						backgroundColor: color,
						transition: 'width 0.3s ease',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '0.85em',
						fontWeight: 'bold',
						color: 'var(--text)',
						textShadow: '0 0 2px var(--background)',
					}}
				>
					{current}/{max}
				</div>
			</div>
			<div style={{ display: 'flex', gap: '4px' }}>
				<Button variant='inline' onClick={onDecrement} icon={FaMinus} tooltip={`Decrease ${label}`} />
				<Button variant='inline' onClick={onIncrement} icon={FaPlus} tooltip={`Increase ${label}`} />
			</div>
		</div>
	);
};
