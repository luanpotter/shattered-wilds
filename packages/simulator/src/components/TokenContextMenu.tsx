import { Action, CharacterSheet } from '@shattered-wilds/commons';
import React, { useEffect, useState } from 'react';
import { FaBolt, FaFistRaised, FaRuler, FaUser, FaWalking } from 'react-icons/fa';

import { getBasicAttacksFor } from '../types/grid-actions';
import { Character } from '../types/ui';
import { semanticClick } from '../utils';

import { GridActionSelectionData, GridActionTool } from './hex/GridActions';

interface TokenContextMenuProps {
	character: Character;
	position: { x: number; y: number };
	onClose: () => void;
	onAction: (character: Character, action: GridActionSelectionData | undefined) => void;
}

export const TokenContextMenu: React.FC<TokenContextMenuProps> = ({ character, position, onClose, onAction }) => {
	const sheet = CharacterSheet.from(character.props);
	const basicAttacks = getBasicAttacksFor(sheet);

	const menuStyle: React.CSSProperties = {
		position: 'fixed',
		left: position.x,
		top: position.y,
		backgroundColor: 'var(--background)',
		border: '1px solid var(--text)',
		borderRadius: '4px',
		boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
		zIndex: 1000,
		minWidth: '200px',
	};

	const [hoveredItem, setHoveredItem] = useState<string | null>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest('.token-context-menu')) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [onClose]);

	const MenuItem = ({
		icon: Icon,
		title,
		onClick,
	}: {
		icon: React.ComponentType<{ size: number }>;
		title: string;
		onClick: () => void;
	}) => {
		return (
			<BaseMenuItem
				icon={Icon}
				title={title}
				hoveredItem={hoveredItem}
				setHoveredItem={setHoveredItem}
				onClick={onClick}
				onClose={onClose}
			/>
		);
	};

	return (
		<div className='token-context-menu' style={menuStyle} role='menu'>
			<MenuItem
				icon={FaUser}
				title='See Character Sheet'
				onClick={() => onAction(character, { action: GridActionTool.OpenCharacterSheet })}
			/>
			<MenuItem
				icon={FaRuler}
				title='Measure'
				onClick={() => onAction(character, { action: GridActionTool.MeasureDistance })}
			/>
			<MenuItem icon={FaBolt} title='Act' onClick={() => onAction(character, undefined)} />
			<Separator />

			<MenuItem icon={FaWalking} title='Stride' onClick={() => onAction(character, { action: Action.Stride })} />

			{basicAttacks.map((attack, index) => (
				<MenuItem
					key={`attack-${index}`}
					icon={FaFistRaised}
					title={`Attack: ${attack.name}`}
					onClick={() => onAction(character, { action: Action.Strike, selectedWeaponModeIndex: 0 })}
				/>
			))}
		</div>
	);
};

const Separator = () => (
	<div style={{ height: '1px', backgroundColor: 'var(--text)', margin: '4px 0', opacity: 0.3 }} />
);

const BaseMenuItem: React.FC<{
	icon: React.ComponentType<{ size: number }>;
	title: string;
	hoveredItem: string | null;
	setHoveredItem: (item: string | null) => void;
	onClick: () => void;
	onClose: () => void;
}> = ({ icon: Icon, title, hoveredItem, setHoveredItem, onClick, onClose }) => {
	const menuItemStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		padding: '8px 12px',
		cursor: 'pointer',
		userSelect: 'none',
	};

	const menuItemHoverStyle: React.CSSProperties = {
		backgroundColor: 'var(--background-alt)',
	};

	return (
		<div
			style={{
				...menuItemStyle,
				...(hoveredItem === title ? menuItemHoverStyle : {}),
			}}
			onMouseEnter={() => setHoveredItem(title)}
			onMouseLeave={() => setHoveredItem(null)}
			{...semanticClick('menuitem', () => {
				onClick();
				onClose();
			})}
		>
			<Icon size={14} />
			<span>{title}</span>
		</div>
	);
};
