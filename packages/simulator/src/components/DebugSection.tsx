import React from 'react';

import { useStore } from '../store';

import Block from './shared/Block';

interface DebugSectionProps {
	characterId: string;
}

export const DebugSection: React.FC<DebugSectionProps> = ({ characterId }) => {
	const character = useStore(state => state.characters.find(c => c.id === characterId));

	if (!character) {
		return (
			<Block>
				<div style={{ color: 'var(--error-color)', textAlign: 'center', padding: '1rem' }}>Character not found</div>
			</Block>
		);
	}

	const props = character.props || {};
	const propEntries = Object.entries(props).sort(([a], [b]) => a.localeCompare(b));

	return (
		<Block>
			<h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text)' }}>Debug Information</h3>
			<div
				style={{
					maxHeight: '400px',
					overflowY: 'auto',
					border: '1px solid var(--border-color, rgba(0,0,0,0.2))',
					borderRadius: '4px',
					background: 'var(--background-alt, rgba(0,0,0,0.05))',
				}}
			>
				{propEntries.length > 0 ? (
					<ul
						style={{
							listStyle: 'none',
							padding: '0.5rem',
							margin: 0,
							fontFamily: 'monospace',
							fontSize: '0.85em',
						}}
					>
						{propEntries.map(([key, value]) => (
							<li
								key={key}
								style={{
									padding: '0.25rem 0',
									borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.1))',
									wordBreak: 'break-all',
								}}
							>
								<code
									style={{
										color: 'var(--primary-color, #007acc)',
										fontWeight: 'bold',
									}}
								>
									{key}
								</code>
								: {value}
							</li>
						))}
					</ul>
				) : (
					<div
						style={{
							padding: '2rem',
							textAlign: 'center',
							color: 'var(--text-muted, #666)',
							fontStyle: 'italic',
						}}
					>
						No character properties found
					</div>
				)}
			</div>
		</Block>
	);
};
