import React from 'react';

export const DiamondIcon: React.FC<{ filled: boolean; color: string; size?: number }> = ({
	filled,
	color,
	size = 20,
}) => (
	<svg width={size} height={size} viewBox='0 0 20 20' style={{ display: 'block', transition: 'all 0.2s ease' }}>
		<path
			d='M 10 2 L 18 10 L 10 18 L 2 10 Z'
			fill={filled ? color : 'transparent'}
			stroke='var(--text)'
			strokeWidth='2'
			style={{ transition: 'fill 0.2s ease' }}
		/>
	</svg>
);

interface ResourceDiamondsProps {
	count: number;
	total: number;
	color: string;
	onToggle: (index: number) => void;
}

export const ResourceDiamonds: React.FC<ResourceDiamondsProps> = ({ count, total, color, onToggle }) => {
	return (
		<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
			{Array.from({ length: total }).map((_, idx) => {
				const isFilled = idx < count;
				return (
					<button
						key={idx}
						onClick={() => onToggle(idx)}
						style={{
							width: '20px',
							height: '20px',
							padding: 0,
							border: 'none',
							background: 'none',
							cursor: 'pointer',
							position: 'relative',
						}}
						title={`Toggle ${idx + 1}`}
					>
						<DiamondIcon filled={isFilled} color={color} />
					</button>
				);
			})}
		</div>
	);
};
