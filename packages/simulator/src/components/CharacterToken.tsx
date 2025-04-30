import React from 'react';

import { Character, getCharacterInitials } from '../types';

export interface CharacterTokenProps {
	character: Character;
	onClick?: (e: React.MouseEvent) => void;
	onContextMenu?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	isGhost?: boolean;
}

export const CharacterToken: React.FC<CharacterTokenProps> = ({
	character,
	onClick,
	onContextMenu,
	onMouseEnter,
	onMouseLeave,
	isGhost = false,
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
			onContextMenu();
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
			onContextMenu={handleContextMenu}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
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
