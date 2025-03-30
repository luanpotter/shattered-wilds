import React from 'react';

import { Character, getCharacterInitials } from '../types';

export interface CharacterTokenProps {
	character: Character;
	isGhost?: boolean;
	onClick?: (e: React.MouseEvent) => void;
	onContextMenu?: (e: React.MouseEvent) => void;
}

export const CharacterToken: React.FC<CharacterTokenProps> = ({
	character,
	isGhost = false,
	onClick,
	onContextMenu,
}) => {
	const handleMouseDown = (e: React.MouseEvent) => {
		if (onClick && e.button === 0) {
			onClick(e);
		}
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (onContextMenu) {
			onContextMenu(e);
		}
	};

	return (
		<g
			onMouseDown={handleMouseDown}
			onContextMenu={handleContextMenu}
			style={{
				cursor: isGhost ? 'grabbing' : 'grab',
				opacity: isGhost ? 0.7 : 1,
				pointerEvents: isGhost ? 'none' : 'auto',
			}}
		>
			<circle cx='0' cy='0' r='3' fill='var(--primary)' stroke='var(--text)' strokeWidth='0.5' />
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
