import React from 'react';

import { Character, getCharacterInitials } from '../types/ui';

export interface CharacterTokenProps {
	character: Character;
	onClick?: (e: React.MouseEvent) => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	isGhost?: boolean;
	interactive?: boolean;
	highlight?: boolean;
}

export const CharacterToken: React.FC<CharacterTokenProps> = ({
	character,
	onClick,
	onMouseEnter,
	onMouseLeave,
	isGhost = false,
	interactive = true,
	highlight = false,
}) => {
	const handleMouseDown = (e: React.MouseEvent) => {
		if (onClick) {
			onClick(e);
		}
	};

	const handleMouseEnter = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onMouseEnter) {
			onMouseEnter();
		}
	};

	const handleMouseLeave = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onMouseLeave) {
			onMouseLeave();
		}
	};

	return (
		<g
			onMouseDown={handleMouseDown}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			style={{
				cursor: isGhost ? 'grabbing' : interactive ? 'grab' : 'default',
				opacity: isGhost ? 0.7 : interactive ? 1 : 0.5,
				pointerEvents: isGhost ? 'none' : 'auto',
			}}
		>
			<circle
				cx='0'
				cy='0'
				r='3'
				fill='var(--primary)'
				stroke={highlight ? 'var(--accent)' : 'var(--text)'}
				strokeWidth={highlight ? 1.1 : 0.5}
				style={highlight ? { filter: 'drop-shadow(0 0 2.5px var(--accent))' } : {}}
			/>
			<text
				x='0'
				y='0.5'
				textAnchor='middle'
				dominantBaseline='middle'
				fill='var(--text)'
				fontSize='3.5'
				style={{
					userSelect: 'none',
					pointerEvents: 'none',
					fontFamily: 'Arial, sans-serif',
					fontWeight: '500',
					letterSpacing: '-0.2px',
				}}
			>
				{getCharacterInitials(character)}
			</text>
		</g>
	);
};
