import React from 'react';

import { DerivedStats } from '../types';

interface DerivedStatsDisplayProps {
	stats: DerivedStats;
}

const StatRow: React.FC<{
	label: string;
	current?: number;
	max: number;
	color?: string;
}> = ({ label, current, max, color = 'var(--text)' }) => {
	// For resources with current/max values
	const showBar = current !== undefined;
	const percentage = showBar ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

	return (
		<div style={{ marginBottom: '8px' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '2px',
				}}
			>
				<span style={{ fontWeight: 'bold' }}>{label}</span>
				<span style={{ color }}>{showBar ? `${current}/${max}` : max >= 0 ? `+${max}` : max}</span>
			</div>
			{showBar && (
				<div
					style={{
						width: '100%',
						height: '6px',
						backgroundColor: 'var(--background-alt)',
						borderRadius: '3px',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							width: `${percentage}%`,
							height: '100%',
							backgroundColor: color,
							borderRadius: '3px',
						}}
					/>
				</div>
			)}
		</div>
	);
};

export const DerivedStatsDisplay: React.FC<DerivedStatsDisplayProps> = ({ stats }) => {
	return (
		<div
			style={{
				width: '100%',
				padding: '8px',
				boxSizing: 'border-box',
				backgroundColor: 'var(--background)',
				borderRadius: '4px',
				border: '1px solid var(--text)',
			}}
		>
			<div
				style={{
					padding: '4px 8px',
					backgroundColor: 'var(--background-alt)',
					borderRadius: '4px',
					marginBottom: '8px',
					fontWeight: 'bold',
				}}
			>
				Derived Statistics
			</div>

			{/* Resources Section */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(2, 1fr)',
					gap: '12px',
					marginBottom: '16px',
				}}
			>
				<div>
					{/* Health */}
					<StatRow
						label='Vitality'
						current={stats.currentVitality}
						max={stats.maxVitality}
						color='rgb(220, 50, 50)'
					/>

					{/* Focus */}
					<StatRow
						label='Focus'
						current={stats.currentFocus}
						max={stats.maxFocus}
						color='rgb(50, 50, 220)'
					/>
				</div>
				<div>
					{/* Spirit */}
					<StatRow
						label='Spirit'
						current={stats.currentSpirit}
						max={stats.maxSpirit}
						color='rgb(50, 180, 50)'
					/>

					{/* Heroism */}
					<StatRow
						label='Heroism'
						current={stats.currentHeroism}
						max={stats.maxHeroism}
						color='rgb(220, 180, 50)'
					/>
				</div>
			</div>

			{/* Combat Stats */}
			<div style={{ marginBottom: '8px' }}>
				<div
					style={{
						padding: '4px 8px',
						backgroundColor: 'var(--background-alt)',
						borderRadius: '4px',
						marginBottom: '8px',
						fontWeight: 'bold',
						fontSize: '0.9em',
					}}
				>
					Combat Statistics
				</div>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(2, 1fr)',
						gap: '12px',
					}}
				>
					{/* Initiative */}
					<StatRow label='Initiative' max={stats.initiative} color='rgb(220, 180, 50)' />

					{/* Speed */}
					<StatRow label='Speed' max={stats.speed} color='rgb(50, 180, 220)' />
				</div>
			</div>
		</div>
	);
};
