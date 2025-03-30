import React, { useState } from 'react';

import { DerivedStats } from '../types';

interface DerivedStatsDisplayProps {
	stats: DerivedStats;
}

// Formula definitions for tooltips
const statFormulas = {
	maxVitality: 'Base (4) + Body Modifier',
	maxFocus: 'Base (4) + Mind Modifier',
	maxSpirit: 'Base (4) + Soul Modifier',
	maxHeroism: 'Level Modifier',
	initiative: 'Awareness Modifier + Agility Modifier',
	speed: 'Base (30) + Agility Modifier + Stamina Modifier',
};

// Define the source of each component for tooltips
const componentSources = {
	baseVitality: 'Base value for all characters',
	bodyModifier: 'Body',
	baseFocus: 'Base value for all characters',
	mindModifier: 'Mind',
	baseSpirit: 'Base value for all characters',
	soulModifier: 'Soul',
	levelModifier: 'Level',
	awarenessModifier: 'Awareness (WIS)',
	agilityModifier: 'Agility (DEX)',
	baseSpeed: 'Base movement for all characters',
	staminaModifier: 'Stamina (CON)',
};

interface StatRowProps {
	label: string;
	current?: number;
	max: number;
	color?: string;
	formula?: string;
	calculation?: React.ReactNode;
}

const StatRow: React.FC<StatRowProps> = ({
	label,
	current,
	max,
	color = 'var(--text)',
	formula,
	calculation,
}) => {
	// For resources with current/max values
	const showBar = current !== undefined;
	const percentage = showBar ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
	const [showFormula, setShowFormula] = useState(false);

	const toggleFormulaDisplay = () => {
		if (formula) {
			setShowFormula(!showFormula);
		}
	};

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
				{formula ? (
					<div
						onClick={toggleFormulaDisplay}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								toggleFormulaDisplay();
							}
						}}
						role='button'
						tabIndex={0}
						style={{
							color,
							cursor: 'pointer',
							position: 'relative',
							display: 'inline-block',
						}}
					>
						{showFormula ? (
							<span className="formula-display" style={{ 
								fontSize: '0.9em',
								padding: '2px 4px',
								backgroundColor: 'var(--background-alt)',
								borderRadius: '3px',
							}}>
								{calculation}
							</span>
						) : (
							<span style={{
								cursor: 'help',
								borderBottom: '1px dotted',
								padding: '0 2px',
							}} title={formula}>{showBar ? `${current}/${max}` : max >= 0 ? `+${max}` : max}</span>
						)}
					</div>
				) : (
					<span style={{ color }}>
						{showBar ? `${current}/${max}` : max >= 0 ? `+${max}` : max}
					</span>
				)}
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
	// Common style for formula components with tooltips
	const tooltipComponentStyle = {
		cursor: 'help',
		borderBottom: '1px dotted',
		padding: '0 2px',
	};

	// Prepare calculation strings for each stat
	const calculations = {
		maxVitality: (
			<>
				<span title={componentSources.baseVitality} style={tooltipComponentStyle}>4</span> + <span title={componentSources.bodyModifier} style={tooltipComponentStyle}>{stats.maxVitality - 4 >= 0 ? stats.maxVitality - 4 : `(${stats.maxVitality - 4})`}</span> = {stats.maxVitality >= 0 ? `+${stats.maxVitality}` : stats.maxVitality}
			</>
		),
		maxFocus: (
			<>
				<span title={componentSources.baseFocus} style={tooltipComponentStyle}>4</span> + <span title={componentSources.mindModifier} style={tooltipComponentStyle}>{stats.maxFocus - 4 >= 0 ? stats.maxFocus - 4 : `(${stats.maxFocus - 4})`}</span> = {stats.maxFocus >= 0 ? `+${stats.maxFocus}` : stats.maxFocus}
			</>
		),
		maxSpirit: (
			<>
				<span title={componentSources.baseSpirit} style={tooltipComponentStyle}>4</span> + <span title={componentSources.soulModifier} style={tooltipComponentStyle}>{stats.maxSpirit - 4 >= 0 ? stats.maxSpirit - 4 : `(${stats.maxSpirit - 4})`}</span> = {stats.maxSpirit >= 0 ? `+${stats.maxSpirit}` : stats.maxSpirit}
			</>
		),
		maxHeroism: (
			<>
				<span title={componentSources.levelModifier} style={tooltipComponentStyle}>{stats.maxHeroism >= 0 ? stats.maxHeroism : `(${stats.maxHeroism})`}</span> = {stats.maxHeroism >= 0 ? `+${stats.maxHeroism}` : stats.maxHeroism}
			</>
		),
		initiative: (
			<>
				<span title={componentSources.awarenessModifier} style={tooltipComponentStyle}>{Math.floor(stats.initiative/2) >= 0 ? Math.floor(stats.initiative/2) : `(${Math.floor(stats.initiative/2)})`}</span> + <span title={componentSources.agilityModifier} style={tooltipComponentStyle}>{stats.initiative - Math.floor(stats.initiative/2) >= 0 ? stats.initiative - Math.floor(stats.initiative/2) : `(${stats.initiative - Math.floor(stats.initiative/2)})`}</span> = {stats.initiative >= 0 ? `+${stats.initiative}` : stats.initiative}
			</>
		),
		speed: (
			<>
				<span title={componentSources.baseSpeed} style={tooltipComponentStyle}>30</span> + <span title={componentSources.agilityModifier} style={tooltipComponentStyle}>{Math.floor((stats.speed - 30)/2) >= 0 ? Math.floor((stats.speed - 30)/2) : `(${Math.floor((stats.speed - 30)/2)})`}</span> + <span title={componentSources.staminaModifier} style={tooltipComponentStyle}>{(stats.speed - 30) - Math.floor((stats.speed - 30)/2) >= 0 ? (stats.speed - 30) - Math.floor((stats.speed - 30)/2) : `(${(stats.speed - 30) - Math.floor((stats.speed - 30)/2)})`}</span> = {stats.speed}
			</>
		),
	};

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
						formula={statFormulas.maxVitality}
						calculation={calculations.maxVitality}
					/>

					{/* Focus */}
					<StatRow
						label='Focus'
						current={stats.currentFocus}
						max={stats.maxFocus}
						color='rgb(50, 50, 220)'
						formula={statFormulas.maxFocus}
						calculation={calculations.maxFocus}
					/>
				</div>
				<div>
					{/* Spirit */}
					<StatRow
						label='Spirit'
						current={stats.currentSpirit}
						max={stats.maxSpirit}
						color='rgb(50, 180, 50)'
						formula={statFormulas.maxSpirit}
						calculation={calculations.maxSpirit}
					/>

					{/* Heroism */}
					<StatRow
						label='Heroism'
						current={stats.currentHeroism}
						max={stats.maxHeroism}
						color='rgb(220, 180, 50)'
						formula={statFormulas.maxHeroism}
						calculation={calculations.maxHeroism}
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
					<StatRow
						label='Initiative'
						max={stats.initiative}
						color='rgb(220, 180, 50)'
						formula={statFormulas.initiative}
						calculation={calculations.initiative}
					/>

					{/* Speed */}
					<StatRow
						label='Speed'
						max={stats.speed}
						color='rgb(50, 180, 220)'
						formula={statFormulas.speed}
						calculation={calculations.speed}
					/>
				</div>
			</div>
		</div>
	);
};
